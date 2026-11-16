# Production Readiness Audit

Scope: `FreClean/freclean-website` and repository-side integration evidence.
This audit authorizes no deployment or live financial operation.

## Status summary

| Area | Status | Evidence / limitation |
|---|---|---|
| Public identity and content | IMPLEMENTED | Services, product categories, entrepreneurship, and enquiry boundaries are described without published coverage, unverified prices, or unverified POS locations |
| Payment page | IMPLEMENTED | Three approved categories described; no online checkout or payment method selection |
| Website USDT address configuration | TESTED | `DISABLED`; empty network list; former public addresses removed |
| USDT production networks | REQUIRES OWNER CONFIRMATION | Core has code-level adapters, but no network is confirmed production-enabled from verified chain/token/RPC/destination configuration |
| CeloHT route | VERIFIED (handoff boundary only) | Independent external DApp handoff; no FreClean settlement callback/verifier |
| Physical cash POS | NOT IMPLEMENTED | Policy is physical-only; no POS transaction workflow or verified location was found |
| Email addresses | VERIFIED | Both `contact@freclean.com` and `freclean7@gmail.com` remain active and represented |
| Email routing/delivery | REQUIRES OWNER CONFIRMATION | Local contract/configuration evidence does not verify production recipient overrides, sender identity, or delivery |
| Legal wording | IMPLEMENTED | Required Haiti-counsel statement is used; no completed-registration claim is made |
| Enquiry lifecycle | IMPLEMENTED | Submission is an enquiry; the site does not confirm bookings, orders, or payments |
| Production activation | BLOCKED | No deployment, live request submission, customer email, payment, or database mutation was performed |

## Findings and corrections

- Removed public static USDT addresses and donation address cards. No network is
  presented as available for self-service payment.
- Removed payment selection from the service enquiry flow so the website does
  not collect a payment preference or imply an online checkout.
- Removed the donation/payment UI. The entrepreneurship page now presents
  non-payment community opportunity enquiries.
- Removed the unsupported CeloHT official-partnership claim. CeloHT is described
  only as an independent external ecosystem.
- Removed the unverified physical address, geolocation metadata, founded-date
  and service-area claims from public markup.
- Removed unverified product price ranges until an owner confirms current
  pricing.
- Preserved both active email addresses and the specified legal-status wording.
- Added server-side access-token typing and a distinct production
  access/refresh-secret requirement in Core; added `dispute:close` permission
  enforcement; production app API URLs now require HTTPS.

## Core payment architecture

Core source contains code-level USDT adapters for BEP20/BNB Smart Chain,
TRC20/TRON, Solana mainnet-beta, and Celo. This is not a public supported-network
list: production RPC configuration, recipient ownership, token contract
identifiers, and enablement are not verified. The BNB token identifier is
specifically marked for independent authoritative verification. The website
does not display any of these networks or addresses.

CeloHT is an external DApp handoff without a Core settlement callback/verifier.
No cash point-of-sale API or app payment workflow was found in the reviewed
repositories. Legacy payment values in migrations/tests are not active
customer-facing methods.

## Email and legal status

Both active emails are preserved. Website and Core code use them in different
fallback/notification paths; the production owner must confirm intended
routing, reply-to, sender, and recipient configuration. Credentials were not
read or changed.

Public legal copy states: “FreClean is currently working with legal counsel in
Haiti to process its official business documentation and related legal
requirements.” Repository evidence does not establish completed registration,
licenses, permits, or certificates.

## Tests and build status

Website validation is run locally with:

- `npm test`
- `node --test scripts/request-workflow.test.js`
- `sh scripts/validate-site.sh`
- `npm run audit:i18n`
- `node --check script.js`

Core and app tests/builds are recorded in the four-repository audit report and
do not establish live deployment status. All tests are local; no real customer
transactions or emails are used.

## Production blockers and owner actions

1. Confirm production public-request routing, persistence, sender/recipient,
   reply-to behavior, and delivery for both active email addresses.
2. Verify each proposed USDT network's chain, authoritative token contract,
   decimals, destination ownership, RPC behavior, finality/confirmations,
   duplicate protection, and reconciliation in a non-production environment.
3. Keep USDT checkout disabled until the complete Core/app verification and
   authorization workflow has passed owner-approved testing.
4. Implement and authorize a physical POS workflow before claiming cash
   locations or transactions are operational.
5. Confirm current service coverage, product prices, product availability, and
   any POS locations before publishing those claims.
6. Obtain qualified review of privacy, consumer, tax, and other legal terms
   with counsel; this repository does not establish legal compliance.
7. Authorize a synthetic end-to-end enquiry and separate production rollout
   only after required external service configuration has been reviewed.

No production deployment, environment change, DNS edit, database mutation,
blockchain transaction, fund transfer, or customer email was performed.
