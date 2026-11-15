import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, delayRender, continueRender } from 'remotion';
import { buildV3, FPS } from './timeline';
import words from './words.json';
import meta from './meta.json';

export const V = buildV3(words as any, (meta as any).lead || 0);
const { sc: SC, C, duration: DUR } = V;
const S = (id: string) => SC.find((x) => x.id === id);
const M = meta as any;

// ---------- fonts: Onest (UI/headlines), Source Serif 4 (wordmark), JetBrains Mono (code)
const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
if (typeof document !== 'undefined' && !(window as any).__v3Fonts) {
  (window as any).__v3Fonts = true;
  const h = delayRender('fonts');
  const faces: Promise<any>[] = [];
  for (const [sub, rng] of [['cyrillic', CYR], ['latin', LAT]]) {
    for (const w of ['300', '400', '500', '600']) faces.push(new FontFace('Onest', `url(${staticFile(`fonts/onest-${sub}-${w}-normal.woff2`)})`, { weight: w, unicodeRange: rng }).load().then((f) => (document as any).fonts.add(f)));
    for (const w of ['400', '500']) faces.push(new FontFace('Source Serif 4', `url(${staticFile(`fonts/source-serif-4-${sub}-${w}-normal.woff2`)})`, { weight: w, unicodeRange: rng }).load().then((f) => (document as any).fonts.add(f)));
  }
  faces.push((document as any).fonts.load('500 40px "JetBrains Mono"'));
  Promise.all(faces).then(() => continueRender(h)).catch(() => continueRender(h));
}

// ---------- palette & helpers
const BG = '#0d0b0a', OR = '#ee7a3f', OR2 = '#ff9d5c', CL = '#d97757', TX = '#efe9e2', MU = '#8d857c', PANEL = '#1c1a18', BORD = '#3b3632';
const SANS = 'Onest, sans-serif', SERIF = '"Source Serif 4", serif', MONO = '"JetBrains Mono", monospace';
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eo = (k: number) => 1 - Math.pow(1 - k, 3);
const ex = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
const ei = (k: number) => k * k * k;
const eio = (k: number) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const back = (k: number) => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const pr = (t: number, a: number, d = .4) => clamp((t - a) / d);
const decay = (t: number, a: number, r = 6) => (t < a ? 0 : Math.exp(-(t - a) * r));
const noise = (t: number, f: number, p = 0) => Math.sin(t * f + p) * .6 + Math.sin(t * f * 2.31 + p * 1.7) * .4;
const kf = (t: number, keys: [number, number][], ease = eio) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return lerp(va, vb, ease(clamp((t - a) / Math.max(1e-3, b - a)))); }
  return keys[keys.length - 1][1];
};
type Pt = [number, number];

// ---------- shared pieces
const Grain: React.FC<{ f: number; o?: number }> = ({ f, o = .07 }) => <Img src={staticFile(`cine/grain/g${f % 6}.png`)} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: o * 1.6, mixBlendMode: 'overlay', pointerEvents: 'none' }} />;
const Vignette: React.FC<{ o?: number }> = ({ o = .7 }) => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 48%, transparent 55%, rgba(0,0,0,.9) 100%)', opacity: o, pointerEvents: 'none' }} />;
const Horizon: React.FC<{ t: number; y?: number; o?: number }> = ({ t, y = 1380, o = 1 }) => (<>
  <div style={{ position: 'absolute', left: -520, top: y, width: 2120, height: 1300, borderRadius: '50%', background: 'radial-gradient(closest-side, #ffa15e 0%, #f0702c 38%, #b8420f 64%, rgba(90,25,5,.4) 82%, transparent 100%)', filter: 'blur(46px)', opacity: o, transform: `scaleX(${1 + .03 * Math.sin(t * .6)}) translateY(${Math.sin(t * .4) * 10}px)` }} />
  <div style={{ position: 'absolute', left: 140, top: y - 40, width: 800, height: 300, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,170,110,.55), transparent)', filter: 'blur(40px)', opacity: o * (.7 + .3 * Math.sin(t * 1.3)) }} />
</>);
// orange glow from the top edge (like the reference)
const TopGlow: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => (<>
  <div style={{ position: 'absolute', left: -400, top: -900, width: 1880, height: 1300, borderRadius: '50%', background: 'radial-gradient(closest-side, #ff8a3d 0%, #d4561b 40%, rgba(120,35,8,.5) 70%, transparent 100%)', filter: 'blur(50px)', opacity: o * (.85 + .15 * Math.sin(t * .9)) }} />
  <AbsoluteFill style={{ background: 'repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 3px, transparent 3px 60px)', opacity: o * .5, WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 30%)' }} />
</>);
const Orb: React.FC<{ t: number; path: (t: number) => Pt; size?: number; trail?: number; o?: number }> = ({ t, path, size = 18, trail = 10, o = 1 }) => (<>
  {Array.from({ length: trail }, (_, j) => { const i = trail - 1 - j, [x, y] = path(t - i * .011), s = size * (1 - i / trail * .4);
    return <div key={i} style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', opacity: o * (i ? .4 * (1 - i / trail) : 1), background: i ? OR2 : '#fff3e6', filter: i ? 'blur(3px)' : 'none', boxShadow: i ? 'none' : `0 0 ${size}px ${size / 2.5}px ${OR}, 0 0 ${size * 4}px ${size * 1.3}px rgba(255,120,50,.4)` }} />; })}
</>);
const Words: React.FC<{ t: number; toks: any[]; hi?: string[]; style?: React.CSSProperties; hiColor?: string; under?: boolean; strike?: string[]; strikeAt?: number }> = ({ t, toks, hi = [], style, hiColor = OR, under = true, strike = [], strikeAt = 1e9 }) => (
  <div style={style}>{toks.map((tk, i) => {
    const k = ex(pr(t, tk.s - .06, .45)), isHi = hi.includes(tk.n), isSt = strike.includes(tk.n);
    return <span key={i} style={{ display: 'inline-block', position: 'relative', marginRight: '.24em', opacity: k, filter: k < .99 ? `blur(${(1 - k) * 16}px)` : 'none', transform: `translateY(${(1 - k) * 18}px)`, color: isHi ? hiColor : undefined }}>
      {tk.w}
      {isHi && under && <svg style={{ position: 'absolute', left: 0, bottom: '-.18em', width: '100%', height: '.3em', overflow: 'visible' }} viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M2 7 C30 2, 70 2, 98 6" stroke={hiColor} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eo(pr(t, tk.e - .05, .4))} style={{ strokeWidth: 4 }} /></svg>}
      {isSt && <div style={{ position: 'absolute', left: '-4%', top: '52%', width: '108%', height: 5, borderRadius: 3, background: OR, transformOrigin: 'left', transform: `scaleX(${eo(pr(t, strikeAt, .35))}) rotate(-2deg)` }} />}
    </span>; })}</div>
);
const toksOf = (id: string, from = 0, to = 999) => S(id).tokens.slice(from, to);
const MB: React.FC<{ id: string; sx: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, sx, children, style }) => (
  <div style={{ ...style, filter: sx > .4 ? `url(#${id})` : 'none' }}><svg width={0} height={0} style={{ position: 'absolute' }}><filter id={id} x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation={`${sx} 0`} /></filter></svg>{children}</div>
);
const CA: React.FC<{ d: number; children: React.ReactNode; color?: string }> = ({ d, children, color = TX }) => (
  <div style={{ position: 'relative', isolation: 'isolate' }}>
    <div style={{ position: 'absolute', inset: 0, color: '#ff4d3d', transform: `translateX(${d}px)`, mixBlendMode: 'screen', opacity: .7 }}>{children}</div>
    <div style={{ position: 'absolute', inset: 0, color: '#38d4ff', transform: `translateX(${-d}px)`, mixBlendMode: 'screen', opacity: .7 }}>{children}</div>
    <div style={{ position: 'relative', color }}>{children}</div>
  </div>
);
// own spark drawing in Claude colors; rays can "breathe"
const RAYS = [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331].map((a, i) => ({ a, l: [92, 80, 96, 84, 90, 78, 95, 82, 92, 79, 97, 85][i] }));
const Spark: React.FC<{ size: number; color?: string; stroke?: number; t?: number; breathe?: number }> = ({ size, color = CL, stroke = 17, t = 0, breathe = 0 }) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ display: 'block', overflow: 'visible' }}>
    {RAYS.map((r, i) => { const a = r.a * Math.PI / 180, l = r.l * (1 + breathe * .14 * Math.sin(t * 6 + i * 1.3)); return <line key={i} x1={Math.cos(a) * 8} y1={Math.sin(a) * 8} x2={Math.cos(a) * l} y2={Math.sin(a) * l} stroke={color} strokeWidth={stroke} strokeLinecap="round" />; })}
  </svg>
);
const Spark3D: React.FC<{ size: number; ry: number; rx: number; rz: number }> = ({ size, ry, rx, rz }) => (
  <div style={{ width: size, height: size, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
    {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateZ(${-i * 2.2}px)` }}><Spark size={size} color={i === 0 ? CL : i < 3 ? '#c4643f' : '#8f3e1f'} /></div>)}
    <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(1px)', mixBlendMode: 'screen', opacity: .35 }}><Spark size={size} color="#ffd2b5" stroke={6} /></div>
  </div>
);
const Cam: React.FC<{ tf: string; origin?: string; children: React.ReactNode }> = ({ tf, origin = '50% 50%', children }) => (
  <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: origin }}><AbsoluteFill style={{ transform: tf, transformOrigin: origin, transformStyle: 'preserve-3d' }}>{children}</AbsoluteFill></AbsoluteFill>
);
const Sub: React.FC<{ t: number; id: string; dark?: boolean; top?: number }> = ({ t, id, dark, top = 1610 }) => (
  <Words t={t} toks={toksOf(id)} hi={['claude']} under={false} style={{ position: 'absolute', left: 70, right: 70, top, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 48, lineHeight: 1.28, color: dark ? '#3c3631' : '#ded7ce', textShadow: dark ? 'none' : '0 2px 20px rgba(0,0,0,.6)' }} />
);
// mouse cursor (arrow / pointing hand) with click press + ripple
const Cursor: React.FC<{ t: number; x: number; y: number; hand?: boolean; clicks: number[]; o?: number }> = ({ t, x, y, hand, clicks, o = 1 }) => {
  const press = Math.max(0, ...clicks.map((c) => (t >= c && t < c + .16 ? Math.sin(Math.PI * (t - c) / .16) : 0)));
  const rip = clicks.map((c) => pr(t, c, .45)).find((k, i) => t >= clicks[i] && k < 1);
  return <div style={{ position: 'absolute', left: x, top: y, opacity: o, pointerEvents: 'none' }}>
    {rip !== undefined && <div style={{ position: 'absolute', left: -50 * eo(rip), top: -50 * eo(rip), width: 100 * eo(rip), height: 100 * eo(rip), borderRadius: '50%', border: `4px solid rgba(255,190,150,${1 - rip})` }} />}
    <div style={{ transform: `scale(${1 - .18 * press})`, transformOrigin: hand ? '30% 5%' : '0 0', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.55))' }}>
      {hand ? <svg width={64} height={72} viewBox="0 0 32 36" style={{ marginLeft: -18, marginTop: -2 }}><path d="M11 3.5a2.5 2.5 0 0 1 5 0V15l1-.2V12a2.4 2.4 0 0 1 4.8 0v3.4l1-.1v-2a2.4 2.4 0 0 1 4.8 0v3l.6.1V16a2.3 2.3 0 0 1 4.6 0v8.5C32.8 31 28.6 35 22.5 35H19c-3.7 0-6-1.6-7.9-4.6L5.4 21.3a2.4 2.4 0 0 1 3.9-2.8l1.7 2.1z" fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinejoin="round" /></svg>
        : <svg width={50} height={72} viewBox="0 0 25 36"><path d="M1.5 1.5v28l7-6.2 4.6 10.8 4.6-2-4.6-10.6h9.4z" fill="#fff" stroke="#111" strokeWidth={1.8} strokeLinejoin="round" /></svg>}
    </div>
  </div>;
};
const curPos = (t: number, keys: [number, number, number][]): Pt => [kf(t, keys.map((k) => [k[0], k[1]] as [number, number])), kf(t, keys.map((k) => [k[0], k[2]] as [number, number]))];

// ---------- scenes A, B (hook)
const Scene: React.FC<{ t: number; from: string; to?: string; bg: string; inBlur?: boolean; outBlur?: boolean; children: React.ReactNode }> = ({ t, from, to, bg, inBlur = true, outBlur = true, children }) => {
  const s = S(from), e = S(to || from), ki = pr(t, s.start, .38), ko = outBlur ? pr(t, e.end - .28, .28) : 0;
  const blur = (inBlur ? (1 - ex(ki)) * 30 : 0) + ei(ko) * 34;
  return <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
    <AbsoluteFill style={{ filter: blur > .3 ? `blur(${blur}px)` : 'none', transform: `scale(${(inBlur ? lerp(1.12, 1, ex(ki)) : 1) * lerp(1, 1.08, ei(ko))})`, opacity: Math.min(inBlur ? clamp(ki * 2.5) : 1, 1 - ei(ko) * .6) }}>{children}</AbsoluteFill>
  </AbsoluteFill>;
};
const A: React.FC<{ t: number }> = ({ t }) => {
  const s = S('a'), lt = t - s.start, open = pr(t, 0, .5);
  const path = (x: number): Pt => { const k = eio(clamp((x - .2) / (s.end - .4))); return [lerp(170, 930, k), 760 - Math.sin(k * Math.PI) * 120 + k * 260]; };
  return <Scene t={t} from="a" bg={BG} inBlur={false}>
    <Cam tf={`scale(${1 + lt * .018}) translateY(${-lt * 6}px)`}>
      <Horizon t={t} y={1340} o={open} />
      <Orb t={t} path={path} o={open} />
      <Words t={t} toks={toksOf('a')} hi={['недели']} style={{ position: 'absolute', left: 90, right: 90, top: 790, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: 72, lineHeight: 1.28, color: TX, letterSpacing: -1.5 }} />
    </Cam>
    <AbsoluteFill style={{ background: '#000', opacity: 1 - open }} />
  </Scene>;
};
const B: React.FC<{ t: number }> = ({ t }) => {
  const s = S('b');
  const rows: [string, number, number, number][] = [['Теперь —', C.bNow, 140, 580], ['один', C.bOne, 250, 750], ['промпт.', C.bPrompt, 250, 1000]];
  const camS = kf(t, [[s.start, 1.35], [s.start + .7, 1], [s.end, 1.07]], ex), camR = kf(t, [[s.start, -4], [s.start + .7, 0]], ex);
  const disc = ex(pr(t, C.bNow - .2, .8));
  return <Scene t={t} from="b" bg={BG}>
    <Cam tf={`scale(${camS}) rotate(${camR}deg)`}>
      <Horizon t={t} y={kf(t, [[s.start, 1340], [s.start + .8, 1620]], ex)} o={.8} />
      <div style={{ position: 'absolute', left: 540 - 90 * disc + noise(t, .5) * 20, top: 310 - 90 * disc, width: 180 * disc, height: 180 * disc, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #ffb27a, #e8692c 60%, #b6481a)', filter: 'blur(5px)', boxShadow: '0 0 120px 40px rgba(238,122,63,.35)' }} />
      {rows.map(([txt, at, fs, y], i) => { const k = ex(pr(t, at - .08, .55)), v = 1 - k;
        return <MB key={i} id={`mbB${i}`} sx={v * 60} style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: fs, letterSpacing: -fs * .05, lineHeight: 1, transform: `translateX(${v * 700}px)`, opacity: clamp(k * 3) }}>
          <CA d={2 + v * 26 + 2 * decay(t, at, 3)} color={i === 2 ? OR2 : TX}>{txt}</CA></MB>; })}
    </Cam>
    <Vignette o={.6} />
  </Scene>;
};

// ---------- C/D/E: one continuous "app" sequence driven by a cursor
const APPS: { n: string; bg: string; g: React.ReactNode }[] = [
  { n: 'Заметки', bg: 'linear-gradient(160deg,#fff6c9,#f5d55b)', g: <svg width={80} height={80} viewBox="0 0 40 40"><path d="M8 12h24M8 20h24M8 28h16" stroke="#8a6a12" strokeWidth={3} strokeLinecap="round" /></svg> },
  { n: 'Музыка', bg: 'linear-gradient(160deg,#ff7a9a,#e23d64)', g: <svg width={70} height={70} viewBox="0 0 40 40"><path d="M15 30V10l16-4v20" stroke="#fff" strokeWidth={3.2} fill="none" /><circle cx={11} cy={30} r={5} fill="#fff" /><circle cx={27} cy={26} r={5} fill="#fff" /></svg> },
  { n: 'Claude', bg: 'linear-gradient(160deg,#e58a6a,#c9603e)', g: <Spark size={92} color="#fff4ec" stroke={15} /> },
  { n: 'Почта', bg: 'linear-gradient(160deg,#6ab8ff,#2c7be5)', g: <svg width={80} height={80} viewBox="0 0 40 40"><rect x={6} y={10} width={28} height={20} rx={4} fill="none" stroke="#fff" strokeWidth={3} /><path d="M7 12l13 10 13-10" stroke="#fff" strokeWidth={3} fill="none" /></svg> },
  { n: 'Фото', bg: 'linear-gradient(160deg,#ffffff,#e9e9ee)', g: <svg width={80} height={80} viewBox="0 0 40 40">{['#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#bf5af2', '#ff375f'].map((c, i) => <ellipse key={i} cx={20} cy={11} rx={5} ry={9} fill={c} opacity={.85} transform={`rotate(${i * 60} 20 20)`} />)}</svg> },
  { n: 'Терминал', bg: 'linear-gradient(160deg,#3a3a3c,#1c1c1e)', g: <svg width={80} height={80} viewBox="0 0 40 40"><path d="M9 13l7 7-7 7M19 28h12" stroke="#e5e5e7" strokeWidth={3} fill="none" strokeLinecap="round" /></svg> },
  { n: 'Файлы', bg: 'linear-gradient(160deg,#7cc4ff,#3a8ee6)', g: <svg width={80} height={80} viewBox="0 0 40 40"><path d="M6 12h11l3 3h14v15H6z" fill="#e8f4ff" /></svg> },
  { n: 'Настройки', bg: 'linear-gradient(160deg,#a1a1a6,#636366)', g: <svg width={80} height={80} viewBox="0 0 40 40"><circle cx={20} cy={20} r={7} fill="none" stroke="#fff" strokeWidth={3} />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={20} y1={6} x2={20} y2={10} stroke="#fff" strokeWidth={3.4} strokeLinecap="round" transform={`rotate(${i * 45} 20 20)`} />)}</svg> },
];
const iconXY = (i: number): Pt => [110 + (i % 4) * 230, 700 + Math.floor(i / 4) * 290];
const MODES = [['✦', 'Создать'], ['✎', 'Написать'], ['</>', 'Код'], ['◎', 'Учёба'], ['◇', 'Жизнь']];
const modeXY = (i: number): Pt => (i < 3 ? [[80, 760], [370, 760], [720, 760]][i] : [[230, 880], [560, 880]][i - 3]) as Pt;
const PROMPT = 'Сделай вертикальный моушен-ролик про ИИ-анимацию: тёмный фон, оранжевое свечение, плавные переходы и музыка в такт.';
const FILES = [{ n: 'сценарий.txt', c: '#f4efe8', k: 'doc' }, { n: 'референсы', c: '#2b2724', k: 'img' }, { n: 'музыка.mp3', c: '#2b2724', k: 'aud' }];
const FileGlyph: React.FC<{ k: string; s?: number }> = ({ k, s = 1 }) => (
  k === 'doc' ? <svg width={34 * s} height={40 * s} viewBox="0 0 34 40"><path d="M4 2h18l8 8v28H4z" fill="#fff" stroke="#c9c2b9" strokeWidth={2} /><path d="M9 16h16M9 22h16M9 28h10" stroke={OR} strokeWidth={2.4} strokeLinecap="round" /></svg>
    : k === 'img' ? <div style={{ position: 'relative', width: 52 * s, height: 40 * s }}>{['#e8692c', '#5a7ad6', '#2bb3a2'].map((c, i) => <div key={i} style={{ position: 'absolute', left: i * 9 * s, top: (2 - i) * 2 * s, width: 32 * s, height: 36 * s, borderRadius: 6 * s, background: `linear-gradient(160deg, ${c}, #1b1816)`, border: '2px solid #f4efe8', transform: `rotate(${(i - 1) * 8}deg)` }} />)}</div>
      : <svg width={40 * s} height={40 * s} viewBox="0 0 40 40">{[10, 22, 14, 30, 18, 26, 12].map((h, i) => <rect key={i} x={3 + i * 5} y={20 - h / 2} width={3} height={h} rx={1.5} fill={OR2} />)}</svg>
);

const App: React.FC<{ t: number }> = ({ t }) => {
  const sC = S('c'), sE = S('e');
  const open = ex(pr(t, C.cOpen, .55)), home = pr(t, C.cHome - .25, .4), inApp = t >= C.cOpen + .3;
  const [ix, iy] = iconXY(2);
  // phase: chat input appears with D
  const chat = ex(pr(t, S('d').start - .1, .5));
  const menu = t >= C.dPlus + .05 && t < C.dFiles[0] + .1 ? pr(t, C.dPlus + .05, .3) : 0;
  const fileK = C.dFiles.map((x) => pr(t, x - .25, .55));
  const typeEnd = C.eSend - .45, typed = PROMPT.slice(0, Math.round(PROMPT.length * pr(t, C.eType, Math.max(.6, typeEnd - C.eType))));
  const sent = t >= C.eSend;
  // camera: wide on desktop -> app; E zooms into the text so it can be read, then eases out for the send click
  const z = kf(t, [[sC.start, 1.08], [C.cClick, 1.0], [S('d').start, 1.0], [S('d').start + .6, 1.1], [C.eType, 1.1], [C.eType + .6, 1.07], [C.eSend - .7, 1.07], [C.eSend - .3, 1.08], [sE.end, 1.12]]);
  const cy = kf(t, [[S('d').start, 0], [C.eType, 0], [C.eType + .6, 30], [C.eSend - .7, 30], [C.eSend - .3, 20]]);
  const rx = kf(t, [[sC.start, 6], [C.cOpen, 0], [C.eType + .6, 5], [C.eSend - .3, 2]]);
  // cursor choreography
  const plusXY: Pt = [120, 1130], sendXY: Pt = [950, 1120], codeXY: Pt = [modeXY(2)[0] + 120, modeXY(2)[1] + 180];
  const cur = curPos(t, [
    [sC.start, 980, 1700], [C.cClick - .35, ix + 100, iy + 95], [C.cClick + .5, ix + 100, iy + 95], [C.cHome + .1, 600, 1280], [C.cMode - .35, codeXY[0], codeXY[1]],
    [S('d').start + .05, codeXY[0], codeXY[1] + 40], [C.dPlus - .15, plusXY[0], plusXY[1]], [C.dPlus + .3, plusXY[0], plusXY[1]], [C.dPlus + .5, 200, 1260],
    [C.dFiles[2] + .3, 300, 1430], [C.eType, 700, 1430], [C.eSend - .5, 760, 1330], [C.eSend - .15, sendXY[0], sendXY[1]], [C.eSend + .6, sendXY[0] + 40, sendXY[1] + 120],
  ]);
  const hand = (t > C.cClick - .3 && t < C.cOpen + .1) || (t > C.cMode - .3 && t < C.cMode + .25) || (t > C.dPlus - .25 && t < C.dPlus + .3) || (t > C.eSend - .25 && t < C.eSend + .3);
  const modeSel = t >= C.cMode;
  const burst = decay(t, C.eSend, 3.5);
  return <Scene t={t} from="c" to="e" bg={BG}>
    <Cam tf={`translateY(${-cy * z}px) scale(${z}) rotateX(${rx}deg)`} origin="50% 45%">
      {/* desktop */}
      {!inApp && <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 0%, #3a1c0e 0%, #120d0b 55%, #0b0909 100%)' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: 150, color: 'rgba(239,233,226,.9)', letterSpacing: -4 }}>21:30</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 36, color: MU }}>суббота, 15 ноября</div>
        {APPS.map((a, i) => { const [x, y] = iconXY(i), k = ex(pr(t, sC.start + .05 + i * .04, .5)), hov = i === 2 ? (t > C.cClick - .35 ? 1 : 0) * (1 - open) : 0;
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 170, textAlign: 'center', opacity: k * (i === 2 ? 1 : 1 - open), transform: `translateY(${(1 - k) * 60}px) scale(${1 + .08 * hov - .06 * decay(t, C.cClick, 12) * (i === 2 ? 1 : 0)})` }}>
            <div style={{ width: 170, height: 170, borderRadius: 42, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: i === 2 ? `0 0 ${40 * hov + 10}px rgba(238,122,63,${.3 + .4 * hov}), 0 18px 40px rgba(0,0,0,.5)` : '0 18px 40px rgba(0,0,0,.5)' }}>{a.g}</div>
            <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 500, fontSize: 28, color: '#e6dfd7' }}>{a.n}</div></div>; })}
      </AbsoluteFill>}
      {/* app-open zoom: icon rect expands to full screen */}
      {t >= C.cOpen && open < 1 && <div style={{ position: 'absolute', left: lerp(ix, 0, open), top: lerp(iy, 0, open), width: lerp(170, 1080, open), height: lerp(170, 1920, open), borderRadius: lerp(42, 0, open), background: `linear-gradient(160deg, ${OR}, #2a160c ${lerp(100, 40, open)}%)`, overflow: 'hidden' }} />}
      {/* Claude app */}
      {inApp && <AbsoluteFill style={{ background: BG, opacity: home }}><AbsoluteFill style={{ transform: 'translateY(130px)' }}>
        <TopGlow t={t} o={home} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: lerp(470, 300, chat), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, transform: `scale(${lerp(1, .78, chat)})`, opacity: clamp(home * 1.5) }}>
          <div style={{ transform: `rotate(${lerp(-180, 0, ex(pr(t, C.cHome - .2, .9))) + t * 12}deg) scale(${back(pr(t, C.cHome - .2, .6))})` }}><Spark size={130} t={t} breathe={1} /></div>
          <div style={{ fontFamily: SERIF, fontSize: 136, color: TX, letterSpacing: -2, filter: `blur(${(1 - ex(pr(t, C.cHome, .5))) * 14}px)`, opacity: ex(pr(t, C.cHome, .5)) }}>Claude</div>
        </div>
        {/* mode pills */}
        {MODES.map(([g, n], i) => { const [x, y] = modeXY(i), k = ex(pr(t, C.cHome + .15 + i * .07, .5)), sel = i === 2 && modeSel, out = chat;
          return <div key={i} style={{ position: 'absolute', left: x, top: y - out * 160, height: 96, padding: '0 34px', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 30, fontFamily: SANS, fontWeight: 500, fontSize: 40, color: sel ? '#fff' : TX,
            background: sel ? 'rgba(238,122,63,.28)' : 'rgba(40,36,33,.85)', border: `2.5px solid ${sel ? OR2 : BORD}`, boxShadow: sel ? `0 0 ${30 + 40 * decay(t, C.cMode, 3)}px rgba(238,122,63,.6)` : '0 12px 30px rgba(0,0,0,.4)',
            opacity: k * (1 - out), transform: `translateY(${(1 - k) * 40}px) scale(${1 + (sel ? .06 * decay(t, C.cMode, 6) : 0)})`, filter: out > .05 ? `blur(${out * 10}px)` : 'none' }}>
            <span style={{ fontFamily: g === '</>' ? MONO : SANS, fontSize: 34, color: sel ? '#fff' : OR2 }}>{g}</span>{n}</div>; })}
        {/* chat input */}
        {chat > 0 && <div style={{ position: 'absolute', left: 50, top: 520, width: 980, height: 560, borderRadius: 42, background: PANEL, border: `2.5px solid ${sent ? OR : BORD}`, boxShadow: `0 40px 100px rgba(0,0,0,.6), 0 0 ${sent ? 80 * burst : 0}px rgba(238,122,63,.7)`, opacity: chat, transform: `translateY(${(1 - chat) * 160}px) scale(${lerp(.92, 1, chat)})` }}>
          {/* attached chips */}
          <div style={{ position: 'absolute', left: 36, top: 34, display: 'flex', gap: 16 }}>
            {FILES.map((f, i) => fileK[i] >= .99 && <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px 12px 14px', borderRadius: 20, background: '#2a2623', border: `2px solid ${BORD}`, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: '#e8e1d8', boxShadow: `0 0 ${36 * decay(t, C.dFiles[i] + .3, 2.5)}px rgba(238,122,63,.7)`, transform: `scale(${1 + .1 * decay(t, C.dFiles[i] + .3, 8)})` }}><FileGlyph k={f.k} />{f.n}</div>)}
          </div>
          {/* prompt text */}
          <div style={{ position: 'absolute', left: 44, right: 44, top: 150, fontFamily: SANS, fontWeight: 400, fontSize: 44, lineHeight: 1.4, color: typed ? TX : '#6f6862', opacity: sent ? 1 - pr(t, C.eSend + .05, .3) : 1 }}>
            {typed || 'Чем помочь сегодня?'}{t > C.eType && !sent && <span style={{ display: 'inline-block', width: 4, height: 50, marginLeft: 4, verticalAlign: -8, background: OR, opacity: Math.sin(t * 14) > 0 ? 1 : 0 }} />}
          </div>
          {/* bottom bar */}
          <div style={{ position: 'absolute', left: 34, right: 34, bottom: 30, display: 'flex', alignItems: 'center', gap: 20, fontFamily: SANS, fontSize: 32, color: '#cfc8bf' }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, border: `2.5px solid ${BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, color: '#d8d1c8', background: t > C.dPlus && t < C.dFiles[0] ? '#2c2926' : 'transparent' }}>+</div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 18, border: `2px solid ${OR}`, color: OR2, fontWeight: 500 }}><span style={{ fontFamily: MONO, fontSize: 28 }}>{'</>'}</span>Код</span>
            <span style={{ marginLeft: 'auto', color: '#cfc8bf' }}>Opus 5.5 <span style={{ color: MU }}>⌄</span></span>
            <div style={{ width: 86, height: 86, borderRadius: 24, background: typed.length > 3 ? OR : '#3a3531', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - .12 * (t >= C.eSend && t < C.eSend + .16 ? Math.sin(Math.PI * (t - C.eSend) / .16) : 0)})`, boxShadow: typed.length > 3 ? `0 0 ${24 + 70 * burst}px rgba(238,122,63,.6)` : 'none' }}>
              <svg width={42} height={42} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke={typed.length > 3 ? '#1a1310' : '#8d857c'} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
          </div>
        </div>}
        {/* + menu */}
        {menu > 0 && <div style={{ position: 'absolute', left: 60, top: 1100, width: 520, borderRadius: 28, background: '#1f1d1b', border: `2.5px solid ${BORD}`, padding: 14, boxShadow: '0 30px 80px rgba(0,0,0,.7)', opacity: clamp(menu * 2), transform: `translateY(${(1 - eo(menu)) * -24}px)`, transformOrigin: '10% 0' }}>
          {[['↥', 'Загрузить файлы'], ['▣', 'Сделать скриншот'], ['◫', 'Из проекта']].map(([g, n], i) => <div key={i} style={{ display: 'flex', gap: 22, alignItems: 'center', padding: '18px 22px', borderRadius: 18, background: i === 0 ? '#2f2b28' : 'transparent', fontFamily: SANS, fontSize: 36, color: TX }}><span style={{ color: OR2, width: 34 }}>{g}</span>{n}</div>)}
        </div>}
        {/* flying files */}
        {FILES.map((f, i) => { const k = fileK[i]; if (k <= 0 || k >= 1) return null; const e = ex(k);
          const x = lerp(760 - i * 40, 90 + i * 300, e), y = lerp(1500, 556, eio(k)) - Math.sin(k * Math.PI) * 160;
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 220, height: 260, borderRadius: 30, background: 'rgba(36,32,29,.95)', border: `2.5px solid ${OR}`, boxShadow: '0 0 60px rgba(238,122,63,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
            transform: `scale(${lerp(1, .35, ei(k))}) rotate(${(1 - e) * (i - 1) * 18}deg)`, transformOrigin: '0 0', fontFamily: SANS, fontWeight: 500, fontSize: 28, color: TX }}><FileGlyph k={f.k} s={2.2} />{f.n}</div>; })}
        {/* sent message flies up */}
        {sent && <div style={{ position: 'absolute', left: 130, right: 60, top: lerp(660, 260, ex(pr(t, C.eSend, .6))), padding: '26px 34px', borderRadius: '36px 36px 10px 36px', background: '#2b2724', fontFamily: SANS, fontSize: 36, lineHeight: 1.35, color: TX, opacity: pr(t, C.eSend + .05, .25), transform: `scale(${lerp(.9, 1, ex(pr(t, C.eSend, .5)))})` }}>{PROMPT}</div>}
      </AbsoluteFill></AbsoluteFill>}
      <Cursor t={t} x={cur[0]} y={cur[1]} hand={hand} clicks={[C.cClick, C.cMode, C.dPlus, C.eSend]} o={clamp((t - sC.start) / .2) * (t > C.eSend + .4 ? 1 - pr(t, C.eSend + .4, .3) : 1)} />
    </Cam>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 88% 52%, rgba(255,170,110,${.55 * burst}), transparent 60%)` }} />
    <Sub t={t} id={t < S('d').start ? 'c' : t < S('e').start ? 'd' : 'e'} />
    <Vignette o={.6} />
  </Scene>;
};

// ---------- F: code stream
const CODE: [string, string][][] = [
  [['// сцена 1 — горизонт, точка и текст', MU]], [['export const ', OR], ['Hook', '#f1c27d'], [' = () => {', TX]],
  [['  const ', OR], ['frame', TX], [' = ', TX], ['useCurrentFrame', '#f1c27d'], ['();', TX]],
  [['  const ', OR], ['glow', TX], [' = ', TX], ['interpolate', '#f1c27d'], ['(frame, [0, 30], [0, 1]);', TX]],
  [['  return (', TX]], [['    <', MU], ['AbsoluteFill', '#f1c27d'], [' style', '#9fd8c4'], ['={{ background: ', TX], ["'#0d0b0a'", '#9fd8c4'], [' }}>', TX]],
  [['      <', MU], ['Horizon', '#f1c27d'], [' glow', '#9fd8c4'], ['={glow} />', TX]],
  [['      <', MU], ['Words', '#f1c27d'], [' text', '#9fd8c4'], ['=', TX], ['"Раньше на такой…"', '#9fd8c4'], [' />', TX]],
  [['      <', MU], ['Orb', '#f1c27d'], [' path', '#9fd8c4'], ['={arc} ', TX], ['trail', '#9fd8c4'], ['={10} />', TX]],
  [['    </', MU], ['AbsoluteFill', '#f1c27d'], ['>', MU]], [['  );', TX]], [['};', TX]], [['', TX]],
  [['// сцена 2 — наезд камеры', MU]], [['const ', OR], ['zoom', TX], [' = ', TX], ['spring', '#f1c27d'], ['({ frame, fps, ', TX], ['config', '#9fd8c4'], [': { damping: 14 } });', TX]],
  [['const ', OR], ['blur', TX], [' = ', TX], ['interpolate', '#f1c27d'], ['(zoom, [0, 1], [30, 0]);', TX]],
  [['// сцена 3 — курсор и клик', MU]], [['<', MU], ['Cursor', '#f1c27d'], [' path', '#9fd8c4'], ['={toClaudeIcon} ', TX], ['click', '#9fd8c4'], ['={42} />', TX]],
  [['<', MU], ['Audio', '#f1c27d'], [' src', '#9fd8c4'], ['={', TX], ["staticFile('music.wav')", '#9fd8c4'], ['} />', TX]],
];
const F: React.FC<{ t: number }> = ({ t }) => {
  const s = S('f'), lt = t - s.start, per = Math.max(.07, (s.end - s.start - .6) / CODE.length), n = Math.min(CODE.length, Math.floor(lt / per) + 1);
  return <Scene t={t} from="f" bg={BG}>
    <TopGlow t={t} o={.8} />
    <Cam tf={`translateY(${-lt * 70 + 120}px) rotateX(${14 - lt * 2}deg) rotateY(${-6 + lt * 3}deg) rotateZ(${-4 + lt * 1.2}deg) scale(${1.02 + lt * .03})`} origin="50% 40%">
      {[0, 1].map((layer) => <div key={layer} style={{ position: 'absolute', left: 30, top: 380, width: 1020, fontFamily: MONO, fontSize: 34, lineHeight: 1.75, whiteSpace: 'pre', filter: layer === 0 ? 'blur(4px)' : 'none', WebkitMaskImage: layer === 1 ? 'linear-gradient(to bottom, transparent 0%, black 30%, black 60%, transparent 88%)' : undefined }}>
        {CODE.slice(0, n).map((ln, i) => { const k = ex(pr(t, s.start + i * per, .25)), fresh = i >= n - 2;
          return <div key={i} style={{ opacity: k, transform: `translateX(${(1 - k) * 40}px)`, textShadow: fresh ? '0 0 18px rgba(238,122,63,.9)' : 'none' }}>{ln.map(([txt, col], j) => <span key={j} style={{ color: fresh ? OR2 : col }}>{txt}</span>)}</div>; })}
      </div>)}
    </Cam>
    {t >= C.fHi && <div style={{ position: 'absolute', left: 230, top: 1380, padding: '20px 38px', borderRadius: 60, background: 'rgba(24,22,20,.9)', border: `2.5px solid ${OR}`, fontFamily: SANS, fontWeight: 500, fontSize: 46, color: TX, boxShadow: `0 0 ${50 * decay(t, C.fHi, 2) + 18}px rgba(238,122,63,.55)`, transform: `scale(${back(pr(t, C.fHi, .45))})` }}>✓  код анимации готов</div>}
    <Sub t={t} id="f" />
    <Vignette o={.7} />
  </Scene>;
};

// ---------- G: render + 3D result card
const MiniVideo: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: 'absolute', inset: 0, background: BG, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: -200, top: 520, width: 900, height: 600, borderRadius: '50%', background: 'radial-gradient(closest-side, #ffa15e, #f0702c 40%, #b8420f 65%, transparent)', filter: 'blur(26px)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center' }}><div style={{ transform: `rotate(${t * 40}deg)` }}><Spark size={150} t={t} breathe={1} /></div></div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: 64, color: TX, letterSpacing: -2, lineHeight: 1.05 }}>Теперь —<br /><span style={{ color: OR2 }}>один промпт.</span></div>
  </div>
);
const G: React.FC<{ t: number }> = ({ t }) => {
  const s = S('g');
  const pill = ex(pr(t, s.start + .05, .5)), p = eio(pr(t, C.gGo, Math.max(.6, C.gDone - C.gGo))), done = t >= C.gDone, card = ex(pr(t, C.gDone, 1));
  return <Scene t={t} from="g" bg={BG}>
    <Horizon t={t} y={1640} o={.45} />
    <TopGlow t={t} o={.4} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: MONO, fontSize: 42, color: '#cfc8bf', opacity: 1 - card }}><span style={{ color: OR }}>$ </span>npx remotion render</div>
    <div style={{ position: 'absolute', left: 540 - 330, top: done ? lerp(430, 1330, card) : 430, width: 660, height: 150, transform: `scale(${lerp(.6, 1, pill) * lerp(1, .8, card)})`, opacity: pill, zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: -14, borderRadius: 90, background: `conic-gradient(from ${t * 160}deg, #ee7a3f, #ffcf7a, #ff5d7a, #ee7a3f)`, filter: 'blur(26px)', opacity: done ? .9 : .65 }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 80, background: done ? OR : '#171412', border: `2.5px solid ${done ? OR2 : 'rgba(255,160,100,.6)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: SANS, fontWeight: 500, fontSize: 50, color: done ? '#1a1310' : TX }}>
        {!done && <svg width={50} height={50} viewBox="0 0 50 50" style={{ transform: `rotate(${t * 400}deg)` }}><circle cx={25} cy={25} r={19} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={6} /><path d="M25 6 A19 19 0 0 1 44 25" stroke={OR2} strokeWidth={6} fill="none" strokeLinecap="round" /></svg>}
        {done ? 'Ролик готов ✓' : <span>Рендер <span style={{ display: 'inline-block', width: 110, textAlign: 'right' }}>{Math.round(p * 100)}%</span></span>}
      </div>
    </div>
    {/* progress strip while rendering */}
    {!done && <div style={{ position: 'absolute', left: 140, right: 140, top: 660, height: 10, borderRadius: 5, background: '#2a2522', opacity: pill }}><div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${OR}, #ffcf7a)`, boxShadow: '0 0 20px rgba(238,122,63,.8)' }} /></div>}
    {/* result card swings in, 3D */}
    {done && <AbsoluteFill style={{ perspective: 1600 }}>
      <div style={{ position: 'absolute', left: 540 - 300, top: 300, width: 600, height: 960, borderRadius: 48, overflow: 'hidden', border: `3px solid ${BORD}`, boxShadow: `0 60px 140px rgba(0,0,0,.8), 0 0 ${80 * decay(t, C.gDone, 2) + 20}px rgba(238,122,63,.45)`,
        transform: `translateY(${(1 - card) * 500}px) rotateY(${lerp(-55, -14, card) + Math.sin(t * .8) * 3}deg) rotateX(${lerp(25, 6, card)}deg) rotateZ(${lerp(-8, -2, card)}deg)`, opacity: clamp(card * 2) }}>
        <MiniVideo t={t} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${lerp(-40, 120, pr(t, C.gDone + .2, 1.1))}%, rgba(255,255,255,.22) ${lerp(-30, 130, pr(t, C.gDone + .2, 1.1))}%, transparent ${lerp(-20, 140, pr(t, C.gDone + .2, 1.1))}%)` }} />
      </div>
    </AbsoluteFill>}
    <Sub t={t} id="g" />
    <Vignette o={.65} />
  </Scene>;
};

// ---------- H: flash, player with the Claude spark mascot
const H: React.FC<{ t: number }> = ({ t }) => {
  const s = S('h'), lt = t - s.start, flash = decay(t, s.start, 3.2), card = ex(pr(t, s.start + .05, .8)), prog = clamp(lt / (s.end - s.start));
  const hop = Math.abs(Math.sin(lt * 3.2)), squash = 1 - .12 * Math.max(0, Math.cos(lt * 3.2 * 2)) * (hop < .2 ? 1 : 0);
  return <Scene t={t} from="h" bg="#f3f0eb" inBlur={false}>
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #ffffff 0%, #f1ede7 50%, #b9b2a9 100%)' }} />
    <Cam tf={`scale(${1.02 + lt * .012})`}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: MONO, fontSize: 30, color: '#8a8178', opacity: card }}>ролик.mp4</div>
      <div style={{ position: 'absolute', left: 190, top: 305, width: 700, height: 880, borderRadius: 44, overflow: 'hidden', background: '#141110', boxShadow: '0 50px 110px rgba(60,40,20,.3)', opacity: card, transform: `translateY(${(1 - card) * 120}px) scale(${lerp(.9, 1, card)})`, filter: card < .95 ? `blur(${(1 - card) * 14}px)` : 'none' }}>
        <div style={{ position: 'absolute', left: -200, top: 560, width: 1100, height: 700, borderRadius: '50%', background: 'radial-gradient(closest-side, #ffa15e, #f0702c 40%, #b8420f 65%, transparent)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', left: 350 - 140, top: 250 - hop * 90, width: 280, height: 280, transform: `scaleY(${squash}) scaleX(${2 - squash})`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 0 30px rgba(238,122,63,.6))' }}>
          <div style={{ transform: `rotate(${lt * 70}deg)` }}><Spark size={280} t={t} breathe={1.4} /></div></div>
        <div style={{ position: 'absolute', left: 350 - 90 + hop * 20, top: 610, width: 180 - hop * 40, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.45)', filter: 'blur(8px)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: 'linear-gradient(transparent, rgba(0,0,0,.55))' }} />
        <div style={{ position: 'absolute', left: 40, right: 40, bottom: 44, display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width={30} height={34} viewBox="0 0 12 14"><path d="M1 1v12l10-6z" fill="#fff" /></svg>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.3)' }}><div style={{ width: `${prog * 100}%`, height: '100%', borderRadius: 4, background: OR }} /></div>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 28, color: '#fff' }}>0:{String(Math.floor(lt + 12)).padStart(2, '0')}</span>
        </div>
      </div>
      <Words t={t} toks={toksOf('h', 0, 3)} strike={['after', 'effects']} strikeAt={C.hAe + .45} style={{ position: 'absolute', left: 40, right: 40, top: 1280, textAlign: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 84, color: '#1d1916', letterSpacing: -2.5 }} />
      <Words t={t} toks={toksOf('h', 3)} hi={['денег']} hiColor={CL} style={{ position: 'absolute', left: 40, right: 40, top: 1390, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: 84, color: '#1d1916', letterSpacing: -2.5 }} />
    </Cam>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${flash}) 0%, rgba(255,240,225,${flash * .9}) 60%, rgba(255,230,210,${flash * .7}) 100%)` }} />
  </Scene>;
};

// ---------- I: CTA
const I: React.FC<{ t: number }> = ({ t }) => {
  const s = S('i'), lt = t - s.start, bar = ex(pr(t, C.iTg + .1, .6));
  const handle = '@claudecode09', typed = handle.slice(0, Math.round(handle.length * pr(t, C.iTg + .45, .7)));
  const orbPath = (x: number): Pt => { const k = eio(clamp((x - s.start) / Math.max(.5, C.iLink - s.start))); return [lerp(160, 860, k), lerp(380, 1065, k) - Math.sin(k * Math.PI) * 260]; };
  const end = clamp((t - (DUR - .6)) / .6);
  return <Scene t={t} from="i" bg={BG}>
    <Cam tf={`scale(${1.03 + lt * .012})`}>
      <Horizon t={t} y={1400} o={.95} />
      {t < C.iLink + .1 && <Orb t={t} path={orbPath} />}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', opacity: ex(pr(t, s.start, .6)) }}><div style={{ transform: `rotate(${t * 25}deg) scale(${back(pr(t, s.start, .6))})`, filter: 'drop-shadow(0 0 30px rgba(238,122,63,.6))' }}><Spark size={120} t={t} breathe={1} /></div></div>
      <Words t={t} toks={toksOf('i', 0, 2)} hi={['промпты']} under={false} style={{ position: 'absolute', left: 0, right: 0, top: 480, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: 140, letterSpacing: -6, color: TX, lineHeight: 1.05 }} />
      <Words t={t} toks={toksOf('i', 2, 5)} style={{ position: 'absolute', left: 60, right: 60, top: 790, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 58, color: '#cfc8bf' }} />
      <div style={{ position: 'absolute', left: 150, top: 990, width: 780, height: 136, opacity: bar, transform: `scale(${lerp(.7, 1, bar) + .05 * decay(t, C.iLink, 5)})`, filter: bar < 1 ? `blur(${(1 - bar) * 12}px)` : 'none' }}>
        <div style={{ position: 'absolute', inset: -12, borderRadius: 80, background: `conic-gradient(from ${t * 120}deg, #ee7a3f, #ffcf7a, #ff5d7a, #5ab0ff, #ee7a3f)`, filter: 'blur(22px)', opacity: .55 + .4 * decay(t, C.iLink, 2) }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 70, background: '#fbf8f4', display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px 0 40px', fontFamily: SANS, fontWeight: 500, fontSize: 50, color: '#1d1916' }}>
          <svg width={44} height={44} viewBox="0 0 24 24"><circle cx={10.5} cy={10.5} r={7} stroke="#1d1916" strokeWidth={2.6} fill="none" /><path d="M16 16l5 5" stroke="#1d1916" strokeWidth={2.6} strokeLinecap="round" /></svg>
          <span>{typed}<span style={{ opacity: typed.length < handle.length && Math.sin(t * 14) > 0 ? 1 : 0, color: OR }}>|</span></span>
          <div style={{ marginLeft: 'auto', width: 92, height: 92, borderRadius: 46, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={48} height={48} viewBox="0 0 24 24"><path d="M21.5 3.5L2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7l3.1-15.6c.2-1-.8-1.7-1.9-1.3zM9.4 14.6l9-7.7-7.2 9.2-.4 3.1-1.4-4.6z" fill="#1a1310" /></svg></div>
        </div>
      </div>
      <Words t={t} toks={toksOf('i', 5)} style={{ position: 'absolute', left: 60, right: 60, top: 1200, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 52, color: TX }} />
      {t >= C.iHead && <div style={{ position: 'absolute', left: 0, right: 0, top: 1290, textAlign: 'center', fontFamily: SANS, fontSize: 72, color: OR, opacity: pr(t, C.iHead, .3), transform: `translateY(${-Math.abs(Math.sin((t - C.iHead) * 4)) * 22}px)` }}>↑</div>}
    </Cam>
    <Vignette o={.6} />
    <AbsoluteFill style={{ background: '#000', opacity: end }} />
  </Scene>;
};

export const V3: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const s = SC.find((x) => t >= x.start && t < x.end) || SC[SC.length - 1];
  const Comp = ({ a: A, b: B, c: App, d: App, e: App, f: F, g: G, h: H, i: I } as Record<string, React.FC<{ t: number }>>)[s.id];
  return <AbsoluteFill style={{ background: BG }}>
    <Comp t={t} />
    <Grain f={f} o={s.id === 'h' ? .05 : .08} />
    {M.voice && <Audio src={staticFile('v3/voice.wav')} />}
    <Audio src={staticFile('v3/music.wav')} volume={M.voice ? .5 : .8} />
    <Audio src={staticFile('v3/sfx.wav')} volume={.65} />
  </AbsoluteFill>;
};
