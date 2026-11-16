// Standalone motion helpers (easing, keyframes, Claude spark, cursor) used by kit.tsx
import React from 'react';
const CL = '#d97757';
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const eo = (k: number) => 1 - Math.pow(1 - k, 3);
export const ex = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const ei = (k: number) => k * k * k;
export const eio = (k: number) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const back = (k: number) => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
export const pr = (t: number, a: number, d = .4) => clamp((t - a) / d);
export const decay = (t: number, a: number, r = 6) => (t < a ? 0 : Math.exp(-(t - a) * r));
export const noise = (t: number, f: number, p = 0) => Math.sin(t * f + p) * .6 + Math.sin(t * f * 2.31 + p * 1.7) * .4;
export const kf = (t: number, keys: [number, number][], ease = eio) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return lerp(va, vb, ease(clamp((t - a) / Math.max(1e-3, b - a)))); }
  return keys[keys.length - 1][1];
};
type Pt = [number, number];

// ---------- shared pieces
const RAYS = [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331].map((a, i) => ({ a, l: [92, 80, 96, 84, 90, 78, 95, 82, 92, 79, 97, 85][i] }));
export const Spark: React.FC<{ size: number; color?: string; stroke?: number; t?: number; breathe?: number }> = ({ size, color = CL, stroke = 17, t = 0, breathe = 0 }) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ display: 'block', overflow: 'visible' }}>
    {RAYS.map((r, i) => { const a = r.a * Math.PI / 180, l = r.l * (1 + breathe * .14 * Math.sin(t * 6 + i * 1.3)); return <line key={i} x1={Math.cos(a) * 8} y1={Math.sin(a) * 8} x2={Math.cos(a) * l} y2={Math.sin(a) * l} stroke={color} strokeWidth={stroke} strokeLinecap="round" />; })}
  </svg>
);
// mouse cursor (arrow / pointing hand) with click press + ripple
export const Cursor: React.FC<{ t: number; x: number; y: number; hand?: boolean; clicks: number[]; o?: number }> = ({ t, x, y, hand, clicks, o = 1 }) => {
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
export const curPos = (t: number, keys: [number, number, number][]): Pt => [kf(t, keys.map((k) => [k[0], k[1]] as [number, number])), kf(t, keys.map((k) => [k[0], k[2]] as [number, number]))];
