# FreClean — Public Website

The public-facing marketing/informational site for FreClean. Static
HTML/CSS/JS, deployable to any static host (GitHub Pages, Netlify, etc.).

This site explains the business — it is **not** the internal app dashboard.
For the customer/staff/admin application, see `freclean-app`.

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
verified FreClean email address. When a supported public endpoint is released,
the optional `FRECLEAN_API_URL` runtime hook can be connected without moving
business logic into the website.
