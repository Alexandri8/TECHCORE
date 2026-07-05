import os
os.environ['TESTING'] = 'true'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
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
        # We need to be logged in to access /admin, but the header is added in after_request
        # which runs even if the route returns 302 or 401/403.
        response = self.client.get('/admin')
        self.assertEqual(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, max-age=0')
        self.assertEqual(response.headers.get('Pragma'), 'no-cache')

    def test_non_admin_cache_control(self):
        """Test that non-admin routes do NOT have strict cache control by default"""
        response = self.client.get('/')
        self.assertNotEqual(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, max-age=0')

if __name__ == '__main__':
    unittest.main()
