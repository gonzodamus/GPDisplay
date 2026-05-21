#!/bin/bash
# Portable node launcher — works with nvm, Homebrew (Apple Silicon / Intel), or system node.
# launchd doesn't load shell profiles, so we find node manually.

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
[ -f "/opt/homebrew/bin/node" ] && export PATH="/opt/homebrew/bin:$PATH"
[ -f "/usr/local/bin/node" ]    && export PATH="/usr/local/bin:$PATH"

cd "$(dirname "$0")/.."
exec node server/index.js
