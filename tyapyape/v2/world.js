// ===== v2 world props, interiors, characters presets, depth helpers =====
const _hatBase = hat;
hat = function (ctx, o) {
  if (o.cap === 'platok') {
    const c = o.capCol || '#b33b3b'; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -4, 72, Math.PI * .92, Math.PI * 2.08); ctx.quadraticCurveTo(60, -30, 0, -34); ctx.quadraticCurveTo(-60, -30, -70, 14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, 58); ctx.lineTo(20, 58); ctx.lineTo(0, 92); ctx.fill(); ctx.fillStyle = shade(c, .8); ctx.fillRect(-60, -38, 120, 8);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-40 + i * 16, -44 + (i % 2) * 8, 4, 0, 7); ctx.fill(); }
    return;
  }
  _hatBase(ctx, o);
};
const HERO2 = (x, y, s, e = {}) => Object.assign({ x, y, s, coat: '#2f74e6', cap: 'knit', capCol: '#2a5cc0', scarf: '#c94040', eyes: 'cyan', seed: 1 }, e);
const PACAN = (x, y, s, e = {}) => Object.assign({ x, y, s, coat: '#2b2f3a', cap: 'kepka', capCol: '#1d1d22', scarf: '#6b6f78', eyes: 'cyan', seed: 1, collar: '#4a3a2c' }, e);
const THUG2 = (i, x, y, s, e = {}) => {
  const coats = ['#3b3f48', '#4a3f35', '#2e3542', '#47403c', '#353a33', '#3c3434', '#2f3a3a'];
  const caps = ['kepka', 'ushanka', 'kepka', 'ushanka', 'knit', 'kepka', 'ushanka'];
  const capc = ['#2a2a2e', '#5a4636', '#393d45', '#6b5a48', '#3d3d3d', '#232326', '#4b3d30'];
  return Object.assign({ x, y, s, coat: coats[i % 7], cap: caps[i % 7], capCol: capc[i % 7], eyes: 'white', mood: 'tough', seed: i * 1.37 + 3, scarf: i % 3 === 0 ? '#5a2a2a' : null }, e);
};
const MOM = (x, y, s, e = {}) => Object.assign({ x, y, s, coat: '#7a3d48', cap: 'platok', capCol: '#c9a24a', eyes: 'white', seed: 9, pants: '#3a2a30' }, e);
const ELDER = (i, x, y, s, e = {}) => Object.assign({ x, y, s, coat: ['#1c1d22', '#2a2622', '#23262e'][i % 3], collar: '#4a3a2c', cap: i === 1 ? 'ushanka' : 'kepka', capCol: ['#141414', '#4a3a2c', '#2c2f38'][i % 3], eyes: 'amber', mood: 'tough', seed: 20 + i }, e);
const P = (...objs) => Object.assign({}, ...objs);

function haze(ctx, y, h, col = 'rgba(150,165,190,', a = .35) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h * .3); g.addColorStop(0, col + '0)'); g.addColorStop(.7, col + a + ')'); g.addColorStop(1, col + '0)');
  ctx.fillStyle = g; ctx.fillRect(-1500, y - h, W + 3000, h * 1.3);
}
const _BL = []; let _blD = 0;
function blurred(ctx, px, fn) {
  if (px <= .3) return fn(ctx);
  const c = _BL[_blD] || (_BL[_blD] = Object.assign(document.createElement('canvas'), { width: W, height: H })); _blD++;
  const o = c.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.setTransform(ctx.getTransform()); o.globalAlpha = 1; o.filter = 'none';
  fn(o); _blD--;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px}px)`; ctx.drawImage(c, 0, 0); ctx.restore();
}
function grade(ctx, col, a) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = col; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function sodiumGlow(ctx, x, y, r, a = .5) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,170,80,${a})`); g.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

function truck(ctx, x, y, t, wheelRot, o = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(8,12,24,.3)'; ctx.beginPath(); ctx.ellipse(0, 6, 380, 22, 0, 0, 7); ctx.fill();
  // cargo
  ctx.fillStyle = '#4f5f3a'; ctx.fillRect(-360, -300, 440, 200); ctx.fillStyle = '#5d6e45'; for (let i = 0; i < 8; i++) ctx.fillRect(-356 + i * 55, -296, 40, 192);
  // boxes on top
  [[-320, 0], [-250, 1], [-190, 2], [-300, 3]].forEach(([bx, i]) => { ctx.fillStyle = ['#b08a5a', '#a37c4f', '#bf9966', '#9c764a'][i]; const by = i === 3 ? -390 : -350; ctx.fillRect(bx, by, 80 - i * 4, i === 3 ? 44 : 52); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(bx, by + 20, 80 - i * 4, 4); });
  // cab
  ctx.fillStyle = '#3d5a2e'; ctx.beginPath(); ctx.moveTo(90, -100); ctx.lineTo(90, -320); ctx.lineTo(240, -320); ctx.lineTo(300, -230); ctx.lineTo(370, -220); ctx.lineTo(370, -100); ctx.fill();
  ctx.fillStyle = '#a9c4d8'; ctx.beginPath(); ctx.moveTo(110, -300); ctx.lineTo(230, -300); ctx.lineTo(280, -232); ctx.lineTo(110, -232); ctx.fill();
  if (o.driver !== false) { ctx.fillStyle = '#0f1116'; ctx.beginPath(); ctx.arc(190, -258, 26, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ffe9a8'; ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 30; ctx.fillRect(355, -200, 16, 22); ctx.shadowBlur = 0;
  ctx.fillStyle = '#222'; ctx.fillRect(-370, -110, 750, 22);
  [-250, -140, 260].forEach(wx => { ctx.save(); ctx.translate(wx, -60); ctx.rotate(wheelRot); ctx.fillStyle = '#16181d'; ctx.beginPath(); ctx.arc(0, 0, 58, 0, 7); ctx.fill(); ctx.fillStyle = '#555b66'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); ctx.fillStyle = '#16181d'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-4, 6, 8, 16); } ctx.restore(); });
  ctx.restore();
}
function graffiti(ctx, x, y, s, k, col = '#e8e8e8') { // spray reveal
  if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(x - 400, y - 200, 800 * k, 400); ctx.clip();
  ctx.translate(x, y); ctx.rotate(-.05); txt(ctx, s, 0, 0, { size: 96, col, w: 900 }); ctx.globalAlpha = .5; for (let i = 0; i < 14; i++) { ctx.fillStyle = col; ctx.fillRect(-300 + hash(i) * 600, 30 + hash(i + 2) * 30, 4, 20 + hash(i + 4) * 60); } ctx.restore();
}
function bench(ctx, x, y) { ctx.fillStyle = '#5a3d2a'; ctx.fillRect(x - 140, y - 70, 280, 18); ctx.fillRect(x - 140, y - 120, 280, 14); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - 120, y - 70, 10, 70); ctx.fillRect(x + 110, y - 70, 10, 70); ctx.fillStyle = PAL.snow; rrect(ctx, x - 142, y - 128, 284, 10, 4); ctx.fill(); }
function bucket(ctx, h) { ctx.save(); ctx.translate(h.hx, h.hy); ctx.fillStyle = '#7b8794'; ctx.beginPath(); ctx.moveTo(-26, 20); ctx.lineTo(26, 20); ctx.lineTo(20, 76); ctx.lineTo(-20, 76); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 20, 26, Math.PI, 0); ctx.stroke(); ctx.restore(); }
function car(ctx, x, y, col = '#8a2f2f', s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; rrect(ctx, -170, -80, 340, 60, 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(-100, -78); ctx.lineTo(-60, -140); ctx.lineTo(70, -140); ctx.lineTo(110, -78); ctx.fill();
  ctx.fillStyle = '#9fb3c8'; ctx.beginPath(); ctx.moveTo(-82, -82); ctx.lineTo(-52, -128); ctx.lineTo(0, -128); ctx.lineTo(0, -82); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, -82); ctx.lineTo(10, -128); ctx.lineTo(62, -128); ctx.lineTo(92, -82); ctx.fill();
  ctx.fillStyle = PAL.snow; rrect(ctx, -60, -150, 130, 16, 8); ctx.fill();
  ctx.fillStyle = '#14161b'; [-105, 105].forEach(w => { ctx.beginPath(); ctx.arc(w, -20, 30, 0, 7); ctx.fill(); }); ctx.restore();
}
function dog(ctx, x, y, t, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#1a1c22'; ctx.beginPath(); ctx.ellipse(0, -60, 60, 26, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(55, -82, 22, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(48, -100); ctx.lineTo(56, -122); ctx.lineTo(64, -98); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#1a1c22'; [-40, -20, 25, 40].forEach((lx, i) => { ctx.beginPath(); ctx.moveTo(lx, -45); ctx.lineTo(lx + Math.sin(t * 8 + i) * 4, 0); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(-58, -66); ctx.quadraticCurveTo(-80, -90 + Math.sin(t * 10) * 10, -74, -110); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(62, -86, 4, 0, 7); ctx.fill(); ctx.restore(); }
function clothesline(ctx, x0, x1, y, t) { ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 40, x1, y); ctx.stroke(); ['#c94040', '#e6e6e6', '#3a6fb0', '#e0c050'].forEach((c, i) => { const x = lerp(x0, x1, .2 + i * .2), yy = y + 30 * Math.sin(Math.PI * (.2 + i * .2)) + 6; ctx.save(); ctx.translate(x, yy); ctx.rotate(Math.sin(t * 1.5 + i) * .08); ctx.fillStyle = c; ctx.fillRect(-24, 0, 48, 60 - i * 6); ctx.restore(); }); }
function poster(ctx, x, y, w, h, line1, line2, col = '#b23030') { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#f0e6cc'; ctx.fillRect(x + 8, y + 8, w - 16, h - 16); txt(ctx, line1, x + w / 2, y + h * .38, { size: h * .18, col, maxW: w - 30 }); if (line2) txt(ctx, line2, x + w / 2, y + h * .68, { size: h * .13, col: '#222', w: 800, maxW: w - 30 }); }
function kitchen(ctx, t, lampFlick = 1) {
  // wallpaper
  ctx.fillStyle = '#7a6448'; ctx.fillRect(-600, -200, 2300, 1900);
  ctx.fillStyle = 'rgba(255,230,190,.08)'; for (let y = -200; y < 1700; y += 90) for (let x = -600; x < 1700; x += 90) { ctx.beginPath(); ctx.arc(x + ((y / 90) % 2) * 45, y, 14, 0, 7); ctx.fill(); }
  // tiles behind stove
  ctx.fillStyle = '#d9d4c7'; ctx.fillRect(560, 900, 600, 500); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for (let y = 900; y < 1400; y += 50) { ctx.beginPath(); ctx.moveTo(560, y); ctx.lineTo(1160, y); ctx.stroke(); } for (let x = 560; x < 1160; x += 50) { ctx.beginPath(); ctx.moveTo(x, 900); ctx.lineTo(x, 1400); ctx.stroke(); }
  // window with snow night
  ctx.fillStyle = '#e8e2d2'; ctx.fillRect(-60, 420, 480, 560); ctx.fillStyle = '#1b2438'; ctx.fillRect(-36, 444, 432, 512);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = hash(i + 40) < .5 ? '#ffd88a' : '#2a3346'; ctx.fillRect(10 + (i % 3) * 120, 640 + Math.floor(i / 3) * 140, 50, 60); }
  for (let i = 0; i < 30; i++) { const yy = 444 + ((hash(i) * 512 + t * 60 * (0.5 + hash(i + 1))) % 512); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(-36 + hash(i + 2) * 432, yy, 3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#e8e2d2'; ctx.fillRect(176, 444, 10, 512); ctx.fillRect(-36, 680, 432, 10);
  ctx.fillStyle = '#b8563f'; ctx.fillRect(-90, 400, 90, 600); ctx.fillRect(400, 400, 90, 600);
  // clock + calendar
  ctx.fillStyle = '#efe6d5'; ctx.beginPath(); ctx.arc(760, 560, 70, 0, 7); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(760, 560); ctx.lineTo(760 + Math.sin(t * .2) * 40, 560 - Math.cos(t * .2) * 40); ctx.moveTo(760, 560); ctx.lineTo(760 + Math.sin(t * 6.283 / 1) * 55, 560 - Math.cos(t * 6.283) * 55); ctx.stroke();
  ctx.fillStyle = '#f2ede0'; ctx.fillRect(930, 470, 150, 190); ctx.fillStyle = '#c23b3b'; ctx.fillRect(930, 470, 150, 50); txt(ctx, '1976', 1005, 497, { size: 30 }); txt(ctx, '14', 1005, 590, { size: 80, col: '#222' });
  // stove + kettle
  ctx.fillStyle = '#e9e6dc'; ctx.fillRect(620, 1240, 380, 360); ctx.fillStyle = '#222'; [700, 900].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 1240, 60, 12, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#c94a3a'; ctx.beginPath(); ctx.ellipse(700, 1200, 70, 46, 0, 0, 7); ctx.fill(); ctx.fillRect(760, 1180, 50, 12);
  for (let i = 0; i < 5; i++) { const k = ((t * .6 + i / 5) % 1); ctx.fillStyle = `rgba(255,255,255,${.4 * (1 - k)})`; ctx.beginPath(); ctx.arc(812 + Math.sin(k * 5 + i) * 18, 1170 - k * 220, 10 + k * 30, 0, 7); ctx.fill(); }
  // floor
  ctx.fillStyle = '#5a4030'; ctx.fillRect(-600, 1600, 2300, 600); ctx.fillStyle = 'rgba(0,0,0,.15)'; for (let x = -600; x < 1700; x += 120) ctx.fillRect(x, 1600, 4, 600);
  // lamp shade glow
  const on = lampFlick; const g = ctx.createRadialGradient(400, 300, 20, 400, 900, 1100); g.addColorStop(0, `rgba(255,200,120,${.45 * on})`); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(-600, -200, 2300, 2400);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(400, -200); ctx.lineTo(400, 230); ctx.stroke(); ctx.fillStyle = '#d4783a'; ctx.beginPath(); ctx.moveTo(320, 300); ctx.lineTo(480, 300); ctx.lineTo(430, 220); ctx.lineTo(370, 220); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.shadowColor = '#ffd38a'; ctx.shadowBlur = 50; ctx.beginPath(); ctx.arc(400, 306, 22, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
}
function table(ctx, x, y) { ctx.fillStyle = '#c9b48a'; rrect(ctx, x - 260, y - 20, 520, 40, 8); ctx.fill(); ctx.fillStyle = 'rgba(80,120,170,.35)'; for (let i = 0; i < 10; i++) ctx.fillRect(x - 250 + i * 52, y - 18, 26, 36); ctx.fillStyle = '#6a4a30'; ctx.fillRect(x - 230, y + 20, 18, 280); ctx.fillRect(x + 212, y + 20, 18, 280);
  ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.ellipse(x + 80, y - 26, 50, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e8e0cc'; rrect(ctx, x - 120, y - 70, 50, 56, 6); ctx.fill(); }
function schoolHall(ctx, t) {
  ctx.fillStyle = '#d8d0b8'; ctx.fillRect(-700, -300, 2500, 1300);
  ctx.fillStyle = '#3f6b55'; ctx.fillRect(-700, 1000, 2500, 600);
  ctx.fillStyle = '#2f5544'; ctx.fillRect(-700, 995, 2500, 12);
  // windows
  for (let i = 0; i < 4; i++) { const x = -400 + i * 520; ctx.fillStyle = '#efe9da'; ctx.fillRect(x, 300, 300, 520); ctx.fillStyle = '#a9bdd2'; ctx.fillRect(x + 16, 316, 268, 488); ctx.fillStyle = '#efe9da'; ctx.fillRect(x + 145, 316, 10, 488); ctx.fillRect(x + 16, 540, 268, 10);
    for (let k = 0; k < 10; k++) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x + 20 + hash(k + i * 9) * 260, 316 + ((hash(k + 3) * 488 + t * 50) % 488), 3, 0, 7); ctx.fill(); }
    // radiator
    ctx.fillStyle = '#e4e0d4'; for (let r = 0; r < 9; r++) rrect(ctx, x + 20 + r * 30, 1080, 24, 200, 8), ctx.fill(); }
  // portraits / stengazeta
  ctx.fillStyle = '#6a4a30'; ctx.fillRect(10, 40, 200, 230); ctx.fillStyle = '#d9cfb5'; ctx.fillRect(24, 54, 172, 202); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(110, 140, 50, 0, 7); ctx.fill(); ctx.fillRect(60, 180, 100, 76);
  poster(ctx, 430, 40, 360, 220, 'СТЕНГАЗЕТА', '«Пионерская правда»', '#2f5aa8');
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-700, 1600, 2500, 700); ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let x = -700; x < 1800; x += 80) ctx.fillRect(x, 1600, 3, 700);
  const g = ctx.createLinearGradient(0, 0, 0, 1900); g.addColorStop(0, 'rgba(255,250,235,.0)'); g.addColorStop(1, 'rgba(30,25,20,.25)'); ctx.fillStyle = g; ctx.fillRect(-700, -300, 2500, 2600);
}
// floating foreground silhouettes (depth); speed relative to camera
function fgLayer(ctx, t, kind, offs = 0, blur = 8) {
  blurred(ctx, blur, (ctx) => {
    ctx.fillStyle = '#07090e';
    if (kind === 'fence') { for (let i = -2; i < 14; i++) { const x = ((i * 190 - offs) % 2400 + 2400) % 2400 - 400; ctx.fillRect(x, 1790, 30, 400); } ctx.fillRect(-400, 1850, 2000, 18); }
    if (kind === 'branches') { ctx.lineWidth = 16; ctx.strokeStyle = '#07090e'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-60, -40 - offs * .1); ctx.quadraticCurveTo(200, 120, 420, 100); ctx.moveTo(120, 60); ctx.lineTo(200, -40); ctx.moveTo(300, 110); ctx.lineTo(380, 200); ctx.stroke(); }
    if (kind === 'heads') { for (let i = 0; i < 4; i++) { const x = ((i * 380 - offs) % 1800 + 1800) % 1800 - 300; ctx.beginPath(); ctx.arc(x, 1900, 170, 0, 7); ctx.fill(); ctx.fillRect(x - 200, 1950, 400, 300); } }
  });
}
