// Reusable props and effects.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng, sagPoints, clamp } from './core.js';
import * as T from './tex.js';

export const std = (color, rough = 0.7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
export const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
export const emis = (color, k = 1) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k });
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  if (parent) parent.add(m); return m;
}
export const box = (w, h, d, mat, x, y, z, p, r = 0) => mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
export const cyl = (r0, r1, h, mat, x, y, z, p, seg = 24) => mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat, x, y, z, p);
export const sph = (r, mat, x, y, z, p, s = 24) => mesh(new THREE.SphereGeometry(r, s, Math.max(8, s * 0.66 | 0)), mat, x, y, z, p);

// ---------- particles ----------
const SNOW_VS = `
uniform float time, size, speed, wind; uniform vec3 boxMin, boxMax; uniform vec3 drift;
attribute float seed;
varying float vA;
void main(){
  vec3 b = boxMax - boxMin;
  vec3 p = position;
  float t = time * speed * (0.7 + 0.6 * fract(seed * 7.13));
  p.y = boxMin.y + mod(p.y - boxMin.y - t, b.y);
  p.x = boxMin.x + mod(p.x - boxMin.x + wind * time + sin(time * 0.7 + seed * 6.28) * 0.35 + drift.x * time, b.x);
  p.z = boxMin.z + mod(p.z - boxMin.z + cos(time * 0.5 + seed * 4.0) * 0.3 + drift.z * time, b.z);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float s = size * (0.5 + fract(seed * 13.7));
  gl_PointSize = clamp(s * 900. / -mv.z, 1.0, 34.);
  vA = smoothstep(0.25, 2.2, -mv.z) * 0.85 + 0.15 * smoothstep(0.25, 0.6, -mv.z);
}`;
const SNOW_FS = `
uniform vec3 color; uniform float opacity; varying float vA;
void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); float a = smoothstep(0.5, 0.15, d); gl_FragColor = vec4(color, a * opacity * vA); }`;
export function makeSnow({ count = 4000, min = [-10, 0, -10], max = [10, 8, 10], size = 0.02, speed = 0.6, wind = 0.15, color = 0xffffff, opacity = 0.9, seed = 1, drift = [0, 0, 0] } = {}) {
  const r = rng(seed), pos = new Float32Array(count * 3), sd = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos[i * 3] = min[0] + r() * (max[0] - min[0]); pos[i * 3 + 1] = min[1] + r() * (max[1] - min[1]); pos[i * 3 + 2] = min[2] + r() * (max[2] - min[2]); sd[i] = r(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({
    vertexShader: SNOW_VS, fragmentShader: SNOW_FS, transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, size: { value: size }, speed: { value: speed }, wind: { value: wind }, boxMin: { value: new THREE.Vector3(...min) }, boxMax: { value: new THREE.Vector3(...max) }, color: { value: new THREE.Color(color) }, opacity: { value: opacity }, drift: { value: new THREE.Vector3(...drift) } }
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false;
  p.setTime = t => { m.uniforms.time.value = t; };
  return p;
}
// world-sized additive sprites (bokeh / glows)
const BOK_VS = `attribute vec3 color; attribute float sz; varying vec3 vC; uniform float scale;
void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(sz * scale / -mv.z, 1., 400.); }`;
const BOK_FS = `uniform sampler2D map; uniform float opacity; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb, t.a * opacity); }`;
let _disc, _glow, _streak;
export const discMap = () => (_disc ||= T.discTex({ ring: 0.3, soft: 0.12 }));
export const glowMap = () => (_glow ||= T.glowTex(128, 2.2));
export const streakMap = () => (_streak ||= T.streakTex());
export function makeBokeh(points, colors, sizes, { map = discMap(), opacity = 1, scale = 1000 } = {}) {
  const n = points.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
  points.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); const c = new THREE.Color(colors[i % colors.length]); col.set([c.r, c.g, c.b], i * 3); sz[i] = Array.isArray(sizes) ? sizes[i] : sizes; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
  const m = new THREE.ShaderMaterial({ vertexShader: BOK_VS, fragmentShader: BOK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { map: { value: map }, opacity: { value: opacity }, scale: { value: scale } } });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}
export function sprite(map, color, w, h, opacity = 1, additive = true) {
  const m = new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const s = new THREE.Sprite(m); s.scale.set(w, h, 1); return s;
}
export function flare(color = 0x9fc8ff, w = 6, h = 0.18, k = 1) { // anamorphic streak + core glow
  const g = new THREE.Group();
  const st = sprite(streakMap(), color, w, h, 0.9 * k); g.add(st);
  const gl = sprite(glowMap(), 0xffffff, h * 2.5, h * 2.5, 0.6 * k); g.add(gl);
  g.setK = v => { st.material.opacity = 0.9 * v; gl.material.opacity = 0.8 * v; };
  return g;
}

// garland of glowing bulbs along a polyline; returns group with .bulbs instanced
export function garland(points, { n = 40, colors = [0xff5a3a, 0xffd23a, 0x4ad06a, 0x4a9aff, 0xff7ad0], r = 0.03, k = 4, wire = true, warm = false, seed = 3 } = {}) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points);
  if (wire) g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.006, 4), std(0x1a1a1a, 0.6)));
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: k }), n);
  const m = new THREE.Matrix4(), c = new THREE.Color(), rr = rng(seed);
  for (let i = 0; i < n; i++) {
    const p = curve.getPoint((i + 0.5) / n); m.makeTranslation(p.x, p.y - r * 0.8, p.z); im.setMatrixAt(i, m);
    c.set(warm ? (rr() < 0.85 ? 0xffc06a : 0xffe2a8) : colors[i % colors.length]); im.setColorAt(i, c);
  }
  g.add(im); g.bulbs = im; g.curve = curve;
  return g;
}
export function sagGarland(a, b, sag, opts = {}) { return garland(sagPoints(a, b, sag, 12), opts); }

// ---------- furniture & interior ----------
export function chair(mat, back = true) {
  const g = new THREE.Group();
  box(0.44, 0.04, 0.42, mat, 0, 0.45, 0, g, 0.01);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) box(0.035, 0.45, 0.035, mat, x, 0.225, z, g);
  if (back) { box(0.44, 0.42, 0.03, mat, 0, 0.7, -0.2, g, 0.01); }
  return g;
}
export function table(w, d, h, topMat, legMat = topMat) {
  const g = new THREE.Group();
  box(w, 0.045, d, topMat, 0, h - 0.022, 0, g, 0.01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.05, h - 0.045, 0.05, legMat, sx * (w / 2 - 0.07), (h - 0.045) / 2, sz * (d / 2 - 0.07), g);
  return g;
}
export function laptop(screenTex) {
  const g = new THREE.Group(), al = std(0x9aa0a8, 0.35, 0.8);
  box(0.34, 0.016, 0.235, al, 0, 0.008, 0, g, 0.006);
  const kb = mesh(new THREE.PlaneGeometry(0.28, 0.1), std(0x222428, 0.8), 0, 0.0165, -0.02, g); kb.rotation.x = -Math.PI / 2;
  const lid = new THREE.Group(); lid.position.set(0, 0.016, -0.115); lid.rotation.x = -0.28; g.add(lid);
  box(0.34, 0.235, 0.008, al, 0, 0.1175, -0.004, lid, 0.004);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.195), new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(1.5, 1.5, 1.5) }));
  scr.position.set(0, 0.12, 0.0005); lid.add(scr);
  g.screen = scr; g.lid = lid; return g;
}
export function mug(color = 0xeeeeee) {
  const g = new THREE.Group(), m = std(color, 0.35);
  const body = mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.095, 24, 1, true), new THREE.MeshStandardMaterial({ color, roughness: 0.35, side: THREE.DoubleSide }), 0, 0.0475, 0, g);
  void body;
  mesh(new THREE.CircleGeometry(0.036, 20), m, 0, 0.002, 0, g).rotation.x = -Math.PI / 2;
  const coffee = mesh(new THREE.CircleGeometry(0.038, 20), std(0x2a1608, 0.15), 0, 0.075, 0, g); coffee.rotation.x = -Math.PI / 2;
  const h = mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 16, Math.PI), m, 0.04, 0.05, 0, g); h.rotation.z = -Math.PI / 2;
  return g;
}
export function phone(screenCanvas) {
  const g = new THREE.Group();
  box(0.074, 0.156, 0.0085, std(0x15161a, 0.3, 0.6), 0, 0, 0, g, 0.009);
  const tex = new THREE.CanvasTexture(screenCanvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const scr = new THREE.Mesh(new RoundedPlane(0.069, 0.15, 0.008), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.15, 1.15, 1.15) }));
  scr.position.z = 0.0044; g.add(scr);
  g.tex = tex; g.screen = scr; return g;
}
class RoundedPlane extends THREE.ShapeGeometry {
  constructor(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    super(s, 6);
    const uv = this.attributes.uv, p = this.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  }
}
export function noodleCup(steam = true) {
  const g = new THREE.Group();
  const lab = T.noodleLabel();
  mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.1, 28, 1, true), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6, side: THREE.DoubleSide }), 0, 0.05, 0, g);
  const n = mesh(new THREE.CircleGeometry(0.052, 24), std(0xd9b46a, 0.5), 0, 0.085, 0, g); n.rotation.x = -Math.PI / 2;
  const fork = box(0.006, 0.16, 0.004, std(0xd0d0d0, 0.3, 0.9), 0.015, 0.14, 0, g); fork.rotation.z = 0.25;
  if (steam) { const s = sprite(glowMap(), 0xffffff, 0.12, 0.2, 0.08, false); s.position.y = 0.17; g.add(s); g.steam = s; }
  return g;
}
export function wallClock() {
  const g = new THREE.Group();
  const rim = mesh(new THREE.TorusGeometry(0.16, 0.018, 12, 40), std(0x2a2a2a, 0.4, 0.3), 0, 0, 0.01, g);
  void rim;
  mesh(new THREE.CircleGeometry(0.16, 40), new THREE.MeshStandardMaterial({ map: T.clockFace(), roughness: 0.5 }), 0, 0, 0.005, g);
  const mk = (len, w, col, z) => { const p = new THREE.Group(); p.position.z = z; g.add(p); const b = box(w, len, 0.003, std(col, 0.4), 0, len / 2 - 0.02, 0, p); b.castShadow = false; return p; };
  g.hour = mk(0.085, 0.012, 0x111111, 0.012); g.min = mk(0.125, 0.008, 0x111111, 0.015); g.sec = mk(0.135, 0.003, 0xc0262b, 0.018);
  sph(0.008, std(0x111111), 0, 0, 0.02, g);
  g.setTime = (h, m, s) => { g.hour.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; g.min.rotation.z = -(m + s / 60) / 60 * Math.PI * 2; g.sec.rotation.z = -Math.floor(s) / 60 * Math.PI * 2; };
  return g;
}
export function xmasTree(h = 1.9, seed = 5, lights = true) {
  const g = new THREE.Group(), r = rng(seed);
  const needle = new THREE.MeshStandardMaterial({ color: 0x1f4a2a, roughness: 0.85 });
  cyl(0.05, 0.06, 0.3, std(0x4a3020), 0, 0.15, 0, g);
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers, rad = (1 - k) * h * 0.33 + 0.08, ch = h * 0.32;
    const c = mesh(new THREE.ConeGeometry(rad, ch, 18, 3), needle, 0, 0.25 + k * h * 0.72 + ch / 2, 0, g);
    c.rotation.y = r() * 3;
  }
  const star = mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshStandardMaterial({ color: 0x000, emissive: 0xffd36a, emissiveIntensity: 4 }), 0, h + 0.15, 0, g);
  void star;
  const cols = [0xc8202a, 0xe0b030, 0x2a60c0, 0xe8e8e8, 0xb02a8a];
  for (let i = 0; i < 26; i++) {
    const y = 0.35 + r() * h * 0.85, k = (y - 0.25) / (h * 0.95), rad = ((1 - k) * h * 0.33 + 0.08) * 0.92, a = r() * Math.PI * 2;
    sph(0.035 + r() * 0.02, std(cols[i % 5], 0.2, 0.6), Math.cos(a) * rad * (1 - ((y - 0.25) % (h * 0.144)) / (h * 0.32)), y, Math.sin(a) * rad * 0.9, g, 12);
  }
  if (lights) {
    const pts = [];
    for (let i = 0; i <= 80; i++) { const u = i / 80, y = 0.3 + u * h * 0.9, rad = ((1 - u) * h * 0.33 + 0.1) * 0.95, a = u * Math.PI * 2 * 5.5; pts.push(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad)); }
    const gl = garland(pts, { n: 70, r: 0.014, k: 6, wire: false, warm: true });
    g.add(gl); g.lights = gl;
  }
  return g;
}
export function bareTree(h = 4, seed = 2, snow = true) {
  const g = new THREE.Group(), r = rng(seed), bark = std(0x2b2420, 0.95), sn = std(0xeef2f8, 0.8);
  const branch = (p, dir, len, rad, depth) => {
    const end = p.clone().addScaledVector(dir, len);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, len, 6), bark);
    m.position.copy(p).addScaledVector(dir, len / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); m.castShadow = true; g.add(m);
    if (snow && depth < 3 && dir.y < 0.9) { const s = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.55, rad * 0.75, len * 0.9, 5), sn); s.position.copy(m.position).add(new THREE.Vector3(0, rad * 0.6, 0)); s.quaternion.copy(m.quaternion); g.add(s); }
    if (depth <= 0) return;
    const nb = depth > 2 ? 3 : 2;
    for (let i = 0; i < nb; i++) {
      const nd = dir.clone().add(new THREE.Vector3((r() - 0.5) * 1.4, r() * 0.5, (r() - 0.5) * 1.4)).normalize();
      branch(end, nd, len * (0.62 + r() * 0.15), rad * 0.62, depth - 1);
    }
  };
  branch(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), h * 0.38, h * 0.035, 4);
  return g;
}
export function firTree(h = 3, seed = 1, snow = 0.6) {
  const g = new THREE.Group(), r = rng(seed);
  const nm = std(0x183a26, 0.9), sm = std(0xe8eef6, 0.85);
  cyl(h * 0.03, h * 0.04, h * 0.2, std(0x3a2a1e), 0, h * 0.1, 0, g, 8);
  for (let i = 0; i < 4; i++) {
    const k = i / 4, rad = (1 - k) * h * 0.3 + h * 0.05, ch = h * 0.38;
    const c = mesh(new THREE.ConeGeometry(rad, ch, 10, 1), nm, 0, h * 0.15 + k * h * 0.62 + ch / 2, 0, g); c.rotation.y = r() * 3;
    if (snow) { const s = mesh(new THREE.ConeGeometry(rad * 0.85, ch * 0.4, 10, 1), sm, 0, h * 0.15 + k * h * 0.62 + ch * 0.82, 0, g); s.rotation.y = c.rotation.y; }
  }
  return g;
}
export function lampPost(h = 4.5, color = 0xffb766, withLight = true, intensity = 12) {
  const g = new THREE.Group(), m = std(0x1c1e22, 0.5, 0.6);
  cyl(0.05, 0.07, h, m, 0, h / 2, 0, g, 10);
  const arm = box(0.6, 0.05, 0.05, m, 0.28, h - 0.05, 0, g);
  void arm;
  const head = box(0.32, 0.08, 0.18, m, 0.55, h - 0.1, 0, g, 0.02);
  void head;
  const bulb = mesh(new THREE.BoxGeometry(0.26, 0.02, 0.14), new THREE.MeshStandardMaterial({ color: 0, emissive: color, emissiveIntensity: 8 }), 0.55, h - 0.145, 0, g, false);
  void bulb;
  const sn = box(0.34, 0.04, 0.2, std(0xf2f5fa, 0.8), 0.55, h - 0.045, 0, g, 0.015);
  void sn;
  if (withLight) { const L = new THREE.PointLight(color, intensity, 14, 1.6); L.position.set(0.55, h - 0.3, 0); g.add(L); g.light = L; }
  const glow = sprite(glowMap(), color, 1.6, 1.6, 0.35); glow.position.set(0.55, h - 0.18, 0); g.add(glow);
  return g;
}
export function car(color = 0x8a8f99, snow = 0.08, seed = 1) {
  const g = new THREE.Group(), body = std(color, 0.35, 0.4), glass = std(0x0b0f16, 0.1, 0.2), sn = std(0xf0f4fa, 0.85);
  box(1.75, 0.55, 4.1, body, 0, 0.55, 0, g, 0.12);
  box(1.55, 0.45, 2.1, glass, 0, 1.0, -0.2, g, 0.12);
  box(1.6, 0.06, 1.9, body, 0, 1.24, -0.2, g, 0.03);
  if (snow) { box(1.5, snow, 1.8, sn, 0, 1.29 + snow / 2, -0.2, g, Math.min(0.04, snow / 2.2)); box(1.6, snow * 0.6, 0.9, sn, 0, 0.84, 1.45, g, Math.min(0.03, snow / 3)); box(1.6, snow * 0.6, 0.6, sn, 0, 0.84, -1.75, g, Math.min(0.03, snow / 3)); }
  const wm = std(0x111111, 0.9);
  for (const [x, z] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) { const w = cyl(0.32, 0.32, 0.22, wm, x, 0.32, z, g, 16); w.rotation.z = Math.PI / 2; }
  return g;
}
export function taxi() {
  const g = car(0xf2b51c, 0, 7);
  const sign = box(0.45, 0.14, 0.18, new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xffe9a0, emissiveIntensity: 3 }), 0, 1.36, -0.2, g, 0.03);
  void sign;
  const checks = box(1.77, 0.08, 2.6, std(0x111111, 0.5), 0, 0.62, -0.1, g); checks.scale.set(1.002, 1, 1);
  const hl = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xfff4e0, emissiveIntensity: 4 });
  const tl = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2020, emissiveIntensity: 5 });
  for (const sx of [-1, 1]) { box(0.32, 0.12, 0.04, hl, sx * 0.62, 0.62, 2.06, g, 0.02); box(0.3, 0.1, 0.04, tl, sx * 0.65, 0.66, -2.06, g, 0.02); }
  g.flares = [];
  for (const sx of [-1, 1]) { const f = flare(0xa8ccff, 7, 0.2); f.position.set(sx * 0.62, 0.62, 2.15); g.add(f); g.flares.push(f); }
  for (const sx of [-1, 1]) {
    const L = new THREE.SpotLight(0xfff0dd, 25, 40, 0.42, 0.5, 1.2); L.position.set(sx * 0.62, 0.62, 2.1); L.target.position.set(sx * 0.8, 0, 16); g.add(L); g.add(L.target);
  }
  // volumetric beams
  for (const sx of [-1, 1]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 14, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xbcd4ff, transparent: true, opacity: 0.018, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = -Math.PI / 2; cone.position.set(sx * 0.62, 0.55, 2.1 + 7); g.add(cone);
  }
  return g;
}

// ---------- house dressing ----------
export function windowFrame(w, h, d = 0.12, mat = std(0xf0ece4, 0.5), mull = true) {
  const g = new THREE.Group(), t = 0.06;
  box(w + t * 2, t, d, mat, 0, h / 2 + t / 2, 0, g); box(w + t * 2, t, d, mat, 0, -h / 2 - t / 2, 0, g);
  box(t, h, d, mat, -w / 2 - t / 2, 0, 0, g); box(t, h, d, mat, w / 2 + t / 2, 0, 0, g);
  if (mull) { box(0.04, h, d * 0.6, mat, 0, 0, 0, g); box(w, 0.04, d * 0.6, mat, 0, h * 0.18, 0, g); }
  return g;
}
export function plate(r = 0.12, color = 0xf4f1ea) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(r, r * 0.7, 0.018, 32), std(color, 0.25), 0, 0.009, 0, g);
  return g;
}
export function glass(h = 0.16, col = 0xffffff, fill = 0) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.035, 0.03, h, 20, 1, true), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0, h / 2, 0, g, false);
  if (fill) mesh(new THREE.CylinderGeometry(0.031, 0.029, h * fill, 20), new THREE.MeshStandardMaterial({ color: 0xe8c860, transparent: true, opacity: 0.7, roughness: 0.1 }), 0, h * fill / 2, 0, g, false);
  return g;
}
export function bottle() {
  const g = new THREE.Group(), m = std(0x0f3a1e, 0.1, 0.2);
  cyl(0.04, 0.04, 0.22, m, 0, 0.11, 0, g, 18); cyl(0.015, 0.04, 0.08, m, 0, 0.26, 0, g, 18); cyl(0.016, 0.016, 0.06, std(0xd8b040, 0.3, 0.8), 0, 0.31, 0, g, 12);
  cyl(0.041, 0.041, 0.07, std(0xf0e6c8, 0.5), 0, 0.12, 0, g, 18);
  return g;
}
export function candle(h = 0.14) {
  const g = new THREE.Group();
  cyl(0.02, 0.02, h, std(0xf4ead8, 0.6), 0, h / 2, 0, g, 14);
  const f = sprite(glowMap(), 0xffb050, 0.07, 0.11, 0.95); f.position.y = h + 0.035; g.add(f);
  const core = mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.2) }), 0, h + 0.018, 0, g, false); core.scale.y = 1.8;
  g.flame = f; return g;
}
export function bowl(r = 0.1, foodCol = 0xe8d7a0) {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xf1ede6, 0.25), 0, r, 0, g); b.material.side = THREE.DoubleSide;
  const food = mesh(new THREE.SphereGeometry(r * 0.92, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.32), std(foodCol, 0.8), 0, r * 0.62, 0, g); void food;
  return g;
}
export function mandarins(n = 7, seed = 3) {
  const g = new THREE.Group(), r = rng(seed), m = std(0xf08a1a, 0.45);
  const b = bowl(0.13, 0xf08a1a); g.add(b);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const s = sph(0.035, m, Math.cos(a) * 0.06 * (i % 2 ? 1 : 0.4), 0.11 + (i % 3) * 0.02, Math.sin(a) * 0.06, g, 14); s.scale.y = 0.85; void r; }
  return g;
}

// ---------- fireworks ----------
const FW_VS = `uniform float time; attribute vec3 vel; attribute float t0; attribute vec3 color; varying vec3 vC; varying float vA;
void main(){ float t = time - t0; vec3 p = position + vel * (1. - exp(-t * 1.6)) / 1.6 + vec3(0., -0.9 * t * t, 0.);
  vC = color; vA = (t < 0. ? 0. : 1.) * clamp(1. - t / 2.2, 0., 1.) * (0.6 + 0.4 * sin(t * 40. + vel.x * 10.));
  vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(260. / -mv.z, 1., 14.) * (1.4 - t * 0.3); }`;
const FW_FS = `varying vec3 vC; varying float vA; uniform sampler2D map; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * 3. * t.rgb, t.a * vA); }`;
export function fireworks(bursts) { // bursts: [{p:[x,y,z], t:time, color, n}]
  const total = bursts.reduce((a, b) => a + (b.n || 220), 0);
  const pos = new Float32Array(total * 3), vel = new Float32Array(total * 3), t0 = new Float32Array(total), col = new Float32Array(total * 3);
  let k = 0; const r = rng(77);
  for (const b of bursts) {
    const c = new THREE.Color(b.color), n = b.n || 220, sp = b.speed || 9;
    for (let i = 0; i < n; i++, k++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), v = sp * (0.85 + r() * 0.15);
      pos.set(b.p, k * 3); vel.set([s * Math.cos(a) * v, u * v, s * Math.sin(a) * v], k * 3); t0[k] = b.t + r() * 0.03;
      const cc = c.clone().lerp(new THREE.Color(0xffffff), r() * 0.3); col.set([cc.r, cc.g, cc.b], k * 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('vel', new THREE.BufferAttribute(vel, 3)); g.setAttribute('t0', new THREE.BufferAttribute(t0, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.ShaderMaterial({ vertexShader: FW_VS, fragmentShader: FW_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, map: { value: glowMap() } } });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.setTime = t => { m.uniforms.time.value = t; };
  p.bursts = bursts;
  return p;
}
export function skyDome(top, mid, bottom, r = 400) {
  const tex = T.gradientTex([[0, top], [0.45, mid], [0.5, bottom], [1, bottom]]);
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  return m;
}
export function stars(n = 600, r = 300, seed = 4) {
  const rr = rng(seed), pts = [], cols = [], sz = [];
  for (let i = 0; i < n; i++) { const a = rr() * Math.PI * 2, e = 0.08 + rr() * 1.3; pts.push(new THREE.Vector3(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r)); cols.push(0xcfdcff); sz.push(1.5 + rr() * 3); }
  return makeBokeh(pts, cols, sz.map(s => s * 200), { map: glowMap(), opacity: 0.8, scale: 1 });
}
export { clamp };
