#!/usr/bin/env bash
# npm run test:visual [-- <playwright args>]
# Percy snapshots of the main pages (tests tagged @visual), from the repo root or playwright-tests/.
# Percy compares them with the latest approved build of the base branch.
set -euo pipefail
set +x   # never trace: a trace would echo the token
source "$(dirname "$0")/lib.sh"

load_percy_token || die "No Percy token. Export PERCY_TOKEN, or store it in the macOS Keychain
  (see \"Visual snapshots with Percy\" in playwright-tests/README.md)."

# With `npm run app:up` running, snapshot its first server (restarted first if the code changed, so
# a stale build is never snapshotted). Without it, Playwright starts its own app on port 5001.
target=()
if all_servers_healthy; then
  if [ "$(app_fingerprint)" != "$(cat "$STATE/app.fingerprint" 2>/dev/null)" ]; then
    say "▶ The app code has changed since the servers started, so restarting them first."
    start_servers "$(server_count)"
  fi
  target=("BASE_URL=http://localhost:$FIRST_PORT")
elif lsof -ti "tcp:$FIRST_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  die "Port $FIRST_PORT is already in use, usually by \`npm run dev\`. Stop it (Ctrl+C in its terminal),
  or start the test servers with \`npm run app:up\`, then run this again."
fi

say "▶ Percy snapshots of $(git -C "$ROOT" branch --show-current 2>/dev/null || echo 'this checkout')"
cd "$ROOT/playwright-tests"
set +e
env ${target[@]+"${target[@]}"} VISUAL=1 \
  npx percy exec -- playwright test --grep @visual --project=chromium "$@" 2>&1 | mask
status=${PIPESTATUS[0]}
set -e
exit "$status"
