// Procedural canvas textures.
import * as THREE from 'three';
import { rng, clamp } from './core.js';

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function toTex(c, { repeat = null, srgb = true, mips = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  if (!mips) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
const hex = c => '#' + new THREE.Color(c).getHexString();
function shade(c, k) { const col = new THREE.Color(c); col.multiplyScalar(k); return '#' + col.getHexString(); }

// speckle noise overlay
function speckle(ctx, w, h, n, alpha, seed, light = false, size = 1.5) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
    const s = size * (0.5 + r());
    ctx.fillRect(r() * w, r() * h, s, s);
  }
}

// ---------- fabrics ----------
// Knit (V stitches) — returns {map,bump}
export function knit(color, { cols = 48, rows = 64, w = 512, h = 512, seed = 1, pattern = null } = {}) {
  const c = canvas(w, h), x = c.getContext('2d');
  const b = canvas(w, h), y = b.getContext('2d');
  x.fillStyle = hex(color); x.fillRect(0, 0, w, h);
  y.fillStyle = '#808080'; y.fillRect(0, 0, w, h);
  const cw = w / cols, ch = h / rows, r = rng(seed);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const px = i * cw, py = j * ch;
    let col = pattern ? pattern(i, j, cols, rows) : null;
    col = col || color;
    const k = 0.9 + r() * 0.16;
    for (const side of [-1, 1]) {
      x.save(); x.translate(px + cw / 2 + side * cw * 0.22, py + ch / 2); x.rotate(side * 0.45);
      const g = x.createLinearGradient(0, -ch * 0.6, 0, ch * 0.6);
      g.addColorStop(0, shade(col, 0.78 * k)); g.addColorStop(0.5, shade(col, 1.08 * k)); g.addColorStop(1, shade(col, 0.72 * k));
      x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, cw * 0.28, ch * 0.62, 0, 0, Math.PI * 2); x.fill(); x.restore();
      y.save(); y.translate(px + cw / 2 + side * cw * 0.22, py + ch / 2); y.rotate(side * 0.45);
      const g2 = y.createRadialGradient(0, 0, 0, 0, 0, ch * 0.6);
      g2.addColorStop(0, '#d8d8d8'); g2.addColorStop(1, '#3a3a3a');
      y.fillStyle = g2; y.beginPath(); y.ellipse(0, 0, cw * 0.28, ch * 0.62, 0, 0, Math.PI * 2); y.fill(); y.restore();
    }
  }
  speckle(x, w, h, 3000, 0.08, seed + 5);
  return { map: toTex(c), bump: toTex(b, { srgb: false }) };
}

// Aiko's red sweater with a deer on the front and snowflake bands
const DEER = [
  '.....#...#.....',
  '....#.#.#.#....',
  '.....##.##.....',
  '......###......',
  '.....#####.....',
  '......###......',
  '......###......',
  '...#########...',
  '..###########..',
  '..###########..',
  '..##.#####.##..',
  '..##.##.##.##..',
  '..#..#...#..#..',
];
export function deerSweater() {
  const red = 0xb32128, white = 0xf3ece0, green = 0x1f5a3a;
  return knit(red, {
    cols: 96, rows: 72, w: 1024, h: 768, seed: 7, pattern: (i, j, cols, rows) => {
      // bands near the hem and chest (j=0 is top)
      if (j >= rows - 6 && j < rows - 3) return ((i + j) % 4 === 0) ? white : green;
      if (j === rows - 7 || j === rows - 2) return white;
      if (j >= 12 && j <= 14) return (i % 6 === 2 || (j === 13 && i % 6 >= 1 && i % 6 <= 3)) ? white : null;
      // deer centered at u=0.5 (front)
      const cx = Math.floor(cols * 0.5), di = i - (cx - 7), dj = j - 22;
      if (di >= 0 && di < 15 && dj >= 0 && dj < DEER.length && DEER[dj][di] === '#') return white;
      if (dj >= 0 && dj < 13 && (di === -3 || di === 17) && (dj % 3 === 1)) return white;
      return null;
    }
  });
}
export function cardigan() { // mom: warm terracotta cable knit with cream placket at front (u=0.5)
  const base = 0xb8673e;
  const k = knit(base, {
    cols: 80, rows: 64, w: 1024, h: 768, seed: 11, pattern: (i, j, cols) => {
      const d = Math.abs(i - cols * 0.5);
      if (d < 2.2) return 0xece2cf; // blouse peeking
      if (d < 3.4) return 0x8c4a2b; // placket edge
      if ((i % 10 === 0)) return 0xa35834; // rib lines
      return null;
    }
  });
  // buttons
  const ctx = k.map.image.getContext('2d');
  for (let j = 0; j < 6; j++) {
    const x = 1024 * 0.5 + 34, y = 120 + j * 100;
    ctx.fillStyle = '#5a3420'; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a4a30'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 6, 0, 7); ctx.fill();
  }
  k.map.needsUpdate = true;
  return k;
}
export function fleece(color, seed = 3) { // hoodie fabric
  const w = 512, h = 512, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = hex(color); x.fillRect(0, 0, w, h);
  speckle(x, w, h, 20000, 0.1, seed, false, 2); speckle(x, w, h, 12000, 0.06, seed + 1, true, 2);
  const b = canvas(w, h), y = b.getContext('2d'); y.fillStyle = '#808080'; y.fillRect(0, 0, w, h);
  speckle(y, w, h, 30000, 0.25, seed + 2, true, 2); speckle(y, w, h, 30000, 0.25, seed + 3, false, 2);
  return { map: toTex(c, { repeat: [3, 3] }), bump: toTex(b, { srgb: false, repeat: [3, 3] }) };
}
export function plaid(c1 = 0x8f2a2a, c2 = 0x1f2f4f, c3 = 0xd9c9a8) {
  const w = 512, h = 512, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = hex(c1); x.fillRect(0, 0, w, h);
  const bands = [[0, 60, c2, 0.85], [120, 26, c2, 0.7], [200, 10, c3, 0.8], [300, 70, c2, 0.85], [420, 8, c3, 0.7]];
  for (const [p, s, col, a] of bands) {
    x.globalAlpha = a * 0.55; x.fillStyle = hex(col);
    x.fillRect(p, 0, s, h); x.fillRect(0, p, w, s);
  }
  x.globalAlpha = 1;
  // twill diagonal
  x.strokeStyle = 'rgba(0,0,0,0.08)';
  for (let i = -h; i < w; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
  return { map: toTex(c, { repeat: [3, 3] }) };
}
export function denim(color = 0x2d3e5c) {
  const w = 256, h = 256, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = hex(color); x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let i = -h; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
  speckle(x, w, h, 4000, 0.12, 9, true);
  return { map: toTex(c, { repeat: [4, 4] }) };
}
export function quilted(color) { // puffer jacket channels (v direction)
  const w = 256, h = 512, c = canvas(w, h), x = c.getContext('2d');
  const b = canvas(w, h), y = b.getContext('2d');
  for (let j = 0; j < 8; j++) {
    const g = x.createLinearGradient(0, j * 64, 0, j * 64 + 64);
    g.addColorStop(0, shade(color, 0.6)); g.addColorStop(0.5, shade(color, 1.15)); g.addColorStop(1, shade(color, 0.6));
    x.fillStyle = g; x.fillRect(0, j * 64, w, 64);
    const g2 = y.createLinearGradient(0, j * 64, 0, j * 64 + 64);
    g2.addColorStop(0, '#000'); g2.addColorStop(0.5, '#fff'); g2.addColorStop(1, '#000');
    y.fillStyle = g2; y.fillRect(0, j * 64, w, 64);
  }
  return { map: toTex(c, { repeat: [1, 1] }), bump: toTex(b, { srgb: false }) };
}

// ---------- face shells (stubble / blush / wrinkles) on the equirect head sphere ----------
// u=0.25 is +X? In three SphereGeometry, +Z (front) is at u=0.25, v=0.5 (equator).
export function faceShell({ stubble = 0, blush = 0, wrinkles = 0, freckles = 0, seed = 2, stubbleColor = '#2a1d16' }) {
  const w = 1024, h = 512, c = canvas(w, h), x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  const r = rng(seed);
  const U = (lon) => (0.25 + lon / (Math.PI * 2)) * w; // lon: angle from front toward +X? (approx)
  const Vv = (lat) => (0.5 - lat / Math.PI) * h; // lat up positive
  if (stubble > 0) {
    const poly = [[-1.05, -0.08], [-0.72, -0.22], [-0.38, -0.27], [-0.13, -0.24], [0.13, -0.24], [0.38, -0.27], [0.72, -0.22], [1.05, -0.08], [1.15, -0.85], [0.5, -1.3], [-0.5, -1.3], [-1.15, -0.85]];
    x.save(); x.filter = 'blur(7px)'; x.fillStyle = `rgba(45,40,48,${0.32 * stubble})`;
    x.beginPath(); poly.forEach(([lo, la], i) => i ? x.lineTo(U(lo), Vv(la)) : x.moveTo(U(lo), Vv(la))); x.closePath(); x.fill(); x.restore();
    x.save(); x.beginPath(); poly.forEach(([lo, la], i) => i ? x.lineTo(U(lo), Vv(la)) : x.moveTo(U(lo), Vv(la))); x.closePath(); x.clip();
    for (let i = 0; i < 60000 * stubble; i++) { x.fillStyle = `rgba(30,24,22,${0.08 + r() * 0.12})`; x.fillRect(r() * w, r() * h, 1, 1); }
    x.restore();
  }
  if (blush > 0) {
    for (const s of [-1, 1]) {
      const g = x.createRadialGradient(U(s * 0.55), Vv(-0.2), 0, U(s * 0.55), Vv(-0.2), 60);
      g.addColorStop(0, `rgba(235,110,110,${0.5 * blush})`); g.addColorStop(1, 'rgba(235,110,110,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
  }
  if (freckles > 0) {
    for (let i = 0; i < 40 * freckles; i++) {
      const s = r() < 0.5 ? -1 : 1, lon = s * (0.2 + r() * 0.45), lat = -0.05 - r() * 0.2;
      x.fillStyle = `rgba(150,80,50,${0.25 + r() * 0.2})`; x.beginPath(); x.arc(U(lon), Vv(lat), 1.5 + r() * 1.5, 0, 7); x.fill();
    }
  }
  if (wrinkles > 0) {
    x.strokeStyle = `rgba(110,60,45,${0.35 * wrinkles})`; x.lineWidth = 2;
    for (const s of [-1, 1]) {
      // nasolabial folds
      x.beginPath(); x.moveTo(U(s * 0.24), Vv(-0.1)); x.quadraticCurveTo(U(s * 0.33), Vv(-0.3), U(s * 0.3), Vv(-0.48)); x.stroke();
      // crow's feet
      for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(U(s * 0.62), Vv(0.12 + k * 0.04 - 0.04)); x.lineTo(U(s * 0.72), Vv(0.1 + k * 0.07 - 0.07)); x.stroke(); }
    }
    for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(U(-0.3), Vv(0.52 + k * 0.06)); x.quadraticCurveTo(U(0), Vv(0.55 + k * 0.06), U(0.3), Vv(0.52 + k * 0.06)); x.stroke(); }
  }
  return toTex(c);
}

// Eye texture: equirect sphere where +Z (u=.25,v=.5) is the pupil.
export function eyeTex(iris = 0x5a3a22, { irisR = 0.5, pupilR = 0.21, seed = 4 } = {}) {
  const w = 256, h = 128, c = canvas(w, h), x = c.getContext('2d');
  const img = x.createImageData(w, h), d = img.data;
  const ic = new THREE.Color(iris), r = rng(seed);
  const stri = Array.from({ length: 64 }, () => r());
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / w, v = (j + 0.5) / h;
    const phi = u * Math.PI * 2, th = v * Math.PI;
    const X = -Math.cos(phi) * Math.sin(th), Y = Math.cos(th), Z = Math.sin(phi) * Math.sin(th);
    const ang = Math.acos(clamp(Z, -1, 1));
    const az = Math.atan2(Y, X);
    let R, G, B;
    if (ang < pupilR) { R = G = B = 8; }
    else if (ang < irisR) {
      const k = (ang - pupilR) / (irisR - pupilR);
      const s = stri[Math.floor(((az / (Math.PI * 2)) + 1) * 64) % 64];
      const bright = 0.75 + 0.5 * (1 - k) * (0.6 + 0.4 * s) - 0.45 * Math.max(0, k - 0.82) / 0.18;
      const inner = 1 + 0.35 * Math.max(0, 0.35 - k);
      R = ic.r * 255 * bright * inner; G = ic.g * 255 * bright * inner; B = ic.b * 255 * bright;
      if (k > 0.86) { R *= 0.35; G *= 0.35; B *= 0.35; }
    } else {
      const k = clamp((ang - irisR) / 1.2);
      R = 246 - 25 * k; G = 240 - 30 * k; B = 236 - 30 * k;
      if (r() < 0.002 && ang > 0.9) { R = 210; G = 120; B = 120; }
    }
    const o = (j * w + i) * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return toTex(c);
}

// ---------- environment ----------
export function gradientTex(stops, w = 4, h = 512) {
  const c = canvas(w, h), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h);
  for (const [p, col] of stops) g.addColorStop(p, col);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  return toTex(c);
}
export function snowTex(seed = 1) {
  const w = 512, h = 512, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#e9eef5'; x.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < 60; i++) {
    const g = x.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 30 + r() * 80);
    g.addColorStop(0, 'rgba(180,190,210,0.12)'); g.addColorStop(1, 'rgba(180,190,210,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  speckle(x, w, h, 8000, 0.25, seed + 1, true, 1.2);
  const b = canvas(w, h), y = b.getContext('2d'); y.fillStyle = '#808080'; y.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const cx = r() * w, cy = r() * h, rr = 8 + r() * 40;
    const g = y.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, `rgba(255,255,255,${0.15 + r() * 0.2})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    y.fillStyle = g; y.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  return { map: toTex(c, { repeat: [6, 6] }), bump: toTex(b, { srgb: false, repeat: [6, 6] }) };
}
export function woodTex(base = 0x7a5232, { w = 512, h = 512, planks = 6, seed = 3, repeat = [2, 2] } = {}) {
  const c = canvas(w, h), x = c.getContext('2d'), r = rng(seed);
  const ph = h / planks;
  for (let p = 0; p < planks; p++) {
    const k = 0.85 + r() * 0.3;
    x.fillStyle = shade(base, k); x.fillRect(0, p * ph, w, ph);
    for (let l = 0; l < 30; l++) {
      x.strokeStyle = `rgba(40,20,10,${0.05 + r() * 0.08})`; x.lineWidth = 1 + r() * 2;
      const yy = p * ph + r() * ph; x.beginPath(); x.moveTo(0, yy);
      for (let xx = 0; xx <= w; xx += 32) x.lineTo(xx, yy + Math.sin(xx * 0.02 + l) * 3);
      x.stroke();
    }
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, p * ph, w, 2);
  }
  return toTex(c, { repeat });
}
export function wallpaper(base, accent, { w = 512, h = 512, seed = 5, motif = 'stripe', repeat = [4, 2] } = {}) {
  const c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = hex(base); x.fillRect(0, 0, w, h);
  x.fillStyle = hex(accent);
  if (motif === 'stripe') { for (let i = 0; i < w; i += 64) { x.globalAlpha = 0.25; x.fillRect(i, 0, 18, h); } }
  if (motif === 'damask') {
    x.globalAlpha = 0.22;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const cx = i * 128 + (j % 2) * 64 + 32, cy = j * 128 + 64;
      x.beginPath(); x.ellipse(cx, cy, 16, 34, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(cx, cy, 34, 12, 0, 0, 7); x.fill();
    }
  }
  x.globalAlpha = 1;
  speckle(x, w, h, 6000, 0.05, seed);
  return toTex(c, { repeat });
}
export function tablecloth() {
  const w = 512, h = 512, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#ddd2bf'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(170,40,40,0.55)'; x.lineWidth = 10;
  x.strokeRect(24, 24, w - 48, h - 48); x.lineWidth = 3; x.strokeRect(44, 44, w - 88, h - 88);
  x.strokeStyle = 'rgba(0,0,0,0.04)'; x.lineWidth = 1;
  for (let i = 0; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  return toTex(c);
}

// Building facade with windows (albedo + emissive). target: {col,row} cut-out (transparent in albedo alpha)
export function facade({ cols = 8, rows = 9, seed = 1, wall = '#b7b1a6', target = null, lit = 0.92, w = 1024, h = 1152 }) {
  const c = canvas(w, h), x = c.getContext('2d');
  const e = canvas(w, h), y = e.getContext('2d');
  const r = rng(seed);
  x.fillStyle = wall; x.fillRect(0, 0, w, h);
  // panels
  const cw = w / cols, rh = h / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    x.fillStyle = `rgba(0,0,0,${r() * 0.07})`; x.fillRect(i * cw, j * rh, cw, rh);
    x.strokeStyle = 'rgba(60,60,60,0.35)'; x.lineWidth = 2; x.strokeRect(i * cw, j * rh, cw, rh);
  }
  speckle(x, w, h, 14000, 0.1, seed + 3);
  y.fillStyle = '#000'; y.fillRect(0, 0, w, h);
  const warm = ['#ffb35a', '#ffc77a', '#ff9e45', '#ffd59a', '#ffbf6e', '#ffa860'];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const wx = i * cw + cw * 0.22, wy = j * rh + rh * 0.22, ww = cw * 0.56, wh = rh * 0.52;
    // frame
    x.fillStyle = '#e6e3dc'; x.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
    // sill with snow
    x.fillStyle = '#f4f7fb'; x.fillRect(wx - 8, wy + wh + 4, ww + 16, 7);
    const isTarget = target && target.col === i && target.row === j;
    if (isTarget) { x.clearRect(wx, wy, ww, wh); continue; }
    const on = r() < lit;
    if (!on) { x.fillStyle = '#1b2230'; x.fillRect(wx, wy, ww, wh); continue; }
    const col = r() < 0.08 ? '#9fc4ff' : warm[Math.floor(r() * warm.length)];
    const g = y.createLinearGradient(wx, wy, wx, wy + wh);
    g.addColorStop(0, shade(col, 0.75)); g.addColorStop(1, col);
    y.fillStyle = g; y.fillRect(wx, wy, ww, wh);
    // curtains
    if (r() < 0.6) { y.fillStyle = 'rgba(120,50,20,0.55)'; y.fillRect(wx, wy, ww * 0.18, wh); y.fillRect(wx + ww * 0.82, wy, ww * 0.18, wh); }
    // tree
    if (r() < 0.25) {
      const tx = wx + ww * (0.25 + r() * 0.5), ty = wy + wh;
      y.fillStyle = 'rgba(30,40,20,0.85)'; y.beginPath(); y.moveTo(tx, ty - wh * 0.8); y.lineTo(tx - ww * 0.18, ty); y.lineTo(tx + ww * 0.18, ty); y.fill();
      for (let k = 0; k < 8; k++) { y.fillStyle = ['#ff4040', '#ffe060', '#60c0ff', '#ff80ff'][k % 4]; y.beginPath(); y.arc(tx + (r() - 0.5) * ww * 0.25, ty - r() * wh * 0.7, 2.2, 0, 7); y.fill(); }
    }
    // people silhouettes
    const np = r() < 0.55 ? 1 + Math.floor(r() * 3) : 0;
    for (let k = 0; k < np; k++) {
      const px = wx + ww * (0.2 + r() * 0.6), small = r() < 0.3, ph = wh * (small ? 0.35 : 0.55);
      y.fillStyle = 'rgba(40,18,8,0.8)';
      y.beginPath(); y.arc(px, wy + wh - ph, ph * 0.18, 0, 7); y.fill();
      y.beginPath(); y.ellipse(px, wy + wh, ph * 0.3, ph * 0.62, 0, Math.PI, 0); y.fill();
    }
    // garland
    if (r() < 0.35) for (let k = 0; k < 7; k++) { y.fillStyle = ['#ff5050', '#ffd040', '#50ff80', '#60a0ff'][k % 4]; y.beginPath(); y.arc(wx + ww * (k + 0.5) / 7, wy + 6 + Math.sin(k) * 3, 2.5, 0, 7); y.fill(); }
    // mullion
    x.fillStyle = 'rgba(20,24,30,0.9)'; x.fillRect(wx, wy, ww, wh);
    y.fillStyle = '#000'; y.fillRect(wx + ww * 0.48, wy, ww * 0.04, wh); y.fillRect(wx, wy + wh * 0.3, ww * 0.48, wh * 0.03);
    x.fillStyle = '#e6e3dc'; x.fillRect(wx + ww * 0.48, wy, ww * 0.04, wh);
  }
  const map = toTex(c), emissive = toTex(e);
  return { map, emissive, cw: 1 / cols, rh: 1 / rows };
}

// generic soft sprites
export function discTex({ ring = 0.25, soft = 0.15, size = 128, hexagon = false } = {}) {
  const c = canvas(size, size), x = c.getContext('2d'), s = size / 2;
  const g = x.createRadialGradient(s, s, 0, s, s, s);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(1 - ring, 'rgba(255,255,255,0.7)');
  g.addColorStop(1 - soft, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  if (hexagon) { x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; x.lineTo(s + Math.cos(a) * s, s + Math.sin(a) * s); } x.fill(); }
  else x.fillRect(0, 0, size, size);
  return toTex(c);
}
export function glowTex(size = 128, pow = 2) {
  const c = canvas(size, size), x = c.getContext('2d'), s = size / 2;
  const img = x.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const d = Math.hypot(i - s + 0.5, j - s + 0.5) / s, a = Math.max(0, 1 - d) ** pow;
    const o = (j * size + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = a * 255;
  }
  x.putImageData(img, 0, 0);
  return toTex(c);
}
export function streakTex() { // anamorphic flare streak
  const w = 512, h = 32, c = canvas(w, h), x = c.getContext('2d');
  const img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = Math.abs(i - w / 2 + 0.5) / (w / 2), dy = Math.abs(j - h / 2 + 0.5) / (h / 2);
    const a = Math.max(0, 1 - dx) ** 2.2 * Math.max(0, 1 - dy) ** 1.6;
    const o = (j * w + i) * 4; img.data[o] = 160; img.data[o + 1] = 200; img.data[o + 2] = 255; img.data[o + 3] = a * 255;
  }
  x.putImageData(img, 0, 0);
  return toTex(c);
}
export function frostTex(seed = 3) { // alpha-ish frost around window edges (white with alpha)
  const w = 512, h = 512, c = canvas(w, h), x = c.getContext('2d'), r = rng(seed);
  x.clearRect(0, 0, w, h);
  // edge gradient
  const edges = [[0, 0, w, 0], [0, h, w, h], [0, 0, 0, h], [w, 0, w, h]];
  for (let i = 0; i < 5000; i++) {
    const side = Math.floor(r() * 4);
    let px, py; const d = Math.pow(r(), 2.2) * 150;
    if (side === 0) { px = r() * w; py = d; } else if (side === 1) { px = r() * w; py = h - d; } else if (side === 2) { px = d; py = r() * h; } else { px = w - d; py = r() * h; }
    x.strokeStyle = `rgba(235,245,255,${0.08 + r() * 0.18})`; x.lineWidth = 0.6 + r();
    const a = r() * Math.PI * 2, l = 4 + r() * 18;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  // bottom snow pile
  const g = x.createLinearGradient(0, h, 0, h - 60); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, h - 60, w, 60);
  void edges;
  return toTex(c);
}
export function cloudTex(seed = 2) {
  const w = 1024, h = 512, c = canvas(w, h), x = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 160; i++) {
    const cx = r() * w, cy = h * (0.2 + r() * 0.6), rr = 40 + r() * 140;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, `rgba(255,255,255,${0.04 + r() * 0.05})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  return toTex(c);
}

// ---------- story props ----------
// Aiko's crayon drawing: whole family at a table, brother included, "Мы ждём"
export function familyDrawing() {
  const w = 1024, h = 768, c = canvas(w, h), x = c.getContext('2d'), r = rng(42);
  x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, w, h);
  speckle(x, w, h, 5000, 0.04, 3);
  const crayon = (col, width, fn) => {
    for (let p = 0; p < 3; p++) {
      x.save(); x.translate((r() - 0.5) * 2.5, (r() - 0.5) * 2.5);
      x.strokeStyle = col; x.fillStyle = col; x.globalAlpha = 0.45; x.lineWidth = width * (0.8 + r() * 0.4);
      x.lineCap = 'round'; x.lineJoin = 'round'; fn(); x.restore();
    }
  };
  const scribble = (col, x0, y0, x1, y1, step = 7) => crayon(col, 6, () => {
    x.beginPath();
    for (let yy = y0; yy < y1; yy += step) { x.moveTo(x0 + r() * 4, yy); x.lineTo(x1 - r() * 4, yy + step * 0.6); }
    x.stroke();
  });
  // sun & window
  crayon('#f2b705', 6, () => { x.beginPath(); x.arc(110, 100, 45, 0, 7); x.stroke(); for (let i = 0; i < 10; i++) { const a = i / 10 * 7; x.beginPath(); x.moveTo(110 + Math.cos(a) * 58, 100 + Math.sin(a) * 58); x.lineTo(110 + Math.cos(a) * 82, 100 + Math.sin(a) * 82); x.stroke(); } });
  // tree
  crayon('#2f8a3a', 7, () => { x.beginPath(); x.moveTo(900, 120); x.lineTo(830, 300); x.lineTo(970, 300); x.closePath(); x.stroke(); });
  scribble('#2f8a3a', 860, 170, 945, 295, 9);
  for (let i = 0; i < 7; i++) crayon(['#e33', '#fd0', '#39f'][i % 3], 10, () => { x.beginPath(); x.arc(850 + r() * 90, 180 + r() * 110, 6, 0, 7); x.stroke(); });
  // table
  scribble('#a0522d', 140, 470, 880, 520, 8);
  crayon('#7a3b16', 6, () => { x.beginPath(); x.moveTo(140, 470); x.lineTo(880, 470); x.moveTo(190, 520); x.lineTo(190, 640); x.moveTo(830, 520); x.lineTo(830, 640); x.stroke(); });
  // people: mama, papa, aiko, brother (biggest heart)
  const people = [
    { x: 250, col: '#d9534f', hair: '#5a3a22', name: 'МАМА', hh: 1.0 },
    { x: 420, col: '#3a6fd8', hair: '#7a7a7a', name: 'ПАПА', hh: 1.08, stache: true },
    { x: 580, col: '#e0245e', hair: '#3a2416', name: 'Я', hh: 0.8, tails: true },
    { x: 750, col: '#6b6b6b', hair: '#1a1410', name: 'АРМАН', hh: 1.05 },
  ];
  for (const p of people) {
    const top = 470 - 230 * p.hh;
    scribble(p.col, p.x - 45, top + 95, p.x + 45, 470, 8);
    crayon('#f0b08a', 6, () => { x.beginPath(); x.arc(p.x, top + 50, 45, 0, 7); x.stroke(); });
    crayon(p.hair, 8, () => { x.beginPath(); x.arc(p.x, top + 40, 45, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); });
    if (p.tails) crayon(p.hair, 9, () => { x.beginPath(); x.moveTo(p.x - 48, top + 35); x.lineTo(p.x - 78, top + 70); x.moveTo(p.x + 48, top + 35); x.lineTo(p.x + 78, top + 70); x.stroke(); });
    crayon('#222', 5, () => { x.beginPath(); x.arc(p.x - 15, top + 45, 3, 0, 7); x.arc(p.x + 15, top + 45, 3, 0, 7); x.stroke(); x.beginPath(); x.arc(p.x, top + 58, 18, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); });
    if (p.stache) crayon('#555', 6, () => { x.beginPath(); x.moveTo(p.x - 16, top + 70); x.quadraticCurveTo(p.x, top + 62, p.x + 16, top + 70); x.stroke(); });
    crayon(p.col, 7, () => { x.beginPath(); x.moveTo(p.x - 45, top + 120); x.lineTo(p.x - 80, top + 190); x.moveTo(p.x + 45, top + 120); x.lineTo(p.x + 80, top + 190); x.stroke(); });
    x.save(); x.globalAlpha = 0.85; x.fillStyle = '#444'; x.font = '34px Neucha'; x.textAlign = 'center';
    x.fillText(p.name, p.x, top - 8); x.restore();
  }
  // heart above brother
  crayon('#e3243b', 7, () => { const hx = 750, hy = 150; x.beginPath(); x.moveTo(hx, hy + 30); x.bezierCurveTo(hx - 50, hy - 5, hx - 25, hy - 40, hx, hy - 15); x.bezierCurveTo(hx + 25, hy - 40, hx + 50, hy - 5, hx, hy + 30); x.stroke(); });
  // plates on table
  for (const px of [250, 420, 580, 750]) crayon('#7d9bc1', 5, () => { x.beginPath(); x.ellipse(px, 462, 34, 9, 0, 0, 7); x.stroke(); });
  // caption
  x.save(); x.translate(512, 712); x.rotate(-0.025);
  for (let p = 0; p < 4; p++) { x.globalAlpha = 0.5; x.fillStyle = '#d6223b'; x.font = '88px Neucha'; x.textAlign = 'center'; x.fillText('Мы ждём', (r() - 0.5) * 3, (r() - 0.5) * 3); }
  x.restore();
  return { tex: toTex(c), canvas: c };
}

export function spreadsheet(t = 0) {
  const w = 1024, h = 640, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#eef3fb'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1f5fbf'; x.fillRect(0, 0, w, 44);
  x.fillStyle = '#dfe7f3'; x.fillRect(0, 44, w, 34);
  const r = rng(9);
  x.font = '15px Inter'; x.textBaseline = 'middle';
  const off = Math.floor(t * 3) % 40;
  for (let j = 0; j < 22; j++) {
    const yy = 92 + j * 25;
    x.strokeStyle = '#c9d4e6'; x.beginPath(); x.moveTo(0, yy + 12); x.lineTo(w * 0.62, yy + 12); x.stroke();
    for (let i = 0; i < 6; i++) {
      x.fillStyle = (i === 0) ? '#556' : '#223';
      const v = (i === 0) ? 'Q' + ((j + off) % 4 + 1) + '-' + (j + off) : (r() * 99999 | 0).toLocaleString('ru-RU');
      x.fillText(v, 10 + i * 105, yy);
    }
  }
  for (let i = 0; i < 7; i++) { x.strokeStyle = '#c9d4e6'; x.beginPath(); x.moveTo(i * 105, 78); x.lineTo(i * 105, h); x.stroke(); }
  // chart
  x.fillStyle = '#fff'; x.fillRect(w * 0.65, 100, w * 0.32, 260);
  for (let i = 0; i < 8; i++) { const bh = 40 + r() * 180; x.fillStyle = i % 2 ? '#4f8fe8' : '#2a64c4'; x.fillRect(w * 0.67 + i * 38, 350 - bh, 26, bh); }
  x.fillStyle = '#fff'; x.font = '600 18px Inter'; x.fillText('Отчёт_Q4_финал_v7.xlsx', 16, 22);
  return c;
}

export function clockFace() {
  const s = 512, c = canvas(s, s), x = c.getContext('2d');
  x.fillStyle = '#f4f1ea'; x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, 7); x.fill();
  x.strokeStyle = '#222'; x.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, big = i % 5 === 0;
    x.lineWidth = big ? 9 : 3;
    const r0 = s / 2 * (big ? 0.78 : 0.86), r1 = s / 2 * 0.92;
    x.beginPath(); x.moveTo(s / 2 + Math.sin(a) * r0, s / 2 - Math.cos(a) * r0); x.lineTo(s / 2 + Math.sin(a) * r1, s / 2 - Math.cos(a) * r1); x.stroke();
  }
  x.fillStyle = '#222'; x.font = '500 54px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; x.fillText(String(i), s / 2 + Math.sin(a) * s * 0.31, s / 2 - Math.cos(a) * s * 0.31); }
  return toTex(c);
}

export function noodleLabel() {
  const w = 512, h = 128, c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#d42a1e'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#ffd23f'; x.fillRect(0, h * 0.62, w, h * 0.12);
  x.fillStyle = '#fff'; x.font = '700 46px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const ox of [128, 384]) x.fillText('ЛАПША', ox, h * 0.36);
  return toTex(c);
}

export function leafTex(seed = 1) {
  const s = 64, c = canvas(s, s), x = c.getContext('2d'), r = rng(seed);
  const cols = ['#e3a21a', '#d9661f', '#f2c12e', '#b8461b'];
  x.fillStyle = cols[Math.floor(r() * 4)];
  x.beginPath(); x.moveTo(32, 2); x.quadraticCurveTo(62, 30, 32, 62); x.quadraticCurveTo(2, 30, 32, 2); x.fill();
  x.strokeStyle = 'rgba(90,40,10,0.6)'; x.beginPath(); x.moveTo(32, 4); x.lineTo(32, 60); x.stroke();
  return toTex(c);
}
