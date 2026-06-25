from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from models import db, ContactMessage, User, Payment
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_wtf.csrf import CSRFProtect
import os
import requests
import uuid
import gzip
from io import BytesIO
from sqlalchemy import event
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Optimization: Global session for connection pooling
paystack_session = requests.Session()

app = Flask(__name__)
# Security: Use environment variable for secret key, fallback to random key
app.secret_key = os.getenv('SECRET_KEY', os.urandom(24).hex())

# CSRF Protection
csrf = CSRFProtect(app)

# Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
# Security: TEST_MODE should be False by default in production
TEST_MODE = os.getenv('TEST_MODE', 'False').lower() == 'true'

# Performance: Use a global session for Paystack API to enable connection pooling
# This reduces latency by avoiding repeated TCP/TLS handshakes
paystack_session = requests.Session()

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
# Security: Allow DATABASE_URL from environment variable
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(basedir, 'instance', 'database.db'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Security: Limit request size to 1MB
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024
# Security: Harden session cookies
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'

db.init_app(app)

# Optimization: Enable WAL mode and NORMAL synchronous for SQLite to improve concurrency and performance
with app.app_context():
    @event.listens_for(db.engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if app.config['SQLALCHEMY_DATABASE_URI'].startswith("sqlite"):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            # Optimization: Use NORMAL synchronous mode in WAL mode for significantly faster writes
            # while still maintaining data integrity against application crashes.
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()

# Login Manager Configuration
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables and default admin securely
with app.app_context():
    if not os.path.exists(os.path.join(basedir, 'instance')):
        os.makedirs(os.path.join(basedir, 'instance'))
    db.create_all()
    
    # Securely create admin user using environment variables
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD')
    
    if admin_password and not User.query.filter_by(username=admin_username).first():
        admin = User(username=admin_username)
        admin.set_password(admin_password)
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user '{admin_username}' created successfully.")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin'))
    
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('admin'))
        else:
            flash("Invalid username or password")
            
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route("/admin")
@login_required
def admin():
    # Optimization: Added pagination to avoid loading all records at once
    message_page = request.args.get('message_page', 1, type=int)
    payment_page = request.args.get('payment_page', 1, type=int)
    per_page = 10

    messages = ContactMessage.query.order_by(ContactMessage.timestamp.desc()).paginate(
        page=message_page, per_page=per_page, error_out=False
    )
    payments = Payment.query.order_by(Payment.timestamp.desc()).paginate(
        page=payment_page, per_page=per_page, error_out=False
    )
    return render_template("admin.html", messages=messages, payments=payments)

@app.route("/contact", methods=["POST"])
def contact():
    data = request.json
    # Security: Validate request is a dictionary to prevent DoS/500 errors
    if not isinstance(data, dict):
        return jsonify({"status": "Invalid request format"}), 400

    name = data.get("name")
    email = data.get("email")
    message = data.get("message")

    # Security: Validate types and presence of required fields
    if not all(isinstance(f, str) for f in [name, email, message]):
        return jsonify({"status": "Invalid field types"}), 400

    if not name.strip() or not email.strip() or not message.strip():
        return jsonify({"status": "Missing or empty required fields"}), 400

    # Security: Server-side length validation
    if len(name) > 100 or len(email) > 120 or len(message) > 1000:
        return jsonify({"status": "Input exceeds maximum allowed length"}), 400

    try:
        new_message = ContactMessage(name=name, email=email, message=message)
        db.session.add(new_message)
        db.session.commit()
        return jsonify({"status": "Message received successfully!"})
    except Exception as e:
        app.logger.error(f"Error saving message: {e}")
        return jsonify({"status": "Error saving message"}), 500

# Paystack Integration
@app.route("/initialize-payment", methods=["POST"])
def initialize_payment():
    data = request.json
    # Security: Validate request is a dictionary to prevent DoS/500 errors
    if not isinstance(data, dict):
        return jsonify({"status": False, "message": "Invalid request format."}), 400

    email = data.get("email")

    # Security: Validate types and presence of required fields
    if not isinstance(email, str) or not email.strip():
        return jsonify({"status": False, "message": "Valid email is required."}), 400
    
    # Security: Hardcode amount server-side to prevent client-side manipulation
    # ₦5,000 = 500,000 Kobo
    amount = 500000

    if not email:
        return jsonify({"status": False, "message": "Email is required."}), 400

    # Generate unique reference
    reference = str(uuid.uuid4())
    
    # TEST MODE BYPASS: Security Warning - Should only be used for local testing
    if TEST_MODE:
        new_payment = Payment(email=email, amount=float(amount)/100, reference=reference)
        db.session.add(new_payment)
        db.session.commit()
        return jsonify({
            "status": True,
            "data": {
                "authorization_url": url_for('verify_payment', reference=reference, _external=True),
                "reference": reference
            }
        })

    if not PAYSTACK_SECRET_KEY:
        return jsonify({
            "status": False, 
            "message": "Payment system is not fully configured."
        }), 500

    payload = {
        "email": email,
        "amount": amount,
        "reference": reference,
        "callback_url": url_for('verify_payment', _external=True)
    }
    
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Optimization: Use global session for connection pooling
        # Security: Add timeout to prevent worker exhaustion
        # Optimization: Use global session for connection pooling and added timeout to prevent hanging
        response = paystack_session.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers, timeout=10)
        res_data = response.json()
        
        if res_data.get("status"):
            new_payment = Payment(email=email, amount=float(amount)/100, reference=reference)
            db.session.add(new_payment)
            db.session.commit()
            return jsonify(res_data)
        else:
            return jsonify({"status": False, "message": res_data.get("message")}), 400
    except Exception as e:
        app.logger.error(f"Payment Initialization Error: {e}")
        return jsonify({"status": False, "message": "Internal server error"}), 500

@app.route("/verify-payment")
def verify_payment():
    reference = request.args.get("reference")
    # Optimization: Early return if reference is missing
    if not reference:
        return redirect(url_for('home'))
        
    payment = Payment.query.filter_by(reference=reference).first()

    # Optimization: Early return if payment not found or already successful
    if not payment:
        return redirect(url_for('home'))

    if payment.status == "success":
        return render_template("index.html", payment_status="success")

    if TEST_MODE:
        if payment:
            payment.status = "success"
            db.session.commit()
        return render_template("index.html", payment_status="success")
    
    if not PAYSTACK_SECRET_KEY:
        return render_template("index.html", payment_status="failed")

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
    }
    
    try:
        # Optimization: Use global session for connection pooling
        # Security: Add timeout to prevent worker exhaustion
        # Optimization: Use global session for connection pooling and added timeout to prevent hanging
        response = paystack_session.get(f"https://api.paystack.co/transaction/verify/{reference}", headers=headers, timeout=10)
        res_data = response.json()
        
        if res_data.get("status") and res_data["data"]["status"] == "success":
            if payment:
                payment.status = "success"
                db.session.commit()
            return render_template("index.html", payment_status="success")
    except Exception as e:
        app.logger.error(f"Payment Verification Error: {e}")

    if payment:
        payment.status = "failed"
        db.session.commit()
    return render_template("index.html", payment_status="failed")

@app.after_request
def add_headers(response):
    """Add security headers and implement dynamic Gzip compression."""
    # 1. Security Headers
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Security: HSTS (Strict-Transport-Security)
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # Content Security Policy: default-src 'self' allows only our own domain
    # style-src and font-src allow external resources from trusted domains (Google Fonts, Font Awesome)
    # frame-ancestors 'none' prevents the site from being embedded in iframes
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; "
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; "
        "img-src 'self' data:; "
        "frame-ancestors 'none'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )

    # 2. Dynamic Gzip Compression
    # Optimization: Reduces payload size by up to 70-80% for text-based assets
    accept_encoding = request.headers.get('Accept-Encoding', '').lower()

    if (
        'gzip' in accept_encoding and
        response.status_code == 200 and
        not response.direct_passthrough and
        'Content-Encoding' not in response.headers
    ):
        # Targeting common text-based mimetypes
        if response.mimetype in [
            'text/html', 'text/css', 'application/javascript',
            'application/json', 'text/javascript', 'image/svg+xml'
        ]:
            response_data = response.get_data()

            # Only compress if the response is reasonably large
            if len(response_data) > 500:
                gzip_buffer = BytesIO()
                with gzip.GzipFile(mode='wb', fileobj=gzip_buffer) as gzip_file:
                    gzip_file.write(response_data)

                compressed_data = gzip_buffer.getvalue()

                # Check if compression actually saved space
                if len(compressed_data) < len(response_data):
                    response.set_data(compressed_data)
                    response.headers['Content-Encoding'] = 'gzip'
                    response.headers['Content-Length'] = len(compressed_data)
                    # Use vary.add to safely append to existing Vary headers
                    response.vary.add('Accept-Encoding')

    return response

if __name__ == "__main__":
    # Security: Debug mode is controlled by environment variable
    app.run(debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')
