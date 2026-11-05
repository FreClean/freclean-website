# Architecture

Status: website and contact API only.

The repository contains static HTML/CSS/JavaScript served by GitHub Pages and a small Node.js contact API deployed separately on Render. The API validates anonymous enquiries and sends them through Resend. It does not own customer accounts, bookings, products, orders, inventory, payments, or admin data.

A production platform must add an authoritative Core API, relational database, migrations, authentication/RBAC, and an admin application before the public site can expose those workflows. The website must consume versioned HTTPS APIs and never access a database or provider secret directly.

See `docs/architecture-2.0.md` for the current multi-repository boundary and `docs/implementation-report.md` for the audit status.