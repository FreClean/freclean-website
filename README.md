# FreClean Website

Public marketing website for **FreClean** — professional cleaning services, cleaning & fragrance products, entrepreneurship program, and Celo-powered Web3 payments, based in Léogâne, Ouest, Haiti.

Part of the FreClean ecosystem (see `freclean-api`, `freclean-admin`, `freclean-dapp`, `freclean-payment`, `freclean-docs`, and other companion repositories).

## Status

**In development.** Static front-end only — no backend is connected yet. The booking form on `contact.html` and the Supported Assets Registry on `web3-payments.html` are placeholders that will connect to `freclean-api` and `freclean-payment` respectively.

## Pages

| Page | File | Status |
|---|---|---|
| Home | `index.html` | Live |
| Company / About | `about.html` | Live |
| Services | `services.html` | Live |
| Products | `products.html` | Live |
| Entrepreneurship | `entrepreneurship.html` | Live |
| Web3 Payments | `web3-payments.html` | Live |
| Contact / Book a Cleaning | `contact.html` | Live (form not yet connected) |
| Policies | `policies.html` | Live (legal text is a working draft) |

## Tech

Plain HTML5 + CSS (no build step required). Fonts: Space Grotesk (display), Inter (body), IBM Plex Mono (data/technical). See `assets/css/style.css` for the full design token system (colors, type scale, the "wipe" divider signature element).

## Running locally

No build tools required — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Data integrity rule

This repository follows FreClean's realism rule: **no invented business facts.** Anything not yet verified (pricing, SKUs, registration numbers, asset registry entries) is explicitly labeled `Not provided`, `In development`, or `Planned` rather than filled in with placeholder-looking real data.

## Roadmap for this repo

- [ ] Connect booking form to `freclean-api` `/bookings`
- [ ] Connect Web3 checkout button to `freclean-dapp`
- [ ] Populate Supported Assets Registry from `freclean-payment` once an asset is verified
- [ ] Replace draft legal text on `policies.html` with reviewed copy
- [ ] Add automated HTML/CSS lint via `.github` CI

## License

Not provided.

## Contact

FreClean — freclean7@gmail.com — +1 (849) 388-1969 — Léogâne, Ouest, Haiti
