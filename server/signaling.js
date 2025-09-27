import { WebSocketServer } from 'ws';
import http from 'http';
import { parse } from 'url';

// In-memory user store (for dev/testing)
const users = new Map(); // nametag -> { nametag, gender, avatar, createdAt, lastLogin }

const server = http.createServer((req, res) => {
  // Simple CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = parse(req.url || '', true);
  // Admin: reset in-memory saved users (dev only)
  if (req.method === 'POST' && url.pathname === '/admin/reset-users') {
    const count = users.size;
    users.clear();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, cleared: count }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      ok: true, 
      connectedClients: Array.from(clients.keys()),
      totalUsers: users.size,
      totalConnections: clients.size
    }));
    return;
  }

  if (req.method === 'GET' && url.pathname && url.pathname.startsWith('/users/')) {
    const nametag = decodeURIComponent(url.pathname.split('/').pop() || '');
    if (!nametag) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing nametag' }));
      return;
    }
    const user = users.get(nametag);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }
    const payload = { ...user, online: clients.has(nametag) };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/users') {
    const q = (url.query && (url.query.q || url.query.query)) ? String(url.query.q || url.query.query).toLowerCase() : '';
    const list = Array.from(users.values());
    const filtered = q
      ? list.filter(u => u.nametag.toLowerCase().includes(q))
      : list;
    const payload = filtered.map(u => ({ ...u, online: clients.has(u.nametag) }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/users') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { nametag, gender, avatar } = JSON.parse(body || '{}');
        if (!nametag || !gender || !avatar) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'nametag, gender, avatar required' }));
          return;
        }
        const now = new Date().toISOString();
        if (users.has(nametag)) {
          const existing = users.get(nametag);
          const updated = { ...existing, nametag, gender, avatar, lastLogin: now };
          users.set(nametag, updated);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updated));
        } else {
          const user = { nametag, gender, avatar, createdAt: now, lastLogin: now };
          users.set(nametag, user);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(user));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});
const wss = new WebSocketServer({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data.type, 'from:', data.sender || data.userId, 'to:', data.target);
      
      switch (data.type) {
        case 'register':
          clients.set(data.userId, ws);
          console.log('User registered:', data.userId, 'Total clients:', clients.size);
          // Update lastLogin if user exists
          if (users.has(data.userId)) {
            const u = users.get(data.userId);
            u.lastLogin = new Date().toISOString();
            users.set(data.userId, u);
          }
          // Broadcast presence online
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({ type: 'presence', userId: data.userId, online: true }));
            }
          });
          break;

        case 'offer':
        case 'callOffer':
        case 'answer':
        case 'iceCandidate':
        case 'reject':
        case 'hangup':
          const targetClient = clients.get(data.target);
          if (targetClient) {
            console.log(`Routing ${data.type} from ${data.sender} to ${data.target}`);
            targetClient.send(JSON.stringify({
              type: data.type === 'callOffer' ? 'offer' : data.type, // Normalize callOffer to offer
              sender: data.sender,
              data: data.data,
              withVideo: data.withVideo
            }));
          } else {
            console.log(`Target client ${data.target} not found for ${data.type}`);
          }
          break;

        case 'chat': {
          const target = clients.get(data.target);
          if (target) {
            target.send(JSON.stringify({
              type: 'chat',
              sender: data.sender,
              content: data.content,
              timestamp: Date.now(),
            }));
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    clients.forEach((client, userId) => {
      if (client === ws) {
        clients.delete(userId);
        // no-op: online status will reflect disconnection in subsequent queries
        // Broadcast presence offline
        wss.clients.forEach((c) => {
          if (c.readyState === 1) {
            c.send(JSON.stringify({ type: 'presence', userId, online: false }));
          }
        });
      }
    });
  });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});