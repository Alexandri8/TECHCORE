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

    def test_robust_json_validation(self):
        # 1. Missing JSON body
        response = self.client.post('/contact', data="not json", content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid request format", json.loads(response.data)['status'])

        # 2. JSON body that is not a dictionary
        response = self.client.post('/contact', data=json.dumps(["name", "email", "message"]), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid request format", json.loads(response.data)['status'])

        # 3. Missing required fields
        response = self.client.post('/contact', data=json.dumps({'name': 'test'}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing or invalid required fields", json.loads(response.data)['status'])

        # 4. Required fields with incorrect types
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 'test', 'email': 123, 'message': 'hello'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing or invalid required fields", json.loads(response.data)['status'])

        # 5. Empty string values
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 'test', 'email': '  ', 'message': 'hello'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing or invalid required fields", json.loads(response.data)['status'])

        # Same for /initialize-payment
        response = self.client.post('/initialize-payment', data=json.dumps({'email': 123}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(json.loads(response.data)['status'])

if __name__ == '__main__':
    unittest.main()
