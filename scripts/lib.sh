# Shared helpers for app-up.sh, app-down.sh and cloud-test.sh. Sourced, not run.
#
# State lives in .cartwheel/ at the repo root (git-ignored):
#   servers           "<pid> <port>" for each app server
#   app.fingerprint   which version of the app code the servers were built from
#   tunnel.pid        the BrowserStack Local tunnel
#   *.log             build, server and tunnel logs

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE="$ROOT/.cartwheel"
FIRST_PORT=5001
LOCAL_ID="${BROWSERSTACK_LOCAL_IDENTIFIER:-cartwheel-demo}"
LOCAL_BIN="${BROWSERSTACK_LOCAL_BINARY:-$HOME/.browserstack/BrowserStackLocal}"
SDK="${BROWSERSTACK_SDK:-browserstack-node-sdk@1.71.0}"

say() { printf '%s\n' "$*"; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

# --- credentials ----------------------------------------------------------------------------------
# From the environment, or else from the macOS Keychain. Never printed.
load_credentials() {
  if command -v security >/dev/null 2>&1; then
    [ -n "${BROWSERSTACK_USERNAME:-}" ] || BROWSERSTACK_USERNAME="$(security find-generic-password \
      -s "${BROWSERSTACK_KEYCHAIN_USERNAME:-cartwheel-browserstack-username}" -w 2>/dev/null || true)"
    [ -n "${BROWSERSTACK_ACCESS_KEY:-}" ] || BROWSERSTACK_ACCESS_KEY="$(security find-generic-password \
      -s "${BROWSERSTACK_KEYCHAIN_ACCESS_KEY:-cartwheel-browserstack-access-key}" -w 2>/dev/null || true)"
  fi
  [ -n "${BROWSERSTACK_USERNAME:-}" ] && [ -n "${BROWSERSTACK_ACCESS_KEY:-}" ] || return 1
  export BROWSERSTACK_USERNAME BROWSERSTACK_ACCESS_KEY
}

require_credentials() {
  load_credentials || die "No BrowserStack credentials. Export BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY,
  or store them in the macOS Keychain (see playwright-tests/README.md, \"Run on BrowserStack Automate\")."
}

# Masks the access key if a tool ever prints it. The key is read from the environment, not from
# the command line, so it never shows up in the process list.
mask() { perl -pe 'BEGIN { $| = 1; $k = $ENV{BROWSERSTACK_ACCESS_KEY} } s/\Q$k\E/****/g if length $k'; }

# --- app servers ----------------------------------------------------------------------------------
server_count() { [ -f "$STATE/servers" ] && wc -l < "$STATE/servers" | tr -d ' ' || echo 0; }
server_urls() { awk '{ printf "%shttp://localhost:%s", (NR > 1 ? "," : ""), $2 }' "$STATE/servers"; }
healthy() { curl -sf "http://localhost:$1/api/health" >/dev/null 2>&1; }

all_servers_healthy() {
  [ -f "$STATE/servers" ] || return 1
  local pid port
  while read -r pid port; do healthy "$port" || return 1; done < "$STATE/servers"
}

# Changes whenever the app code changes: a new commit, a checkout, or an uncommitted edit.
app_fingerprint() {
  ( cd "$ROOT" && {
      git rev-parse HEAD 2>/dev/null
      git diff HEAD -- client server 2>/dev/null
      git ls-files --others --exclude-standard -- client server 2>/dev/null | while read -r f; do shasum "$f"; done
    } ) | shasum | cut -d' ' -f1
}

stop_servers() {
  [ -f "$STATE/servers" ] || return 0
  local pid port
  while read -r pid port; do
    # Only stop the process we started (a pid can be reused after a reboot).
    case "$(ps -p "$pid" -o comm= 2>/dev/null)" in *node*) kill "$pid" 2>/dev/null || true ;; esac
  done < "$STATE/servers"
  rm -f "$STATE/servers" "$STATE/app.fingerprint"
}

# Builds the client once, then starts $1 servers on ports 5001, 5002, …, each with its own data.
start_servers() {
  local count="$1" i port
  stop_servers
  for ((i = 0; i < count; i++)); do
    port=$((FIRST_PORT + i))
    if lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null 2>&1; then
      die "Port $port is already in use by another program. Stop it (lsof -ti :$port shows it) and try again."
    fi
  done

  say "▶ Building the app ($(git -C "$ROOT" branch --show-current 2>/dev/null || echo 'no git')) …"
  ( cd "$ROOT" && npm run build ) >"$STATE/build.log" 2>&1 || die "Build failed; see .cartwheel/build.log"

  say "▶ Starting $count app servers on ports ${FIRST_PORT}–$((FIRST_PORT + count - 1)) …"
  : > "$STATE/servers"
  for ((i = 0; i < count; i++)); do
    port=$((FIRST_PORT + i))
    # Each server gets its own session (POSIX setsid), so it keeps running after `npm run app:up`
    # returns: npm and some shells stop the whole process group of a script when it ends.
    ( cd "$ROOT" && PORT="$port" NODE_ENV=production ENABLE_TEST_HOOKS=1 \
        exec perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV or die "exec: $!"' node server/index.js \
        >"$STATE/server-$port.log" 2>&1 </dev/null ) &
    echo "$! $port" >> "$STATE/servers"
  done
  local pid tries
  while read -r pid port; do
    for tries in $(seq 1 60); do healthy "$port" && break; sleep 0.5; done
    healthy "$port" || die "App server on :$port did not start; see .cartwheel/server-$port.log"
  done < "$STATE/servers"
  app_fingerprint > "$STATE/app.fingerprint"
}

# --- BrowserStack Local tunnel --------------------------------------------------------------------
tunnel_running() {
  [ -f "$STATE/tunnel.pid" ] || return 1
  local pid; pid="$(cat "$STATE/tunnel.pid")"
  case "$(ps -p "$pid" -o comm= 2>/dev/null)" in *BrowserStackLocal*) return 0 ;; *) return 1 ;; esac
}

ensure_local_binary() {
  [ -x "$LOCAL_BIN" ] && return 0
  local os arch zip
  case "$(uname -s)" in Darwin) os=darwin-x64 ;; Linux) os=linux-x64 ;; *) die "Download BrowserStackLocal for this OS and set BROWSERSTACK_LOCAL_BINARY." ;; esac
  [ "$(uname -s)-$(uname -m)" = Linux-aarch64 ] && os=linux-arm64
  say "▶ Downloading BrowserStack Local ($os) …"
  mkdir -p "$(dirname "$LOCAL_BIN")"
  zip="$STATE/BrowserStackLocal.zip"
  curl -sfL "https://www.browserstack.com/browserstack-local/BrowserStackLocal-$os.zip" -o "$zip" \
    || die "Could not download BrowserStack Local."
  unzip -oq "$zip" -d "$(dirname "$LOCAL_BIN")" && rm -f "$zip" && chmod +x "$LOCAL_BIN"
}

start_tunnel() {
  tunnel_running && return 0
  ensure_local_binary
  say "▶ Opening the BrowserStack Local tunnel ($LOCAL_ID) …"
  local out pid
  out="$("$LOCAL_BIN" --key "$BROWSERSTACK_ACCESS_KEY" --local-identifier "$LOCAL_ID" --only-automate \
          --log-file "$STATE/tunnel.log" --daemon start 2>&1 | mask)"
  pid="$(printf '%s' "$out" | sed -n 's/.*"pid":[[:space:]]*\([0-9][0-9]*\).*/\1/p')"
  [ -n "$pid" ] || die "The tunnel did not start: $out"
  echo "$pid" > "$STATE/tunnel.pid"
}

stop_tunnel() {
  if tunnel_running; then
    local pid; pid="$(cat "$STATE/tunnel.pid")"
    pkill -TERM -P "$pid" 2>/dev/null || true   # its worker processes first, so none are left behind
    kill "$pid" 2>/dev/null || true
  fi
  rm -f "$STATE/tunnel.pid"
}
