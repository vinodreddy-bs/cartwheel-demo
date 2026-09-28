#!/usr/bin/env bash
# npm run test:visual [-- <playwright args>]
# Percy snapshots of the main pages (tests tagged @visual), taken against the app server from
# `npm run app:up`. Percy compares them with the latest approved build of the base branch.
set -euo pipefail
set +x   # never trace: a trace would echo the token
source "$(dirname "$0")/lib.sh"

all_servers_healthy || die "The app isn't up. Run: npm run app:up"
load_percy_token || die "No Percy token. Export PERCY_TOKEN, or store it in the macOS Keychain
  (see \"Visual snapshots with Percy\" in playwright-tests/README.md)."

# Same rule as the cloud runs: never snapshot a stale build.
if [ "$(app_fingerprint)" != "$(cat "$STATE/app.fingerprint" 2>/dev/null)" ]; then
  say "▶ The app code has changed since the servers started, so restarting them first."
  start_servers "$(server_count)"
fi

say "▶ Percy snapshots of $(git -C "$ROOT" branch --show-current 2>/dev/null || echo 'this checkout')"
cd "$ROOT/playwright-tests"
set +e
BASE_URL="http://localhost:$FIRST_PORT" VISUAL=1 \
  npx percy exec -- playwright test --grep @visual --project=chromium "$@" 2>&1 | mask
status=${PIPESTATUS[0]}
set -e
exit "$status"
