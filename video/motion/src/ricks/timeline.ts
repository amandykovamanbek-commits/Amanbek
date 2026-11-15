// Rick's Clips tutorial timeline (1920x1080). Erasable-only TS so Node can import it.
export const FPS = 30;
export const BPM = 119;
export const PHASE = .43;
export const BEAT = 60 / BPM;

export const norm = (w: string) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');
// silence inserted after a word (scene:word); rs:клод = the result plays with its own sound
export const HOLDS: Record<string, number> = { 'h:меня': .5, 'ch:минут': .6, 'nd:шагам': .5, 's1:про': .5, 's2:понадобятся': .7, 's3:делать': .5, 's4:звуки': .5, 's5:переделает': .6, 'rs:клод': 15.5 };
export const RESULT_FROM = 0; // seconds into result.mp4 to start playback

// voice word -> on-screen word (same token count so timings stay aligned)
const SHOW: [RegExp, string][] = [[/^клод(у|а|ом)?$/i, 'Claude'], [/^рикс$/i, "Rick's"], [/^клипс$/i, 'Clips'], [/^афтер$/i, 'After'], [/^эффектс$/i, 'Effects']];
export function display(words: string[]) {
  const out = words.map((w) => { const core = w.replace(/^[«"(]+|[»".,:;!?)—]+$/g, ''); const pre = w.slice(0, w.indexOf(core)), post = w.slice(w.indexOf(core) + core.length);
    for (const [re, rep] of SHOW) if (re.test(core)) return pre + rep + post; return w; });
  for (let i = 0; i + 3 < words.length; i++) if (norm(words[i]) === 'клод' && norm(words[i + 1]) === 'точка') { out[i] = 'claude.ai'; out[i + 1] = out[i + 2] = out[i + 3] = ''; }
  for (let i = 0; i + 1 < words.length; i++) if (out[i].startsWith('Claude') && norm(words[i + 1]).startsWith('код')) { out[i] = 'Claude'; out[i + 1] = 'Code' + words[i + 1].replace(/^[^.,!?]*/, ''); }
  return out;
}

export function tokens(lines: { id: string; text: string }[]) {
  const out: any[] = [];
  lines.forEach((l, si) => { const ws = l.text.split(/\s+/).filter((w) => norm(w)); const ds = display(ws); ws.forEach((w, k) => out.push({ w, d: ds[k], n: norm(w), si, id: l.id })); });
  return out;
}

export function buildRicks(lines: { id: string; text: string }[], words: { s: number; e: number }[], lead = 0) {
  const sc = lines.map((l) => ({ ...l, tokens: [] as any[], start: 0, end: 0 }));
  const tok = tokens(lines);
  tok.forEach((t) => sc[t.si].tokens.push(t));
  if (words && words.length === tok.length) tok.forEach((t, i) => { t.s = words[i].s + lead; t.e = words[i].e + lead; });
  else { let x = .6; tok.forEach((t) => { const d = .055 * t.n.length + .1; t.s = x; t.e = x + d; x += d + .03; if (/[.!?…»]$/.test(t.w)) x += .45; else if (/[,:—]$/.test(t.w)) x += .15; x += HOLDS[t.id + ':' + t.n] || 0; }); }
  const voEnd = tok[tok.length - 1].e;
  const duration = Math.ceil((voEnd + 2.5 - PHASE) / BEAT) * BEAT + PHASE;
  sc.forEach((s, i) => {
    if (!i) return;
    const a = sc[i - 1].tokens.at(-1).e + .2, b = s.tokens[0].s - .05;
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
  const rsLast = S('rs').tokens.at(-1);
  const C = {
    hMil: W('h', 'миллионы'), hShips: W('h', 'пиратские'), hJars: W('h', 'древние'), hInv: W('h', 'странные'), hEnd: W('h', 'последней'), hShow: W('h', 'покажу'), hNever: W('h', 'ни'), hClaude: W('h', 'клод'), hTease: W('h', 'конце'),
    chName: W('ch', 'рикс'), chFact: W('ch', 'реальный'), chMen: W('ch', 'смешные'), chWorld: W('ch', 'яркие'), chVoice: W('ch', 'голос'), chSubs: W('ch', 'субтитры'), chHow: W('ch', 'посмотри'), chHook: W('ch', 'первая'), chCuts: W('ch', 'дальше'), chTwist: W('ch', 'конце'), chWatch: W('ch', 'поэтому'), chBefore: W('ch', 'раньше'), chNow: W('ch', 'сейчас'),
    nd1: W('nd', 'клод'), nd2: W('nd', 'мои'), nd3: W('nd', 'ролик'), ndNo: W('nd', 'никакого'), ndSteps: W('nd', 'давай'),
    s1Site: W('s1', 'заходишь'), s1Dl: W('s1', 'скачать'), s1Inst: W('s1', 'устанавливаешь'), s1Web: W('s1', 'браузере'), s1Reg: W('s1', 'регистрируешься'), s1Code: W('s1', 'клод', 3), s1Pro: W('s1', 'про'),
    s2Tg: W('s2', 'заходи'), s2Pin: W('s2', 'закрепленном'), s2Without: W('s2', 'без'), s2With: W('s2', 'с'), s2Week: W('s2', 'неделю'), s2Link: W('s2', 'ссылка'), s2Pause: W('s2', 'поставь'),
    s3Drag: W('s3', 'перетаскиваешь'), s3Copy: W('s3', 'копируешь'), s3Paste: W('s3', 'вставляешь'), s3Read: W('s3', 'прочитает'),
    s4Go: W('s4', 'идешь'), s4Pick: W('s4', 'выбираешь'), s4Send: W('s4', 'отправляешь'), s4Parse: W('s4', 'разберет'), s4Hook: W('s4', 'хук'), s4Scenes: W('s4', 'меняются'), s4Chars: W('s4', 'двигаются'), s4Snd: W('s4', 'звучат'),
    s5Script: W('s5', 'пишет'), s5Draw: W('s5', 'рисует'), s5Voice: W('s5', 'подбирает'), s5Subs: W('s5', 'расставляет'), s5Build: W('s5', 'собирает'), s5Wait: W('s5', 'подождать'), s5Edit: W('s5', 'напиши'), s5Redo: W('s5', 'переделает'),
    rsShow: S('rs').start, rsPlay: rsLast.e + .25, rsPlayEnd: rsLast.e + .25 + (HOLDS['rs:клод'] - .6),
    enAll: W('en', 'все'), enLink: W('en', 'ссылка'), enToday: W('en', 'сегодня'), enSub: W('en', 'подпишись'),
  };
  const sfx: { t: number; k: string }[] = [];
  const P = (t: number, k: string) => sfx.push({ t, k });
  sc.forEach((s, i) => { if (i) P(s.start - .3, 'whoosh'); });
  P(C.hMil, 'boom'); [C.hShips, C.hJars, C.hInv].forEach((x) => P(x, 'pop')); P(C.hClaude, 'flash');
  [C.chMen, C.chWorld, C.chVoice, C.chSubs].forEach((x) => P(x, 'pop')); [C.chHook, C.chCuts, C.chTwist].forEach((x) => P(x, 'ui2'));
  [C.nd1, C.nd2, C.nd3].forEach((x) => P(x, 'drop'));
  P(C.s1Site - .2, 'hover'); for (let x = C.s1Site + .1; x < C.s1Site + .9; x += .09) P(x, 'key'); P(C.s1Dl, 'click'); P(C.s1Inst, 'appopen'); P(C.s1Code, 'click'); P(C.s1Pro, 'pop');
  P(C.s2Tg, 'click'); P(C.s2Pin, 'pop'); P(C.s2With, 'ui2'); P(C.s2Link, 'boom'); P(C.s2Pause, 'click');
  P(C.s3Drag, 'swish'); P(C.s3Drag + .5, 'drop'); P(C.s3Paste, 'click'); for (let x = C.s3Paste + .05; x < C.s3Paste + .7; x += .07) P(x, 'key'); P(C.s3Read, 'send');
  P(C.s4Pick, 'click'); P(C.s4Send, 'swish'); P(C.s4Send + .5, 'drop'); [C.s4Hook, C.s4Scenes, C.s4Chars, C.s4Snd].forEach((x) => P(x, 'ui2'));
  for (let x = C.s5Script; x < C.s5Build; x += .08) P(x, 'data'); P(C.s5Build + .8, 'boom'); P(C.s5Edit, 'click'); P(C.s5Redo, 'ui2');
  P(C.rsPlay - .1, 'flash');
  P(C.enAll, 'boom'); P(C.enLink, 'pop'); P(C.enSub, 'click');
  return { sc, tok, C, duration, voEnd, sfx: sfx.filter((e) => e.t >= 0 && e.t < duration).sort((a, b) => a.t - b.t) };
}
