# FreClean Public Website

The FreClean public website is a static HTML, CSS and JavaScript site for service discovery, product enquiries and customer requests. `freclean.com` is the configured canonical domain and GitHub Pages is the deployment host.

## Architecture

The website is a public presentation and request boundary. The contact API is a separate Render Node service in this repository; it is not the FreClean admin application, database or payment processor.

```text
Public website
    -> service or product enquiry
    -> Render contact API
    -> Resend
    -> freclean7@gmail.com

Public website
    -> crypto payment link
    -> https://app.celoht.com/
```

The static site never contains private API keys, service-role credentials, payment secrets, wallet credentials or database access. A form submission is an enquiry until FreClean confirms availability and next steps.

## Canonical Routes

- `/` — homepage
- `/services/` — service index and service detail pages
- `/products/` — product catalogue and enquiry pages
- `/business/` — business enquiries
- `/about/`, `/entrepreneurship/`, `/impact/`, `/resources/` — company and support pages
- `/partners/` — partnership inquiry and collaboration pathways
- `/journal/` — editorial architecture for verified company perspectives
- `/press/` — press information and approved media asset requests
- `/contact/` — contact enquiry
- `/book/` — service request form, not a confirmed booking system
- `/payments/` — cash, Visa, Mastercard and CeloHT payment information
- `/privacy/`, `/terms/` — public policy pages
- `/404.html` — recovery page

The old root `.html` URLs are retained only as redirects to their canonical directory routes. They are not included in the sitemap.

## Forms and Requests

`/book/`, `/contact/`, and `/partners/` submit anonymous enquiries to `https://freclean.onrender.com/api/public/requests`. The contact API validates the name, email and message, rejects the honeypot field, applies rate limiting and duplicate protection, and sends accepted enquiries through Resend to the configured recipient, defaulting to `freclean7@gmail.com`. The frontend reports success only after HTTP 201 with `received: true`; failed or ambiguous delivery leaves the details available for the email fallback.

The website never confirms a booking, price, availability or payment on its own. The backend or authorized FreClean staff remains authoritative.

The public website also avoids invented testimonials, impact metrics, product specifications and press claims. New editorial and press sections provide truthful architecture for future verified content rather than placeholder announcements.

## Legal Center and Consent

The website now includes a professional legal center with the public documents needed for an informed service and product enquiry flow. Cookie consent is implemented as a real banner that stores user preferences locally and does not load optional tracking before explicit consent. The site distinguishes necessary cookies from preferences, analytics and marketing choices, and provides an accessible way to change preferences later from the footer or the cookie policy page.

This repository intentionally does not claim to be a full payment processor, database owner, or legal regulator. It handles public information and consent architecture only; legal and tax validation remain external review items.

## Payments

The public payment options are:

1. Cash for supported local transactions arranged directly with FreClean.
2. Visa or Mastercard only by direct arrangement and confirmation with FreClean. Online card checkout is not configured.
3. The separate CeloHT route at the canonical link below, only when FreClean confirms it is appropriate.

The CeloHT link is `https://app.celoht.com/`. CeloHT is a separate payment route and is not FreClean. The website does not collect raw card details or wallet credentials and does not fabricate payment confirmation.

## Configuration

Copy `.env.example` into the deployment configuration if the host supports runtime injection:

```text
FRECLEAN_PUBLIC_REQUEST_URL=https://freclean.onrender.com/api/public/requests
FRECLEAN_PUBLIC_API_BASE_URL=https://freclean.onrender.com
FRECLEAN_CELOHT_DAPP_URL=https://app.celoht.com
CARD_PAYMENTS_ENABLED=false
```

The Render service also requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ALLOWED_ORIGINS` as Render environment variables. `FRECLEAN_REQUEST_RECIPIENT` is optional and defaults to `freclean7@gmail.com`. `RESEND_API_KEY` must never be added to this repository or exposed to the browser. Resend must have verified the sender domain before production delivery can succeed.

The production request URL is public browser configuration and contains no secret. Do not point it at protected auth or booking APIs, and never add secrets or payment processor credentials to this repository.

## Development and Deployment

The static site has no build step. The contact API runs with Node 20 on Render using `render.yaml`. Serve the static files locally with any static server, for example:

```sh
python3 -m http.server 8000
```

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`. The workflow validates the site before publishing the artifact. The repository `CNAME` file configures `freclean.com`; DNS and the GitHub Pages custom-domain setting must remain active for the canonical domain to resolve.

## Languages

The public site supports English (`en`, default) and Haitian Creole (`ht`). The shared `script.js` adds the language selector to the existing navigation, saves the selection as `freclean_language`, and switches text, accessibility labels and supported SEO metadata without reloading or changing routes. Booking and contact field values remain stable while labels change.

Maintain matching namespaces and keys in `locales/en.json` and `locales/ht.json`. Static HTML copy is indexed against the English catalog; dynamic interface copy uses the shared `window.FRECLEAN_I18N.t(key)` function. Keep English source text in the catalog aligned with the HTML or script string it translates. Run `npm run audit:i18n` after changing copy; the same audit is part of `scripts/validate-site.sh` and therefore blocks an incomplete Pages deployment.

## Production Integration Documentation

- [Integration map and external dependencies](docs/integration-map.md)
- [Repository-side production readiness audit](docs/production-readiness-audit.md)
- [Four-repository architecture record](docs/architecture-2.0.md)

These documents distinguish implemented website behavior from external Core, database, authentication, administration, notification, and payment capabilities that have not been verified.

## Validation

Run the production checks from the repository root:

```sh
sh scripts/validate-site.sh
node --check script.js
npm run audit:i18n
```

The validator checks canonical pages, legacy redirects, metadata, landmarks, local links and assets, sitemap and robots configuration, payment terminology, CeloHT routing, secret patterns, runtime patch removal, external-link safety and fake confirmation copy.

## Known External Dependencies

- GitHub Pages deployment
- Google Fonts referenced by the public pages
- FreClean public contact and email-draft fallback: `freclean7@gmail.com`
- CeloHT payment route: `https://app.celoht.com/`; CeloHT is separate from FreClean
- The contact API implementation is covered by local mocked-provider tests. Production delivery remains unverified until the Render service is deployed with its Resend environment variables and a real enquiry is received at `freclean7@gmail.com`

The website provides service and contact enquiries, not online booking confirmation. The supported anonymous public contract is `POST /api/public/requests`; `/api/bookings` remains authenticated and is not called by the frontend. Online card checkout is not configured, `CARD_PAYMENTS_ENABLED=false`, and the email-draft fallback, locally arranged cash, direct card arrangement, and separate CeloHT route remain the public boundaries.
