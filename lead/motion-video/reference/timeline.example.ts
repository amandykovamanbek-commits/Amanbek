// «10 инструментов для Claude» — timeline (1920x1080). Erasable-only TS so Node can import it.
export const FPS = 60;
export const TAIL = 3.2;

export const norm = (w: string) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

// voice word -> on-screen word (same token count; '' hides a token in subtitles)
const ONE: [RegExp, string][] = [
  [/^клод(у|а|ом)?$/i, 'Claude'], [/^илевенлабс$/i, 'ElevenLabs'], [/^фигм(а|е|у)$/i, 'Figma'], [/^канва$/i, 'Canva'],
  [/^видайкью$/i, 'vidIQ'], [/^ноушн$/i, 'Notion'], [/^гитхаб$/i, 'GitHub'], [/^ютуб(а)?$/i, 'YouTube'], [/^ремоушн$/i, 'Remotion'],
  [/^пэ-дэ-эф$/i, 'PDF'], [/^ворд$/i, 'Word'], [/^пауэрпоинт$/i, 'PowerPoint'], [/^гугле$/i, 'Google'],
];
const PAIR: [string, string, string][] = [['брэг', 'слим', 'brag-slim'], ['дип', 'ресерч', 'deep-research'], ['афтер', 'эффектс', 'After Effects']];
export function display(words: string[]) {
  const split = (w: string) => { const core = w.replace(/^[«"(]+|[»".,:;!?)—]+$/g, ''); const i = w.indexOf(core); return [w.slice(0, i), core, w.slice(i + core.length)]; };
  const out = words.map((w) => { const [pre, core, post] = split(w); for (const [re, rep] of ONE) if (re.test(core)) return pre + rep + post; return w; });
  for (let i = 0; i + 1 < words.length; i++) {
    for (const [a, b, rep] of PAIR) if (norm(words[i]) === a && norm(words[i + 1]) === b) { out[i] = rep + split(words[i + 1])[2]; out[i + 1] = ''; }
    if (norm(words[i]) === 'скилл' && norm(words[i + 1]) === 'криэйтор') { out[i] = 'skill-creator' + split(words[i + 1])[2]; out[i + 1] = ''; }
    if (out[i].startsWith('Claude') && norm(words[i + 1]).startsWith('код')) { out[i] = 'Claude'; out[i + 1] = 'Code' + split(words[i + 1])[2]; }
  }
  return out;
}

export function tokens(lines: { id: string; text: string }[]) {
  const out: any[] = [];
  lines.forEach((l, si) => { const ws = l.text.split(/\s+/).filter((w) => norm(w)); const ds = display(ws); ws.forEach((w, k) => out.push({ w, d: ds[k], n: norm(w), si, id: l.id })); });
  return out;
}

export const ACC: Record<string, string> = {
  h: '#ff8a4c', ex: '#ff8a4c', t1: '#9aa6ff', t2: '#b07bff', t3: '#22d3d8', t4: '#4f8cff', t5: '#e8e6e3', t6: '#3fb950',
  mid: '#3aa7e8', t7: '#ff7a45', t8: '#ff5f57', t9: '#ff8a4c', t10: '#38bdf8', bn: '#4f8cff', top: '#ffb347', en: '#3aa7e8',
};

export function buildTools(lines: { id: string; text: string }[], words: { s: number; e: number }[]) {
  const sc = lines.map((l) => ({ ...l, tokens: [] as any[], start: 0, end: 0, vEnd: 0 }));
  const tok = tokens(lines);
  tok.forEach((t) => sc[t.si].tokens.push(t));
  if (words && words.length === tok.length) tok.forEach((t, i) => { t.s = words[i].s; t.e = words[i].e; });
  else { let x = .6; tok.forEach((t) => { const d = .06 * t.n.length + .1; t.s = x; t.e = x + d; x += d + .04; if (/[.!?…]$/.test(t.w)) x += .4; }); }
  const voEnd = tok[tok.length - 1].e;
  const duration = Math.ceil((voEnd + TAIL) * 10) / 10;
  sc.forEach((s, i) => {
    s.vEnd = s.tokens.at(-1).e;
    if (!i) return;
    const prevEnd = sc[i - 1].tokens.at(-1).e, first = s.tokens[0].s;
    s.start = Math.max(prevEnd + .12, first - .5);
  });
  sc.forEach((s, i) => { s.end = i < sc.length - 1 ? sc[i + 1].start : duration; });
  const S = (id: string) => sc.find((x) => x.id === id)!;
  const W = (sid: string, pre: string, nth = 0, edge: 's' | 'e' = 's') => {
    const s = S(sid), p = norm(pre);
    let h = s.tokens.filter((t) => t.n === p); if (!h.length) h = s.tokens.filter((t) => t.n.startsWith(p));
    if (!h.length) throw new Error('cue ' + sid + ' ' + pre);
    return h[Math.min(nth, h.length - 1)][edge];
  };
  const C: Record<string, number> = {
    hAsk: W('h', 'прошу'), hMake: W('h', 'сделай'), hGet: W('h', 'получаю'), hText: W('h', 'текст'), hTip: W('h', 'совет'), hNow: W('h', 'теперь'), hTools: W('h', 'инструментами'),
    hReady: W('h', 'готовый'), hAnim: W('h', 'анимация'), hVoice: W('h', 'озвучка'), hMusic: W('h', 'музыка'), hDiff: W('h', 'разница'), hTen: W('h', 'десяти'), hFirst: W('h', 'первым'),
    hShow: W('h', 'сегодня'), hAll: W('h', 'десять'), hEleven: W('h', 'одиннадцатую'), hSelf: W('h', 'сделал'), hNot: W('h', 'и', 1), hWill: W('h', 'будет'),
    exWords: W('ex', 'слова'), exConn: W('ex', 'коннекторы'), exHands: W('ex', 'руки'), exVia: W('ex', 'через'), exVoice: W('ex', 'озвучку'), exDesign: W('ex', 'дизайн'), exYT: W('ex', 'ютуб'),
    exSkills: W('ex', 'скиллы'), exInstr: W('ex', 'инструкции'), exPro: W('ex', 'профи'), exNewb: W('ex', 'новичок'), exWithout: W('ex', 'без'), exEmpty: W('ex', 'пустой'), exAdv: W('ex', 'советует'), exWith: W('ex', 'с'), exDo: W('ex', 'делает', 1),
    t1n: W('t1', 'илевенлабс'), t1Role: W('t1', 'озвучка'), t1Write: W('t1', 'пишет'), t1Pick: W('t1', 'выбирает'), t1Speak: W('t1', 'озвучивает'), t1Hear: W('t1', 'голос', 1), t1Free: W('t1', 'бесплатно'), t1Num: W('t1', 'десяти'), t1Enough: W('t1', 'хватает'),
    t2n: W('t2', 'фигма'), t2Cov: W('t2', 'обложки'), t2Ban: W('t2', 'баннеры'), t2Des: W('t2', 'дизайн'), t2Write: W('t2', 'пишешь'), t2Build: W('t2', 'собирает'), t2Layers: W('t2', 'слоям'), t2Fix: W('t2', 'поправить'),
    t3n: W('t3', 'канва'), t3If: W('t3', 'если'), t3Easy: W('t3', 'проще'), t3Posts: W('t3', 'посты'), t3Stories: W('t3', 'сторис'), t3Pres: W('t3', 'презентации'), t3Desc: W('t3', 'описываешь'), t3Build: W('t3', 'собирает'),
    t4n: W('t4', 'видайкью'), t4An: W('t4', 'аналитика'), t4Look: W('t4', 'смотрит'), t4Shot: W('t4', 'выстрелили'), t4Cov: W('t4', 'обложки'), t4Titles: W('t4', 'названия'), t4Tags: W('t4', 'теги'), t4Mine: W('t4', 'обложку'), t4Found: W('t4', 'нашел'),
    t5n: W('t5', 'ноушн'), t5Base: W('t5', 'база'), t5Ideas: W('t5', 'идеи'), t5Plan: W('t5', 'контентплан'), t5Scr: W('t5', 'сценарии'), t5Writes: W('t5', 'записывает'), t5Next: W('t5', 'следующий'), t5Cont: W('t5', 'продолжает'),
    t6n: W('t6', 'гитхаб'), t6Keep: W('t6', 'хранит'), t6Ver: W('t6', 'версию'), t6Broke: W('t6', 'сломал'), t6Back: W('t6', 'откатился'), t6Sec: W('t6', 'секунду'), t6All: W('t6', 'все'),
    midDone: W('mid', 'коннекторы'), midHow: W('mid', 'подключить'), midSteps: W('mid', 'шагам'), midShots: W('mid', 'скриншотами'), midPrompt: W('mid', 'промптом'), midSheet: W('mid', 'шпаргалку'), midTg: W('mid', 'она'), midNext: W('mid', 'дальше'), midInt: W('mid', 'интересное'),
    t7n: W('t7', 'брэг'), t7Give: W('t7', 'даешь'), t7Link: W('t7', 'ссылку'), t7Make: W('t7', 'делает'), t7Hook: W('t7', 'хуком'), t7Beat: W('t7', 'музыкой'), t7Post: W('t7', 'текстом'),
    t8n: W('t8', 'документы'), t8Pdf: W('t8', 'пэдээф'), t8Word: W('t8', 'ворд'), t8Ppt: W('t8', 'пауэрпоинт'), t8Guides: W('t8', 'гайды'), t8Pres: W('t8', 'презентации'), t8Tables: W('t8', 'таблицы'), t8File: W('t8', 'готовым'), t8Sheet: W('t8', 'шпаргалку'),
    t9n: W('t9', 'криэйтор'), t9Meta: W('t9', 'делает'), t9Expl: W('t9', 'объясняешь'), t9Once: W('t9', 'один'), t9Save: W('t9', 'сохраняет'), t9Skill: W('t9', 'навык'), t9Next: W('t9', 'следующий'), t9Cmd: W('t9', 'одной'),
    t10n: W('t10', 'дип'), t10Deep: W('t10', 'глубокий'), t10Reads: W('t10', 'читает'), t10Src: W('t10', 'источников'), t10Rep: W('t10', 'собирает'), t10Links: W('t10', 'ссылками'), t10Hour: W('t10', 'вместо'), t10Mins: W('t10', 'пара'),
    bnBonus: W('bn', 'бонус'), bnCC: W('bn', 'клод'), bnRem: W('bn', 'ремоушн'), bnMode: W('bn', 'режим'), bnWrites: W('bn', 'пишет'), bnFiles: W('bn', 'файлы'), bnRem2: W('bn', 'ремоушн', 1), bnFree: W('bn', 'бесплатная'), bnTurns: W('bn', 'превращает'), bnVideo: W('bn', 'видео'), bnWhole: W('bn', 'весь'), bnNoAE: W('bn', 'без'),
    topThree: W('top', 'три'), topEL: W('top', 'илевенлабс'), topSC: W('top', 'скилл'), topCC: W('top', 'клод'), topAdv: W('top', 'советует'), topDo: W('top', 'делает'),
    enEleven: W('en', 'одиннадцатый'), enOwn: W('en', 'собственный'), enProc: W('en', 'процесс'), enRef: W('en', 'референса'), enReady: W('en', 'готового'), enSend: W('en', 'скидываешь'), enMakes: W('en', 'делает'), enStyle: W('en', 'стиле'),
    enNoShow: W('en', 'показывать'), enWont: W('en', 'не'), enSheet: W('en', 'скилл', 1), enPinned: W('en', 'закрепленном'), enTg: W('en', 'телеграмканала'), enLink: W('en', 'ссылка'), enComment: W('en', 'комментарии'), enSub: W('en', 'подпишись'), enNext: W('en', 'следующий'),
  };
  // showcase window of each tool scene: from the last word to the scene end
  const SH: Record<string, [number, number]> = {};
  sc.forEach((s) => { SH[s.id] = [s.vEnd + .15, s.end]; });

  const sfx: { t: number; k: string; g?: number }[] = [];
  const P = (t: number, k: string, g = 1) => sfx.push({ t, k, g });
  sc.forEach((s, i) => { if (i) P(s.start - .28, 'whoosh'); });
  // hook
  P(C.hAsk + .05, 'click'); for (let x = C.hAsk + .2; x < C.hAsk + 1.15; x += .075) P(x, 'key'); P(C.hGet - .25, 'send'); for (let x = C.hGet + .1; x < C.hTip + 1.2; x += .09) P(x, 'data', .7);
  P(C.hText + .05, 'thud'); P(C.hTools - .1, 'riser'); [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((k) => P(C.hTools + .1 + k * .07, 'pop', .7)); P(C.hReady, 'boom', .7); [C.hAnim, C.hVoice, C.hMusic].forEach((x) => P(x, 'ui2'));
  P(C.hTen - .05, 'impact'); for (let k = 0; k < 10; k++) P(C.hShow + .15 + k * .085, 'tick'); P(C.hEleven, 'shimmer'); P(C.hWill - .05, 'lock');
  // explain
  P(C.exWords, 'pop'); P(C.exWords + .35, 'pop'); P(C.exHands, 'zap'); [C.exVoice, C.exDesign, C.exYT].forEach((x) => P(x, 'drop')); P(C.exSkills, 'swish'); P(C.exInstr, 'paper'); P(C.exPro, 'toggle'); P(C.exEmpty, 'thud'); P(C.exDo, 'impact');
  // tools: intro hit on the name, then demo beats
  ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10'].forEach((id) => { const n = C[id + 'n']; P(n - .45, 'riser', .6); P(n, 'impact', .8); P(n + .25, 'tick', .8); });
  P(C.t1Write + .05, 'click'); for (let x = C.t1Write + .15; x < C.t1Write + 1; x += .07) P(x, 'key'); P(C.t1Pick, 'ui2'); P(C.t1Speak, 'send'); P(C.t1Hear, 'shimmer'); P(C.t1Free, 'coin'); P(C.t1Enough, 'pop');
  P(C.t2Cov, 'pop'); P(C.t2Ban, 'pop'); P(C.t2Des, 'pop'); for (let x = C.t2Write; x < C.t2Write + .9; x += .07) P(x, 'key'); [0, 1, 2, 3, 4].forEach((k) => P(C.t2Build + k * .42, 'ui', .9)); P(C.t2Fix + .2, 'swish');
  P(C.t3Easy, 'ui2'); [C.t3Posts, C.t3Stories, C.t3Pres].forEach((x) => P(x, 'drop')); for (let x = C.t3Desc; x < C.t3Desc + .9; x += .07) P(x, 'key'); [0, 1, 2, 3].forEach((k) => P(C.t3Build + .1 + k * .3, 'pop', .8));
  P(C.t4Look, 'swish'); P(C.t4Shot, 'boom', .5); [0, 1, 2].forEach((k) => P(C.t4Shot + .1 + k * .12, 'pop', .8)); P(C.t4Cov, 'ui'); P(C.t4Titles, 'ui'); for (let k = 0; k < 8; k++) P(C.t4Tags + k * .08, 'tick', .7); P(C.t4Found, 'swish');
  P(C.t5Base, 'paper'); [0, 1, 2].forEach((k) => P(C.t5Ideas + k * .2, 'pop', .8)); for (let x = C.t5Writes; x < C.t5Writes + 1.4; x += .07) P(x, 'key'); P(C.t5Cont, 'ui2');
  P(C.t6Ver, 'tick'); P(C.t6Broke, 'glitch'); P(C.t6Back + .1, 'click'); P(C.t6Back + .3, 'rewind'); P(C.t6Sec, 'ding'); P(C.t6All, 'drop');
  P(C.midDone, 'ding'); [C.midSteps, C.midShots, C.midPrompt].forEach((x) => P(x, 'tick')); P(C.midSheet, 'paper'); P(C.midTg, 'pop'); P(C.midNext, 'riser', .7); P(C.midInt, 'impact');
  for (let x = C.t7Give - .2; x < C.t7Give + .7; x += .07) P(x, 'key'); P(C.t7Make, 'send'); [C.t7Hook, C.t7Beat, C.t7Post].forEach((x) => P(x, 'ui2'));
  [C.t8Pdf, C.t8Word, C.t8Ppt].forEach((x) => P(x, 'drop')); [C.t8Guides, C.t8Pres, C.t8Tables].forEach((x) => P(x, 'paper', .8)); P(C.t8File, 'ding'); P(C.t8Sheet, 'swish');
  for (let x = C.t9Expl; x < C.t9Expl + 1.1; x += .07) P(x, 'key'); P(C.t9Save, 'send'); for (let x = C.t9Save + .3; x < C.t9Save + 1.5; x += .09) P(x, 'data', .7); P(C.t9Skill, 'ding'); P(C.t9Cmd, 'click');
  for (let x = C.t10Reads; x < C.t10Rep; x += .1) P(x, 'data'); P(C.t10Rep, 'paper'); P(C.t10Links, 'ui2'); P(C.t10Hour, 'thud', .7); P(C.t10Mins, 'ding');
  P(C.bnBonus, 'impact'); for (let x = C.bnWrites; x < C.bnWrites + 1.6; x += .065) P(x, 'key', .8); P(C.bnTurns, 'riser', .6); P(C.bnVideo, 'boom', .6); P(C.bnWhole, 'shimmer'); P(C.bnNoAE + .2, 'slash');
  P(C.topThree, 'tick'); [C.topEL, C.topSC, C.topCC].forEach((x) => P(x, 'drop')); P(C.topDo, 'impact');
  P(C.enEleven, 'riser', .8); P(C.enEleven + .4, 'impact'); P(C.enOwn, 'shimmer'); for (let k = 0; k < 6; k++) P(C.enProc + .2 + k * .32, 'tick'); P(C.enSend, 'swish'); P(C.enNoShow + .2, 'click'); P(C.enWont, 'denied'); P(C.enPinned, 'pop'); P(C.enLink, 'drop'); P(C.enSub + .15, 'click'); P(C.enSub + .3, 'ding');
  return { sc, tok, C, SH, duration, voEnd, sfx: sfx.filter((e) => e.t >= 0 && e.t < duration).sort((a, b) => a.t - b.t) };
}
