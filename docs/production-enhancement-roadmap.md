# Production Enhancement Roadmap

This website now includes accessible site search, mobile-friendly request flows, explicit form loading and confirmation states, reduced-motion support, cache-busted shared assets, lazy image defaults, internal navigation prefetching, Haiti location metadata, and structured service data based only on verified business information.

The following capabilities require the Core/Render/Supabase owner environment and are not represented as active website features:

- Persistent rate limiting across instances, with an IP/privacy policy and alert thresholds.
- Structured logging, uptime monitoring, error alerting, dependency scanning and database backups.
- An authenticated enquiry dashboard with status history, staff permissions and audit events.
- CRM integration, notification retries and delivery reconciliation.
- Privacy-respecting analytics activated only after consent.
- Real customer photos, consented reviews, case studies and certifications supplied by FreClean.
- Google Business Profile ownership and verification by FreClean.

## Release checks

1. Run `sh scripts/validate-site.sh`.
2. Run `node --test scripts/request-workflow.test.js`.
3. Run `node --check script.js`.
4. Test keyboard navigation, focus visibility, reduced motion and mobile layouts.
5. Confirm all image alt text describes the actual asset and all customer publications have verification and consent metadata.
6. Validate structured data with Google's Rich Results Test after deployment.
7. Keep production credentials and provider keys in Render only.

No review, certification, case study, business listing, performance score or delivery result should be published until it has an owner-approved source and a repeatable verification record.
