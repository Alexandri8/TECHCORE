import os
from app import app

client = app.test_client()
response = client.get('/static/style.css', headers={'Accept-Encoding': 'gzip'})
print(f"Content-Encoding: {response.headers.get('Content-Encoding')}")
print(f"Content-Length: {response.headers.get('Content-Length')}")
