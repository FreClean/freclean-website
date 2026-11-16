# FreClean Cross-Repository Audit Report

Audit date: 2026-11-16  
Scope: `FreClean/freclean-website`, `FreClean/FreClean`, `FreClean/freclean-app`, and `FreClean/.github`.

## Executive summary

Policy alignment and selected security corrections are implemented in the four local working trees. The public website now distinguishes enquiries from confirmed bookings, orders, and payments; removes public payment addresses and payment selection; and avoids unsupported location, price, partnership, and legal-completion claims. Core public enquiries reject payment preferences. The app's production API URL validation requires HTTPS.

**Overall production readiness: BLOCKED.** Source-level checks and local tests pass, but production persistence and email delivery, payment activation, USDT token/destination verification, CeloHT settlement, and physical cash point-of-sale operations are not verified. No production configuration or data was changed.

Status labels in this report distinguish code from operation:

- **VERIFIED**: confirmed in source, repository configuration, or a read-only check.
- **IMPLEMENTED**: code or documentation has been changed.
- **TESTED**: local automated checks passed; this does not imply production verification.
- **BLOCKED**: cannot be considered ready until specified prerequisites are met.
- **REQUIRES OWNER CONFIRMATION**: an external decision or configuration is not available in the repositories.
- **NOT IMPLEMENTED**: no complete workflow was found.

## Repository findings

### `FreClean/freclean-website`

- **IMPLEMENTED / TESTED:** Payment and legal copy, service/product enquiry boundaries, contact workflow, privacy descriptions, and English/Haitian Creole/Spanish/Portuguese catalogs were aligned. The public page shows no USDT receiving address or network as production-enabled. Cash is described as in-person-only; no specific POS location is represented as verified.
- **IMPLEMENTED:** Booking no longer collects a payment preference. The Core public request endpoint also rejects payment-preference fields.
- **IMPLEMENTED:** Unverified product prices, public donation/payment UI, unsupported CeloHT ownership/partnership claims, and unverified location/service-area metadata were removed. The inherited product names and sizes remain in the catalogue; current product availability and commercial details still require owner confirmation.
- **VERIFIED in source / production BLOCKED:** Website forms target `POST https://api.freclean.com/api/public/requests`. Core implements and locally tests this contract. No production POST was made, so live persistence, outbox processing, and email delivery are unverified.
- **IMPLEMENTED / REQUIRES OWNER CONFIRMATION:** The `/contact/` fallback drafts to `contact@freclean.com`; service and partnership fallback drafts use `freclean7@gmail.com`. The repository also contains a standalone Node contact service whose default service/partnership recipient is `freclean7@gmail.com`. Which service is deployed and the actual production recipient configuration must be confirmed.
- **IMPLEMENTED:** Legal pages use the requested Haiti-counsel wording and do not claim completed registration, licenses, permits, or certificates.

### `FreClean/FreClean` (Core)

- **VERIFIED in source:** Core owns authentication, authorization, database writes, payment intents, transaction verification, and authoritative payment states.
- **IMPLEMENTED / TESTED:** Public enquiries no longer accept payment preferences; a submitted enquiry cannot initiate a payment. Historical payment columns/records remain for compatibility and are not active payment routes.
- **IMPLEMENTED / TESTED:** Access tokens are type-checked; production rejects identical access/refresh secrets; closing a dispute requires `dispute:close`.
- **VERIFIED in source / production BLOCKED:** USDT has four code-level verification adapters, but no network is confirmed production-enabled. `.env.example` keeps `USDT_PAYMENTS_ENABLED` false; production values were not inspected.
- **NOT IMPLEMENTED:** No Core cash POS recording workflow, CeloHT settlement callback, or authoritative CeloHT verifier exists.
- **IMPLEMENTED:** Core documentation describes its integration boundaries, payment blockers, email behavior, and legal status.

### `FreClean/freclean-app`

- **IMPLEMENTED / TESTED:** Production `VITE_API_URL` must be a valid HTTPS URL without embedded credentials. An unsupported claim that the staff dashboard records cash payments was removed.
- **NOT IMPLEMENTED:** A complete customer checkout, booking/order lifecycle, cash POS workflow, or end-to-end payment-status interface was not found. The app must not be described as providing those workflows.
- **VERIFIED in source:** No customer-facing card payment interface or cash online-checkout option was found.

### `FreClean/.github`

- **IMPLEMENTED:** Organization README/profile, security policy, and architecture contract now describe the approved payment categories, physical-only cash restriction, independent CeloHT boundary, active emails, Core ownership of business logic and financial records, and legal status.
- **IMPLEMENTED:** Guidance prohibits client-authoritative payment states, remote cash, unsupported payment methods, and unverified legal/compliance claims.

## Payment architecture

### Approved policy and actual availability

The approved categories are USDT on individually verified networks, the separate CeloHT route, and cash exclusively at authorized physical points of sale. This policy does **not** mean any route is currently available:

| Route | Implementation status | Production status |
|---|---|---|
| USDT | Four code-level server-side adapters; verification tests use mocked providers | **BLOCKED / REQUIRES OWNER CONFIRMATION** — no network is confirmed production-enabled; production RPCs, token identifiers, wallet ownership, destination configuration, and enablement are unverified |
| CeloHT | Configurable external HTTPS DApp handoff | **NOT IMPLEMENTED** for settlement verification; a redirect or customer-submitted hash remains pending and is not proof of payment |
| Cash | Policy permits cash only in person at authorized physical POS | **NOT IMPLEMENTED** in Core/app; no POS location or cash-recording workflow was verified |

### USDT adapters found in Core

These are source-code configurations, **not verified or production-supported networks**. Contract identifiers below are transcribed from Core source; they have not been independently confirmed against an authoritative issuer source. Receiving destinations exist in source configuration, but wallet ownership and operational control were not verified.

| Code adapter | Chain identity in code | Configured token identifier in code | Decimals | Confirmation/finality rule | RPC configuration |
|---|---|---|---:|---|---|
| BNB Smart Chain / BEP20 | EVM chain ID `56` | `0x55d398326f99059ff775485246999027b3197955` — explicitly unverified | 18 | 12 confirmations | `BSC_RPC_URL` |
| TRON / TRC20 | No runtime network-identity check; operator must verify that `TRON_RPC_URL` points to TRON mainnet | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` — not independently verified in this audit | 6 | 20 solidified blocks | `TRON_RPC_URL`; `TRONGRID_API_KEY` when required |
| Solana | Mainnet-beta genesis hash checked by verifier | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` — not independently verified in this audit | 6 | `finalized` commitment | `SOLANA_RPC_URL` |
| Celo | EVM chain ID `42220` | `0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e` — not independently verified in this audit | 6 | 3 confirmations | `CELO_RPC_URL` |

Core source checks EVM chain IDs, Solana mainnet-beta genesis identity, transaction success, token, destination, amount, and required confirmation/finality state; transaction hashes are reserved to prevent replay/duplicate processing. The TRON verifier does not independently check RPC network identity, so its endpoint must be confirmed as TRON mainnet before enablement. The tests mock provider responses and do not establish live RPC operation, token authenticity, wallet ownership, or a real payment. No production transaction was submitted.

## Cash and CeloHT

- **Cash — NOT IMPLEMENTED:** Cash is never an online or remote payment option. The Core/app have no verified POS workflow or location. Legacy `CARD`, `CASH`, and `CRYPTO` database values are historical schema/data compatibility only; current payment API validation does not enable them.
- **CeloHT — VERIFIED as a separate handoff only:** CeloHT is an independent ecosystem, not a FreClean-owned payment processor. The app/core handoff does not include settlement verification. A redirect, DApp screen, or submitted transaction reference must not set a FreClean payment to paid.

## Email configuration

- **VERIFIED in Core source:** Production `CONTACT_EMAIL` must be `contact@freclean.com`; Core uses it for public enquiry and admin payment notifications. A customer's email is the public-enquiry Reply-To. Resend sender identity and production delivery are not verified.
- **VERIFIED in website source:** `contact@freclean.com` is the `/contact/` destination/fallback. `freclean7@gmail.com` is public support and the service/partnership email-draft fallback; it is also the default recipient for the website's standalone contact service's service/partnership path.
- **VERIFIED in organization docs:** `freclean7@gmail.com` is the active security-reporting address. Both addresses remain active; neither is obsolete.
- **REQUIRES OWNER CONFIRMATION:** Which website service is deployed, recipient overrides, sender identity, production Reply-To behavior, and delivery status. No credentials were exposed or changed, and no email was sent.

## Legal and public identity

- **IMPLEMENTED:** Public and repository documentation uses: “FreClean is currently working with legal counsel in Haiti to process its official business documentation and related legal requirements.”
- **VERIFIED:** The repositories do not establish completed registration, licensing, permits, certificates, or other legal approvals. Qualified legal review remains external.
- **IMPLEMENTED:** Unverified prices, POS locations, service-coverage metadata, donation/payment claims, and CeloHT ownership/partnership claims were removed.
- **REQUIRES OWNER CONFIRMATION:** Current availability and owner-approved details for inherited product names/sizes, service scope, contact phone number, and any physical POS.

## Security review findings

All three findings below have been corrected and covered by local tests/builds. Severity reflects the pre-fix impact; confidence reflects confidence in the finding.

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `FreClean/src/auth/middleware.ts` | 27 | Refresh JWTs could be accepted by access middleware if access and refresh secrets were identical. Access-token type enforcement and production secret separation are implemented. | 9/10 |
| 2 | 🟡 MEDIUM | `FreClean/src/disputes/router.ts` | 15 | A user with dispute-investigation permission could close a dispute without `dispute:close`. Explicit close permission is now required. | 9/10 |
| 3 | 🟠 HIGH | `freclean-app/src/api.ts` | 22 | A production app could be configured to call the Core API over HTTP, exposing authenticated traffic to interception. Production now requires HTTPS. | 9/10 |

**Dependency risk:** Dependency installation/audit output reported 6 moderate advisories in Core and 15 in the app (11 moderate, 2 high, 2 critical). Dependencies were not upgraded as part of this policy/security alignment; assess and remediate those advisories in a separate compatibility-reviewed change.

## API, lifecycle, and role boundaries

- The website request endpoint is `POST https://api.freclean.com/api/public/requests`; the Core route is implemented and locally tested. A `201` means an enquiry was accepted/queued by the API, not a confirmed booking, order, payment, or delivered email.
- Core derives payment amounts from owned orders/bookings, requires authenticated payment creation and idempotency, and does not trust a frontend payment status.
- The public enquiry API rejects payment preference fields. Core's payment API accepts only USDT and the separate CeloHT handoff; `CASH` and card methods are not active payment methods.
- App/core payment and POS workflows are incomplete; no claim of end-to-end application operation is made.
- Read-only health checks returned `200` from `/health/ready` on the checked API hosts. A `/health` probe timed out once. These observations do not verify POST persistence, database migrations, email delivery, or payment status.
- No production POST was made.

## Test and build results

| Repository | Checks | Result |
|---|---|---|
| Website | `npm test`; `node --test scripts/request-workflow.test.js`; `sh scripts/validate-site.sh`; `node --check script.js`; `npm run audit:i18n` | **TESTED:** pass. 12 API tests and 13 request workflow tests pass; validator passes; each locale has 879 keys and the catalog audit reports 756 source strings. |
| Core | `npm test`; `npm run lint`; `npm run build`; `npm run check:repository` | **TESTED:** 36 test files / 156 tests pass; ESLint, TypeScript build, and repository validation pass (7 migrations validated; none applied to a production database). |
| App | `npm test`; `npm run lint`; `npm run build` | **TESTED:** 3 test files / 11 tests pass; ESLint and TypeScript/Vite production build pass. |
| Organization `.github` | Documentation/configuration review | No code test suite applies. |
| All four working trees | `git diff --check` | **TESTED:** no whitespace errors. |

No live email, customer transaction, blockchain transaction, database mutation, migration, production deployment, environment edit, DNS change, push, or merge was performed.

## Files inspected

The audit used repository-wide targeted searches plus direct inspection of the customer-facing routes, configuration, integration code, tests, and policy documents:

- **Website:** homepage, about/contact, booking, service/business, product, payment, entrepreneurship, privacy, terms, and legal pages; footer/navigation, `script.js`, `server.js`, `.env.example`, `products.json`, `payments/payment-addresses.json`, locale catalogs, validators/tests, API/deployment/environment docs, and architecture/readiness docs.
- **Core:** `src/config.ts`, auth middleware/service and tests, dispute router, public request/email/service code and tests, payment router/service/config/verification code and tests, payment/legal/API/integration docs, `.env.example`, and database payment migrations.
- **App:** `src/api.ts` and tests, login/disputes tests, staff dashboard, and README.
- **Organization `.github`:** `README.md`, `profile/README.md`, `SECURITY.md`, and `architecture-contract.md`.

## Files modified

### Website — `FreClean/freclean-website`

`.env.example`, `404.html`, `API.md`, `BOOKINGS.md`, `PAYMENTS.md`, `README.md`, `about/index.html`, `book/index.html`, `business/index.html`, `contact/index.html`, `docs/architecture-2.0.md`, `docs/cross-repository-audit-report.md`, `docs/implementation-report.md`, `docs/integration-map.md`, `docs/production-enhancement-roadmap.md`, `docs/production-readiness-audit.md`, `entrepreneurship/index.html`, `impact/index.html`, `index.html`, `journal/index.html`, `legal/accessibility-statement/index.html`, `legal/complaints-dispute-resolution/index.html`, `legal/cookie-policy/index.html`, `legal/index.html`, `legal/refund-policy/index.html`, `legal/returns-policy/index.html`, `legal/shipping-policy/index.html`, `locales/en.json`, `locales/es.json`, `locales/ht.json`, `locales/pt.json`, `partners/index.html`, `payments/index.html`, `payments/payment-addresses.json`, `press/index.html`, `privacy/index.html`, `products.json`, `products/cleaning-essentials/index.html`, `products/fragrance-products/index.html`, `products/index.html`, `resources/index.html`, `script.js`, `scripts/audit-translations.py`, `scripts/request-workflow.test.js`, `scripts/validate-site.sh`, `services/airbnb/index.html`, `services/commercial/index.html`, `services/hospitality/index.html`, `services/hotel/index.html`, `services/index.html`, `services/office/index.html`, `services/residential/index.html`, `services/specialized/index.html`, and `terms/index.html`.

Deleted: `payments/payment-options.js` and `scripts/payment-options.test.js` (the site no longer loads or tests a public payment-address/options feature).

### Core — `FreClean/FreClean`

`README.md`, `docs/api-contract.md`, `docs/integration-production-readiness.md`, `docs/legal/business-address.md`, `docs/legal/compliance-calendar.md`, `docs/legal/document-register.md`, `docs/legal/freclean-legal-profile.md`, `docs/legal/intellectual-property.md`, `docs/legal/legal-compliance-status.md`, `docs/legal/legal-structure-decision.md`, `docs/payments.md`, `src/auth/middleware.test.ts`, `src/auth/middleware.ts`, `src/auth/service.ts`, `src/config.test.ts`, `src/config.ts`, `src/disputes/router.ts`, `src/production.integration.test.ts`, `src/public/email.ts`, `src/public/requests.test.ts`, `src/public/requests.ts`, and `src/public/service.ts`.

### App — `FreClean/freclean-app`

`README.md`, `src/api.ts`, `src/api.test.ts` (added), and `src/pages/staff/Dashboard.tsx`.

### Organization — `FreClean/.github`

`README.md`, `SECURITY.md`, `architecture-contract.md`, and `profile/README.md`.

## Blockers and exact owner-authorized actions

1. **USDT:** Independently verify each proposed chain, authoritative token contract and decimals, recipient-wallet ownership, RPC mainnet identity, finality/confirmation thresholds, duplicate protection, and reconciliation in a non-production environment. Decide which (if any) network to support; keep USDT disabled until a complete authenticated workflow passes and the owner explicitly authorizes activation.
2. **CeloHT:** Confirm the external handoff is owner-approved. Obtain and implement an authoritative settlement integration before any CeloHT transaction can be marked paid.
3. **Cash POS:** Identify and authorize physical locations, then implement role-gated, auditable POS recording with amount, timestamp, and transaction reference. Until then, do not claim POS locations or recording are operational.
4. **Email and API:** Confirm which website contact service is deployed; resolve the recipient and sender configuration for both active addresses; verify production database/outbox processing, Reply-To, delivery/retry behavior, and the public endpoint using synthetic data. Do not send customer emails.
5. **Legal:** Have qualified Haiti counsel review privacy, terms, consumer/payment language, and business documentation. Update any status only against documentary evidence.
6. **Public details:** Confirm current service availability, product names/sizes/prices, phone contact, and any POS before representing them as operational or publishing prices/locations.
7. **Dependencies:** Review the reported Core/app advisories and approve compatibility-tested dependency updates separately.
8. **Release:** Owner approval is required for any production configuration or payment activation. Deployment, push, merge, production database changes, migrations, DNS changes, secret rotation, and real financial transactions remain outside this audit.
