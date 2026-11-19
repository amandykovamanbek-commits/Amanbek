import React from "react";
import { Char, Pose } from "./rig/Char";
import { Cam } from "./scenes/BG";
import { blink, easeInOut, seg, lerp, shake, clamp, easeOut } from "./lib";

export type Ctx = { t: number; d: number; T: number };

// camera: centred on (960 + x, 540 + y), zoom z
export const Stage: React.FC<{ cam: Cam; bg?: (c: Cam) => React.ReactNode; children?: React.ReactNode; fg?: (c: Cam) => React.ReactNode; dof?: number }> = ({ cam, bg, children, fg, dof }) => (
  <g transform={`translate(960 540) scale(${cam.z}) rotate(${cam.rot || 0}) translate(${-(960 + cam.x)} ${-(540 + cam.y)})`}>
    {bg ? (dof ? <g filter="url(#f_dof)">{bg(cam)}</g> : bg(cam)) : null}
    {children}
    {fg ? fg(cam) : null}
  </g>
);

// camera moves ---------------------------------------------------------------
export const camLerp = (t: number, d: number, a: Partial<Cam>, b: Partial<Cam>, ease = easeInOut): Cam => {
  const k = ease(seg(t, 0, d));
  const A = { x: 0, y: 0, z: 1, rot: 0, ...a }, B = { x: 0, y: 0, z: 1, rot: 0, ...b };
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), z: lerp(A.z, B.z, k), rot: lerp(A.rot!, B.rot!, k) };
};
export const push = (t: number, d: number, z0 = 1, z1 = 1.1, x = 0, y = 0) => camLerp(t, d, { z: z0, x, y }, { z: z1, x, y }, (k) => k);
export const pan = (t: number, d: number, x0: number, x1: number, z = 1, y = 0) => camLerp(t, d, { x: x0, z, y }, { x: x1, z, y });
export const withShake = (c: Cam, t: number, trauma: number): Cam => {
  const [sx, sy, sr] = shake(t, trauma);
  return { ...c, x: c.x + sx, y: c.y + sy, rot: (c.rot || 0) + sr };
};
// trauma impulse that decays after time t0
export const hit = (t: number, t0: number, dur = 0.5, amp = 1) => (t < t0 ? 0 : clamp(1 - (t - t0) / dur) * amp);

// actor with automatic blink and breathing
export const Act: React.FC<{ id: string; p: Pose; t: number; seed?: number }> = ({ id, p, t, seed = 1 }) => (
  <Char id={id} p={{ blink: blink(t, seed), breath: t + seed, ...p }} t={t + seed} />
);

// big on-screen caption (the plan's "текст на экране")
export const Caption: React.FC<{ text: string; t: number; t0?: number; dur?: number; x?: number; y?: number; size?: number; c?: string; font?: string; stroke?: string }> = ({ text, t, t0 = 0, dur = 2.5, x = 960, y = 470, size = 120, c = "#fff", font = "'Rubik Dirt', 'Rubik', sans-serif", stroke = "#000" }) => {
  const k = seg(t, t0, t0 + 0.3), o = seg(t, t0 + dur - 0.35, t0 + dur);
  if (k <= 0 || o >= 1) return null;
  const sc = 1.25 - easeOut(k) * 0.25;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={k * (1 - o)}>
      <text textAnchor="middle" fontFamily={font} fontSize={size} fill={c} stroke={stroke} strokeWidth={size * 0.08} paintOrder="stroke" letterSpacing={size * 0.04}>
        {text}
      </text>
    </g>
  );
};

// overlay helpers
export const Dark: React.FC<{ op: number; c?: string }> = ({ op, c = "#000" }) => (op > 0 ? <rect x={-1000} y={-600} width={4000} height={2400} fill={c} opacity={op} /> : null);
export const Tint: React.FC<{ c: string; op: number; mode?: string }> = ({ c, op, mode = "multiply" }) => (
  <rect x={-1000} y={-600} width={4000} height={2400} fill={c} opacity={op} style={{ mixBlendMode: mode as any }} />
);
// letterbox bars for dramatic moments
export const Bars: React.FC<{ k: number }> = ({ k }) => (k > 0 ? <g><rect x={0} y={-10} width={1920} height={110 * k + 10} fill="#000" /><rect x={0} y={1080 - 110 * k} width={1920} height={120} fill="#000" /></g> : null);

// scent wisps (Tanjiro's nose)
export const Scent: React.FC<{ x: number; y: number; t: number; c: string; len?: number; label?: string; ang?: number }> = ({ x, y, t, c, len = 500, label, ang = 0 }) => {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const q = i / 23;
    return `${(q * len).toFixed(1)} ${(Math.sin(q * 9 + t * 3) * 30 * q).toFixed(1)}`;
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <path d={"M " + pts.join(" L ")} stroke={c} strokeWidth={18} fill="none" strokeLinecap="round" opacity={0.35} />
      <path d={"M " + pts.join(" L ")} stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
      {label ? <text x={len + 20} y={10} fontFamily="'Rubik', sans-serif" fontWeight={900} fontSize={40} fill={c} stroke="#000" strokeWidth={5} paintOrder="stroke">{label}</text> : null}
    </g>
  );
};
