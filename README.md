# FreClean Public Website

The FreClean public website is a static HTML, CSS and JavaScript site for service discovery, a product catalogue with quantity-aware order enquiries, and customer requests. `freclean.com` is the configured canonical domain and GitHub Pages is the deployment host.

## Architecture

The website is a public presentation and request boundary. The contact API is a separate Render Node service in this repository; it is not the FreClean admin application, database or payment processor.

```text
Public website
    -> service or product enquiry
    -> FreClean Core API
    -> configured notification delivery

Public /contact/ form
    -> FreClean Core API
    -> configured notification delivery
    -> contact@freclean.com

Public website
    -> separate CeloHT DApp handoff
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
- `/payments/` — USDT on BEP20, TRC20, Solana or Celo, and the separate CeloHT DApp option
- `/privacy/`, `/terms/` — public policy pages
- `/404.html` — recovery page

The old root `.html` URLs are retained only as redirects to their canonical directory routes. They are not included in the sitemap.

## Forms and Requests

`/book/`, `/contact/`, and `/partners/` submit anonymous enquiries to `https://api.freclean.com/api/public/requests`. The client uses `SERVICE` for `/book/` and `CONTACT` for `/contact/` and `/partners/`. The production API routes notifications to `CONTACT_EMAIL`, configured as `contact@freclean.com`; the contact page also retains that address as its email fallback. The frontend reports success only after an explicit accepted response; failed or ambiguous delivery provides an email draft.

The website never confirms a booking, price, availability or payment on its own. The backend or authorized FreClean staff remains authoritative.

The product catalogue lists the all-purpose cleaner (750 mL) at $7.99 USD, the Linen Breeze room freshener (300 mL) at $6.99–$7.99 USD, and the FreClean bracelet. Its client-side cart combines product quantities and calculates an estimated total; products with a price range remain estimates. Customers can choose a supported USDT network or the separate CeloHT DApp option, copy a public USDT address, and submit an order request by opening a prefilled email draft to `freclean7@gmail.com`. The request asks the customer to attach a payment screenshot after making a manual transfer. FreClean must confirm the exact price, stock, pickup or delivery and payment instructions; the website does not create a confirmed order, reserve inventory, take payment or verify a transfer.

The public website also avoids invented testimonials, impact metrics, product specifications and press claims. New editorial and press sections provide truthful architecture for future verified content rather than placeholder announcements.

## Legal Center and Consent

The website now includes a professional legal center with the public documents needed for an informed service and product enquiry flow. Cookie consent is implemented as a real banner that stores user preferences locally and does not load optional tracking before explicit consent. The site distinguishes necessary cookies from preferences, analytics and marketing choices, and provides an accessible way to change preferences later from the footer or the cookie policy page.

This repository intentionally does not claim to be a full payment processor, database owner, or legal regulator. It handles public information and consent architecture only; legal and tax validation remain external review items.

## Payments

The approved payment options are USDT on BNB Smart Chain (BEP20), TRON (TRC20), Solana, and Celo, plus CeloHT DApp as a separate option. The payment page displays the public receiving addresses in `payments/payment-addresses.json` for manual transfers; FreClean confirms quotes and receipts directly. The website does not create confirmed orders or automatically verify or confirm payment. See [PAYMENTS.md](PAYMENTS.md) for the current boundary and verification requirements.

The entrepreneurship page also uses the same public USDT addresses for voluntary contributions to support entrepreneurship and small-business opportunities for families in Haiti. Western Union and MoneyGram instructions are provided by the team. Contributions are reviewed manually, not automatically verified or represented as tax-deductible, and donor and beneficiary information remains private unless explicit consent is provided.

The CeloHT link is `https://app.celoht.com/`. CeloHT is separate from FreClean; a DApp handoff does not confirm settlement or change payment status.

## Configuration

Copy `.env.example` into the deployment configuration if the host supports runtime injection:

```text
FRECLEAN_PUBLIC_REQUEST_URL=https://api.freclean.com/api/public/requests
FRECLEAN_PUBLIC_API_BASE_URL=https://api.freclean.com
FRECLEAN_CELOHT_DAPP_URL=https://app.celoht.com
```

The Render service requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ALLOWED_ORIGINS` as Render environment variables. `FRECLEAN_REQUEST_RECIPIENT` optionally configures the recipient for service and partnership requests; `/contact/` always targets `contact@freclean.com`. `RESEND_API_KEY` must never be added to this repository or exposed to the browser. Set `RESEND_FROM_EMAIL` to a sender verified by Resend, such as `FreClean <noreply@freclean.com>`, before production delivery can succeed.

The production request URL is public browser configuration and contains no secret. Do not point it at protected auth or booking APIs, and never add secrets or payment processor credentials to this repository.

## Development and Deployment

The static site has no build step. The contact API runs with Node 20 on Render using `render.yaml`. Serve the static files locally with any static server, for example:

```sh
python3 -m http.server 8000
```

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`. The workflow validates the site before publishing the artifact. The repository `CNAME` file configures `freclean.com`; DNS and the GitHub Pages custom-domain setting must remain active for the canonical domain to resolve.

## Languages

The public site supports English (`en`, default), Haitian Creole (`ht`), Latin American Spanish (`es`), and Brazilian Portuguese (`pt`). The shared `script.js` adds the language selector to the existing navigation, saves the selection as `freclean_language`, and switches text, accessibility labels and supported SEO metadata without reloading or changing routes. Booking and contact field values remain stable while labels change.

Maintain matching namespaces and keys across `locales/en.json`, `locales/ht.json`, `locales/es.json`, and `locales/pt.json`. Static HTML copy is indexed against the English catalog; dynamic interface copy uses the shared `window.FRECLEAN_I18N.t(key)` function. Keep English source text in the catalog aligned with the HTML or script string it translates. Run `npm run audit:i18n` after changing copy; the same audit is part of `scripts/validate-site.sh` and therefore blocks an incomplete Pages deployment.

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
- Public contact details and service/partnership email fallback: `freclean7@gmail.com`
- `/contact/` enquiry destination and fallback: `contact@freclean.com`
- CeloHT payment route: `https://app.celoht.com/`; CeloHT is separate from FreClean
- The contact API implementation is covered by local mocked-provider tests. Production delivery remains unverified until the Render service is deployed with its Resend environment variables and a real `/contact/` enquiry is received at `contact@freclean.com`.

The website provides service and contact enquiries, not online booking confirmation. The supported anonymous public contracts are `POST /api/public/requests` and `GET /api/payments/options`; `/api/bookings` remains authenticated and is not called by the frontend. USDT addresses are displayed for manual transfer, with amount and receipt confirmed directly by FreClean.
