// ===== Tyap-Lyap: drawing library (deterministic, all by time t) =====
const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eout = k => 1 - Math.pow(1 - k, 3);
const ein = k => k * k * k;
const eback = k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
// damped spring 0->1 overshoot
const spring = (k, f = 4, d = 5) => k <= 0 ? 0 : 1 - Math.exp(-d * k) * Math.cos(f * Math.PI * k);
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
const PAL = {
  sky1: '#141c2b', sky2: '#26344b', sky3: '#3a4a63',
  snow: '#c9d4e2', snowShade: '#9eacc0', ground: '#7f8ea6',
  brick: '#6b4a45', brick2: '#5a3d3a', panel: '#5c6578', panel2: '#4a5263',
  win: '#ffd88a', winOff: '#2a3346',
  hero: '#2f74e6', heroDark: '#1f55b3', cyan: '#5fe3ff',
  yellow: '#ffd23a', red: '#ff3b3b', ink: '#0d0f14', white: '#f4f6fa'
};

// ---------- text ----------
function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.w || 900} ${o.size || 80}px Inter, "Inter Display", sans-serif`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  let size = o.size || 80;
  if (o.maxW) { const m = ctx.measureText(s).width; if (m > o.maxW) { size = size * o.maxW / m; ctx.font = `${o.w || 900} ${size}px Inter, sans-serif`; } }
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeCol || PAL.ink; ctx.strokeText(s, x, y); }
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowB || 30; }
  ctx.fillStyle = o.col || PAL.white; ctx.fillText(s, x, y);
  ctx.restore();
  return size;
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// pill HUD like reference
function pill(ctx, x, y, label, value, col, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(x, y); const sc = 0.6 + 0.4 * spring(k, 2, 6); ctx.scale(sc, sc);
  ctx.font = '900 46px Inter, sans-serif'; const w = Math.max(240, ctx.measureText(value).width + 130);
  txt(ctx, label, 0, -58, { size: 24, w: 800, col: '#cfd6e4' });
  rrect(ctx, -w / 2, -36, w, 72, 36); ctx.fillStyle = '#0f1420'; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  ctx.beginPath(); ctx.arc(-w / 2 + 40, 0, 20, 0, 7); ctx.fillStyle = col; ctx.fill();
  txt(ctx, value, 18, 2, { size: 46, col: PAL.white });
  ctx.restore();
}
function stamp(ctx, s, x, y, k, o = {}) {
  if (k <= 0) return;
  const sc = k < 1 ? lerp(2.6, 1, eout(clamp(k * 1.6))) : 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.12); ctx.scale(sc, sc);
  ctx.globalAlpha = clamp(k * 3);
  const size = o.size || 110; ctx.font = `900 ${size}px Inter, sans-serif`;
  const w = ctx.measureText(s).width + 70, h = size * 1.35;
  ctx.lineWidth = 12; ctx.strokeStyle = o.col || PAL.red; rrect(ctx, -w / 2, -h / 2, w, h, 18); ctx.stroke();
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  txt(ctx, s, 0, 4, { size, col: o.col || PAL.red });
  // grunge holes
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc((hash(i + s.length) - .5) * w, (hash(i * 3.1) - .5) * h, 2 + hash(i * 7) * 5, 0, 7); ctx.fill(); }
  ctx.restore();
}
function bubble(ctx, s, x, y, k, o = {}) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); const sc = spring(clamp(k), 2, 6); ctx.scale(sc, sc);
  ctx.font = `900 ${o.size || 60}px Inter, sans-serif`; const w = ctx.measureText(s).width + 70, h = (o.size || 60) * 1.7;
  ctx.fillStyle = o.bg || PAL.white; rrect(ctx, -w / 2, -h, w, h, 28); ctx.fill();
  ctx.beginPath(); const tx = o.tail ?? -w / 4; ctx.moveTo(tx - 20, -4); ctx.lineTo(tx + 25, -4); ctx.lineTo(tx - 30, 50); ctx.fill();
  txt(ctx, s, 0, -h / 2, { size: o.size || 60, col: o.col || PAL.ink });
  ctx.restore();
}

// ---------- environment ----------
function sky(ctx, top = PAL.sky1, mid = PAL.sky2, bot = PAL.sky3) {
  const g = ctx.createLinearGradient(0, -400, 0, 2200); g.addColorStop(0, top); g.addColorStop(.6, mid); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(-1200, -1200, W + 2400, H + 2400);
}
function ground(ctx, y, col = PAL.snow) {
  const g = ctx.createLinearGradient(0, y, 0, y + 700); g.addColorStop(0, col); g.addColorStop(1, PAL.snowShade);
  ctx.fillStyle = g; ctx.fillRect(-1500, y, W + 3000, 1800);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.ellipse(-1400 + hash(i) * 3900, y + 30 + hash(i + 9) * 500, 60 + hash(i * 2) * 120, 10 + hash(i * 4) * 10, 0, 0, 7); ctx.fill(); }
}
function building(ctx, x, y, w, h, o = {}) { // x,y = bottom-left
  const fl = o.floors || 5, cols = o.cols || 6, col = o.col || PAL.brick;
  ctx.fillStyle = col; ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + w - 14, y - h, 14, h);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y - h, w, 10);
  const ww = w / cols * 0.5, wh = h / fl * 0.45;
  for (let r = 0; r < fl; r++) for (let c = 0; c < cols; c++) {
    const id = (o.seed || 1) * 100 + r * 17 + c;
    let lit = hash(id) < (o.lit ?? 0.45);
    if (o.offAt !== undefined && o.t !== undefined && lit) { if (o.t > o.offAt + hash(id + 5) * (o.offSpread || 2)) lit = false; }
    const wx = x + (c + .25) * w / cols, wy = y - h + (r + .3) * h / fl;
    ctx.fillStyle = lit ? PAL.win : PAL.winOff;
    if (lit) { ctx.shadowColor = '#ffcf6a'; ctx.shadowBlur = 18; }
    ctx.fillRect(wx, wy, ww, wh); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh); ctx.fillRect(wx, wy + wh * .4, ww, 3);
  }
  if (o.roofSnow !== false) { ctx.fillStyle = PAL.snow; rrect(ctx, x - 6, y - h - 12, w + 12, 18, 8); ctx.fill(); }
}
function lamp(ctx, x, y, h = 520, on = 1) {
  ctx.strokeStyle = '#1a1f2b'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.quadraticCurveTo(x, y - h - 40, x + 70, y - h - 40); ctx.stroke();
  ctx.fillStyle = '#1a1f2b'; ctx.fillRect(x + 50, y - h - 50, 60, 20);
  if (on > 0) {
    const g = ctx.createRadialGradient(x + 80, y - h - 25, 5, x + 80, y - h + 200, 420);
    g.addColorStop(0, `rgba(255,214,140,${.55 * on})`); g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 60, y - h - 30); ctx.lineTo(x + 100, y - h - 30); ctx.lineTo(x + 330, y + 20); ctx.lineTo(x - 170, y + 20); ctx.fill();
    ctx.fillStyle = `rgba(255,230,170,${on})`; ctx.shadowColor = '#ffd38a'; ctx.shadowBlur = 40; ctx.fillRect(x + 58, y - h - 32, 44, 10); ctx.shadowBlur = 0;
  }
}
function fence(ctx, x0, x1, y, h = 150) {
  ctx.strokeStyle = '#141820'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(x0, y - h + 20); ctx.lineTo(x1, y - h + 20); ctx.moveTo(x0, y - 25); ctx.lineTo(x1, y - 25); ctx.stroke();
  ctx.lineWidth = 6; for (let x = x0; x < x1; x += 34) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 6, y - h + 8); ctx.lineTo(x, y - h - 10); ctx.lineTo(x + 6, y - h + 8); ctx.fillStyle = '#141820'; ctx.fill(); }
}
function smoke(ctx, x, y, t, n = 10, sc = 1) {
  for (let i = 0; i < n; i++) {
    const p = ((t * 0.12 + i / n) % 1);
    const px = x + p * 260 * sc + Math.sin(t * .6 + i) * 20, py = y - p * 600 * sc, r = (30 + p * 120) * sc;
    ctx.fillStyle = `rgba(190,200,215,${.55 * (1 - p)})`; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
  }
}
function factory(ctx, x, y, t, sign = 'ТЕПЛОКОНТРОЛЬ', signK = 0, signCol = PAL.yellow) {
  // chimneys
  [[x + 90, 640], [x + 230, 760], [x + 760, 680]].forEach(([cx, h], i) => {
    ctx.fillStyle = '#4b3a3a'; ctx.beginPath(); ctx.moveTo(cx - 34, y - 300); ctx.lineTo(cx - 24, y - 300 - h); ctx.lineTo(cx + 24, y - 300 - h); ctx.lineTo(cx + 34, y - 300); ctx.fill();
    ctx.fillStyle = '#c44'; for (let k = 1; k < 3; k++) ctx.fillRect(cx - 27, y - 300 - h + k * 70, 54, 22);
    smoke(ctx, cx, y - 300 - h, t + i * 3, 9, 1);
  });
  ctx.fillStyle = '#3d4456'; ctx.fillRect(x, y - 330, 900, 330);
  ctx.fillStyle = '#353b4b'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 150, y - 330); ctx.lineTo(x + i * 150 + 75, y - 400); ctx.lineTo(x + i * 150 + 150, y - 330); ctx.fill(); }
  for (let i = 0; i < 9; i++) { ctx.fillStyle = hash(i + 3) < .6 ? '#e8c26a' : PAL.winOff; ctx.fillRect(x + 40 + i * 95, y - 250, 60, 110); }
  // sign board on roof
  ctx.fillStyle = '#20242f'; ctx.fillRect(x + 120, y - 470, 660, 70);
  ctx.strokeStyle = '#20242f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 200, y - 400); ctx.lineTo(x + 200, y - 360); ctx.moveTo(x + 700, y - 400); ctx.lineTo(x + 700, y - 360); ctx.stroke();
  txt(ctx, sign, x + 450, y - 434, { size: 52, col: signCol, glow: signCol, glowB: 25, maxW: 620 });
}
function school(ctx, x, y, t) {
  building(ctx, x, y, 820, 520, { floors: 3, cols: 7, col: '#8a5a4c', seed: 7, lit: .7 });
  ctx.fillStyle = '#efe6d5'; ctx.fillRect(x + 330, y - 610, 160, 60); txt(ctx, 'ШКОЛА', x + 410, y - 580, { size: 40, col: '#222' });
  ctx.fillStyle = '#efe6d5'; ctx.beginPath(); ctx.arc(x + 410, y - 470, 40, 0, 7); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 410, y - 470); ctx.lineTo(x + 410, y - 500); ctx.moveTo(x + 410, y - 470); ctx.lineTo(x + 432, y - 470); ctx.stroke();
  ctx.fillStyle = '#3b2b28'; ctx.fillRect(x + 360, y - 160, 100, 160);
}
function garages(ctx, x, y, n = 6, o = {}) {
  for (let i = 0; i < n; i++) {
    const gx = x + i * 240;
    ctx.fillStyle = i % 2 ? '#56606f' : '#4d5665'; ctx.fillRect(gx, y - 260, 236, 260);
    ctx.fillStyle = i % 3 ? '#3d6a5a' : '#6a4a3d'; ctx.fillRect(gx + 28, y - 220, 180, 220);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gx + 118, y - 220); ctx.lineTo(gx + 118, y); ctx.stroke();
    txt(ctx, String(12 + i), gx + 118, y - 240, { size: 26, col: '#e6e6e6', w: 800 });
    ctx.fillStyle = PAL.snow; rrect(ctx, gx - 4, y - 275, 244, 20, 8); ctx.fill();
  }
}
function podezd(ctx, x, y, t, lampOn = 1) {
  building(ctx, x - 600, y, 1400, 1300, { floors: 9, cols: 10, col: PAL.panel, seed: 3, lit: .35 });
  ctx.fillStyle = '#2b3140'; ctx.fillRect(x + 40, y - 260, 200, 260);
  ctx.fillStyle = '#6b4b2e'; ctx.fillRect(x + 60, y - 240, 160, 240);
  ctx.fillStyle = '#c9a36a'; ctx.fillRect(x + 190, y - 130, 14, 14);
  ctx.fillStyle = '#20242f'; ctx.fillRect(x + 10, y - 300, 260, 40);
  ctx.fillStyle = PAL.snow; rrect(ctx, x + 6, y - 316, 268, 20, 8); ctx.fill();
  const on = lampOn * (0.85 + 0.15 * Math.sin(t * 23) * (hash(Math.floor(t * 6)) > .8 ? 1 : 0));
  ctx.fillStyle = `rgba(255,220,150,${on})`; ctx.shadowColor = '#ffd38a'; ctx.shadowBlur = 40 * on; ctx.beginPath(); ctx.arc(x + 140, y - 330, 16, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  const g = ctx.createRadialGradient(x + 140, y - 300, 10, x + 140, y, 420); g.addColorStop(0, `rgba(255,214,140,${.35 * on})`); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(x - 300, y - 360, 900, 460);
}
function snowfall(ctx, t, n = 140, wind = 40, alpha = .9) {
  for (let i = 0; i < n; i++) {
    const sp = 60 + hash(i) * 120, sz = 2 + hash(i + 1) * 6;
    const y = ((hash(i + 2) * H + t * sp) % (H + 100)) - 50;
    const x = ((hash(i + 3) * W + t * wind * (0.5 + hash(i + 4)) + Math.sin(t * 1.3 + i) * 18) % (W + 60) + W + 60) % (W + 60) - 30;
    ctx.fillStyle = `rgba(255,255,255,${alpha * (0.4 + hash(i + 5) * .6)})`; ctx.beginPath(); ctx.arc(x, y, sz, 0, 7); ctx.fill();
  }
}
function vignette(ctx, k = .55, r0 = 380) {
  const g = ctx.createRadialGradient(W / 2, H * .48, r0, W / 2, H * .5, H * .78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(5,7,12,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function grain(ctx, t) {
  const f = Math.floor(t * 24);
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let i = 0; i < 260; i++) { ctx.fillRect(hash(i + f * 13.7) * W, hash(i * 1.7 + f) * H, 2, 2); }
  ctx.fillStyle = 'rgba(0,0,0,.05)';
  for (let i = 0; i < 260; i++) { ctx.fillRect(hash(i * 2.3 + f * 5.1) * W, hash(i * 3.9 + f * 1.3) * H, 2, 2); }
}

// ---------- characters ----------
// o: x,y (feet), s, coat, coat2, cap('knit'|'kepka'|'ushanka'|'none'), capCol, eyes ('cyan'|'white'|'amber'), mood, walk(phase|null),
// aL,aR (arm angles rad, 0 = down), fL,fR (forearm rel), lean, fall (-1..1, rotates to lying), flip, squash, look (-1..1 pupils), bob
function guy(ctx, o) {
  const s = o.s || 1;
  ctx.save(); ctx.translate(o.x, o.y);
  if (o.fall) { ctx.translate(0, -Math.abs(o.fall) * 40 * s); ctx.rotate(o.fall * Math.PI / 2); }
  ctx.scale((o.flip ? -1 : 1) * s * (1 + (o.squash || 0)), s * (1 - (o.squash || 0)));
  if (o.shadow !== false && !o.fall) { ctx.fillStyle = 'rgba(10,15,30,.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 85, 16, 0, 0, 7); ctx.fill(); }
  const ph = o.walk, bob = (ph != null ? Math.abs(Math.sin(ph)) * 10 : 0) + (o.bob || 0);
  ctx.translate(0, -bob);
  ctx.rotate(o.lean || 0);
  const hipY = -150;
  // legs
  const legA = ph != null ? Math.sin(ph) * .5 : (o.legs || 0);
  ctx.strokeStyle = PAL.ink; ctx.lineCap = 'round'; ctx.lineWidth = 13;
  [[-16, legA], [16, -legA]].forEach(([hx, a]) => {
    const kx = hx + Math.sin(a) * 75, ky = hipY + Math.cos(a) * 75;
    const fx = kx + Math.sin(a * .4) * 75 + (ph != null ? 0 : 0), fy = ky + 75;
    ctx.beginPath(); ctx.moveTo(hx, hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, Math.min(fy, bob)); ctx.stroke();
    ctx.fillStyle = o.boot || '#3a2a20'; ctx.beginPath(); ctx.ellipse(fx + 10, Math.min(fy, bob) - 6, 26, 13, 0, 0, 7); ctx.fill();
  });
  // back arm
  const arm = (side, a, f) => {
    const sx = side * 50, sy = -272;
    const ex = sx + Math.sin(a) * 72 * side, ey = sy + Math.cos(a) * 72;
    const a2 = a + (f || 0);
    const hx = ex + Math.sin(a2) * 66 * side, hy = ey + Math.cos(a2) * 66;
    ctx.strokeStyle = o.coat2 || shade(o.coat || PAL.hero); ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = o.mitt || PAL.ink; ctx.beginPath(); ctx.arc(hx, hy, 17, 0, 7); ctx.fill();
    if (o.holds && side === o.holdSide) { // pipe / item
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(-(a2) * side + Math.PI); ctx.fillStyle = '#9aa3ad'; ctx.fillRect(-6, -10, 12, 150); ctx.restore();
    }
  };
  arm(-1, o.aL ?? .15, o.fL ?? 0);
  // torso (jacket)
  ctx.fillStyle = o.coat || PAL.hero;
  ctx.beginPath(); ctx.moveTo(-50, -292); ctx.quadraticCurveTo(0, -306, 50, -292); ctx.lineTo(60, -140); ctx.quadraticCurveTo(0, -128, -60, -140); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-2, -290, 4, 150);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-46, -285, 10, 130);
  if (o.collar) { ctx.fillStyle = o.collar; ctx.beginPath(); ctx.ellipse(0, -292, 56, 18, 0, 0, 7); ctx.fill(); }
  arm(1, o.aR ?? .15, o.fR ?? 0);
  // head
  const hy = -352; ctx.save(); ctx.translate(0, hy); ctx.rotate(o.tilt || 0);
  ctx.fillStyle = '#101218'; ctx.beginPath(); ctx.arc(0, 0, 64, 0, 7); ctx.fill();
  face(ctx, o);
  hat(ctx, o);
  ctx.restore();
  ctx.restore();
}
function shade(hex, k = .72) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) * k, g = (n >> 8 & 255) * k, b = (n & 255) * k; return `rgb(${r | 0},${g | 0},${b | 0})`; }
function face(ctx, o) {
  const mood = o.mood || 'calm', col = o.eyes === 'white' ? '#f2f2f2' : o.eyes === 'amber' ? '#ffc04d' : PAL.cyan;
  const lx = (o.look || 0) * 6;
  if (mood === 'closed' || mood === 'hurt') {
    ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
    if (mood === 'hurt') { [-24, 24].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex - 10, -12); ctx.lineTo(ex + 10, 8); ctx.moveTo(ex + 10, -12); ctx.lineTo(ex - 10, 8); ctx.stroke(); }); }
    else { [-24, 24].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex - 13, -2); ctx.quadraticCurveTo(ex, 6, ex + 13, -2); ctx.stroke(); }); }
  } else {
    const big = mood === 'scared' ? 1.25 : 1, open = o.blink != null ? o.blink : 1;
    [-24, 24].forEach(ex => {
      ctx.save(); ctx.translate(ex, -4); ctx.scale(1, Math.max(.08, open));
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 22; ctx.beginPath(); ctx.ellipse(0, 0, 15 * big, 18 * big, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#0b0d12'; ctx.beginPath(); ctx.arc(lx, 2, (mood === 'scared' ? 5 : 8), 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx + 4, -5, 3.5, 0, 7); ctx.fill();
      ctx.restore();
    });
    if (mood === 'angry' || mood === 'tough') {
      ctx.fillStyle = '#101218'; const d = mood === 'angry' ? 14 : 8;
      ctx.beginPath(); ctx.moveTo(-46, -30); ctx.lineTo(-6, -30 + d); ctx.lineTo(-6, -40); ctx.lineTo(-46, -40); ctx.fill();
      ctx.beginPath(); ctx.moveTo(46, -30); ctx.lineTo(6, -30 + d); ctx.lineTo(6, -40); ctx.lineTo(46, -40); ctx.fill();
    }
    if (mood === 'sad') { ctx.fillStyle = '#101218'; ctx.beginPath(); ctx.moveTo(-44, -36); ctx.lineTo(-6, -26); ctx.lineTo(-6, -40); ctx.fill(); ctx.beginPath(); ctx.moveTo(44, -36); ctx.lineTo(6, -26); ctx.lineTo(6, -40); ctx.fill(); }
  }
  // mouth
  ctx.strokeStyle = 'rgba(230,235,245,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
  if (mood === 'scared') { ctx.ellipse(0, 32, 9, 11 * (o.talk ?? 1), 0, 0, 7); }
  else if (o.talk) { ctx.ellipse(0, 32, 12, 4 + 9 * o.talk, 0, 0, 7); }
  else if (mood === 'angry' || mood === 'sad' || mood === 'hurt') { ctx.moveTo(-12, 36); ctx.quadraticCurveTo(0, 28, 12, 36); }
  else if (mood === 'smirk') { ctx.moveTo(-10, 32); ctx.quadraticCurveTo(4, 38, 14, 28); }
  else { ctx.moveTo(-10, 32); ctx.lineTo(10, 32); }
  ctx.stroke();
  if (o.cig) { ctx.strokeStyle = '#eee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(10, 34); ctx.lineTo(36, 30); ctx.stroke(); ctx.fillStyle = '#ff7a2a'; ctx.shadowColor = '#ff7a2a'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(38, 30, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
}
function hat(ctx, o) {
  const c = o.capCol || '#c23b3b';
  if (o.cap === 'knit') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -18, 64, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(56, -32); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-40, -70); ctx.quadraticCurveTo(0, -150, 40, -70); ctx.fill(); // petushok
    ctx.fillStyle = shade(c, .8); rrect(ctx, -66, -42, 132, 24, 10); ctx.fill();
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-30, -100, 60, 8);
  } else if (o.cap === 'kepka') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(4, -46, 72, 34, -0.05, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.ellipse(40, -44, 52, 12, 0.05, 0, 7); ctx.fill();
    ctx.fillStyle = shade(c, .75); ctx.fillRect(-60, -50, 120, 10);
  } else if (o.cap === 'ushanka') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -46, 74, 40, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = shade(c, 1.25 > 1 ? .85 : 1); rrect(ctx, -76, -60, 152, 32, 14); ctx.fill();
    rrect(ctx, -82, -40, 26, 66, 12); ctx.fill(); rrect(ctx, 56, -40, 26, 66, 12); ctx.fill();
  }
}
// presets
const HERO = (x, y, s, extra = {}) => Object.assign({ x, y, s, coat: PAL.hero, cap: 'knit', capCol: '#2a5cc0', eyes: 'cyan' }, extra);
const THUG = (i, x, y, s, extra = {}) => {
  const coats = ['#3b3f48', '#4a3f35', '#2e3542', '#47403c', '#353a33'];
  const caps = ['kepka', 'ushanka', 'kepka', 'ushanka', 'none'];
  const capc = ['#2a2a2e', '#5a4636', '#393d45', '#6b5a48', '#222'];
  return Object.assign({ x, y, s, coat: coats[i % 5], cap: caps[i % 5], capCol: capc[i % 5], eyes: 'white', mood: 'angry' }, extra);
};
