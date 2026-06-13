## 2025-05-22 - Client-Side Price Manipulation in Payment Initialization
**Vulnerability:** The application trusted the payment amount sent by the client in the `/initialize-payment` request, allowing attackers to modify the price.
**Learning:** Even if the frontend UI displays a fixed price, the backend must always validate or strictly define the expected amount from a trusted source (database or hardcoded config) before processing payments.
**Prevention:** Never trust sensitive transaction data provided by the client. Hardcode prices server-side for single-item checkouts or look up prices from a secure database based on a product ID.

## 2026-06-11 - Lack of HTTP Security Headers
**Vulnerability:** The application was missing critical HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and CSP), leaving it vulnerable to Clickjacking and MIME-sniffing.
**Learning:** Modern web applications should implement defense-in-depth by default. Flask doesn't add these headers automatically.
**Prevention:** Use an `@app.after_request` decorator to consistently apply security headers across all responses.

## 2026-06-12 - Inline JavaScript and Weak CSP
**Vulnerability:** The application used inline JavaScript event handlers (`onclick`, `onsubmit`), requiring `'unsafe-inline'` in the Content-Security-Policy, which significantly weakens XSS protection.
**Learning:** Decoupling JavaScript from HTML templates not only improves code maintainability but is a prerequisite for a strong Content-Security-Policy.
**Prevention:** Eliminate all inline JavaScript in favor of external scripts and event listeners to allow for a strict CSP that omits `'unsafe-inline'`.
