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
                          .osc-cache.json              display-config.json
                          (persisted state)             (layout + theme)
```

**server/index.js** is a single Node.js process doing three things:
1. Listens for OSC UDP messages from Gig Performer on `GP_OSC_SEND_PORT` (default 8000)
2. Serves the React frontend as static files from `frontend/dist/` and exposes `GET /api/config`
3. Bridges OSC state to browser clients over WebSocket at `/ws`

On each new WebSocket connection the server replays the full `oscCache` (last known values), then sends `/Refresh` and `/gp-display/RequestSync` to GP to pull fresh state.

**frontend/src/hooks/useOSC.js** maintains a flat `oscState` map of `{ oscAddress → value }` with auto-reconnect (2.5 s). `/ClearAll` messages wipe the map but preserve `/GlobalRackspace/` addresses (GP doesn't resend those on rackspace change).

**frontend/src/components/WidgetContainer.jsx** is the routing layer: reads `item` from config, resolves the live value from `oscState`, resolves the label (prefers `/SetCaption` or `Name`-suffix OSC address over config label), then renders the appropriate widget component.

## Configuration-driven layout

`display-config.json` at the project root defines everything — no rebuild required, just browser refresh. The display is a fixed **1920×480** canvas divided into columns. Each column has `width` (CSS), `direction` (`"row"` | `"column"`), and an array of `items`.

Widget types: `fader` (float 0–1 → vertical slider), `switch` (0/1 → LED), `text` (string/number label), `button`.

OSC address conventions used throughout:
- `/GlobalRackspace/<handle>/SetValue` — widget value (float)
- `/GlobalRackspace/<handle>/SetCaption` — display label (string, auto-overrides config label)
- `/GlobalRackspace/<handle>/GetValue` — queried by server on connect
- `/gp-display/RequestSync` — custom GPScript trigger (see README for setup)

Theme colours (`background`, `foreground`, `accent`) from the config are applied as CSS custom properties `--gp-bg`, `--gp-fg`, `--gp-accent` in `frontend/src/config.js`.

## Adding a new widget

1. Add an entry to `display-config.json` with the correct `oscAddress`
2. Add a matching `SendOSCMessage` line in the Global Rackspace GPScript sync handler (see README § "Add the GPScript sync handler")
3. Browser refresh is sufficient — no rebuild needed in dev mode
