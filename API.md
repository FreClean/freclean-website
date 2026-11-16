# API

Implemented endpoint:

- `GET /health` returns service liveness.
- `POST https://api.freclean.com/api/public/requests` accepts anonymous enquiries using `SERVICE`, `CONTACT`, or `CONTACT_FORM` as the request type. The website uses `SERVICE` for `/book/`, `CONTACT` for `/partners/`, and `CONTACT_FORM` for `/contact/`; contact-form enquiries are delivered to `contact@freclean.com`. Success is reported only after the API explicitly accepts the request.

The endpoint applies HTTPS-origin allowlisting, payload limits, honeypot rejection, validation, rate limiting, duplicate protection, outbound timeout protection, correlation headers, and safe error responses.

There are no `/api/v1/products`, `/api/v1/orders`, `/api/v1/bookings`, `/api/v1/payments`, authentication, customer, or admin endpoints in this repository.