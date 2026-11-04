#!/bin/sh
set -eu

site_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$site_dir"

base_url='https://freclean.com'
canonical_pages='index.html services/index.html services/residential/index.html services/hospitality/index.html services/commercial/index.html services/airbnb/index.html services/hotel/index.html services/office/index.html services/specialized/index.html products/index.html products/cleaning-essentials/index.html products/fragrance-products/index.html business/index.html entrepreneurship/index.html impact/index.html about/index.html resources/index.html contact/index.html book/index.html payments/index.html privacy/index.html terms/index.html partners/index.html journal/index.html press/index.html legal/index.html legal/complaints-dispute-resolution/index.html legal/cookie-policy/index.html legal/returns-policy/index.html legal/refund-policy/index.html legal/shipping-policy/index.html legal/accessibility-statement/index.html 404.html'
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
  [ "$(grep -o '<main[^>]*id="main-content"' "$page" | wc -l)" -eq 1 ] || fail "Expected exactly one main landmark: $page"
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
[ -f docs/integration-map.md ] || fail 'Missing integration dependency map'
[ -f docs/production-readiness-audit.md ] || fail 'Missing production readiness audit'
grep -q 'Run request workflow tests' .github/workflows/pages.yml || fail 'Workflow is missing request workflow tests'
grep -q 'Check JavaScript syntax' .github/workflows/pages.yml || fail 'Workflow is missing JavaScript syntax validation'
grep -q '^FRECLEAN_PUBLIC_REQUEST_URL=' .env.example || fail 'Missing public request configuration'
grep -q '^FRECLEAN_CELOHT_DAPP_URL=https://app.celoht.com' .env.example || fail 'Invalid CeloHT environment configuration'
grep -q '^FRECLEAN_SITE_BASE_URL=' .env.example || fail 'Missing public site URL configuration'
grep -q '^FRECLEAN_SUPPORT_EMAIL=' .env.example || fail 'Missing support email configuration'
[ -f verified-publications.json ] || fail 'Missing verified publications data file'
grep -q 'verifiedPublication' verified-publications.json || fail 'Verified publication data policy missing'
grep -q 'data-service-estimate' book/index.html || fail 'Service quote status is missing'
grep -q '\$6\.99–\$7\.99 US each' products/index.html || fail 'Product price range is missing'
grep -q 'Verified customer feedback' index.html || fail 'Verified feedback section heading is missing'
grep -q 'Submit feedback' index.html || fail 'Customer feedback submission link is missing'
grep -q 'Share your experience with FreClean' index.html || fail 'Customer feedback copy is missing'
grep -q 'class="testimonial-grid"' index.html || fail 'Verified feedback container is missing'
[ "$(grep -o 'class="testimonial-card"' index.html | wc -l)" -eq 0 ] || fail 'Unverified static testimonial cards found'
grep -q '"publications": \[\]' verified-publications.json || fail 'Verified publication allowlist is not empty/explicitly enforced'
grep -q 'booking-size' book/index.html || fail 'Service estimate space-size field is missing'
grep -REn '<(span|legend)[^>]*>0[1-9]|Services[[:space:]]*·[[:space:]]*0[1-9]|>0[1-9][[:space:]]*/' --include='*.html' . >/dev/null && fail 'Decorative zero-padded site numbering found' || true
grep -q 'Current price, size, availability and eligible delivery terms are confirmed by FreClean' products.json || fail 'Product pricing policy is missing'
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('products.json','utf8')); if (!data.products || data.products.some(product => !product.availability || !product.price || !product.availableSizes)) process.exit(1)" || fail 'Product availability data is incomplete'
grep -q 'data-verified-publications' index.html || fail 'Verified customer publication section is missing'
grep -q 'https://app.celoht.com/' payments/index.html || fail 'Missing canonical CeloHT CTA'
grep -q 'mailto:freclean7@gmail.com?subject=' script.js || fail 'Missing actionable email fallback'
node --test scripts/request-workflow.test.js || fail 'Request workflow tests failed'
[ -f legal/index.html ] || fail 'Missing legal center landing page'
[ -f legal/complaints-dispute-resolution/index.html ] || fail 'Missing complaints and dispute resolution page'
[ -f legal/cookie-policy/index.html ] || fail 'Missing cookie policy page'
[ -f legal/returns-policy/index.html ] || fail 'Missing returns policy page'
[ -f legal/refund-policy/index.html ] || fail 'Missing refund policy page'
[ -f legal/shipping-policy/index.html ] || fail 'Missing shipping policy page'
[ -f legal/accessibility-statement/index.html ] || fail 'Missing accessibility statement page'
# Consent banner and legal center requirements are intentionally enforced for production readiness.
grep -q 'cookie' script.js || fail 'Cookie consent implementation missing' || true

grep -RniE 'cUSD|USDM|https?://celoht\.com|logo-landscape-1|catalog-portrait-2|catalog-landscape-1' --include='*.html' --include='*.js' --include='*.md' --include='*.json' --include='*.xml' --include='*.txt' --include='*.webmanifest' . >/dev/null && fail 'Prohibited currency, direct CeloHT domain, or stale asset reference found' || true
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

grep -q "^Sitemap: $base_url/sitemap.xml$" robots.txt || fail 'Robots sitemap is incorrect'

echo 'FreClean production checks passed.'
