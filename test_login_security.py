import unittest
import os

# Set TESTING to true to avoid side effects in app.py
os.environ['TESTING'] = 'true'

from app import app, db
from models import User

class LoginSecurityTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()
        with app.app_context():
            db.create_all()
            # Create a test user
            user = User(username='admin')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_login_username_too_long(self):
        response = self.client.post('/login', data={
            'username': 'a' * 81,
            'password': 'password123'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid input', response.data)

    def test_login_password_too_long(self):
        response = self.client.post('/login', data={
            'username': 'admin',
            'password': 'p' * 257
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid input', response.data)

    def test_login_success(self):
        response = self.client.post('/login', data={
            'username': 'admin',
            'password': 'password123'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Contact Messages', response.data) # Dashboard title

    def test_login_invalid_credentials(self):
        response = self.client.post('/login', data={
            'username': 'admin',
            'password': 'wrongpassword'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid username or password', response.data)

if __name__ == '__main__':
    unittest.main()
