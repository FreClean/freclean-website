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

The legacy `.html` pages remain in place for existing links and validation compatibility. New navigation uses the directory routes above.

## Development
No build step required — open `index.html` directly, or serve with any
static server, e.g. `npx serve .`

## Validation

Run the repository checks from the project root:

```sh
sh scripts/validate-site.sh
```

The site is intentionally static. Set `FRECLEAN_API_URL` at deploy time when
the Core API is available; forms will then POST requests to its `/requests`
endpoint. Without that variable, forms direct visitors to the verified email
address instead of presenting a false success state. No payment processing,
authentication, or authoritative business logic is implemented here.
