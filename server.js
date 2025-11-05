const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787;
const PUBLIC_DIR = path.join(__dirname, 'public');

// -------------------- HTTP SERVER --------------------
const server = http.createServer((req, res) => {
  const safePath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PUBLIC_DIR, path.normalize(safePath).replace(/^\\/g, ''));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.createReadStream(indexPath)
        .on('error', () => {
          res.writeHead(404);
          res.end('Not Found');
        })
        .pipe(res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.ico': 'image/x-icon'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// -------------------- WEBSOCKET SERVER --------------------
const wss = new WebSocket.Server({ server });

const rooms = new Map(); // roomCode -> room state
const clientMeta = new Map(); // ws -> {roomCode, role}

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(room, payload) {
  send(room.hostWS, payload);
  send(room.guestWS, payload);
}

function getRoom(role, ws) {
  const meta = clientMeta.get(ws);
  if (!meta) return null;
  const room = rooms.get(meta.roomCode);
  if (!room) return null;
  if (role && meta.role !== role) return null;
  return room;
}

function resetRoomForBattle(room) {
  room.ready = { host: false, guest: false };
  room.lastSlots = { host: [null, null, null], guest: [null, null, null] };
}

function safeCleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.hostWS || room.guestWS) return;
  if (room.timeoutHandle) {
    clearTimeout(room.timeoutHandle);
  }
  rooms.delete(code);
}

function detachClient(ws) {
  const meta = clientMeta.get(ws);
  if (!meta) return;
  const room = rooms.get(meta.roomCode);
  if (room) {
    if (meta.role === 'host' && room.hostWS === ws) {
      room.hostWS = null;
      broadcast(room, { type: 'ERROR', message: 'Host disconnected. PvP завершён.' });
    }
    if (meta.role === 'guest' && room.guestWS === ws) {
      room.guestWS = null;
      broadcast(room, { type: 'ERROR', message: 'Guest disconnected. PvP завершён.' });
    }
    resetRoomForBattle(room);
    safeCleanupRoom(meta.roomCode);
  }
  clientMeta.delete(ws);
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      send(ws, { type: 'ERROR', message: 'Bad JSON' });
      return;
    }

    switch (msg.type) {
      case 'HELLO': {
        send(ws, { type: 'HELLO_ACK', message: 'Welcome to Mirror Fight server' });
        break;
      }
      case 'CREATE_ROOM': {
        const code = generateRoomCode();
        const room = {
          code,
          hostWS: ws,
          guestWS: null,
          ready: { host: false, guest: false },
          lastSlots: { host: [null, null, null], guest: [null, null, null] },
          timeoutHandle: null
        };
        rooms.set(code, room);
        clientMeta.set(ws, { roomCode: code, role: 'host' });
        send(ws, { type: 'ROOM_CREATED', roomCode: code });
        send(ws, { type: 'JOINED', role: 'host', roomCode: code });
        break;
      }
      case 'JOIN_ROOM': {
        const { roomCode } = msg;
        const room = rooms.get(roomCode);
        if (!room) {
          send(ws, { type: 'ERROR', message: 'Комната не найдена' });
          break;
        }
        if (room.guestWS && room.guestWS !== ws) {
          send(ws, { type: 'ERROR', message: 'Комната уже занята' });
          break;
        }
        room.guestWS = ws;
        clientMeta.set(ws, { roomCode, role: 'guest' });
        send(ws, { type: 'JOINED', role: 'guest', roomCode });
        if (room.hostWS) {
          send(room.hostWS, { type: 'GUEST_JOINED', roomCode });
        }
        break;
      }
      case 'LEAVE_ROOM': {
        detachClient(ws);
        break;
      }
      case 'PVP_READY': {
        const room = getRoom(null, ws);
        if (!room) {
          send(ws, { type: 'ERROR', message: 'Комната не найдена' });
          break;
        }
        if (room.timeoutHandle) {
          clearTimeout(room.timeoutHandle);
          room.timeoutHandle = null;
        }
        if (!room.guestWS) {
          send(ws, { type: 'PVP_WAITING_GUEST' });
          room.timeoutHandle = setTimeout(() => {
            send(ws, { type: 'PVP_TIMEOUT' });
            room.timeoutHandle = null;
          }, 10000);
          break;
        }
        resetRoomForBattle(room);
        broadcast(room, { type: 'PVP_START', battleSeed: Date.now() });
        break;
      }
      case 'SET_SLOTS': {
        const room = getRoom(null, ws);
        if (!room) {
          send(ws, { type: 'ERROR', message: 'Комната не найдена' });
          break;
        }
        const meta = clientMeta.get(ws);
        if (!meta) break;
        const key = meta.role === 'host' ? 'host' : 'guest';
        room.lastSlots[key] = Array.isArray(msg.slots) ? msg.slots.slice(0, 3) : [null, null, null];
        const other = key === 'host' ? 'guest' : 'host';
        const target = key === 'host' ? room.guestWS : room.hostWS;
        if (target) {
          send(target, { type: 'OPPONENT_SLOTS', slots: room.lastSlots[key] });
        }
        break;
      }
      case 'SET_READY': {
        const room = getRoom(null, ws);
        if (!room) {
          send(ws, { type: 'ERROR', message: 'Комната не найдена' });
          break;
        }
        const meta = clientMeta.get(ws);
        if (!meta) break;
        const key = meta.role === 'host' ? 'host' : 'guest';
        room.ready[key] = Boolean(msg.ready);
        const other = key === 'host' ? 'guest' : 'host';
        const target = key === 'host' ? room.guestWS : room.hostWS;
        if (target) {
          send(target, { type: 'OPPONENT_READY', ready: room.ready[key] });
        }
        if (room.ready.host && room.ready.guest) {
          broadcast(room, { type: 'PVP_REVEAL' });
          room.ready.host = false;
          room.ready.guest = false;
        }
        break;
      }
      default: {
        send(ws, { type: 'ERROR', message: `Unknown message type: ${msg.type}` });
      }
    }
  });

  ws.on('close', () => {
    detachClient(ws);
  });

  ws.on('error', () => {
    detachClient(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Mirror Fight server listening on http://localhost:${PORT}`);
});
