#!/usr/bin/env bash
# npm run app:up: get everything ready for cloud runs, once, before you start testing.
#   - builds the app and starts APP_SERVERS app servers (default 24) on ports 5001, 5002, …
#   - opens a BrowserStack Local tunnel so BrowserStack's browsers can reach them
# Run it again (or npm run app:restart) to rebuild and restart the servers and reopen the tunnel.
set -euo pipefail
set +x   # never trace: a trace would echo the credentials
source "$(dirname "$0")/lib.sh"

count="${APP_SERVERS:-24}"
[[ "$count" =~ ^[1-9][0-9]?$ ]] || die "APP_SERVERS must be a number from 1 to 99"
mkdir -p "$STATE"

if [ ! -d "$ROOT/node_modules" ] || [ ! -d "$ROOT/client/node_modules" ] || [ ! -d "$ROOT/server/node_modules" ]; then
  say "▶ Installing app dependencies …"
  ( cd "$ROOT" && npm run install:all ) >"$STATE/install.log" 2>&1 || die "Install failed; see .cartwheel/install.log"
fi
if [ ! -d "$ROOT/playwright-tests/node_modules" ]; then
  say "▶ Installing test dependencies …"
  ( cd "$ROOT/playwright-tests" && npm install ) >>"$STATE/install.log" 2>&1 || die "Install failed; see .cartwheel/install.log"
fi

start_servers "$count"
say "✓ $count app servers are up"

if load_credentials; then
  # Always a fresh tunnel: BrowserStack can drop a tunnel while its process keeps running, and
  # re-running app:up is the one fix for anything that looks wrong.
  stop_tunnel
  start_tunnel
  say "✓ BrowserStack Local tunnel is open ($LOCAL_ID)"
  say ""
  say "Ready. Run:  npm run test:chrome  |  npm run test:firefox  |  npm run test:android"
else
  say "! No BrowserStack credentials, so no tunnel was opened. The servers are ready for local runs:"
  say "  BASE_URLS=$(server_urls) npm --prefix playwright-tests test"
fi
say "Stop everything with: npm run app:down"
