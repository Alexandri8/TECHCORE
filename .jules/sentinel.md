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

## 2026-06-18 - Robust JSON Structure and Type Validation
**Vulnerability:** API endpoints were vulnerable to 500 Internal Server Errors when receiving malformed JSON (e.g., a list instead of a dictionary) or invalid data types for expected fields (e.g., an integer instead of a string).
**Learning:** Flask's `request.get_json()` can return any valid JSON type, including lists or strings. Attempting dictionary-specific operations like `.get()` on a list, or string-specific operations like `len()` on an integer, triggers unhandled exceptions.
**Prevention:** Always verify that the parsed JSON is a dictionary using `isinstance(data, dict)` and explicitly validate the type of each field (e.g., `isinstance(field, str)`) before further processing or length validation.
