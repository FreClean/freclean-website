# Environment

Public browser variables are documented in `.env.example`. The contact API requires server-only `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; `ALLOWED_ORIGINS` must be restricted to approved HTTPS origins. `FRECLEAN_REQUEST_RECIPIENT` can override the default public support recipient.

Do not place secrets in GitHub Pages environment variables, HTML, JavaScript, documentation, logs, or commits. The database, auth, payment, webhook, and monitoring variables required by the wider platform are not defined here because their owning services are absent.