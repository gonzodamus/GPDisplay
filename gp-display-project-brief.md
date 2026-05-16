# GP Rackspace Display — Project Brief

## What This Is

A lightweight local web application that displays a read-only mirror of the Gig Performer (GP) Global Rackspace on a dedicated external monitor. The display is a small 1920×480 (~8") ultrawide screen mounted on a live keyboard rig. The goal is to show the performer (me) the state of key widgets, rackspace/variation info, and system parameters at a glance during a live show — nothing more.

This is NOT a control surface. It is strictly a display. The frontend never sends data back to Gig Performer. The bridge server sends one message to GP — `/Refresh` — whenever a browser client connects, which tells GP to resend its current state. This ensures the display populates immediately on load rather than waiting for the user to touch a widget. Beyond that single startup message, the data flow is entirely one-way: GP → bridge → browser.

## Architecture

```
┌──────────────────────┐
│   Gig Performer      │
│   Sends OSC on UDP   │
│   Listens on :54344  │
└──────────┬───────────┘
           │ UDP (localhost, binary OSC)
           │ GP → Bridge: widget updates, state changes
           │ Bridge → GP: /Refresh on client connect (one-shot)
           ▼
┌──────────────────────┐
│   Bridge Server      │
│   (Node.js, :3000)   │
│   UDP ↔ GP (osc-js)  │
│   HTTP serves app    │
│   WS pushes JSON     │
└──────────┬───────────┘
           │ WebSocket (ws://localhost:3000/ws, one-way JSON)
           │ Messages as { address: "/foo/SetValue", args: [0.75] }
           ▼
┌──────────────────────┐
│   Browser Frontend   │
│   (React, fullscreen │
│    on 1920×480)      │
│   Renders widget     │
│   state visually     │
└──────────────────────┘
```

All three components run on the same macOS machine. There is no network involved — everything is localhost.

## Component 1: Bridge Server

A minimal Node.js process that:

1. Listens for incoming UDP OSC messages from Gig Performer on a configurable port (default: 8000)
2. Parses the binary OSC data into structured messages (address string + typed arguments)
3. Forwards every received message to all connected WebSocket clients as JSON
4. Runs an HTTP server that serves the built frontend as static files AND the `display-config.json` file as a REST endpoint
5. On WebSocket client connect, sends a `/Refresh` OSC message to GP over UDP so GP resends its current state

### Key Details

- **Do NOT use osc-js's BridgePlugin as a passthrough.** The BridgePlugin forwards raw binary OSC packets over WebSocket, not JSON. The browser would need an OSC parser to decode them, adding unnecessary complexity to the frontend. Instead, use osc-js **only for UDP receive and OSC parsing**, and manage the WebSocket server separately with the `ws` npm package. The bridge's job is: receive binary OSC on UDP → parse with osc-js into `{ address, args }` → JSON.stringify → send to all WS clients. This keeps the frontend simple (it just parses JSON).
- For sending `/Refresh` to GP and receiving widget updates from GP, use osc-js's `DatagramPlugin` (UDP-only mode) — it handles both sending and receiving on the UDP side in one place, so there is no need to mix in Node's `dgram` module separately.
- The bridge also runs a lightweight HTTP server (Node's built-in `http` module or Express) to serve the frontend build and the config endpoint. The HTTP server runs on port 3000 (configurable). The `ws` WebSocket server should be attached to the same HTTP server so they share port 3000 — this avoids the frontend needing to know a separate WS port. The WebSocket server must be mounted at the path `/ws` (not root `/`), so the endpoint is `ws://localhost:3000/ws`. Using a specific path prevents conflicts with Vite's HMR WebSocket in development, since Vite's proxy can then target `/ws` exclusively without intercepting Vite's own internal HMR connection.
- The data flow is almost entirely one-way: GP→bridge→browser. The only message the bridge sends TO GP is `/Refresh`, fired once when a WebSocket client connects. This tells GP to resend all current status. The bridge sends this to GP's listening port (default: 54344, configurable).
- The bridge also exposes `GET /api/config` which serves the `display-config.json` file from the project root. The bridge must resolve this path relative to its own file location, not the working directory: use `path.join(__dirname, '..', 'display-config.json')`. This ensures the config is found correctly regardless of where `node index.js` is invoked from.
- Configuration (ports, etc.) should be settable via environment variables or a `.env` file, with sensible defaults. Load the `.env` file with the same `__dirname`-relative pattern: `require('dotenv').config({ path: path.join(__dirname, '..', '.env') })`. This ensures the root `.env` is found whether the server is started from the project root or the `server/` directory.
  - `GP_OSC_SEND_PORT` — port GP sends to / bridge listens on (default: 8000)
  - `GP_OSC_LISTEN_PORT` — port GP listens on / bridge sends /Refresh to (default: 54344)
  - `HTTP_PORT` — port for the HTTP + WebSocket server (default: 3000)

### OSC Message Format from Gig Performer

GP sends standard OSC messages over UDP. The relevant messages for this project:

**Widget value updates (automatic, sent whenever a widget changes):**
- Address: `/<oscHandle>/SetValue`
- Argument: Float (0.0 to 1.0)
- Example: `/masterVol/SetValue 0.75`

**Widget caption updates:**
- Address: `/<oscHandle>/SetCaption`
- Argument: String
- Example: `/patchLabel/SetCaption "Pad + Strings"`

**System-level messages (sent by GP on state change):**
- `/RackspaceName` — string, sent when rackspace changes
- `/VariationName` — string, sent when variation changes
- `/SongName` — string, current song name
- `/SongPartName` — string, current song part
- `/SetBPM` — float, current tempo
- `/SetGlobalTranspose` — integer, current global transpose value

**Query messages (reference — sent TO GP to request state):**

The bridge sends only ONE of these: `/Refresh`, fired once on client connect. The others are listed here for reference in case future versions need them. They are NOT used in V1.

- `/Refresh` → asks GP to resend all current status messages. **Used by the bridge on WebSocket client connect.** This is an address-only message with no arguments: `new OSC.Message('/Refresh')`. Multiple rapid connects (e.g., someone refreshing the browser) will each trigger a `/Refresh` — this is harmless, GP handles it fine.
- `/GetCurrentBPM` → GP responds with current BPM (not used in V1 — /Refresh covers this)
- `/RackSpace/ListOSCWidgets` → GP responds with list of OSC-enabled widgets (stretch goal: auto-discovery)
- `/oscHandle/GetValue` → GP responds with current widget value (not used in V1 — /Refresh covers this)

**A note on OSC address naming:** GP uses "Set" in addresses like `/SetBPM` from its own perspective — it's "setting" the value on the listener. From the display's perspective, these are incoming data. This is GP's convention, not a bug. The config file uses these addresses as-is (e.g., `"oscAddress": "/SetBPM"`).

## Component 2: Frontend (React)

A single-page React application designed for exactly one resolution: **1920×480 pixels**.

### Design Requirements

- **Dark theme.** This will be viewed on stage under low/mixed lighting. High contrast, no bright backgrounds.
- **Large, readable text.** The display is ~8" wide. Widget labels, values, and the rackspace/variation name should be readable from ~3 feet (arm's length at a keyboard).
- **No scrolling.** Everything fits on one screen. The layout is fixed.
- **No interactivity.** No buttons, no hover states, no click handlers. This is a heads-up display. (If the external screen happens to be a touchscreen, touching it should do nothing.)
- **Fullscreen-friendly.** The app should look correct in a fullscreen Chrome window on a 1920×480 display. No browser chrome visible. The recommended approach for live use is launching Chrome with the `--kiosk` flag (e.g., `open -a "Google Chrome" --args --kiosk http://localhost:3000`), which removes all browser UI including the address bar. Use `<meta name="viewport">` and CSS to ensure no overflow/scrollbar.

### Layout Concept

The 1920×480 space is an ultrawide strip. A sensible default layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Rackspace/Variation]  [Song/Part]  │  [Widget 1] [Widget 2] ... [N]  │ [BPM] [Transpose] │
│   Large text, left     Medium text  │  Visual representations         │  System info       │
│                                     │  of Global Rackspace widgets    │                    │
└─────────────────────────────────────────────────────────────────────────┘
```

This is a suggested starting point. The actual layout should be defined by a configuration file (see below).

### Widget Rendering

Each GP widget the user wants to display should be rendered as a visual element appropriate to its type:

- **Knobs/Faders (0.0–1.0 float values):** Rendered as a horizontal bar, arc meter, or vertical bar with a label showing the current value and the widget caption
- **Buttons/Switches (0.0 or 1.0):** Rendered as an on/off indicator (LED-style dot, colored box, etc.)
- **Labels (string values):** Rendered as text

The user should not need to modify React code to change which widgets are displayed. Instead, they edit a configuration file.

### Configuration File

A JSON file (`display-config.json`) at the project root that defines what the display shows and where. Example structure:

```json
{
  "layout": {
    "columns": [
      {
        "width": "25%",
        "direction": "column",
        "items": [
          { "type": "text", "oscAddress": "/RackspaceName", "label": "Rackspace", "fontSize": "2rem" },
          { "type": "text", "oscAddress": "/VariationName", "label": "Variation", "fontSize": "1.5rem" }
        ]
      },
      {
        "width": "50%",
        "direction": "row",
        "items": [
          { "type": "fader", "oscAddress": "/masterVol/SetValue", "label": "Master", "color": "#ff4444" },
          { "type": "fader", "oscAddress": "/reverbSend/SetValue", "label": "Reverb" },
          { "type": "switch", "oscAddress": "/delayBypass/SetValue", "label": "Delay" },
          { "type": "fader", "oscAddress": "/padLevel/SetValue", "label": "Pad" }
        ]
      },
      {
        "width": "25%",
        "direction": "column",
        "items": [
          { "type": "text", "oscAddress": "/SetBPM", "label": "BPM", "fontSize": "2.5rem" },
          { "type": "text", "oscAddress": "/SetGlobalTranspose", "label": "Transpose", "fontSize": "1.5rem" }
        ]
      }
    ]
  },
  "theme": {
    "background": "#0a0a0a",
    "foreground": "#e0e0e0",
    "accent": "#ff4444"
  }
}
```

The config file format should be flexible enough to rearrange the layout without touching code, but it does NOT need to be a full layout engine. Keep it practical.

**Layout rules:** Columns are laid out as a horizontal flexbox row, each taking their specified `width`. Items within a column are also laid out as a horizontal flexbox row by default, wrapping if needed, so that multiple faders/switches in the middle column sit side-by-side. A column can optionally specify `"direction": "column"` to stack items vertically instead (useful for the left info panel where Rackspace and Variation should stack). If unspecified, the default direction is `"row"`.

### Config Loading

The config is fetched at runtime by the frontend from the bridge server (`GET /api/config`), NOT bundled at build time. This means the performer can edit `display-config.json` between gigs without rebuilding the frontend — just refresh the browser. The bridge reads the file from disk on each request (no caching), so edits are picked up immediately on page reload. Config hot-reload without a page refresh is out of scope for V1. If the config fetch fails (bridge not running, file missing), the frontend should display a centered error message ("Could not load config — is the bridge server running?") and retry on a timer, same as the WebSocket reconnect behavior.

### Theme Application

The `theme` object in the config is applied as CSS custom properties on the root element when the config is loaded:

```css
:root {
  --gp-bg: #0a0a0a;
  --gp-fg: #e0e0e0;
  --gp-accent: #ff4444;
}
```

All widget components and global styles reference these variables. This is set once on config load via `document.documentElement.style.setProperty()`.

### Label Behavior

Each widget has a `label` field in the config (e.g., `"label": "Master"`). This is the default display label. If GP sends a `/<oscHandle>/SetCaption` message for that widget, the dynamic GP caption overrides the config label. If no caption has been received from GP, the config label is shown. This means the config label acts as a fallback — useful for initial display and for widgets where GP doesn't send captions.

**Caption address derivation:** For widgets whose `oscAddress` follows the `/<handle>/SetValue` pattern, the corresponding caption address is `/<handle>/SetCaption` — derived by replacing `/SetValue` with `/SetCaption`. The frontend should subscribe to both addresses for each such widget. System-level text widgets (e.g., `/RackspaceName`, `/SetBPM`) do NOT have a separate caption address — they are string values that update in place. The derivation only applies when the `oscAddress` ends in `/SetValue`.

### State Management

The frontend maintains a simple key-value store of OSC addresses → current values. When a WebSocket message arrives, it updates the store and React re-renders the affected widget. No persistence needed — state is entirely ephemeral.

On page load, widgets show a "—" placeholder or empty state. The bridge sends `/Refresh` to GP when the browser connects, so widgets should populate within milliseconds. If the WebSocket connection drops (bridge crash, etc.), the frontend should show a visible "DISCONNECTED" indicator (e.g., a red bar at the top of the screen or a dimmed overlay) and attempt to reconnect automatically on a timer (every 2–3 seconds). Stale widget values should remain visible but dimmed while disconnected — blanking the display mid-show is worse than showing slightly stale data.

## Project Structure

```
gp-display/
├── package.json            # Root package — orchestrates both server and frontend
├── display-config.json     # User-editable layout config (served at runtime, not bundled)
├── .env                    # Port configuration (optional, defaults are fine)
├── server/
│   ├── index.js            # Bridge server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── FaderWidget.jsx
│   │   │   ├── SwitchWidget.jsx
│   │   │   ├── TextWidget.jsx
│   │   │   └── WidgetContainer.jsx
│   │   ├── hooks/
│   │   │   └── useOSC.js   # WebSocket connection + state store + reconnect logic
│   │   ├── config.js       # Fetches display-config.json from bridge at runtime
│   │   └── index.css       # Global styles, dark theme using CSS custom properties
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

### Root package.json

The root `package.json` uses `concurrently` to orchestrate both processes:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:frontend\"",
    "dev:server": "cd server && node index.js",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "start": "cd frontend && npm run build && cd ../server && node index.js",
    "install:all": "npm install && cd server && npm install && cd ../frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### Development vs. Production

**Development (`npm run dev`):**
- The bridge server runs on :3000 (HTTP + WebSocket on the same port). Note: `dev:server` uses plain `node`, not `nodemon` — server changes require a manual restart. Install `nodemon` globally and swap in `nodemon index.js` if this becomes annoying during development.
- Vite dev server runs on :5173 with hot module replacement
- The Vite dev server proxies both `/api/*` requests and WebSocket connections to the bridge server at :3000 (configured in `vite.config.js`)
- The frontend derives the WebSocket URL from `window.location`: `ws://${window.location.host}/ws` — this works in both dev (proxied through Vite at `/ws`) and production (direct to bridge at `ws://localhost:3000/ws`) with no env vars needed

**Production (`npm start`):**
- Vite builds the frontend to `frontend/dist/`
- The bridge server starts, serves the built files from `frontend/dist/` as static assets, and runs the WebSocket server — all on :3000
- The user opens `http://localhost:3000` — one URL for everything

## Tech Stack

- **Bridge server:** Node.js + `osc-js` (for OSC parsing and UDP) + `ws` (for WebSocket server). The HTTP server uses Node's built-in `http` module or Express.
- **Frontend:** React (Vite for build tooling), no UI framework — custom CSS. The WebSocket URL is derived from `window.location` with path `/ws`, no configuration needed. Keep dependencies minimal.
- **No database, no auth, no external services.** This runs entirely on localhost.

## Running It

The user experience for starting the display should be:

1. Start Gig Performer, enable OSC, configure it to send to `127.0.0.1:8000` and listen on `54344` (see GP setup below)
2. Run `npm start` in the project root — this builds the frontend and starts the bridge server
3. Open Chrome on the external 1920×480 display with kiosk mode: `open -a "Google Chrome" --args --kiosk http://localhost:3000`
4. Done — the display populates immediately (the bridge sends `/Refresh` to GP on connect) and mirrors the Global Rackspace state in real time

For development, run `npm run dev` instead — this starts both the bridge and Vite dev server with hot reload.

## Stretch Goals (Not Required for V1)

These are explicitly out of scope for the initial build but should be kept in mind architecturally:

- **Bidirectional control:** Sending OSC messages back to GP from the display (touch control)
- **Multiple display profiles:** Switching between different layout configs (e.g. one per band/project)
- **Electron packaging:** Wrapping the whole thing as a standalone app that auto-launches and auto-fullscreens
- **Auto-discovery:** Querying GP for its widget list on startup instead of manual config
- **Visual config editor:** A drag-and-drop layout editor instead of editing JSON. This is a significant undertaking and should be a separate project.

## Context: Gig Performer OSC Setup

For the display to receive data, the user must configure GP:

1. Go to Options → OSC Setup
2. Enable OSC
3. Set Remote client IP address to `127.0.0.1`
4. Set Remote client port to match the bridge's UDP listen port (default: `8000`)
5. Ensure GP's listening port is set (default: `54344`) — the bridge sends `/Refresh` to this port when a browser client connects, which tells GP to resend its current state so the display populates immediately
6. For each widget in the Global Rackspace that should appear on the display: go to Widget Properties → Advanced tab → set an OSC/GPScript Name → check "Enable OSC"

GP will then automatically send OSC messages to the bridge whenever those widget values change.
