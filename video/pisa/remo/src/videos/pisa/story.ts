// Timeline of the Pisa short ("Башня, которую спасли лопатой"): 19 shots timed to the voice words (words.json,
// ElevenLabs denophine, 1.13x), the tower's state per shot (storeys built, lean, banana curve, era props) and the camera
// grammar of the bridge template: smootherstep glides 18-40 f, every hold pushes in, cuts on big reframes, flip kicks.
// World axes: tower base centre at the origin, ground y = 0, north = -z, south = +z; the tower leans south (+z).
// Most cameras look from the west (-x) toward +x, so the lean goes to screen right.
import WORDS from "./words.json";

export const FPS = 30;
export const TOTAL = 2090; // voice 69.52 s, the video ends on "Сама."
export const D0 = 0; // ground level (the bridge template's bank height)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

type Word = { w: string; s: number; e: number };
const words = WORDS as Word[];
/** frame of the onset of word i */
export const W = (i: number) => Math.round(words[i].s * FPS);
/** reactions land 0-3 frames before their word */
export const LEADF = 2;

// ---------------- the tower ----------------
/** cartoon Campanile: base storey with blind arcade, six open loggias, smaller belfry (metres) */
export const TW = { rCore: 6.0, rCol: 7.3, h0: 10.5, hL: 5.0, nL: 6, rBell: 4.5, rBellCol: 5.3, hBell: 6.0 };
export const TOWER_H = TW.h0 + TW.nL * TW.hL + TW.hBell; // 46.5 m to the belfry roof
/** points near the tower used by cameras, cast and props */
export const DOOR: V3 = [-TW.rCol - 0.2, 0, 0]; // entrance on the west face
export const DRILL_AT: V3 = [-10, 0, -8.6];
/** the rig faces the tower's centre; its auger breaks the ground 2.1 m ahead of it (DRILL_HOLE) */
export const DRILL_YAW = Math.atan2(-DRILL_AT[0], -DRILL_AT[2]);
export const DRILL_HOLE: V3 = [DRILL_AT[0] + 2.1 * Math.sin(DRILL_YAW), 0.05, DRILL_AT[2] + 2.1 * Math.cos(DRILL_YAW)];
export const PILE_AT: V3 = [0, 0, -9.2];
export const PUMP_AT: V3 = [-10, 0, -13];
export const ROOM_AT: V3 = [-16.5, 0, -23];
export const BEACH: V3 = [0, 0, 700];
export const KID_SAND: V3 = [0, 0, 702];

export type Era = "build" | "1934" | "1990" | "2001" | "beach";
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; era: Era; props: string[]; tau: (t: number) => number; sunAz?: number; sunEl?: number };
/** shot boundaries = word indices (cut 3 frames before the word) */
const CUT = (i: number) => W(i) - 3;
const B = [0, CUT(8), CUT(16), CUT(27), CUT(38), CUT(45), CUT(53), CUT(62), CUT(71), CUT(80), CUT(90), CUT(97), CUT(109), CUT(119), CUT(125), CUT(139), CUT(153), CUT(161), CUT(172), TOTAL];
const DEF: [Light, Era, string[]][] = [
  ["day", "2001", ["drill", "lead", "fence"]],        // 1 hook: digging under the tower
  ["day", "build", ["scaffold", "stones"]],           // 2 twelfth century, Pisa builds a bell tower
  ["day", "build", ["scaffold", "stones"]],           // 3 it leans before half-way: soft clay
  ["day", "build", ["scaffold", "stones"]],           // 4 Pisa goes to war
  ["golden", "build", ["scaffold", "overgrown"]],     // 5 a century of rest saves it
  ["day", "build", ["scaffoldHigh", "stones"]],       // 6 upper storeys taller on the leaning side
  ["day", "build", []],                               // 7 a banana
  ["day", "1934", []],                                // 8 Mussolini
  ["day", "1934", ["pump"]],                          // 9 80 t of grout, leans more
  ["day", "1990", ["fence"]],                         // 10 5.5 degrees, closed
  ["day", "1990", ["fence", "lead", "crane"]],        // 11 600 t of lead
  ["day", "1990", ["fence", "lead"]],                 // 12 luckily / unluckily
  ["golden", "1990", ["fence", "lead", "tanks"]],     // 13 liquid nitrogen, it creeps south
  ["golden", "1990", ["fence", "lead"]],              // 14 how?
  ["day", "beach", []],                               // 15 wet sand
  ["day", "2001", ["fence", "lead", "drill", "room"]], // 16 38 m3 out from under the north side
  ["day", "2001", ["fence", "lead", "drill", "room"]], // 17 back 45 cm
  ["day", "2001", ["ribbon"]],                        // 18 reopened, 200 years
  ["golden", "2001", []],                             // 19 800 years... it straightened itself
];
export const SHOTS: ShotDef[] = DEF.map(([light, era, props], i) => ({ id: i + 1, a: B[i], b: B[i + 1], light, era, props, tau: (t: number) => t }));
/** crossfades (frames) at changes of era or place; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 5: 10, 8: 8, 10: 8, 15: 8, 16: 8, 19: 10 };
export const FLASH_AT = B[1] - 3;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const hasProp = (id: number, p: string) => SHOTS[id - 1].props.includes(p);

/** the tower per shot and frame: storeys built (fractional = the storey under construction), lean (deg, toward +z),
 *  banana correction per upper storey (deg) */
export type TowerState = { storeys: number; tilt: number; curve: number };
const L1 = W(78), L2 = W(116), POP = W(185);
export const LURCHES = [L1, L2];
export const towerAt = (id: number, f: number): TowerState => {
  const full = 8, cv = 0.85;
  switch (id) {
    case 1: return { storeys: full, tilt: 5.8 - 0.35 * smooth((f - 40) / 50), curve: cv };
    case 2: return { storeys: 2.6, tilt: 0, curve: 0 };
    case 3: return { storeys: 3.25, tilt: 2.4 * smooth((f - W(20)) / 40), curve: 0 };
    case 4: case 5: return { storeys: 3.25, tilt: 2.4, curve: 0 };
    case 6: return { storeys: 3.25 + 3.4 * smooth((f - (SHOTS[5].a + 6)) / 62), tilt: 3.2, curve: cv };
    case 7: return { storeys: full, tilt: 3.6, curve: cv * 1.25 };
    case 8: return { storeys: full, tilt: 4.9, curve: cv };
    case 9: return { storeys: full, tilt: 4.9 + 0.5 * easeOut((f - L1 + 1) / 6), curve: cv };
    case 10: case 11: case 12: return { storeys: full, tilt: 5.5, curve: cv };
    case 13: return { storeys: full, tilt: 5.5 + 0.45 * easeOut((f - L2 + 1) / 6), curve: cv };
    case 14: case 16: return { storeys: full, tilt: 5.95, curve: cv };
    case 15: return { storeys: full, tilt: 5.95, curve: cv };
    case 17: return { storeys: full, tilt: 5.95 - 1.25 * smooth((f - W(155)) / 55), curve: cv };
    case 18: return { storeys: full, tilt: 4.7, curve: cv };
    default: return { storeys: full, tilt: 4.7 - 0.25 * easeOut((f - POP + 1) / 5), curve: cv };
  }
};

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
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const D = (pos: V3, look: V3, f0: number, rate: number, rest: Partial<Cam> = {}, punch = 0, n = 35) => (f: number) => dolly(pos, look, pushK(f, f0, rate, punch, n), rest);
const Z = (pos: V3, look: V3, fov: number, f0: number, rate: number, rest: Partial<Cam> = {}, punch = 0, n = 35) => (f: number) => zoom(pos, look, fov, pushK(f, f0, rate, punch, n), rest);
const S = (i: number) => SHOTS[i - 1].a;

/** the side view of the whole tower from the west (lean to screen right) */
const SIDE: [V3, V3] = [[-74, 5, 5], [0, 21, 5]];
export const PUSHERS: V3[] = [[-2.6, 0, 8.3], [0.2, 0, 8.6], [3.0, 0, 8.3]];

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: D([-38.5, 1.6, -33.5], [-1, 19, -2], 0, 0.0022, { fov: 52, roll: -0.03 }) }, // outside the cathedral apse (inside it, its one-sided wall hid every ink line)
    { f: W(6) - 6, cut: true, s: D([-12.5, 0.75, -3.2], [-7.4, 0.8, -7.8], W(6) - 6, 0.003, { fov: 40, roll: 0.04 }, 0.007, 30) },
  ],
  2: [
    { f: S(2), s: Z([58, 40, 74], [-28, 2, -10], 46, S(2), 0.0018) },
    { f: W(13) - 10, dur: 28, s: D([21, 7.5, 27], [0, 7, 0], W(13) - 10, 0.0022, { fov: 44 }) },
  ],
  3: [
    { f: S(3), s: D([-38, 5.5, 3], [0, 9, 3], S(3), 0.002, { fov: 44 }) },
    { f: W(25) - 5, cut: true, s: D([-9.5, 0.9, 16.5], [0, 0.6, 8.3], W(25) - 5, 0.0025, { fov: 40, roll: -0.04 }) },
  ],
  4: [
    { f: S(4), s: D([24, 2.1, 25], [6, 2.4, 8], S(4), 0.0022, { fov: 44 }) },
    { f: W(33) - 10, dur: 32, s: D([34, 13, 44], [0, 7, 0], W(33) - 10, 0.0015, { fov: 44, roll: 0.02 }) },
  ],
  5: [{ f: S(5) - 6, s: D([-31, 3.2, 27], [0, 6.5, 2], S(5) - 6, 0.0028, { fov: 42 }) }],
  6: [
    { f: S(6), s: D([-46, 21, 7], [0, 21, 5], S(6), 0.0018, { fov: 46 }) },
    { f: W(49) - 8, dur: 26, s: D([-31, 27, 9], [0, 27, 6], W(49) - 8, 0.0022, { fov: 42, roll: -0.035 }) },
  ],
  7: [
    { f: S(7), s: D([-86, 6, 11], [0, 23, 7], S(7), 0.0018, { fov: 44 }) },
    { f: W(61) - 5, cut: true, s: D([-38.5, 1.3, 13.6], [-20, 6, 7.5], W(61) - 5, 0.002, { fov: 48, roll: 0.03 }) },
  ],
  8: [
    { f: S(8) - 4, s: D([-31, 1.7, -9.3], [-12, 6.5, -3.6], S(8) - 4, 0.0022, { fov: 46 }) },
    { f: W(69) - 5, cut: true, s: D([-24.3, 1.75, -7.3], [-20, 1.85, -6], W(69) - 5, 0.002, { fov: 38, roll: -0.045 }, 0.006, 30) },
  ],
  9: [
    { f: S(9), s: D([-25, 3.5, -27], [-6, 1.6, -8], S(9), 0.0022, { fov: 44 }) },
    { f: W(78) - 7, cut: true, s: D(SIDE[0], SIDE[1], W(78) - 7, 0.002, { fov: 44, roll: 0.03 }) },
  ],
  10: [
    { f: S(10) - 4, s: D([-60, 2.6, 24], [0, 20, 4], S(10) - 4, 0.002, { fov: 46 }) },
    { f: W(89) - 5, cut: true, s: D([-19.5, 1.7, 3.8], [-13.4, 1.45, 1.2], W(89) - 5, 0.0025, { fov: 40 }) },
  ],
  11: [{ f: S(11), s: D([-27, 5, -35], [-1, 5, -9], S(11), 0.0022, { fov: 44 }) }],
  12: [
    { f: S(12), s: D([-11.5, 1.7, -24.5], [-5.6, 1.8, -15.5], S(12), 0.0025, { fov: 40 }) },
    { f: W(101) - 5, cut: true, s: D([-31, 2.4, -39], [-3, 3.2, -10], W(101) - 5, 0.002, { fov: 46, roll: -0.03 }) },
  ],
  13: [
    { f: S(13) - 4, s: D([-17, 2.1, -31], [-2, 1.4, -11.5], S(13) - 4, 0.0025, { fov: 42 }) },
    { f: W(116) - 6, cut: true, s: D(SIDE[0], SIDE[1], W(116) - 6, 0.002, { fov: 44, roll: -0.03 }) },
  ],
  14: [{ f: S(14), s: D([-17.5, 1.65, 6.2], [-11, 1.95, 4], S(14), 0.0028, { fov: 40, roll: 0.035 }) }],
  15: [
    { f: S(15) - 4, s: D([0, 1.05, 697.4], [0, 0.8, 702], S(15) - 4, 0.002, { fov: 42 }) },
    { f: W(135) - 10, dur: 26, s: D([0.7, 0.62, 699.0], [0, 0.42, 702], W(135) - 10, 0.0025, { fov: 40 }) },
  ],
  16: [
    { f: S(16) - 4, s: D([-24, 3, -31], [-7, 1.6, -9.5], S(16) - 4, 0.0022, { fov: 44 }) },
    { f: W(150) - 5, cut: true, s: D([-25, 1.7, -32.5], [-16.3, 1.7, -22.6], W(150) - 5, 0.0022, { fov: 44 }, 0.005, 30) },
  ],
  17: [{ f: S(17), s: D(SIDE[0], SIDE[1], S(17), 0.0018, { fov: 44 }) }],
  18: [
    { f: S(18), s: D([-17.8, 1.65, 1.2], [-9.1, 1.35, 0], S(18), 0.0025, { fov: 44 }) },
    { f: W(167) - 5, cut: true, s: D([-45, 0.9, -3], [-12, 11, 5], W(167) - 5, 0.002, { fov: 46, roll: 0.03 }) },
  ],
  19: [
    { f: S(19) - 6, s: D([-10.5, 1.7, 14.5], [0, 2.6, 8.4], S(19) - 6, 0.0025, { fov: 46, roll: -0.03 }) },
    { f: W(177) - 8, dur: 34, s: D([-36, 3, 17], [0, 15, 6], W(177) - 8, 0.0018, { fov: 46 }) },
  ],
};

// impact kicks: offset flips sign every frame, decays to 0 in 7 f
const KICKS: [number, number][] = [[T(W(25)), 0.6], [T(L1), 1.3], [T(L2), 1.3], [T(W(69)), 0.4], [T(POP), 0.6], [T(W(152)), 0.4]];
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
  { f: 0, cInf: 0 },                                              // hook wide: the whole tower sharp
  { f: W(6) - 6, cInf: 14 },                                      // dirt flying out from under it
  { f: S(2), cInf: 0 },                                           // aerial
  { f: W(13) - 10, dur: 28, cInf: 7, focus: () => [0, 4, 3] },     // masons at the stump
  { f: S(3), cInf: 0 },                                           // side view, it leans
  { f: W(25) - 5, cInf: 14 },                                     // soft clay close-up
  { f: S(4), cInf: 10, focus: (f) => [6 + 1.2 * (f - S(4)) / FPS, 1.6, 9.5 + 0.5 * (f - S(4)) / FPS] }, // the knights' leader
  { f: W(33) - 10, dur: 32, cInf: 0 },
  { f: S(5) - 6, cInf: 5 },
  { f: S(6), cInf: 0 },
  { f: W(61) - 5, cInf: 9, focus: () => [-32.0, 1.1, 11.6] },     // kid with the banana
  { f: S(8) - 4, cInf: 8, focus: () => [-20, 1.7, -6] },          // Mussolini
  { f: W(69) - 5, cInf: 13 },
  { f: S(9), cInf: 6 },
  { f: W(78) - 7, cInf: 0 },
  { f: W(89) - 5, cInf: 12 },                                     // the guard at the gate
  { f: S(11), cInf: 0 },
  { f: S(12), cInf: 12 },                                         // engineer thumbs up
  { f: W(101) - 5, cInf: 6, focus: () => [-14, 1.7, -20] },
  { f: S(13) - 4, cInf: 7 },
  { f: W(116) - 6, cInf: 0 },
  { f: S(14), cInf: 13 },                                         // engineer scratching his head
  { f: S(15) - 4, cInf: 12 },                                     // kid on the sand
  { f: S(16) - 4, cInf: 0 },
  { f: W(150) - 5, cInf: 9 },
  { f: S(17), cInf: 0 },
  { f: S(18), cInf: 11 },                                         // ribbon
  { f: W(167) - 5, cInf: 8, focus: () => [-35, 1.7, 1.6] },       // tourist holding the tower up
  { f: S(19) - 6, cInf: 8, focus: () => PUSHERS[1] },             // the pushers
  { f: W(177) - 8, dur: 34, cInf: 0 },                            // pull out: the whole tower
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

/** near framing objects (built in world.ts as cartoon plants, outside the sight-line test) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: S(5) - 6, b: S(6), kit: "plant_bushDetailed", pos: [-26.5, 0, 23.2], s: 1.3, yaw: 0.3 },
  { a: S(10), b: W(89) - 5, kit: "plant_bushLarge", pos: [-52, 0, 21], s: 1.4, yaw: 0.5 },
  { a: W(177) + 20, b: TOTAL, kit: "plant_bushDetailed", pos: [-31.5, 0, 16.8], s: 1.6, yaw: 1.1 },
];
