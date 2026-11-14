// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, KID, fxBurst, fxStars, fxCreak, fxShadow, fxContact, fxQuestion, fxDirt, fxMud, fxMist, fxNoEntry,
  MASONS, KNIGHT, TOWNS12, DUCE, BLACKSHIRT, WORKER34, GUARD, ENGINEER, TOURISTS, Outfit, Expr, FrontOpts, SideOpts, Prop,
} from "./toon";
import { FPS, D0, SHOTS, V3, smooth, clamp01, W, TW, towerAt, DRILL_HOLE, KID_SAND, DOOR, PUSHERS, LURCHES } from "./story";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = {};
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1, tail = true) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day" && tail) {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- the Pisa cast, shot by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const T = (f: number) => f / FPS;
/** reaction time for word i (lands LEAD before the word) */
const tw = (i: number) => T(W(i)) - LEAD;
const rad = (d: number) => (d * Math.PI) / 180;
/** a hammer blow cycle: 1 struck .. 0 raised; slow lift, short hold at the top, a quick strike */
const strike = (t: number, ph: number, per = 0.95) => {
  const c = (((t / per + ph) % 1) + 1) % 1;
  return c < 0.5 ? 1 - smooth(c / 0.5) : c < 0.62 ? 0 : c < 0.67 ? (c - 0.62) / 0.05 : 1;
};
type AddOpt = { y?: number; scale?: number; blob?: boolean; tail?: boolean; side?: SideOpts; dir?: [number, number]; sideView?: boolean };
/** one character: front card (or a side card when opt.side is given), blink, contact shadow */
const add = (out: Stage, cam: CamInfo, t: number, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts, opt: AddOpt = {}) => {
  const y = opt.y ?? D0, sc = opt.scale ?? 1;
  let view = { side: false, mirror: false };
  if (opt.dir) { const v = viewOf(cam, x, z, opt.dir[0], opt.dir[1]); view = { side: opt.sideView ?? v.side, mirror: v.mirror }; }
  const f2: FrontOpts = { blink: lidAt(t, i), ...fo };
  const s2: SideOpts = { blink: lidAt(t, i), ...(opt.side ?? {}) };
  out.places.push(person(cam, { i, o, okey }, x, y, z, view, f2, s2, sc));
  if (opt.blob !== false) blob(out, x, y, z, sc, 1, opt.tail !== false);
};
const fxDirtAt = (out: Stage, t: number, p: V3, per: number, size: number) => {
  for (let k = 0; k < 2; k++) {
    const u = q((t / per + k * 0.5) % 1, 30);
    out.fx.push({ key: `dirt${u}|${k}`, cw: 600, ch: 600, draw: (pen) => fxDirt(pen, u, k + 1), x: p[0], y: p[1] + 0.37 * size, z: p[2], w: size, h: size });
  }
};
const once = (out: Stage, t: number, t0: number, dur: number, make: (u: number) => FxPlace | null) => {
  if (t < t0 || t >= t0 + dur) return;
  const p = make(q((t - t0) / dur, 30));
  if (p) out.fx.push(p);
};
/** a point on the tower's (leaning) frame, from local coordinates around its base */
const onTower = (id: number, f: number, lx: number, ly: number, lz: number): V3 => {
  const th = rad(towerAt(id, f).tilt);
  return [lx, ly * Math.cos(th) - lz * Math.sin(th), ly * Math.sin(th) + lz * Math.cos(th)];
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  const hole: V3 = DRILL_HOLE;
  switch (id) {
    case 1: { // engineers by the drill rig, earth flying out from under the tower
      const go = t > tw(6);
      add(out, cam, t, 1, ENGINEER(0), "e0", -13.4, -6.2, { mode: "stand", expr: go ? "grin" : "smile", prop: go ? "thumb" : null });
      add(out, cam, t, 2, ENGINEER(1), "e1", -12.8, -11.8, { mode: "stand", expr: "smile_closed", look: -1 });
      add(out, cam, t, 3, ENGINEER(2), "e2", -6.4, -12.6, { mode: "stand", expr: "neutral" });
      fxDirtAt(out, t, hole, go ? 0.45 : 0.7, go ? 2.3 : 1.2);
      break;
    }
    case 2: { // masons at work on the stump, townsfolk proud
      ([[5.6, 9.4], [8.9, 5.6], [2.2, 10.6], [9.8, 1.4]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 10 + i, MASONS[i], "m" + i, x, z, { mode: "stand", expr: i % 2 ? "stern" : "neutral", prop: ["hammer", q(strike(t, i * 0.31), 30)] }));
      const cheer = t > tw(10);
      for (let i = 0; i < 6; i++) {
        const x = 13.5 + (i % 3) * 1.6 + hh(i) * 0.8, z = 2.5 + Math.floor(i / 3) * 3.2 + hh(i, 2) * 1.6;
        add(out, cam, t, 20 + i, TOWNS12[i % 4], "t" + (i % 4), x, z, { mode: "stand", expr: cheer ? (i % 2 ? "laugh" : "grin") : "smile",
          wave: cheer && i % 2 === 0 ? q(Math.sin(t * 9 + i), 30) : undefined });
      }
      break;
    }
    case 3: { // the stump leans; the masons notice
      const lean = t > tw(20), clay = t > tw(25) - 0.2;
      ([[-11.5, -1.5], [-12.6, 4.4], [-10.4, 8.4]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 10 + i, MASONS[i], "m" + i, x, z, lean ? { mode: "stand", expr: i === 1 ? "shock" : "nervous" } : { mode: "stand", expr: "neutral", prop: ["hammer", q(strike(t, i * 0.31), 30)] }));
      if (lean && !clay) for (const [lx, lz] of [[0, 7.6], [-5, 5.6]] as const) {
        const u = q((t * 1.3 + lx) % 1, 30);
        out.fx.push({ key: `creak${u}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, u), x: lx - 1, y: 1.0, z: lz, w: 1.6, h: 1.6, rot: -0.4 });
      }
      once(out, t, tw(25), 0.8, (u) => ({ key: `mud${u}`, cw: 600, ch: 300, draw: (p) => fxMud(p, u), x: -0.6, y: 0.45, z: 8.2, w: 2.6, h: 1.3 }));
      once(out, t, tw(25) + 0.5, 0.8, (u) => ({ key: `mud${u}`, cw: 600, ch: 300, draw: (p) => fxMud(p, u), x: 2.6, y: 0.4, z: 7.8, w: 2.2, h: 1.1 }));
      break;
    }
    case 4: { // the masons put on helmets and march off to war
      const t0 = T(s.a), dt = t - t0;
      for (let i = 0; i < 10; i++) {
        const row = i >> 1, file = i & 1 ? 0.65 : -0.65;
        const x = 6 + 1.2 * dt - row * 1.25 * 0.92 - file * 0.38, z = 9.5 + 0.5 * dt - row * 1.25 * 0.38 + file * 0.92;
        const ph = q(((dt * 0.81) % 1 + 1) % 1, 120);
        add(out, cam, t, 30 + i, KNIGHT(i), "k" + (i % 4), x, z, { mode: "march", phase: ph, expr: i % 3 ? "stern" : "grin", prop: "spear", lift: 50 },
          { dir: [0.92, 0.38], side: { mode: "march", phase: ph, expr: "stern", stride: 0.8 } });
      }
      break;
    }
    case 6: { // masons on the scaffold build the upper storeys taller on the leaning side
      for (const [i, a] of [[0, 200], [1, 162]] as const) {
        const R = 7.96, p = onTower(6, f, R * Math.cos(rad(a)), 23.64, R * Math.sin(rad(a)));
        add(out, cam, t, 10 + i, MASONS[i + 1], "m" + (i + 1), p[0], p[2], { mode: "stand", expr: i ? "stern" : "neutral", prop: ["hammer", q(strike(t, i * 0.4), 30)] }, { y: p[1], blob: false });
      }
      break;
    }
    case 7: // a kid holds up a banana next to the tower
      add(out, cam, t, 40, KID, "kid", -32.0, 11.6, { mode: "stand", expr: "grin", prop: "banana" }, { scale: 0.72 });
      break;
    case 8: { // 1934: Mussolini decides the tower shames Italy
      const angry = t > tw(69);
      add(out, cam, t, 50, DUCE, "duce", -20, -6, { mode: "stand", expr: "stern", prop: angry ? "point" : null, facing: angry ? 1 : 0 });
      add(out, cam, t, 51, BLACKSHIRT, "bs", -17.2, -8.8, { mode: "stand", expr: "stern" });
      add(out, cam, t, 52, { ...BLACKSHIRT, moustache: "#2a201a" }, "bs2", -18.4, -2.8, { mode: "stand", expr: angry ? "nervous" : "stern" });
      break;
    }
    case 9: { // grout pumped into the foundation; the tower lurches
      const lurch = f >= LURCHES[0] - 2;
      add(out, cam, t, 60, WORKER34[0], "w0", -12.4, -10.6, { mode: "stand", expr: lurch ? "shock" : "neutral", prop: lurch ? null : ["hammer", q(strike(t, 0.2, 1.1), 30)] });
      add(out, cam, t, 61, WORKER34[1], "w1", -7.0, -12.6, { mode: "stand", expr: lurch ? "shock" : "smile_closed" });
      add(out, cam, t, 50, DUCE, "duce", -15.8, -9.4, { mode: "stand", expr: lurch ? "shock" : "stern" });
      break;
    }
    case 10: { // 1990: 5.5 degrees, closed; the guard lowers the barrier
      const shut = t > tw(89);
      ([[-30, 12], [-27.5, 15.5], [-33, 17], [-25.6, 9.5], [-35.5, 13.2], [-29, 19.5]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 70 + i, TOURISTS[i], "tu" + i, x, z, { mode: "stand", expr: (["shock", "smile", "nervous", "grin", "smile_closed", "shock"] as Expr[])[i], prop: i === 3 ? "camera" : null }));
      add(out, cam, t, 79, GUARD, "guard", -15.4, 2.7, { mode: "stand", expr: "stern", prop: shut ? "palm" : null });
      out.fx.push({ key: "noentry", cw: 400, ch: 400, draw: fxNoEntry, x: -14.62, y: 1.55, z: -2.25, w: 0.55, h: 0.55 });
      break;
    }
    case 11: // 600 t of lead: engineers watch the crane
      add(out, cam, t, 80, ENGINEER(1), "e1", -10.4, -19.4, { mode: "stand", expr: "neutral", look: 1 });
      add(out, cam, t, 81, ENGINEER(3), "e3", -7.6, -20.8, { mode: "stand", expr: "smile_closed" });
      break;
    case 12: { // luckily the lead holds / unluckily a heap of lead on the Square of Miracles
      const ok = t > tw(99);
      add(out, cam, t, 82, ENGINEER(0), "e0", -5.6, -15.5, { mode: "stand", expr: ok ? "grin" : "neutral", prop: ok ? "thumb" : null });
      const un = t > tw(101);
      ([[-13.5, -19.5], [-16, -17.2], [-11.6, -22.4], [-18.2, -21.4], [-15, -24]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 83 + i, TOURISTS[i + 1], "tu" + (i + 1), x, z, { mode: "stand", expr: un ? (["stern", "nervous", "neutral", "dazed", "stern"] as Expr[])[i] : "smile", prop: i === 0 ? "camera" : null }));
      break;
    }
    case 13: { // liquid nitrogen, then the tower creeps south again
      const lurch = f >= LURCHES[1] - 2;
      ([[-8.6, -17.0], [-6.2, -18.6], [-1.4, -17.6]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 90 + i, ENGINEER(i), "e" + i, x, z, { mode: "stand", expr: lurch ? "shock" : i === 1 ? "nervous" : "neutral" }));
      for (let k = 0; k < 5; k++) {
        const u = q(((t * 0.45 + k * 0.2) % 1), 30), x = -4.6 + k * 1.1, z = -10.8 - (k % 2) * 1.2;
        out.fx.push({ key: `mist${u}`, cw: 300, ch: 300, draw: (p) => fxMist(p, u), x, y: 0.7, z, w: 2.2, h: 2.2, soft: true });
      }
      break;
    }
    case 14: { // how do you straighten a tower you must not touch?
      add(out, cam, t, 95, ENGINEER(2), "e2", -11, 4, { mode: "stand", expr: "nervous", prop: "scratch" });
      const k = smooth((t - tw(119) - 0.15) / 0.25);
      if (k > 0.01) out.fx.push({ key: "question", cw: 300, ch: 420, draw: fxQuestion, x: -11 + 0.35, y: 2.75 + 0.05 * Math.sin(t * 5), z: 4, w: 0.48 * k, h: 0.67 * k });
      break;
    }
    case 15: { // the wet sand: one foot sinks; pulling is useless; dig sand from under the other one
      const tA = tw(130), tB = tw(132), tC = tw(135);
      const left = 90 * smooth((t - tA) / 0.35), right = 90 * smooth((t - tC - 0.2) / 1.1);
      const tilt = t < tA ? 0 : -11 * smooth((t - tA) / 0.35) * (1 - smooth((t - tC - 0.2) / 1.1)) + (t > tB && t < tC ? 1.5 * Math.sin(t * 22) : 0);
      const expr: Expr = t < tA ? "grin" : t < tB ? "shock" : t < tC ? "pained" : t < tC + 1.2 ? "grin" : "relief_open";
      const prop: Prop = t > tC - 0.1 ? ["spade", q(0.5 + 0.5 * Math.sin((t - tC) * 13), 20)] : null;
      add(out, cam, t, 99, KID, "kid", KID_SAND[0], KID_SAND[2], { mode: "stand", expr, prop, tilt, sink: [q(left, 4), q(right, 4)] }, { scale: 0.85, tail: false });
      once(out, t, tA, 0.6, (u) => ({ key: `sandpuff${u}`, cw: 600, ch: 300, draw: (p) => fxMud(p, u * 0.8, "#e2c48a", "#c9a46a"), x: KID_SAND[0] - 0.12, y: 0.18, z: KID_SAND[2] + 0.05, w: 0.9, h: 0.45 }));
      if (t > tC) for (let k = 0; k < 2; k++) {
        const u = q(((t - tC) * 1.6 + k * 0.5) % 1, 30);
        out.fx.push({ key: `dirt${u}|s${k}`, cw: 600, ch: 600, draw: (p) => fxDirt(p, u, 5 + k, "#d9b878", "#c9a46a"), x: KID_SAND[0] + 0.35, y: 0.25, z: KID_SAND[2] + 0.1, w: 0.7, h: 0.7 });
      }
      break;
    }
    case 16: { // 38 m3 drilled out from under the north side: about one room
      ([[-13.6, -12.2], [-6.6, -12.8], [-14.6, -6.8]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 100 + i, ENGINEER(i), "e" + i, x, z, { mode: "stand", expr: i === 2 ? "smile_closed" : "neutral" }));
      fxDirtAt(out, t, hole, 0.6, 1.2);
      if (f >= W(150) - 5) add(out, cam, t, 104, ENGINEER(3), "e3", -19.9, -26.7, { mode: "stand", expr: t > tw(150) ? "grin" : "smile", prop: t > tw(150) ? "point" : null });
      break;
    }
    case 17: { // back 45 cm: cheering
      const yay = t > tw(155);
      ([[-22, 6.5], [-24.5, 3.5], [-20.4, 9.5]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 100 + i, ENGINEER(i), "e" + i, x, z, { mode: "stand", expr: yay ? (i % 2 ? "laugh" : "relief_open") : "nervous", wave: yay && i !== 1 ? q(Math.sin(t * 9 + i), 30) : undefined }));
      break;
    }
    case 18: { // reopened in 2001: the ribbon, then a tourist holds the tower up
      const cut = t > tw(166);
      add(out, cam, t, 110, ENGINEER(0), "e0", -10.3, -1.0, { mode: "stand", expr: cut ? "laugh" : "smile", prop: "scissors" });
      ([[-11.4, 2.7], [-12.4, 3.9], [-11.0, 4.9]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 111 + i, TOURISTS[i], "tu" + i, x, z, { mode: "stand", expr: cut ? "laugh" : "smile", wave: cut ? q(Math.sin(t * 9 + i * 2), 30) : undefined }));
      once(out, t, tw(166), 0.5, (u) => ({ key: `confetti${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#ffd84a"), x: DOOR[0] - 1.6, y: 1.2, z: 0, w: 1.4, h: 1.4 }));
      add(out, cam, t, 115, TOURISTS[4], "tu4", -36.15, -1.24, { mode: "stand", expr: "grin", prop: "palm" });
      add(out, cam, t, 116, TOURISTS[2], "tu2", -38.0, -2.9, { mode: "stand", expr: "laugh", prop: "camera" });
      break;
    }
    case 19: { // eight centuries of pushing; then it straightens by itself
      const stop = t > tw(177), pop = f >= W(185) - 1;
      const who: [Outfit, string, number][] = [[MASONS[0], "m0", 10], [DUCE, "duce", 50], [ENGINEER(0), "e0", 82]];
      who.forEach(([o, k, i], n) => {
        const [x, , z] = PUSHERS[n], pose = stop ? 0.1 : q(0.55 + 0.45 * Math.sin(t * 5 + n * 1.3), 20);
        const expr: Expr = pop ? "shock" : stop ? "neutral" : "pained";
        add(out, cam, t, i, o, k, x, z + (stop ? 0.6 * smooth((t - tw(177)) / 0.6) : 0), { mode: "stand", expr }, { dir: [0, -1], sideView: true, side: { mode: stop ? "stand" : "push", pose, expr } });
      });
      once(out, t, T(W(185)) - LEAD, 0.45, (u) => ({ key: `pop${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 8, 30, 200), x: 0.2, y: 2.4, z: 7.6, w: 1.6, h: 1.6 }));
      if (pop) PUSHERS.forEach(([x, , z], n) => {
        const u = (t * 0.9 + n * 0.3) % 1;
        out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x, y: 2.35, z: z + 0.6, w: 0.7, h: 0.35 });
      });
      break;
    }
  }
  return out;
};
export { FPS, TW };
