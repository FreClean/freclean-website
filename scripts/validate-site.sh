#!/bin/sh
set -eu

site_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$site_dir"

base_url='https://freclean.github.io/freclean-website'
canonical_pages='index.html services/index.html services/residential/index.html services/hospitality/index.html services/commercial/index.html services/airbnb/index.html services/hotel/index.html services/office/index.html services/specialized/index.html products/index.html products/cleaning-essentials/index.html products/fragrance-products/index.html business/index.html entrepreneurship/index.html impact/index.html about/index.html resources/index.html contact/index.html book/index.html payments/index.html privacy/index.html terms/index.html 404.html'
legacy_pages='services.html products.html contact.html entrepreneurship.html payments.html'

fail() {
  printf 'Validation failed: %s\n' "$1" >&2
  exit 1
}

for page in $canonical_pages; do
  [ -f "$page" ] || fail "Missing canonical page: $page"
  grep -q '<title>[^<][^<]*</title>' "$page" || fail "Missing title: $page"
  grep -q 'name="description"' "$page" || fail "Missing description: $page"
  grep -q 'rel="canonical"' "$page" || fail "Missing canonical URL: $page"
  grep -q 'property="og:title"' "$page" || fail "Missing Open Graph title: $page"
  grep -q 'property="og:description"' "$page" || fail "Missing Open Graph description: $page"
  grep -q '<main[^>]*id="main-content"' "$page" || fail "Missing main content landmark: $page"
  grep -q 'class="skip-link"' "$page" || fail "Missing skip link: $page"
  grep -q 'class="site-header"' "$page" || fail "Missing shared header: $page"
  grep -q 'class="site-footer"' "$page" || fail "Missing shared footer: $page"
  case "$page" in
    index.html) expected_url="$base_url/" ;;
    404.html) expected_url="$base_url/404.html" ;;
    *) expected_url="$base_url/${page%/index.html}/" ;;
  esac
  grep -q "rel=\"canonical\" href=\"$expected_url\"" "$page" || fail "Incorrect canonical URL: $page"
done

for page in $legacy_pages; do
  [ -f "$page" ] || fail "Missing legacy redirect: $page"
  grep -q 'http-equiv="refresh"' "$page" || fail "Legacy page is not a redirect: $page"
done

[ -f robots.txt ] || fail 'Missing robots.txt'
[ -f sitemap.xml ] || fail 'Missing sitemap.xml'
[ -f site.webmanifest ] || fail 'Missing web manifest'
[ -f .env.example ] || fail 'Missing environment example'
grep -q '^FRECLEAN_PUBLIC_REQUEST_URL=' .env.example || fail 'Missing public request configuration'
grep -q '^FRECLEAN_CELOHT_DAPP_URL=https://app.celoht.com' .env.example || fail 'Invalid CeloHT environment configuration'
grep -q 'https://app.celoht.com/' payments/index.html || fail 'Missing canonical CeloHT CTA'

grep -RniE 'cUSD|USDM|https?://celoht\.com|brand-logo|logo-landscape-1|catalog-portrait-2|catalog-landscape-1' --include='*.html' --include='*.js' --include='*.md' --include='*.json' --include='*.xml' --include='*.txt' --include='*.webmanifest' . >/dev/null && fail 'Prohibited currency, direct CeloHT domain, or stale asset reference found' || true
grep -RniE 'service_role|SUPABASE_SERVICE_ROLE|sk_live_|private_key|BEGIN PRIVATE KEY' --exclude-dir=.git --exclude='validate-site.sh' . >/dev/null && fail 'Possible protected secret found in repository' || true
grep -q 'renderHeader\|renderFooter\|setupImages' script.js && fail 'Runtime UI or asset patch remains' || true
grep -RnE 'Booking confirmed|Message sent|Your message was sent' --include='*.html' --include='*.js' --exclude='validate-site.sh' . >/dev/null && fail 'Fake confirmation state found' || true

for page in $canonical_pages; do
  base=$(dirname "$page")
  for ref in $(grep -oE '(href|src)="[^"]+"' "$page" | cut -d'"' -f2); do
    case "$ref" in
      http:*|https:*|mailto:*|tel:*|\#*|data:*|javascript:*) continue ;;
    esac
    ref=${ref%%\?*}
    ref=${ref%%\#*}
    [ -n "$ref" ] || continue
    [ -e "$base/$ref" ] || fail "Broken local reference: $page -> $ref"
  done
done

blank_pages=$(grep -RIl 'target="_blank"' --include='*.html' . || true)
for page in $blank_pages; do
  grep -q 'target="_blank"[^>]*rel="[^"]*noopener' "$page" || fail "External blank-target link without noopener: $page"
done

for loc in $(grep -oE '<loc>[^<]+' sitemap.xml | sed 's#<loc>##'); do
  case "$loc" in
    "$base_url/" ) path='index.html' ;;
    "$base_url"/* ) path=${loc#"$base_url/"} ;;
    * ) fail "Unexpected sitemap URL: $loc" ;;
  esac
  case "$path" in
    */) path="$path/index.html" ;;
  esac
  [ -f "$path" ] || fail "Sitemap points to missing page: $loc"
  case "$loc" in
    *.html) [ "$path" = '404.html' ] || fail "Legacy HTML URL in sitemap: $loc" ;;
  esac
done

for page in $canonical_pages; do
  [ "$page" = '404.html' ] && continue
  case "$page" in
    index.html) route="$base_url/" ;;
    *) route="$base_url/${page%/index.html}/" ;;
  esac
  grep -q "<loc>$route</loc>" sitemap.xml || fail "Canonical page missing from sitemap: $page"
done

grep -q '^Sitemap: https://freclean.github.io/freclean-website/sitemap.xml$' robots.txt || fail 'Robots sitemap is incorrect'

echo 'FreClean production checks passed.'
