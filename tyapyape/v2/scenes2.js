// ===== v2 scenes, anchored to words of the voiceover =====
let NOSNOW = false;
const NW = s => s.toLowerCase().replace(/[«».,!?:;—…]/g, '');
function at(word, n = 1, off = 0) { let c = 0; for (const w of WORDS) if (NW(w.w) === word && ++c === n) return w.s + off; console.warn('no word', word, n); return 0; }
const END = WORDS[WORDS.length - 1].e;
const DUR2 = END + 4.2;
// helpers
const ss = (t, a, d = .35) => seg(t, a, a + d);
const pulse = (t, a, d) => (t > a && t < a + d) ? Math.sin((t - a) / d * Math.PI) : 0;
function impact(ctx, x, y, k, col = PAL.yellow) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 18; i++) { const r = i % 2 ? 50 : 125 + hash(i) * 30; ctx.lineTo(Math.cos(i / 18 * 6.283) * r, Math.sin(i / 18 * 6.283) * r); } ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.fill(); ctx.restore(); }
function snowBurst(ctx, x, y, k, n = 26, spread = 500) { if (k <= 0 || k >= 1) return; for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(255,255,255,${.9 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + (hash(i) - .5) * spread * eout(k), y - hash(i + 1) * 300 * Math.sin(k * 2.8), 8 + hash(i + 3) * 18, 0, 7); ctx.fill(); } }
function card(ctx, x, y, k, w, h, fn, rot = 0) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const s = spring(clamp(k), 2, 6); ctx.scale(s, s); ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(ctx, -w / 2 + 10, -h / 2 + 14, w, h, 22); ctx.fill(); ctx.fillStyle = '#efe9da'; rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fill(); fn(ctx); ctx.restore(); }
function cam2(ctx, t, o) { cam(ctx, t, o); }
function hitsList() { return HITS2; }
let HITS2 = [];
function mkHits() {
  HITS2 = [
    { t: at('чушпан', 1), k: .7, type: 'stamp' }, { t: at('бить', 1, .1), k: .9, type: 'punch' },
    { t: at('получаешь', 1, .25), k: 1.2, type: 'punch' }, { t: at('снег', 1), k: 1.1, type: 'fall' },
    { t: at('бьют', 1, .1), k: 1.0, type: 'punch' }, { t: at('бьют', 2, .1), k: 1.0, type: 'punch' },
    { t: at('пропускаешь', 1, .25), k: 1.1, type: 'punch' }, { t: at('ответ', 1, -.15), k: 1.2, type: 'punch' }, { t: at('ответ', 1, .25), k: .8, type: 'fall' },
    { t: at('пацан', 1, .1), k: .8, type: 'stamp' }, { t: at('своих', 2, .2), k: 1.0, type: 'punch' },
    { t: at('союзе', 1, .1), k: .7, type: 'stamp' }, { t: at('стенку', 1, .15), k: 1.4, type: 'clash' },
    { t: at('пробеги', 1, .05), k: .9, type: 'stamp' }, { t: at('подряд', 1, .1), k: .9, type: 'punch' },
    { t: at('суд', 1, .05), k: 1.2, type: 'gavel' }, { t: at('расстрелу', 1, .2), k: 1.3, type: 'stamp' },
  ];
  HITS.length = 0; HITS2.forEach(h => HITS.push(h));
}

function buildScenes() {
  mkHits();
  const A = { // scene starts
    now: 0, move: at('открываешь', 1, -.6), eve: at('первый', 1, -.3), school: at('утром', 1, -.3), home: at('вечером', 1, -.3), road: at('ходишь', 1, -.5),
    rise: at('и', 1, -.3), init: at('хочешь', 1, -.3), rules: at('у', 1, -.3), lead: at('над', 1, -.3), war: at('район', 4, -.3),
    run: at('потом', 1, -.5), court: at('тысяча', 3, -.3), fin: at('стоишь', 1, -.6), cta: at('про', 2, -.3), end: DUR2,
  };
  // fix 'и тут' anchor: the 'и' before 'тут'
  { let i = WORDS.findIndex(w => NW(w.w) === 'тут'); A.rise = WORDS[i - 1].s - .3; }
  { let i = WORDS.findIndex(w => NW(w.w) === 'пацанов'); A.rules = WORDS[i - 1].s - .3; }
  { let i = WORDS.findIndex(w => NW(w.w) === 'стоишь'); A.fin = WORDS[i - 2].s - .3; }
  { let i = WORDS.findIndex(w => NW(w.w) === 'потом'); A.run = WORDS[i - 1].s - .3; }
  const K = Object.keys(A); const S = [];
  const add = (key, draw) => { const i = K.indexOf(key); S.push({ a: A[key], b: A[K[i + 1]], draw }); };

  // ---------- 0. 2026: phone, coin, flip, time tunnel ----------
  add('now', (ctx, t) => {
    const tShelf = at('полке', 1, -.4), tFlip = at('подбрасываешь', 1, -.1), tTurn = at('переворачивается', 1, -.5), end = A.move;
    const toShelf = eio(seg(t, tShelf, tShelf + 1.0)) * (1 - eio(seg(t, tFlip - .3, tFlip + .3)));
    if (t < tTurn) {
      ctx.save(); cam(ctx, t, { z: lerp(1.2, 1.6, toShelf) * push(t, 10, .05), x: lerp(420, 300, toShelf), y: lerp(1250, 860, toShelf) });
      room2026(ctx, t, { coinOnShelf: t < tFlip - .4 });
      NOSNOW = true;
      const sitUp = eio(seg(t, tFlip - 1.2, tFlip - .5)), toss = pulse(t, tFlip - .35, .5);
      if (sitUp < .5) person(ctx, { x: 640, y: 1405, s: 1.0, t, coat: '#3a3d48', cap: 'none', eyes: 'cyan', mood: 'neutral', seed: 1, vapor: false, shadow: false, fall: -.97, ...POSE.idle(t), arF: 2.5, elF: 1.5, arB: .3, elB: .4, look: t > tShelf ? 1 : -1, lookY: t > tShelf ? -.5 : .5, item: phoneItem(t) });
      else person(ctx, { x: 420, y: 1470, s: 1.0, t, coat: '#3a3d48', cap: 'none', eyes: 'cyan', mood: t > tFlip ? 'shock' : 'happy', seed: 1, vapor: false, shadow: false, ...POSE.sit(t), arF: .9 + toss * 1.6, elF: 1.2 - toss, look: .5, lookY: -1 });
      if (t > tFlip - .3) { const k = seg(t, tFlip - .3, tTurn); coin(ctx, lerp(500, 540, k), lerp(1200, 800, eout(k)), lerp(30, 160, ein(k)), t * 18, '20'); }
      ctx.restore();
      // phone light on face
      sodiumGlow(ctx, 380, 1180, 360, .0);
      if (t < tShelf) { ctx.save(); ctx.globalAlpha = ss(t, .1, .4); pill(ctx, 540, 250, 'СЕЙЧАС', '2026 год', '#c47aff', 1); ctx.restore(); }
      if (t > tShelf + .6 && t < tFlip) { const k = ss(t, tShelf + .6, .4); ctx.save(); ctx.translate(540, 520); ctx.scale(spring(k), spring(k)); coin(ctx, 0, 0, 150, Math.sin(t * 2) * .3, '20'); ctx.restore(); txt(ctx, 'ДЕДОВА МОНЕТА · 1976', 540, 730, { size: 44, col: PAL.yellow, stroke: 10 }); }
      grade(ctx, '#7a40ff', .18); vignette(ctx, .6);
      if (t > tTurn - .25) { ctx.fillStyle = `rgba(255,255,255,${seg(t, tTurn - .25, tTurn)})`; ctx.fillRect(0, 0, W, H); }
    } else {
      const k = seg(t, tTurn, end - .2);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI * eio(seg(t, tTurn, tTurn + 1.2))); ctx.translate(-W / 2, -H / 2); timeTunnel(ctx, t, k); ctx.restore();
      if (t < tTurn + .2) { ctx.fillStyle = `rgba(255,255,255,${1 - seg(t, tTurn, tTurn + .2)})`; ctx.fillRect(0, 0, W, H); }
      if (t > end - .35) { ctx.fillStyle = `rgba(255,255,255,${seg(t, end - .35, end)})`; ctx.fillRect(0, 0, W, H); }
    }
  });

  // ---------- 1. Wake up in 1976: snow, family moving in, factory, locals ----------
  add('move', (ctx, t) => {
    const a = A.move, tSnow = at('снег', 1), tKazan = at('казань', 1), tYear = at('тысяча', 2), t14 = at('четырнадцать', 1), tFam = at('семья', 1, -.2), tFac = at('район', 2, -.2), tKnow = at('пока', 1, -.3);
    const up = eio(seg(t, tKazan - .2, tKazan + .9));
    const toFac = eio(seg(t, tFac, tFac + 1.8)), back = eio(seg(t, tKnow, tKnow + 1.2));
    const truckX = 560;
    ctx.save(); cam(ctx, t, { z: lerp(lerp(1.6, 1.0, eio(seg(t, a, tYear + .5))), .82, toFac) * lerp(1, 1.3, back), x: lerp(lerp(300, 520, eio(seg(t, a, tYear + .5))), 540, toFac), y: lerp(lerp(1640, 1250, eio(seg(t, a, tYear + .5))), 1050, toFac), r: lerp(.05, 0, eio(seg(t, a, tKazan))) });
    sky(ctx, '#1d2638', '#3a4a66', '#6a6f82');
    blurred(ctx, 2, (ctx) => { ctx.save(); ctx.translate(-80, -260); factory(ctx, 140, 1300, t, 'ТЕПЛОКОНТРОЛЬ', 0, PAL.yellow); ctx.restore(); });
    haze(ctx, 1100, 300, 'rgba(150,165,190,', .35);
    building(ctx, -650, 1460, 600, 900, { floors: 9, cols: 5, col: PAL.panel2, seed: 101 });
    building(ctx, 760, 1460, 760, 980, { floors: 9, cols: 6, col: PAL.panel, seed: 102 });
    ground(ctx, 1460); clothesline(ctx, -200, 300, 1260, t);
    garages(ctx, 760, 1560, 3);
    graffiti(ctx, 1000, 1420, 1, ss(t, at('тяп-ляп', 1, -.1), .9), '#e8e8e8');
    for (let i = 0; i < 3; i++) person(ctx, THUG2(i, 860 + i * 110, 1620, .8, { t, flip: 1, ...POSE.pockets(t), mood: back > .3 ? 'smug' : 'tough', cig: i === 1, look: -1 }));
    truck(ctx, truckX, 1700, t + Math.sin(t * 30) * .002, 0, {});
    // mom unloading, waving
    const wave = t > tFam && t < tFam + 2.2;
    person(ctx, MOM(truckX + 330, 1720, 1.05, { t, ...POSE.idle(t), ...(wave ? { arF: 2.7 + Math.sin(t * 9) * .25, elF: .3 } : {}), flip: 1, mood: wave ? 'happy' : 'neutral', talk: wave ? Math.abs(Math.sin(t * 14)) * .7 : 0 }));
    // hero: lying in snow -> gets up -> looks at his 70s clothes -> carries box
    const blink = t < a + .5 ? seg(t, a + .2, a + .5) : 1;
    const carry = t > tFam + 1.0;
    const hw = walker(t, tFam + 1.2, tFam + 3.6, 260, 420);
    const looksSelf = t > tYear && t < t14 + .6;
    person(ctx, HERO2(carry ? hw.x : 260, 1760, 1.05, { t, fall: lerp(.97, 0, up), blink, mood: up < .5 ? 'shock' : looksSelf ? 'shock' : carry ? 'neutral' : 'scared', look: looksSelf ? 0 : Math.sin(t * 2), lookY: looksSelf ? 1 : 0, ...POSE.idle(t), ...(looksSelf ? { arF: 1.2, elF: 1.2, arB: 1.1, elB: 1.3 } : {}), ...(carry ? { ...hw.gait, arF: .95, elF: 1.25, arB: .9, elB: 1.3 } : {}),
      item: carry ? (c, h) => { c.save(); c.translate(h.hx - 10, h.hy - 30); c.fillStyle = '#b08a5a'; c.fillRect(-60, -50, 120, 90); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-60, -10, 120, 6); c.restore(); } : null }));
    if (t < tKazan + .4) snowBurst(ctx, 260, 1740, seg(t, tKazan - .1, tKazan + .8), 20, 380);
    fgLayer(ctx, t, 'fence', 300, 7);
    ctx.restore();
    if (t < a + .4) { ctx.fillStyle = `rgba(255,255,255,${1 - seg(t, a, a + .4)})`; ctx.fillRect(0, 0, W, H); }
    card(ctx, 540, 380, ss(t, tKazan - .1, .4) * (1 - ss(t, tFam, .3)), 520, 230, c => { txt(c, 'КАЗАНЬ', 0, -70, { size: 40, col: '#1d2a44', w: 800 }); txt(c, t < tYear ? '????' : '1976', 0, 30, { size: 130, col: '#c23b3b' }); });
    if (t > t14 - .1 && t < tFac) { const k = ss(t, t14 - .1); ctx.save(); ctx.translate(820, 620); ctx.rotate(.12); ctx.scale(spring(k), spring(k)); rrect(ctx, -120, -50, 240, 100, 50); ctx.fillStyle = PAL.yellow; ctx.fill(); txt(ctx, 'ТЕБЕ 14', 0, 2, { size: 44, col: '#111' }); ctx.restore(); }
    if (t > at('теплоконтроль', 1, -.2) && t < tKnow) { ctx.save(); ctx.globalAlpha = ss(t, at('теплоконтроль', 1, -.2), .4); txt(ctx, 'завод «Теплоконтроль»', 540, 300, { size: 46, w: 800, col: '#fff', stroke: 10 }); ctx.restore(); }
    grade(ctx, '#3a5a90', .25);
  });

  // ---------- 2. First evening: "whose are you?" ----------
  add('eve', (ctx, t) => {
    const a = A.eve, tQ1 = at('чей', 1, -.4), tQ2 = at('какой', 1, -.4), tNone = at('ни', 1, -.2), tCh = at('чушпан', 1), tBeat = at('бить', 1), tNobody = at('никто', 1, -.2);
    const zoomIn = eio(seg(t, tQ1, tQ1 + 1.2)), wide = eio(seg(t, tNobody, tNobody + 1.4));
    ctx.save(); cam(ctx, t, { z: lerp(lerp(1.0, 1.2, zoomIn), .78, wide) * push(t - a, 12, .03), x: lerp(lerp(560, 600, zoomIn), 540, wide), y: lerp(lerp(1220, 1300, zoomIn), 1000, wide) });
    sky(ctx, '#0b0f19', '#19213a', '#2d3550');
    const offAt = tNobody + .4;
    building(ctx, -700, 1560, 2500, 1500, { floors: 11, cols: 16, col: PAL.panel, seed: 3, lit: .55, offAt, t, offSpread: 1.6 });
    ctx.fillStyle = '#2b3140'; ctx.fillRect(600, 1300, 200, 260); ctx.fillStyle = '#6b4b2e'; ctx.fillRect(620, 1320, 160, 240);
    ctx.fillStyle = '#20242f'; ctx.fillRect(570, 1260, 260, 40); const lampOn = .85 + .15 * Math.sin(t * 31) * (hash(Math.floor(t * 5)) > .75 ? 1 : 0);
    ctx.fillStyle = `rgba(255,220,150,${lampOn})`; ctx.shadowColor = '#ffd38a'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(700, 1235, 16, 0, 7); ctx.fill(); ctx.shadowBlur = 0; sodiumGlow(ctx, 700, 1400, 520, .4 * lampOn);
    ground(ctx, 1560); bench(ctx, 280, 1640);
    // trash spill
    const shove = t > tBeat - .2;
    // gang: two on bench, two standing
    const up = eout(seg(t, tQ1 - .6, tQ1));
    person(ctx, THUG2(0, 200, 1650 - up * 0, 1.05, { t, ...(up < .5 ? POSE.sit(t) : POSE.pockets(t)), mood: 'smug', cig: true, talk: pulse(t, tQ1, .7) }));
    person(ctx, THUG2(1, 360, 1660, 1.05, { t, ...(up < .5 ? POSE.sit(t) : POSE.idle(t)), mood: 'tough', talk: pulse(t, tQ2, .9), look: 1 }));
    const pushK = pulse(t, tBeat - .35, .5);
    person(ctx, THUG2(2, lerp(1250, 900, eout(seg(t, tQ2 - .5, tQ2 + .3))), 1690, 1.12, { t, flip: 1, ...POSE.idle(t), ...(pushK > 0 ? { arF: 1.5 * pushK, elF: .2, lean: .2 * pushK } : {}), mood: 'angry', vein: t > tCh }));
    person(ctx, THUG2(3, 80, 1720, 1.1, { t, ...POSE.pockets(t), mood: 'smug' }));
    // hero exits door with bucket
    const hw = walker(t, a + .2, a + 2.4, 700, 600);
    const hurt = seg(t, tBeat - .05, tBeat + .35);
    person(ctx, HERO2(hw.x - hurt * 70, 1700, 1.05, { t, ...POSE.idle(t), ...hw.gait, flip: t < tQ1 - .4 ? 1 : 0, mood: t > tCh ? (t > tBeat ? 'hurt' : 'sad') : t > tQ1 - .5 ? 'scared' : 'neutral', look: t > tQ1 ? -1 : 0, tremble: t > tQ1 && t < tBeat,
      ...(t > tNone - .1 && t < tCh ? POSE.shrug(t) : {}), ...(hurt > 0 ? POSE.hit(hurt) : {}), fall: hurt > .5 ? 0 : 0,
      item: !shove ? (c, h) => bucket(c, h) : null }));
    if (shove) { const k = seg(t, tBeat - .1, tBeat + .5); ctx.save(); ctx.translate(lerp(560, 470, k), lerp(1600, 1690, eout(k))); ctx.rotate(k * 2.2); ctx.fillStyle = '#7b8794'; ctx.beginPath(); ctx.moveTo(-26, -30); ctx.lineTo(26, -30); ctx.lineTo(20, 26); ctx.lineTo(-20, 26); ctx.fill(); ctx.restore(); for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#d9d0b8', '#6a5a40', '#8a8f6a', '#c9c2b0'][i % 4]; ctx.fillRect(470 + (hash(i) - .3) * 260 * k, 1700 + hash(i + 3) * 30, 22, 14); } }
    impact(ctx, 520, 1330, pulse(t, tBeat, .25) * 1.0);
    // passer-by turns away
    if (t > tNobody - .5) { const pw = walker(t, tNobody - .5, tNobody + 3, -200, 400); person(ctx, { x: pw.x, y: 1780, s: 1.1, t, coat: '#5a5048', cap: 'ushanka', capCol: '#3a3028', eyes: 'white', mood: 'sad', look: -1, ...pw.gait, seed: 5, scarf: '#444' }); }
    fgLayer(ctx, t, 'branches', 0, 6);
    ctx.restore();
    bubble(ctx, 'ТЫ ЧЕЙ?', 330, 1080, ss(t, tQ1, .3) * (1 - ss(t, tQ2 - .1, .2)), { size: 66, tail: -60 });
    bubble(ctx, 'С КАКОЙ УЛИЦЫ?', 700, 1060, ss(t, tQ2, .3) * (1 - ss(t, tNone, .2)), { size: 58, tail: 120 });
    if (t > tNone && t < tCh) { const k = ss(t, tNone); ctx.save(); ctx.globalAlpha = k; txt(ctx, '?', 600, 1060, { size: 160, col: PAL.cyan, stroke: 12 }); ctx.restore(); }
    stamp(ctx, 'ЧУШПАН', 540, 520, ss(t, tCh - .05, .3) * (1 - ss(t, tNobody + .2, .3)), { size: 120, rot: -.08 });
    if (t > tNobody) { ctx.save(); ctx.globalAlpha = ss(t, tNobody, .4); txt(ctx, 'НИКТО НЕ ВПИШЕТСЯ', 540, 330, { size: 70, col: '#ffffff', stroke: 12, maxW: 940 }); ctx.restore(); }
    grade(ctx, '#203a70', .3); vignette(ctx, .55);
  });

  // ---------- 3. School: jump ----------
  add('school', (ctx, t) => {
    const a = A.school, tJ = at('попрыгай', 1), tCoin = at('мелочь', 1), tHas = at('значит', 2), t20 = at('двадцать', 2), tR = at('рубль', 1), tNo = at('не', 1, 0), tGet = at('получаешь', 1);
    let noI = WORDS.findIndex(w => NW(w.w) === 'принёс'); const tNoBr = WORDS[noI - 1].s;
    const close = eio(seg(t, tJ - .6, tJ + .3)) * (1 - eio(seg(t, t20 - .3, t20 + .6)));
    ctx.save(); cam(ctx, t, { z: lerp(1, 1.18, close) * push(t - a, 12, .04) * (1 + .15 * eio(seg(t, tNoBr - .3, tGet))), x: lerp(560, 600, close), y: lerp(1150, 1250, close) });
    NOSNOW = true; schoolHall(ctx, t);
    // kids running in background
    for (let i = 0; i < 4; i++) { const ph = ((t * .18 + i * .27) % 1); person(ctx, { x: lerp(-200, 1300, ph), y: 1520, s: .55, t, coat: ['#3a6fb0', '#2d6a4a', '#7a3d48', '#5a5a6a'][i], cap: 'none', eyes: 'white', mood: 'happy', ...gaitRun(ph * 60), shadow: false, vapor: false, seed: i }); }
    const jumping = t > tJ + .2 && t < tHas;
    let jy = 0; if (jumping) { const p = ((t - tJ - .2) / .55) % 1; jy = Math.sin(p * Math.PI) * 120; }
    const hitK = seg(t, tGet + .1, tGet + .45);
    const emptyP = t > tNoBr - .2 && t < tGet + .1;
    person(ctx, HERO2(380 - hitK * 150, 1700, 1.12, { t, cap: 'none', scarf: null, ...POSE.idle(t), mood: hitK > 0 ? 'hurt' : t > tJ - .3 ? 'scared' : 'neutral', sweat: t > tJ, jump: jy, ...(jumping ? (jy > 60 ? POSE.armsUp(t) : { arF: .3, elF: .3, arB: .3, elB: .3, crouch: .3 }) : {}), ...(emptyP ? POSE.shrug(t) : {}), ...(hitK > 0 ? POSE.hit(hitK) : {}), look: .8, squash: jumping && jy < 15 ? .06 : 0, vapor: false }));
    if (emptyP) { ctx.fillStyle = '#e8e8e8'; [-60, 60].forEach(d => { ctx.beginPath(); ctx.ellipse(380 + d, 1540, 22, 14, 0, 0, 7); ctx.fill(); }); }
    const step = eout(seg(t, a + .4, a + 1.4));
    const hand = t > tHas - .2 && t < t20 + 1.5;
    const pk = pulse(t, tGet - .2, .55);
    person(ctx, THUG2(0, lerp(1100, 720, step), 1700, 1.15, { t, flip: 1, ...POSE.pockets(t), ...(hand ? POSE.shake(t) : {}), ...(pk > 0 ? POSE.punch(pk) : {}), mood: 'smug', talk: pulse(t, tJ, .6), vapor: false }));
    person(ctx, THUG2(1, lerp(1250, 900, step), 1650, 1.05, { t, flip: 1, ...POSE.idle(t), mood: 'tough', vapor: false, cig: false, look: -1 }));
    person(ctx, THUG2(5, lerp(1350, 1010, step), 1730, 1.1, { t, flip: 1, ...POSE.pockets(t), mood: 'smug', vapor: false }));
    // coins jumping in pocket / flying
    if (jumping) for (let i = 0; i < 3; i++) { const p = ((t - tJ) / .55 + i * .3) % 1; coin(ctx, 330 + i * 40, 1500 - jy - Math.sin(p * Math.PI) * 40, 18, t * 10 + i, ''); }
    if (t > tHas && t < t20 + .6) for (let i = 0; i < 4; i++) { const k = seg(t, tHas + i * .18, tHas + .8 + i * .18); if (k <= 0 || k >= 1) continue; coin(ctx, lerp(400, 640, k), 1450 - Math.sin(k * Math.PI) * 260, 26, t * 9 + i, '2'); }
    impact(ctx, 420, 1320, pulse(t, tGet + .15, .25) * 1.1);
    ctx.restore();
    bubble(ctx, 'ПОПРЫГАЙ!', 720, 1080, ss(t, tJ - .1, .3) * (1 - ss(t, tCoin + .3, .2)), { size: 72, tail: 60 });
    pill(ctx, 540, 250, 'ДАНЬ', t < t20 ? '0 коп' : t < tR ? '20 коп' : '1 руб', t < tR ? PAL.yellow : '#3ddc84', ss(t, tCoin));
    if (t > t20 && t < tR) { const k = ss(t, t20); ctx.save(); ctx.translate(540, 560); ctx.scale(spring(k, 2, 6), spring(k, 2, 6)); coin(ctx, 0, 0, 130, (t - t20) * 5, '20'); ctx.restore(); }
    if (t > tR && t < tNoBr) { const k = ss(t, tR); ctx.save(); ctx.translate(540, 560); ctx.rotate(-.08); ctx.scale(spring(k, 2, 6), spring(k, 2, 6)); banknote(ctx); ctx.restore(); }
    if (t > tGet + .12 && t < tGet + .2) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 0, W, H); }
    grade(ctx, '#d8b070', .12);
  });

  // ---------- 4. Kitchen with mom ----------
  add('home', (ctx, t) => {
    const a = A.home, tQ = at('синяк', 1, -.3), tFell = at('упал', 1);
    ctx.save(); cam(ctx, t, { z: lerp(1.0, 1.22, eio(seg(t, a, A.road))), x: lerp(560, 470, eio(seg(t, a, A.road))), y: lerp(1150, 1250, eio(seg(t, a, A.road))) });
    NOSNOW = true; kitchen(ctx, t);
    // mom at stove turns
    const turn = t > tQ - .4;
    const mw = walker(t, tQ - .2, tQ + 1.4, 800, 620);
    person(ctx, MOM(mw.x, 1700, 1.15, { t, ...POSE.idle(t), ...mw.gait, flip: turn ? 1 : 0, mood: turn ? 'sad' : 'neutral', talk: pulse(t, tQ - .2, 1.0) + pulse(t, tQ + .9, .6) * .7, look: turn ? -1 : 1, vapor: false, ...(t > tFell + .4 ? { arF: .9, elF: .4 } : {}) }));
    table(ctx, 330, 1520);
    person(ctx, HERO2(260, 1740, 1.05, { t, cap: 'none', scarf: null, ...POSE.sit(t), arF: .9, elF: 1.2, mood: t > tFell ? 'sad' : 'hurt', look: t > tQ ? (t > tFell - .2 ? .2 : -.3) : .4, lookY: t > tFell - .2 ? 1 : 0, plaster: true, vapor: false, tilt: t > tFell ? .12 : 0, talk: pulse(t, tFell, .4) }));
    ctx.restore();
    bubble(ctx, 'ЧТО С ЛИЦОМ?', 700, 820, ss(t, tQ - .1, .3) * (1 - ss(t, tFell - .1, .2)), { size: 58, tail: 60 });
    bubble(ctx, 'Упал.', 330, 980, ss(t, tFell, .3) * (1 - ss(t, A.road - .5, .3)), { size: 56, tail: -20, bg: '#dfe9ff' });
    grade(ctx, '#ff9a40', .18); vignette(ctx, .6, 340);
  });

  // ---------- 5. Another road, found, face in snow ----------
  add('road', (ctx, t) => {
    const a = A.road, tSmall = at('маленький', 1, -.6), tFound = at('находят', 1, -.2), t3 = at('трое', 1), tFace = at('лицом', 1), tSnow = at('снег', 1);
    const scroll = Math.max(0, Math.min(t, tFound) - a) * 150;
    const tight = eio(seg(t, t3 - .3, tSnow));
    ctx.save(); cam(ctx, t, { z: lerp(1.0, 1.2, tight), y: lerp(1150, 1300, tight), x: 540 });
    sky(ctx, '#0d1220', '#20283e', '#3a4058');
    ctx.save(); ctx.translate(-scroll * .25, 0); blurred(ctx, 2, (ctx) => { for (let i = 0; i < 6; i++) building(ctx, -300 + i * 520, 1380, 420, 600 + hash(i) * 300, { floors: 8, cols: 4, col: i % 2 ? PAL.panel : PAL.brick2, seed: 20 + i }); }); ctx.restore();
    haze(ctx, 1380, 260);
    ground(ctx, 1420);
    ctx.save(); ctx.translate(-scroll, 0); garages(ctx, -200, 1500, 12); graffiti(ctx, 900, 1380, 1, 1, '#d8d8d8'); lamp(ctx, 400, 1520, 560); lamp(ctx, 1600, 1520, 560); dog(ctx, 1500, 1560, t, .9); car(ctx, 2300, 1600, '#8a2f2f', .9); ctx.restore();
    ctx.fillStyle = 'rgba(80,95,120,.35)'; for (let i = 0; i < 20; i++) { const fx = 420 - i * 70 + (scroll % 70); ctx.beginPath(); ctx.ellipse(fx, 1745 + (i % 2) * 18, 18, 7, 0, 0, 7); ctx.fill(); }
    // shadows on wall
    if (t > tFound - .3) { const k = ss(t, tFound - .3, .8); ctx.fillStyle = `rgba(0,0,0,${.45 * k})`; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(800 + i * 120 - k * 200, 1150, 50, 70, 0, 0, 7); ctx.fill(); ctx.fillRect(760 + i * 120 - k * 200, 1200, 80, 260); } }
    const walking = t < tFound;
    const fallK = seg(t, tSnow - .1, tSnow + .35);
    const lookBack = (t > a + 1.5 && t < a + 2.6) || (t > tSmall && t < tSmall + .8);
    person(ctx, HERO2(470 + fallK * 80, 1760, 1.12, { t, ...POSE.idle(t), ...(walking ? gaitWalk((t - a) * 5.2) : {}), flip: lookBack ? 1 : 0, mood: t > tFound ? 'scared' : lookBack ? 'scared' : 'sad', tremble: t > tFound && fallK === 0, ...(t > t3 && fallK === 0 ? POSE.cower(t) : {}), fall: fallK > 0 ? .98 * ein(fallK) : 0 }));
    const inR = eout(seg(t, tFound, tFound + .7)), inL = eout(seg(t, t3 - .2, t3 + .5));
    const push = pulse(t, tFace - .1, .5);
    person(ctx, THUG2(3, lerp(1300, 820, inR), 1760, 1.18, { t, flip: 1, ...POSE.pockets(t), ...(inR < 1 && inR > 0 ? gaitWalk(t * 9) : {}), mood: 'angry' }));
    person(ctx, THUG2(0, lerp(-300, 180, inL), 1740, 1.12, { t, ...POSE.idle(t), ...(inL < 1 && inL > 0 ? gaitWalk(t * 9) : {}), ...(push > 0 ? { arF: 1.5 * push + .2, elF: .1, arB: 1.4 * push, elB: .2, lean: .2 } : {}), mood: 'angry', vein: true }));
    person(ctx, THUG2(4, lerp(-450, 20, inL), 1790, 1.2, { t, ...POSE.idle(t), ...(inL < 1 && inL > 0 ? gaitWalk(t * 9) : {}), mood: 'smug', cig: true }));
    snowBurst(ctx, 700, 1740, seg(t, tSnow + .2, tSnow + .9));
    fgLayer(ctx, t, 'fence', scroll * 1.6, 8);
    ctx.restore();
    if (t > t3 && t < tFace + .2) { const k = ss(t, t3); ctx.save(); ctx.translate(540, 400); ctx.scale(spring(k), spring(k)); rrect(ctx, -250, -110, 500, 220, 30); ctx.fillStyle = '#0f1420'; ctx.fill(); txt(ctx, '3 : 1', 0, 4, { size: 150, col: PAL.red }); ctx.restore(); }
    if (t > tSnow + .3) { ctx.fillStyle = `rgba(240,245,255,${seg(t, tSnow + .3, A.rise)})`; ctx.fillRect(0, 0, W, H); }
    grade(ctx, '#203a70', .3); vignette(ctx, .55);
  });

  // ---------- 6. Get up. Fists. Again and again. Elders ----------
  add('rise', (ctx, t) => {
    const a = A.rise, tUseless = at('бесполезно', 1, -.4), tNext = at('следующий', 1, -.5), tFists = at('кулаками', 1, -.2);
    const tB1 = at('бьют', 1), tU1 = at('встаёшь', 1), tB2 = at('бьют', 2), tU2 = at('встаёшь', 2), tOld = at('видят', 1, -.4);
    const day = eio(seg(t, tNext - .3, tNext + .8));
    const up = eio(seg(t, tOld, tOld + 1.2));
    ctx.save(); cam(ctx, t, { z: lerp(lerp(1.5, 1.05, eio(seg(t, tUseless, tNext))), .95, up) * push(t - a, 14, .03), x: lerp(lerp(420, 540, eio(seg(t, tUseless, tNext))), 640, up), y: lerp(lerp(1500, 1180, eio(seg(t, tUseless, tNext))), 1000, up) });
    if (day < 1) { ctx.save(); ctx.globalAlpha = 1; sky(ctx, '#0d1220', '#20283e', '#3a4058'); ctx.restore(); }
    if (day > 0) { ctx.save(); ctx.globalAlpha = day; sky(ctx, '#5a6a8a', '#c49a7a', '#e8c49a'); ctx.restore(); }
    blurred(ctx, 2, (ctx) => { building(ctx, -300, 1250, 700, 900, { floors: 9, cols: 6, col: PAL.panel2, seed: 33, lit: .5 - day * .3 }); building(ctx, 700, 1250, 700, 1000, { floors: 10, cols: 6, col: PAL.panel, seed: 34, lit: .5 - day * .3 }); });
    ground(ctx, 1500); garages(ctx, -100, 1500, 6); graffiti(ctx, 380, 1360, 1, 1, '#e0e0e0');
    // elders on roof
    ctx.save(); ctx.globalAlpha = seg(t, tOld - .3, tOld + .4);
    [[620, 0], [780, 1], [930, 2]].forEach(([ex, i]) => person(ctx, ELDER(i, ex, 1240, .8, { t, flip: 1, ...POSE.sit(t), cig: i !== 1, shadow: false, tilt: i === 1 && t > tOld + 1 ? Math.sin(seg(t, tOld + 1, tOld + 1.8) * Math.PI * 2) * .14 : 0, look: -1 })));
    ctx.restore();
    // hero sequence
    const getUp0 = eio(seg(t, a + .2, a + 2.2));
    const walkK = seg(t, tNext + .2, tFists - .2);
    let hx = lerp(260, 440, eout(walkK));
    const f1 = seg(t, tB1 + .05, tB1 + .4), u1 = eio(seg(t, tU1 - .2, tU1 + .5));
    const f2 = seg(t, tB2 + .05, tB2 + .4), u2 = eio(seg(t, tU2 - .2, tU2 + .5));
    let fall = 0; if (t < tNext) fall = lerp(.98, 0, getUp0) * (getUp0 < 1 ? 1 : 0); else if (f2 > 0) fall = lerp(-.95 * eout(f2), 0, u2); else if (f1 > 0) fall = lerp(-.95 * eout(f1), 0, u1);
    hx -= (f1 > 0 && u1 < 1 ? f1 * (1 - u1) * 90 : 0) + (f2 > 0 && u2 < 1 ? f2 * (1 - u2) * 90 : 0);
    const kneel = t < tNext && getUp0 >= 1;
    const guard = t > tFists - .2 && fall === 0;
    const mood = t < tUseless ? 'sad' : fall < -.3 ? 'hurt' : 'determined';
    person(ctx, HERO2(hx, 1720, 1.15, { t, ...POSE.idle(t), ...(kneel ? { crouch: .6, thF: 1.2, knF: 1.6, thB: -.2, knB: 1.8, arF: t < tUseless ? 2.2 : .6, elF: t < tUseless ? 2.2 : 1.6, lookY: 1 } : {}), ...(walkK > 0 && walkK < 1 ? gaitWalk((t - tNext) * 5.4) : {}), ...(guard ? POSE.guard(t) : {}), fall, mood, plaster: true, sweat: t > tB1, fist: guard }));
    const p1 = pulse(t, tB1 - .25, .5), p2 = pulse(t, tB2 - .25, .5);
    if (t > tNext) { person(ctx, THUG2(1, 740, 1720, 1.2, { t, flip: 1, ...POSE.guard(t), ...(p1 > 0 ? POSE.punch(p1) : p2 > 0 ? POSE.punch(p2) : {}), mood: 'angry', vein: t > tU1 })); person(ctx, THUG2(2, 920, 1700, 1.1, { t, flip: 1, ...POSE.pockets(t), mood: t > tU2 ? 'shock' : 'smug', cig: true })); }
    impact(ctx, hx + 70, 1330, pulse(t, tB1 + .02, .22) + pulse(t, tB2 + .02, .22));
    snowBurst(ctx, hx - 90, 1720, seg(t, tB1 + .3, tB1 + .9), 14, 300); snowBurst(ctx, hx - 90, 1720, seg(t, tB2 + .3, tB2 + .9), 14, 300);
    ctx.restore();
    if (t < a + .5) { ctx.fillStyle = `rgba(240,245,255,${1 - seg(t, a, a + .5)})`; ctx.fillRect(0, 0, W, H); }
    pill(ctx, 540, 250, 'ВСТАЛ', `${t < tU1 ? 1 : t < tU2 ? 2 : 3} раз`, PAL.cyan, ss(t, tFists) * (1 - ss(t, tOld, .3)));
    if (t > tUseless - .2 && t < tNext) { ctx.save(); ctx.globalAlpha = ss(t, tUseless - .2, .4); txt(ctx, 'БЕГАТЬ БЕСПОЛЕЗНО', 540, 360, { size: 74, col: '#fff', stroke: 12, maxW: 940 }); ctx.restore(); }
    if (t > tOld + .5) { ctx.save(); ctx.globalAlpha = ss(t, tOld + .5, .4); txt(ctx, 'СТАРШИЕ', 760, 560, { size: 66, col: '#ffbf47', stroke: 10 }); ctx.restore(); }
    if (day > 0 && day < 1) {} grade(ctx, day > .5 ? '#ffb070' : '#203a70', .22); vignette(ctx, .5);
  });

  // ---------- 7. Initiation ----------
  add('init', (ctx, t) => {
    const a = A.init, tProve = at('докажи', 1), t11 = at('один', 1, -.1), tMiss = at('пропускаешь', 1), tNot = at('не', 2, 0), tBack = at('ответ', 1), tHand = at('жмут', 1, -.3), tNow = at('пацан', 1);
    let ni = WORDS.findIndex(w => NW(w.w) === 'падаешь'); const tNoFall = WORDS[ni - 2].s;
    let bi = WORDS.findIndex(w => NW(w.w) === 'бьёшь'); const tHit = WORDS[bi].s;
    const fight = eio(seg(t, t11, t11 + .8)) * (1 - eio(seg(t, tHand - .3, tHand + .5)));
    const slow = t > tNoFall - .1 && t < tHit;
    ctx.save(); cam(ctx, t, { z: (1 + .22 * fight + (slow ? .12 * seg(t, tNoFall - .1, tHit) : 0)) * push(t - a, 12, .03), x: lerp(540, 560, fight), y: lerp(1120, 1280, fight) });
    sky(ctx, '#0a0e18', '#1c2438', '#343c55');
    blurred(ctx, 2.5, (ctx) => building(ctx, -300, 1150, 1700, 850, { floors: 8, cols: 13, col: PAL.panel2, seed: 44, lit: .35 }));
    ground(ctx, 1300, '#a9b5c6'); lamp(ctx, 960, 1520, 680); sodiumGlow(ctx, 600, 1450, 700, .25);
    // crowd ring (back) reacting
    const cheer = t > tHit && t < tHand + 1;
    for (let i = 0; i < 11; i++) { const cx = -40 + i * 116, cy = 1440 + (i % 2) * 30; person(ctx, THUG2(i, cx, cy, .7, { t, flip: cx > 540 ? 1 : 0, ...POSE.pockets(t), ...(cheer ? POSE.armsUp(t) : (t > tMiss && t < tHit ? { arF: 1.0, elF: 1.8, arB: .9, elB: 1.9 } : {})), mood: cheer ? 'happy' : t > tMiss ? 'shock' : 'tough', jump: cheer ? Math.abs(Math.sin(t * 7 + i)) * 20 : 0, seed: i * 2.1 })); }
    // elder
    const elderTalk = t < t11;
    const shake = t > tHand && t < tNow + .6;
    if (elderTalk || shake || t > tNow) person(ctx, ELDER(0, shake || t > tNow ? 650 : 760, 1730, 1.15, { t, flip: 1, ...POSE.pockets(t), ...(shake ? { arF: 1.3 + Math.sin(t * 16) * .1, elF: .3 } : {}), talk: pulse(t, a + .3, .9) + pulse(t, tProve, .5), cig: !shake, mood: shake || t > tNow ? 'smug' : 'tough' }));
    // opponent
    const oppFall = seg(t, tHit + .1, tHit + .6);
    if (t > t11 - .3 && t < tHand) {
      const pk = pulse(t, tMiss - .1, .5);
      person(ctx, THUG2(3, lerp(1250, 720, eout(seg(t, t11 - .3, t11 + .5))) + oppFall * 120, 1745, 1.25, { t, flip: 1, ...POSE.guard(t), ...(pk > 0 ? POSE.punch(pk) : {}), ...(t < t11 + .5 ? gaitWalk(t * 9) : {}), fall: oppFall > 0 ? .98 * ein(oppFall) : 0, mood: oppFall > 0 ? 'hurt' : 'angry', vein: true }));
    }
    // hero
    const hitBack = pulse(t, tMiss + .1, .45);
    const myPunch = pulse(t, tHit - .25, .5);
    const isP = t > tNow;
    const H0 = isP ? PACAN : HERO2;
    person(ctx, H0(420 - hitBack * 70, 1745, 1.2, { t, ...POSE.idle(t), ...(fight > .3 ? POSE.guard(t) : {}), ...(hitBack > 0 ? POSE.hit(hitBack * .8) : {}), ...(myPunch > 0 ? POSE.punch(myPunch) : {}), ...(shake ? { arF: 1.3 + Math.sin(t * 16) * .1, elF: .3, arB: .1, elB: .2 } : {}), mood: isP ? 'smug' : slow ? 'determined' : fight > .3 ? 'angry' : 'neutral', plaster: !isP, sweat: fight > .3 && !isP, fist: fight > .3, thB: slow ? -.5 : undefined, knB: slow ? .3 : undefined }));
    impact(ctx, 440, 1330, pulse(t, tMiss + .15, .22)); impact(ctx, 700, 1330, pulse(t, tHit + .05, .25));
    if (t > tNow - .05 && t < tNow + .15) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-500, 0, 2100, 2200); }
    ctx.restore();
    if (slow) { ctx.save(); ctx.globalAlpha = .25; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 140); ctx.fillRect(0, H - 140, W, 140); ctx.restore(); }
    bubble(ctx, 'ХОЧЕШЬ ПРИШИТЬСЯ?', 600, 1060, ss(t, a + .2, .3) * (1 - ss(t, tProve - .1, .15)), { size: 56, tail: 100 });
    bubble(ctx, 'ДОКАЖИ.', 700, 1060, ss(t, tProve - .05, .3) * (1 - ss(t, t11, .15)), { size: 76, tail: 40 });
    if (t > t11 && t < tMiss) { const k = ss(t, t11); ctx.save(); ctx.translate(540, 400); ctx.scale(spring(k), spring(k)); rrect(ctx, -270, -100, 540, 200, 30); ctx.fillStyle = '#0f1420'; ctx.fill(); txt(ctx, '1  НА  1', 0, 4, { size: 110, col: PAL.yellow }); ctx.restore(); }
    pill(ctx, 540, 250, 'СТАТУС', isP ? 'ПАЦАН' : 'ЧУШПАН', isP ? '#3ddc84' : PAL.red, ss(t, tHand));
    if (isP) stamp(ctx, 'ПАЦАН', 540, 560, ss(t, tNow, .35), { size: 140, col: '#3ddc84', rot: -.05 });
    grade(ctx, '#203a70', .28); vignette(ctx, .6);
  });

  // ---------- 8. Rules + late = beaten by own ----------
  add('rules', (ctx, t) => {
    const a = A.rules, tEve = at('сборы', 1, -.4), tOwn = at('сдают', 1, -.5), tLate = at('опоздал', 1, -.3), tGet = at('своих', 2, 0);
    const away = eio(seg(t, tLate - .2, tLate + .4));
    ctx.save(); cam(ctx, t, { z: push(t - a, 9, .05), y: 1150 });
    sky(ctx, '#0b0f19', '#1c2438', '#343c55'); blurred(ctx, 2, (ctx) => building(ctx, -200, 1400, 1500, 900, { floors: 9, cols: 11, col: PAL.brick2, seed: 55 })); ground(ctx, 1400); garages(ctx, 500, 1420, 3); lamp(ctx, 300, 1520, 600);
    const kick = pulse(t, tGet - .3, .5);
    const late = seg(t, tLate, tLate + 1.3);
    const hw = walker(t, tLate, tLate + 1.3, -150, 360, 100, true);
    person(ctx, PACAN(hw.x - seg(t, tGet, tGet + .4) * 140, 1720, 1.1, { t, ...POSE.idle(t), ...hw.gait, mood: t > tGet ? 'hurt' : 'scared', sweat: true, fall: t > tGet ? -.55 * eout(seg(t, tGet, tGet + .4)) : 0 }));
    for (let i = 0; i < 5; i++) person(ctx, THUG2(i, 600 + i * 120, 1700 + (i % 2) * 30, 1.0, { t, flip: 1, ...POSE.pockets(t), ...(i === 0 && kick > 0 ? POSE.kick(kick) : {}), mood: t > tLate + .6 ? 'angry' : 'tough', cig: i === 3, look: -1 }));
    impact(ctx, 470, 1500, pulse(t, tGet, .22));
    ctx.restore();
    if (t > tLate) { const k = ss(t, tLate, .3); ctx.save(); ctx.translate(820, 400); ctx.scale(spring(k), spring(k)); ctx.fillStyle = '#efe6d5'; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 8; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(48, -48); ctx.moveTo(0, 0); const an = (t - tLate) * 5; ctx.lineTo(Math.sin(an) * 85, -Math.cos(an) * 85); ctx.stroke(); txt(ctx, 'ОПОЗДАЛ', 0, 160, { size: 46, col: PAL.red, stroke: 8 }); ctx.restore(); }
    if (away < 1) {
      ctx.save(); ctx.translate(540 - away * 1300, 960 + away * 200); ctx.rotate(-.04 - away * .6 + Math.sin(t * .5) * .01);
      const s = lerp(.9, 1, eout(seg(t, a, a + .6))); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(ctx, -440, -620, 900, 1260, 20); ctx.fill();
      ctx.fillStyle = '#efe9da'; rrect(ctx, -460, -640, 900, 1260, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(70,110,170,.35)'; ctx.lineWidth = 3; for (let y = -520; y < 600; y += 70) { ctx.beginPath(); ctx.moveTo(-460, y); ctx.lineTo(440, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(200,60,60,.5)'; ctx.beginPath(); ctx.moveTo(-360, -640); ctx.lineTo(-360, 620); ctx.stroke();
      txt(ctx, 'ЗАКОНЫ ПАЦАНОВ', 0, -540, { size: 66, col: '#1d2a44' });
      [[a + .6, '1. Старших слушать'], [tEve, '2. Сборы — каждый вечер'], [tOwn, '3. Своих не сдавать']].forEach(([at2, s2], i) => { const k = seg(t, at2, at2 + .5); if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(-340, -420 + i * 210, 760 * k, 160); ctx.clip(); txt(ctx, s2, -320, -340 + i * 210, { size: 54, w: 800, col: '#20304f', align: 'left', maxW: 740 }); ctx.restore(); });
      if (t > tOwn + .6) { const k = seg(t, tOwn + .6, tOwn + 1); ctx.strokeStyle = PAL.red; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(40, 80, 400, 90 * k, -.02, 0, 7 * k); ctx.stroke(); }
      ctx.restore();
    }
    grade(ctx, '#203a70', .25); vignette(ctx, .5);
  });

  // ---------- 9. Leaders pyramid ----------
  add('lead', (ctx, t) => {
    const a = A.lead, tN = [at('антип', 1), at('джавда', 1), at('скряба', 1)], tFirst = at('считают', 1, -.3), tUSSR = at('союзе', 1);
    const down = eio(seg(t, tFirst - .3, tFirst + .9));
    ctx.save(); cam(ctx, t, { z: lerp(1.25, .82, down), y: lerp(780, 1130, down) });
    sky(ctx, '#0b0f18', '#1a2234', '#2a3248');
    ctx.save(); ctx.globalAlpha = .12; ctx.translate(540, 700); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6 + t * .002); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1600); ctx.lineTo(90, -1600); ctx.fill(); } ctx.restore();
    const rows = [[3, 1.05, 900], [6, .7, 1270], [9, .52, 1560], [13, .4, 1810], [17, .32, 2020]];
    rows.forEach(([n, s, y], r) => { for (let i = 0; i < n; i++) {
      const x = 540 + (i - (n - 1) / 2) * (r === 0 ? 300 : 980 / n * 1.05);
      if (r === 0) { const k = seg(t, tN[i] - .1, tN[i] + .3); if (k <= 0) continue; ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - eout(k)) * 60);
        person(ctx, ELDER(i, x, y, s, { t, ...POSE.pockets(t), flip: i === 2 ? 1 : 0, cig: i === 0, mood: i === 2 ? 'smug' : 'tough', shadow: false }));
        rrect(ctx, x - 125, y + 20, 250, 70, 14); ctx.fillStyle = '#0f1420'; ctx.fill(); ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 4; ctx.stroke(); txt(ctx, ['АНТИП', 'ДЖАВДА', 'СКРЯБА'][i], x, y + 56, { size: 42, col: PAL.yellow }); ctx.restore(); }
      else { if (t < tFirst - .3 + r * .15) continue; person(ctx, THUG2(i + r, x, y, s, { t, ...POSE.idle(t), shadow: false, vapor: false, seed: i * 3.3 + r })); } } });
    ctx.restore();
    if (t > tFirst) { ctx.save(); ctx.globalAlpha = ss(t, tFirst, .4); txt(ctx, 'старшие → средние → «скорлупа»', 540, 300, { size: 40, w: 700, col: '#dfe5ef', stroke: 8 }); ctx.restore(); }
    if (t > tUSSR) stamp(ctx, 'ПЕРВАЯ ОПГ СССР', 540, 520, ss(t, tUSSR, .35), { size: 82, rot: -.06 });
    if (t > tUSSR + .3) { ctx.save(); ctx.globalAlpha = ss(t, tUSSR + .3, .3); txt(ctx, 'так её называют историки и журналисты', 540, 640, { size: 32, w: 600, col: '#cfd6e4', stroke: 6 }); ctx.restore(); }
    vignette(ctx, .5);
  });

  // ---------- 10. District war ----------
  add('war', (ctx, t) => {
    const a = A.war, tWall = at('стенка', 1), tClash = at('стенку', 1, .1), tAsph = at('асфальт', 1, -.6);
    const panDown = eio(seg(t, tAsph - .2, tAsph + .8));
    ctx.save(); cam(ctx, t, { z: lerp(1, 1.25, panDown), y: lerp(1150, 1600, panDown) });
    sky(ctx, '#121726', '#2a2f45', '#5a4a58');
    blurred(ctx, 2, (ctx) => { building(ctx, -500, 1350, 900, 800, { floors: 9, cols: 7, col: PAL.panel2, seed: 71 }); building(ctx, 680, 1350, 900, 850, { floors: 9, cols: 7, col: PAL.brick2, seed: 72 }); });
    ground(ctx, 1350, '#8c97a8');
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-600, 1750, 2300, 600); ctx.fillStyle = '#e8e8e8'; for (let y = 1760; y < 2300; y += 70) ctx.fillRect(532, y, 16, 40);
    const charge = eio(seg(t, tWall - .2, tClash));
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
      const y = 1560 + r * 70 + (i % 2) * 20, lx = lerp(-200 - i * 70, 380 - i * 60, charge), rx = lerp(1280 + i * 70, 700 + i * 60, charge);
      const fighting = charge > .95;
      const g = charge < 1 && charge > 0 ? gaitRun(t * 9 + i) : {};
      person(ctx, P(THUG2(i + r, lx, y, .8 - r * .08), { t, coat: i % 2 ? '#2b2f3a' : '#33384a', eyes: 'cyan', ...POSE.idle(t), ...g, ...(fighting ? (Math.sin(t * 7 + i) > 0 ? POSE.punch(Math.abs(Math.sin(t * 7 + i))) : POSE.guard(t)) : {}), mood: 'angry', seed: i, vapor: false }));
      person(ctx, THUG2(i + r + 2, rx, y, .8 - r * .08, { t, flip: 1, coat: ['#5a2f2f', '#4b2a2a', '#633838'][i % 3], ...POSE.idle(t), ...g, ...(fighting ? (Math.cos(t * 7 + i) > 0 ? POSE.punch(Math.abs(Math.cos(t * 7 + i))) : POSE.guard(t)) : {}), mood: 'angry', seed: i + 7, vapor: false }));
    }
    if (charge > .95) { const k = seg(t, tClash, tClash + 1.2); for (let i = 0; i < 22; i++) { ctx.fillStyle = `rgba(220,225,235,${.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(540 + (hash(i) - .5) * 600 * eout(k), 1500 - hash(i + 1) * 300 * eout(k), 20 + hash(i + 2) * 40, 0, 7); ctx.fill(); } }
    if (panDown > .5) { txt(ctx, 'НАШЕ', 300, 1830, { size: 80, col: PAL.cyan, stroke: 10 }); txt(ctx, 'ЧУЖОЕ', 790, 1830, { size: 80, col: PAL.red, stroke: 10 }); const fk = seg(t, tAsph + .6, tAsph + 1.4); if (fk > 0) { person(ctx, THUG2(2, lerp(900, 600, fk), 1990, .9, { t, flip: 1, ...gaitWalk(fk * 12), mood: 'angry' })); } }
    ctx.restore();
    pill(ctx, 290, 260, 'РАЙОН', 'ТЯП-ЛЯП', PAL.cyan, ss(t, a + .1)); pill(ctx, 790, 260, 'РАЙОН', 'ЧУЖИЕ', PAL.red, ss(t, at('район', 5, -.1)));
    grade(ctx, '#7a3040', .18); vignette(ctx, .55);
  });

  // ---------- 11. Probegi ----------
  add('run', (ctx, t) => {
    const a = A.run, tP = at('пробеги', 1), tMob = at('толпа', 1, -.2), tAll = at('подряд', 1), tSame = at('таких', 1, -.3), tFear = at('вечером', 2, -.3);
    const city = eio(seg(t, tFear, tFear + 1.2));
    ctx.save(); cam(ctx, t, { z: lerp(1.05, .72, city), y: lerp(1180, 1000, city), x: lerp(540 + (t - a) * 15, 540, city) });
    sky(ctx, '#0e131f', '#222a3f', '#3b445e');
    blurred(ctx, 1.5, (ctx) => { for (let i = 0; i < 5; i++) building(ctx, -900 + i * 620, 1400, 560, 900 + hash(i + 80) * 400, { floors: 10, cols: 6, col: i % 2 ? PAL.panel : PAL.brick2, seed: 80 + i, lit: .6, offAt: tFear + .5, t, offSpread: 2.2 }); });
    haze(ctx, 1400, 250);
    ground(ctx, 1400, '#9aa6b8'); lamp(ctx, 120, 1520, 600); lamp(ctx, 980, 1520, 600); poster(ctx, 700, 1150, 220, 160, 'СЛАВА', 'ТРУДУ!', '#b23030');
    const march = seg(t, tMob, tSame + .2), front = lerp(-500, 1500, march);
    [[300, '#6b5a48', 'ushanka'], [620, '#7a3e3e', 'platok'], [900, '#55624a', 'kepka']].forEach(([px, c, cp], i) => {
      const run = clamp((front - px + 300) / 200), hitp = i === 1 && t > tAll ? seg(t, tAll, tAll + .4) : 0;
      person(ctx, { x: px + run * 900, y: 1660 + i * 10, s: .95, t, coat: c, cap: cp, capCol: i === 1 ? '#c9a24a' : shade(c, .6), eyes: 'white', mood: run > 0 ? 'scared' : 'neutral', ...POSE.idle(t), ...(run > 0 ? gaitRun(t * 14 + i) : gaitWalk(t * 4 + i)), ...(run > 0 ? { arF: 2.4, arB: 2.3, elF: .4, elB: .4 } : {}), fall: hitp > 0 ? .95 * eout(hitp) : 0, seed: i + 30 });
    });
    if (t > tSame) { const k = ss(t, tSame, .6);
      person(ctx, HERO2(560, 1700, 1.0, { t, ...POSE.cower(t), mood: 'scared', look: Math.sin(t * 6), tears: true }));
      for (let i = 0; i < 4; i++) { const an = -2.8 + i * 1.1; person(ctx, THUG2(i, 560 + Math.cos(an) * lerp(600, 230, eout(k)), 1700 + Math.sin(an) * 30, 1.0, { t, flip: Math.cos(an) > 0 ? 1 : 0, ...POSE.idle(t), arF: 2.3 + Math.sin(t * 6 + i) * .2, elF: -.3, mood: 'angry', item: (c, h) => { c.save(); c.translate(h.hx, h.hy); c.rotate(-h.fa + Math.PI); c.fillStyle = '#9aa3ad'; c.fillRect(-6, -10, 12, 150); c.restore(); } })); } }
    if (t < tSame + .2) for (let i = 0; i < 14; i++) { const x = front - (i % 7) * 130 - Math.floor(i / 7) * 60, y = 1640 + Math.floor(i / 7) * 80;
      person(ctx, THUG2(i, x, y, .9 + Math.floor(i / 7) * .08, { t, ...gaitWalk(t * 7 + i), arF: 2.3 + Math.sin(t * 9 + i) * .3, elF: -.3, mood: 'angry', seed: i, item: (c, h) => { c.save(); c.translate(h.hx, h.hy); c.rotate(-h.fa + Math.PI); c.fillStyle = '#9aa3ad'; c.fillRect(-6, -10, 12, 150); c.restore(); } })); }
    ctx.restore();
    if (t > tP) stamp(ctx, 'ПРОБЕГИ', 540, 450, ss(t, tP, .35) * (1 - ss(t, tMob + 1.2, .3)), { size: 140, rot: -.05 });
    if (t > tFear + .8) { const k = ss(t, tFear + .9, .3); ctx.save(); ctx.globalAlpha = k; ctx.translate(540, 520); rrect(ctx, -170, -150, 340, 300, 10); ctx.fillStyle = '#2a2f3a'; ctx.fill(); const dark = t > tFear + 2.3; ctx.fillStyle = dark ? '#151a25' : '#ffd88a'; ctx.fillRect(-150, -130, 300, 260);
      person(ctx, { x: -10, y: 250, s: .7, t, coat: '#5a5048', cap: 'platok', capCol: '#8a6a4a', eyes: 'white', mood: 'scared', shadow: false, vapor: false, look: Math.sin(t * 2) });
      const cl = eio(seg(t, tFear + 1.6, tFear + 2.3)); ctx.fillStyle = '#7a2e2e'; ctx.fillRect(-150, -130, 150 * cl, 260); ctx.fillRect(150 - 150 * cl, -130, 150 * cl, 260); ctx.restore(); }
    grade(ctx, '#203a70', .3); vignette(ctx, .6);
  });

  // ---------- 12. Court ----------
  add('court', (ctx, t) => {
    const a = A.court, tSud = at('суд', 1), tSizo = at('судят', 1, -.2), tBench = at('скамье', 1, -.4), t4 = at('четыре', 1), t15 = at('пятнадцать', 1), t4x = at('четверых', 1, -.1), tShot = at('расстрелу', 1);
    ctx.save(); cam(ctx, t, { z: push(t - a, 14, .06), y: 1100 });
    sky(ctx, '#151922', '#2a2f3c', '#3b404d');
    if (t < tBench) {
      building(ctx, 40, 1450, 1000, 820, { floors: 5, cols: 7, col: '#6f7179', seed: 90, lit: .25 });
      ctx.strokeStyle = '#1b1d22'; ctx.lineWidth = 5; for (let c = 0; c < 7; c++) for (let r = 0; r < 5; r++) { const wx = 40 + (c + .25) * 1000 / 7, wy = 1450 - 820 + (r + .3) * 820 / 5; for (let b = 1; b < 4; b++) { ctx.beginPath(); ctx.moveTo(wx + b * 18, wy); ctx.lineTo(wx + b * 18, wy + 74); ctx.stroke(); } }
      ctx.fillStyle = '#e0e0e0'; ctx.fillRect(330, 560, 420, 60); txt(ctx, 'СИЗО', 540, 592, { size: 44, col: '#222' });
      ctx.strokeStyle = '#999'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = -100; x < 1200; x += 30) ctx.arc(x, 590, 14, 0, Math.PI * 2); ctx.stroke();
      ground(ctx, 1450, '#a7b0bd');
      const mk = seg(t, tSizo + .5, tBench - .3);
      for (let i = 0; i < 5; i++) { const x = lerp(-300, 140, mk) + i * 190; person(ctx, { x, y: 1700, s: .95, t, coat: '#4b5a3a', cap: 'ushanka', capCol: '#3e4a30', eyes: 'white', mood: 'tough', ...POSE.idle(t), ...(mk > 0 && mk < 1 ? gaitWalk((x + 300) / 100 * Math.PI) : {}), arF: .2, elF: 2.5, seed: i + 50, item: (c, h) => { c.save(); c.translate(h.hx, h.hy); c.rotate(-.3); c.fillStyle = '#2a2a2a'; c.fillRect(-5, -120, 10, 200); c.restore(); } }); }
    } else {
      ctx.fillStyle = '#5a4a3c'; ctx.fillRect(-600, 400, 2300, 1100); ground(ctx, 1500, '#7a6a58');
      ctx.fillStyle = '#3e3228'; ctx.fillRect(-100, 1620, 1280, 60);
      const n = Math.round(lerp(0, 28, seg(t, tBench, tBench + 1.6)));
      for (let i = 0; i < Math.min(n, 14); i++) person(ctx, THUG2(i, 20 + i * 76, 1620, .55, { t, mood: 'sad', shadow: false, vapor: false, ...POSE.sit(t), sitDrop: 40, seed: i * 1.9, look: Math.sin(i) }));
      for (let i = 14; i < n; i++) person(ctx, THUG2(i, -10 + (i - 14) * 80, 1720, .6, { t, mood: 'sad', shadow: false, vapor: false, ...POSE.idle(t), seed: i }));
      ctx.strokeStyle = '#20232a'; ctx.lineWidth = 9; for (let x = -100; x < 1200; x += 60) { ctx.beginPath(); ctx.moveTo(x, 900); ctx.lineTo(x, 1800); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-100, 900); ctx.lineTo(1200, 900); ctx.stroke();
      pill(ctx, 540, 640, 'НА СКАМЬЕ', `${n} человек`, PAL.yellow, ss(t, tBench));
    }
    ctx.restore();
    if (t < tSud + 1) { const k = ss(t, a + .1, .3), fl = eio(seg(t, a + .6, a + 1.4)); ctx.save(); ctx.globalAlpha = 1 - ss(t, tSud + .6, .4); ctx.translate(540, 900); ctx.scale(spring(k), spring(k)); rrect(ctx, -260, -300, 520, 600, 24); ctx.fillStyle = '#efe9da'; ctx.fill(); ctx.fillStyle = PAL.red; rrect(ctx, -260, -300, 520, 130, 24); ctx.fill(); txt(ctx, 'ГОД', 0, -236, { size: 56 }); txt(ctx, fl < .5 ? '1979' : '1980', 0, 60, { size: 190, col: '#1d2a44' }); ctx.restore(); }
    if (t > tSud - .35 && t < tSizo + .3) { const k = seg(t, tSud - .35, tSud); const an = lerp(-1.1, .15, ein(k)); ctx.save(); ctx.translate(560, 980); ctx.fillStyle = '#5b3b22'; ctx.fillRect(-160, 120, 320, 50); ctx.translate(140, 60); ctx.rotate(an); ctx.fillStyle = '#6e4628'; ctx.fillRect(-20, -230, 40, 260); rrect(ctx, -90, -300, 180, 90, 20); ctx.fill(); ctx.restore(); if (k >= 1) txt(ctx, 'СУД', 540, 520, { size: 170, col: PAL.white, stroke: 14 }); }
    if (t > tSizo && t < tBench) { ctx.save(); ctx.globalAlpha = ss(t, tSizo, .4); txt(ctx, 'суд прошёл прямо в здании СИЗО', 540, 300, { size: 42, w: 700, col: '#dfe5ef', stroke: 8 }); ctx.restore(); }
    if (t < t4x) [[t4, '4', 'УБИЙСТВА'], [t15, '15', 'ПОКУШЕНИЙ']].forEach(([at2, num, lab], i) => { const k = ss(t, at2); if (k <= 0) return; ctx.save(); ctx.translate(lerp(1400, i ? 760 : 320, eout(k)), 1060); ctx.rotate(i ? .05 : -.05); rrect(ctx, -200, -170, 400, 340, 22); ctx.fillStyle = '#efe9da'; ctx.fill(); txt(ctx, num, 0, -30, { size: 170, col: PAL.red }); txt(ctx, lab, 0, 105, { size: 46, col: '#1d2a44', maxW: 360 }); ctx.restore(); });
    if (t > t4x) {
      ctx.fillStyle = `rgba(10,12,18,${.88 * ss(t, t4x)})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) { const k = ss(t, t4x + i * .25, .3); if (k <= 0) continue; const x = 160 + i * 253; ctx.save(); ctx.globalAlpha = k; ctx.translate(x, 900);
        ctx.fillStyle = '#d6d0c2'; ctx.fillRect(-110, -170, 220, 300); ctx.strokeStyle = '#888'; ctx.lineWidth = 2; for (let y = -150; y < 120; y += 30) { ctx.beginPath(); ctx.moveTo(-110, y); ctx.lineTo(110, y); ctx.stroke(); }
        ctx.save(); ctx.beginPath(); ctx.rect(-110, -170, 220, 300); ctx.clip(); person(ctx, THUG2(i, 0, 300, .78, { t, mood: 'sad', shadow: false, vapor: false, ...POSE.idle(t), seed: i })); ctx.restore();
        txt(ctx, i === 0 ? 'ДЖАВДА' : '№ ' + (i + 1), 0, 170, { size: 36, col: i === 0 ? PAL.yellow : '#cfd6e4' }); ctx.restore(); }
      if (t > tShot) stamp(ctx, 'РАССТРЕЛ', 540, 900, ss(t, tShot, .35), { size: 150, rot: -.1, fill: 'rgba(10,12,18,.4)' });
      if (t > tShot + .4) { ctx.save(); ctx.globalAlpha = ss(t, tShot + .4, .3); txt(ctx, 'двоим позже заменили на 15 лет', 540, 1150, { size: 34, w: 700, col: '#cfd6e4' }); ctx.restore(); }
    }
    vignette(ctx, .55);
  });

  // ---------- 13. Finale ----------
  add('fin', (ctx, t) => {
    const a = A.fin, tPocket = at('кармане', 2, -.3), tNot = at('чушпан', 2, -.4), tHonest = at('только', 1, -.2), tWorth = at('стоило', 1, -.4);
    const close = eio(seg(t, tPocket, tPocket + 1)) * (1 - eio(seg(t, tNot - .2, tNot + .7)));
    const face = eio(seg(t, tHonest, tWorth + .5));
    ctx.save(); cam(ctx, t, { z: lerp(1.0, 2.1, close) * lerp(1, 1.9, face), y: lerp(lerp(1150, 1330, close), 1060, face), x: lerp(lerp(560, 700, close), 560, face) });
    sky(ctx); podezd(ctx, 560, 1560, t, lerp(1, .35, seg(t, tHonest, tWorth + 2))); ground(ctx, 1560); lamp(ctx, 120, 1600, 600, lerp(1, .5, seg(t, tHonest, tWorth + 2)));
    for (let i = 0; i < 3; i++) person(ctx, THUG2(i, 900 + i * 90, 1560, .6, { t, flip: 1, ...POSE.pockets(t), mood: 'tough', cig: i === 0, shadow: false, seed: i + 40, alpha: .6 }));
    const handUp = eio(seg(t, tPocket, tPocket + .6)) * (1 - eio(seg(t, tWorth + .2, tWorth + .6)));
    person(ctx, PACAN(560, 1640, 1.25, { t, ...POSE.pockets(t), ...(handUp > 0 ? { arF: lerp(-.18, 1.2, handUp), elF: lerp(1.2, 1.3, handUp) } : {}), handsHidden: handUp < .2, mood: t > tHonest ? 'sad' : 'tough', look: t > tHonest ? -.4 : 0, lookY: t > tWorth ? .6 : 0 }));
    const flipK = seg(t, tWorth + .3, tWorth + 2);
    if (handUp > .3 || flipK > 0) { const cx = flipK > 0 ? 700 : 690, cy = flipK > 0 ? 1290 - Math.sin(Math.min(flipK, .6) / .6 * Math.PI / 2) * 400 : 1300; coin(ctx, cx, cy, 40, flipK > 0 ? flipK * 30 : 0, '20'); }
    ctx.restore();
    if (t > tNot - .2) { const k = ss(t, tNot - .2) * (1 - ss(t, tHonest - .2, .3)); pill(ctx, 540, 250, 'СТАТУС', 'ПАЦАН', '#3ddc84', k); ctx.save(); ctx.globalAlpha = k; txt(ctx, 'ЧУШПАН', 540, 430, { size: 90, col: '#9aa3b5' }); ctx.strokeStyle = PAL.red; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(360, 450); ctx.lineTo(360 + 360 * seg(t, tNot + .3, tNot + .7), 410); ctx.stroke(); ctx.restore(); }
    if (t > tWorth - .2) { const k = ss(t, tWorth - .2, .4); ctx.save(); ctx.globalAlpha = k; txt(ctx, 'ОНО ТОГО', 540, 420, { size: 120, col: PAL.white, stroke: 14 }); txt(ctx, 'СТОИЛО?', 540, 560, { size: 140, col: PAL.yellow, stroke: 14 }); ctx.restore(); }
    grade(ctx, '#203a70', .25); vignette(ctx, lerp(.5, .85, seg(t, tHonest, A.cta)), 380);
    const back = tWorth + 1.0;
    if (t > back - .3) { ctx.fillStyle = `rgba(255,255,255,${seg(t, back - .3, back)})`; ctx.fillRect(0, 0, W, H); }
    if (t > back) { NOSNOW = true; ctx.save(); cam(ctx, t, { z: 1.25, x: 420, y: 1250 }); room2026(ctx, t, { coinOnShelf: false });
      person(ctx, { x: 420, y: 1470, ...POSE.sit(t), s: 1.0, t, coat: '#3a3d48', cap: 'none', eyes: 'cyan', mood: 'shock', sweat: true, seed: 1, vapor: false, shadow: false, ...POSE.idle(t), arF: 1.3, elF: 1.3, lookY: 1 });
      coin(ctx, 560, 1260, 30, Math.sin(t * 3) * .4, '20'); ctx.restore(); grade(ctx, '#7a40ff', .18);
      ctx.fillStyle = `rgba(255,255,255,${1 - seg(t, back, back + .4)})`; ctx.fillRect(0, 0, W, H);
      pill(ctx, 540, 250, 'СНОВА', '2026 год', '#c47aff', ss(t, back + .3)); }
  });

  // ---------- 14. CTA ----------
  add('cta', (ctx, t) => {
    const a = A.cta;
    ctx.save(); cam(ctx, t, { z: push(t - a, 6, .04), y: 1100 });
    sky(ctx, '#0b0f19', '#19213a', '#2d3550'); blurred(ctx, 3, (ctx) => building(ctx, -500, 1500, 2100, 1300, { floors: 10, cols: 14, col: PAL.panel, seed: 3, lit: .4 })); ground(ctx, 1500); lamp(ctx, 860, 1560, 640);
    person(ctx, PACAN(260, 1700, 1.05, { t, ...POSE.point(t), arF: 1.35 + Math.sin(t * 3) * .05, mood: 'smug' }));
    ctx.restore();
    ctx.fillStyle = 'rgba(8,10,16,.55)'; ctx.fillRect(0, 0, W, H);
    const k = ss(t, a, .5);
    card(ctx, 540, 560, k, 940, 470, c => { txt(c, 'ПРО КАКУЮ', 0, -150, { size: 74, col: '#1d2a44' }); txt(c, 'ГРУППИРОВКУ', 0, -60, { size: 92, col: '#c23b3b' }); txt(c, 'СНЯТЬ СЛЕДУЮЩЕЕ', 0, 30, { size: 64, col: '#1d2a44' }); txt(c, 'ВИДЕО?', 0, 120, { size: 92, col: '#1d2a44' }); }, -.02);
    const chips = ['ХАДИ ТАКТАШ', 'ЖИЛКА', 'ПЕРВАКИ', 'КИРОВСКИЕ', 'ТВОЙ ВАРИАНТ ✍'];
    chips.forEach((c, i) => { const kk = ss(t, a + .6 + i * .18, .35); if (kk <= 0) return; const x = i < 2 ? 300 + i * 480 : i < 4 ? 300 + (i - 2) * 480 : 540, y = 940 + Math.floor(i / 2) * 120; ctx.save(); ctx.translate(x, y); ctx.scale(spring(kk), spring(kk)); ctx.font = '900 44px Inter'; const w = ctx.measureText(c).width + 70; rrect(ctx, -w / 2, -42, w, 84, 42); ctx.fillStyle = i === 4 ? PAL.yellow : '#0f1420'; ctx.fill(); ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 4; ctx.stroke(); txt(ctx, c, 0, 2, { size: 44, col: i === 4 ? '#111' : '#fff' }); ctx.restore(); });
    const ck = ss(t, at('пиши', 1, -.2), .4);
    if (ck > 0) { ctx.save(); ctx.translate(540, 1300 + Math.sin(t * 5) * 12); ctx.scale(spring(ck), spring(ck)); rrect(ctx, -330, -60, 660, 120, 60); ctx.fillStyle = '#ffffff'; ctx.fill(); txt(ctx, '💬  ПИШИ В КОММЕНТАХ  ↓', 0, 4, { size: 46, col: '#111', maxW: 600 }); ctx.restore(); }
  });
  return S;
}
