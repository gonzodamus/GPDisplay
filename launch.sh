#!/bin/bash
# Opens GPDisplay in Chrome on the correct monitor.
#
# Solo (show): 1920x480 is the only display → kiosk at 0,0
# Dual (rehearsal): 1920x480 is secondary → open at DISPLAY_X,DISPLAY_Y then fullscreen it
#
# Override display position: DISPLAY_X=3840 ./launch.sh

PORT=${HTTP_PORT:-3000}
URL="http://localhost:${PORT}"

# launchd strips PATH — add common node locations so npm/node are findable
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
[ -f "/opt/homebrew/bin/node" ] && export PATH="/opt/homebrew/bin:$PATH"
[ -f "/usr/local/bin/node" ]    && export PATH="/usr/local/bin:$PATH"

# ── Start server if not already running ──────────────────────────────────────

if ! lsof -ti tcp:${PORT} > /dev/null 2>&1; then
  echo "Starting bridge server..."
  npm start --prefix "$(dirname "$0")" &
  for i in {1..20}; do
    sleep 0.5
    curl -sf "${URL}/api/config" > /dev/null 2>&1 && break
    echo "Waiting for server... ($i)"
  done
else
  echo "Bridge server already running on port ${PORT}"
fi

# ── Determine display position ───────────────────────────────────────────────

DISPLAY_COUNT=$(system_profiler SPDisplaysDataType 2>/dev/null | grep -c "Resolution:")

if [ -n "$DISPLAY_X" ]; then
  # Explicit override — use as-is
  SOLO=false
elif [ "$DISPLAY_COUNT" -le 1 ]; then
  DISPLAY_X=0
  SOLO=true
else
  DISPLAY_X=1920
  SOLO=false
fi
DISPLAY_Y=${DISPLAY_Y:-0}

# ── Open Chrome ──────────────────────────────────────────────────────────────

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ "$SOLO" = true ]; then
  # Only one display: kiosk mode fills it completely, no OS chrome visible.
  # Use the binary directly — `open -a` does not reliably pass --kiosk to an
  # already-running Chrome instance, and launchd bypasses the shell environment
  # that `open` expects.
  echo "Solo display — launching in kiosk mode"
  if [ ! -f "$CHROME" ]; then
    echo "ERROR: Chrome binary not found at: $CHROME"
    exit 1
  fi
  pkill -x "Google Chrome" 2>/dev/null || true
  sleep 1
  echo "Launching Chrome binary..."
  "$CHROME" \
    --kiosk \
    --no-first-run \
    --disable-session-crashed-bubble \
    --noerrdialogs \
    "${URL}" &
  echo "Chrome launched (PID $!)"
else
  # Secondary display: open as app window at the right position,
  # then fullscreen it — macOS fullscreens on whichever display the window is on
  echo "Dual display — opening at ${DISPLAY_X},${DISPLAY_Y} then fullscreening"
  open -a "Google Chrome" --args \
    --app="${URL}" \
    --window-position="${DISPLAY_X},${DISPLAY_Y}" \
    --window-size="1920,480" \
    --no-first-run \
    --disable-session-crashed-bubble \
    --noerrdialogs

  # Give Chrome time to open and position itself before fullscreening
  sleep 3
  osascript -e 'tell application "Google Chrome" to set fullscreen of front window to true'
fi
