# API

Implemented endpoint:

- `GET /health` returns service liveness.
- `POST /api/public/requests` validates an anonymous enquiry and sends it through Resend. The `/contact/` form uses request type `CONTACT_FORM`, goes to `contact@freclean.com`, and sets the visitor email as Reply-To. Service and partnership submissions use the configured general recipient. Success is `201` with `{ "received": true }` only after Resend accepts the message.

The endpoint applies HTTPS-origin allowlisting, payload limits, honeypot rejection, validation, rate limiting, duplicate protection, outbound timeout protection, correlation headers, and safe error responses.

There are no `/api/v1/products`, `/api/v1/orders`, `/api/v1/bookings`, `/api/v1/payments`, authentication, customer, or admin endpoints in this repository.