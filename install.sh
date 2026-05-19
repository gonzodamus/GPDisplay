#!/bin/bash
# Run this once on the machine that will run GPDisplay.
# Sets up launchd agents so everything starts automatically at login.
#
# To uninstall: ./install.sh --uninstall

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTS_DIR="$HOME/Library/LaunchAgents"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
LOGS_DIR="$PROJECT_DIR/logs"

SERVER_PLIST_SRC="$SCRIPTS_DIR/com.gpdisplay.server.plist"
DISPLAY_PLIST_SRC="$SCRIPTS_DIR/com.gpdisplay.display.plist"
SERVER_PLIST="$AGENTS_DIR/com.gpdisplay.server.plist"
DISPLAY_PLIST="$AGENTS_DIR/com.gpdisplay.display.plist"

# ── Uninstall ────────────────────────────────────────────────────────────────

if [ "$1" = "--uninstall" ]; then
  echo "Uninstalling GPDisplay agents..."
  launchctl unload "$SERVER_PLIST"  2>/dev/null && echo "Server agent unloaded"  || true
  launchctl unload "$DISPLAY_PLIST" 2>/dev/null && echo "Display agent unloaded" || true
  rm -f "$SERVER_PLIST" "$DISPLAY_PLIST"
  echo "Done. Agents removed — nothing will start automatically at login."
  exit 0
fi

# ── Install ──────────────────────────────────────────────────────────────────

echo "Installing GPDisplay..."
echo "Project: $PROJECT_DIR"
echo ""

# Build the frontend if dist/ doesn't exist
if [ ! -d "$PROJECT_DIR/frontend/dist" ]; then
  echo "Building frontend..."
  npm run build --prefix "$PROJECT_DIR"
fi

mkdir -p "$LOGS_DIR" "$AGENTS_DIR"
chmod +x "$SCRIPTS_DIR/server-start.sh" "$PROJECT_DIR/launch.sh"

install_plist() {
  local src="$1"
  local dst="$2"
  local label="$3"

  # Substitute __PROJECT_DIR__ placeholder
  sed "s|__PROJECT_DIR__|$PROJECT_DIR|g" "$src" > "$dst"

  # Unload first in case this is a reinstall
  launchctl unload "$dst" 2>/dev/null || true
  launchctl load "$dst"
  echo "  ✓ $label"
}

echo "Installing launchd agents:"
install_plist "$SERVER_PLIST_SRC"  "$SERVER_PLIST"  "Server  → starts at login, restarts on crash"
install_plist "$DISPLAY_PLIST_SRC" "$DISPLAY_PLIST" "Display → opens Chrome at login"

echo ""
echo "All done. From the next login, GPDisplay starts automatically."
echo "Logs: $LOGS_DIR/"
echo ""
echo "To start right now without logging out: ./launch.sh"
echo "To uninstall: ./install.sh --uninstall"
