# FreClean Architecture 2.0

Status: website-side architecture record, 2026-09-18

This repository is the public FreClean website. It does not own business rules,
authentication, payment verification, booking state, or database access.

## Four repositories

| Repository | Responsibility | Boundary |
| --- | --- | --- |
| `FreClean/FreClean` | Core API, PostgreSQL, migrations, business rules, authentication, RBAC, bookings, orders, payments, and audit-sensitive writes | The only repository allowed to write production data |
| `FreClean/freclean-website` | Public brand, service and product discovery, contact, booking initiation, and approved public API consumption | Static pages must render without the API; no secrets or direct database access |
| `FreClean/freclean-app` | Authenticated customer, staff, manager, admin, and owner experiences | API client only; client-side role checks are not authorization |
| `FreClean/.github` | Shared architecture contract, CI, repository policy, security policy, and templates | No product or business logic |

There is no fifth application repository.

## Current integration truth

The core repository currently exposes `/api/auth`, `/api/bookings`, and
`/api/payments`. The booking write route is authenticated and requires server
issued `serviceId`, `businessLocationId`, `addressId`, and ISO schedule values.
The website does not currently have an approved anonymous booking or public
catalog endpoint. Therefore this static site must not post a public form to the
protected booking route or claim that a request was created. The configured
public request endpoint is the API at
`https://api.freclean.com/api/public/requests`. The website sends `SERVICE` for
booking enquiries and `CONTACT` for direct contact and partnership enquiries.
The Core API routes notifications to `CONTACT_EMAIL`, configured as
`contact@freclean.com`. If the endpoint is unavailable, the form keeps its
details and offers a visitor-sent email draft; the contact page fallback is
`contact@freclean.com`.

When a public request endpoint is released, it should be added as an explicit,
versioned, approved HTTPS contract and enabled through runtime configuration.
For this website to report receipt, the endpoint must return HTTP 204 or JSON
with `received: true` or `accepted: true`. The website should render only that
receipt, plus conflict, validation, timeout, and unavailable states.

## Customer journey

The website presents the intended journey as five stages:

1. Service: choose a service and property type.
2. Schedule: provide a preferred date and time.
3. Details: provide name, phone, email, location, and notes.
4. Payment: select USDT on BEP20, TRC20, Solana, or Celo, or choose the separate CeloHT DApp option.
5. Review: confirm the request before submission.

The current form remains an inquiry until the public API contract is independently
verified against a live Core implementation. It
never invents availability, price, booking IDs, transaction hashes, or payment
status. The existing email fallback is the honest failure path.

## Payment boundary

The Core payment contract accepts `USDT` and `CELOHT_DAPP`; USDT networks are
`BEP20`, `TRC20`, `SOLANA`, and `CELO`. The public receiving addresses for
manual transfers are stored in `payments/payment-addresses.json`. The website
has no authenticated checkout or order-creation flow; FreClean confirms the
quote, amount, and receipt directly. The website does not automatically verify
or mark a transfer as paid.

- **USDT:** the website loads public network and receiving-address details from
  its static configuration. Automated payment creation and transaction
  verification remain separate authenticated Core flows and are not enabled by
  the manual address display.
- **CeloHT:** the website retains a separate public handoff to
  `https://app.celoht.com`. A DApp redirect or customer-submitted hash does not
  confirm settlement; no such confirmation is fabricated in this repo.

## Required core follow-up before live public booking

- Publish a public, rate-limited service/catalog read contract.
- Publish an anonymous booking-request contract or an authenticated handoff
  from the website to the app.
- Define customer/address creation and idempotency behavior for that flow.
- Publish a secure customer checkout handoff for authenticated orders/bookings
  before the website can initiate payment or display server-returned payment
  instructions.
- Define verifiable CeloHT settlement callbacks before representing its
  handoff as paid.
- Add contract tests shared by core, app, and website releases.
- Align the organization contract's `/api/v1` wording with the currently
  deployed `/api` paths before introducing a breaking route change.

## Deployment and security

GitHub Pages serves the website as static content. Runtime public configuration
may include an API URL or CeloHT DApp URL, but secrets, database credentials,
processor keys, webhook secrets, wallet keys, and admin credentials never belong
in HTML, JavaScript, or public environment variables. The backend remains
independently deployable and authoritative when unavailable.

## Release order

1. Core publishes and tests the additive public contract.
2. The app adopts the same contract and server-driven state model.
3. The website enables the runtime endpoint and keeps the email fallback.
4. `.github` CI runs the coordinated contract, security, and smoke checks.
