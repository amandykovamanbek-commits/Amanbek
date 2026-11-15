import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, delayRender, continueRender } from 'remotion';
import { buildCine, FPS } from './timeline';
import words from './words.json';
import meta from './meta.json';
import { Kodik } from '../Main';

export const CT = buildCine(words as any, (meta as any).lead || 0);
const { sc: SC, C, duration: DUR, tok: TOK } = CT;
const S = (id: string) => SC.find((x) => x.id === id);
const M = meta as any;

// ---------- fonts (serif from local woff2; system Inter Display / JetBrains Mono warmed up)
const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
if (typeof document !== 'undefined' && !(window as any).__cineFonts) {
  (window as any).__cineFonts = true;
  const h = delayRender('fonts');
  const faces: Promise<any>[] = [];
  for (const [sub, rng] of [['cyrillic', CYR], ['latin', LAT]]) for (const w of ['400', '500']) for (const st of ['normal', 'italic']) {
    const f = new FontFace('Source Serif 4', `url(${staticFile(`fonts/source-serif-4-${sub}-${w}-${st}.woff2`)})`, { weight: w, style: st, unicodeRange: rng });
    faces.push(f.load().then((ff) => (document as any).fonts.add(ff)));
  }
  ['300 italic 40px "Inter Display"', '200 italic 40px "Inter Display"', '400 40px "Inter Display"', '500 40px "Inter Display"', '600 40px "Inter Display"', '500 40px "JetBrains Mono"']
    .forEach((q) => faces.push((document as any).fonts.load(q, 'Тест Test')));
  Promise.all(faces).then(() => continueRender(h)).catch(() => continueRender(h));
}

// ---------- palette & helpers
const BG = '#0e0c0b', OR = '#ee7a3f', OR2 = '#ff9d5c', CL = '#d97757', TX = '#ece7e1', MU = '#8d857c', PANEL = '#1d1b19', BORD = '#3b3632';
const SANS = '"Inter Display", Inter, sans-serif', SERIF = '"Source Serif 4", serif', MONO = '"JetBrains Mono", monospace';
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
// keyframed value: [[time, value], ...] eased in-out between keys
const kf = (t: number, keys: [number, number][], ease = eio) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return lerp(va, vb, ease(clamp((t - a) / Math.max(1e-3, b - a)))); }
  return keys[keys.length - 1][1];
};

// ---------- shared visual pieces
const Grain: React.FC<{ f: number; o?: number }> = ({ f, o = .07 }) => (
  <Img src={staticFile(`cine/grain/g${f % 6}.png`)} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: o * 1.6, mixBlendMode: 'overlay', pointerEvents: 'none', imageRendering: 'pixelated' }} />
);
const Vignette: React.FC<{ o?: number }> = ({ o = .75 }) => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 48%, transparent 55%, rgba(0,0,0,.9) 100%)', opacity: o, pointerEvents: 'none' }} />;
const Horizon: React.FC<{ t: number; y?: number; o?: number }> = ({ t, y = 1380, o = 1 }) => (
  <>
    <div style={{ position: 'absolute', left: -520, top: y, width: 2120, height: 1300, borderRadius: '50%', background: 'radial-gradient(closest-side, #ffa15e 0%, #f0702c 38%, #b8420f 64%, rgba(90,25,5,.4) 82%, transparent 100%)', filter: 'blur(46px)', opacity: o, transform: `scaleX(${1 + .03 * Math.sin(t * .6)}) translateY(${Math.sin(t * .4) * 10}px)` }} />
    <div style={{ position: 'absolute', left: 140, top: y - 40, width: 800, height: 300, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,170,110,.55), transparent)', filter: 'blur(40px)', opacity: o * (.7 + .3 * Math.sin(t * 1.3)) }} />
  </>
);
type Pt = [number, number];
const Orb: React.FC<{ t: number; path: (t: number) => Pt; size?: number; trail?: number; o?: number }> = ({ t, path, size = 18, trail = 10, o = 1 }) => (
  <>
    {Array.from({ length: trail }, (_, j) => {
      const i = trail - 1 - j, [x, y] = path(t - i * .011), s = size * (1 - i / trail * .4);
      return <div key={i} style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', opacity: o * (i ? .4 * (1 - i / trail) : 1),
        background: i ? OR2 : '#fff3e6', filter: i ? 'blur(3px)' : 'none', boxShadow: i ? 'none' : `0 0 ${size}px ${size / 2.5}px ${OR}, 0 0 ${size * 4}px ${size * 1.3}px rgba(255,120,50,.4)` }} />;
    })}
  </>
);
// words reveal with blur on their voice timings
const Words: React.FC<{ t: number; toks: any[]; hi?: string[]; style?: React.CSSProperties; hiColor?: string; under?: boolean; strike?: string[]; strikeAt?: number }> = ({ t, toks, hi = [], style, hiColor = OR, under = true, strike = [], strikeAt = 1e9 }) => (
  <div style={style}>
    {toks.map((tk, i) => {
      const k = ex(pr(t, tk.s - .06, .45)), isHi = hi.includes(tk.n), isSt = strike.includes(tk.n);
      return <span key={i} style={{ display: 'inline-block', position: 'relative', marginRight: '.24em', opacity: k, filter: k < .99 ? `blur(${(1 - k) * 16}px)` : 'none', transform: `translateY(${(1 - k) * 18}px)`, color: isHi ? hiColor : undefined }}>
        {tk.w}
        {isHi && under && <svg style={{ position: 'absolute', left: 0, bottom: '-.18em', width: '100%', height: '.3em', overflow: 'visible' }} viewBox="0 0 100 10" preserveAspectRatio="none">
          <path d="M2 7 C30 2, 70 2, 98 6" stroke={hiColor} strokeWidth={3} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eo(pr(t, tk.e - .05, .4))} style={{ strokeWidth: 4 }} /></svg>}
        {isSt && <div style={{ position: 'absolute', left: '-4%', top: '54%', width: '108%', height: 5, borderRadius: 3, background: OR, transformOrigin: 'left', transform: `scaleX(${eo(pr(t, strikeAt, .35))}) rotate(-2deg)` }} />}
      </span>;
    })}
  </div>
);
const toksOf = (id: string, from = 0, to = 999) => S(id).tokens.slice(from, to);
// horizontal motion blur via per-element SVG filter
const MB: React.FC<{ id: string; sx: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, sx, children, style }) => (
  <div style={{ ...style, filter: sx > .4 ? `url(#${id})` : 'none' }}>
    <svg width={0} height={0} style={{ position: 'absolute' }}><filter id={id} x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation={`${sx} 0`} /></filter></svg>
    {children}
  </div>
);
// chromatic aberration (screen-blended RGB split)
const CA: React.FC<{ d: number; children: React.ReactNode; color?: string }> = ({ d, children, color = TX }) => (
  <div style={{ position: 'relative', isolation: 'isolate' }}>
    <div style={{ position: 'absolute', inset: 0, color: '#ff4d3d', transform: `translateX(${d}px)`, mixBlendMode: 'screen', opacity: .7 }}>{children}</div>
    <div style={{ position: 'absolute', inset: 0, color: '#38d4ff', transform: `translateX(${-d}px)`, mixBlendMode: 'screen', opacity: .7 }}>{children}</div>
    <div style={{ position: 'relative', color }}>{children}</div>
  </div>
);
// Claude-like spark (own drawing) with fake 3D extrusion
const RAYS = [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331].map((a, i) => ({ a, l: [92, 80, 96, 84, 90, 78, 95, 82, 92, 79, 97, 85][i] }));
const Spark: React.FC<{ size: number; color?: string; stroke?: number }> = ({ size, color = CL, stroke = 17 }) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ display: 'block', overflow: 'visible' }}>
    {RAYS.map((r, i) => { const a = r.a * Math.PI / 180; return <line key={i} x1={Math.cos(a) * 8} y1={Math.sin(a) * 8} x2={Math.cos(a) * r.l} y2={Math.sin(a) * r.l} stroke={color} strokeWidth={stroke} strokeLinecap="round" />; })}
  </svg>
);
const Spark3D: React.FC<{ size: number; ry: number; rx: number; rz: number }> = ({ size, ry, rx, rz }) => (
  <div style={{ width: size, height: size, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
    {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateZ(${-i * 2.2}px)` }}><Spark size={size} color={i === 0 ? CL : i < 3 ? '#c4643f' : '#8f3e1f'} /></div>)}
    <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(1px)', mixBlendMode: 'screen', opacity: .35 }}><Spark size={size} color="#ffd2b5" stroke={6} /></div>
  </div>
);

// ---------- Claude-style chat UI (recreated, illustrative)
const MODELS = [['Fable 5.2', 'для самых трудных задач'], ['Opus 5.5', 'для сложных задач'], ['Sonnet 5.5', 'на каждый день'], ['Haiku 5.5', 'быстрые ответы']];
const Chat: React.FC<{ t: number; typed?: string; caret?: boolean; chip?: number; model: string; dd?: number; ddSel?: number; send?: number; press?: number }> = ({ t, typed = '', caret, chip = 0, model, dd = 0, ddSel = 2, send = 0, press = 0 }) => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, fontFamily: SERIF, fontSize: 82, color: TX, letterSpacing: -1, textShadow: '0 0 40px rgba(238,122,63,.25)' }}>
      <div style={{ transform: `rotate(${t * 20}deg)` }}><Spark size={78} /></div>Чем займёмся?
    </div>
    <div style={{ position: 'absolute', left: 60, top: 720, width: 960, height: 310, borderRadius: 38, background: PANEL, border: `2.5px solid ${BORD}`, boxShadow: '0 40px 90px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)' }}>
      <div style={{ position: 'absolute', left: 40, top: 38, right: 40, display: 'flex', alignItems: 'center', gap: 18, fontFamily: SANS, fontSize: 40, color: typed ? TX : '#6f6862', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {chip > 0 && <span style={{ flex: 'none', fontFamily: SANS, fontSize: 30, fontWeight: 500, padding: '8px 20px', borderRadius: 14, background: `rgba(238,122,63,${.18 + .5 * decay(t, 0, 0) * 0})`, border: `2px solid rgba(238,122,63,${.35 + .65 * (1 - chip)})`, color: '#f3c6a8', boxShadow: `0 0 ${30 * (1 - chip) + 6}px rgba(238,122,63,${.6 * (1 - chip) + .15})`, transform: `scale(${lerp(.6, 1, back(Math.min(1, chip * 2)))})` }}>идея.txt</span>}
        <span>{typed || 'Чем помочь сегодня?'}</span>{caret && <span style={{ width: 3, height: 44, background: OR, opacity: Math.sin(t * 14) > 0 ? 1 : 0 }} />}
      </div>
      <div style={{ position: 'absolute', left: 32, right: 32, bottom: 30, display: 'flex', alignItems: 'center', gap: 20, fontFamily: SANS, fontSize: 32, color: '#cfc8bf' }}>
        <span style={{ fontSize: 46, color: '#bdb6ad', width: 56, textAlign: 'center' }}>+</span>
        <span style={{ display: 'flex', border: `2px solid ${BORD}`, borderRadius: 14, overflow: 'hidden', fontSize: 28 }}><span style={{ padding: '6px 16px', background: '#3a3531' }}>Чат</span><span style={{ padding: '6px 16px', color: MU }}>Код</span></span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 16, background: dd > 0 ? '#2c2926' : 'transparent' }}>{model} <span style={{ color: MU }}>⌄</span></span>
        <svg width={34} height={40} viewBox="0 0 24 28"><rect x={7} y={2} width={10} height={16} rx={5} fill="none" stroke="#bdb6ad" strokeWidth={2.2} /><path d="M3 13a9 9 0 0 0 18 0M12 22v4" stroke="#bdb6ad" strokeWidth={2.2} fill="none" strokeLinecap="round" /></svg>
        <div style={{ width: 82, height: 82, borderRadius: 22, background: send > 0 ? OR : '#3a3531', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - .12 * Math.sin(Math.PI * clamp(press))})`, boxShadow: send > 0 ? `0 0 ${20 + 60 * decay(press > 0 ? press : -1, 0, 3)}px rgba(238,122,63,${.35 + .4 * send})` : 'none' }}>
          <svg width={40} height={40} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke={send > 0 ? '#1a1310' : '#8d857c'} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      </div>
    </div>
    {dd > 0 && <div style={{ position: 'absolute', left: 470, top: 1052, width: 520, borderRadius: 30, background: '#1f1d1b', border: `2.5px solid ${BORD}`, padding: 14, boxShadow: '0 30px 80px rgba(0,0,0,.7)', opacity: clamp(dd * 2), transform: `translateY(${(1 - eo(dd)) * -30}px) scale(${lerp(.94, 1, eo(dd))})`, transformOrigin: '80% 0' }}>
      {MODELS.map(([n, d], i) => <div key={i} style={{ position: 'relative', padding: '16px 22px', borderRadius: 18, background: i === ddSel ? '#2f2b28' : 'transparent', fontFamily: SANS }}>
        <div style={{ fontSize: 36, color: TX, fontWeight: 500 }}>{n}</div><div style={{ fontSize: 25, color: MU, marginTop: 2 }}>{d}</div>
        {i === ddSel && <div style={{ position: 'absolute', right: 24, top: 34, fontSize: 36, color: '#5aa2ff' }}>✓</div>}
      </div>)}
    </div>}
  </>
);

// ---------- scene wrapper: blur-dip in/out, camera
const Scene: React.FC<{ t: number; id: string; bg: string; inBlur?: boolean; children: React.ReactNode }> = ({ t, id, bg, inBlur = true, children }) => {
  const s = S(id), ki = pr(t, s.start, .38), ko = pr(t, s.end - .28, .28);
  const blur = (inBlur ? (1 - ex(ki)) * 30 : 0) + ei(ko) * 34;
  return <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
    <AbsoluteFill style={{ filter: blur > .3 ? `blur(${blur}px)` : 'none', transform: `scale(${(inBlur ? lerp(1.12, 1, ex(ki)) : 1) * lerp(1, 1.08, ei(ko))})`, opacity: Math.min(inBlur ? clamp(ki * 2.5) : 1, 1 - ei(ko) * .6) }}>{children}</AbsoluteFill>
  </AbsoluteFill>;
};
const Cam: React.FC<{ tf: string; origin?: string; children: React.ReactNode }> = ({ tf, origin = '50% 50%', children }) => (
  <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: origin }}><AbsoluteFill style={{ transform: tf, transformOrigin: origin, transformStyle: 'preserve-3d' }}>{children}</AbsoluteFill></AbsoluteFill>
);
const Sub: React.FC<{ t: number; id: string; dark?: boolean }> = ({ t, id, dark }) => (
  <Words t={t} toks={toksOf(id)} style={{ position: 'absolute', left: 70, right: 70, top: 1600, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontStyle: 'italic', fontSize: 50, lineHeight: 1.25, color: dark ? '#3c3631' : '#d9d2c9' }} hi={['claude']} under={false} />
);

// ---------- scenes
const A: React.FC<{ t: number }> = ({ t }) => {
  const s = S('a'), lt = t - s.start, open = pr(t, 0, .5);
  const path = (x: number): Pt => { const k = eio(clamp((x - s.start - .2) / (s.end - s.start - .4))); return [lerp(170, 930, k), 760 - Math.sin(k * Math.PI) * 120 + k * 260]; };
  return <Scene t={t} id="a" bg={BG} inBlur={false}>
    <Cam tf={`scale(${1 + lt * .018}) translateY(${-lt * 6}px)`}>
      <Horizon t={t} y={1340} o={open} />
      <Orb t={t} path={path} o={open} />
      <Words t={t} toks={toksOf('a')} hi={['недели']} style={{ position: 'absolute', left: 90, right: 90, top: 790, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontStyle: 'italic', fontSize: 70, lineHeight: 1.3, color: TX, letterSpacing: -1 }} />
    </Cam>
    <AbsoluteFill style={{ background: '#000', opacity: 1 - open }} />
  </Scene>;
};

const B: React.FC<{ t: number }> = ({ t }) => {
  const s = S('b'), lt = t - s.start;
  const rows: [string, number, number, number][] = [['Теперь —', C.bNow, 150, 560], ['один', C.bOne, 250, 740], ['промпт.', C.bPrompt, 250, 990]];
  const camS = kf(t, [[s.start, 1.35], [s.start + .7, 1], [s.end, 1.07]], ex), camR = kf(t, [[s.start, -4], [s.start + .7, 0]], ex);
  const disc = ex(pr(t, C.bNow - .2, .8));
  return <Scene t={t} id="b" bg={BG}>
    <Cam tf={`scale(${camS}) rotate(${camR}deg)`}>
      <Horizon t={t} y={kf(t, [[s.start, 1340], [s.start + .8, 1620]], ex)} o={.8} />
      <div style={{ position: 'absolute', left: 540 - 90 * disc + noise(t, .5) * 20, top: 300 - 90 * disc, width: 180 * disc, height: 180 * disc, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #ffb27a, #e8692c 60%, #b6481a)', filter: 'blur(5px)', boxShadow: '0 0 120px 40px rgba(238,122,63,.35)' }} />
      {rows.map(([txt, at, fs, y], i) => {
        const k = ex(pr(t, at - .08, .55)), v = 1 - k;
        return <MB key={i} id={`mbB${i}`} sx={v * 60} style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: SANS, fontWeight: 200, fontStyle: 'italic', fontSize: fs, letterSpacing: -fs * .04, lineHeight: 1, transform: `translateX(${v * 700}px)`, opacity: clamp(k * 3) }}>
          <CA d={2 + v * 26 + 2 * decay(t, at, 3)} color={i === 2 ? OR2 : TX}>{txt}</CA>
        </MB>;
      })}
    </Cam>
    <Vignette o={.6} />
  </Scene>;
};

const Cc: React.FC<{ t: number }> = ({ t }) => {
  const s = S('c'), sw = C.cSwitch;
  const kA = pr(t, sw - .15, .3), kB = pr(t, sw + .05, .45);
  const spin = back(pr(t, s.start, 1.1));
  const camK = ex(pr(t, C.cPick - .15, .8));
  const dd = pr(t, C.cPick + .15, .35), sel = t >= C.cModel ? 1 : 2;
  return <Scene t={t} id="c" bg={BG}>
    {t < sw + .2 && <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 44%, #f7f3ee 0%, #ebe5dc 55%, #b7aea3 100%)', filter: kA > 0 ? `blur(${kA * 40}px) saturate(${1 - kA})` : 'none', opacity: 1 - pr(t, sw + .05, .15) }}>
      <AbsoluteFill style={{ perspective: 1400 }}>
        <div style={{ position: 'absolute', left: 540 - 190, top: 700, width: 380, height: 380, transformStyle: 'preserve-3d' }}>
          <Spark3D size={380} ry={lerp(-150, 0, spin) + (t - s.start) * 22} rx={14 + 6 * Math.sin(t)} rz={(t - s.start) * 12} />
        </div>
        <div style={{ position: 'absolute', left: 540 - 200, top: 1140, width: 400, height: 50, borderRadius: '50%', background: 'rgba(80,50,30,.25)', filter: 'blur(18px)' }} />
      </AbsoluteFill>
      <Words t={t} toks={toksOf('c', 1, 2)} style={{ position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: SERIF, fontSize: 92, color: '#2a2420', letterSpacing: -1 }} />
    </AbsoluteFill>}
    {t >= sw && <AbsoluteFill style={{ opacity: kB, filter: kB < 1 ? `blur(${(1 - ex(kB)) * 26}px)` : 'none' }}>
      <Cam tf={`translate(${-camK * 330}px, ${-camK * 350}px) scale(${lerp(1, 1.7, camK)}) rotateX(${camK * 10}deg) rotateY(${-camK * 12}deg)`} origin="50% 50%">
        <Horizon t={t} y={1700} o={.35} />
        <Chat t={t} model={sel === 1 ? 'Opus 5.5' : 'Sonnet 5.5'} dd={dd} ddSel={sel} />
      </Cam>
    </AbsoluteFill>}
    <Sub t={t} id="c" dark={t < sw + .1} />
    <Vignette o={t < sw ? .25 : .7} />
  </Scene>;
};

const CODE: [string, string][][] = [
  [['// сцена 1 — горизонт, точка и текст', MU]],
  [['export const ', OR], ['Hook', '#f1c27d'], [' = () => {', TX]],
  [['  const ', OR], ['frame', TX], [' = ', TX], ['useCurrentFrame', '#f1c27d'], ['();', TX]],
  [['  const ', OR], ['glow', TX], [' = ', TX], ['interpolate', '#f1c27d'], ['(frame, [0, 30], [0, 1]);', TX]],
  [['  return (', TX]],
  [['    <', MU], ['AbsoluteFill', '#f1c27d'], [' style', '#9fd8c4'], ['={{ background: ', TX], ["'#0e0c0b'", '#9fd8c4'], [' }}>', TX]],
  [['      <', MU], ['Horizon', '#f1c27d'], [' glow', '#9fd8c4'], ['={glow} />', TX]],
  [['      <', MU], ['Words', '#f1c27d'], [' text', '#9fd8c4'], ['=', TX], ['"Раньше на такой…"', '#9fd8c4'], [' />', TX]],
  [['      <', MU], ['Orb', '#f1c27d'], [' path', '#9fd8c4'], ['={arc} ', TX], ['trail', '#9fd8c4'], ['={10} />', TX]],
  [['    </', MU], ['AbsoluteFill', '#f1c27d'], ['>', MU]],
  [['  );', TX]],
  [['};', TX]],
  [['', TX]],
  [['// сцена 2 — наезд камеры', MU]],
  [['const ', OR], ['zoom', TX], [' = ', TX], ['spring', '#f1c27d'], ['({ frame, fps, ', TX], ['config', '#9fd8c4'], [': { damping: 14 } });', TX]],
];
const D: React.FC<{ t: number }> = ({ t }) => {
  const s = S('d'), ph2 = t >= C.dCode;
  const fileK = pr(t, C.dFile, .55), chip = t >= C.dFile + .5 ? pr(t, C.dFile + .5, .6) : 0;
  const msg = 'Сделай моушен-ролик про ИИ-анимацию';
  const typed = msg.slice(0, Math.round(msg.length * pr(t, C.dType, Math.max(.4, C.dSend - .2 - C.dType))));
  const push = ex(pr(t, C.dSend - .55, .5));
  const fp: Pt = [lerp(1050, 150, ex(fileK)), lerp(260, 778, eio(fileK)) - Math.sin(fileK * Math.PI) * 120];
  // code phase camera
  const lt2 = t - C.dCode, nLines = Math.min(CODE.length, Math.floor(lt2 / .16) + 1);
  return <Scene t={t} id="d" bg={BG}>
    {!ph2 && <Cam tf={`translate(${lerp(0, -880, push)}px, ${lerp(-40, -150, push)}px) scale(${lerp(1.18, 2.3, push)}) rotateX(${lerp(7, 4, push)}deg) rotateY(${lerp(6, -16, push)}deg)`} origin="50% 46%">
      <Horizon t={t} y={1700} o={.35} />
      <Chat t={t} model="Opus 5.5" typed={typed} caret={t > C.dType && t < C.dSend} chip={chip} send={typed.length > 3 ? 1 : 0} press={t >= C.dSend ? pr(t, C.dSend, .25) : 0} />
      {fileK > 0 && fileK < 1 && <>
        <Orb t={t} path={() => [fp[0], fp[1]]} size={10} trail={1} o={.6} />
        <div style={{ position: 'absolute', left: fp[0] - 55, top: fp[1] - 70, width: 110, height: 140, borderRadius: 18, background: 'linear-gradient(160deg, #ffb070, #e8692c)', transform: `rotate(${(1 - fileK) * 30}deg) scale(${lerp(1.1, .45, ei(fileK))})`, boxShadow: '0 0 60px 10px rgba(238,122,63,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 38, color: '#3a1a08' }}>{'</>'}</div></>}
    </Cam>}
    {!ph2 && t >= C.dSend && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,160,100,${.9 * decay(t, C.dSend, 4)}) 0%, rgba(238,122,63,${.5 * decay(t, C.dSend, 4)}) 30%, transparent 70%)` }} />}
    {ph2 && <AbsoluteFill style={{ opacity: pr(t, C.dCode, .3), filter: lt2 < .4 ? `blur(${(1 - ex(pr(t, C.dCode, .4))) * 24}px)` : 'none' }}>
      <Horizon t={t} y={1750} o={.3} />
      <Cam tf={`translateY(${-lt2 * 40}px) translateX(${40 - lt2 * 10}px) rotateX(${20 - lt2 * 2}deg) rotateY(${-6 + lt2 * 2}deg) rotateZ(${-4 + lt2}deg) scale(${.98 + lt2 * .03})`} origin="50% 40%">
        {[0, 1].map((layer) => <div key={layer} style={{ position: 'absolute', left: 60, top: 430, width: 960, height: 900, borderRadius: 34, background: 'rgba(30,28,26,.92)', border: `2.5px solid ${BORD}`, padding: '44px 40px', boxSizing: 'border-box', fontFamily: MONO, fontSize: 29, lineHeight: 1.75, whiteSpace: 'pre',
          filter: layer === 0 ? 'blur(5px)' : 'none', WebkitMaskImage: layer === 1 ? 'linear-gradient(to bottom, transparent 2%, black 28%, black 62%, transparent 92%)' : undefined, boxShadow: layer === 0 ? '0 50px 120px rgba(0,0,0,.7)' : 'none' }}>
          {CODE.slice(0, nLines).map((ln, i) => { const k = ex(pr(t, C.dCode + i * .16, .3)); return <div key={i} style={{ opacity: k, transform: `translateX(${(1 - k) * 30}px)`, background: i === nLines - 1 ? 'rgba(238,122,63,.12)' : 'transparent', borderRadius: 8 }}>{ln.map(([txt, col], j) => <span key={j} style={{ color: col }}>{txt}</span>)}</div>; })}
        </div>)}
      </Cam>
      {[['✓  сценарий', C.dScript, 110, 300], ['✓  код анимации', C.dAnim, 420, 1440]].map(([txt, at, x, y], i) => {
        const k = pr(t, at as number, .5); if (t < (at as number)) return null;
        return <div key={i} style={{ position: 'absolute', left: x as number, top: y as number, padding: '20px 36px', borderRadius: 60, background: 'rgba(24,22,20,.88)', border: `2.5px solid ${OR}`, fontFamily: SANS, fontWeight: 500, fontSize: 46, color: TX, boxShadow: `0 0 ${50 * decay(t, at as number, 2) + 18}px rgba(238,122,63,.55)`, opacity: clamp(k * 3), transform: `scale(${back(k)}) translateY(${Math.sin(t * 2 + i) * 6}px)`, filter: k < .6 ? `blur(${(1 - k / .6) * 10}px)` : 'none' }}>{txt}</div>;
      })}
    </AbsoluteFill>}
    <Sub t={t} id="d" />
    <Vignette o={.7} />
  </Scene>;
};

const E: React.FC<{ t: number }> = ({ t }) => {
  const s = S('e');
  const cmd = 'npx remotion render';
  const kc = pr(t, C.eCmd, Math.max(.3, C.eGo - .15 - C.eCmd));
  const pill = ex(pr(t, C.eGo, .5)), p = eio(pr(t, C.eGo + .1, Math.max(.6, C.eDone - C.eGo - .1))), done = t >= C.eDone;
  const thumbs = ['a', 'b', 'c', 'd', 'a', 'b', 'c', 'd', 'a', 'b'];
  return <Scene t={t} id="e" bg={BG}>
    <Cam tf={`scale(${1.04 + (t - s.start) * .015})`}>
      <Horizon t={t} y={1640} o={.45} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', fontFamily: MONO, fontSize: 44, color: '#cfc8bf' }}><span style={{ color: OR }}>$ </span>{cmd.slice(0, Math.round(cmd.length * kc))}<span style={{ opacity: t < C.eGo && Math.sin(t * 14) > 0 ? 1 : 0, color: OR }}>▍</span></div>
      {/* film strip of rendered frames */}
      <div style={{ position: 'absolute', left: 0, top: 1090, width: 1080, height: 330, opacity: pill }}>
        {thumbs.map((k, i) => {
          const x = ((i * 210 - (t - s.start) * 260 * (done ? .3 : 1)) % 2100 + 2100) % 2100 - 300, depth = Math.abs(x + 90 - 540) / 540;
          return <div key={i} style={{ position: 'absolute', left: x, top: 20, width: 180, height: 300, borderRadius: 20, overflow: 'hidden', border: `2px solid ${BORD}`, filter: `blur(${depth * 5}px)`, opacity: 1 - depth * .5, transform: `scale(${1 - depth * .15})`,
            background: k === 'a' ? 'radial-gradient(ellipse at 50% 120%, #f0702c 0%, #6a2508 40%, #0e0c0b 70%)' : k === 'b' ? '#0e0c0b' : k === 'c' ? 'radial-gradient(circle, #f7f3ee, #b7aea3)' : '#1d1b19' }}>
            {k === 'b' && <div style={{ position: 'absolute', left: 20, top: 120, fontFamily: SANS, fontStyle: 'italic', fontWeight: 200, fontSize: 52, color: OR2 }}>один</div>}
            {k === 'c' && <div style={{ position: 'absolute', left: 50, top: 110 }}><Spark size={80} /></div>}
            {k === 'd' && <div style={{ position: 'absolute', left: 16, right: 16, top: 130, height: 50, borderRadius: 14, border: `2px solid ${BORD}` }} />}
          </div>;
        })}
      </div>
      {/* glowing render pill */}
      <div style={{ position: 'absolute', left: 540 - 330, top: 820, width: 660, height: 150, transform: `scale(${lerp(.6, 1, pill) + .06 * decay(t, C.eDone, 5)})`, opacity: pill, filter: pill < 1 ? `blur(${(1 - pill) * 14}px)` : 'none' }}>
        <div style={{ position: 'absolute', inset: -14, borderRadius: 90, background: `conic-gradient(from ${t * 160}deg, #ee7a3f, #ffcf7a, #ff5d7a, #ee7a3f)`, filter: 'blur(26px)', opacity: done ? .9 : .65 }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 80, background: done ? OR : '#171412', border: `2.5px solid ${done ? OR2 : 'rgba(255,160,100,.6)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: SANS, fontWeight: 500, fontSize: 50, color: done ? '#1a1310' : TX }}>
          {!done && <svg width={50} height={50} viewBox="0 0 50 50" style={{ transform: `rotate(${t * 400}deg)` }}><circle cx={25} cy={25} r={19} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={6} /><path d="M25 6 A19 19 0 0 1 44 25" stroke={OR2} strokeWidth={6} fill="none" strokeLinecap="round" /></svg>}
          {done ? 'Готово ✓' : <span>Рендер <span style={{ fontVariantNumeric: 'tabular-nums', display: 'inline-block', width: 110, textAlign: 'right' }}>{Math.round(p * 100)}%</span></span>}
        </div>
      </div>
    </Cam>
    <Sub t={t} id="e" />
    <Vignette o={.7} />
  </Scene>;
};

const F: React.FC<{ t: number }> = ({ t }) => {
  const s = S('f'), lt = t - s.start, flash = decay(t, s.start, 3.2);
  const card = ex(pr(t, s.start + .05, .8));
  const prog = clamp(lt / (s.end - s.start));
  return <Scene t={t} id="f" bg="#f3f0eb" inBlur={false}>
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #ffffff 0%, #f1ede7 50%, #b9b2a9 100%)' }} />
    <Cam tf={`scale(${1.02 + lt * .012})`}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 255, textAlign: 'center', fontFamily: MONO, fontSize: 30, color: '#8a8178', opacity: card }}>мультик.mp4</div>
      <div style={{ position: 'absolute', left: 190, top: 310, width: 700, height: 880, borderRadius: 44, overflow: 'hidden', background: '#efe7dc', boxShadow: '0 50px 110px rgba(60,40,20,.28), 0 0 0 1.5px rgba(0,0,0,.06)', opacity: card, transform: `translateY(${(1 - card) * 120}px) scale(${lerp(.9, 1, card)}) rotateX(${(1 - card) * 14}deg)`, filter: card < .95 ? `blur(${(1 - card) * 14}px)` : 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, #fbf3e6, #ead9c4)' }} />
        <div style={{ position: 'absolute', left: 150, top: 120, width: 400, height: 510 }}><Kodik t={t} wave jump={s.start + .9 + Math.floor(lt / 2) * 2} /></div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: 'linear-gradient(transparent, rgba(0,0,0,.45))' }} />
        <div style={{ position: 'absolute', left: 40, right: 40, bottom: 44, display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width={30} height={34} viewBox="0 0 12 14"><path d="M1 1v12l10-6z" fill="#fff" /></svg>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.35)' }}><div style={{ width: `${prog * 100}%`, height: '100%', borderRadius: 4, background: OR }} /></div>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 28, color: '#fff' }}>0:{String(Math.floor(lt + 12)).padStart(2, '0')}</span>
        </div>
      </div>
      <Words t={t} toks={toksOf('f', 0, 3)} strike={['after', 'effects']} strikeAt={C.fAe + .45} style={{ position: 'absolute', left: 40, right: 40, top: 1290, textAlign: 'center', fontFamily: SERIF, fontSize: 86, color: '#1d1916', letterSpacing: -1.5 }} />
      <Words t={t} toks={toksOf('f', 3)} hi={['денег']} hiColor={CL} style={{ position: 'absolute', left: 40, right: 40, top: 1410, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 86, color: '#1d1916', letterSpacing: -1.5 }} />
    </Cam>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${flash}) 0%, rgba(255,240,225,${flash * .9}) 60%, rgba(255,230,210,${flash * .7}) 100%)` }} />
  </Scene>;
};

const G: React.FC<{ t: number }> = ({ t }) => {
  const s = S('g'), lt = t - s.start;
  const bar = ex(pr(t, C.gTg + .1, .6));
  const handle = '@claudecode09', typed = handle.slice(0, Math.round(handle.length * pr(t, C.gTg + .45, .7)));
  const orbPath = (x: number): Pt => { const k = eio(clamp((x - s.start) / Math.max(.5, C.gLink - s.start))); return [lerp(160, 860, k), lerp(380, 1065, k) - Math.sin(k * Math.PI) * 260]; };
  const end = clamp((t - (DUR - .6)) / .6);
  return <Scene t={t} id="g" bg={BG}>
    <Cam tf={`scale(${1.03 + lt * .012})`}>
      <Horizon t={t} y={1400} o={.95} />
      {t < C.gLink + .1 && <Orb t={t} path={orbPath} />}
      <Words t={t} toks={toksOf('g', 0, 2)} hi={['промпты']} under={false} style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: SANS, fontWeight: 200, fontStyle: 'italic', fontSize: 150, letterSpacing: -6, color: TX, lineHeight: 1.05 }} />
      <Words t={t} toks={toksOf('g', 2, 5)} style={{ position: 'absolute', left: 60, right: 60, top: 780, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontStyle: 'italic', fontSize: 62, color: '#cfc8bf' }} />
      <div style={{ position: 'absolute', left: 150, top: 990, width: 780, height: 136, opacity: bar, transform: `scale(${lerp(.7, 1, bar) + .05 * decay(t, C.gLink, 5)})`, filter: bar < 1 ? `blur(${(1 - bar) * 12}px)` : 'none' }}>
        <div style={{ position: 'absolute', inset: -12, borderRadius: 80, background: `conic-gradient(from ${t * 120}deg, #ee7a3f, #ffcf7a, #ff5d7a, #5ab0ff, #ee7a3f)`, filter: 'blur(22px)', opacity: .55 + .4 * decay(t, C.gLink, 2) }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 70, background: '#fbf8f4', display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px 0 40px', fontFamily: SANS, fontWeight: 500, fontSize: 50, color: '#1d1916' }}>
          <svg width={44} height={44} viewBox="0 0 24 24"><circle cx={10.5} cy={10.5} r={7} stroke="#1d1916" strokeWidth={2.6} fill="none" /><path d="M16 16l5 5" stroke="#1d1916" strokeWidth={2.6} strokeLinecap="round" /></svg>
          <span>{typed}<span style={{ opacity: typed.length < handle.length && Math.sin(t * 14) > 0 ? 1 : 0, color: OR }}>|</span></span>
          <div style={{ marginLeft: 'auto', width: 92, height: 92, borderRadius: 46, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={48} height={48} viewBox="0 0 24 24"><path d="M21.5 3.5L2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7l3.1-15.6c.2-1-.8-1.7-1.9-1.3zM9.4 14.6l9-7.7-7.2 9.2-.4 3.1-1.4-4.6z" fill="#1a1310" /></svg></div>
        </div>
      </div>
      <Words t={t} toks={toksOf('g', 5)} style={{ position: 'absolute', left: 60, right: 60, top: 1200, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontStyle: 'italic', fontSize: 54, color: TX }} />
      {t >= C.gHead && <div style={{ position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontSize: 70, color: OR, opacity: pr(t, C.gHead, .3), transform: `translateY(${-Math.abs(Math.sin((t - C.gHead) * 4)) * 22}px)` }}>↑</div>}
    </Cam>
    <Vignette o={.6} />
    <AbsoluteFill style={{ background: '#000', opacity: end }} />
  </Scene>;
};

const COMPS: Record<string, React.FC<{ t: number }>> = { a: A, b: B, c: Cc, d: D, e: E, f: F, g: G };

export const Cine: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const s = SC.find((x) => t >= x.start && t < x.end) || SC[SC.length - 1];
  const Comp = COMPS[s.id];
  return <AbsoluteFill style={{ background: BG }}>
    <Comp t={t} />
    <Grain f={f} o={s.id === 'f' ? .05 : .08} />
    {M.voice && <Audio src={staticFile('cine/voice.mp3')} />}
    <Audio src={staticFile('cine/music.wav')} volume={M.voice ? .55 : .8} />
    <Audio src={staticFile('cine/sfx.wav')} volume={.6} />
  </AbsoluteFill>;
};
