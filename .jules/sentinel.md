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

## 2026-06-19 - Lack of Robust JSON Payload Validation
**Vulnerability:** The application was vulnerable to crashes (500 Internal Server Error) and potential information leakage when receiving malformed JSON, non-dictionary payloads, or incorrect data types in API endpoints.
**Learning:** Flask's `request.json` or `request.get_json()` can return `None` or non-dict types (like lists) depending on the input, leading to `AttributeError` when attempting to use `.get()`. Additionally, missing type checks on individual fields can cause `TypeError` during operations like `len()`.
**Prevention:** Always use `request.get_json(silent=True)`, verify that the result is an `isinstance(data, dict)`, and strictly validate the existence and types (e.g., `isinstance(f, str)`) of all required fields before processing.
