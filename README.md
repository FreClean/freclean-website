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

`/book/` and `/contact/` use the same request boundary. When `FRECLEAN_PUBLIC_REQUEST_URL` is empty, the form does not pretend to submit: it tells the visitor to email `freclean7@gmail.com`. When an approved HTTPS public endpoint is configured, the site sends the form data, handles loading/error/success states and only displays success after a successful HTTP response.

The website never confirms a booking, price, availability or payment on its own. The backend or authorized FreClean staff remains authoritative.

The public website also avoids invented testimonials, impact metrics, product specifications and press claims. New editorial and press sections provide truthful architecture for future verified content rather than placeholder announcements.

## Payments

The public payment options are:

1. Cash for supported local or face-to-face transactions.
2. Visa and Mastercard where the configured service flow supports them.
3. Crypto through the CeloHT dApp where available.

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
- FreClean email fallback: `freclean7@gmail.com`
- FreClean phone contact: `+1 (849) 388-1969`
- CeloHT dApp: `https://app.celoht.com/` when crypto payment is available
- An approved public request endpoint is optional for API submission; the working email-draft fallback remains available

The website is **READY as a public service-enquiry website**. Online booking confirmation and hosted card checkout are intentionally not enabled: they require independently released external contracts and must not be represented as live until verified. The email-draft fallback, cash/card availability wording and CeloHT handoff are the current production boundaries.
