// BILIM QADAM — тест қосымшасының сервері.
// Беттің өзін береді және сынып рейтингін Postgres-те сақтайды.
// DATABASE_URL болмаса, рейтинг сервер жадында сақталады (жергілікті тексеру үшін).

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public', 'index.html');
const SUBJECT_IDS = ['alg', 'geo', 'phy', 'inf'];

let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const useSsl = process.env.PGSSL === 'true';
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 5,
  });
  pool.on('error', (err) => console.error('pg pool error', err.message));
}

const memory = new Map(); // DATABASE_URL жоқ кезде ғана
let dbReady = false;

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      cls         TEXT NOT NULL DEFAULT '',
      best        JSONB NOT NULL DEFAULT '{}'::jsonb,
      total       INTEGER NOT NULL DEFAULT 0,
      xp          INTEGER NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await pool.query('CREATE INDEX IF NOT EXISTS players_total_idx ON players (total DESC, updated_at ASC)');
  dbReady = true;
}

// ---------- validation ----------
function cleanText(v, max) {
  if (typeof v !== 'string') return '';
  // басқару таңбаларын алып тастаймыз
  return Array.from(v).filter((ch) => { const c = ch.codePointAt(0); return !(c < 32 || (c >= 127 && c <= 159) || (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202e)); }).join('').trim().slice(0, max);
}
function validScore(body) {
  if (!body || typeof body !== 'object') return null;
  const id = typeof body.id === 'string' ? body.id : '';
  if (!/^p[a-z0-9]{6,40}$/.test(id)) return null;
  const name = cleanText(body.name, 28);
  if (name.length < 2) return null;
  const cls = cleanText(body.cls, 6);
  const best = {};
  let total = 0;
  for (const k of SUBJECT_IDS) {
    const v = body.best && body.best[k];
    if (Number.isInteger(v) && v >= 0 && v <= 10) { best[k] = v; total += v; }
  }
  const xpRaw = Number(body.xp);
  const xp = Number.isFinite(xpRaw) ? Math.max(0, Math.min(1000000, Math.round(xpRaw))) : 0;
  return { id, name, cls, best, total, xp };
}

// ---------- storage ----------
async function saveScore(s) {
  if (!pool) { memory.set(s.id, { ...s, updated: Date.now() }); return; }
  await pool.query(
    `INSERT INTO players (id, name, cls, best, total, xp, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, cls = EXCLUDED.cls, best = EXCLUDED.best,
       total = EXCLUDED.total, xp = EXCLUDED.xp, updated_at = now()`,
    [s.id, s.name, s.cls, JSON.stringify(s.best), s.total, s.xp]
  );
}
async function topPlayers(me) {
  let rows;
  if (!pool) {
    rows = [...memory.values()].sort((a, b) => b.total - a.total || a.updated - b.updated).slice(0, 20);
  } else {
    const r = await pool.query('SELECT id, name, cls, total, xp FROM players WHERE total > 0 OR id = $1 ORDER BY total DESC, updated_at ASC LIMIT 20', [me || '']);
    rows = r.rows;
  }
  let count = rows.length;
  if (pool) {
    const c = await pool.query('SELECT count(*)::int AS n FROM players');
    count = c.rows[0].n;
  } else count = memory.size;
  // id-лерді сыртқа шығармаймыз: тек «бұл сенсің» белгісі
  return { players: rows.map((r) => ({ name: r.name, cls: r.cls, total: r.total, me: r.id === me })), count };
}

// ---------- http ----------
function send(res, status, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// қарапайым жылдамдық шектеуі: бір IP-ден минутына 30 жазба
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.n > 30;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      // база бапталған, бірақ қосылмаса — сервис дайын емес
      if (pool && !dbReady) return send(res, 503, { ok: false, db: 'unavailable' });
      return send(res, 200, { ok: true, db: pool ? 'postgres' : 'memory' });
    }

    if (req.method === 'GET' && url.pathname === '/api/top') {
      const me = url.searchParams.get('me') || '';
      return send(res, 200, await topPlayers(/^p[a-z0-9]{6,40}$/.test(me) ? me : ''));
    }

    if (req.method === 'POST' && url.pathname === '/api/score') {
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      if (rateLimited(ip)) return send(res, 429, { error: 'rate_limited' });
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) { return send(res, 400, { error: 'bad_json' }); }
      const s = validScore(body);
      if (!s) return send(res, 400, { error: 'invalid' });
      await saveScore(s);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return send(res, 200, fs.readFileSync(INDEX), 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'server_error' });
  }
});

initDb()
  .catch((e) => console.error('DB init failed:', e.message))
  .finally(() => server.listen(PORT, () => console.log('BILIM QADAM listening on ' + PORT + (pool ? ' (postgres)' : ' (memory)'))));
