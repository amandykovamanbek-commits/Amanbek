// ===== v2 character rig: 2-bone limbs, gait cycles, poses, expressive faces =====
// Conventions: figure faces +x (flip mirrors). Angles in radians. Limb angle 0 = straight down, + = forward.
const RIG = { hipY: -150, thigh: 80, shin: 78, upper: 70, fore: 64, shY: -276, shX: 44, headY: -356, headR: 64 };

// ---- gait & pose generators: return partial pose objects ----
function gaitWalk(p, amp = 1) {
  const s = Math.sin(p), c = Math.cos(p), s2 = Math.sin(p + Math.PI), c2 = Math.cos(p + Math.PI);
  return {
    thF: .42 * s * amp, knF: (.12 + .75 * Math.max(0, c) ** 1.5) * amp,
    thB: .42 * s2 * amp, knB: (.12 + .75 * Math.max(0, c2) ** 1.5) * amp,
    arF: -.38 * s * amp, elF: .35 + .3 * Math.max(0, -s) * amp,
    arB: -.38 * s2 * amp, elB: .35 + .3 * Math.max(0, -s2) * amp,
    lift: 9 * Math.abs(Math.cos(p)) * amp, lean: .04 * amp, headBob: Math.sin(p * 2) * .02
  };
}
function gaitRun(p) {
  const g = gaitWalk(p, 1.55);
  g.lean = .2; g.elF = 1.4; g.elB = 1.4; g.arF *= 1.2; g.arB *= 1.2; g.lift = 22 * Math.abs(Math.cos(p)); return g;
}
const POSE = {
  idle: t => ({ arF: .08 + Math.sin(t * 1.3) * .03, arB: .06 + Math.sin(t * 1.3 + 1) * .03, elF: .18, elB: .15, breathe: 1 }),
  pockets: t => ({ arF: -.18, elF: 1.2, arB: -.15, elB: 1.15, handsHidden: 1, breathe: 1 }),
  guard: t => ({ arF: 1.15 + Math.sin(t * 5) * .06, elF: 1.9, arB: .95 + Math.sin(t * 5 + 1) * .06, elB: 2.0, thF: .25, knF: .25, thB: -.2, knB: .2, lean: .08, bounce: Math.abs(Math.sin(t * 5)) * 6 }),
  punch: k => ({ arF: lerp(1.0, 1.55, k), elF: lerp(2.0, .05, k), arB: .9, elB: 2.0, thF: .35, knF: .2, thB: -.3, knB: .25, lean: .12 + .12 * k }),
  cower: t => ({ arF: 2.6, elF: 1.7, arB: 2.5, elB: 1.8, lean: -.08, crouch: .25, tremble: 1 }),
  armsUp: t => ({ arF: 2.7, elF: .3, arB: 2.6, elB: .3 }),
  shrug: t => ({ arF: .5, elF: 1.5, arB: .45, elB: 1.5, shoulder: 8 }),
  point: t => ({ arF: 1.45, elF: .05, arB: .1, elB: .2 }),
  shake: t => ({ arF: .95 + Math.sin(t * 16) * .08, elF: .5, arB: .1, elB: .2 }),
  hit: k => ({ arF: -.5 - k, elF: .3, arB: -.6 - k, elB: .3, lean: -.35 * k, headBack: k }),
  kick: k => ({ thF: lerp(.1, 1.5, k), knF: lerp(1.2, .1, k), arF: -.4, arB: .7, elB: .8, lean: -.18 * k }),
  sit: t => ({ thF: 1.45, knF: -1.45, thB: 1.4, knB: -1.4, arF: .6, elF: .9, arB: .5, elB: 1.0, sitDrop: 70 }),
  carry: t => ({ arF: .2, elF: .1, arB: .05, elB: .1, carry: 1 }),
};
const mixPose = (a, b, k) => { const o = Object.assign({}, a); for (const key in b) { const va = a[key] ?? 0, vb = b[key]; o[key] = typeof vb === 'number' ? va + (vb - va) * k : vb; } return o; };

// ---- draw ----
// o: x,y,s,flip, coat,coat2,pants,boot,cap,capCol,scarf, eyes, mood, look, blink, talk, t (time for idle), pose fields, fall (-1..1), extras: tears,sweat,plaster,vapor,cig,item
function person(ctx, o) {
  const s = o.s || 1, t = o.t || 0, R = RIG;
  ctx.save(); ctx.translate(o.x, o.y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const fall = o.fall || 0;
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(8,12,24,.28)'; ctx.beginPath(); ctx.ellipse(fall * 140 * s * (o.flip ? -1 : 1), 6, 90 * s * (1 + Math.abs(fall) * 1.6), 15 * s, 0, 0, 7); ctx.fill(); }
  if (fall) { ctx.translate(0, -Math.abs(fall) * 34 * s); ctx.rotate(fall * Math.PI / 2 * (o.flip ? -1 : 1)); }
  ctx.scale((o.flip ? -1 : 1) * s, s);
  const sq = o.squash || 0; ctx.scale(1 + sq, 1 - sq);
  const trem = o.tremble ? Math.sin(t * 60) * 2.2 : 0;
  const crouch = (o.crouch || 0) * 40 + (o.sitDrop || 0);
  const lift = (o.lift || 0) + (o.bounce || 0) + (o.jump || 0);
  ctx.translate(trem, -lift + crouch);
  const breathe = o.breathe ? Math.sin(t * 1.7) : 0;
  // legs (back then front)
  const leg = (hx, th, kn, col) => {
    const kx = hx + Math.sin(th) * R.thigh, ky = R.hipY + Math.cos(th) * R.thigh;
    const sa = th - kn; const fx = kx + Math.sin(sa) * R.shin, fy = ky + Math.cos(sa) * R.shin;
    ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(hx, R.hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.max(-.6, Math.min(.6, sa * .4))); ctx.fillStyle = o.boot || '#2b211b';
    ctx.beginPath(); ctx.ellipse(12, -4, 27, 13, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-10, -12, 30, 4); ctx.restore();
  };
  const legCol = o.pants || '#14161c';
  leg(-6, o.thB ?? 0, o.knB ?? 0, shade(legCol === '#14161c' ? '#2a2e38' : legCol, .65));
  // back arm
  const arm = (front, a, e) => {
    const sx = front ? R.shX * .55 : -R.shX * .55, sy = R.shY + (o.shoulder ? -o.shoulder : 0) + breathe * 1.2;
    const ex = sx + Math.sin(a) * R.upper, ey = sy + Math.cos(a) * R.upper;
    const fa = a + e; const hx = ex + Math.sin(fa) * R.fore, hy = ey + Math.cos(fa) * R.fore;
    ctx.strokeStyle = front ? (o.coat || PAL.hero) : (o.coat2 || shade(o.coat || PAL.hero, .7)); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 27;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    if (!o.handsHidden) { ctx.fillStyle = o.mitt || '#16181e'; ctx.beginPath(); ctx.arc(hx + Math.sin(fa) * 6, hy + Math.cos(fa) * 6, (o.fist ? 18 : 16), 0, 7); ctx.fill(); }
    return { hx, hy, fa };
  };
  const hb = arm(false, o.arB ?? .1, o.elB ?? .2);
  if (o.itemB) o.itemB(ctx, hb);
  // torso
  ctx.save(); ctx.translate(0, R.hipY); ctx.rotate(o.lean || 0); ctx.translate(0, -R.hipY);
  ctx.translate(0, R.hipY); ctx.scale(1 - breathe * .008, 1 + breathe * .014); ctx.translate(0, -R.hipY);
  ctx.fillStyle = o.coat || PAL.hero;
  ctx.beginPath(); ctx.moveTo(-50, -294); ctx.quadraticCurveTo(0, -310, 52, -294); ctx.quadraticCurveTo(64, -220, 62, -132); ctx.quadraticCurveTo(0, -118, -60, -132); ctx.quadraticCurveTo(-62, -220, -50, -294); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(4, -292, 4, 160);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.ellipse(-36, -220, 8, 70, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(20, -190, 30, 4); ctx.fillRect(-48, -190, 30, 4);
  if (o.scarf) { ctx.fillStyle = o.scarf; rrect(ctx, -46, -300, 98, 30, 12); ctx.fill(); ctx.fillRect(-30, -280, 22, 70); }
  if (o.collar) { ctx.fillStyle = o.collar; ctx.beginPath(); ctx.ellipse(2, -294, 58, 20, 0, 0, 7); ctx.fill(); }
  // head
  const hl = o.headBack ? -.35 * o.headBack : 0;
  ctx.save(); ctx.translate(4, R.headY + breathe * 1.5); ctx.rotate((o.tilt || 0) + hl + (o.headBob || 0) + Math.sin(t * .9) * .015);
  ctx.fillStyle = '#0f1116'; ctx.beginPath(); ctx.arc(0, 0, R.headR, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.arc(-18, -22, 30, 0, 7); ctx.fill();
  face2(ctx, o, t);
  hat(ctx, o);
  if (o.plaster) { ctx.save(); ctx.translate(30, -30); ctx.rotate(.5); ctx.fillStyle = '#e8d8bf'; ctx.fillRect(-26, -9, 52, 18); ctx.rotate(-1.0); ctx.fillRect(-26, -9, 52, 18); ctx.restore(); }
  ctx.restore();
  ctx.restore();
  // front leg drawn over torso bottom
  leg(8, o.thF ?? 0, o.knF ?? 0, legCol);
  const hf = arm(true, o.arF ?? .1, o.elF ?? .2);
  if (o.item) o.item(ctx, hf);
  ctx.restore();
  // breath vapor (world space, unaffected by flip scale)
  if (o.vapor !== false && !fall) {
    const per = 2.6, ph = ((t + (o.seed || 0)) % per) / per;
    if (ph < .55) { const k = ph / .55; const dir = o.flip ? -1 : 1; ctx.fillStyle = `rgba(230,238,250,${.35 * (1 - k)})`; ctx.beginPath(); ctx.arc(o.x + dir * (60 + k * 90) * s, o.y + (R.headY + 30 - lift - k * 30) * s, (10 + k * 26) * s, 0, 7); ctx.fill(); }
  }
}
function face2(ctx, o, t) {
  const mood = o.mood || 'neutral';
  const col = o.eyes === 'white' ? '#f1f1f1' : o.eyes === 'amber' ? '#ffbf47' : o.eyes === 'red' ? '#ff5a4a' : PAL.cyan;
  const lx = (o.look ?? 0) * 7, ly = (o.lookY ?? 0) * 5;
  // auto blink
  let bl = o.blink ?? 1; const bph = ((t + (o.seed || 0) * 1.7) % 3.7); if (bph < .12) bl = Math.min(bl, Math.abs(bph - .06) / .06);
  const cfg = {
    neutral: { size: 1, lidIn: 0, lidOut: 0, pupil: 8 }, calm: { size: 1, lidIn: 0, lidOut: 0, pupil: 8 },
    angry: { size: .95, lidIn: .6, lidOut: .1, pupil: 7 }, tough: { size: .9, lidIn: .35, lidOut: .35, pupil: 7 },
    sad: { size: 1, lidIn: 0, lidOut: .55, pupil: 8 }, scared: { size: 1.3, lidIn: 0, lidOut: 0, pupil: 4 },
    shock: { size: 1.4, lidIn: 0, lidOut: 0, pupil: 3.5 }, determined: { size: .95, lidIn: .45, lidOut: .2, pupil: 8 },
    smug: { size: .95, lidIn: .2, lidOut: .45, pupil: 7 }, hurt: { size: .9, lidIn: 0, lidOut: .6, pupil: 6, squint: 1 },
    crying: { size: 1, lidIn: 0, lidOut: .6, pupil: 8 }, happy: { size: 1, lidIn: 0, lidOut: 0, pupil: 8, smileEye: 1 }, closed: { closed: 1 }
  }[mood] || { size: 1, lidIn: 0, lidOut: 0, pupil: 8 };
  if (cfg.closed || bl <= .05 || cfg.squint) {
    ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
    [-24, 24].forEach(ex => { ctx.beginPath(); if (cfg.squint) { ctx.moveTo(ex - 13, -8); ctx.lineTo(ex + 13 * Math.sign(-ex), 0); ctx.lineTo(ex - 13 * Math.sign(-ex) * -1, 6); } else { ctx.moveTo(ex - 13, -2); ctx.quadraticCurveTo(ex, 6, ex + 13, -2); } ctx.stroke(); });
  } else {
    [-24, 24].forEach((ex, i) => {
      const side = i === 0 ? -1 : 1; // outer side direction
      ctx.save(); ctx.translate(ex, -4); ctx.scale(1, bl);
      const w = 15 * cfg.size, h = 18 * cfg.size;
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (cfg.smileEye) { ctx.fillStyle = '#0f1116'; ctx.beginPath(); ctx.ellipse(0, 10, w + 3, h * .8, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#0a0c10'; ctx.beginPath(); ctx.arc(lx, 2 + ly, cfg.pupil, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx + 4, -5 + ly, 3.5, 0, 7); ctx.fill();
      // eyelids (angled cuts)
      ctx.fillStyle = '#0f1116';
      const inY = -h - 2 + cfg.lidIn * h * 1.4, outY = -h - 2 + cfg.lidOut * h * 1.4;
      ctx.beginPath(); ctx.moveTo(-side * (w + 4), inY); ctx.lineTo(side * (w + 4), outY); ctx.lineTo(side * (w + 4), -h - 12); ctx.lineTo(-side * (w + 4), -h - 12); ctx.fill();
      ctx.restore();
    });
  }
  // mouth
  ctx.save(); ctx.translate(2, 34);
  ctx.strokeStyle = 'rgba(232,236,245,.85)'; ctx.fillStyle = 'rgba(232,236,245,.9)'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  const talk = o.talk || 0;
  ctx.beginPath();
  if (talk > .05) { ctx.ellipse(0, 0, 12 + talk * 3, 3 + 11 * talk, 0, 0, 7); ctx.fill(); }
  else if (mood === 'scared' || mood === 'shock') { ctx.ellipse(0, 2, 8, 11, 0, 0, 7); ctx.stroke(); }
  else if (mood === 'angry' || mood === 'determined') { rrect(ctx, -14, -5, 28, 11, 4); ctx.fill(); ctx.strokeStyle = '#0f1116'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); for (let x = -7; x <= 7; x += 7) { ctx.moveTo(x, -5); ctx.lineTo(x, 6); } ctx.stroke(); }
  else if (mood === 'sad' || mood === 'hurt' || mood === 'crying') { ctx.moveTo(-13, 6); ctx.quadraticCurveTo(0, -6, 13, 6); ctx.stroke(); }
  else if (mood === 'smug') { ctx.moveTo(-12, 0); ctx.quadraticCurveTo(4, 8, 16, -6); ctx.stroke(); }
  else if (mood === 'happy') { ctx.moveTo(-14, -2); ctx.quadraticCurveTo(0, 14, 14, -2); ctx.stroke(); }
  else if (mood === 'tough') { ctx.moveTo(-11, 2); ctx.lineTo(11, 0); ctx.stroke(); }
  else { ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke(); }
  ctx.restore();
  if (o.cig) { ctx.strokeStyle = '#eee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(14, 36); ctx.lineTo(40, 32); ctx.stroke(); const gl = .6 + .4 * Math.sin(t * 2 + (o.seed || 0)); ctx.fillStyle = `rgba(255,${100 + 60 * gl | 0},40,1)`; ctx.shadowColor = '#ff7a2a'; ctx.shadowBlur = 20 * gl; ctx.beginPath(); ctx.arc(42, 32, 4.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    for (let i = 0; i < 4; i++) { const k = ((t * .5 + i / 4 + (o.seed || 0)) % 1); ctx.fillStyle = `rgba(200,205,215,${.25 * (1 - k)})`; ctx.beginPath(); ctx.arc(44 + Math.sin(k * 6 + i) * 8, 26 - k * 90, 4 + k * 10, 0, 7); ctx.fill(); } }
  if (o.tears || mood === 'crying') { ctx.fillStyle = '#7fd6ff'; [-24, 24].forEach((ex, i) => { const k = ((t * .8 + i * .5) % 1); ctx.beginPath(); ctx.ellipse(ex + 6, 12 + k * 40, 4, 7, 0, 0, 7); ctx.fill(); }); }
  if (o.sweat) { const k = (t * .7) % 1; ctx.fillStyle = '#9fdcff'; ctx.beginPath(); ctx.moveTo(-58, -30 + k * 40); ctx.quadraticCurveTo(-68, -12 + k * 40, -58, -6 + k * 40); ctx.quadraticCurveTo(-48, -12 + k * 40, -58, -30 + k * 40); ctx.fill(); }
  if (o.vein) { ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 5; ctx.save(); ctx.translate(40, -50); [0, 1, 2, 3].forEach(i => { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(4, 4); ctx.quadraticCurveTo(12, 6, 14, 14); ctx.stroke(); }); ctx.restore(); }
}
// convenience: walking person moving from x0 to x1 over [a,b] with gait synced to distance
function walker(t, a, b, x0, x1, stride = 110, run = false) {
  const k = seg(t, a, b), x = lerp(x0, x1, k); const moving = t > a && t < b;
  const dist = Math.abs(x - x0); const ph = dist / stride * Math.PI;
  return { x, moving, gait: moving ? (run ? gaitRun(ph) : gaitWalk(ph)) : {}, flip: x1 < x0 ? 1 : 0 };
}
