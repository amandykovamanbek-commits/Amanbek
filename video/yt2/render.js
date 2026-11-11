// ============================================================ timeline cues
let CHX = 540, NODY = 0;
const T = {};
(function buildCues() {
  T.tagIn = .1; T.tagOut = W('s1', 'арман') - .1;
  T.spIn = W('s1', 'арман') - .05; T.sp = [W('s1', 'телефон'), W('s1', 'компьютер'), W('s1', 'пальто')]; T.spOut = S('s1').end;
  T.earnIn = S('s2').start + .05; T.zero = W('s2', 'ноль'); T.lock = W('s2', 'монетизация'); T.earnOut = S('s2').end;
  T.rqIn = S('s3').start + .05; T.rq1 = W('s3', 'тысяча'); T.rq2 = W('s3', 'десять'); T.rqS = W('s4', 'тысяча'); T.yes = W('s4', 'есть'); T.half = W('s4', 'полмиллиона'); T.lack = W('s4', 'хватает'); T.rqOut = S('s4').end;
  T.noteIn = S('s5').start + .05; T.plan = W('s5', 'одно'); T.row = W('s5', 'подряд'); T.noteOut = S('s5').end;
  // montage beats (banner window)
  T.m = { wake: S('s6').start, school: W('s6', 'школа') - .08, brk: W('s6', 'перемене') - .1, shop: W('s6', 'после') - .08, dish: W('s6', 'посуда') - .1, night: W('s6', 'ночью') - .08 };
  T.d = [W('s6', 'третий'), W('s6', 'пятый'), W('s6', 'седьмой')]; T.grow = W('s6', 'просмотры'); T.mil = [W('s6', 'миллион'), W('s6', 'два'), W('s6', 'три')];
  T.B0 = S('s6').start + .02; T.B1 = T.B0 + 15;            // Chik-Chirik VPN banner plays fully in this window (overlaid in ffmpeg)
  T.tiIn = Math.max(W('s7', 'присылает') - .1, T.B1 + .05); T.link = W('s7', 'ссылку'); T.your = W('s7', 'это'); T.tiOut = S('s7').end;
  T.stIn = S('s8').start + .05; T.re = W('s8', 'перезалил'); T.noAuth = W('s8', 'указания'); T.four = W('s8', 'четыре'); T.fourE = W('s8', 'просмотров', 0, 'e'); T.none = W('s8', 'ни'); T.stOut = S('s8').end;
  T.rpIn = S('s9').start + .05; T.rp = [W('s9', 'пишет'), W('s9', 'ответ'), W('s9', 'докажи')]; T.rpOut = S('s9').end;
  T.pollIn = S('s10').start + .05; T.opt = [W('s10', 'а'), W('s10', 'б'), W('s10', 'в'), W('s10', 'г')]; T.endIn = W('s10', 'пиши'); T.pollOut = DURATION + 1;
})();
window.BANNER = [T.B0, T.B1];

const BEATS = [['wake', 'bedMorn'], ['school', 'class'], ['brk', 'hall'], ['shop', 'street'], ['dish', 'kitchenEve'], ['night', 'deskLate']].map(([k, bg]) => [T.m[k], bg, k]);
function bgAt(t, sc) { if (sc.id !== 's6') return sc.bg; let b = BEATS[0][1]; BEATS.forEach(([a, bg]) => { if (t >= a) b = bg; }); return b; }
function beatAt(t) { let b = 'wake'; BEATS.forEach(([a, , k]) => { if (t >= a) b = k; }); return b; }
const CUTS = []; SCENES.forEach((s, i) => { if (i && s.bg !== SCENES[i - 1].bg && s.id !== 's6') CUTS.push(s.start); }); BEATS.forEach(([a], i) => CUTS.push(i ? a : S('s6').start));

const PUNCH = [T.zero, T.lock, T.rq2, T.yes, T.half, T.lack, T.row, ...T.d, ...T.mil, T.your, T.re, T.none, T.rp[2]];

const CARDS = [
  ['tag', T.tagIn, T.tagOut, { top: 250 }],
  ['cSpend', T.spIn, T.spOut, { top: 250 }],
  ['cEarn', T.earnIn, T.earnOut, { top: 260 }],
  ['cReq', T.rqIn, T.rqOut, { top: 225 }],
  ['cNote', T.noteIn, T.noteOut, { top: 280 }],
  ['cTimur', T.tiIn, T.tiOut, { top: 240 }],
  ['cStolen', T.stIn, T.stOut, { top: 200 }],
  ['cReply', T.rpIn, T.rpOut, { top: 250 }],
  ['cPoll', T.pollIn, T.pollOut, { top: 220 }],
];
const CAM = { s1: [.04, 0, 20], s2: [.06, 0, 30], s3: [.02, 0, 0], s4: [.08, 0, 25], s5: [.03, 0, 0], s6: [.05, 0, 30], s7: [.04, 0, 10], s8: [.09, 0, 30], s9: [.05, 0, 15], s10: [0, 0, 0] };

window.getSfx = function () {
  const ev = [];
  CARDS.forEach(([id, a]) => ev.push({ t: a, k: 'pop' }));
  CUTS.forEach(x => ev.push({ t: x - .08, k: 'whoosh' }));
  T.sp.forEach(x => ev.push({ t: x, k: 'coin' }));
  ev.push({ t: T.earnIn + .2, k: 'click' }); ev.push({ t: T.zero, k: 'wah' }); ev.push({ t: T.lock, k: 'error' });
  ev.push({ t: T.rq1, k: 'tick' }); ev.push({ t: T.rq2, k: 'hit' });
  for (let x = T.rqS - .2; x < T.yes; x += .06) ev.push({ t: x, k: 'tick' }); ev.push({ t: T.yes, k: 'success' });
  ev.push({ t: T.half, k: 'send' }); ev.push({ t: T.lack, k: 'stamp' });
  ev.push({ t: T.plan, k: 'send' }); ev.push({ t: T.row, k: 'stamp' }); ev.push({ t: T.row + .1, k: 'success' });
  ev.push({ t: T.m.wake + .1, k: 'beep' }); ev.push({ t: T.m.wake + .35, k: 'beep' }); ev.push({ t: T.m.brk + .3, k: 'click' }); ev.push({ t: T.m.brk + .5, k: 'click' });
  ev.push({ t: T.m.dish + .2, k: 'ding' }); ev.push({ t: T.m.night + .2, k: 'hum' });
  T.d.forEach(x => ev.push({ t: x, k: 'stamp' })); T.mil.forEach(x => { ev.push({ t: x, k: 'coin' }); ev.push({ t: x + .05, k: 'sparkle' }); });
  ev.push({ t: T.tiIn, k: 'buzz' }); ev.push({ t: T.your, k: 'ding' });
  ev.push({ t: T.re, k: 'stamp' }); ev.push({ t: T.re + .05, k: 'hit' });
  for (let x = T.four - .3; x < T.fourE; x += .06) ev.push({ t: x, k: 'tick' }); ev.push({ t: T.noAuth, k: 'error' }); ev.push({ t: T.none, k: 'wah' });
  ev.push({ t: T.rp[0], k: 'send' }); ev.push({ t: T.rp[1] + .2, k: 'ding' }); ev.push({ t: T.rp[2], k: 'hit' });
  T.opt.forEach(x => ev.push({ t: x, k: 'pop' })); ev.push({ t: T.endIn, k: 'success' });
  // music section marks for music.cjs
  [[0, '_A'], [T.zero, '_B'], [S('s3').start, '_C'], [S('s5').start, '_C2'], [S('s6').start, '_D2'], [T.mil[0], '_E'], [S('s7').start, '_B'], [S('s10').start, '_F']].forEach(([t, k]) => ev.push({ t, k }));
  [T.zero, T.re, T.rp[2]].forEach(x => ev.push({ t: x, k: '_dip' }));
  return ev.filter(e => e.t >= 0 && e.t < DURATION);
};
window.DURATION = DURATION;

(function () {
  const r = rng(5); let st = ''; for (let i = 0; i < 30; i++) st += `<div style="position:absolute;left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;width:${3 + r() * 4}px;height:${3 + r() * 4}px;border-radius:50%;background:#fff;opacity:${.3 + r() * .7}"></div>`;
  document.querySelectorAll('.stars2').forEach(e => e.innerHTML = st);
  const cols = ['#FFD43B', '#e5383b', '#4f6bff', '#51cf66', '#ff7a59', '#b79ae0']; let c = '';
  for (let i = 0; i < 60; i++) c += `<i style="background:${cols[i % 6]}"></i>`; $('confetti').innerHTML = c;
  $('mom').style.display = 'none';   // mom is at her second job in this episode
})();
const CONF = [...document.querySelectorAll('#confetti i')], CR = rng(9), CONFP = CONF.map(() => [CR(), CR(), CR(), CR()]);
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const kk = (t, a, d = .3) => clamp((t - a) / d);
const short = v => v >= 995000 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : Math.round(v / 1000) + 'K';

function setT(el, s) { el.setAttribute('transform', s); }
let lastBg = null;
function cardState(t, a, b) {
  const pi = clamp((t - a) / .42), po = clamp((t - b) / .26);
  if (t < a || po >= 1) return null;
  const s = easeOutBack(pi) * (1 - .18 * easeIn(po));
  return { s: Math.max(s, .001), o: clamp((t - a) / .1) * (1 - po), y: (1 - easeOut(pi)) * 110 - 70 * easeIn(po), blur: (1 - easeOut(pi)) * 10 + po * 6, pi };
}
function viewsAt(t) { if (t < T.grow - .2) return 500000; const v = [[T.grow - .2, 5e5], [T.mil[0] + .3, 1e6], [T.mil[1] + .3, 2e6], [T.mil[2] + .3, 3.1e6]];
  for (let i = 1; i < v.length; i++) if (t < v[i][0]) return lerp(v[i - 1][1], v[i][1], easeOut(clamp((t - v[i - 1][0]) / (v[i][0] - v[i - 1][0])))); return 3.1e6; }

window.renderAt = function (t) {
  let si = SCENES.findIndex(s => t >= s.start && t < s.end); if (si < 0) si = t >= DURATION ? SCENES.length - 1 : 0;
  const sc = SCENES[si], id = sc.id, lt = t - sc.start, bgNow = bgAt(t, sc), beat = id === 's6' ? beatAt(t) : null;

  if (lastBg !== bgNow) { for (const k in BG) { $('bg_' + k).style.display = k === bgNow ? '' : 'none'; $('nr_' + k).style.display = k === bgNow ? '' : 'none'; } lastBg = bgNow; }

  let whipX = 0, whipBlur = 0;
  CUTS.forEach(c => { const d = t - c; if (d > -.16 && d < .2) { const k = d < 0 ? (d + .16) / .16 : 1 - d / .2; whipBlur = Math.max(whipBlur, easeInOut(clamp(k)) * 60); whipX += (d < 0 ? -1 : 1) * easeIn(clamp(k)) * (d < 0 ? 260 : 220); } });
  $('whipBlur').setAttribute('stdDeviation', `${whipBlur.toFixed(1)} 0`);

  const prev = SCENES[si - 1], same = prev && prev.bg === sc.bg && id !== 's6', bk = same ? easeInOut(clamp(lt / .7)) : 1;
  const c1 = CAM[id], c0 = same ? CAM[prev.id] : c1;
  const segStart = id === 's6' ? Math.max(...BEATS.map(b => b[0]).filter(a => a <= t), sc.start) : sc.start;
  let zoom = 1.04 + lerp(c0[0], c1[0], bk) + .05 * clamp((t - segStart) / 3) + .01 * noise(t, .5);
  let camX = lerp(c0[1], c1[1], bk) + noise(t, .33) * 22 + Math.sin(si * 1.7) * 14, camY = lerp(c0[2], c1[2], bk) + noise(t, .27, 2) * 14, rot = noise(t, .21, 4) * .8;
  PUNCH.forEach(tp => { const d = decay(t, tp, 5); zoom += .055 * d; rot += 1.3 * d * Math.sin(tp * 7); });
  const shake = decay(t, T.zero, 6) + decay(t, T.re, 5) + decay(t, T.rp[2], 6) + decay(t, T.lack, 6) * .6;
  camX += Math.sin(t * 61) * 7 * shake + whipX; camY += Math.cos(t * 53) * 6 * shake;
  const cx = 540, cy = 1150;
  LAYERS.forEach(({ g, p }) => { const z = 1 + (zoom - 1) * p; setT(g, `translate(${cx + camX * p} ${cy + camY * p}) rotate(${rot * p * .6}) scale(${z}) translate(${-cx} ${-cy})`); });

  const blt = t - segStart;
  if (bgNow === 'street') { $('streetMid').setAttribute('transform', `translate(${-blt * 170 - 200} 0)`); $('streetNear').setAttribute('transform', `translate(${-(blt * 330) % 1260} 0)`); $('clouds').setAttribute('transform', `translate(${-blt * 20} 0)`); }
  if (bgNow === 'kitchenEve') $('steamE').setAttribute('transform', `translate(${Math.sin(t * 2) * 6} ${-((t * 20) % 20)})`);
  document.querySelectorAll('#fairy circle').forEach((c, i) => c.setAttribute('opacity', .55 + .45 * Math.sin(t * 3 + i * 1.3)));

  // character
  let mood = 'neutral', pose = 'idle', glow = 0, shakeHands = 0, buzz = 0; CHX = 540; NODY = 0;
  if (id === 's1') { mood = t < T.spIn ? 'happy' : 'dream'; pose = t < T.spIn + .3 ? 'phone' : 'idle'; }
  if (id === 's2') { pose = 'phone'; glow = .2; mood = t < T.zero ? 'happy' : t < T.lock ? 'shock' : 'sad'; }
  if (id === 's3') { pose = 'phone'; glow = .2; mood = t < T.rq2 ? 'focus' : 'nervous'; }
  if (id === 's4') { mood = t < T.yes ? 'focus' : t < T.half ? 'happy' : t < T.lack ? 'nervous' : 'shock'; if (t >= T.yes && t < T.half) pose = 'cheer'; }
  if (id === 's5') { mood = t < T.row ? 'focus' : 'happy'; }
  if (id === 's6') {
    if (beat === 'wake') { mood = 'tired'; }
    if (beat === 'school') { mood = 'focus'; }
    if (beat === 'brk') { pose = 'phone'; glow = .2; mood = 'focus'; }
    if (beat === 'shop') { pose = 'walk'; mood = 'neutral'; }
    if (beat === 'dish') { mood = 'tired'; }
    if (beat === 'night') { glow = .4; mood = t < T.d[0] ? 'focus' : t < T.grow ? 'tired' : t < T.mil[2] ? 'happy' : 'happy'; if (t >= T.mil[2]) pose = 'cheer'; }
  }
  if (id === 's7') { pose = 'phone'; glow = .25; mood = t < T.your ? 'tired' : 'shock'; buzz = clamp(1 - Math.abs(t - T.tiIn - .3) / .6); }
  if (id === 's8') { mood = t < T.re ? 'shock' : t < T.none ? 'nervous' : 'sad'; }
  if (id === 's9') { pose = 'phone'; glow = .25; mood = t < T.rp[2] ? 'focus' : 'shock'; buzz = clamp(1 - Math.abs(t - T.rp[1] - .3) / .5); shakeHands = t >= T.rp[2] ? 1 : 0; }
  if (id === 's10') { mood = t < T.opt[0] ? 'focus' : t < T.endIn ? ['focus', 'happy', 'neutral', 'nervous'][T.opt.filter(x => t >= x).length - 1] : 'happy'; }
  applyChar(t, MOODS[mood], pose, glow, shakeHands, buzz, sc);

  CARDS.forEach(([cid, a, b, o]) => {
    const el = $(cid), st = cardState(t, a, b);
    if (!st) { el.style.opacity = 0; return; }
    let extraR = Math.sin(t * 1.3 + a) * .7, extraY = Math.sin(t * 1.7 + a) * 5;
    if (cid === 'cNote') extraR += -4 + Math.sin(t * 2.2) * 1.5;
    if (cid === 'cEarn') extraR += Math.sin(t * 45) * 2.5 * decay(t, T.zero, 5);
    el.style.opacity = st.o;
    el.style.transform = `translate(-50%, ${o.top + st.y + extraY}px) scale(${st.s}) rotate(${extraR}deg)`;
    el.style.filter = st.blur > .3 ? `blur(${st.blur.toFixed(1)}px)` : 'none';
  });
  document.querySelectorAll('#cSpend .sp').forEach((r, i) => { const k = kk(t, T.sp[i] - .05, .3); r.style.opacity = k; r.style.transform = `translateX(${(1 - easeOutBack(k)) * -60}px)`; });
  { const k = kk(t, T.lock, .3); $('earnLock').style.opacity = k; $('earnLock').style.transform = `scale(${lerp(1.4, 1, easeOut(k))})`; $('earnN').style.color = t >= T.zero ? '#e5383b' : '#16171d'; $('earnN').style.transform = `scale(${1 + .25 * decay(t, T.zero, 5)})`; }
  { const sK = easeOut(kk(t, T.rqS - .2, Math.max(.3, T.yes - T.rqS + .2))); $('rqS').textContent = fmt(sK * 1204); $('rqSb').style.width = (Math.min(1, sK * 1.204) * 100) + '%'; $('rqSok').style.opacity = kk(t, T.yes, .2);
    const vK = easeOut(kk(t, T.half - .1, .6)); $('rqV').textContent = fmt(vK * 500000); $('rqVb').style.width = (vK * 5) + '%';
    const l = kk(t, T.lack, .25); $('rqLack').style.opacity = l; $('rqLack').style.transform = `scale(${lerp(1.5, 1, easeOut(l))}) rotate(${Math.sin(t * 40) * 2 * decay(t, T.lack, 4)}deg)`; }
  { const s = kk(t, T.row, .22); $('noteStamp').style.opacity = s; $('noteStamp').style.transform = `rotate(${lerp(-22, -8, easeOut(s))}deg) scale(${lerp(2.4, 1, easeOut(s))})`; }
  document.querySelectorAll('#cTimur .tm').forEach((e, i) => { const k = kk(t, [T.link, T.your][i] - .05, .3); e.style.opacity = k; e.style.transform = `translateY(${(1 - easeOut(k)) * 30}px)`; });
  { $('stN').textContent = fmt(easeOut(kk(t, T.four - .3, Math.max(.4, T.fourE - T.four + .3))) * 4e6); $('stNo').style.opacity = kk(t, T.noAuth, .25); $('stMe').style.opacity = kk(t, T.none, .25);
    const s = kk(t, T.re, .22); $('stStamp').style.opacity = s; $('stStamp').style.transform = `rotate(${lerp(-22, -9, easeOut(s))}deg) scale(${lerp(2.4, 1, easeOut(s))})`; }
  document.querySelectorAll('#cReply .rp').forEach((e, i) => { const a = [T.rp[0], T.rp[0] + .6, T.rp[2]][i]; const k = kk(t, a - .05, .3); e.style.opacity = k; e.style.transform = `translateY(${(1 - easeOut(k)) * 30}px) scale(${i === 2 ? 1 + .15 * decay(t, a, 5) : 1})`; });
  document.querySelectorAll('#cPoll .opt').forEach((o, i) => { const k = kk(t, T.opt[i] - .05, .3); const on = t >= T.opt[i] && (i === 3 ? t < T.endIn : t < T.opt[i + 1]); o.style.opacity = k; o.style.transform = `translateX(${(1 - easeOutBack(k)) * -80}px) scale(${on ? 1.04 : 1})`; o.style.background = on ? '#fff3bf' : '#f2f4f8'; });
  { const k = kk(t, T.endIn, .4); $('cEnd').style.opacity = k; $('cEnd').style.transform = `translateY(${(1 - easeOutBack(k)) * 60}px)`; }
  { const d = t - (T.mil[2] + .25); CONF.forEach((c, i) => { if (d < 0 || d > 2.6) { c.style.opacity = 0; return; } const [a, b, e, f] = CONFP[i]; const ang = -Math.PI / 2 + (a - .5) * 2.2, v = 900 + b * 1200;
      c.style.opacity = clamp(2.6 - d); c.style.transform = `translate(${540 + Math.cos(ang) * v * d * .8}px, ${900 + Math.sin(ang) * v * d + 1100 * d * d}px) rotate(${d * 500 * (e - .5) + i * 30}deg) scale(${.7 + f})`; }); }

  // big fx text (middle band, below the banner during the montage)
  const fx = $('fxText'); let fxs = null;
  const fxDef = [
    [T.zero, T.lock, '$0', 200, '#ff6b6b', 720],
    [T.m.wake + .1, T.m.school, '07:00', 130, '#fff', 640],
    [T.m.brk + .25, T.m.shop, '📝 СЦЕНАРИЙ', 92, '#FFD43B', 640],
    [T.m.dish + .1, T.m.night, '🍽 ПОСУДА', 92, '#fff', 640],
    [T.d[0], T.d[1], 'ДЕНЬ 3', 130, '#fff', 640], [T.d[1], T.d[2], 'ДЕНЬ 5', 130, '#fff', 640], [T.d[2], T.grow, 'ДЕНЬ 7', 130, '#FFD43B', 640],
    [T.mil[0], T.mil[1], '1 000 000', 120, '#51cf66', 640], [T.mil[1], T.mil[2], '2 000 000', 120, '#51cf66', 640], [T.mil[2], S('s6').end, '3 000 000', 130, '#FFD43B', 640],
    [T.none, T.stOut, '0 ₽ АРМАНУ', 110, '#ff6b6b', 980],
  ];
  for (const [a, b, txt, size, col, top] of fxDef) { const st = cardState(t, a, b); if (st) fxs = { st, txt, size, col, top }; }
  if (fxs) { fx.textContent = fxs.txt; fx.style.fontSize = fxs.size + 'px'; fx.style.color = fxs.col; fx.style.top = fxs.top + 'px'; fx.style.opacity = fxs.st.o; fx.style.transform = `translateY(${fxs.st.y}px) scale(${fxs.st.s}) rotate(${Math.sin(t * 9) * 3}deg)`; }
  else fx.style.opacity = 0;
  $('dark').style.opacity = id === 's8' ? .7 * easeInOut(kk(t, T.none - .1, .5)) : 0;

  // HUD
  const times = [['s1', 'ПН 09:40'], ['s2', 'ПН 10:25'], ['s5', 'ПН 21:00'], ['s7', 'ДЕНЬ 8 · 23:10']];
  let tm = 'ПН 09:40'; times.forEach(([sid, v]) => { if (t >= S(sid).start) tm = v; });
  if (id === 's6') { tm = { wake: 'ДЕНЬ 1 · 07:00', school: 'ДЕНЬ 1 · 09:00', brk: 'ДЕНЬ 1 · 11:20', shop: 'ДЕНЬ 1 · 15:30', dish: 'ДЕНЬ 1 · 19:40', night: 'ДЕНЬ 1 · 23:40' }[beat];
    if (t >= T.d[0]) tm = 'ДЕНЬ 3 · 23:50'; if (t >= T.d[1]) tm = 'ДЕНЬ 5 · 00:10'; if (t >= T.d[2]) tm = 'ДЕНЬ 7 · 00:30'; }
  $('hTime').textContent = tm; $('hTime').style.fontSize = tm.length > 9 ? '34px' : '40px';
  const views = viewsAt(t), subs = t < T.grow ? 1204 : lerp(1204, 4380, easeOut(kk(t, T.grow, T.mil[2] + .3 - T.grow)));
  $('hCli').textContent = short(views); $('hBal').textContent = fmt(subs);
  $('hCli').style.color = t >= T.grow ? '#16a34a' : '#16171d'; $('hBal').style.color = t >= T.grow ? '#16a34a' : '#16171d';
  $('hCli').style.transform = `scale(${1 + .3 * Math.max(...T.mil.map(x => decay(t, x + .3, 3)))})`; $('hCli').style.transformOrigin = '0 50%';

  // subtitles
  const ch = CHUNKS.find(c => t >= c.s && t < c.e), subsEl = $('subs');
  if (!ch || t > VO_END + .5) { subsEl.innerHTML = ''; subsEl._c = null; }
  else {
    if (subsEl._c !== ch) { subsEl.innerHTML = ch.map(tk => `<span>${tk.w.replace(/[«»]/g, '')}</span>`).join(' '); subsEl._c = ch; subsEl.style.fontSize = ch.reduce((n, x) => n + x.w.length + 1, 0) > 18 ? '64px' : '78px'; }
    const sp = subsEl.children, k = clamp((t - ch.s) / .16);
    subsEl.style.transform = `translateY(${(1 - easeOut(k)) * 26}px) scale(${.9 + .1 * easeOutBack(k)})`; subsEl.style.opacity = clamp((t - ch.s) / .08);
    ch.forEach((tk, i) => { const on = t >= tk.s - .03 && (i === ch.length - 1 || t < ch[i + 1].s - .03); sp[i].className = on ? 'on' : ''; const q = on ? clamp((t - tk.s + .03) / .12) : 0; sp[i].style.transform = `scale(${1 + .1 * Math.sin(Math.PI * q) + (on ? .04 : 0)})`; });
  }

  $('flash').style.opacity = .5 * Math.max(decay(t, T.row, 9), decay(t, T.mil[2] + .25, 7), decay(t, T.re, 9));
  const fadeOut = clamp((t - (DURATION - .35)) / .35);
  $('stage').style.filter = fadeOut > 0 ? `brightness(${1 - fadeOut})` : 'none';
};

