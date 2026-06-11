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

        csp = response.headers.get('Content-Security-Policy')
        self.assertIn("default-src 'self'", csp)
        self.assertIn("script-src 'self' 'unsafe-inline'", csp)
        self.assertIn("https://fonts.googleapis.com", csp)
        self.assertIn("https://cdnjs.cloudflare.com", csp)

if __name__ == '__main__':
    unittest.main()
