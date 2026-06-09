#!/bin/bash
# Opens GPDisplay in Chrome on the correct monitor.
#
# Solo (show): 1920x480 is the only display → kiosk at 0,0
# Dual (rehearsal): 1920x480 is secondary → open at DISPLAY_X,DISPLAY_Y then fullscreen it
#
# Override display position: DISPLAY_X=3840 ./launch.sh

PORT=${HTTP_PORT:-3000}
URL="http://localhost:${PORT}"

# Second tab, loaded hidden in the background: talks to the FBV3 pedal over MIDI.
# The local GPDisplay (URL) stays the visible tab. Show/kiosk path only.
#
# Served from a LOCAL copy so it works with no internet on stage. Port 8777 is
# deliberate: Chrome Profile 2 already holds a persisted Web MIDI grant for this
# exact origin (granted once during setup; origin-scoped, survives reboots), so
# the pedal connects zero-touch with no permission prompt.
FBV_DIR="/Users/dick/Code/FBV_Chroma/webapp"
FBV_PORT=8777
FBV_URL="http://localhost:${FBV_PORT}/"

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
  # Launch the binary directly so --kiosk is guaranteed to apply at process start.
  # nohup ignores SIGHUP from bash on exit; AbandonProcessGroup in the plist
  # prevents launchd from propagating SIGTERM to Chrome when the script exits.
  echo "Solo display — launching in kiosk mode"
  pkill -x "Google Chrome" 2>/dev/null || true
  for i in {1..20}; do
    pgrep -x "Google Chrome" > /dev/null 2>&1 || break
    sleep 0.5
  done
  sleep 0.5

  # ── Serve the local FBV Chroma copy (no internet on stage) ─────────────────
  # nohup + the display plist's AbandonProcessGroup keep this alive after the
  # script exits, exactly like the Chrome launch below. The server only needs to
  # live long enough for Chrome to load the page once — after that, MIDI runs
  # entirely in the browser. Guard against double-starting on a manual relaunch.
  if curl -sf "${FBV_URL}" >/dev/null 2>&1; then
    echo "FBV Chroma server already up on ${FBV_PORT}"
  else
    echo "Starting FBV Chroma static server on ${FBV_PORT}..."
    nohup /usr/bin/python3 -m http.server "${FBV_PORT}" \
      --bind 127.0.0.1 \
      --directory "${FBV_DIR}" >/dev/null 2>&1 &
    for i in {1..20}; do
      curl -sf "${FBV_URL}" >/dev/null 2>&1 && break
      sleep 0.25
    done
    curl -sf "${FBV_URL}" >/dev/null 2>&1 \
      && echo "FBV Chroma server ready on ${FBV_PORT}" \
      || echo "WARNING: FBV Chroma server did not come up on ${FBV_PORT}"
  fi

  echo "Launching Chrome binary..."
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  nohup "$CHROME" \
    --kiosk \
    --no-first-run \
    --no-restore-last-session \
    --disable-session-crashed-bubble \
    --noerrdialogs \
    "${URL}" "${FBV_URL}" >/dev/null 2>&1 &
  echo "Chrome launched (PID $!) — local server visible, FBV Chroma hidden in 2nd tab"
else
  # Secondary display: open as app window at the right position,
  # then fullscreen it — macOS fullscreens on whichever display the window is on
  echo "Dual display — opening at ${DISPLAY_X},${DISPLAY_Y} then fullscreening"
  open -a "Google Chrome" --args \
    --app="${URL}" \
    --window-position="${DISPLAY_X},${DISPLAY_Y}" \
    --window-size="1920,480" \
    --no-first-run \
    --no-restore-last-session \
    --disable-session-crashed-bubble \
    --noerrdialogs

  # Give Chrome time to open and position itself before fullscreening
  sleep 3
  osascript -e 'tell application "Google Chrome" to set fullscreen of front window to true'
fi
