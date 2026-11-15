// Cinematic version timeline: voice lines, word timings, beat-snapped cuts, cues, SFX.
// Erasable-only TS so Node can import it for audio generation.
export const FPS = 30;
export const BPM = 100;
export const BEAT = 60 / BPM;

export const LINES = [
  { id: 'a', text: 'Раньше на такой ролик уходили недели.' },
  { id: 'b', text: 'Теперь — один промпт.' },
  { id: 'c', text: 'Открываешь Claude и выбираешь модель.' },
  { id: 'd', text: 'Описываешь идею, а Claude пишет сценарий и код анимации.' },
  { id: 'e', text: 'Одна команда — и ролик рендерится сам.' },
  { id: 'f', text: 'Без After Effects и без денег.' },
  { id: 'g', text: 'Все промпты — в моём телеграм-канале. Ссылка в шапке профиля!' },
];

export const norm = (w: string) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

export function buildCine(words: { s: number; e: number }[], lead = 0) {
  const sc = LINES.map((l) => ({ ...l, tokens: [] as any[], start: 0, end: 0 }));
  const tok: any[] = [];
  sc.forEach((s, si) => s.text.split(/\s+/).forEach((w) => { if (!norm(w)) return; const t = { w, n: norm(w), si, s: 0, e: 0 }; s.tokens.push(t); tok.push(t); }));
  if (words && words.length === tok.length) tok.forEach((t, i) => { t.s = words[i].s + lead; t.e = words[i].e + lead; });
  else {
    // estimated read (≈ natural Russian VO pace); scene gaps leave room for the cut
    let x = .3; tok.forEach((t) => { const d = .06 * t.n.length + .12; t.s = x; t.e = x + d; x += d + .04; if (/[.!?…»]$/.test(t.w)) x += .7; else if (/[,:—]$/.test(t.w)) x += .2; });
  }
  const voEnd = tok[tok.length - 1].e;
  const duration = Math.ceil((voEnd + 1.7) / BEAT) * BEAT;
  sc.forEach((s, i) => {
    if (!i) return;
    const a = sc[i - 1].tokens.at(-1).e + .3, b = s.tokens[0].s - .05;
    let best = null; for (let k = Math.ceil(a / BEAT); k * BEAT <= b; k++) { const x = k * BEAT; if (best === null || Math.abs(x - (b - .15)) < Math.abs(best - (b - .15))) best = x; }
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
  const C = {
    aHi: W('a', 'недели'),
    bNow: W('b', 'теперь'), bOne: W('b', 'один'), bPrompt: W('b', 'промпт'),
    cClaude: W('c', 'claude'), cSwitch: W('c', 'и') - .05, cPick: W('c', 'выбираешь'), cModel: W('c', 'модель'),
    dFile: S('d').start + .1, dType: W('d', 'идею') - .25, dSend: W('d', 'а') - .05, dCode: W('d', 'claude', 0) - .1, dScript: W('d', 'сценарий'), dAnim: W('d', 'код'),
    eCmd: S('e').start + .1, eGo: W('e', 'и') - .1, eDone: W('e', 'сам'),
    fAe: W('f', 'after'), fMoney: W('f', 'без', 1), fZero: W('f', 'денег'),
    gAll: W('g', 'все'), gTg: W('g', 'телеграм'), gLink: W('g', 'ссылка'), gHead: W('g', 'шапке'),
  };
  const sfx: { t: number; k: string }[] = [];
  const P = (t: number, k: string) => sfx.push({ t, k });
  sc.forEach((s, i) => { if (i) P(s.start - .3, 'whoosh'); });
  P(C.aHi, 'chime');
  P(C.bNow - .02, 'boom');
  P(C.cClaude - .1, 'shimmer'); P(C.cSwitch, 'whoosh'); P(C.cPick, 'ui'); P(C.cModel - .1, 'ui'); P(C.cModel + .15, 'ui2');
  P(C.dFile, 'swish'); P(C.dFile + .45, 'ui2');
  for (let x = C.dType; x < C.dSend - .15; x += .085) P(x, 'key');
  P(C.dSend, 'press'); P(C.dSend + .05, 'boom'); P(C.dScript, 'ui2'); P(C.dAnim, 'ui2');
  for (let x = C.eCmd; x < C.eGo - .15; x += .085) P(x, 'key');
  P(C.eGo, 'ui'); P(C.eDone - .9, 'riser'); P(C.eDone, 'chime');
  P(S('f').start - .02, 'flash'); P(C.fZero, 'ui2');
  P(C.gAll, 'boom'); P(C.gLink, 'ui2'); P(C.gHead, 'chime');
  return { sc, tok, C, duration, voEnd, sfx: sfx.filter((e) => e.t >= 0 && e.t < duration).sort((a, b) => a.t - b.t) };
}
