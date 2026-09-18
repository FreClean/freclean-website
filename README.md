# FreClean — Public Website

The public-facing marketing/informational site for FreClean. Static
HTML/CSS/JS, deployable to any static host (GitHub Pages, Netlify, etc.).

This site explains the business — it is **not** the internal app dashboard.
For the customer/staff/admin application, see `freclean-app`.

## Pages
- `index.html` — home: what is FreClean, services, products, trust
- `services.html` — cleaning services catalog
- `products.html` — product catalog
- `payments.html` — how payment works (Crypto / Card / Cash)
- `entrepreneurship.html` — entrepreneurship programs
- `contact.html` — contact / support

## Development
No build step required — open `index.html` directly, or serve with any
static server, e.g. `npx serve .`

## Validation

Run the repository checks from the project root:

```sh
sh scripts/validate-site.sh
```

The site is intentionally static. It does not connect to a database or
payment processor. Booking, authentication, payment verification and other
authoritative business behavior belong to the FreClean Core API and are not
implemented in this repository.
