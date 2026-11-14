// Сервер игры: раздаёт статику из public/ и держит комнаты по коду через WebSocket.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const THREE_FILE = path.join(__dirname, 'node_modules', 'three', 'build', 'three.module.js');
const MAX_PLAYERS = 5;
const TICK_HZ = 15;
const MODES = ['drift', 'traffic', 'free'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { rel = '/'; }
  if (rel === '/') rel = '/index.html';
  const file = rel === '/vendor/three.module.js'
    ? THREE_FILE
    : path.normalize(path.join(PUBLIC_DIR, rel));
  if (file !== THREE_FILE && !file.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': file === THREE_FILE ? 'public, max-age=86400' : 'no-cache',
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 4096 });

/** code -> { code, mode, seed, players: Map<id, player> } */
const rooms = new Map();
let nextId = 1;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
}

const num = (v, lim = 1e6) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < lim ? v : 0);
const cleanName = (s) => String(s || 'Игрок').replace(/[<>&"'`]/g, '').trim().slice(0, 16) || 'Игрок';
const cleanColor = (s) => (/^#[0-9a-fA-F]{6}$/.test(s) ? s : '#e53935');

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function leave(ws) {
  const room = ws.room;
  if (!room) return;
  room.players.delete(ws.id);
  ws.room = null;
  for (const p of room.players.values()) send(p.ws, { t: 'leave', id: ws.id });
  if (room.players.size === 0) rooms.delete(room.code);
}

function joinRoom(ws, room, name, color) {
  const player = {
    id: ws.id, ws, name: cleanName(name), color: cleanColor(color),
    x: 0, z: 0, h: 0, vx: 0, vz: 0, d: 0, sc: 0, best: 0,
  };
  room.players.set(ws.id, player);
  ws.room = room;
  send(ws, { t: 'welcome', id: ws.id, code: room.code, mode: room.mode, seed: room.seed, now: Date.now(), max: MAX_PLAYERS });
  for (const p of room.players.values()) {
    if (p.id !== ws.id) send(p.ws, { t: 'info', text: `${player.name} в комнате` });
  }
}

wss.on('connection', (ws) => {
  ws.id = nextId++;
  ws.room = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;

    switch (m.t) {
      case 'create': {
        leave(ws);
        const mode = MODES.includes(m.mode) ? m.mode : 'free';
        const room = { code: makeCode(), mode, seed: Math.floor(Math.random() * 1e9), players: new Map() };
        rooms.set(room.code, room);
        joinRoom(ws, room, m.name, m.color);
        break;
      }
      case 'join': {
        const code = String(m.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) return send(ws, { t: 'error', text: 'Комната не найдена' });
        if (room.players.size >= MAX_PLAYERS) return send(ws, { t: 'error', text: `Комната заполнена (макс. ${MAX_PLAYERS})` });
        leave(ws);
        joinRoom(ws, room, m.name, m.color);
        break;
      }
      case 's': {
        const p = ws.room && ws.room.players.get(ws.id);
        if (!p) return;
        p.x = num(m.x); p.z = num(m.z); p.h = num(m.h, 1e4);
        p.vx = num(m.vx, 500); p.vz = num(m.vz, 500);
        p.d = m.d ? 1 : 0;
        p.sc = Math.max(0, Math.floor(num(m.sc, 1e9)));
        if (p.sc > p.best) p.best = p.sc;
        break;
      }
      case 'ping':
        send(ws, { t: 'pong', c: num(m.c, 1e15), now: Date.now() });
        break;
      case 'leave':
        leave(ws);
        break;
    }
  });

  ws.on('close', () => leave(ws));
});

// Рассылка снапшотов всем игрокам в комнате.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    const players = [];
    for (const p of room.players.values()) {
      players.push({
        id: p.id, name: p.name, color: p.color,
        x: +p.x.toFixed(2), z: +p.z.toFixed(2), h: +p.h.toFixed(3),
        vx: +p.vx.toFixed(2), vz: +p.vz.toFixed(2), d: p.d, sc: p.sc, best: p.best,
      });
    }
    const msg = JSON.stringify({ t: 'snap', now, players });
    for (const p of room.players.values()) if (p.ws.readyState === 1) p.ws.send(msg);
  }
}, 1000 / TICK_HZ);

// Отключаем «мёртвые» соединения.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 15000);

server.listen(PORT, () => console.log(`Drift game: http://localhost:${PORT}`));
