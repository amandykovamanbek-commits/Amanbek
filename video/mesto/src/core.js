// Core helpers: math, easing, keyframes, deterministic noise.
import * as THREE from 'three';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = t => t * t * (3 - 2 * t);
export const sstep = (a, b, x) => smooth(inv(a, b, x));
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const ease = {
  lin: t => t,
  in: t => t * t * t,
  out: t => 1 - (1 - t) ** 3,
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  in2: t => t * t,
  out2: t => 1 - (1 - t) * (1 - t),
  io2: t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out5: t => 1 - (1 - t) ** 5,
  in5: t => t ** 5,
  back: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  step: t => (t < 1 ? 0 : 1),
};

// Keyframes: keys = [[time, value, easeName?], ...]; value: number | array.
// ease on key i applies to the segment that ENDS at key i.
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1[0]) {
      const k0 = keys[i - 1];
      const e = ease[k1[2] || 'sine'];
      const u = e((t - k0[0]) / (k1[0] - k0[0] || 1));
      const a = k0[1], b = k1[1];
      if (Array.isArray(a)) return a.map((v, j) => lerp(v, b[j], u));
      return lerp(a, b, u);
    }
  }
  return last[1];
}
export const kv = (t, keys) => { const a = kf(t, keys); return new THREE.Vector3(a[0], a[1], a[2]); };

// Seeded RNG (mulberry32)
export function rng(seed = 1) {
  let a = seed >>> 0;
  const f = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  return f;
}

// 1D value noise, smooth, deterministic
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 57.3), hash(i + 1 + seed * 57.3), u) * 2 - 1;
}
export function fbm1(x, seed = 0, oct = 3) {
  let a = 0, amp = 0.5, fr = 1;
  for (let o = 0; o < oct; o++) { a += amp * noise1(x * fr, seed + o * 13.1); amp *= 0.5; fr *= 2.03; }
  return a;
}
// handheld camera shake vector
export function shake(t, amp = 1, freq = 1, seed = 0) {
  return new THREE.Vector3(fbm1(t * freq, seed), fbm1(t * freq, seed + 3.3), fbm1(t * freq, seed + 7.7)).multiplyScalar(amp);
}

// Position a camera: pos, target, fov, roll(rad)
export function aim(cam, pos, target, fov, roll = 0) {
  cam.position.copy(pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(target);
  if (roll) cam.rotateZ(roll);
  if (fov && cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

// catenary-ish sag curve points between a and b
export function sagPoints(a, b, sag, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = a.clone().lerp(b, u);
    p.y -= sag * 4 * u * (1 - u);
    pts.push(p);
  }
  return pts;
}

export function disposeGeo(m) { if (m && m.geometry) m.geometry.dispose(); }

export const env = {};
