# FreClean Architecture and Public-Site Boundary

Status: repository-side architecture record

## Repository responsibilities

| Repository | Responsibility | Authority |
| --- | --- | --- |
| `FreClean/freclean-website` | Public identity, service and product information, enquiries, and public policy | Presentation only; no authoritative booking, order, or financial state |
| `FreClean/FreClean` | Core API, business logic, persistence, authentication, authorization, and authoritative financial records | Sole backend authority for business state and payment verification |
| `FreClean/freclean-app` | Customer and staff-facing application workflows | Client interface; permissions and financial changes are enforced by Core |
| `FreClean/.github` | Organization standards, security policy, repository guidance, and shared architecture documentation | Governance; no product/business logic |

## Website requests

The static website sends service and contact enquiries to the configured public
request endpoint. The `/book/` form requests service details and a preferred
schedule, but it does not reserve a slot or collect payment details. Contact
and product forms remain enquiries; they do not confirm a booking, order,
availability, or transaction. The browser reports receipt only after an
explicit accepted API response. Local API tests do not establish that the
remote endpoint is operational, persistent, or delivering email.

## Payment policy

FreClean has three approved payment categories:

1. USDT only on a network that is technically verified and specifically
   confirmed for that transaction. The website has no public checkout or
   receiving-address display, and no USDT network is enabled here.
2. The separate CeloHT route. CeloHT is an independent ecosystem not owned or
   operated by FreClean. A DApp link is an external handoff, not proof of
   settlement or payment status.
3. Cash exclusively in person at FreClean-authorized physical points of sale.
   The website does not list a verified location and does not offer remote or
   online cash payment.

Backend adapter code is not proof of production activation. Frontend messages,
redirects, and submitted transaction references never establish payment.

## Public identity and contact

Both `contact@freclean.com` and `freclean7@gmail.com` are active. The website
contact form is configured for `contact@freclean.com`; other fallback and
notification roles vary by implementation and require owner confirmation.
Neither address is obsolete.

FreClean is currently working with legal counsel in Haiti to process its
official business documentation and related legal requirements. The site does
not claim completed registration, licenses, permits, or certifications.
Unverified service coverage, prices, and physical locations are not published
as confirmed facts.

## Security and deployment

The website is static and contains no server credentials, private wallet keys,
database credentials, or payment-provider secrets. Core owns payment
verification, idempotency, and authoritative status changes. GitHub Pages
deployment and external Render configuration are separate; repository-side
checks do not authorize or perform production deployment.
