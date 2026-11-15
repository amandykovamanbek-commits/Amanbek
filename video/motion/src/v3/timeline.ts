// v3 timeline: cursor-driven Claude walkthrough. Erasable-only TS (Node imports it for audio).
export const FPS = 30;
export const BPM = 119;
export const PHASE = .43; // first downbeat of the background song
export const BEAT = 60 / BPM;

export const LINES = [
  { id: 'a', text: 'Раньше на такой ролик уходили недели.' },
  { id: 'b', text: 'Теперь — один промпт.' },
  { id: 'c', text: 'Открываешь Claude и выбираешь режим.' },
  { id: 'd', text: 'Прикрепляешь файлы: сценарий, референсы и музыку.' },
  { id: 'e', text: 'Пишешь, что нужно, — и отправляешь.' },
  { id: 'f', text: 'Claude сам пишет код анимации.' },
  { id: 'g', text: 'Одна команда — и ролик готов.' },
  { id: 'h', text: 'Без After Effects и без денег.' },
  { id: 'i', text: 'Все промпты — в моём телеграм-канале. Ссылка в шапке профиля!' },
];
// extra silence inserted after a word (scene:word) so the visuals have time to read
export const HOLDS: Record<string, number> = { 'a:недели': .2, 'b:промпт': .45, 'c:режим': .3, 'd:музыку': 1.3, 'e:отправляешь': .5, 'f:анимации': .3, 'g:готов': .45 };

export const norm = (w: string) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

export function tokens() {
  const out: any[] = [];
  LINES.forEach((l, si) => l.text.split(/\s+/).forEach((w) => { if (norm(w)) out.push({ w, n: norm(w), si, id: l.id }); }));
  return out;
}

export function buildV3(words: { s: number; e: number }[], lead = 0) {
  const sc = LINES.map((l) => ({ ...l, tokens: [] as any[], start: 0, end: 0 }));
  const tok = tokens();
  tok.forEach((t) => sc[t.si].tokens.push(t));
  if (words && words.length === tok.length) tok.forEach((t, i) => { t.s = words[i].s + lead; t.e = words[i].e + lead; });
  else {
    let x = .3; tok.forEach((t) => { const d = .06 * t.n.length + .12; t.s = x; t.e = x + d; x += d + .04;
      if (/[.!?…»]$/.test(t.w)) x += .7; else if (/[,:—]$/.test(t.w)) x += .2; x += HOLDS[t.id + ':' + t.n] || 0; });
  }
  const voEnd = tok[tok.length - 1].e;
  const duration = Math.ceil((voEnd + 1.8 - PHASE) / BEAT) * BEAT + PHASE;
  sc.forEach((s, i) => {
    if (!i) return;
    const a = sc[i - 1].tokens.at(-1).e + .25, b = s.tokens[0].s - .05;
    let best = null; for (let k = Math.ceil((a - PHASE) / BEAT); k * BEAT + PHASE <= b; k++) { const x = k * BEAT + PHASE; if (best === null || Math.abs(x - (b - .15)) < Math.abs(best - (b - .15))) best = x; }
    s.start = best ?? Math.max(a - .1, b - .15);
  });
  sc.forEach((s, i) => { s.end = i < sc.length - 1 ? sc[i + 1].start : duration; });
  const W = (sid: string, pre: string, nth = 0, edge = 's') => {
    const s = sc.find((x) => x.id === sid), p = norm(pre);
    let h = s.tokens.filter((t) => t.n === p); if (!h.length) h = s.tokens.filter((t) => t.n.startsWith(p));
    if (!h.length) throw new Error('cue ' + sid + ' ' + pre);
    return h[Math.min(nth, h.length - 1)][edge];
  };
  const S = (id: string) => sc.find((x) => x.id === id);
  const cClick = W('c', 'claude') - .15;
  const C = {
    aHi: W('a', 'недели'),
    bNow: W('b', 'теперь'), bOne: W('b', 'один'), bPrompt: W('b', 'промпт'),
    cClick, cOpen: cClick + .12, cHome: cClick + .75, cMode: Math.max(W('c', 'режим') + .05, cClick + 1.5),
    dPlus: S('d').start + .35, dFiles: [W('d', 'сценарий'), W('d', 'референсы'), W('d', 'музыку')],
    eType: W('d', 'музыку') + .4, eSend: W('e', 'отправляешь') + .1,
    fCode: S('f').start, fHi: W('f', 'код'),
    gGo: W('g', 'команда'), gDone: W('g', 'готов'),
    hAe: W('h', 'after'), hZero: W('h', 'денег'),
    iAll: W('i', 'все'), iTg: W('i', 'телеграм'), iLink: W('i', 'ссылка'), iHead: W('i', 'шапке'),
  };
  const sfx: { t: number; k: string }[] = [];
  const P = (t: number, k: string) => sfx.push({ t, k });
  sc.forEach((s, i) => { if (i && !['d', 'e'].includes(s.id)) P(s.start - .3, 'whoosh'); });
  P(C.aHi, 'chime'); P(C.bNow - .02, 'boom');
  P(S('c').start + .1, 'swish'); P(C.cClick - .25, 'hover'); P(C.cClick, 'click'); P(C.cOpen, 'appopen'); P(C.cHome, 'shimmer');
  P(C.cMode - .25, 'hover'); P(C.cMode, 'click'); P(C.cMode + .05, 'pop');
  P(C.dPlus, 'click'); P(C.dPlus + .1, 'pop'); C.dFiles.forEach((x) => { P(x - .2, 'swish'); P(x + .25, 'drop'); });
  { const msgLen = 84, dur = C.eSend - .45 - C.eType; for (let k = 0; k < msgLen; k += 1) { const x = C.eType + dur * k / msgLen; if (k % 2 === 0) P(x, 'key'); } }
  P(C.eSend - .25, 'hover'); P(C.eSend, 'click'); P(C.eSend + .05, 'send');
  for (let x = C.fCode + .1; x < S('f').end - .3; x += .07) P(x, 'data');
  P(C.fHi, 'pop');
  P(C.gGo, 'ui'); P(C.gDone - .9, 'riser'); P(C.gDone, 'boom'); P(C.gDone + .02, 'chime');
  P(S('h').start - .02, 'flash'); P(C.hAe + .45, 'swish'); P(C.hZero, 'pop');
  P(C.iAll, 'boom'); P(C.iLink, 'pop'); P(C.iHead, 'chime');
  return { sc, tok, C, duration, voEnd, sfx: sfx.filter((e) => e.t >= 0 && e.t < duration).sort((a, b) => a.t - b.t) };
}
