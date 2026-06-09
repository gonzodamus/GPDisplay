# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run install:all   # first-time install (root + server + frontend)
npm run dev           # bridge server + Vite dev server with hot reload
npm start             # build frontend, then start bridge server (production)
npm run build         # build frontend only (output: frontend/dist/)
cd frontend && npm run lint  # ESLint
```

Open the display in kiosk mode:
```bash
open -a "Google Chrome" --args --kiosk http://localhost:3000
```

## Architecture

```
Gig Performer ──OSC/UDP──▶ server/index.js ──WebSocket──▶ React frontend
                                │                              │
                          .osc-cache.json               MixerLayout.jsx
                          (persisted state)            (hardcoded layout)
```

**server/index.js** is a single Node.js process doing three things:
1. Listens for OSC UDP messages from Gig Performer on `GP_OSC_SEND_PORT` (default 8000)
2. Serves the React frontend as static files from `frontend/dist/`
3. Bridges OSC state to browser clients over WebSocket at `/ws`

On each new WebSocket connection the server replays the full `oscCache` (last known values), then sends `/Refresh` and `/gp-display/RequestSync` to GP and queries each address in its hardcoded `getValueQueries` list to pull fresh state. Incoming values are persisted to `.osc-cache.json` (throttled to one write per second, flushed on SIGTERM/SIGINT) so the display can show last-known state after a server restart.

Set `LOG_OSC=1` to log every incoming OSC message (noisy — off by default because launchd's `logs/server.log` never rotates).

**frontend/src/hooks/useOSC.js** maintains a flat `oscState` map of `{ oscAddress → value }` with auto-reconnect (2.5 s). `/ClearAll` messages wipe the map but preserve `/GlobalRackspace/` addresses (GP doesn't resend those on rackspace change).

**frontend/src/components/MixerLayout.jsx** is the entire display: a hardcoded 1920×480 layout (this is a single-user, single-monitor project — flexibility is intentionally traded for simplicity). It reads values straight out of `oscState` and resolves labels (prefers `/SetCaption` or `Name`-suffix OSC address over the hardcoded fallback).

OSC address conventions used throughout:
- `/GlobalRackspace/<handle>/SetValue` — widget value (float)
- `/GlobalRackspace/<handle>/SetCaption` — display label (string, auto-overrides fallback label)
- `/GlobalRackspace/<handle>/GetValue` — queried by server on connect
- `/gp-display/RequestSync` — custom GPScript trigger (see README for setup)

## Adding a new widget

1. Add the widget's UI to `frontend/src/components/MixerLayout.jsx`, reading its value from `oscState['/GlobalRackspace/<handle>/SetValue']`
2. Add the `/GlobalRackspace/<handle>/GetValue` address to `getValueQueries` in `server/index.js`
3. Add a matching `SendOSCMessage` line in the Global Rackspace GPScript sync handler (see README § "Add the GPScript sync handler")
4. Rebuild for production: `npm run build` (dev mode hot-reloads)
