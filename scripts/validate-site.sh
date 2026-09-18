#!/bin/sh
set -eu

site_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$site_dir"

pages='index.html services.html products.html payments.html entrepreneurship.html contact.html'
for page in $pages; do
  test -f "$page"
  grep -Eq 'href=".*style\.css([?].*)?"' "$page"
  grep -q '<main id="main-content">' "$page"
  grep -q 'class="skip-link"' "$page"
done

if grep -RniE 'c[uU][sS][dD]|css/style\.css' --include='*.html' --include='*.css' --include='*.md' --exclude='validate-site.sh' .; then
  echo 'Prohibited token or stale stylesheet path found' >&2
  exit 1
fi

grep -q 'https://freclean.github.io/freclean-website/</loc>' sitemap.xml
for page in services/ products/ business/ about/ contact/ book/; do
  grep -q "https://freclean.github.io/freclean-website/$page" sitemap.xml || {
    echo "Missing sitemap entry: $page" >&2
    exit 1
  }
done

for page in services/index.html products/index.html business/index.html entrepreneurship/index.html impact/index.html about/index.html resources/index.html contact/index.html book/index.html privacy/index.html terms/index.html 404.html; do
  test -f "$page"
  grep -q 'id="main-content"' "$page"
  grep -q 'class="skip-link"' "$page"
done

for page in services/airbnb/index.html services/hotel/index.html services/office/index.html products/fragrance-products/index.html; do
  test -f "$page"
  grep -q 'class="logo-link"' "$page"
done

test -f .env.example
grep -q '^VITE_API_URL=' .env.example
grep -q 'FRECLEAN_API_URL' script.js

echo 'FreClean website checks passed.'