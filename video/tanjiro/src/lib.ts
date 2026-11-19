import type { Pose } from "./rig/Char";

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
// progress of t in [a, b] -> 0..1 (clamped)
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k * k;
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const backOut = (k: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
export const rnd = (i: number, s = 1) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
// smooth noise in [-1, 1]
export const noise = (t: number, s = 1) => {
  const i = Math.floor(t), f = t - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rnd(i, s), rnd(i + 1, s), u) * 2 - 1;
};

// ---- pose blending --------------------------------------------------------
const NUM = ["x", "y", "s", "rot", "lean", "head", "turn", "gaze", "sw", "op", "talk", "blink", "bob"] as const;
const PAIR = ["aR", "aL", "lR", "lL"] as const;
export function mix(a: Pose, b: Pose, k: number): Pose {
  const o: Pose = { ...a, ...(k >= 0.5 ? b : {}) };
  for (const key of NUM) {
    const va = (a as any)[key], vb = (b as any)[key];
    if (va !== undefined || vb !== undefined) (o as any)[key] = lerp(va ?? vb ?? 0, vb ?? va ?? 0, k);
  }
  for (const key of PAIR) {
    const va = a[key], vb = b[key];
    if (va || vb) {
      const A = va ?? vb!, B = vb ?? va!;
      o[key] = [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];
    }
  }
  return o;
}
// keyframed pose track: [[time, pose], ...] with easeInOut between keys
export function track(t: number, keys: [number, Pose][], ease = easeInOut): Pose {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, p0] = keys[i], [t1, p1] = keys[i + 1];
    if (t <= t1) return mix(p0, p1, ease(seg(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}

// ---- life: blink, idle breathing, talking ---------------------------------
export const blink = (t: number, seed = 1) => {
  const period = 3.2 + rnd(seed) * 1.6;
  const ph = (t + rnd(seed + 3) * period) % period;
  return ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0;
};
export const talk = (t: number, on = true) => (on ? Math.max(0, Math.sin(t * 17) * 0.6 + Math.sin(t * 7.3) * 0.4) : 0);
export const idle = (t: number, seed = 1): Pose => ({
  blink: blink(t, seed),
  aR: [10 + Math.sin(t * 1.3 + seed) * 2, -14 + Math.sin(t * 1.1 + seed) * 3],
  aL: [-10 - Math.sin(t * 1.2 + seed) * 2, 14 - Math.sin(t * 1.4 + seed) * 3],
  head: Math.sin(t * 0.7 + seed) * 1.5,
  breath: t,
});

// walk / run cycles (in place). speed = cycles per second.
export const walk = (t: number, speed = 1.1, amp = 1): Pose => {
  const p = t * speed * Math.PI * 2;
  const s = Math.sin(p), c = Math.cos(p);
  return {
    lR: [24 * s * amp, -Math.max(0, -c) * 40 * amp - 4],
    lL: [-24 * s * amp, -Math.max(0, c) * 40 * amp - 4],
    aR: [-18 * s * amp + 4, -16],
    aL: [18 * s * amp - 4, 16],
    bob: -Math.abs(c) * 8 * amp,
    lean: 3 * amp,
    head: Math.sin(p * 2) * 1,
  };
};
export const run = (t: number, speed = 1.8): Pose => {
  const p = t * speed * Math.PI * 2;
  const s = Math.sin(p), c = Math.cos(p);
  return {
    lR: [40 * s + 10, -Math.max(0, -c) * 80 - 10],
    lL: [-40 * s + 10, -Math.max(0, c) * 80 - 10],
    aR: [-40 * s + 10, -60],
    aL: [40 * s + 10, -60],
    bob: -Math.abs(c) * 18,
    lean: 14,
  };
};
// camera shake offset (trauma 0..1)
export const shake = (t: number, trauma: number, s = 1): [number, number, number] => {
  const k = trauma * trauma;
  return [noise(t * 18, s) * 26 * k, noise(t * 18, s + 9) * 26 * k, noise(t * 14, s + 4) * 1.5 * k];
};
