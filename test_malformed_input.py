import unittest
import json
from app import app, db

class MalformedJsonTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def test_contact_non_dict_json(self):
        # Sending a list instead of a dict
        response = self.client.post('/contact',
                                    data=json.dumps(["not", "a", "dict"]),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.data)['status'], "Invalid request format")

    def test_contact_missing_json(self):
        response = self.client.post('/contact',
                                    data="not json",
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_contact_invalid_types(self):
        # Sending an int for name
        response = self.client.post('/contact',
                                    data=json.dumps({'name': 123, 'email': 'test@example.com', 'message': 'hello'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.data)['status'], "Missing or invalid required fields")

    def test_initialize_payment_non_dict_json(self):
        response = self.client.post('/initialize-payment',
                                    data=json.dumps(["not", "a", "dict"]),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.data)['message'], "Invalid request format.")

if __name__ == '__main__':
    unittest.main()
