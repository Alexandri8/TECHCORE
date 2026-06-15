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

## 2026-10-27 - Improper Input Validation on JSON Payloads
**Vulnerability:** The application was vulnerable to crashes (Internal Server Errors) when receiving malformed JSON payloads (e.g., a list instead of a dictionary) or unexpected data types for fields. This could be exploited for Denial of Service or to probe for information via stack traces if debug mode was enabled.
**Learning:** Flask's `request.json` can return various JSON types (list, dict, etc.). Always verify that the root element is a dictionary and that each field matches the expected type (e.g., string) before processing.
**Prevention:** Implement strict type and existence checks on all JSON input fields at the beginning of route handlers.
