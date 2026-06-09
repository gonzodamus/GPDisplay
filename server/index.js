require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const OSC = require('osc-js');

// Environment variables with defaults
const GP_OSC_SEND_PORT = parseInt(process.env.GP_OSC_SEND_PORT || '8000', 10);
const GP_OSC_LISTEN_PORT = parseInt(process.env.GP_OSC_LISTEN_PORT || '54344', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const LOG_OSC = process.env.LOG_OSC === '1';

// Paths
const staticPath = path.join(__dirname, '..', 'frontend', 'dist');

// GlobalRackspace widgets shown in MixerLayout.jsx. GP doesn't send these in
// /Refresh, so we query each one when a browser connects. When adding a widget
// to MixerLayout, add its GetValue address here too (and a SendOSCMessage line
// in the Global Rackspace GPScript sync handler — see README).
const getValueQueries = [
  '/GlobalRackspace/k1vol/GetValue',
  '/GlobalRackspace/k2vol/GetValue',
  '/GlobalRackspace/mainvol/GetValue',
  '/GlobalRackspace/ohshit/GetValue',
];

// Set up Express
const app = express();
app.use(express.static(staticPath));

// Create HTTP server from Express app
const httpServer = createServer(app);

// Attach WebSocket server at /ws path
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Persisted cache — survives server restarts
const cachePath = path.join(__dirname, '..', '.osc-cache.json');

function loadPersistedCache() {
  try {
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

function persistCache(cache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(Object.fromEntries(cache)));
  } catch (err) {
    console.warn('Could not persist cache:', err.message);
  }
}

// The cache file is only read at server startup, so a 1s debounce just means
// restored values can be up to 1s stale after a crash — corrected on reconnect.
let persistTimer = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistCache(oscCache);
  }, 1000);
}

// Flush pending cache writes on shutdown
function shutdown() {
  clearTimeout(persistTimer);
  persistCache(oscCache);
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const oscCache = loadPersistedCache();
console.log(`Loaded ${oscCache.size} cached OSC value(s) from disk`);

// Broadcast helper
function broadcast(data) {
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      count++;
    }
  });
  return count;
}

// Set up OSC with DatagramPlugin
const osc = new OSC({
  plugin: new OSC.DatagramPlugin({
    open: { host: '0.0.0.0', port: GP_OSC_SEND_PORT },
  }),
});

// Handle incoming OSC messages — cache then broadcast
osc.on('*', (message) => {
  if (message.address === '/ClearAll') {
    // Preserve GlobalRackspace widget values — GP doesn't resend them on /Refresh
    // so clearing them would leave sliders at 0 until the next manual change
    for (const addr of oscCache.keys()) {
      if (!addr.startsWith('/GlobalRackspace/')) oscCache.delete(addr);
    }
    schedulePersist();
    console.log('OSC received: /ClearAll — cache cleared (GlobalRackspace values preserved)');
    broadcast(JSON.stringify({ address: '/ClearAll', args: [] }));
    return;
  }
  const payload = JSON.stringify({
    address: message.address,
    args: message.args,
  });
  oscCache.set(message.address, payload);
  schedulePersist();
  const count = broadcast(payload);
  if (LOG_OSC) console.log(`OSC received: ${message.address}`, message.args, `→ ${count} WS client(s)`);
});

// Send /Refresh to Gig Performer (handles system-level state)
function sendRefresh() {
  osc.send(new OSC.Message('/Refresh'), {
    host: '127.0.0.1',
    port: GP_OSC_LISTEN_PORT,
  });
  console.log(`Sent /Refresh to GP on port ${GP_OSC_LISTEN_PORT}`);
}

// Send /gp-display/RequestSync — triggers GPScript in Global Rackspace
// to push current values for all global widgets that /Refresh ignores
function sendRequestSync() {
  osc.send(new OSC.Message('/gp-display/RequestSync'), {
    host: '127.0.0.1',
    port: GP_OSC_LISTEN_PORT,
  });
  console.log('Sent /gp-display/RequestSync to GP');
}

// Send GetValue queries for all GlobalRackspace widgets in the config
function queryWidgetValues() {
  getValueQueries.forEach((address) => {
    osc.send(new OSC.Message(address), {
      host: '127.0.0.1',
      port: GP_OSC_LISTEN_PORT,
    });
    console.log(`Queried: ${address}`);
  });
}

// WebSocket client lifecycle — replay cache, then request fresh state from GP
wss.on('connection', (ws) => {
  console.log('WS client connected');
  oscCache.forEach((payload) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
  sendRefresh();
  sendRequestSync();
  queryWidgetValues();

  ws.on('close', () => {
    console.log('WS client disconnected');
  });
});

// Open OSC socket
osc.open();
console.log(`OSC listening for GP messages on UDP port ${GP_OSC_SEND_PORT}`);

// Start HTTP + WS server
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP + WS server listening on port ${HTTP_PORT}`);
  console.log(`Static files served from: ${staticPath}`);});
