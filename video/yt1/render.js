// ============================================================ timeline cues
let CHX = 540, NODY = 0;
const T = {};
(function buildCues() {
  T.tagIn = .1; T.tagOut = W('s1', 'каждый') - .1;
  T.feedIn = W('s1', 'каждый') - .05; T.feedHit = W('s1', 'школьник'); T.usd = W('s1', 'десять'); T.feedOut = W('s2', 'говорит');
  T.noteIn = W('s2', 'начну') - .15; T.school = S('s3').start; T.test = S('s4').start; T.noteOut = W('s4', 'так') - .1;
  T.calIn = W('s4', 'так') - .05; T.cal3 = W('s4', 'три'); T.calOut = S('s4').end;
  T.momIn = W('s5', 'мама') - .1; T.m = [W('s5', 'сынок'), W('s5', 'я'), W('s5', 'следи')]; T.momOut = S('s5').end;
  T.nod = W('s6', 'кивает'); T.shame = W('s6', 'стыдно'); T.guiltIn = W('s6', 'мама') - .1; T.g2 = W('s6', 'он'); T.guiltOut = S('s6').end;
  T.bootIn = W('s7', 'старый') - .1; T.bootOut = W('s7', 'никаких') - .12;
  T.nowIn = W('s7', 'никаких') - .05; T.strike = W('s7', 'завтра'); T.now = W('s7', 'прямо'); T.nowOut = S('s7').end;
  T.upIn = S('s8').start + .05; T.z1 = W('s8', 'ноль'); T.v2 = W('s8', 'второе'); T.z2 = W('s8', 'ноль', 1); T.upOut = S('s8').end;
  T.srIn = S('s9').start + .05; T.three = W('s9', 'три'); T.srOut = S('s9').end;
  T.e1In = S('s10').start + .03; T.e1a = W('s10', 'русский'); T.e1b = W('s10', 'регион'); T.e1Out = S('s10').end;
  T.e2In = S('s11').start + .03; T.e2a = W('s11', 'секунды'); T.e2b = W('s11', 'листает'); T.e2Out = S('s11').end;
  T.e3In = S('s12').start + .03; T.e3a = W('s12', 'подряд'); T.e3b = W('s12', 'ниши'); T.e3Out = S('s12').end;
  T.fixIn = S('s13').start + .03; T.niIn = W('s13', 'нишу') - .1; T.space = W('s13', 'странные'); T.upl = W('s13', 'заливает'); T.pub = W('s13', 'видео', 0, 'e') - .1; T.niOut = S('s13').end;
  T.buzz = W('s14', 'телефон'); T.vwIn = W('s14', 'пятьсот') - .2; T.k500 = W('s14', 'просмотров'); T.night = W('s14', 'ночь'); T.vwOut = S('s14').end;
  T.pollIn = S('s15').start + .05; T.opt = [W('s15', 'а'), W('s15', 'б'), W('s15', 'в'), W('s15', 'г')]; T.endIn = W('s15', 'пиши'); T.pollOut = DURATION + 1;
})();

const PUNCH = [T.feedHit, T.usd, T.noteIn, T.cal3, T.m[0], T.m[1], T.shame, T.strike, T.now, T.z1, T.z2, T.three, T.e1a, T.e2a, T.e3a, T.space, T.pub, T.k500, T.night];

const CARDS = [
  ['tag', T.tagIn, T.tagOut, { top: 250 }],
  ['cFeed', T.feedIn, T.feedOut, { top: 215 }],
  ['cNote', T.noteIn, T.noteOut, { top: 300 }],
  ['cCal', T.calIn, T.calOut, { top: 235 }],
  ['cMom', T.momIn, T.momOut, { top: 230 }],
  ['cGuilt', T.guiltIn, T.guiltOut, { top: 270 }],
  ['cBoot', T.bootIn, T.bootOut, { top: 280 }],
  ['cNote', T.nowIn, T.nowOut, { top: 300 }],
  ['cUp', T.upIn, T.upOut, { top: 250 }],
  ['cSearch', T.srIn, T.srOut, { top: 270 }],
  ['cErr1', T.e1In, T.e1Out, { top: 250 }],
  ['cErr2', T.e2In, T.e2Out, { top: 215 }],
  ['cErr3', T.e3In, T.e3Out, { top: 250 }],
  ['cFix', T.fixIn, T.niOut, { top: 200 }],
  ['cNiche', T.niIn, T.niOut, { top: 455 }],
  ['cViews', T.vwIn, T.vwOut, { top: 225 }],
  ['cPoll', T.pollIn, T.pollOut, { top: 220 }],
];
// per-scene camera framing: extra zoom, x, y (blended between scenes)
const CAM = { s1: [0, 0, 0], s2: [.09, 0, 30], s3: [0, 0, 0], s4: [.03, 0, 0], s5: [-.02, 90, 0], s6: [.13, -170, 20], s7: [0, 0, 0], s8: [.1, 0, 30], s9: [.03, 30, 0],
  s10: [.08, -20, 20], s11: [.04, 25, 0], s12: [.09, -10, 25], s13: [.02, 0, -10], s14: [.07, 0, 20], s15: [0, 0, 0] };

window.getSfx = function () {
  const ev = [];
  CARDS.forEach(([id, a]) => ev.push({ t: a, k: 'pop' }));
  SCENES.forEach((sc, i) => { if (i && sc.bg !== SCENES[i - 1].bg) ev.push({ t: sc.start - .08, k: 'whoosh' }); });
  for (let i = 0; i < 3; i++) ev.push({ t: T.feedIn + .45 + i * .5, k: 'send' });
  ev.push({ t: T.usd, k: 'coin' }); ev.push({ t: T.noteIn + .1, k: 'stamp' });
  for (let x = T.calIn + .1; x < T.cal3; x += .07) ev.push({ t: x, k: 'tick' }); ev.push({ t: T.cal3, k: 'stamp' });
  ev.push({ t: T.m[0], k: 'wah' }); ev.push({ t: T.m[1], k: 'pop' }); ev.push({ t: T.m[2], k: 'pop' });
  ev.push({ t: T.shame, k: 'hit' }); ev.push({ t: T.g2, k: 'send' });
  ev.push({ t: T.bootIn, k: 'hum' }); ev.push({ t: T.bootIn + .1, k: 'beep' });
  ev.push({ t: T.strike, k: 'send' }); ev.push({ t: T.now, k: 'stamp' }); ev.push({ t: T.now + .1, k: 'success' });
  ev.push({ t: T.upIn + .2, k: 'send' }); ev.push({ t: T.z1, k: 'error' }); ev.push({ t: T.v2, k: 'send' }); ev.push({ t: T.z2, k: 'wah' });
  for (let x = T.srIn + .15; x < T.srIn + 1.3; x += .09) ev.push({ t: x, k: 'click' }); ev.push({ t: T.three, k: 'hit' });
  [T.e1a, T.e1b, T.e2a, T.e3a].forEach(x => ev.push({ t: x, k: 'error' })); ev.push({ t: T.e2b, k: 'send' }); ev.push({ t: T.e3b, k: 'wah' });
  for (let i = 0; i < 3; i++) ev.push({ t: T.fixIn + .1 + i * .22, k: 'ding' });
  ev.push({ t: T.space, k: 'sparkle' }); ev.push({ t: T.upl, k: 'send' }); for (let x = T.upl + .1; x < T.pub; x += .08) ev.push({ t: x, k: 'tick' }); ev.push({ t: T.pub, k: 'stamp' }); ev.push({ t: T.pub + .1, k: 'success' });
  for (let i = 0; i < 4; i++) ev.push({ t: T.buzz + i * .32, k: 'buzz' });
  for (let x = T.vwIn + .1; x < T.k500 + .2; x += .06) ev.push({ t: x, k: 'tick' });
  ev.push({ t: T.k500 + .25, k: 'coin' }); ev.push({ t: T.k500 + .3, k: 'success' }); ev.push({ t: T.night, k: 'sparkle' }); ev.push({ t: T.night + .1, k: 'ding' });
  T.opt.forEach(x => ev.push({ t: x, k: 'pop' })); ev.push({ t: T.endIn, k: 'success' });
  // music section marks (consumed by yt1/music.cjs, ignored by sfx)
  ev.push({ t: 0, k: '_A' }); ev.push({ t: S('s3').start, k: '_A2' }); ev.push({ t: S('s5').start, k: '_B' }); ev.push({ t: S('s7').start, k: '_C' }); ev.push({ t: T.now, k: '_C2' });
  ev.push({ t: S('s9').start, k: '_D' }); ev.push({ t: S('s13').start, k: '_D2' }); ev.push({ t: S('s14').start, k: '_E0' }); ev.push({ t: T.k500, k: '_E' }); ev.push({ t: S('s15').start, k: '_F' });
  ev.push({ t: T.z1, k: '_dip' }); ev.push({ t: T.z2, k: '_dip' }); ev.push({ t: T.shame, k: '_dip' });
  return ev.filter(e => e.t >= 0 && e.t < DURATION);
};
window.DURATION = DURATION;

// dynamic bits
(function () {
  let s = ''; for (let i = 0; i < 90; i++) s += '<div class="cd" style="height:38px;border-radius:8px;background:#eef0f4;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:#e5383b;opacity:0"></div></div>';
  $('calGrid').innerHTML = s;
  const r = rng(5); let st = ''; for (let i = 0; i < 40; i++) st += `<div style="position:absolute;left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;width:${3 + r() * 5}px;height:${3 + r() * 5}px;border-radius:50%;background:#fff;opacity:${.3 + r() * .7}"></div>`;
  $('stars').innerHTML = st;
  const cols = ['#FFD43B', '#e5383b', '#4f6bff', '#51cf66', '#ff7a59', '#b79ae0']; let c = '';
  for (let i = 0; i < 70; i++) c += `<i style="background:${cols[i % 6]}"></i>`; $('confetti').innerHTML = c;
})();
const CAL = [...document.querySelectorAll('#calGrid .cd div')], CONF = [...document.querySelectorAll('#confetti i')], CR = rng(9), CONFP = CONF.map(() => [CR(), CR(), CR(), CR()]);
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const kk = (t, a, d = .3) => clamp((t - a) / d);

// ============================================================ render
function setT(el, s) { el.setAttribute('transform', s); }
let lastBg = null;
function cardState(t, a, b) {
  const pi = clamp((t - a) / .42), po = clamp((t - b) / .26);
  if (t < a || po >= 1) return null;
  const s = easeOutBack(pi) * (1 - .18 * easeIn(po));
  return { s: Math.max(s, .001), o: clamp((t - a) / .1) * (1 - po), y: (1 - easeOut(pi)) * 110 - 70 * easeIn(po), blur: (1 - easeOut(pi)) * 10 + po * 6, pi };
}

window.renderAt = function (t) {
  let si = SCENES.findIndex(s => t >= s.start && t < s.end); if (si < 0) si = t >= DURATION ? SCENES.length - 1 : 0;
  const sc = SCENES[si], id = sc.id, lt = t - sc.start;

  if (lastBg !== sc.bg) { for (const k in BG) { $('bg_' + k).style.display = k === sc.bg ? '' : 'none'; $('nr_' + k).style.display = k === sc.bg ? '' : 'none'; } lastBg = sc.bg; }

  // whip transition (directional motion blur + slide)
  let whipX = 0, whipBlur = 0;
  SCENES.forEach((s2, i) => {
    if (!i || s2.bg === SCENES[i - 1].bg) return;
    const d = t - s2.start;
    if (d > -.16 && d < .2) { const k = d < 0 ? (d + .16) / .16 : 1 - d / .2; whipBlur = Math.max(whipBlur, easeInOut(clamp(k)) * 60); whipX += (d < 0 ? -1 : 1) * easeIn(clamp(k)) * (d < 0 ? 260 : 220); }
  });
  $('whipBlur').setAttribute('stdDeviation', `${whipBlur.toFixed(1)} 0`);

  // camera: framing blended from previous scene, slow push-in, drift, punches
  const prev = SCENES[si - 1], same = prev && prev.bg === sc.bg, bk = same ? easeInOut(clamp(lt / .7)) : 1;
  const c1 = CAM[id], c0 = same ? CAM[prev.id] : c1;
  let zoom = 1.04 + lerp(c0[0], c1[0], bk) + .05 * clamp(lt / Math.max(1, sc.end - sc.start)) + .01 * noise(t, .5);
  let camX = lerp(c0[1], c1[1], bk) + noise(t, .33) * 22 + Math.sin(si * 1.7) * 14, camY = lerp(c0[2], c1[2], bk) + noise(t, .27, 2) * 14, rot = noise(t, .21, 4) * .8;
  PUNCH.forEach(tp => { const d = decay(t, tp, 5); zoom += .055 * d; rot += 1.3 * d * Math.sin(tp * 7); });
  const shake = decay(t, T.z1, 6) + decay(t, T.z2, 6) + decay(t, T.shame, 5) * .7 + decay(t, T.k500 + .25, 4);
  camX += Math.sin(t * 61) * 7 * shake; camY += Math.cos(t * 53) * 6 * shake;
  if (id === 's5') camX += -70 * easeInOut(kk(t, T.m[1] - .2, 1.2));   // drift from mom toward Arman
  if (id === 's14' && t > T.buzz && t < T.vwIn) camX += Math.sin(t * 80) * 3;
  camX += whipX;
  const cx = 540, cy = 1150;
  LAYERS.forEach(({ g, p }) => { const z = 1 + (zoom - 1) * p; setT(g, `translate(${cx + camX * p} ${cy + camY * p}) rotate(${rot * p * .6}) scale(${z}) translate(${-cx} ${-cy})`); });

  if (sc.bg === 'street') { $('streetMid').setAttribute('transform', `translate(${-lt * 170 - 200} 0)`); $('streetNear').setAttribute('transform', `translate(${-(lt * 330) % 1260} 0)`); $('clouds').setAttribute('transform', `translate(${-lt * 20} 0)`); }
  if (sc.bg === 'kitchenEve') $('steamE').setAttribute('transform', `translate(${Math.sin(t * 2) * 6} ${-((t * 20) % 20)})`);
  document.querySelectorAll('#fairy circle').forEach((c, i) => c.setAttribute('opacity', .55 + .45 * Math.sin(t * 3 + i * 1.3)));

  // mom
  if (sc.bg === 'kitchenEve') {
    const talking = id === 's5' && t >= T.m[0] - .05 && t < S('s5').end - .15, o = talking ? Math.abs(Math.sin(t * 13)) * .5 + Math.abs(Math.sin(t * 7.3)) * .5 : 0;
    $('momMouth').setAttribute('d', talking ? `M-26,88 Q0,${92 + o * 34} 26,88 Q0,${90 - o * 4} -26,88 Z` : id === 's6' ? 'M-28,92 Q0,104 28,92' : 'M-30,90 Q0,106 30,90');
    $('momMouth').setAttribute('fill', talking ? '#7a2a2e' : 'none');
    const bp = (t + 1.3) % 3.7, bl = bp < .14 ? Math.sin(bp / .14 * Math.PI) : 0;
    setT($('momEyes'), `translate(0 ${12 * bl}) scale(1 ${1 - .9 * bl})`);
    setT($('momHead'), `translate(0 ${Math.sin(t * 2 + 1) * 3}) rotate(${4 + Math.sin(t * 1.3) * 1.5 + (talking ? Math.sin(t * 5) * 1.2 : 0)} 0 120)`);
    setT($('mom'), `translate(245 ${1235 + Math.sin(t * 2) * 3})`);
  }

  // character
  let mood = 'neutral', pose = 'idle', glow = 0, shakeHands = 0, buzz = 0; CHX = 540; NODY = 0;
  if (id === 's1') { mood = t < T.feedIn ? 'happy' : t < T.feedHit ? 'phone' : t < T.usd ? 'shock' : 'dream'; pose = t >= T.feedIn - .3 ? 'phone' : 'idle'; glow = pose === 'phone' ? .15 : 0; }
  if (id === 's2') { pose = 'phone'; glow = .15; mood = t < T.noteIn ? 'dream' : 'tired'; }
  if (id === 's3') { pose = 'walk'; mood = 'tired'; }
  if (id === 's4') { mood = t < T.calIn ? 'nervous' : t < T.cal3 ? 'tired' : 'sad'; }
  if (id === 's5') { CHX = 740; mood = t < T.m[0] ? 'neutral' : t < T.m[1] ? 'shock' : 'sad'; }
  if (id === 's6') { CHX = 740; mood = t < T.shame ? 'sad' : t < T.g2 ? 'nervous' : 'sad'; NODY = 22 * (Math.sin(clamp((t - T.nod) / .9) * Math.PI * 3) ** 2) * (t > T.nod && t < T.nod + .9 ? 1 : 0); if (t >= T.g2) { pose = 'phone'; glow = .2; } }
  if (id === 's7') { glow = t >= T.bootIn ? .35 : .1; mood = t < T.nowIn ? 'tired' : t < T.now ? 'focus' : 'happy'; }
  if (id === 's8') { glow = .35; mood = t < T.z1 ? 'focus' : t < T.v2 ? 'shock' : t < T.z2 ? 'focus' : 'sad'; }
  if (id === 's9') { glow = .4; mood = t < T.three ? 'tired' : 'shock'; }
  if (id === 's10') { glow = .4; mood = t < T.e1a ? 'focus' : 'shock'; }
  if (id === 's11') { glow = .4; mood = t < T.e2a ? 'focus' : 'nervous'; }
  if (id === 's12') { glow = .4; mood = t < T.e3a ? 'focus' : 'sad'; }
  if (id === 's13') { glow = .4; mood = t < T.space ? 'focus' : t < T.pub ? 'dream' : 'happy'; if (t >= T.pub) pose = 'cheer'; }
  if (id === 's14') { pose = t < T.night ? 'phone' : 'cheer'; mood = t < T.vwIn ? 'tired' : t < T.k500 ? 'shock' : 'happy'; buzz = t < T.vwIn ? clamp((t - T.buzz) * 4) : 0; shakeHands = t >= T.vwIn && t < T.night ? 1 : 0; }
  if (id === 's15') { mood = t < T.opt[0] ? 'focus' : t < T.endIn ? ['happy', 'shock', 'nervous', 'sad'][T.opt.filter(x => t >= x).length - 1] : 'happy'; }
  applyChar(t, MOODS[mood], pose, glow, shakeHands, buzz, sc);

  // cards
  const seen = {};
  CARDS.forEach(([cid, a, b, o]) => {
    const el = $(cid), st = cardState(t, a, b);
    if (!st) { if (!seen[cid]) el.style.opacity = 0; return; }
    seen[cid] = 1;
    let extraR = Math.sin(t * 1.3 + a) * .7, extraY = Math.sin(t * 1.7 + a) * 5;
    if (cid === 'cNote') extraR += -4 + Math.sin(t * 2.2) * 1.5;
    if (cid === 'cViews') extraR += Math.sin(t * 40) * 1.2 * decay(t, T.k500 + .25, 3);
    el.style.opacity = st.o;
    el.style.transform = `translate(-50%, ${o.top + st.y + extraY}px) scale(${st.s}) rotate(${extraR}deg)`;
    el.style.filter = st.blur > .3 ? `blur(${st.blur.toFixed(1)}px)` : 'none';
  });
  // feed scroll
  { let y = 0, n = 1; for (let i = 0; i < 3; i++) { const k = easeInOut(kk(t, T.feedIn + .4 + i * .5, .3)); y += k; if (k > .5) n = i + 2; }
    $('feedIn').style.transform = `translateY(${-430 * y}px)`; $('feedN').textContent = n + ' / 4'; }
  // sticky note
  { const late = t >= T.nowIn - .3; $('noteSub').textContent = late ? 'сегодня: …' : t < T.school ? 'сегодня: устал' : t < T.test ? 'сегодня: школа' : 'сегодня: контрольная';
    $('noteSub').style.transform = `scale(${1 + .25 * Math.max(decay(t, T.school + .25, 6), decay(t, T.test + .25, 6))})`;
    $('strike').style.width = late ? (easeOut(kk(t, T.strike, .3)) * 104) + '%' : '0';
    const k = late ? kk(t, T.now, .22) : 0; $('nowStamp').style.opacity = k; $('nowStamp').style.transform = `rotate(${lerp(-22, -8, easeOut(k))}deg) scale(${lerp(2.6, 1, easeOut(k))})`; }
  // calendar
  { const k = clamp((t - T.calIn - .1) / Math.max(.4, T.cal3 - T.calIn)), n = Math.round(easeInOut(k) * 90); CAL.forEach((c, i) => c.style.opacity = i < n ? 1 : 0); $('calN').textContent = Math.max(1, n);
    const s = kk(t, T.cal3, .22); $('calStamp').style.opacity = s; $('calStamp').style.transform = `rotate(${lerp(-24, -9, easeOut(s))}deg) scale(${lerp(2.4, 1, easeOut(s))})`; }
  document.querySelectorAll('#cMom .ml').forEach((b, i) => { const k = kk(t, T.m[i] - .05, .3); b.style.opacity = k; b.style.transform = `translateY(${(1 - easeOut(k)) * 30}px)`; });
  { $('gMom').style.width = (easeOut(kk(t, T.guiltIn + .15, .6)) * 100) + '%'; const k = kk(t, T.g2 - .05, .3); $('gRow2').style.opacity = k; $('gMe').style.width = (easeOut(kk(t, T.g2 + .1, .7)) * 62) + '%'; }
  { const k = clamp((t - T.bootIn) / Math.max(.5, T.bootOut - T.bootIn)); $('bootBar').style.width = (4 + k * 9) + '%'; $('bootT').textContent = '3:' + String(59 - Math.floor(k * 3)).padStart(2, '0'); }
  { const two = t >= T.v2; $('upName').textContent = two ? 'Видео №2' : 'Видео №1'; const a = two ? T.v2 : T.upIn + .15, z = two ? T.z2 : T.z1;
    const k = clamp((t - a) / Math.max(.3, z - a - .15)); $('upBar').style.width = (easeOut(k) * 100) + '%'; $('upSt').style.opacity = k >= 1 ? 1 : 0;
    const zk = kk(t, z, .2); $('upV').style.opacity = zk; $('upV').style.transform = `scale(${lerp(2.2, 1, easeOut(zk))}) rotate(${Math.sin(t * 45) * 4 * decay(t, z, 5)}deg)`; $('upName').style.transform = `scale(${1 + .2 * decay(t, T.v2, 6)})`; $('upName').style.transformOrigin = '0 50%'; }
  { const q = 'почему у шортс 0 просмотров', n = Math.round(q.length * kk(t, T.srIn + .15, 1.15)); $('srTxt').textContent = q.slice(0, n) + (n < q.length && Math.sin(t * 14) > 0 ? '|' : '');
    document.querySelectorAll('#cSearch .sr').forEach((r, i) => { r.style.opacity = kk(t, T.srIn + 1.35 + i * .12, .25); }); }
  { [['e1a', T.e1a], ['e1b', T.e1b]].forEach(([e, a]) => { $(e).style.transform = `scale(${1 + .35 * decay(t, a, 6)}) rotate(${Math.sin(t * 50) * 4 * decay(t, a, 6)}deg)`; });
    $('e1c').style.opacity = lerp(.25, 1, kk(t, T.e1a + .35, .25)); $('e1d').style.opacity = lerp(.25, 1, kk(t, T.e1b + .3, .25)); }
  { const L = 1500, k = easeInOut(clamp((t - T.e2In - .2) / Math.max(.4, T.e2a - T.e2In + .1))); $('retPath').setAttribute('stroke-dasharray', L); $('retPath').setAttribute('stroke-dashoffset', L * (1 - k));
    $('retMark').setAttribute('opacity', kk(t, T.e2a, .2)); $('e2fix').style.opacity = lerp(.25, 1, kk(t, T.e2b + .25, .3)); }
  { document.querySelectorAll('#chips .chip').forEach((c, i) => { const k = kk(t, T.e3In + .15 + i * .11, .25), j = t >= T.e3a ? 1 : 0;
      c.style.opacity = k; c.style.transform = `translate(${Math.sin(t * 9 + i * 2) * 10 * j}px, ${(1 - easeOutBack(k)) * 30 + Math.cos(t * 11 + i) * 8 * j}px) rotate(${Math.sin(t * 7 + i * 3) * 9 * j}deg)`; });
    const k = kk(t, T.e3b - .1, .3); $('e3note').style.opacity = k; $('e3note').style.transform = `scale(${lerp(1.3, 1, easeOut(k))})`; }
  document.querySelectorAll('#cFix .fx3').forEach((f, i) => { const k = kk(t, T.fixIn + .1 + i * .22, .25); f.style.opacity = k; f.style.transform = `translateX(${(1 - easeOutBack(k)) * -60}px)`; });
  { $('planet').style.transform = `translateY(${Math.sin(t * 1.6) * 8}px) rotate(${t * 6}deg) scale(${1 + .25 * decay(t, T.space, 4)})`; $('stars').style.transform = `translateX(${-(t * 12) % 40}px)`;
    $('nUp').style.opacity = kk(t, T.upl - .05, .25); const k = clamp((t - T.upl) / Math.max(.3, T.pub - T.upl)); $('nBar').style.width = (easeInOut(k) * 100) + '%'; $('nPct').textContent = Math.round(easeInOut(k) * 100) + '%';
    const s = kk(t, T.pub, .22); $('nPub').style.opacity = s; $('nPub').style.transform = `rotate(${lerp(-22, -7, easeOut(s))}deg) scale(${lerp(2.4, 1, easeOut(s))})`; }
  const vk = easeOut(clamp((t - T.vwIn - .1) / Math.max(.5, T.k500 + .25 - T.vwIn)));
  { $('vwN').textContent = fmt(vk * 500000); $('vwN').style.transform = `scale(${1 + .18 * decay(t, T.k500 + .25, 4)})`;
    document.querySelectorAll('#cViews .vn').forEach((v, i) => { const k = kk(t, T.night - .1 + i * .25, .3); v.style.opacity = k; v.style.transform = `scale(${easeOutBack(k)})`; }); }
  document.querySelectorAll('#cPoll .opt').forEach((o, i) => { const k = kk(t, T.opt[i] - .05, .3); const on = t >= T.opt[i] && (i === 3 ? t < T.endIn : t < T.opt[i + 1]); o.style.opacity = k; o.style.transform = `translateX(${(1 - easeOutBack(k)) * -80}px) scale(${on ? 1.04 : 1})`; o.style.background = on ? '#fff3bf' : '#f2f4f8'; });
  { const k = kk(t, T.endIn, .4); $('cEnd').style.opacity = k; $('cEnd').style.transform = `translateY(${(1 - easeOutBack(k)) * 60}px)`; }
  // confetti
  { const d = t - (T.k500 + .25); CONF.forEach((c, i) => { if (d < 0 || d > 3.2) { c.style.opacity = 0; return; } const [a, b, e, f] = CONFP[i]; const ang = -Math.PI / 2 + (a - .5) * 2.2, v = 900 + b * 1300;
      c.style.opacity = clamp(3.2 - d); c.style.transform = `translate(${540 + Math.cos(ang) * v * d * .8 + Math.sin(d * 5 + i) * 30}px, ${760 + Math.sin(ang) * v * d + 1100 * d * d}px) rotate(${d * 500 * (e - .5) + i * 30}deg) scale(${.7 + f})`; }); }

  // big fx text
  const fx = $('fxText'); let fxs = null;
  const fxDef = [
    [T.usd, T.feedOut, '$10 000', 150, '#FFD43B', 730],
    [T.school + .15, S('s3').end, 'ШКОЛА', 140, '#fff', 690],
    [T.shame, T.guiltIn, 'СТЫДНО', 170, '#ff6b6b', 520],
    [T.three, T.srOut, '3 ОШИБКИ', 150, '#ff6b6b', 720],
    [T.night, T.vwOut, 'ЗА НОЧЬ!', 120, '#FFD43B', 880],
  ];
  for (const [a, b, txt, size, col, top] of fxDef) { const st = cardState(t, a, b); if (st) fxs = { st, txt, size, col, top }; }
  if (fxs) { fx.textContent = fxs.txt; fx.style.fontSize = fxs.size + 'px'; fx.style.color = fxs.col; fx.style.top = fxs.top + 'px'; fx.style.opacity = fxs.st.o; fx.style.transform = `translateY(${fxs.st.y}px) scale(${fxs.st.s}) rotate(${Math.sin(t * 9) * 3}deg)`; }
  else fx.style.opacity = 0;
  // guilt: world darkens around Arman
  $('dark').style.opacity = id === 's6' ? easeInOut(kk(t, T.shame - .1, .5)) * (1 - kk(t, S('s6').end - .2, .2)) : 0;

  // HUD
  const times = [['s1', 'ЧТ 21:40'], ['s3', 'ПТ 07:50'], ['s4', 'СБ 10:15'], ['s5', 'ВС 19:30'], ['s7', 'ВС 20:10'], ['s8', 'ВС 21:45'], ['s9', 'ВС 23:50'], ['s10', 'ПН 00:20'], ['s11', 'ПН 00:55'], ['s12', 'ПН 01:30'], ['s13', 'ПН 02:40'], ['s14', 'ПН 09:40']];
  let tm = 'ЧТ 21:40'; times.forEach(([sid, v]) => { if (t >= S(sid).start) tm = v; });
  if (id === 's4' && t >= T.calIn) tm = 'ДЕНЬ ' + $('calN').textContent;
  $('hTime').textContent = tm; $('hTime').style.fontSize = '40px';
  const views = t >= T.vwIn ? vk * 500000 : 0, subs = t >= T.night ? easeOut(kk(t, T.night, .8)) * 1204 : 0;
  $('hCli').textContent = views >= 1000 ? (views >= 499500 ? '500K' : Math.floor(views / 1000) + 'K') : '0'; $('hBal').textContent = fmt(subs);
  $('hCli').style.color = views ? '#16a34a' : t >= T.z1 && t < S('s14').start ? '#e5383b' : '#16171d'; $('hBal').style.color = subs ? '#16a34a' : '#16171d';
  $('hCli').style.transform = `scale(${1 + .3 * Math.max(decay(t, T.z1, 4), decay(t, T.z2, 4), decay(t, T.k500 + .25, 2))})`; $('hCli').style.transformOrigin = '0 50%';
  $('hBal').style.transform = `scale(${1 + .3 * decay(t, T.night + .6, 2)})`; $('hBal').style.transformOrigin = '0 50%';

  // subtitles
  const ch = CHUNKS.find(c => t >= c.s && t < c.e), subsEl = $('subs');
  if (!ch || t > VO_END + .5) { subsEl.innerHTML = ''; subsEl._c = null; }
  else {
    if (subsEl._c !== ch) { subsEl.innerHTML = ch.map(tk => `<span>${tk.w.replace(/[«»]/g, '')}</span>`).join(' '); subsEl._c = ch; subsEl.style.fontSize = ch.reduce((n, x) => n + x.w.length + 1, 0) > 18 ? '64px' : '78px'; }
    const sp = subsEl.children, k = clamp((t - ch.s) / .16);
    subsEl.style.transform = `translateY(${(1 - easeOut(k)) * 26}px) scale(${.9 + .1 * easeOutBack(k)})`; subsEl.style.opacity = clamp((t - ch.s) / .08);
    ch.forEach((tk, i) => { const on = t >= tk.s - .03 && (i === ch.length - 1 || t < ch[i + 1].s - .03); sp[i].className = on ? 'on' : ''; const q = on ? clamp((t - tk.s + .03) / .12) : 0; sp[i].style.transform = `scale(${1 + .1 * Math.sin(Math.PI * q) + (on ? .04 : 0)})`; });
  }

  $('flash').style.opacity = .55 * Math.max(decay(t, T.now, 9), decay(t, T.pub, 9), decay(t, T.k500 + .25, 7));
  const fadeOut = clamp((t - (DURATION - .35)) / .35);
  $('stage').style.filter = fadeOut > 0 ? `brightness(${1 - fadeOut})` : 'none';
};

