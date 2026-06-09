# GP Rackspace Display

1920×480 live display for Gig Performer. Bridge server receives OSC over UDP, forwards to React frontend over WebSocket.

---

## Setup

```bash
npm run install:all   # install all dependencies
npm run build         # build the frontend (required before first run)
```

GP OSC config: remote client → `127.0.0.1:8000`, GP listens on `54344`.

---

## Running

```bash
npm start       # production (serves built frontend)
npm run dev     # development (Vite hot reload)
./launch.sh     # start server + open Chrome on the correct display
```

---

## Display positioning

`launch.sh` auto-detects solo vs. dual display:
- **Solo** → `--kiosk` at 0,0
- **Dual** → app window at `DISPLAY_X,0`, then AppleScript fullscreen on that display

Default `DISPLAY_X=1920`. Override permanently in `.env`:

```
DISPLAY_X=2560
```

Find the right value: **System Settings → Displays → Arrangement**.

---

## Auto-start (Mac Mini)

```bash
./install.sh            # installs launchd agents, takes effect next login
./install.sh --uninstall
```

Two agents: `com.gpdisplay.server` (keeps bridge alive) and `com.gpdisplay.display` (opens Chrome at login). Logs in `logs/`.

After pulling updates:
```bash
npm run build && ./install.sh
```

---

## Debugging

Press `` ` `` to toggle the OSC debug overlay (all addresses, values, last-seen timestamps).

Bottom-right dot: green (<10s), amber (10–60s), red (>60s).

---

## Layout

The display is hardcoded in `frontend/src/components/MixerLayout.jsx` — edit it directly, then `npm run build` (dev mode hot-reloads).

To add a widget: render it in `MixerLayout.jsx` from `oscState['/GlobalRackspace/<handle>/SetValue']`, add the matching `GetValue` address to `getValueQueries` in `server/index.js`, and add a `SendOSCMessage` line to the GPScript sync handler.

**Env vars (`.env`):**

| Env var | Default | Purpose |
|---|---|---|
| `GP_OSC_SEND_PORT` | `8000` | Bridge listens for GP here |
| `GP_OSC_LISTEN_PORT` | `54344` | Bridge sends `/Refresh` here |
| `HTTP_PORT` | `3000` | HTTP + WebSocket |
| `LOG_OSC` | `0` | `1` = log every OSC message (debugging) |
