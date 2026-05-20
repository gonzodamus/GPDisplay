#!/bin/bash
# Opens GPDisplay in Chrome on the correct monitor.
#
# Solo (show): 1920x480 is the only display → kiosk at 0,0
# Dual (rehearsal): 1920x480 is secondary → open at DISPLAY_X,DISPLAY_Y then fullscreen it
#
# Override display position: DISPLAY_X=3840 ./launch.sh

PORT=${HTTP_PORT:-3000}
URL="http://localhost:${PORT}"

# ── Wait for server (started by com.gpdisplay.server launchd agent) ──────────
# Do NOT start the server here — starting it in the background causes it to die
# when this script exits (launchd kills the process group), which races with the
# dedicated server plist and produces EADDRINUSE thrash.

echo "Waiting for server on port ${PORT}..."
for i in {1..40}; do
  curl -sf "${URL}/api/config" > /dev/null 2>&1 && break
  echo "  ($i/40) not ready yet..."
  sleep 0.5
done

if ! curl -sf "${URL}/api/config" > /dev/null 2>&1; then
  echo "ERROR: server never came up on port ${PORT} — aborting Chrome launch"
  exit 1
fi
echo "Server ready."

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
  # Only one display: kiosk mode fills it completely, no OS chrome visible.
  # Use `open -na` so Chrome is launched through LaunchServices and escapes
  # launchd's process group — running the binary directly causes Chrome to be
  # SIGTERM'd when this script exits (launchd kills the whole process group).
  echo "Solo display — launching in kiosk mode"
  pkill -x "Google Chrome" 2>/dev/null || true
  sleep 1
  echo "Launching Chrome via open..."
  open -na "Google Chrome" --args \
    --kiosk \
    --no-first-run \
    --disable-session-crashed-bubble \
    --noerrdialogs \
    "${URL}"
  echo "Chrome launch handed off to LaunchServices"
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
