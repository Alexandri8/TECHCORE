## 2026-07-04 - Crash in Security-Critical Paths due to Missing Imports
**Vulnerability:** The application was vulnerable to crashes (500 Internal Server Error) in the `/login` and `/verify-payment` routes because it attempted to use the `re` module for input sanitization and validation without importing it.
**Learning:** Security logic that fails due to environmental or code errors can lead to a Denial of Service or bypass of intended protections if the error is not handled or if it prevents the security check from completing.
**Prevention:** Always verify that all modules used in security-sensitive paths (like input validation, sanitization, or hashing) are correctly imported and tested with dedicated unit tests that specifically exercise the error-handling and sanitization logic.
