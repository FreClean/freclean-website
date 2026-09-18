# FreClean — Public Website

The public-facing marketing/informational site for FreClean. Static
HTML/CSS/JS, deployable to any static host (GitHub Pages, Netlify, etc.).

This site explains the business and starts customer requests — it is **not**
the internal app dashboard. For the customer/staff/admin application, see
`freclean-app`.

The four-repository boundary and current integration status are documented in
[`docs/architecture-2.0.md`](docs/architecture-2.0.md).

## Pages
- `index.html` — editorial homepage
- `services/` — residential, hospitality, commercial and specialized services
- `products/` — product collections and product detail route
- `business/` — business and B2B enquiries
- `about/` — company story and approach
- `contact/` — verified contact details and enquiry form
- `book/` — service request form
- `entrepreneurship/`, `impact/`, `resources/`, `privacy/`, `terms/` — supporting pages

The legacy `.html` pages remain in place for existing links and validation compatibility. New navigation uses the directory routes above.

## Development
No build step required — open `index.html` directly, or serve with any
static server, e.g. `npx serve .`

## Validation

Run the repository checks from the project root:

```sh
sh scripts/validate-site.sh
```

The site is intentionally static. The FreClean API currently exposes
authenticated booking and payment routes, but no public catalog or inquiry
route. This website therefore does not invent API data or claim to submit a
booking. Forms explain when online submission is unavailable and provide the
verified FreClean email address. A public request endpoint can be enabled later
with the runtime `FRECLEAN_PUBLIC_REQUEST_URL` hook without moving business
logic into the website. The configured `FRECLEAN_CELOHT_DAPP_URL` points to the
public CeloHT handoff; payment status still comes only from the API.
