import requests

def check_compression(url):
    headers = {'Accept-Encoding': 'gzip'}
    r = requests.get(url, headers=headers)
    print(f"URL: {url}")
    print(f"Status: {r.status_code}")
    print(f"Content-Encoding: {r.headers.get('Content-Encoding')}")
    print(f"Content-Length: {r.headers.get('Content-Length')}")
    print(f"Original length (approx): {len(r.content)}")

if __name__ == "__main__":
    # Start the app in background
    import subprocess
    import time
    import os

    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_DEBUG'] = 'False'
    process = subprocess.Popen(['flask', 'run', '--port=5001'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Wait for app to start

    try:
        check_compression('http://127.0.0.1:5001/')
        check_compression('http://127.0.0.1:5001/static/style.css')
        check_compression('http://127.0.0.1:5001/static/script.js')
    finally:
        process.terminate()
