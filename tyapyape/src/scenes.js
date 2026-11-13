// ===== Tyap-Lyap: scenes timed to voiceover (seconds) =====
const HITS = [ // camera accents + impact SFX
  { t: 10.15, k: 1.0, type: 'slam' }, { t: 13.1, k: .7, type: 'stamp' }, { t: 25.45, k: 1.2, type: 'punch' },
  { t: 30.85, k: 1.1, type: 'fall' }, { t: 37.75, k: 1.1, type: 'punch' }, { t: 47.75, k: 1.1, type: 'punch' },
  { t: 48.2, k: .8, type: 'fall' }, { t: 51.5, k: .8, type: 'stamp' }, { t: 59.45, k: 1.0, type: 'punch' },
  { t: 66.7, k: .7, type: 'stamp' }, { t: 69.3, k: 1.4, type: 'clash' }, { t: 73.9, k: .9, type: 'slam' },
  { t: 77.75, k: .9, type: 'punch' }, { t: 85.35, k: 1.2, type: 'gavel' }, { t: 96.0, k: 1.3, type: 'stamp' },
];
function camShake(t) {
  let x = 0, y = 0, z = 0;
  for (const h of HITS) { const d = t - h.t; if (d < 0 || d > .8) continue; const e = Math.exp(-d * 7) * h.k; x += Math.sin(d * 70) * 22 * e; y += Math.cos(d * 55) * 16 * e; z += .035 * e * Math.cos(d * 18); }
  return { x, y, z };
}
function cam(ctx, t, o = {}) {
  const sh = camShake(t);
  const dx = Math.sin(t * .31) * 6 + Math.sin(t * .17 + 1) * 4, dy = Math.sin(t * .27 + 2) * 5;
  const z = (o.z || 1) * (1 + sh.z);
  ctx.translate(W / 2 + sh.x + dx, H / 2 + sh.y + dy); ctx.rotate((o.r || 0) + Math.sin(t * .23) * .004); ctx.scale(z, z);
  ctx.translate(-(o.x ?? W / 2), -(o.y ?? H / 2));
}
const push = (lt, dur, a = .035) => 1 + a * eio(clamp(lt / dur));

const SCENES = [
  // 1 — wake up in snow, year flips 2026 -> 1974
  { a: 0, b: 4.6, draw(ctx, t) {
    const lt = t;
    ctx.save(); cam(ctx, t, { z: lerp(1.45, 1.05, eio(seg(t, 1.2, 4.4))), x: lerp(700, 540, eio(seg(t, 1.2, 4.4))), y: lerp(1420, 1000, eio(seg(t, 1.2, 4.4))), r: lerp(-.05, 0, eio(seg(t, 0, 3))) });
    sky(ctx); podezd(ctx, 560, 1560, t); ground(ctx, 1560); lamp(ctx, 120, 1600, 600);
    const up = eio(seg(t, 1.3, 2.3));
    const blink = t < .25 ? 0 : t < .45 ? seg(t, .25, .45) : (t > 1.0 && t < 1.12 ? .1 : 1);
    guy(ctx, HERO(560, 1640, 1.25, { fall: lerp(.98, 0, up), mood: up < .5 ? 'scared' : 'calm', blink, look: Math.sin(t * 3) * .8, aL: lerp(2.6, .2, up), aR: lerp(.4, .2, up), squash: up > .95 ? .04 * Math.sin(seg(t, 2.3, 2.7) * Math.PI) : 0 }));
    // snow puff when getting up
    if (t > 1.3 && t < 2.6) { const k = seg(t, 1.3, 2.6); for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,255,255,${.8 * (1 - k)})`; ctx.beginPath(); ctx.arc(560 + (hash(i) - .5) * 400 * k, 1630 - hash(i + 2) * 200 * eout(k), 10 + hash(i + 4) * 14, 0, 7); ctx.fill(); } }
    ctx.restore();
    // year flip counter
    const k = seg(t, 2.2, 4.3); const yr = Math.round(lerp(2026, 1974, eio(k)));
    const vis = seg(t, 1.9, 2.3);
    if (vis > 0) {
      ctx.save(); ctx.globalAlpha = vis; ctx.translate(540, 460);
      rrect(ctx, -330, -120, 660, 240, 30); ctx.fillStyle = 'rgba(12,16,26,.85)'; ctx.fill();
      String(yr).split('').forEach((d, i) => { const x = -225 + i * 150; rrect(ctx, x - 60, -95, 120, 190, 16); ctx.fillStyle = '#1d2433'; ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 60, -3, 120, 6); txt(ctx, d, x, 6, { size: 150, col: k >= 1 ? PAL.yellow : PAL.white }); });
      txt(ctx, 'КАЗАНЬ', 0, -165, { size: 44, col: '#cfd6e4', w: 800 });
      ctx.restore();
    }
  } },
  // 2 — factory Teplokontrol -> sign becomes TYAP-LYAP
  { a: 4.6, b: 10.85, draw(ctx, t) {
    const lt = t - 4.6;
    ctx.save(); cam(ctx, t, { z: push(lt, 6.2, .12) * .92, y: 1000, x: 540 });
    sky(ctx, '#121826', '#28324a', '#4a4558');
    building(ctx, -420, 1500, 420, 700, { floors: 9, cols: 5, col: PAL.panel2, seed: 11 });
    building(ctx, 1080, 1500, 460, 760, { floors: 9, cols: 5, col: PAL.panel2, seed: 12 });
    const flipped = t > 10.12;
    const glitch = t > 9.95 && t < 10.15 ? (Math.floor(t * 40) % 2) : 0;
    factory(ctx, 90, 1500, t, flipped || glitch ? 'ТЯП-ЛЯП' : 'ТЕПЛОКОНТРОЛЬ', 0, flipped ? PAL.red : PAL.yellow);
    ground(ctx, 1500); fence(ctx, -300, 1400, 1520, 120);
    lamp(ctx, 900, 1700, 560);
    guy(ctx, HERO(330, 1790, .95, { walk: t * 6, look: .9, tilt: -.08 }));
    ctx.restore();
    if (t > 7.6 && t < 10.0) { // label for the plant
      const k = seg(t, 7.6, 8.0) * (1 - seg(t, 9.7, 10.0));
      ctx.save(); ctx.globalAlpha = k; txt(ctx, 'завод «Теплоконтроль», 1970-е', 540, 300, { size: 40, w: 700, col: '#dfe5ef', stroke: 8 }); ctx.restore();
    }
    if (flipped) stamp(ctx, 'ТЯП-ЛЯП', 540, 400, seg(t, 10.12, 10.5), { size: 120, rot: -.06 });
  } },
  // 3 — nobody / chushpan / prey: eyes in the dark
  { a: 10.85, b: 16.0, draw(ctx, t) {
    const lt = t - 10.85;
    ctx.save(); cam(ctx, t, { z: push(lt, 5.2, .1), y: 1100 });
    sky(ctx, '#07090f', '#0f1420', '#1a2030'); ground(ctx, 1600, '#7b879a');
    lamp(ctx, 330, 1640, 820);
    const scared = t > 14.0;
    guy(ctx, HERO(560, 1650, 1.25, { mood: scared ? 'scared' : 'sad', look: scared ? Math.sin(t * 5) : 0, aL: .1, aR: .1, bob: Math.sin(t * 3) * 2 }));
    // eyes in the darkness
    const n = 9;
    for (let i = 0; i < n; i++) {
      const appear = 14.0 + i * .14; if (t < appear) continue;
      const ang = -2.6 + i * 0.66 + Math.sin(i) * .2, rr = lerp(620, 470, seg(t, 14.5, 16));
      const ex = 560 + Math.cos(ang) * rr * 1.1, ey = 1250 + Math.sin(ang) * rr * .9;
      const bl = (Math.floor((t + i) * 1.3) % 5 === 0 && ((t + i) * 1.3 % 1) < .15) ? .1 : seg(t, appear, appear + .15);
      [-18, 18].forEach(d => { ctx.save(); ctx.translate(ex + d, ey); ctx.scale(1, bl); ctx.fillStyle = '#f4f4f4'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.ellipse(0, 0, 11, 12, 0, 0, 7); ctx.fill(); ctx.restore(); });
      ctx.fillStyle = '#05070c'; ctx.beginPath(); ctx.moveTo(ex - 32, ey - 18); ctx.lineTo(ex, ey - 6); ctx.lineTo(ex + 32, ey - 18); ctx.lineTo(ex + 32, ey - 30); ctx.lineTo(ex - 32, ey - 30); ctx.fill();
    }
    ctx.restore();
    vignette(ctx, lerp(.6, .92, seg(t, 14, 16)), lerp(420, 300, seg(t, 14, 16)));
    // "пацан" crossed -> "чушпан"
    if (t > 12.3) {
      const k = seg(t, 12.3, 12.6);
      ctx.save(); ctx.globalAlpha = k * (1 - seg(t, 14.0, 14.3)); txt(ctx, 'ПАЦАН', 540, 420, { size: 110, col: '#9aa3b5' });
      ctx.strokeStyle = PAL.red; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(330, 440); ctx.lineTo(330 + 420 * seg(t, 12.6, 12.9), 400); ctx.stroke(); ctx.restore();
    }
    if (t > 13.08) stamp(ctx, 'ЧУШПАН', 560, 1000, seg(t, 13.08, 13.45) * (1 - seg(t, 15.6, 16)), { size: 100, rot: .08 });
    if (t > 15.05) { ctx.save(); ctx.globalAlpha = seg(t, 15.05, 15.3); ctx.strokeStyle = PAL.red; ctx.lineWidth = 6; const r = lerp(260, 200, seg(t, 15, 16)); ctx.beginPath(); ctx.arc(560, 1290, r, 0, 7); ctx.moveTo(560 - r - 40, 1290); ctx.lineTo(560 - r + 50, 1290); ctx.moveTo(560 + r + 40, 1290); ctx.lineTo(560 + r - 50, 1290); ctx.moveTo(560, 1290 - r - 40); ctx.lineTo(560, 1290 - r + 50); ctx.stroke(); ctx.restore(); }
  } },
  // 4 — school extortion: jump, coins, punch
  { a: 16.0, b: 26.0, draw(ctx, t) {
    const lt = t - 16;
    ctx.save(); cam(ctx, t, { z: lerp(1, 1.18, eio(seg(t, 21.5, 25.4))) * push(lt, 10, .04), x: lerp(540, 600, seg(t, 21.5, 25)), y: 1150 });
    sky(ctx, '#2a3a58', '#4d6386', '#8796b0'); // morning
    school(ctx, 130, 1480, t); ground(ctx, 1480); fence(ctx, -300, 1400, 1500, 130);
    const walkIn = eout(seg(t, 16.0, 17.4));
    const hx = lerp(-150, 330, walkIn);
    let jump = 0; if (t > 18.6 && t < 20.6) { const p = ((t - 18.6) / .5) % 1; jump = Math.sin(p * Math.PI) * 130; }
    const hitK = seg(t, 25.4, 25.75);
    const heroMood = t > 25.4 ? 'hurt' : t > 18.1 ? 'scared' : 'calm';
    const emptyPockets = t > 24.4 && t < 25.4;
    guy(ctx, HERO(hx - hitK * 160, 1700 - jump, 1.15, { walk: walkIn < 1 ? t * 9 : null, mood: heroMood, fall: hitK > 0 ? -.9 * eout(hitK) : 0, aL: emptyPockets ? 1.1 : jump > 0 ? 2.6 : .15, aR: emptyPockets ? 1.1 : jump > 0 ? 2.6 : .15, squash: jump > 0 && jump < 20 ? .06 : 0 }));
    if (emptyPockets) { ctx.fillStyle = '#e8e8e8'; [-70, 70].forEach(d => { ctx.beginPath(); ctx.ellipse(hx + d * 1.15, 1530, 22, 14, 0, 0, 7); ctx.fill(); }); }
    // thugs
    const step = eout(seg(t, 17.6, 18.3));
    const punch = t > 25.15 ? Math.sin(seg(t, 25.15, 25.7) * Math.PI) : 0;
    guy(ctx, THUG(0, lerp(900, 700, step), 1700, 1.2, { flip: 1, aR: punch > 0 ? 1.6 * punch + .2 : t > 20.4 && t < 23 ? 1.2 : .2, fR: punch > 0 ? -.2 : -.6, talk: t > 18.1 && t < 18.9 ? Math.abs(Math.sin(t * 25)) : 0, cig: true }));
    guy(ctx, THUG(1, lerp(1080, 900, step), 1640, 1.05, { flip: 1, aL: .3, aR: .5, fR: 1.2 }));
    guy(ctx, THUG(2, lerp(1200, 1010, step), 1720, 1.1, { flip: 1, mood: 'smirk' }));
    // coins flying from hero to thug
    if (t > 19.4 && t < 21.4) {
      for (let i = 0; i < 4; i++) { const k = seg(t, 19.4 + i * .2, 20.5 + i * .2); if (k <= 0 || k >= 1) continue; const cx = lerp(hx, 640, k), cy = 1450 - Math.sin(k * Math.PI) * 300; coin(ctx, cx, cy, 30, t * 8 + i, '2'); }
    }
    if (punch > .8) { // impact star
      ctx.save(); ctx.translate(hx + 40, 1350); ctx.fillStyle = PAL.yellow; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 50 : 120; ctx.lineTo(Math.cos(i / 16 * 6.283) * r, Math.sin(i / 16 * 6.283) * r); } ctx.fill(); ctx.restore();
    }
    bubble(ctx, 'ПОПРЫГАЙ!', 700, 1150, seg(t, 18.1, 18.4) * (1 - seg(t, 19.6, 19.8)), { size: 64, tail: 40 });
    ctx.restore();
    // HUD pocket
    const cash = t < 21.98 ? '0 коп' : t < 23.84 ? '20 коп' : '1 руб';
    pill(ctx, 540, 260, 'ДАНЬ', cash, t < 23.84 ? PAL.yellow : '#3ddc84', seg(t, 19.2, 19.5));
    if (t > 21.98 && t < 23.7) { const k = seg(t, 21.98, 22.3); ctx.save(); ctx.translate(540, 560); ctx.scale(spring(k, 2, 6), spring(k, 2, 6)); coin(ctx, 0, 0, 120, (t - 21.98) * 6, '20'); ctx.restore(); }
    if (t > 23.84 && t < 25.3) { const k = seg(t, 23.84, 24.15); ctx.save(); ctx.translate(540, 560); ctx.rotate(-.08); ctx.scale(spring(k, 2, 6), spring(k, 2, 6)); banknote(ctx); ctx.restore(); }
    if (t > 25.42 && t < 25.5) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 0, W, H); }
  } },
  // 5 — another road, 3 vs 1, face in snow
  { a: 26.0, b: 31.85, draw(ctx, t) {
    const lt = t - 26;
    const scroll = lt * 160;
    ctx.save(); cam(ctx, t, { z: lerp(1.0, 1.15, eio(seg(t, 29.4, 31))), y: 1150, x: 540 });
    sky(ctx, '#151b2a', '#2b3550', '#47506a');
    ctx.save(); ctx.translate(-scroll * .3, 0); for (let i = 0; i < 6; i++) building(ctx, -300 + i * 520, 1430, 420, 600 + hash(i) * 300, { floors: 8, cols: 4, col: i % 2 ? PAL.panel : PAL.brick2, seed: 20 + i }); ctx.restore();
    ground(ctx, 1450);
    ctx.save(); ctx.translate(-scroll, 0); garages(ctx, -200, 1500, 12); ctx.restore();
    // footprints
    ctx.fillStyle = 'rgba(80,95,120,.35)'; for (let i = 0; i < 20; i++) { const fx = 420 - i * 70 + (scroll % 70); ctx.beginPath(); ctx.ellipse(fx, 1745 + (i % 2) * 18, 18, 7, 0, 0, 7); ctx.fill(); }
    const stop = seg(t, 28.8, 29.2);
    const fallK = seg(t, 30.75, 31.25);
    const lookBack = t > 27.3 && t < 28.6;
    guy(ctx, HERO(470 + fallK * 60, 1760, 1.15, { walk: stop < 1 ? t * 8 : null, flip: lookBack && Math.floor(t * 2) % 2 ? 1 : 0, mood: t > 28.9 ? 'scared' : 'sad', fall: fallK > 0 ? .98 * ein(fallK) : 0, aL: fallK > 0 ? 2.4 : .15, aR: fallK > 0 ? 2.4 : .15 }));
    const inR = eout(seg(t, 28.9, 29.4)), inL = eout(seg(t, 29.55, 30.1));
    guy(ctx, THUG(3, lerp(1300, 800, inR), 1760, 1.18, { flip: 1, walk: inR < 1 ? t * 9 : null }));
    guy(ctx, THUG(0, lerp(-300, 170, inL), 1740, 1.12, { walk: inL < 1 ? t * 9 : null, aR: t > 30.6 ? 1.5 : .2 }));
    guy(ctx, THUG(4, lerp(-450, 20, inL), 1780, 1.2, { walk: inL < 1 ? t * 9 : null, cap: 'kepka', capCol: '#242424' }));
    if (fallK > .9) { const k = seg(t, 31.2, 31.85); for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(255,255,255,${.9 * (1 - k)})`; ctx.beginPath(); ctx.arc(660 + (hash(i) - .5) * 520 * eout(k), 1740 - hash(i + 1) * 320 * Math.sin(k * 2.6), 8 + hash(i + 3) * 18, 0, 7); ctx.fill(); } }
    ctx.restore();
    if (t > 29.6 && t < 30.7) { const k = seg(t, 29.6, 29.9); ctx.save(); ctx.translate(540, 420); ctx.scale(spring(k), spring(k)); rrect(ctx, -250, -110, 500, 220, 30); ctx.fillStyle = '#0f1420'; ctx.fill(); txt(ctx, '3 : 1', 0, 4, { size: 150, col: PAL.red }); ctx.restore(); }
    if (t > 31.2) { ctx.fillStyle = `rgba(240,245,255,${seg(t, 31.4, 31.85)})`; ctx.fillRect(0, 0, W, H); }
  } },
  // 6 — get up, garages with fists, beaten again, up again, elders watch
  { a: 31.85, b: 42.1, draw(ctx, t) {
    const lt = t - 31.85;
    const tiltUp = eio(seg(t, 40.4, 41.6));
    ctx.save(); cam(ctx, t, { z: lerp(1.05, .95, tiltUp) * push(lt, 10, .05), y: lerp(1180, 900, tiltUp), x: lerp(520, 600, tiltUp) });
    sky(ctx, '#151b2a', '#2d3753', '#4b5470');
    building(ctx, -300, 1250, 700, 900, { floors: 9, cols: 6, col: PAL.panel2, seed: 33 }); building(ctx, 700, 1250, 700, 1000, { floors: 10, cols: 6, col: PAL.panel, seed: 34 });
    ground(ctx, 1500); garages(ctx, -100, 1500, 6);
    // elders on garage roof
    const eldK = seg(t, 40.4, 41.0);
    ctx.save(); ctx.globalAlpha = eldK;
    [[620, '#1c1c1c', 'kepka'], [780, '#2a2620', 'kepka'], [930, '#222', 'ushanka']].forEach(([ex, c, cp], i) => {
      guy(ctx, { x: ex, y: 1225, s: .8, coat: c, cap: cp, capCol: '#1a1a1a', eyes: 'amber', mood: 'tough', cig: i !== 1, flip: 1, legs: .5, shadow: false, tilt: i === 1 && t > 41.2 ? Math.sin(seg(t, 41.2, 41.9) * Math.PI * 2) * .12 : 0, bob: 0 });
    });
    ctx.restore();
    // hero
    const up1 = eio(seg(t, 31.95, 32.9));
    const walk = seg(t, 33.2, 35.5);
    const fall2 = seg(t, 37.75, 38.3), up2 = eio(seg(t, 39.5, 40.3));
    const fallV = fall2 > 0 && up2 < 1 ? lerp(-.98 * eout(fall2), 0, up2) : 0;
    const hx = lerp(220, 430, eout(walk)) - fall2 * (1 - up2) * 120;
    const guard = t > 36.6 && t < 37.75;
    const fallFirst = t < 32.9 ? lerp(.98, 0, up1) : 0;
    guy(ctx, HERO(hx, 1720, 1.15, { fall: fallFirst || fallV, walk: walk > 0 && walk < 1 ? t * 8 : null, mood: (fallV < -.5) ? 'hurt' : guard || t > 40 ? 'angry' : 'calm', aL: guard ? 2.4 : .2, fL: guard ? -1.8 : 0, aR: guard ? 2.2 : .2, fR: guard ? -1.9 : 0, squash: up2 > .9 && up2 < 1 ? .05 : 0 }));
    const punch = t > 37.45 ? Math.sin(seg(t, 37.45, 37.95) * Math.PI) : 0;
    guy(ctx, THUG(1, 720, 1720, 1.2, { flip: 1, aR: .2 + 1.6 * punch, fR: -.2, mood: 'angry' }));
    guy(ctx, THUG(2, 900, 1700, 1.1, { flip: 1, mood: 'smirk', cig: true }));
    if (punch > .85) { ctx.save(); ctx.translate(hx + 60, 1360); ctx.fillStyle = PAL.yellow; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 45 : 110; ctx.lineTo(Math.cos(i / 16 * 6.283) * r, Math.sin(i / 16 * 6.283) * r); } ctx.fill(); ctx.restore(); }
    ctx.restore();
    // attempt counter
    const tries = t < 37.75 ? 1 : t < 39.6 ? 1 : 2;
    pill(ctx, 540, 260, 'ВСТАЛ', `${t < 32.9 ? 0 : tries} раз`, PAL.cyan, seg(t, 32.3, 32.6) * (1 - seg(t, 40.3, 40.6)));
    if (t > 40.5) { const k = seg(t, 41.1, 41.5); ctx.save(); ctx.globalAlpha = k; txt(ctx, 'СТАРШИЕ', 760, 640, { size: 64, col: '#ffc04d', stroke: 10 }); ctx.strokeStyle = '#ffc04d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(760, 690); ctx.lineTo(780, 800); ctx.stroke(); ctx.restore(); }
  } },
  // 7 — initiation: 1v1 in a ring, handshake, CHUSHPAN -> PACAN
  { a: 42.1, b: 52.3, draw(ctx, t) {
    const lt = t - 42.1;
    const fightZ = eio(seg(t, 44.1, 45)) * (1 - eio(seg(t, 48.5, 49.3)));
    ctx.save(); cam(ctx, t, { z: (1 + .18 * fightZ) * push(lt, 10.2, .04), y: lerp(1120, 1220, fightZ) });
    sky(ctx, '#10151f', '#222b40', '#3b4560');
    building(ctx, -200, 1150, 1500, 800, { floors: 8, cols: 12, col: PAL.panel2, seed: 44, lit: .3 });
    ground(ctx, 1300, '#a9b5c6');
    // crowd ring back
    for (let i = 0; i < 11; i++) { const cx = -40 + i * 116, cy = 1420 + (i % 2) * 30; guy(ctx, THUG(i, cx, cy, .72, { flip: cx > 540 ? 1 : 0, mood: 'tough', aL: .2 + Math.sin(t * 6 + i) * .15 * (t > 46.5 && t < 49 ? 3 : 1), aR: .2 + Math.cos(t * 6 + i) * .15 * (t > 46.5 && t < 49 ? 3 : 1), bob: t > 46.5 && t < 49 ? Math.abs(Math.sin(t * 8 + i)) * 12 : 0 })); }
    lamp(ctx, 960, 1500, 650);
    // elder
    const elderIn = t < 44.1 || t > 48.4;
    const shake = t > 48.6 && t < 49.9;
    if (elderIn) guy(ctx, { x: shake ? 640 : 760, y: 1730, s: 1.15, coat: '#1e1e22', collar: '#5a4636', cap: 'kepka', capCol: '#141414', eyes: 'amber', mood: 'tough', flip: 1, talk: t < 44 && (t > 42.15 && t < 43.4 || t > 43.45 && t < 44) ? Math.abs(Math.sin(t * 22)) : 0, aR: shake ? 1.35 + Math.sin(t * 18) * .1 : .2, cig: !shake });
    // opponent
    const oppFall = seg(t, 47.85, 48.4);
    if (!elderIn || t < 49.2) {
      const swing = t > 46.6 && t < 47.3 ? Math.sin(seg(t, 46.6, 47.3) * Math.PI) : 0;
      if (t > 44.0) guy(ctx, THUG(3, lerp(1250, 720, eout(seg(t, 44.0, 44.7))) + oppFall * 120, 1740, 1.18, { flip: 1, fall: oppFall > 0 ? .98 * ein(oppFall) : 0, aR: .3 + swing * 1.6, aL: 2.2, fL: -1.8, mood: oppFall > 0 ? 'hurt' : 'angry', walk: t < 44.7 ? t * 9 : null }));
    }
    // hero
    const dodge = t > 46.7 && t < 47.4 ? Math.sin(seg(t, 46.7, 47.4) * Math.PI) : 0;
    const hit = t > 47.45 && t < 48.0 ? Math.sin(seg(t, 47.45, 48.0) * Math.PI) : 0;
    const proud = t > 51.4;
    guy(ctx, HERO(420, 1740, 1.18, { lean: -dodge * .3, mood: t > 44 ? (proud ? 'tough' : 'angry') : 'calm', aL: t > 44 && t < 48.6 ? 2.3 : .2, fL: t > 44 && t < 48.6 ? -1.8 : 0, aR: shake ? 1.35 + Math.sin(t * 18) * .1 : t > 44 && t < 48.6 ? 2.1 + hit * .5 : .2, fR: t > 44 && t < 48.6 ? -1.6 + hit * 1.6 : 0, coat: proud ? '#2b2f3a' : PAL.hero, cap: proud ? 'kepka' : 'knit', capCol: proud ? '#1d1d22' : '#2a5cc0', cig: false }));
    if (hit > .8) { ctx.save(); ctx.translate(690, 1360); ctx.fillStyle = PAL.yellow; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 45 : 110; ctx.lineTo(Math.cos(i / 16 * 6.283) * r, Math.sin(i / 16 * 6.283) * r); } ctx.fill(); ctx.restore(); }
    bubble(ctx, 'ХОЧЕШЬ ПРИШИТЬСЯ?', 640, 1220, seg(t, 42.15, 42.45) * (1 - seg(t, 43.3, 43.45)), { size: 54, tail: 80 });
    bubble(ctx, 'ДОКАЖИ.', 700, 1220, seg(t, 43.45, 43.7) * (1 - seg(t, 44.0, 44.15)), { size: 70, tail: 40 });
    ctx.restore();
    if (t > 44.2 && t < 46.5) { const k = seg(t, 44.2, 44.5); ctx.save(); ctx.translate(540, 420); ctx.scale(spring(k), spring(k)); rrect(ctx, -270, -100, 540, 200, 30); ctx.fillStyle = '#0f1420'; ctx.fill(); txt(ctx, '1  НА  1', 0, 4, { size: 110, col: PAL.yellow }); ctx.restore(); }
    // status HUD
    const isP = t > 51.45;
    pill(ctx, 540, 260, 'СТАТУС', isP ? 'ПАЦАН' : 'ЧУШПАН', isP ? '#3ddc84' : PAL.red, seg(t, 49.9, 50.2));
    if (isP) stamp(ctx, 'ПАЦАН', 540, 560, seg(t, 51.45, 51.8), { size: 130, col: '#3ddc84', rot: -.05 });
  } },
  // 8 — rules notebook, missed meeting -> beaten by own
  { a: 52.3, b: 60.4, draw(ctx, t) {
    const lt = t - 52.3;
    const flipAway = eio(seg(t, 57.6, 58.1));
    // scene behind: own guys punish
    ctx.save(); cam(ctx, t, { z: push(lt, 8, .05), y: 1150 });
    sky(ctx, '#121826', '#26304a', '#414b66'); building(ctx, -200, 1400, 1500, 900, { floors: 9, cols: 11, col: PAL.brick2, seed: 55 }); ground(ctx, 1400);
    const kick = t > 59.2 ? Math.sin(seg(t, 59.2, 59.7) * Math.PI) : 0;
    const late = seg(t, 58.0, 58.9);
    guy(ctx, HERO(lerp(-150, 380, eout(late)) - seg(t, 59.45, 59.8) * 120, 1720, 1.1, { coat: '#2b2f3a', cap: 'kepka', capCol: '#1d1d22', walk: late < 1 ? t * 9 : null, mood: t > 59.45 ? 'hurt' : 'scared', fall: t > 59.45 ? -.5 * eout(seg(t, 59.45, 59.8)) : 0 }));
    for (let i = 0; i < 4; i++) guy(ctx, THUG(i, 620 + i * 140, 1700 + (i % 2) * 30, 1.05, { flip: 1, mood: 'angry', legs: i === 0 ? -kick * .9 : 0, aR: i === 1 ? 1.2 : .2 }));
    ctx.restore();
    // clock
    if (t > 58.0) { const k = seg(t, 58.0, 58.3); ctx.save(); ctx.translate(820, 420); ctx.scale(spring(k), spring(k)); ctx.fillStyle = '#efe6d5'; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 8; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -70); ctx.moveTo(0, 0); const a = (t - 58) * 4; ctx.lineTo(Math.sin(a) * 85, -Math.cos(a) * 85); ctx.stroke(); txt(ctx, 'ОПОЗДАЛ', 0, 160, { size: 46, col: PAL.red, stroke: 8 }); ctx.restore(); }
    // notebook page
    if (flipAway < 1) {
      ctx.save(); ctx.translate(540 - flipAway * 1300, 960 + flipAway * 200); ctx.rotate(-.04 - flipAway * .6 + Math.sin(t * .5) * .01);
      const s = lerp(.92, 1, eout(seg(t, 52.3, 52.9))); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(ctx, -440, -620, 900, 1260, 20); ctx.fill();
      ctx.fillStyle = '#efe9da'; rrect(ctx, -460, -640, 900, 1260, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(70,110,170,.35)'; ctx.lineWidth = 3; for (let y = -520; y < 600; y += 70) { ctx.beginPath(); ctx.moveTo(-460, y); ctx.lineTo(440, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(200,60,60,.5)'; ctx.beginPath(); ctx.moveTo(-360, -640); ctx.lineTo(-360, 620); ctx.stroke();
      txt(ctx, 'ЗАКОНЫ УЛИЦЫ', 0, -540, { size: 70, col: '#1d2a44' });
      const rules = [[53.5, '1. Слушай старших'], [54.45, '2. Сборы — каждый вечер'], [56.6, '3. Своих не сдают']];
      rules.forEach(([at, s2], i) => { const k = seg(t, at, at + .45); if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(-340, -420 + i * 210, 760 * k, 160); ctx.clip(); txt(ctx, s2, -320, -340 + i * 210, { size: 56, w: 800, col: '#20304f', align: 'left', maxW: 740 }); ctx.restore(); });
      if (t > 57.0) { const k = seg(t, 57.0, 57.35); ctx.strokeStyle = PAL.red; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(40, 80, 400, 90 * k, -.02, 0, 7 * k); ctx.stroke(); }
      ctx.restore();
    }
  } },
  // 9 — hierarchy pyramid: Antip, Dzhavda, Skryaba
  { a: 60.4, b: 67.5, draw(ctx, t) {
    const lt = t - 60.4;
    const down = eio(seg(t, 63.6, 64.8));
    ctx.save(); cam(ctx, t, { z: lerp(1.25, .82, down), y: lerp(780, 1130, down) });
    sky(ctx, '#0b0f18', '#1a2234', '#2a3248');
    // rays
    ctx.save(); ctx.globalAlpha = .12; ctx.translate(540, 700); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6 + t * .002); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1600); ctx.lineTo(90, -1600); ctx.fill(); } ctx.restore();
    // rows
    const rows = [[3, 1.05, 890], [6, .7, 1260], [9, .52, 1550], [13, .4, 1800], [17, .32, 2010]];
    rows.forEach(([n, s, y], r) => {
      for (let i = 0; i < n; i++) {
        const x = 540 + (i - (n - 1) / 2) * (r === 0 ? 300 : 980 / n * 1.05);
        if (r === 0) {
          const at = [61.7, 62.3, 63.1][i]; const k = seg(t, at, at + .35); if (k <= 0) continue;
          ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - eout(k)) * 60);
          const L = [{ cap: 'kepka', capCol: '#141414', coat: '#1c1d22' }, { cap: 'ushanka', capCol: '#4a3a2c', coat: '#2a2622' }, { cap: 'kepka', capCol: '#2c2f38', coat: '#23262e' }][i];
          guy(ctx, Object.assign({ x, y, s, eyes: 'amber', mood: 'tough', cig: i === 0, flip: i === 2 ? 1 : 0 }, L));
          const nm = ['АНТИП', 'ДЖАВДА', 'СКРЯБА'][i];
          rrect(ctx, x - 125, y + 20, 250, 70, 14); ctx.fillStyle = '#0f1420'; ctx.fill(); ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 4; ctx.stroke(); txt(ctx, nm, x, y + 56, { size: 42, col: PAL.yellow });
          ctx.restore();
        } else {
          if (t < 63.6 + r * .15) continue; guy(ctx, THUG(i + r, x, y, s, { mood: 'tough', shadow: false }));
        }
      }
    });
    ctx.restore();
    if (t > 63.7) { ctx.save(); ctx.globalAlpha = seg(t, 63.7, 64.1); txt(ctx, 'старшие → средние → «скорлупа»', 540, 300, { size: 40, w: 700, col: '#dfe5ef', stroke: 8 }); ctx.restore(); }
    if (t > 66.65) stamp(ctx, 'ПЕРВАЯ ОПГ СССР', 540, 520, seg(t, 66.65, 67.0), { size: 82, rot: -.06 });
    if (t > 66.9) { ctx.save(); ctx.globalAlpha = seg(t, 66.9, 67.1); txt(ctx, 'так её называют историки и журналисты', 540, 640, { size: 32, w: 600, col: '#cfd6e4', stroke: 6 }); ctx.restore(); }
  } },
  // 10 — district vs district, wall on wall, asphalt border
  { a: 67.5, b: 72.5, draw(ctx, t) {
    const lt = t - 67.5;
    const panDown = eio(seg(t, 70.0, 70.8));
    ctx.save(); cam(ctx, t, { z: lerp(1, 1.25, panDown), y: lerp(1150, 1600, panDown) });
    sky(ctx, '#121726', '#2a2f45', '#5a4a58');
    building(ctx, -500, 1350, 900, 800, { floors: 9, cols: 7, col: PAL.panel2, seed: 71 }); building(ctx, 680, 1350, 900, 850, { floors: 9, cols: 7, col: PAL.brick2, seed: 72 });
    ground(ctx, 1350, '#8c97a8');
    // asphalt with painted border
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-600, 1750, 2300, 600);
    ctx.fillStyle = '#e8e8e8'; for (let y = 1760; y < 2300; y += 70) ctx.fillRect(532, y, 16, 40);
    const charge = eio(seg(t, 68.7, 69.3));
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
      const y = 1560 + r * 70 + (i % 2) * 20, lx = lerp(-200 - i * 70, 380 - i * 60, charge) , rx = lerp(1280 + i * 70, 700 + i * 60, charge);
      const sh = charge > .95 ? Math.sin(t * 30 + i) * 6 : 0;
      if (t > 67.55) guy(ctx, Object.assign(HERO(lx + sh, y, .8 - r * .08, { mood: 'angry', walk: charge < 1 ? t * 10 + i : null, aR: charge > .9 ? 1.6 + Math.sin(t * 14 + i) * .5 : .3 }), { coat: i % 2 ? '#2b2f3a' : '#33384a', cap: i % 3 ? 'kepka' : 'ushanka', capCol: '#1d1d22', eyes: 'cyan' }));
      if (t > 68.2) guy(ctx, THUG(i + r, rx - sh, y, .8 - r * .08, { flip: 1, walk: charge < 1 ? t * 10 + i : null, aR: charge > .9 ? 1.6 + Math.cos(t * 14 + i) * .5 : .3, eyes: 'white', coat: ['#5a2f2f', '#4b2a2a', '#633838'][i % 3] }));
    }
    if (charge > .95 && t < 70.4) { const k = seg(t, 69.3, 70.4); for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(220,225,235,${.7 * (1 - k)})`; ctx.beginPath(); ctx.arc(540 + (hash(i) - .5) * 600 * eout(k), 1500 - hash(i + 1) * 300 * eout(k), 20 + hash(i + 2) * 40, 0, 7); ctx.fill(); } }
    if (panDown > .5) { txt(ctx, 'НАШЕ', 300, 1830, { size: 80, col: PAL.cyan, stroke: 10 }); txt(ctx, 'ЧУЖОЕ', 790, 1830, { size: 80, col: PAL.red, stroke: 10 }); }
    ctx.restore();
    const ls = seg(t, 67.55, 67.9), rs = seg(t, 68.2, 68.5);
    pill(ctx, 290, 280, 'РАЙОН', 'ТЯП-ЛЯП', PAL.cyan, ls); pill(ctx, 790, 280, 'РАЙОН', 'ЧУЖИЕ', PAL.red, rs);
  } },
  // 11 — "probegi": crowd sweeps the street, passers-by, lights go out
  { a: 72.5, b: 83.45, draw(ctx, t) {
    const lt = t - 72.5;
    const city = eio(seg(t, 80.8, 81.6));
    ctx.save(); cam(ctx, t, { z: lerp(1.08, .72, city), y: lerp(1180, 1000, city), x: lerp(540 + lt * 20, 540, city) });
    sky(ctx, '#0e131f', '#222a3f', '#3b445e');
    for (let i = 0; i < 5; i++) building(ctx, -900 + i * 620, 1400, 560, 900 + hash(i + 80) * 400, { floors: 10, cols: 6, col: i % 2 ? PAL.panel : PAL.brick2, seed: 80 + i, lit: .6, offAt: 81.4, t, offSpread: 2 });
    ground(ctx, 1400, '#9aa6b8'); lamp(ctx, 120, 1520, 600); lamp(ctx, 980, 1520, 600);
    // passers-by fleeing
    const march = seg(t, 74.6, 80.6);
    const front = lerp(-500, 1500, march);
    const pb = [[300, '#6b5a48', 'ushanka'], [620, '#7a3e3e', 'knit'], [900, '#55624a', 'kepka']];
    pb.forEach(([px, c, cp], i) => {
      const run = clamp((front - px + 300) / 200);
      const hitp = i === 1 && t > 77.65 ? seg(t, 77.65, 78.1) : 0;
      guy(ctx, { x: px + run * 900 - hitp * 0, y: 1660 + i * 10, s: .95, coat: c, cap: cp, capCol: shade(c, .6), eyes: 'white', mood: run > 0 ? 'scared' : 'calm', walk: run > 0 ? t * 14 : t * 4, aL: run > 0 ? 2.4 : .2, aR: run > 0 ? 2.4 : .2, fall: hitp > 0 ? .95 * eout(hitp) : 0 });
    });
    // a kid like hero gets surrounded
    if (t > 78.8) {
      const k = seg(t, 78.8, 79.3);
      guy(ctx, HERO(560, 1700, 1.0, { mood: 'scared', look: Math.sin(t * 6), aL: .1, aR: .1 }));
      for (let i = 0; i < 4; i++) { const a = -2.8 + i * 1.1; guy(ctx, THUG(i, 560 + Math.cos(a) * lerp(600, 230, eout(k)), 1700 + Math.sin(a) * 30, 1.0, { flip: Math.cos(a) > 0 ? 1 : 0, holds: true, holdSide: 1, aR: 2.4, fR: -.5 })); }
    }
    // the mob
    if (t < 79.0) for (let i = 0; i < 14; i++) {
      const x = front - (i % 7) * 130 - Math.floor(i / 7) * 60, y = 1640 + Math.floor(i / 7) * 80;
      guy(ctx, THUG(i, x, y, .9 + Math.floor(i / 7) * .08, { walk: t * 11 + i, holds: true, holdSide: 1, aR: 2.5 + Math.sin(t * 9 + i) * .4, fR: -.3, mood: 'angry' }));
    }
    ctx.restore();
    if (t > 73.85) { const k = seg(t, 73.85, 74.2) * (1 - seg(t, 75.4, 75.7)); stamp(ctx, 'ПРОБЕГИ', 540, 470, k, { size: 140, rot: -.05 }); }
    if (t > 81.6) { // window peek
      const k = seg(t, 81.7, 82.0);
      ctx.save(); ctx.globalAlpha = k; ctx.translate(540, 520); rrect(ctx, -170, -150, 340, 300, 10); ctx.fillStyle = '#2a2f3a'; ctx.fill(); ctx.fillStyle = t < 82.9 ? '#ffd88a' : '#151a25'; ctx.fillRect(-150, -130, 300, 260);
      ctx.fillStyle = '#0d0f14'; ctx.beginPath(); ctx.arc(-10, 60, 70, Math.PI, 0); ctx.fill(); [-34, 14].forEach(ex => { ctx.fillStyle = PAL.white; ctx.beginPath(); ctx.ellipse(ex, 30, 10, 13, 0, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#7a2e2e'; const cl = eio(seg(t, 82.3, 82.9)); ctx.fillRect(-150, -130, 150 * cl, 260); ctx.fillRect(150 - 150 * cl, -130, 150 * cl, 260);
      ctx.restore();
    }
  } },
  // 12 — 1980 court in SIZO, soldiers, counters, sentence
  { a: 83.45, b: 96.65, draw(ctx, t) {
    const lt = t - 83.45;
    ctx.save(); cam(ctx, t, { z: push(lt, 13, .06), y: 1100 });
    sky(ctx, '#151922', '#2a2f3c', '#3b404d');
    if (t < 89.2) {
      // SIZO building
      building(ctx, 40, 1450, 1000, 820, { floors: 5, cols: 7, col: '#6f7179', seed: 90, lit: .25, roofSnow: true });
      ctx.strokeStyle = '#1b1d22'; ctx.lineWidth = 5; for (let c = 0; c < 7; c++) for (let r = 0; r < 5; r++) { const wx = 40 + (c + .25) * 1000 / 7, wy = 1450 - 820 + (r + .3) * 820 / 5; for (let b = 1; b < 4; b++) { ctx.beginPath(); ctx.moveTo(wx + b * 18, wy); ctx.lineTo(wx + b * 18, wy + 74); ctx.stroke(); } }
      ctx.fillStyle = '#e0e0e0'; ctx.fillRect(330, 560, 420, 60); txt(ctx, 'СИЗО', 540, 592, { size: 44, col: '#222' });
      // barbed wire
      ctx.strokeStyle = '#999'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = -100; x < 1200; x += 30) { ctx.arc(x, 1450 - 860, 14, 0, Math.PI * 2); } ctx.stroke();
      ground(ctx, 1450, '#a7b0bd');
      const mk = seg(t, 88.0, 89.2);
      for (let i = 0; i < 5; i++) { const x = lerp(-200, 140, mk) + i * 190; guy(ctx, { x, y: 1700, s: .95, coat: '#4b5a3a', cap: 'ushanka', capCol: '#3e4a30', eyes: 'white', mood: 'tough', walk: mk > 0 && mk < 1 ? t * 9 : null, holds: true, holdSide: 1, aR: .3, fR: 2.6 }); }
    } else {
      // courtroom cage with bench
      ctx.fillStyle = '#5a4a3c'; ctx.fillRect(-600, 400, 2300, 1100); ground(ctx, 1500, '#7a6a58');
      ctx.fillStyle = '#3e3228'; ctx.fillRect(-100, 1620, 1280, 60);
      const n = Math.round(lerp(0, 28, seg(t, 89.3, 91.0)));
      for (let i = 0; i < Math.min(n, 14); i++) guy(ctx, THUG(i, 20 + i * 76, 1620, .55, { mood: 'sad', shadow: false, aL: .4, aR: .4 }));
      for (let i = 14; i < n; i++) guy(ctx, THUG(i, -10 + (i - 14) * 80, 1720, .6, { mood: 'sad', shadow: false }));
      ctx.strokeStyle = '#20232a'; ctx.lineWidth = 9; for (let x = -100; x < 1200; x += 60) { ctx.beginPath(); ctx.moveTo(x, 900); ctx.lineTo(x, 1800); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-100, 900); ctx.lineTo(1200, 900); ctx.stroke();
      pill(ctx, 540, 640, 'НА СКАМЬЕ', `${n} человек`, PAL.yellow, seg(t, 89.3, 89.6));
    }
    ctx.restore();
    // calendar 1980
    if (t < 85.3) { const k = seg(t, 83.5, 83.8); const fl = eio(seg(t, 84.0, 84.6)); ctx.save(); ctx.translate(540, 900); ctx.scale(spring(k), spring(k)); rrect(ctx, -260, -300, 520, 600, 24); ctx.fillStyle = '#efe9da'; ctx.fill(); ctx.fillStyle = PAL.red; rrect(ctx, -260, -300, 520, 130, 24); ctx.fill(); txt(ctx, 'ГОД', 0, -236, { size: 56 }); txt(ctx, fl < .5 ? '1979' : '1980', 0, 60, { size: 190, col: '#1d2a44' }); ctx.restore(); }
    // gavel
    if (t > 85.0 && t < 86.6) { const k = seg(t, 85.0, 85.35); const a = lerp(-1.1, .15, ein(k)); ctx.save(); ctx.translate(560, 980); ctx.fillStyle = '#5b3b22'; ctx.fillRect(-160, 120, 320, 50); ctx.translate(140, 60); ctx.rotate(a); ctx.fillStyle = '#6e4628'; ctx.fillRect(-20, -230, 40, 260); rrect(ctx, -90, -300, 180, 90, 20); ctx.fill(); ctx.restore(); if (k >= 1) txt(ctx, 'СУД', 540, 520, { size: 170, col: PAL.white, stroke: 14 }); }
    if (t > 85.6 && t < 89.2) { ctx.save(); ctx.globalAlpha = seg(t, 85.7, 86.1); txt(ctx, 'суд прошёл прямо в здании СИЗО', 540, 300, { size: 42, w: 700, col: '#dfe5ef', stroke: 8 }); ctx.restore(); }
    // stat cards
    const cards = [[91.3, '4', 'УБИЙСТВА'], [92.6, '15', 'ПОКУШЕНИЙ']];
    if (t < 94.0) cards.forEach(([at, num, lab], i) => { const k = seg(t, at, at + .35); if (k <= 0) return; ctx.save(); ctx.translate(lerp(1400, i ? 760 : 320, eout(k)), 1060); ctx.rotate(i ? .05 : -.05); rrect(ctx, -200, -170, 400, 340, 22); ctx.fillStyle = '#efe9da'; ctx.fill(); txt(ctx, num, 0, -30, { size: 170, col: PAL.red }); txt(ctx, lab, 0, 105, { size: 46, col: '#1d2a44', maxW: 360 }); ctx.restore(); });
    // four mugshots + sentence
    if (t > 93.95) {
      ctx.fillStyle = `rgba(10,12,18,${.85 * seg(t, 93.95, 94.3)})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) {
        const k = seg(t, 94.0 + i * .25, 94.3 + i * .25); if (k <= 0) continue;
        const x = 160 + i * 253; ctx.save(); ctx.globalAlpha = k; ctx.translate(x, 900);
        ctx.fillStyle = '#d6d0c2'; ctx.fillRect(-110, -170, 220, 300);
        ctx.strokeStyle = '#888'; ctx.lineWidth = 2; for (let y = -150; y < 120; y += 30) { ctx.beginPath(); ctx.moveTo(-110, y); ctx.lineTo(110, y); ctx.stroke(); }
        ctx.save(); ctx.beginPath(); ctx.rect(-110, -170, 220, 300); ctx.clip(); guy(ctx, THUG(i, 0, 300, .78, { mood: 'sad', shadow: false })); ctx.restore();
        txt(ctx, i === 0 ? 'ДЖАВДА' : '№ ' + (i + 1), 0, 170, { size: 36, col: i === 0 ? PAL.yellow : '#cfd6e4' });
        ctx.restore();
      }
      if (t > 95.96) { stamp(ctx, 'РАССТРЕЛ', 540, 900, seg(t, 95.96, 96.3), { size: 150, rot: -.1, fill: 'rgba(10,12,18,.4)' }); }
      if (t > 96.2) { ctx.save(); ctx.globalAlpha = seg(t, 96.2, 96.4); txt(ctx, 'двоим позже заменили на 15 лет', 540, 1150, { size: 34, w: 700, col: '#cfd6e4' }); ctx.restore(); }
    }
  } },
  // 13 — finale: same entrance, 20 kopecks, question
  { a: 96.65, b: 108, draw(ctx, t) {
    const lt = t - 96.65;
    const close = eio(seg(t, 98.6, 99.6)) * (1 - eio(seg(t, 100.9, 101.8)));
    const face = eio(seg(t, 102.5, 105.4));
    ctx.save(); cam(ctx, t, { z: lerp(1.0, 2.2, close) * lerp(1, 1.9, face), y: lerp(lerp(1150, 1330, close), 1060, face), x: lerp(lerp(560, 720, close), 560, face) });
    sky(ctx); podezd(ctx, 560, 1560, t, lerp(1, .35, seg(t, 103, 106))); ground(ctx, 1560); lamp(ctx, 120, 1600, 600, lerp(1, .5, seg(t, 103, 106)));
    const handUp = eio(seg(t, 98.5, 99.1)) * (1 - eio(seg(t, 104.6, 105.0)));
    guy(ctx, HERO(560, 1640, 1.25, { coat: '#2b2f3a', cap: 'kepka', capCol: '#1d1d22', mood: t > 102.6 ? 'sad' : 'tough', aR: lerp(.15, 1.25, handUp), fR: lerp(0, -1.4, handUp), look: t > 103 ? -.5 : 0 }));
    // coin in hand / flipping
    const flipK = seg(t, 104.8, 106.4);
    if (handUp > .3 || flipK > 0) {
      const cx = flipK > 0 ? 690 : 560 + Math.sin(1.25) * 72 * 1.25 + Math.sin(-.15) * 66 * 1.25 + 20, cy = flipK > 0 ? 1270 - Math.sin(Math.min(flipK, .55) / .55 * Math.PI / 2) * 380 : 1300;
      coin(ctx, cx, cy, 40, flipK > 0 ? flipK * 30 : 0, '20');
    }
    ctx.restore();
    if (t > 101.0) { // status: chushpan crossed
      const k = seg(t, 101.0, 101.3) * (1 - seg(t, 102.5, 102.8));
      pill(ctx, 540, 260, 'СТАТУС', 'ПАЦАН', '#3ddc84', k);
      ctx.save(); ctx.globalAlpha = k; txt(ctx, 'ЧУШПАН', 540, 430, { size: 90, col: '#9aa3b5' }); ctx.strokeStyle = PAL.red; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(360, 450); ctx.lineTo(360 + 360 * seg(t, 101.8, 102.2), 410); ctx.stroke(); ctx.restore();
    }
    if (t > 104.3) { const k = seg(t, 104.3, 104.8); ctx.save(); ctx.globalAlpha = k; txt(ctx, 'ОНО ТОГО', 540, 420, { size: 120, col: PAL.white, stroke: 14 }); txt(ctx, 'СТОИЛО?', 540, 560, { size: 140, col: PAL.yellow, stroke: 14 }); ctx.restore(); }
    vignette(ctx, lerp(.5, .9, seg(t, 103, 107)), 380);
    if (t > 107.0) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 107.0, 108)})`; ctx.fillRect(0, 0, W, H); }
  } },
];
function coin(ctx, x, y, r, spin, label) {
  ctx.save(); ctx.translate(x, y); const sx = Math.abs(Math.cos(spin)) * .9 + .1; ctx.scale(sx, 1);
  ctx.fillStyle = '#b98a3e'; ctx.beginPath(); ctx.arc(0, 4, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#e9c46a'; ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = r * .5; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#a77a30'; ctx.lineWidth = r * .08; ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, 7); ctx.stroke();
  if (sx > .4) { txt(ctx, label, 0, -r * .1, { size: r * .7, col: '#7a5420' }); if (r > 60) txt(ctx, 'КОПЕЕК · 1974', 0, r * .45, { size: r * .14, col: '#7a5420', w: 800 }); }
  ctx.restore();
}
function banknote(ctx) {
  rrect(ctx, -240, -120, 480, 240, 14); ctx.fillStyle = '#c9b88a'; ctx.fill(); ctx.strokeStyle = '#7a6a3a'; ctx.lineWidth = 6; rrect(ctx, -220, -100, 440, 200, 10); ctx.stroke();
  txt(ctx, '1', -150, 0, { size: 140, col: '#6a5a2a' }); txt(ctx, 'ОДИН РУБЛЬ', 60, -30, { size: 40, col: '#5a4a1a' }); txt(ctx, '1961', 60, 30, { size: 30, col: '#5a4a1a', w: 700 });
}
