import unittest
from app import app, db
from models import Payment
import json

class SecurityTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
        # Mock TEST_MODE to True to test logic that would happen in production or test environment
        import app as app_module
        app_module.TEST_MODE = True
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_amount_manipulation_is_ignored(self):
        # Malicious user tries to pay 100 kobo (1 NGN) instead of 500,000 kobo (5000 NGN)
        # We send an amount, but the server should ignore it and use 500,000
        response = self.client.post('/initialize-payment',
                                    data=json.dumps({'email': 'attacker@example.com', 'amount': 100}),
                                    content_type='application/json')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['status'])

        # Check database - amount should be 5000.0 (500,000 kobo / 100)
        with app.app_context():
            payment = Payment.query.filter_by(email='attacker@example.com').first()
            self.assertIsNotNone(payment)
            self.assertEqual(payment.amount, 5000.0)

    def test_contact_form_length_validation(self):
        # Test name too long
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 'a' * 101, 'email': 'test@example.com', 'message': 'hello'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Input exceeds maximum allowed length", json.loads(response.data)['status'])

        # Test email too long
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 'test', 'email': 'a' * 121 + '@example.com', 'message': 'hello'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)

        # Test message too long
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 'test', 'email': 'test@example.com', 'message': 'a' * 1001}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_contact_form_malformed_json(self):
        # Test with a list instead of a dict
        response = self.client.post('/contact',
                                    data=json.dumps([1, 2, 3]),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid request format", json.loads(response.data)['status'])

        # Test with incorrect data types (integer instead of string)
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 123, 'email': 'test@example.com', 'message': 'hello'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid field types", json.loads(response.data)['status'])

    def test_initialize_payment_malformed_json(self):
        # Test with a list instead of a dict
        response = self.client.post('/initialize-payment',
                                    data=json.dumps([]),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid request format", json.loads(response.data)['message'])

        # Test with incorrect email type
        response = self.client.post('/initialize-payment',
                                    data=json.dumps({'email': 123}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Valid email is required", json.loads(response.data)['message'])

    def test_login_length_validation_username(self):
        # Test username too long (> 80)
        response = self.client.post('/login',
                                    data={'username': 'a' * 81, 'password': 'password'},
                                    follow_redirects=True)
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Invalid input", response.data)

    def test_login_length_validation_password(self):
        # Test password too long (> 256)
        response = self.client.post('/login',
                                    data={'username': 'admin', 'password': 'a' * 257},
                                    follow_redirects=True)
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Invalid input", response.data)

    def test_login_valid_input(self):
        # Test valid input (should not return 400, even if login fails)
        response = self.client.post('/login',
                                    data={'username': 'admin', 'password': 'password'},
                                    follow_redirects=True)
        self.assertNotEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
