import os
os.environ['TESTING'] = 'true'
import unittest
from app import app

class SecurityHeadersTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_security_headers_present(self):
        """Test that security headers are correctly added to the response"""
        response = self.client.get('/')

        self.assertEqual(response.headers.get('X-Frame-Options'), 'SAMEORIGIN')
        self.assertEqual(response.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
        self.assertEqual(response.headers.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()')

        csp = response.headers.get('Content-Security-Policy')
        self.assertIn("default-src 'self'", csp)
        self.assertIn("script-src 'self'", csp)
        self.assertNotIn("'unsafe-inline'", csp.split(';')[1]) # Should not be in script-src
        self.assertIn("https://fonts.googleapis.com", csp)
        self.assertIn("https://cdnjs.cloudflare.com", csp)
        self.assertIn("object-src 'none'", csp)
        self.assertIn("base-uri 'self'", csp)
        self.assertIn("form-action 'self'", csp)

    def test_admin_cache_control(self):
        """Test that admin routes have strict cache control"""
        # Note: In this app, these headers are currently set directly in the /admin route,
        # so they only appear for authenticated requests that hit the route logic.
        # This test would fail if not logged in.
        from models import User, db
        with app.app_context():
            db.create_all()
            if not User.query.filter_by(username='testadmin').first():
                user = User(username='testadmin')
                user.set_password('password')
                db.session.add(user)
                db.session.commit()

        with self.client:
            self.client.post('/login', data={'username': 'testadmin', 'password': 'password'})
            response = self.client.get('/admin')
            self.assertEqual(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, max-age=0')
            self.assertEqual(response.headers.get('Pragma'), 'no-cache')

    def test_non_admin_cache_control(self):
        """Test that non-admin routes do NOT have strict cache control by default"""
        response = self.client.get('/')
        self.assertNotEqual(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, max-age=0')

if __name__ == '__main__':
    unittest.main()
