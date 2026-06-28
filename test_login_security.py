import unittest
import os

# Set TESTING to true before importing app
os.environ['TESTING'] = 'true'

from app import app, db
from models import User
from werkzeug.security import generate_password_hash

class LoginSecurityTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_login_length_validation_username(self):
        # Username too long (> 80)
        response = self.client.post('/login', data={
            'username': 'a' * 81,
            'password': 'password123'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Input exceeds maximum allowed length", response.data)

    def test_login_length_validation_password(self):
        # Password too long (> 256)
        response = self.client.post('/login', data={
            'username': 'admin',
            'password': 'p' * 257
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Input exceeds maximum allowed length", response.data)

    def test_password_hash_length(self):
        # Verify that we can store a long hash
        with app.app_context():
            long_password = "very_long_password_to_generate_a_long_hash"
            # Modern hashes like scrypt can be ~162 chars
            hashed_pw = generate_password_hash(long_password)

            user = User(username='testuser', password_hash=hashed_pw)
            db.session.add(user)
            db.session.commit()

            # Retrieve and check
            retrieved_user = User.query.filter_by(username='testuser').first()
            self.assertEqual(retrieved_user.password_hash, hashed_pw)
            self.assertGreater(len(retrieved_user.password_hash), 100) # Ensure it's not a tiny hash

if __name__ == '__main__':
    unittest.main()
