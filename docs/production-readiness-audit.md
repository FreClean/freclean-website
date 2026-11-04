# Production Readiness Audit

Audit date: 2026-11-04
Repository: `FreClean/freclean-website`

## Repository Scope

This workspace contains a static HTML, CSS, and JavaScript website deployed by GitHub Pages plus a small Node contact API deployed separately on Render. It does not contain the Core API, authentication system, database migrations, Supabase integration, payment webhooks, or administrator application described by the platform architecture.

## Phase 1: Repository Audit

Files inspected include the public pages, `script.js`, `style.css`, `.github/workflows/pages.yml`, `.env.example`, `scripts/validate-site.sh`, `scripts/request-workflow.test.js`, `README.md`, `docs/architecture-2.0.md`, and repository configuration.

Results:

- Static deployment and validation baseline passes.
- The contact API runtime, package manifest, Render service configuration, and local delivery tests are present; database and admin infrastructure remain external.
- The GitHub Pages workflow validates and deploys static content; it does not build or deploy a backend.
- Local tests use a mocked email provider and do not prove that the deployed Render service can deliver production mail.
- No secrets were found by the repository secret-pattern check.
- `verified-publications.json` contains no publication records and is the only approved data source for verified customer feedback.

## Findings Repaired

### Public Request Payload

The booking form was collecting service, property type, space size, date, time, name, phone, email, location, notes, and payment preference, but the JavaScript payload did not preserve all of those values. The payload now preserves every `FormData` field and also adds the existing API aliases. A regression test verifies all booking fields.

### Success Confirmation

The frontend now requires HTTP `201` in addition to a JSON receipt with `received: true`. HTTP 200 or another ambiguous response does not report successful receipt.

### Unverified Customer Testimonials

Six static homepage testimonial cards were removed because they were not supported by verified publication records. The verification path now remains empty until records with consent and verification metadata are supplied.

## Remaining External Requirements

The following items require access to the separate Core repository or owner-operated infrastructure. They were not invented or simulated:

- Core API startup, route implementation, CORS policy, authentication, and authorization.
- Supabase project credentials, Session Pooler URL, SSL enforcement, and database access.
- Migration inventory, migration execution, schema constraints, indexes, and rollback procedure.
- Render build/start commands, health checks, environment variables, deployment logs, and scaling configuration.
- Database-backed request creation and retrieval tests using synthetic data.
- Administrator authentication and request status workflows.
- Audit logging and monitoring for the deployed service.
- Product inventory, orders, carts, delivery, refund, and cancellation implementation.
- Verified merchant credentials and signed payment provider sandbox integration before real payment activation.
- Owner review of verified business information, legal registration claims, product data, delivery promises, and tax obligations.
- Credentialed dependency review, SAST/DAST, and penetration testing.

## Live Read-Only External Findings

- The existing Core Render service is reachable, but its `/health/ready` endpoint currently reports database unavailability.
- CORS preflight from `https://freclean.com` to `POST /api/public/requests`: HTTP 204 with `Access-Control-Allow-Origin: https://freclean.com` observed.
- `https://app.celoht.com/`: HTTP 200 observed.

These checks did not submit customer data, mutate data, use credentials, or deploy anything.

## Production Blockers

The contact flow cannot be declared operational until the Render service is deployed with a verified Resend sender, its environment variables are set, and a real test enquiry is received at `freclean7@gmail.com`. The wider platform still requires the separate Core repository and infrastructure evidence described above.

## Validation Executed

- `sh scripts/validate-site.sh`
- `node --test scripts/request-workflow.test.js`
- `node --check script.js`

Current static checks pass and nine request-workflow tests pass. These results verify only the website-side implementation; they do not verify the external backend or database.
