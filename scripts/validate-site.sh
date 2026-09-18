#!/bin/sh
set -eu

site_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$site_dir"

pages='index.html services.html products.html payments.html entrepreneurship.html contact.html'
for page in $pages; do
  test -f "$page"
  grep -q 'href="style.css"' "$page"
  grep -q '<main id="main-content">' "$page"
  grep -q 'class="skip-link"' "$page"
done

if grep -RniE 'cUSD|css/style\.css' --include='*.html' --include='*.css' --include='*.md' .; then
  echo 'Prohibited token or stale stylesheet path found' >&2
  exit 1
fi

grep -q 'https://www.freclean.com/</loc>' sitemap.xml
for page in services.html products.html payments.html entrepreneurship.html contact.html; do
  grep -q "https://www.freclean.com/$page" sitemap.xml || {
    echo "Missing sitemap entry: $page" >&2
    exit 1
  }
done

echo 'FreClean website checks passed.'