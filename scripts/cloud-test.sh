#!/usr/bin/env bash
# npm run test:chrome | test:firefox | test:android [-- <playwright args>]
# Runs the suite on BrowserStack against the servers and tunnel from `npm run app:up`.
#   chrome, firefox   the whole suite, one session per app server
#   android           the phone-layout cases on a real Android phone
# Any extra arguments go to Playwright, e.g. npm run test:chrome -- --grep GRID-001
set -euo pipefail
set +x   # never trace: a trace would echo the credentials
source "$(dirname "$0")/lib.sh"

platform="${1:-}"; shift || true
case "$platform" in chrome|firefox|android) ;; *) die "Usage: cloud-test.sh chrome|firefox|android [playwright args]" ;; esac

all_servers_healthy || die "The app isn't up. Run: npm run app:up"
require_credentials
tunnel_running || start_tunnel

# The servers serve the code they were built from. If the code has changed since (a fix, a
# checkout), rebuild and restart them so the tests never run against a stale app.
if [ "$(app_fingerprint)" != "$(cat "$STATE/app.fingerprint" 2>/dev/null)" ]; then
  say "▶ The app code has changed since the servers started, so restarting them first."
  start_servers "$(server_count)"
fi

servers="$(server_count)"
project=chromium
timeout=90000            # a cloud browser is several times slower than a local one
parallels="$servers"     # one session per app server
extra=()
if [ "$platform" = android ]; then
  project=mobile-chrome
  timeout=120000         # a real phone takes about a second per action
  parallels=$(( servers < 2 ? servers : 2 ))
  extra=(--grep "MOB-001|MOB-002")
fi

# The platform file, with the session count and the tunnel's identifier filled in.
config="$STATE/browserstack-$platform.yml"
perl -pe "s/^parallelsPerPlatform:.*/parallelsPerPlatform: $parallels/; s/^(\s+localIdentifier:).*/\$1 $LOCAL_ID/" \
  "$ROOT/playwright-tests/browserstack/$platform.yml" > "$config"

say "▶ $platform on BrowserStack: $parallels parallel sessions"
cd "$ROOT/playwright-tests"
set +e
BROWSERSTACK_CONFIG_FILE="$config" BASE_URLS="$(server_urls)" PW_PROJECT="$project" TEST_TIMEOUT="${TEST_TIMEOUT:-$timeout}" \
  npx -y "$SDK" playwright test ${extra[@]+"${extra[@]}"} "$@" 2>&1 | mask
status=${PIPESTATUS[0]}
set -e
[ "$status" -eq 0 ] && say "✓ $platform passed" || say "✗ $platform failed"
exit "$status"
