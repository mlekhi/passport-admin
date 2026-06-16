#!/usr/bin/env bash
# Zip a static site and ship it to the passport gateway, which deploys it as
# its own Vercel project, protects it behind the org's login, and returns a
# shareable URL.
#
#   Usage: deploy.sh <site-directory>
#
# On success: prints the live URL (and nothing else) and exits 0.
# On failure: prints "ERROR <code>: <message>" to stderr and exits non-zero,
# so the caller can fix the bundle and retry. Known codes:
#   not_static | no_root_index | bad_zip | duplicate | empty | bad_request
set -euo pipefail

GATEWAY="https://passport-admin-tan.vercel.app/api/deploy"

dir="${1:-}"
if [ -z "$dir" ] || [ ! -d "$dir" ]; then
  echo "ERROR usage: deploy.sh <site-directory>" >&2
  exit 2
fi

bundle="$(mktemp -t passport-site-XXXXXX).zip"
trap 'rm -f "$bundle"' EXIT

# Zip the directory contents at the archive root (no wrapping folder). Courtesy
# excludes mirror what the gateway drops anyway, just to keep the upload small.
( cd "$dir" && zip -r -q -X "$bundle" . \
    -x '.git/*' '*/.git/*' 'node_modules/*' '*/node_modules/*' \
       '.DS_Store' '*/.DS_Store' '__MACOSX/*' '.env.local' '*/.env.local' )

# POST as a single .zip part; capture the JSON body and HTTP status separately.
response="$(curl -sS --max-time 180 -w $'\n%{http_code}' \
  -F "file=@${bundle};filename=site.zip" "$GATEWAY")"
code="${response##*$'\n'}"
body="${response%$'\n'*}"

field() { printf '%s' "$body" | python3 -c "import sys,json;print(json.load(sys.stdin).get('$1',''))" 2>/dev/null || true; }

if [ "$code" = "200" ]; then
  field url
  exit 0
fi

echo "ERROR $(field code): $(field error)" >&2
exit 1
