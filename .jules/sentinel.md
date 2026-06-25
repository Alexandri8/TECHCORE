## 2025-05-22 - Client-Side Price Manipulation in Payment Initialization
**Vulnerability:** The application trusted the payment amount sent by the client in the `/initialize-payment` request, allowing attackers to modify the price.
**Learning:** Even if the frontend UI displays a fixed price, the backend must always validate or strictly define the expected amount from a trusted source (database or hardcoded config) before processing payments.
**Prevention:** Never trust sensitive transaction data provided by the client. Hardcode prices server-side for single-item checkouts or look up prices from a secure database based on a product ID.

## 2026-06-11 - Lack of HTTP Security Headers
**Vulnerability:** The application was missing critical HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and CSP), leaving it vulnerable to Clickjacking and MIME-sniffing.
**Learning:** Modern web applications should implement defense-in-depth by default. Flask doesn't add these headers automatically.
**Prevention:** Use an `@app.after_request` decorator to consistently apply security headers across all responses.

## 2026-06-25 - Content Security Policy Hardening (Eliminating 'unsafe-inline')
**Vulnerability:** Use of `'unsafe-inline'` in the `script-src` directive of the Content Security Policy (CSP) weakens the protection against Cross-Site Scripting (XSS).
**Learning:** To remove `'unsafe-inline'`, all inline JavaScript (event handlers like `onclick`, `onsubmit`) must be refactored into external scripts using `addEventListener`.
**Prevention:** Avoid inline JavaScript during development to maintain a strict CSP. Implement global event listeners in a centralized JS file for better maintainability and security.

## 2026-06-16 - Vulnerability to Malformed JSON Payloads
**Vulnerability:** API endpoints expecting JSON were vulnerable to unhandled exceptions (500 Internal Server Error) when receiving malformed payloads (e.g., a JSON list instead of a dictionary) or incorrect data types for fields.
**Learning:** Flask's `request.json` can return various Python types depending on the `Content-Type: application/json` payload. Accessing dictionary methods like `.get()` on a list causes an `AttributeError`.
**Prevention:** Always verify that `request.json` is a dictionary using `isinstance(data, dict)` and validate that required fields are of the expected type (e.g., `isinstance(val, str)`) before processing.

## 2026-06-25 - Password Hash Truncation Risk
**Vulnerability:** The `User.password_hash` column was limited to 128 characters, which could lead to truncation of modern hashes (like scrypt used by Werkzeug 3.0+) which are typically 162 characters long. Truncated hashes cause authentication failures.
**Learning:** Modern password hashing algorithms produce longer outputs than traditional ones. Database schema must be designed with enough headroom for future-proofing.
**Prevention:** Use at least 256 characters for password hash columns. Always verify the output length of the chosen hashing algorithm.
