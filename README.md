# FreClean Website

Public marketing website for **FreClean**, a Haiti-based business delivering cleaning services, cleaning & fragrance products, an entrepreneurship program, and Celo-powered digital payments.

FreClean is positioned for strategic partnership and investor interest as the business model and product offerings mature.

Part of the FreClean ecosystem (see `freclean-api`, `freclean-admin`, `freclean-dapp`, `freclean-payment`, `freclean-docs`, and other companion repositories).

## Status

This static website presents FreClean's business direction and digital product concept. Backend integrations are planned for future stages, and booking/payment systems will connect to `freclean-api` and `freclean-payment` as they become available.

## Pages

| Page | File | Status |
|---|---|---|
| Home | `index.html` | Live |
| Company / About | `about.html` | Live |
| Services | `services.html` | Live |
| Products | `products.html` | Live |
| Entrepreneurship | `entrepreneurship.html` | Live |
| Web3 Payments | `web3-payments.html` | Live |
| Contact / Book a Cleaning | `contact.html` | Live (online booking integration planned) |
| Policies | `policies.html` | Live (legal policy review in progress) |

## Tech

Plain HTML5 + CSS (no build step required). Fonts: Space Grotesk (display), Inter (body), IBM Plex Mono (data/technical). The main stylesheet is `style.css` at the repository root. The site is intentionally lightweight for performance and compatibility with GitHub Pages.

Images and static media
 - The site expects images to live under `assets/img/` to support caching and clean paths for GitHub Pages. Place the repository images into `assets/img/`:
	 - `logo.jpg`
	 - `hero-product.png`
	 - `about-boardroom.png`
	 - `contact-frontdesk.png`
	 - `entrepreneurship-market.png`
	 - `product-detail.png`
	 - `product-400ml.png`
	 - `services-team.png`
	 - `web3-checkout.png`
	 - `celoht-logo.png`

You can add optimized WebP/AVIF versions alongside the originals and update markup where needed.
Note: GitHub Actions workflow includes a CI step that generates `.webp` versions of `assets/img/*.png` and `assets/img/*.jpg` automatically during deployment; consider adding AVIF or higher-quality variants manually if desired.

## Running locally

No build tools required. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Data integrity rule

This repository follows FreClean's realism rule: **no invented business facts.** Verified details are presented clearly, while pricing, SKUs, registration numbers, and asset registry entries are published only after confirmation.

## Roadmap for this repo

- [ ] Connect booking form to `freclean-api` `/bookings`
- [ ] Connect Web3 checkout button to `freclean-dapp`
- [ ] Populate Supported Assets Registry from `freclean-payment` once an asset is verified
- [ ] Replace draft legal text on `policies.html` with reviewed copy
- [ ] Add automated HTML/CSS lint via `.github` CI

## Live Demo

Live Demo: https://freclean.github.io/freclean-website/

Production Website: https://freclean.com

Future Custom Domain: https://freclean-website.io (not configured)

## License

Not provided.

## Contact

FreClean | freclean7@gmail.com | +1 (849) 388-1969 | Léogâne, Ouest, Haiti
