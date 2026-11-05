# Security

Implemented here: server-side validation, payload size limits, CORS origin allowlisting, rate limiting, duplicate suppression, no-store responses, secure response headers, outbound provider timeout, secret-free frontend code, and safe customer-facing errors.

Not implemented here: authentication, password hashing, password reset, email verification, CSRF/session controls, RBAC, 2FA, webhook verification, database authorization, audit storage, monitoring, and penetration testing. These belong to the Core API and its deployment environment.

Never place payment secrets, database credentials, wallet keys, or Resend credentials in this repository.