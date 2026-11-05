# Deployment

The static site deploys through GitHub Pages using `CNAME` and `https://freclean.com`. The contact API is a separate Node 20 Render service using `npm start` and `/health`.

Required Render variables are `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ALLOWED_ORIGINS`, and optionally `FRECLEAN_REQUEST_RECIPIENT`. The sender domain must be verified in Resend. No production deployment is proven by local tests; verify the deployed health endpoint and a controlled enquiry receipt after configuration.

There is no database, authenticated API, admin deployment, payment provider, or staging environment in this repository.