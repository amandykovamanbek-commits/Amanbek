// Timeline of the beer flood short (London, 17 October 1814): 13 shots timed to the voice words (words.json,
// ElevenLabs denophine), the physics of the set (the slipping hoop, the vat bursting, the yard filling, the wall
// falling, the wave in the street) and the camera grammar of the bridge template (glides, push-ins, cuts, kicks).
// Axes: the great vat stands at the origin of the brewery yard; the yard's back wall runs along z = 9 and the slum
// street lies south of it (z 9.6..17.2) along x. The courtroom is at z ~ 500, the dining room at z ~ 560.
import WORDS from "./words.json";

export const FPS = 30;
export const TOTAL = 1843; // voice 61.44 s; the video ends on "пиво."
export const D0 = 0;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
type Word = { w: string; s: number; e: number };
const words = WORDS as Word[];
export const W = (i: number) => Math.round(words[i].s * FPS);
export const LEADF = 2;

// ---------------- the set ----------------
export const VAT = { r: 3.4, h: 6.7 };              // 22 ft vat, "as tall as a two-storey house"
export const WALL_Z = 9, STREET_Z0 = 9.6, STREET_Z1 = 17.2, WALL_H = 7.6;
export const BREACH = { x0: -5, x1: 5 };
export const COURT: V3 = [0, 0, 500];
export const BARREL: V3 = [-7.5, 0, 5.2];
export const DINING: V3 = [0, 0, 560];

export type Light = "day" | "golden";
export type Set = "street" | "yard" | "court" | "dining";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: Set; tau: (t: number) => number; sunAz?: number; sunEl?: number };
const CUT = (i: number) => W(i) - 3;
const B = [0, CUT(12), CUT(28), CUT(43), CUT(58), CUT(71), CUT(80), CUT(84), CUT(94), CUT(104), CUT(117), CUT(128), CUT(133), TOTAL];
const DEF: [Light, Set][] = [
  ["golden", "street"], // 1 hook: a wave of beer down the street
  ["day", "yard"],      // 2 1814, the brewery's pride, half a million litres
  ["day", "yard"],      // 3 a hoop slips off; the clerk shrugs
  ["golden", "yard"],   // 4 an hour later the vat bursts; workers waist-deep
  ["golden", "street"], // 5 the wall goes, the beer runs into the slum
  ["golden", "street"], // 6 families in the cellars; eight dead
  ["golden", "yard"],   // 7 why did it burst?
  ["day", "yard"],      // 8 a liquid presses hardest at the bottom
  ["day", "dining"],    // 9 hoops hold a vat like a belt holds a belly after a feast
  ["day", "dining"],    // 10 one goes, the rest take the load, until it bursts at the seams
  ["day", "court"],     // 11 luckily a court; unluckily an act of God
  ["day", "court"],     // 12 the brewery owes the victims nothing
  ["day", "court"],     // 13 the state owes the brewery: the duty refunded
];
export const SHOTS: ShotDef[] = DEF.map(([light, set], i) => ({ id: i + 1, a: B[i], b: B[i + 1], light, set, tau: (t: number) => t }));
export const XFADE: Record<number, number> = { 4: 8, 8: 10, 9: 8, 11: 8 };
export const FLASH_AT = B[1] - 3;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- events ----------------
export const F_HOOP = W(31), F_BURST = W(47), F_WALL = W(59), F_BELT = W(104), F_SEAMS = W(114), F_GOD = W(126), F_REFUND = W(139);
export const BUTTONS = [W(107), W(108), W(110)];
/** state of the brewery set for shot id at frame f */
export type SetState = {
  hoop: number;     // 0 on the vat .. 1 lying on the ground
  burst: number;    // seconds since the vat burst (<0: intact)
  yard: number;     // beer level in the yard (m)
  wall: number;     // seconds since the wall went (<0: standing)
  wave: number;     // seconds since the beer reached the street (<0: dry street)
  intact: boolean;  // the diagram flashback: everything whole again
  crestS?: number;  // seconds used for the crest height (the hook keeps it tall)
};
const T = (f: number) => f / FPS;
export const setAt = (id: number, f: number): SetState => {
  const t = T(f);
  if (id === 1) return { hoop: 1, burst: 30, yard: 0.5, wall: 30, wave: 1.2 + 0.55 * t, intact: false, crestS: 0.5 };
  if (id === 2 || id === 8) return { hoop: 0, burst: -1, yard: 0, wall: -1, wave: -1, intact: true };
  if (id === 3) return { hoop: easeOut((f - F_HOOP + 2) / 14), burst: -1, yard: 0, wall: -1, wave: -1, intact: false };
  const burst = T(f - F_BURST), wall = T(f - F_WALL);
  const yard = burst < 0 ? 0 : wall < 0 ? 1.1 * smooth(burst / 1.6) : 1.1 - 0.6 * smooth(wall / 3);
  return { hoop: 1, burst, yard, wall, wave: wall - 0.15, intact: false };
};
/** the wave in the street: crest height and front distance (m from the breach) at s seconds after it got out */
export const waveFront = (s: number) => Math.min(80, 3 + 7.5 * s);
export const waveCrest = (s: number) => 4.4 * Math.exp(-0.22 * Math.max(0, s));

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const D = (pos: V3, look: V3, f0: number, rate: number, rest: Partial<Cam> = {}, punch = 0, n = 35) => (f: number) => dolly(pos, look, pushK(f, f0, rate, punch, n), rest);
const S = (i: number) => SHOTS[i - 1].a;
const C = (x: number, y: number, z: number, o: V3): V3 => [o[0] + x, o[1] + y, o[2] + z];

const CAMS: Record<number, Key[]> = {
  // the hook backs away down the street from the oncoming wave
  1: [{ f: 0, s: (f) => ({ pos: [-31 - 0.045 * f, 1.3, 13.6], look: [-8 - 0.045 * f, 2.6, 13.3], fov: 50, roll: 0.03 }) }],
  2: [
    { f: S(2), s: D([-11.5, 1.5, 7.6], [0, 4.6, 0], S(2), 0.0022, { fov: 52 }) },
    { f: W(23) - 12, dur: 30, s: D([2.0, 10.2, 6.2], [0, 6.0, 0], W(23) - 12, 0.0025, { fov: 46 }) },
  ],
  3: [
    { f: S(3), s: D([-6.6, 1.35, 5.8], [-2.0, 0.55, 2.3], S(3), 0.0025, { fov: 44, roll: 0.03 }, 0.006, 30) },
    { f: W(34) - 5, cut: true, s: D([-9.2, 1.7, 7.7], [-5.0, 1.75, 4.5], W(34) - 5, 0.0025, { fov: 40 }) },
  ],
  4: [
    { f: S(4) - 4, s: D([-12.5, 2.2, 8.0], [0, 3.4, 0], S(4) - 4, 0.0022, { fov: 52, roll: -0.03 }) },
    { f: W(48) - 5, cut: true, s: D([9.6, 1.65, 8.3], [4.1, 1.2, 5.1], W(48) - 5, 0.0025, { fov: 44 }) },
  ],
  5: [
    { f: S(5), s: D([-9.5, 3.0, 16.9], [0, 3.4, 9.3], S(5), 0.0018, { fov: 54 }) },
    { f: W(66) - 10, dur: 30, s: D([-26, 3.6, 15.6], [-5, 1.6, 13], W(66) - 10, 0.002, { fov: 48, roll: 0.03 }) },
  ],
  6: [{ f: S(6), s: D([-12.4, 1.0, 12.8], [-16.0, 0.5, 16.2], S(6), 0.0022, { fov: 46 }) }],
  7: [{ f: S(7), s: D([-7.8, 1.7, 8.3], [-2.6, 2.0, 3.0], S(7), 0.003, { fov: 44, roll: 0.035 }) }],
  8: [{ f: S(8) - 6, s: D([BARREL[0] + 0.3, 1.0, BARREL[2] + 3.4], [BARREL[0], 0.72, BARREL[2]], S(8) - 6, 0.0018, { fov: 60 }) }],
  9: [
    { f: S(9) - 4, s: D(C(0, 1.4, -3.4, DINING), C(0, 1.1, 0.5, DINING), S(9) - 4, 0.0022, { fov: 44 }) },
    { f: W(100) - 10, dur: 24, s: D(C(0.2, 1.2, -2.6, DINING), C(0, 1.0, 0.4, DINING), W(100) - 10, 0.0025, { fov: 42 }) },
  ],
  10: [{ f: S(10), s: D(C(0.25, 1.2, -2.6, DINING), C(0, 1.0, 0.4, DINING), S(10), 0.002, { fov: 42, roll: -0.03 }) }],
  11: [
    { f: S(11) - 4, s: D(C(0.6, 2.0, -5.5, COURT), C(0, 2.0, 5, COURT), S(11) - 4, 0.0018, { fov: 50 }) },
    { f: W(123) - 5, cut: true, s: D(C(0.4, 2.55, 1.4, COURT), C(0, 2.6, 5.6, COURT), W(123) - 5, 0.0025, { fov: 40 }) },
  ],
  12: [{ f: S(12), s: D(C(-4.4, 1.7, -2.6, COURT), C(-2.0, 1.7, 1.5, COURT), S(12), 0.0028, { fov: 42, roll: 0.03 }) }],
  13: [
    { f: S(13), s: D(C(-1.4, 1.6, -3.4, COURT), C(-1.4, 1.65, 2.0, COURT), S(13), 0.0022, { fov: 46 }) },
    { f: W(139) - 8, dur: 24, s: D(C(-2.0, 1.6, -1.6, COURT), C(-1.9, 1.75, 1.8, COURT), W(139) - 8, 0.0022, { fov: 44, roll: -0.03 }, 0.006, 30) },
  ],
};

const KICKS: [number, number][] = [[T(F_HOOP + 8), 0.5], [T(F_BURST), 1.5], [T(F_WALL), 1.3], [T(F_BELT), 0.6], [T(F_SEAMS), 0.9], [T(F_REFUND), 0.4]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 6, focus: (f) => [-24 - 0.045 * f, 1.6, 13.4] },   // the runners ahead of the wave
  { f: S(2), cInf: 0 },
  { f: W(23) - 12, dur: 30, cInf: 6 },
  { f: S(3), cInf: 14 },                                           // the hoop close-up
  { f: W(34) - 5, cInf: 12 },                                      // the clerk
  { f: S(4) - 4, cInf: 0 },
  { f: W(48) - 5, cInf: 10, focus: () => [4.2, 1.5, 5.4] },        // workers waist-deep
  { f: S(5), cInf: 0 },
  { f: S(6), cInf: 8 },
  { f: S(7), cInf: 12, focus: () => [-3.8, 1.7, 5.2] },
  { f: S(8) - 6, cInf: 9, focus: () => BARREL },
  { f: S(9) - 4, cInf: 10, focus: () => C(0, 1.4, -0.15, DINING) },
  { f: S(11) - 4, cInf: 5 },
  { f: W(123) - 5, cInf: 12 },
  { f: S(12), cInf: 11, focus: () => C(-2.0, 1.7, 1.5, COURT) },
  { f: S(13), cInf: 8, focus: () => C(-1.5, 1.7, 1.8, COURT) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
