#!/bin/bash
# Opens GPDisplay in Chrome on the correct monitor.
#
# Solo (show): 1920x480 is the only display → kiosk at 0,0
# Dual (rehearsal): 1920x480 is secondary → open at DISPLAY_X,DISPLAY_Y then fullscreen it
#
# Override display position: DISPLAY_X=3840 ./launch.sh

PORT=${HTTP_PORT:-3000}
URL="http://localhost:${PORT}"

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

if [ "$SOLO" = true ]; then
  # Only one display: kiosk mode fills it completely, no OS chrome visible
  echo "Solo display — launching in kiosk mode"
  open -a "Google Chrome" --args \
    --kiosk \
    "${URL}" \
    --no-first-run \
    --disable-session-crashed-bubble \
    --noerrdialogs
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
