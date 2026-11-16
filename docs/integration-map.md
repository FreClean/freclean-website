# FreClean Integration Map

Scope: `FreClean/freclean-website`. This document records repository evidence;
it does not assert live activation of external services.

## Components and current status

| Component | Owner | Verified repository behavior | External / production status |
|---|---|---|---|
| Public website | `freclean-website` | Static pages, multilingual catalogs, service/contact/product enquiries | GitHub Pages deployment state is not changed or claimed by this audit |
| Public requests | Website client and configured API | Client submits `SERVICE` or `CONTACT`; only an explicit HTTP 201 receipt is shown as received | No live POST was made; remote persistence and email delivery are unverified |
| Core API and records | `FreClean/FreClean` | Public request route and business APIs exist in source | Production database state and deployed version require separate evidence |
| Application | `freclean-app` | Customer/staff UI and HTTPS production API URL enforcement in source | Complete workflows and production API connectivity are not verified |
| Organization policy | `FreClean/.github` | Shared architecture/security documentation updated in its audit clone | Organization settings and external adoption are not changed |
| USDT | Core owns verification | Several code-level adapters exist in Core; static website address configuration is disabled and empty | No network is publicly enabled or confirmed for production |
| CeloHT | Independent external ecosystem | Website may link to `https://app.celoht.com/` as an external handoff | No FreClean settlement callback or verifier is present; handoff does not mark paid |
| Cash | Physical point of sale only | Website policy states physical-only acceptance and does not list a location | No POS transaction workflow or verified location is present in reviewed code |
| Email | Website and Core configuration | `contact@freclean.com` and `freclean7@gmail.com` are both preserved as active | Exact production routing and sender/delivery status require owner confirmation |

## Request contract

The website's configured URL is `https://api.freclean.com/api/public/requests`.
Core source also contains the public request contract. This audit performed
read-only health checks only; it did not send a valid POST or customer data.
The website treats a request as an enquiry, never as a confirmed booking,
order, or payment.

The `freclean7@gmail.com` address remains an active public contact and is used
by fallback paths in website code. Core configuration uses
`contact@freclean.com` for contact notifications. The precise intended roles
and production recipient overrides should be confirmed by the owner; neither
address should be removed or labeled obsolete.

## Payment boundaries

- **USDT:** No network is enabled in the website. `payments/payment-addresses.json`
  has `paymentMode: DISABLED`, an empty network list, and no wallet addresses.
  Production availability requires independently verified chain, token,
  destination, RPC, confirmation, duplicate-protection, and deployment evidence
  from Core.
- **CeloHT:** Separate external DApp handoff only; no ownership, processor, or
  settlement-verification claim is made for FreClean.
- **Cash:** Only in person at authorized physical points of sale. No remote or
  online cash path is implemented; no point-of-sale address is published.

## Security and deployment boundaries

- Core is authoritative for orders, bookings, identities, permissions, and
  financial records. The website cannot set payment state.
- The app is a client; backend authorization must enforce staff/owner access.
- Secrets remain in server-side secret managers. Do not copy production keys,
  credentials, or wallet material into this repository.
- Local tests and builds are not evidence of production deployment, email
  delivery, database persistence, payment activation, or legal approval.
- No production configuration, database, DNS, blockchain transaction, or
  customer communication was changed or initiated for this audit.

## Owner confirmation required

1. Confirm production routing and intended roles for both active email
   addresses.
2. Provide documentary/business-owner confirmation for service coverage,
   product prices, and any physical point-of-sale locations before publishing
   them.
3. Authorize and coordinate any live integration test separately, using a
   synthetic enquiry and a test mailbox only.
4. Approve any production payment activation after Core's network-specific
   verification and reconciliation controls have been independently tested.
