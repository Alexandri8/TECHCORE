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

## 2026-06-28 - Resource Exhaustion via Unbounded Authentication Inputs
**Vulnerability:** The login endpoint lacked length validation on username and password fields, potentially allowing a Denial of Service (DoS) attack by submitting extremely large strings to the password hashing function (scrypt), which is computationally expensive.
**Learning:** Authentication endpoints are primary targets for DoS. Hashing algorithms are designed to be slow, so providing them with very large inputs can disproportionately consume CPU resources and exhaust server workers.
**Prevention:** Enforce strict server-side length limits on all authentication inputs (e.g., 80 chars for username, 256 for password) before processing or hashing. Ensure database column lengths are sufficient to store the resulting hashes without truncation.

## 2026-07-02 - Missing Dependencies in Critical Security Paths
**Vulnerability:** The `re` module was used in the `/login` and `/verify-payment` routes for sanitization and validation but was not imported, leading to a `NameError` and application crash when these security features were triggered.
**Learning:** Security logic (like log sanitization or input validation via regex) is often in rarely-triggered paths. A missing import can effectively disable these protections or cause a DoS when an attack is attempted.
**Prevention:** Always verify security paths with automated tests that specifically trigger the validation/sanitization logic to ensure all dependencies are present and functional.
