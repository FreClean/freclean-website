# Deployment

The static site deploys through GitHub Pages using `CNAME` and `https://freclean.com`. The contact API is a separate Node 20 Render service using `npm start` and `/health`.

Required Render variables are `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ALLOWED_ORIGINS`. `FRECLEAN_REQUEST_RECIPIENT` is optional and applies to service and partnership requests only; `/contact/` enquiries are routed by the backend to `contact@freclean.com`. Set credentials in Render's environment/secret manager, and configure `RESEND_FROM_EMAIL` as a FreClean sender verified in Resend (for example, `FreClean <noreply@freclean.com>`). The repository configuration declares these variables but cannot verify the values stored in the production secret manager. After deployment, verify the service health endpoint and a controlled enquiry receipt at `contact@freclean.com`.

There is no database, authenticated API, admin deployment, payment provider, or staging environment in this repository.