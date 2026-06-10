## 2025-05-22 - Client-Side Price Manipulation in Payment Initialization
**Vulnerability:** The application trusted the payment amount sent by the client in the `/initialize-payment` request, allowing attackers to modify the price.
**Learning:** Even if the frontend UI displays a fixed price, the backend must always validate or strictly define the expected amount from a trusted source (database or hardcoded config) before processing payments.
**Prevention:** Never trust sensitive transaction data provided by the client. Hardcode prices server-side for single-item checkouts or look up prices from a secure database based on a product ID.
