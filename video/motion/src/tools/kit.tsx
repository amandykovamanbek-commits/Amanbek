// Design kit for «10 инструментов для Claude»: Apple-like type, glow/gradient/sweep text (Pinta-style), icons, windows.
import React from 'react';
import { AbsoluteFill, Img, staticFile, delayRender, continueRender } from 'remotion';
import { clamp, lerp, eo, ex, ei, eio, back, pr, decay, Spark } from '../v3/V3';
export { clamp, lerp, eo, ex, ei, eio, back, pr, decay, Spark };
export { Cursor, curPos, kf } from '../v3/V3';

if (typeof document !== 'undefined' && !(window as any).__toolsFonts) {
  (window as any).__toolsFonts = true;
  const h = delayRender('tools-fonts');
  const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116', LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212';
  const ps: Promise<any>[] = [];
  for (const [sub, rng] of [['cyrillic', CYR], ['latin', LAT]]) for (const w of ['500', '600', '700', '800', '900'])
    ps.push(new FontFace('Unbounded', `url(${staticFile(`fonts/unbounded-${sub}-${w}-normal.woff2`)})`, { weight: w, unicodeRange: rng }).load().then((f) => (document as any).fonts.add(f)));
  for (const [sub, rng] of [['cyrillic', CYR], ['latin', LAT]]) ps.push(new FontFace('Oswald', `url(${staticFile(`fonts/oswald-${sub}-700-normal.woff2`)})`, { weight: '700', unicodeRange: rng }).load().then((f) => (document as any).fonts.add(f)));
  ps.push((document as any).fonts.load('700 40px "Inter Display"'), (document as any).fonts.load('800 40px "Inter Display"'), (document as any).fonts.load('500 40px Inter'), (document as any).fonts.load('600 40px Inter'));
  Promise.all(ps).then(() => continueRender(h)).catch(() => continueRender(h));
}

// ---------- tokens
export const W = 1920, H = 1080;
export const BG = '#050506', TX = '#f5f5f7', T2 = '#a1a1a6', T3 = '#6e6e73', LINE = 'rgba(255,255,255,.09)';
export const OR = '#ff8a4c', OR2 = '#ffb27a', OR3 = '#e8592a', CL = '#d97757', RED = '#ff4d4d', GRN = '#34c759', BLUE = '#0a84ff';
export const DISPLAY = '"Inter Display", Inter, sans-serif', TEXT = 'Inter, "Inter Display", sans-serif', WIDE = 'Unbounded, sans-serif', MONO = '"JetBrains Mono", monospace', SERIF = '"Source Serif 4", serif';

export const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgba = (c: string, a: number) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };
export const mix = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); const c = A.map((x, i) => Math.round(lerp(x, B[i], clamp(k)))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
export const mixHex = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); return '#' + A.map((x, i) => Math.round(lerp(x, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); };
// smooth in/out window: 0 before a, 1 between a+din .. b-dout, 0 after b
export const win = (t: number, a: number, b: number, din = .6, dout = .5) => ex(pr(t, a, din)) * (1 - ei(pr(t, b - dout, dout)));
export const typed = (s: string, t: number, a: number, d: number) => s.slice(0, Math.round(s.length * clamp((t - a) / d)));
export const impulse = (t: number, at: number, d = .35) => (t < at || t > at + d ? 0 : Math.pow(1 - (t - at) / d, 2));

// entrance style: rise + blur + scale (Apple-like)
export const rise = (t: number, at: number, d = .9, dy = 40): React.CSSProperties => { const k = ex(pr(t, at, d)); return { opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * dy}px) scale(${lerp(.965, 1, k)})`, filter: k < .98 ? `blur(${(1 - k) * 12}px)` : undefined }; };
export const fall = (t: number, at: number, d = .45): React.CSSProperties => { const k = ei(pr(t, at, d)); return k <= 0 ? {} : { opacity: 1 - k, transform: `scale(${lerp(1, 1.03, k)})`, filter: `blur(${k * 14}px)` }; };
export const both = (t: number, a: number, b: number, d = .9, dy = 40): React.CSSProperties => {
  const r = rise(t, a, d, dy), f = fall(t, b - .45);
  if (t < b - .45) return r;
  return { ...f, transform: `${f.transform}` };
};
export const popS = (t: number, at: number, d = .55) => (t < at ? 0 : back(pr(t, at, d)));

// ---------- per-letter title with gradient, glow layer, light sweep and chromatic hits
type TitleP = { t: number; at: number; text: string; size: number; weight?: number; font?: string; color?: string; grad?: [string, string]; glow?: string; glowR?: number; glowO?: number;
  sweep?: number; sweepD?: number; chroma?: number[]; stagger?: number; d?: number; out?: number; align?: 'left' | 'center' | 'right'; track?: number; lh?: number; style?: React.CSSProperties; shadow?: boolean };
export const Title: React.FC<TitleP> = (p) => {
  const { t, at, text, size, weight = 700, font = DISPLAY, color = TX, grad, glow, glowR = .35, glowO = .55, sweep, sweepD = 1.1, chroma = [], stagger = .028, d = .8, out = 1e9, align = 'left', track = -.035, lh = 1.04, style, shadow = true } = p;
  const chars = [...text]; const N = chars.length;
  const ch = Math.max(0, ...chroma.map((c) => impulse(t, c, .45)));
  const sp = sweep !== undefined ? (t - sweep) / sweepD * (N + 8) - 4 : -99;
  const layer = (mode: 'main' | 'glow' | 'r' | 'b') => {
    let idx = 0;
    return text.split(' ').map((word, wi) => <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: wi < text.split(' ').length - 1 ? '.26em' : 0 }}>
      {[...word].map((c, ci) => {
        const i = idx++; while (chars[idx] === ' ') idx++;
        const k = ex(pr(t, at + i * stagger, d)), o = ei(pr(t, out + i * .012, .4));
        const sw = Math.exp(-Math.pow((i - sp) / 1.7, 2));
        const base: React.CSSProperties = { display: 'inline-block', transform: `translateY(${(1 - k) * 105 - o * 60}%) rotate(${(1 - k) * 8}deg)`, transformOrigin: '0 100%', opacity: clamp(k * 1.6) * (1 - o) };
        let paint: React.CSSProperties;
        if (mode === 'glow') paint = { color: glow };
        else if (mode === 'r') paint = { color: 'rgba(255,40,80,.9)' };
        else if (mode === 'b') paint = { color: 'rgba(0,220,255,.9)' };
        else if (grad) paint = { backgroundImage: `linear-gradient(180deg, ${mix(grad[0], '#ffffff', sw * .85)} 8%, ${mix(grad[1], '#fff6ee', sw * .7)} 92%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
        else paint = { color: sw > .02 ? mix(color.startsWith('#') ? color : '#f5f5f7', '#ffffff', sw) : color };
        return <span key={ci} style={{ display: 'inline-block', overflow: 'hidden', padding: '.08em .02em .16em', margin: '-.08em -.02em -.16em', verticalAlign: 'top' }}>
          <span style={{ ...base, ...paint, filter: mode === 'main' && k < .97 ? `blur(${(1 - k) * 8}px)` : undefined }}>{c}</span></span>;
      })}</span>);
  };
  const common: React.CSSProperties = { fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: `${track}em`, lineHeight: lh, textAlign: align, whiteSpace: 'pre-wrap' };
  return <div style={{ position: 'relative', ...common, ...style }}>
    {glow && <div aria-hidden style={{ ...common, position: 'absolute', inset: 0, filter: `blur(${size * glowR}px)`, opacity: glowO * (1 + (sp > -50 ? .6 * Math.exp(-Math.pow((sp - N / 2) / (N / 2 + 3), 2)) : 0)) }}>{layer('glow')}</div>}
    {shadow && <div aria-hidden style={{ ...common, position: 'absolute', inset: 0, color: 'rgba(0,0,0,.55)', transform: `translateY(${size * .06}px)`, filter: `blur(${size * .08}px)` }}>{layer('glow')}</div>}
    {ch > .01 && <div aria-hidden style={{ ...common, position: 'absolute', inset: 0, transform: `translateX(${-ch * size * .07}px)`, mixBlendMode: 'screen', opacity: ch }}>{layer('r')}</div>}
    {ch > .01 && <div aria-hidden style={{ ...common, position: 'absolute', inset: 0, transform: `translateX(${ch * size * .07}px)`, mixBlendMode: 'screen', opacity: ch }}>{layer('b')}</div>}
    <div style={{ position: 'relative' }}>{layer('main')}</div>
  </div>;
};
// word-by-word fade-up (body copy)
export const Words: React.FC<{ t: number; at: number; text: string; size: number; weight?: number; font?: string; color?: string; stagger?: number; out?: number; align?: 'left' | 'center' | 'right'; lh?: number; style?: React.CSSProperties; hi?: Record<string, string> }> =
  ({ t, at, text, size, weight = 500, font = TEXT, color = T2, stagger = .055, out = 1e9, align = 'left', lh = 1.3, style, hi = {} }) => (
    <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: lh, color, textAlign: align, letterSpacing: '-.012em', ...style }}>
      {text.split(' ').map((w, i) => { const k = ex(pr(t, at + i * stagger, .7)), o = ei(pr(t, out + i * .01, .35)); const hc = hi[w.replace(/[.,!?:]/g, '')];
        return <span key={i} style={{ display: 'inline-block', marginRight: '.27em', opacity: clamp(k * 1.5) * (1 - o), transform: `translateY(${(1 - k) * .45}em)`, filter: k < .97 ? `blur(${(1 - k) * 6}px)` : undefined, color: hc || undefined }}>{w}</span>; })}
    </div>
  );
export const Eyebrow: React.FC<{ t: number; at: number; text: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ t, at, text, color = OR, size = 20, style }) => {
  const k = ex(pr(t, at, .8));
  return <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...style }}>
    <i style={{ width: 34 * k, height: 2, borderRadius: 1, background: color, boxShadow: `0 0 12px ${color}` }} />
    <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: size, letterSpacing: '.16em', color, opacity: k, transform: `translateX(${(1 - k) * -12}px)`, display: 'inline-block', filter: k < .97 ? `blur(${(1 - k) * 6}px)` : undefined }}>{text}</span>
  </div>;
};

// odometer number in the wide font (Pinta style: gradient + glow + sweep); each column is as wide as its target digit
export const BigNum: React.FC<{ t: number; at: number; value: string; size: number; grad?: [string, string]; glow?: string; sweep?: number; chroma?: number[]; from?: string; inAt?: number }> = ({ t, at, value, size, grad = ['#fff1e6', OR], glow = OR, sweep, chroma = [], from, inAt }) => {
  const digits = [...value], f0 = from ? [...from] : digits.map(() => '0');
  const hgt = size * 1.02, ch = Math.max(0, ...chroma.map((c) => impulse(t, c, .45)));
  const sp = sweep !== undefined ? (t - sweep) / 1.0 * (digits.length + 2) - 1 : -99;
  const col = (mode: string) => <div style={{ display: 'flex', fontFamily: WIDE, fontWeight: 900, fontSize: size, lineHeight: `${hgt}px`, letterSpacing: '-.02em' }}>
    {digits.map((dg, i) => {
      const k = eio(clamp((t - at - i * .08) / 1.05)); const a = +f0[i] || 0, b = +dg; const pos = isNaN(b) ? 0 : lerp(a, b + (b < a ? 10 : 0), k);
      const strip = isNaN(b) ? [dg] : Array.from({ length: 21 }, (_, j) => String(j % 10));
      const sw = Math.exp(-Math.pow((i - sp) / .8, 2));
      const paint: React.CSSProperties = mode === 'main' ? { backgroundImage: `linear-gradient(180deg, ${mix(grad[0], '#ffffff', sw)} 10%, ${mix(grad[1], '#fff3ea', sw * .75)} 95%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : mode === 'glow' ? { color: glow } : { color: mode === 'r' ? 'rgba(255,40,80,.9)' : 'rgba(0,220,255,.9)' };
      return <div key={i} style={{ height: hgt, overflow: 'hidden', position: 'relative', marginRight: i < digits.length - 1 ? -size * .04 : 0 }}>
        <div style={{ visibility: 'hidden', height: hgt }}>{dg}</div>
        <div style={{ position: 'absolute', left: '50%', top: 0, transform: `translate(-50%, ${-pos * hgt}px)`, textAlign: 'center', filter: mode === 'main' && k > 0 && k < 1 ? `blur(${Math.sin(Math.PI * k) * 3}px)` : undefined }}>{strip.map((s, j) => <div key={j} style={{ height: hgt, ...paint }}>{s}</div>)}</div>
      </div>;
    })}</div>;
  const kIn = ex(pr(t, inAt ?? at, .7));
  return <div style={{ position: 'relative', opacity: kIn, transform: `scale(${lerp(.9, 1, kIn)})`, transformOrigin: '0 60%' }}>
    <div style={{ position: 'absolute', inset: 0, filter: `blur(${size * .22}px)`, opacity: .55 + .35 * Math.max(0, Math.exp(-Math.pow((sp - (digits.length - 1) / 2) / 1.5, 2))) }}>{col('glow')}</div>
    {ch > .01 && <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-ch * 12}px)`, mixBlendMode: 'screen', opacity: ch }}>{col('r')}</div>}
    {ch > .01 && <div style={{ position: 'absolute', inset: 0, transform: `translateX(${ch * 12}px)`, mixBlendMode: 'screen', opacity: ch }}>{col('b')}</div>}
    <div style={{ position: 'relative' }}>{col('main')}</div>
  </div>;
};
export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- surfaces
export const glass = (accent = '#ffffff', a = .06): React.CSSProperties => ({ background: `linear-gradient(180deg, rgba(40,40,44,.78), rgba(20,20,22,.86))`, border: `1px solid rgba(255,255,255,${a + .04})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.55), 0 0 0 .5px ${rgba(accent, .15)}` });
// macOS-style window with 3D settle-in
export const Win: React.FC<{ t: number; at: number; out?: number; x: number; y: number; w: number; h: number; title?: string; bg?: string; bar?: string; children?: React.ReactNode; tilt?: number; light?: boolean; style?: React.CSSProperties; glowC?: string; noBar?: boolean }> =
  ({ t, at, out = 1e9, x, y, w, h, title = '', bg = '#1c1c1e', bar = '#2a2a2d', children, tilt = 10, light, style, glowC, noBar }) => {
    const k = ex(pr(t, at, 1.1)), o = ei(pr(t, out, .5));
    if (k <= 0 || o >= 1) return null;
    return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, perspective: 2400, opacity: clamp(k * 1.5) * (1 - o), ...style }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden', background: bg, transform: `translateY(${(1 - k) * 80 + o * -20}px) rotateX(${(1 - k) * tilt}deg) scale(${lerp(.94, 1, k) * lerp(1, 1.03, o)})`, transformOrigin: '50% 100%',
        filter: k < .98 || o > 0 ? `blur(${(1 - k) * 14 + o * 14}px)` : undefined,
        boxShadow: `0 60px 140px rgba(0,0,0,.65), 0 0 0 1px ${light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.1)'}${glowC ? `, 0 0 120px ${rgba(glowC, .22)}` : ''}` }}>
        {!noBar && <div style={{ height: 46, background: bar, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9, borderBottom: `1px solid ${light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)'}`, position: 'relative' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
          <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: TEXT, fontWeight: 600, fontSize: 15, color: light ? '#3a3a3c' : '#9e9ea3', pointerEvents: 'none' }}>{title}</div>
        </div>}
        <div style={{ position: 'absolute', left: 0, right: 0, top: noBar ? 0 : 46, bottom: 0 }}>{children}</div>
      </div>
    </div>;
  };
export const Chip: React.FC<{ t: number; at: number; x: number; y: number; children: React.ReactNode; accent?: string; float?: number; out?: number; size?: number; icon?: React.ReactNode }> = ({ t, at, x, y, children, accent = OR, float = 0, out = 1e9, size = 26, icon }) => {
  const k = popS(t, at, .6), o = ei(pr(t, out, .35)); if (!k || o >= 1) return null;
  return <div style={{ position: 'absolute', left: x, top: y + Math.sin(t * 1.4 + float) * 5, display: 'flex', alignItems: 'center', gap: 12, padding: `${size * .5}px ${size * 1.05}px`, borderRadius: 999, ...glass(accent), fontFamily: TEXT, fontWeight: 600, fontSize: size, color: TX, whiteSpace: 'nowrap', transform: `scale(${k * (1 - o * .1)})`, opacity: clamp(k * 2) * (1 - o), boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), 0 20px 50px rgba(0,0,0,.5), 0 0 ${20 + 40 * decay(t, at, 2.5)}px ${rgba(accent, .45)}` }}>
    {icon || <i style={{ width: size * .38, height: size * .38, borderRadius: '50%', background: accent, boxShadow: `0 0 12px ${accent}` }} />}{children}</div>;
};

// ---------- icons
const I = (d: string, s = 26, c = '#f5f5f7', w = 2) => <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block' }}><path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
export const IC = {
  check: (s = 22, c = '#fff') => I('M5 12.5l4.5 4.5L19 7.5', s, c, 2.6), plus: (s = 22, c = '#f5f5f7') => I('M12 5v14M5 12h14', s, c), arrowUp: (s = 22, c = '#111') => I('M12 19V5M5 12l7-7 7 7', s, c, 2.6),
  arrowR: (s = 22, c = '#fff') => I('M4 12h15M13 6l6 6-6 6', s, c, 2.4), play: (s = 22, c = '#fff') => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill={c} /></svg>,
  search: (s = 22, c = '#8e8e93') => I('M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.5-4.5', s, c), dl: (s = 22, c = '#fff') => I('M12 4v11M7 11l5 5 5-5M5 20h14', s, c, 2.4),
  mic: (s = 22, c = '#fff') => I('M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3', s, c), clock: (s = 22, c = '#fff') => I('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', s, c),
  branch: (s = 22, c = '#fff') => I('M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9', s, c), undo: (s = 22, c = '#fff') => I('M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', s, c, 2.4),
  link: (s = 22, c = '#fff') => I('M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1', s, c), x: (s = 22, c = '#fff') => I('M6 6l12 12M18 6L6 18', s, c, 2.6),
  file: (s = 22, c = '#fff') => I('M6 2h9l5 5v15H6zM14 2v6h6', s, c), star: (s = 22, c = '#fff') => I('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', s, c),
};
export const LockIcon: React.FC<{ s?: number; open?: number; c?: string }> = ({ s = 40, open = 0, c = '#fff' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible' }}>
    <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round" transform={`translate(${open * 3} ${-open * 3.5})`} />
    <rect x={5} y={10.5} width={14} height={10.5} rx={2.6} fill={c} /><circle cx={12} cy={15.2} r={1.5} fill="#111" /><path d="M12 15.5v2.2" stroke="#111" strokeWidth={1.4} strokeLinecap="round" />
  </svg>
);
export const TgIcon: React.FC<{ s?: number; c?: string }> = ({ s = 40, c = '#fff' }) => <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block' }}><path d="M21.5 3.5L2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7l3.1-15.6c.2-1-.8-1.7-1.9-1.3zM9.4 14.6l9-7.7-7.2 9.2-.4 3.1-1.4-4.6z" fill={c} /></svg>;
export const TgBadge: React.FC<{ s?: number }> = ({ s = 64 }) => <div style={{ width: s, height: s, borderRadius: s / 2, background: 'linear-gradient(160deg,#41b4ec,#1d8fd0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(65,180,236,.45)' }}><TgIcon s={s * .56} /></div>;

// glossy tool tiles (simplified, recognisable glyphs)
export type ToolK = 'el' | 'figma' | 'canva' | 'vidiq' | 'notion' | 'github' | 'brag' | 'docs' | 'skill' | 'research' | 'cc' | 'remotion' | 'tg' | 'ae' | 'claude' | 'yt';
export const TOOL_NAME: Record<ToolK, string> = { el: 'ElevenLabs', figma: 'Figma', canva: 'Canva', vidiq: 'vidIQ', notion: 'Notion', github: 'GitHub', brag: 'brag-slim', docs: 'PDF · Word · PPT', skill: 'skill-creator', research: 'deep-research', cc: 'Claude Code', remotion: 'Remotion', tg: 'Telegram', ae: 'After Effects', claude: 'Claude', yt: 'YouTube' };
const TILE: Record<ToolK, [string, string]> = { el: ['#2b2b2f', '#0c0c0e'], figma: ['#2c2c30', '#111113'], canva: ['#20c5d0', '#7b3fe4'], vidiq: ['#3d8bff', '#1450d8'], notion: ['#ffffff', '#e9e9e6'], github: ['#2f353d', '#0d1117'], brag: ['#ff9a5c', '#e8532a'], docs: ['#ff6a5c', '#d8342a'], skill: ['#f0905f', '#c9562c'], research: ['#4cc9ff', '#1479d6'], cc: ['#2b2420', '#120e0c'], remotion: ['#3f8cff', '#0b5ce0'], tg: ['#41b4ec', '#1d8fd0'], ae: ['#3a2a8c', '#1a0f4d'], claude: ['#f0905f', '#c9562c'], yt: ['#ff3a3a', '#d10f0f'] };
export const Glyph: React.FC<{ k: ToolK; s: number }> = ({ k, s }) => {
  const u = s / 100;
  switch (k) {
    case 'el': return <div style={{ display: 'flex', gap: 14 * u }}>{[0, 1].map((i) => <i key={i} style={{ width: 13 * u, height: 50 * u, borderRadius: 3 * u, background: '#fff' }} />)}</div>;
    case 'figma': return <svg width={42 * u} height={62 * u} viewBox="0 0 38 57"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1abcfe" /><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0acf83" /><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19z" fill="#ff7262" /><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#f24e1e" /><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#a259ff" /></svg>;
    case 'canva': return <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 64 * u, color: '#fff', lineHeight: 1, marginTop: -6 * u }}>C</span>;
    case 'vidiq': return <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 34 * u, color: '#fff', letterSpacing: '-.04em' }}>vidIQ</span>;
    case 'notion': return <div style={{ width: 52 * u, height: 56 * u, border: `${4 * u}px solid #111`, borderRadius: 7 * u, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 500, fontSize: 40 * u, color: '#111', background: '#fff' }}>N</div>;
    case 'github': return I('M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9', 58 * u, '#fff', 2.1);
    case 'brag': return <svg width={56 * u} height={56 * u} viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="#fff" /><path d="M20 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#fff" /></svg>;
    case 'docs': return <div style={{ position: 'relative', width: 60 * u, height: 62 * u }}>{[['#2b7cd3', 'W', -10], ['#d24726', 'P', 10], ['#fff', 'PDF', 0]].map(([c, l, r], i) => <div key={i} style={{ position: 'absolute', left: 10 * u + (i - 1) * 8 * u, top: 4 * u, width: 40 * u, height: 52 * u, borderRadius: 6 * u, background: c as string, transform: `rotate(${r}deg)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 * u, fontFamily: TEXT, fontWeight: 800, fontSize: (l === 'PDF' ? 12 : 16) * u, color: l === 'PDF' ? '#d8342a' : '#fff', boxShadow: '0 4px 10px rgba(0,0,0,.25)' }}>{l}</div>)}</div>;
    case 'skill': return <div style={{ position: 'relative' }}><Spark size={56 * u} color="#fff" /><div style={{ position: 'absolute', right: -10 * u, bottom: -8 * u, width: 26 * u, height: 26 * u, borderRadius: 13 * u, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I('M12 6v12M6 12h12', 18 * u, '#c9562c', 3.4)}</div></div>;
    case 'research': return <svg width={58 * u} height={58 * u} viewBox="0 0 24 24"><circle cx={10.5} cy={10.5} r={6.2} stroke="#fff" strokeWidth={2.4} fill="none" /><path d="M15.2 15.2L20.5 20.5" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" /><path d="M10.5 7.5v6M7.5 10.5h6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" opacity={.8} /></svg>;
    case 'cc': return <div style={{ display: 'flex', alignItems: 'center', gap: 4 * u }}><span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34 * u, color: OR2 }}>{'>_'}</span></div>;
    case 'remotion': return <svg width={58 * u} height={58 * u} viewBox="0 0 24 24"><path d="M6 4.5v15l12.5-7.5z" fill="#fff" opacity={.35} transform="translate(-2 0)" /><path d="M6 4.5v15l12.5-7.5z" fill="#fff" opacity={.7} transform="translate(0 0)" /><path d="M6 4.5v15l12.5-7.5z" fill="#fff" transform="translate(2 0)" /></svg>;
    case 'tg': return <TgIcon s={56 * u} />;
    case 'ae': return <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 44 * u, color: '#cfc3ff', letterSpacing: '-.02em' }}>Ae</span>;
    case 'claude': return <Spark size={60 * u} color="#fff" />;
    case 'yt': return <svg width={46 * u} height={46 * u} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff" /></svg>;
  }
};
export const Tile: React.FC<{ k: ToolK; s: number; style?: React.CSSProperties; glow?: number }> = ({ k, s, style, glow = 0 }) => {
  const [a, b] = TILE[k];
  return <div style={{ width: s, height: s, borderRadius: s * .24, background: `linear-gradient(150deg, ${a}, ${b})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 'none',
    boxShadow: `inset 0 ${s * .04}px ${s * .07}px rgba(255,255,255,${k === 'notion' ? .9 : .28}), inset 0 ${-s * .06}px ${s * .1}px rgba(0,0,0,.25), 0 ${s * .16}px ${s * .3}px rgba(0,0,0,.5)${glow ? `, 0 0 ${s * .6 * glow}px ${rgba(a, .55 * glow)}` : ''}`, ...style }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: s * .24, background: 'linear-gradient(180deg, rgba(255,255,255,.18), transparent 45%)', pointerEvents: 'none' }} />
    <Glyph k={k} s={s} />
  </div>;
};

// hand-drawn arrow / burst (thumbnail-style accents)
export const SketchArrow: React.FC<{ t: number; at: number; d: string; head: string; color?: string; w?: number; dur?: number; style?: React.CSSProperties; box?: [number, number] }> = ({ t, at, d, head, color = '#fff', w = 6, dur = .6, style, box = [400, 300] }) => {
  const k = eo(pr(t, at, dur)), kh = eo(pr(t, at + dur * .8, .25));
  if (k <= 0) return null;
  return <svg width={box[0]} height={box[1]} style={{ position: 'absolute', overflow: 'visible', filter: `drop-shadow(0 0 10px ${rgba(color.startsWith('#') ? color : '#ffffff', .5)})`, ...style }}>
    <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
    <path d={head} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - kh} />
  </svg>;
};
export const Burst: React.FC<{ t: number; at: number; x: number; y: number; r?: number; color?: string; n?: number; rot?: number }> = ({ t, at, x, y, r = 60, color = '#fff', n = 3, rot = -40 }) => {
  const k = pr(t, at, .5); if (k <= 0 || k >= 1) return null;
  return <svg width={4} height={4} style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}>
    {Array.from({ length: n }, (_, i) => { const a = (rot + (i - (n - 1) / 2) * 32) * Math.PI / 180, r0 = r * lerp(.6, 1.1, eo(k)), r1 = r0 + r * .45 * (1 - k);
      return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={1 - k * .6} />; })}
  </svg>;
};
// ring pulse
export const Ring: React.FC<{ t: number; at: number; x: number; y: number; r?: number; color?: string }> = ({ t, at, x, y, r = 80, color = OR }) => {
  const k = pr(t, at, .8); if (k <= 0 || k >= 1) return null;
  return <div style={{ position: 'absolute', left: x - r * eo(k), top: y - r * eo(k), width: 2 * r * eo(k), height: 2 * r * eo(k), borderRadius: '50%', border: `3px solid ${rgba(color, 1 - k)}` }} />;
};

// a bright flash frame for hits
export const Flash: React.FC<{ t: number; at: number; c?: string; o?: number }> = ({ t, at, c = '#fff', o = .35 }) => { const k = impulse(t, at, .5); return k > 0 ? <AbsoluteFill style={{ background: c, opacity: k * o, mixBlendMode: 'screen', pointerEvents: 'none' }} /> : null; };
export const Grain: React.FC<{ f: number }> = ({ f }) => <Img src={staticFile(`cine/grain/g${Math.floor(f / 2) % 6}.png`)} style={{ position: 'absolute', inset: 0, width: W, height: H, opacity: .07, mixBlendMode: 'overlay', objectFit: 'cover', pointerEvents: 'none' }} />;
export const Vig: React.FC = () => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 78% 78% at 50% 46%, transparent 58%, rgba(0,0,0,.72) 100%)', pointerEvents: 'none' }} />;
