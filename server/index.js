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

// Paths
const staticPath = path.join(__dirname, '..', 'frontend', 'dist');
const configPath = path.join(__dirname, '..', 'display-config.json');

// Read config at startup and extract GlobalRackspace widget GetValue addresses.
// GP doesn't send these in /Refresh — we have to query them individually.
function loadGetValueQueries() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const queries = [];
    for (const col of config.layout.columns) {
      for (const item of (col.items || [])) {
        if (item.oscAddress &&
            item.oscAddress.startsWith('/GlobalRackspace/') &&
            item.oscAddress.endsWith('/SetValue')) {
          queries.push(item.oscAddress.replace('/SetValue', '/GetValue'));
        }
      }
    }
    return queries;
  } catch (err) {
    console.warn('Could not parse config for GetValue queries:', err.message);
    return [];
  }
}

const getValueQueries = loadGetValueQueries();
console.log(`Will query ${getValueQueries.length} GlobalRackspace widget(s) on connect:`, getValueQueries);

// Set up Express
const app = express();
app.use(express.static(staticPath));

app.get('/api/config', (req, res) => {
  res.sendFile(configPath);
});

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
    persistCache(oscCache);
    console.log('OSC received: /ClearAll — cache cleared (GlobalRackspace values preserved)');
    broadcast(JSON.stringify({ address: '/ClearAll', args: [] }));
    return;
  }
  const payload = JSON.stringify({
    address: message.address,
    args: message.args,
  });
  oscCache.set(message.address, payload);
  persistCache(oscCache);
  console.log(`OSC received: ${message.address}`, message.args);
  const count = broadcast(payload);
  console.log(`Broadcast to ${count} WS client(s)`);
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

// Watch config file and notify clients when it changes
let reloadTimer = null
fs.watch(configPath, () => {
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => {
    console.log('Config changed — notifying clients to reload')
    broadcast(JSON.stringify({ type: 'config-reload' }))
  }, 200)
})

// Open OSC socket
osc.open();
console.log(`OSC listening for GP messages on UDP port ${GP_OSC_SEND_PORT}`);

// Start HTTP + WS server
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP + WS server listening on port ${HTTP_PORT}`);
  console.log(`Static files served from: ${staticPath}`);
  console.log(`Config file: ${configPath}`);
});
