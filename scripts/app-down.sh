#!/usr/bin/env bash
# npm run app:down: stop the app servers and close the BrowserStack Local tunnel.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

had_servers="$(server_count)"
stop_servers
stop_tunnel
say "✓ Stopped $had_servers app servers and the BrowserStack Local tunnel"
