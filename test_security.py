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

if __name__ == '__main__':
    unittest.main()
