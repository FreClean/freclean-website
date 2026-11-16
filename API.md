# API

Website request integration:

- The website is configured to send anonymous enquiries to `POST https://api.freclean.com/api/public/requests`.
- The request contract accepts `SERVICE` and `CONTACT` types. `/book/` submits a service enquiry; it does not reserve a slot or collect payment details. Contact and partnership forms submit contact enquiries.
- The browser reports that a request was received only for an explicit HTTP 201 response with `received: true`. That response does not itself prove a confirmed booking, order, or payment.
- Local API implementation and mocked-provider tests do not verify the currently deployed host, production persistence, or delivery to either active email address. No live enquiry was submitted for this audit.
- `contact@freclean.com` is the configured contact-form target in this website implementation. `freclean7@gmail.com` is also active and appears as a fallback for other enquiry paths; the exact production routing and intended roles require owner confirmation.

The local API implementation applies HTTPS-origin allowlisting, payload limits, honeypot rejection, validation, rate limiting, duplicate protection, outbound timeout protection, correlation headers, and safe error responses. These controls are not evidence that the remote deployment has the same version or configuration.

This website does not call payment, order, booking-confirmation, authentication, customer, or admin endpoints. The separate Core repository contains additional APIs; website code does not treat their presence as proof of production activation.