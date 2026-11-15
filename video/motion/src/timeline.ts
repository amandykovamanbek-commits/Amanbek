// Shared timeline: voice text, word timings, beat-snapped scene cuts, animation cues, SFX list.
// Plain JS-compatible TS so Node (type stripping) can import it for audio generation too.
export const FPS = 30;
export const BPM = 110;
export const BEAT = 60 / BPM;

export const SCRIPT = [
  { id: 's1', text: 'Этот мультик нарисовал не художник. Его написал Claude — кодом.' },
  { id: 's2', text: 'Шаг первый: пишешь идею — Claude выдаёт сценарий и раскадровку.' },
  { id: 's3', text: 'Шаг второй: персонаж из простых фигур. Круг, овалы, линии — и он оживает.' },
  { id: 's4', text: 'Шаг третий: голос, звуки и субтитры по словам — тоже Claude.' },
  { id: 's5', text: 'Шаг четвёртый: одна команда — и готовое видео. Без After Effects и без денег.' },
  { id: 's6', text: 'Все промпты — в моём телеграм-канале. Ссылка в шапке профиля!' },
];

export const norm = (w: string) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

export function buildTimeline(words: { s: number; e: number }[], lead = 0) {
  const scenes = SCRIPT.map((s) => ({ ...s, tokens: [] as any[], start: 0, end: 0 }));
  const tok: any[] = [];
  scenes.forEach((sc, si) => sc.text.split(/\s+/).forEach((w) => { if (!norm(w)) return; const t = { w, n: norm(w), si, s: 0, e: 0 }; sc.tokens.push(t); tok.push(t); }));
  if (words && words.length === tok.length) tok.forEach((t, i) => { t.s = words[i].s + lead; t.e = words[i].e + lead; });
  else { let x = .35; tok.forEach((t) => { const d = .065 * t.n.length + .1; t.s = x; t.e = x + d; x += d + .03; if (/[.!?…»]$/.test(t.w)) x += .45; else if (/[,:—]$/.test(t.w)) x += .15; }); }
  const voEnd = tok[tok.length - 1].e;
  const duration = Math.ceil((voEnd + 2.4) / BEAT) * BEAT;
  scenes.forEach((sc, i) => {
    if (!i) return;
    const a = scenes[i - 1].tokens.at(-1).e + .45, b = sc.tokens[0].s - .02;
    let best = null; for (let k = Math.ceil(a / BEAT); k * BEAT <= b; k++) { const x = k * BEAT; if (best === null || Math.abs(x - (b - .1)) < Math.abs(best - (b - .1))) best = x; }
    sc.start = best ?? b - .08;
  });
  scenes.forEach((sc, i) => { sc.end = i < scenes.length - 1 ? scenes[i + 1].start : duration; });
  const W = (sid: string, pre: string, nth = 0, edge = 's') => {
    const sc = scenes.find((s) => s.id === sid), p = norm(pre);
    let h = sc.tokens.filter((t) => t.n === p); if (!h.length) h = sc.tokens.filter((t) => t.n.startsWith(p));
    if (!h.length) throw new Error('cue ' + sid + ' ' + pre);
    return h[Math.min(nth, h.length - 1)][edge];
  };
  const S = (id: string) => scenes.find((s) => s.id === id);
  const C = {
    s1w: ['этот', 'мультик', 'нарисовал'].map((w) => W('s1', w)), s1no: W('s1', 'художник'), s1draw: W('s1', 'написал'), s1claude: W('s1', 'claude'), s1code: W('s1', 'кодом'),
    s2type: S('s2').start + .15, s2send: W('s2', 'идею', 0, 'e'), s2script: W('s2', 'сценарий'), s2board: W('s2', 'раскадровку'),
    s3body: W('s3', 'персонаж'), s3circle: W('s3', 'круг'), s3oval: W('s3', 'овалы'), s3line: W('s3', 'линии'), s3asm: W('s3', 'линии', 0, 'e') + .05, s3live: W('s3', 'оживает'),
    s4voice: W('s4', 'голос'), s4sfx: W('s4', 'звуки'), s4subs: W('s4', 'субтитры'), s4claude: W('s4', 'тоже'),
    s5cmd: S('s5').start + .1, s5go: W('s5', 'команда'), s5done: W('s5', 'видео'), s5ae: W('s5', 'after'), s5zero: W('s5', 'денег'),
    s6all: W('s6', 'все'), s6prompts: W('s6', 'промпты'), s6tg: W('s6', 'телеграм'), s6link: W('s6', 'ссылка'), s6head: W('s6', 'шапке'),
  };
  // caption chunks
  const chunks: any[] = []; let cur: any[] = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  tok.forEach((t, i) => { if (cur.length && tok[i - 1].si !== t.si) flush(); cur.push(t); const len = cur.reduce((a, x) => a + x.w.length + 1, 0);
    if (/[.!?…:»]$/.test(t.w) || (/[,—]$/.test(t.w) && cur.length >= 2) || cur.length >= 3 || len > 18) flush(); });
  flush();
  chunks.forEach((c, i) => { c.s = c[0].s - .06; c.e = i < chunks.length - 1 ? Math.min(chunks[i + 1][0].s - .06, c.at(-1).e + .5) : c.at(-1).e + .6; });

  const sfx: { t: number; k: string }[] = [];
  const P = (t: number, k: string) => sfx.push({ t, k });
  scenes.forEach((s, i) => { if (i) P(s.start - .38, 'whoosh'); });
  C.s1w.forEach((x) => P(x, 'hit')); P(C.s1no, 'stamp'); P(C.s1claude, 'success');
  for (let x = C.s1draw; x < C.s1code; x += .1) P(x, 'tick');
  for (let x = C.s2type; x < C.s2send - .05; x += .09) P(x, 'click');
  P(C.s2send, 'send'); P(C.s2script, 'pop'); for (let i = 0; i < 4; i++) P(C.s2board + i * .09, 'pop');
  [C.s3body, C.s3circle, C.s3oval, C.s3line].forEach((x) => P(x, 'pop')); P(C.s3asm, 'whoosh'); P(C.s3live, 'sparkle');
  P(C.s4voice, 'pop'); [0, .16, .32].forEach((d) => P(C.s4sfx + d, 'pop')); for (let i = 0; i < 4; i++) P(C.s4subs + .1 + i * .16, 'tick'); P(C.s4claude, 'sparkle');
  for (let x = C.s5cmd; x < C.s5go - .1; x += .08) P(x, 'click'); for (let x = C.s5go; x < C.s5done; x += .12) P(x, 'tick');
  P(C.s5done, 'success'); P(C.s5ae + .2, 'whoosh'); P(C.s5zero, 'stamp');
  P(C.s6all, 'hit'); P(C.s6prompts, 'hit'); P(C.s6link, 'pop'); P(C.s6head, 'sparkle');

  return { scenes, tok, chunks, C, duration, voEnd, sfx: sfx.filter((e) => e.t >= 0 && e.t < duration) };
}
