# GP Rackspace Display

A lightweight local web application that mirrors the Gig Performer Global Rackspace on a dedicated 1920×480 ultrawide display. The bridge server receives OSC from GP over UDP, forwards state to a React frontend over WebSocket, and serves the frontend itself — one process, one URL.

## Requirements

- Node.js 18 LTS or later (`node --version` to check)
- Google Chrome
- Gig Performer with OSC enabled

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure Gig Performer OSC

1. Go to **Options → OSC Setup**
2. Enable OSC
3. Set **Remote client IP** to `127.0.0.1`
4. Set **Remote client port** to `8000` (the bridge's UDP listen port)
5. Set **GP's own listening port** to `54344` (the bridge sends `/Refresh` here on connect)
6. For each widget to display: **Widget Properties → Advanced tab → set an OSC/GPScript Name → check "Enable OSC"**
7. After changing any OSC settings, **disable and re-enable OSC** in the setup dialog — GP requires this to apply port changes and begin sending. A simple save is not enough.

GP will then send OSC messages to the bridge automatically when widget values change.

### 3. Add the GPScript sync handler

GP's `/Refresh` command does not resend Global Rackspace widget values (volumes, etc.) — it only resends system-level state like rackspace name and BPM. To populate the display immediately on connect, add a GPScript to the **Global Rackspace** that responds to a custom sync request.

1. In GP, open the **Global Rackspace** script editor
2. Paste the following, replacing the widget variable names and OSC addresses with your own:

```
Var
  k1vol : Widget
  k2vol : Widget
  mainvol : Widget

On OSCMessageReceived(m : OSCMessage) Matching "/gp-display/RequestSync"
  SendOSCMessage{ /GlobalRackspace/k1vol/SetValue, GetWidgetValue(k1vol) }
  SendOSCMessage{ /GlobalRackspace/k2vol/SetValue, GetWidgetValue(k2vol) }
  SendOSCMessage{ /GlobalRackspace/mainvol/SetValue, GetWidgetValue(mainvol) }
End
```

**Notes:**
- The `Var` block names (`k1vol`, `k2vol`, `mainvol`) must match the **OSC/GPScript Name** set in each widget's Advanced properties — not the display label.
- Add one `SendOSCMessage` line per widget you want on the display. The address must match what you put in `display-config.json`.
- Each time you add a new widget to the display, add it here too.

When the bridge is running and a browser connects, it sends `/gp-display/RequestSync` to GP. The script fires immediately and pushes all current widget values — no rackspace switch needed.

> **Fallback:** The bridge also persists the last known values to `.osc-cache.json`. If the GPScript is not set up, the cache provides last-known values from the previous session instead.

### 4. Customise the layout

Edit `display-config.json` at the project root. Changes take effect on browser refresh — no rebuild needed. See [Configuration](#configuration) below.

### 4. Start the display

**Live use** — builds the frontend and starts the bridge:

```bash
npm start
```

Then open Chrome in kiosk mode on the external 1920×480 display:

```bash
open -a "Google Chrome" --args --kiosk http://localhost:3000
```

**Development** — starts both the bridge and Vite dev server with hot reload:

```bash
npm run dev
```

---

## Auto-start on Login

To launch the bridge server automatically at login, use macOS **launchd**. For Chrome, add it as a Login Item separately (see below).

### Bridge server — launchd plist

1. Find the full path to your `node` binary:

   ```bash
   which node
   # e.g. /opt/homebrew/bin/node  (Apple Silicon)
   # e.g. /usr/local/bin/node     (Intel)
   ```

2. Create the plist file at `~/Library/LaunchAgents/com.gpdisplay.bridge.plist`, substituting your node path and project path:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
     "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>Label</key>
     <string>com.gpdisplay.bridge</string>
     <key>ProgramArguments</key>
     <array>
       <string>/opt/homebrew/bin/node</string>
       <string>/Users/YOUR_USERNAME/path/to/gp-display/server/index.js</string>
     </array>
     <key>RunAtLoad</key>
     <true/>
     <key>KeepAlive</key>
     <true/>
     <key>StandardOutPath</key>
     <string>/tmp/gp-display-bridge.log</string>
     <key>StandardErrorPath</key>
     <string>/tmp/gp-display-bridge-error.log</string>
   </dict>
   </plist>
   ```

   > **Note:** The bridge serves `frontend/dist/` as static files, so run `npm run build` once before enabling the plist. The plist does not rebuild the frontend on start.

3. Load the agent:

   ```bash
   launchctl load ~/Library/LaunchAgents/com.gpdisplay.bridge.plist
   ```

   To unload: `launchctl unload ~/Library/LaunchAgents/com.gpdisplay.bridge.plist`

   Logs are written to `/tmp/gp-display-bridge.log` and `/tmp/gp-display-bridge-error.log`.

### Chrome kiosk — Login Item

Rather than a second plist (which would require a delay to wait for the bridge), add Chrome as a **Login Item** via **System Settings → General → Login Items & Extensions → Add (+)**. Point it to a small shell script:

```bash
#!/bin/zsh
# ~/path/to/gp-display/launch-display.sh
sleep 3   # wait for bridge to be ready
open -a "Google Chrome" --args --kiosk http://localhost:3000
```

Make it executable:

```bash
chmod +x launch-display.sh
```

Then add that script to Login Items. The 3-second sleep gives the bridge time to start before Chrome tries to connect.

---

## Configuration

Edit `display-config.json` to control the layout. No code changes or rebuilds needed.

### Column layout

The display is divided into horizontal columns. Each column has a `width` (CSS value, e.g. `"25%"`) and a `direction`:

- `"row"` (default) — items sit side-by-side horizontally. Good for faders/switches in a bank.
- `"column"` — items stack vertically. Good for text labels like Rackspace and Variation.

### Item types

| `type` | Renders as | Expected OSC value |
|---|---|---|
| `"fader"` | Horizontal fill bar | Float 0.0–1.0 |
| `"switch"` | LED on/off indicator | Float 0.0 or 1.0 |
| `"text"` | Text label | String or number |

Each item has:
- `oscAddress` — the OSC address to listen on (e.g. `/masterVol/SetValue`)
- `label` — fallback label shown until GP sends a caption (or always, for system widgets)
- `fontSize` — (text widgets only) CSS font size, e.g. `"2rem"`
- `color` — (fader/switch) override the accent colour for this widget

### OSC addresses

Widget values arrive as `/<handle>/SetValue` (float). Widget captions arrive as `/<handle>/SetCaption` (string) and override the config `label` automatically. System values like `/RackspaceName`, `/VariationName`, `/SetBPM`, `/SetGlobalTranspose` update in place.

### Theme

```json
"theme": {
  "background": "#0a0a0a",
  "foreground": "#e0e0e0",
  "accent":     "#ff4444"
}
```

Applied as CSS custom properties (`--gp-bg`, `--gp-fg`, `--gp-accent`) on config load.

---

## Port reference

| Env var | Default | Purpose |
|---|---|---|
| `GP_OSC_SEND_PORT` | `8000` | UDP port the bridge listens on (match GP's Remote client port) |
| `GP_OSC_LISTEN_PORT` | `54344` | UDP port GP listens on (bridge sends `/Refresh` here) |
| `HTTP_PORT` | `3000` | HTTP + WebSocket server (open this URL in Chrome) |

Defaults are set in `.env`. All are optional — the defaults work out of the box.
