# FreClean Integration Map and Production Dependencies

Audit date: 2026-11-04
Scope: `FreClean/freclean-website` only

## Integration Map

| Component | Current repository | Required external repository/service | Required configuration | Credentials required | Safe verification | Current status |
|---|---|---|---|---|---|---|
| Public website | Implemented as static HTML/CSS/JS | GitHub Pages, GitHub repository settings, DNS | `CNAME=freclean.com`; Pages custom domain; HTTPS; canonical URLs | GitHub repository/pages permissions | Workflow validation, HTTPS request, redirect and sitemap checks | Implemented; live DNS/Pages state not automatically verified |
| Public request client and notification API | Implemented in `script.js`; delivery is owned by `FreClean/FreClean` Core API | `https://api.freclean.com` | `FRECLEAN_PUBLIC_REQUEST_URL=https://api.freclean.com/api/public/requests`; HTTPS origin and approved CORS; request type must be `SERVICE` or `CONTACT` | Core-owned notification provider secrets stay in Render | Check health, CORS, rejected payloads, then a controlled valid enquiry and delivery receipt | Health/CORS and validation observed; website payload contract corrected locally; real delivery remains unverified |
| API health | Not implemented in this repository | Core API on Render | `GET /health` and `GET /health/ready` | No secret for public health checks unless policy changes them | `/health` must return 200; `/health/ready` 200 only when dependencies are healthy; 503 otherwise | `https://api.freclean.com/health` 200 observed; readiness not checked |
| Database | No database code or migrations here | Supabase plus Core API | `DATABASE_URL` and Supabase Session Pooler settings, SSL enforcement, pool limits | Server-only database credential owned in Render/Core; never expose it here | Migration status, read/write synthetic data, pool health, `/health/ready` 200 | Unverified; no database code or credentials in this workspace |
| Core API and migrations | No code here | `FreClean/FreClean` repository | Start command, build command, API routes, migration command, environment variables | Server secrets owned by the Core deployment | Startup logs, migration replay in isolated environment, contract tests, error/validation tests | Components are only referenced in documentation; inaccessible and unverified |
| Authentication/RBAC | No auth UI here | Core API and `FreClean/freclean-app` | JWT/session policy, role definitions, protected route policy, secure cookies or approved token handling | Server signing secrets; admin credentials | Synthetic login, role denial, session expiry, protected route tests | Not implemented in this repository; external dependency |
| Administrator dashboard | Not present | `FreClean/freclean-app`, then Core API | Admin route, staff permissions, request/status endpoints, content/product/order APIs | Admin authentication and authorizations owned outside this repository | Create synthetic record, authenticate admin, retrieve, change status, verify audit trail | Not accessible; no fake admin functionality created |
| Products and inventory | Static catalog JSON only | Core API plus database and admin application | Product/SKU/category/pricing/inventory schemas and management endpoints | Server/database credentials | Synthetic CRUD, availability behavior, inventory update consistency | Static presentation exists; commercial inventory/order operations unverified |
| Orders/bookings/returns | Website enquiry flow only | Core API, database, app/admin client | Booking/order/customer/status schemas; cancellation/refund rules | Server/database/admin credentials | Synthetic end-to-end create/read/status/refund tests | No live operations confirmed |
| Notifications | Core API notification pipeline; email fallback in browser | Core notification provider and Render | Core-owned provider configuration; do not infer provider variables from this static-site repository | Provider secrets owned by Core/Render | Core queue/worker tests and controlled real enquiry receipt | Website/Core contract checked; production notification delivery requires Core verification |
| USDT and CeloHT payments | Manual USDT address display from `payments/payment-addresses.json` and separate CeloHT handoff | Core payment database/verifiers; CeloHT remains a separate handoff | Public receiving addresses are static website configuration; authenticated Core payment contract is separate | RPC/provider secrets stay in Core/Render; no wallet secret belongs in this repository | Address/copy tests; manual receipt remains direct, automated checkout and production RPC tests are outstanding | Manual transfers are supported by the address page; no order association, automatic verification, or website checkout |
| Secrets and dependency supply chain | `.env.example` contains public values only | Repository/org secrets, Render, provider dashboards | Server-only secret variables; rotation and least privilege | Owner-managed | Secret scanner, dependency audit, access review, rotate exposed credentials | No secrets found in current repository; external security state unknown |

## Environment Variables Referenced Here

| Name | Scope | Current status |
|---|---|---|
| `FRECLEAN_SITE_BASE_URL` | Public static-site base | Documented public URL; not consumed by server runtime |
| `FRECLEAN_PUBLIC_REQUEST_URL` | Browser/public API URL | Existing Core API URL; production delivery remains unverified |
| `FRECLEAN_CELOHT_DAPP_URL` | Browser public CeloHT URL | Public URL and separate route |
| `FRECLEAN_SUPPORT_EMAIL` | Public support email | Public contact fallback value |
| `FRECLEAN_PUBLIC_API_BASE_URL` | Documented server-side/API base | No server runtime consumes this variable in this repository |
| `FRECLEAN_PUBLIC_API_TIMEOUT_MS` | Documented server API timeout | No server runtime consumes this variable in this repository |
| `RESEND_API_KEY` | Render-only server secret | Required in Render; never expose in frontend or repository |
| `RESEND_FROM_EMAIL` | Render-only server configuration | Must be a sender verified by Resend |
| `ALLOWED_ORIGINS` | Render server CORS policy | Set to `https://freclean.com` in production |

Names that must be sourced from separate Core/Render/Supabase/provider repositories, not invented here:

- `DATABASE_URL`
- Supabase connection variables and project identifiers chosen by the Core deployment
- Render environment variables for Core startup and migrations
- Authentication/JWT or session secrets
- Payment provider API keys and webhook signing secrets, if providers are approved
- Notification provider credentials

Do not place any secret value in `.env.example`, GitHub Pages JavaScript, HTML, documentation, logs, or pull requests.

## Exact Missing Dependencies

### Core Public Request Contract

- **Exact dependency:** Implemented and documented `POST /api/public/requests` in `FreClean/FreClean`.
- **Why required:** Service/contact/partner submissions require persistence and retrievable admin workflow.
- **Configure:** Render service environment and Core API route/CORS configuration.
- **Credentials:** No credential belongs in website source; Core credentials belong server-side and remain outside chat.
- **Verify:** CORS preflight, synthetic POST, HTTP 201 + `received:true` + `requestId`, duplicate retry behavior, and database retrieval. `/health/ready` must be 200.
- **Separate owner:** `FreClean/FreClean` and Render/Supabase owner.

### Supabase Database

- **Exact dependency:** Supabase project with database access through a Session Pooler connection.
- **Why required:** The public request contract and future products/orders/bookings cannot persist safely without it.
- **Configure:** Core service uses server-only `DATABASE_URL` from the approved Supabase Session Pooler settings with SSL enabled.
- **Credentials:** Database credential belongs only in Render secrets; do not paste a connection string into chat.
- **Verify:** Migration status, synthetic transaction with rollback in a non-production database, pool metrics, and readiness dependency check.
- **Separate owner:** Supabase project owner and Core repository maintainer.

### Migration and Schema Layer

- **Exact dependency:** Versioned migrations for customer requests, customers, services, products/SKU/inventory, orders, bookings, statuses, payments, audit records, and their indexes/FKs.
- **Why required:** Prevent contract/database drift and provide reversible schema changes.
- **Configure:** Core migration command in Render build/start or an explicitly authorized manual deployment process.
- **Credentials:** Migration database role in server-only environment configuration.
- **Verify:** Fresh database migration from empty schema and reviewed up/down migration behavior in a non-production environment.
- **Separate owner:** Core repository and database owner.

### Authentication and Administration

- **Exact dependency:** Core auth/RBAC and `freclean-app` staff/admin experience.
- **Why required:** Authorized retrieval of requests, status updates, product/order management, and audit access.
- **Configure:** Core auth routes and `freclean-app` API base; protect every administrative operation server-side.
- **Credentials:** Auth/session signing values and synthetic admin test account owned outside the static site.
- **Verify:** Synthetic denied/allowed requests, token/session expiry, role boundaries, status audit trail.
- **Separate owner:** Core and app repositories.

### Notification Workflow

- **Exact dependency:** Approved notification provider or supported email service in Core.
- **Why required:** Accurate customer acknowledgement after database-confirmed requests only.
- **Configure:** Server-side provider credentials and templates in Core/Render.
- **Credentials:** Provider API key owned server-side.
- **Verify:** Sandbox or synthetic address delivery; no real customer data.
- **Separate owner:** Core repository/provider account.

### USDT Payment API and Verification

- **Exact dependency:** Authenticated Core payment API, production database, verified token identifiers, and reliable RPC providers.
- **Why required:** Server-authoritative amounts and addresses, network verification, duplicate prevention, and payment status.
- **Configure:** Core/Render server-only database and RPC settings; keep `USDT_PAYMENTS_ENABLED` disabled until verification and production readiness checks pass.
- **Credentials:** RPC/provider credentials remain server-side in Core/Render; never expose them in browser code.
- **Verify:** Wrong-network/token/recipient, underpayment, failed transaction, finality, replay, refund/cancellation, and confirmed-only paid-state tests.
- **Separate owner:** Core repository and Render/database owner.

### Internationalization

- **Exact dependency:** Translation and locale catalogs if multilingual operation is required.
- **Why required:** Navigation, forms, validation, and notification consistency for English, Spanish, French, and Haitian Creole.
- **Configure:** Static locale resources in this repository plus server notification locale support in Core.
- **Credentials:** None.
- **Verify:** Native-language review by qualified reviewers and browser rendering checks.
- **Separate owner:** Content owner plus Core/app repositories.

## Repository Components That Already Exist According to Repository Evidence

- Static public pages and navigation.
- Booking/contact/partner request forms.
- Browser payload handling, duplicate in-flight protection, fallback email drafting, and strict success receipt behavior.
- Static product catalogue and policy boundaries.
- GitHub Pages deployment workflow.
- Static validation and request workflow unit tests.
- CeloHT public link boundary.
- Verified-publication allowlist with no records currently published.

## Repository Components Not Accessible or Not Present

- Core API implementation and migrations.
- Supabase project/schema.
- Render service/runtime configuration.
- Authentication/RBAC implementation.
- Admin application.
- Orders, inventory, customer records, delivery, refunds, and status backend.
- Payment processors, webhook code, or signed payment verification.
- Notification provider implementation.
- Multilingual runtime catalogs.

## Prioritized Production-Readiness Report

### P0: Current blockers

1. Restore `/health/ready` to return 503 when Supabase or required dependencies are unavailable and 200 only when genuinely healthy.
2. Implement and test the public request contract against synthetic data; do not enable the frontend as confirmed operational without an HTTP 201/database retrieval evidence chain.
3. Keep the public endpoint inaccessible if database persistence is not available. Do not weaken the frontend success check.

### P1: Required external implementation

1. Supabase Session Pooler, SSL, pooling, migrations, constraints, indexes, and rollback procedure in Core/Render.
2. Authentication/RBAC and protected admin request/status operations in Core and app repositories.
3. Audit logging, duplicate protection, rate limiting, notifications, and synthetic end-to-end tests.

### P2: Commercial expansion

1. Product/SKU/inventory/customer/order schemas and administration.
2. Booking, delivery, cancellation, refund, and status workflows.
3. USDT token-identifier verification, all-network provider tests, duplicate transaction protection, and an authenticated website checkout before activation.
4. English, Spanish, French, and Haitian Creole catalogs and notification templates.

### P3: Website continuity

1. Explicit CI Node setup and request tests are now present.
2. Static catalogue and payment boundaries remain truthful and require no fake backend behavior.
3. Verified customer records may only be rendered after owner-provided consent and verification evidence.

## Owner Actions Required

- Approve and provide access to Core, Supabase, Render, app/admin, and payment-provider resources outside this workspace.
- Configure server-only credentials in Core/Render/provider dashboards. Do not send credentials in chat or source files.
- Approve production payment activation only after the website-to-Core authenticated checkout and all network verification checks pass.
- Provide qualified translation review and verified business/product information.
- Run coordinated Core/app/website testing using synthetic customer data and authorize production rollout separately.

