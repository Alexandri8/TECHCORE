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

## 2026-06-21 - Insecure Rate Limiting and Log Injection Risks
**Vulnerability:** Attempting to mitigate brute-force attacks using `time.sleep()` in synchronous Flask workers introduces a Denial of Service (DoS) vector. Additionally, logging unsanitized usernames allows for Log Injection.
**Learning:** Security fixes must not introduce new availability risks. Blocking synchronous workers ties up server resources, making it easy for an attacker to exhaust the thread pool. User input must also be sanitized before logging to prevent forging or corrupting log data.
**Prevention:** Avoid `time.sleep()` for rate limiting in synchronous environments; use dedicated tools like Flask-Limiter. Always sanitize user-controlled strings using a whitelist approach (e.g., `re.sub(r'[^a-zA-Z0-9_@-]', '', val)`) before logging.
