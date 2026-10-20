# FreClean Public Website

The FreClean public website is a static HTML, CSS and JavaScript site for service discovery, product enquiries and customer requests. `freclean.com` is the configured canonical domain and GitHub Pages is the deployment host.

## Architecture

The website is a public presentation and request boundary. It is not the FreClean admin application, protected API, database or payment processor.

```text
Public website
    -> service or product enquiry
    -> FreClean public request endpoint (only when configured)
    -> FreClean Core/API and staff confirmation

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

`/book/` and `/contact/` use the same request boundary. `FRECLEAN_PUBLIC_REQUEST_URL` is currently empty, so submissions are not sent online. The form keeps the details and offers an email draft to `freclean7@gmail.com`; the visitor must send that email. When an authorized, public HTTPS endpoint is configured, it must return HTTP 204 or a JSON receipt with `received: true` or `accepted: true` before the site reports receipt. A failed or ambiguous response leaves the form data available for the email fallback.

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
FRECLEAN_PUBLIC_REQUEST_URL=
FRECLEAN_CELOHT_DAPP_URL=https://app.celoht.com
```

An empty request URL is intentional until an approved anonymous public request contract exists. Do not point it at the protected booking API and do not place secrets in this repository.

## Development and Deployment

No build step is required. Serve the repository with any static server, for example:

```sh
python3 -m http.server 8000
```

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`. The workflow validates the site before publishing the artifact. The repository `CNAME` file configures `freclean.com`; DNS and the GitHub Pages custom-domain setting must remain active for the canonical domain to resolve.

## Validation

Run the production checks from the repository root:

```sh
sh scripts/validate-site.sh
node --check script.js
```

The validator checks canonical pages, legacy redirects, metadata, landmarks, local links and assets, sitemap and robots configuration, payment terminology, CeloHT routing, secret patterns, runtime patch removal, external-link safety and fake confirmation copy.

## Known External Dependencies

- GitHub Pages deployment
- Google Fonts referenced by the public pages
- FreClean public contact and email-draft fallback: `freclean7@gmail.com`
- CeloHT payment route: `https://app.celoht.com/`; CeloHT is separate from FreClean
- No approved public request endpoint is configured; visitors must send the email draft themselves

The website provides service enquiries, not online booking confirmation. Online request delivery requires an approved public HTTPS endpoint, and online card checkout is not configured. The email-draft fallback, locally arranged cash, card by direct arrangement, and the separate CeloHT route are the current public boundaries.
