// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxQuestion, fxDirt, fxMud, fxSplash, fxArrows, fxCoins, fxBelt, fxButton,
  BREWERS, CLERK, OWNER, JUDGE, EXCISE, FATMAN, TOWNS1814, Outfit, Expr, FrontOpts, SideOpts, Prop,
} from "./toon";
import { FPS, D0, SHOTS, V3, smooth, clamp01, W, COURT, DINING, BARREL, waveFront, F_HOOP, F_BURST, F_WALL, F_BELT, F_SEAMS, F_GOD, F_REFUND, BUTTONS } from "./story";
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
const rad2 = rad;
void fxMud; void rad2; void strike; void fxDirtAt;

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  const [cx, , cz] = COURT, [dx, , dz] = DINING;
  switch (id) {
    case 1: { // townsfolk running ahead of the wave down the street; foam and spray along the wave's front
      const front = waveFront(1.2 + 0.55 * t);
      for (let k = 0; k < 3; k++) {
        const u = q(((t * 1.3 + k * 0.33) % 1), 30);
        out.fx.push({ key: `foam${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u, "#f1e3c3", "#b06a2c"), x: -front - 0.7, y: 2.2, z: [11.0, 13.4, 15.8][k], w: 5.6, h: 5.6 });
      }
      for (let i = 0; i < 3; i++) {
        const x = -15 - 5.0 * t - i * 1.6, z = [11.4, 15.6, 13.0][i], ph = q((t * 2.2 + i * 0.3) % 1, 120);
        add(out, cam, t, 1 + i, TOWNS1814[i], "r" + i, x, z, { mode: "march", phase: ph, expr: "shock", lift: 90 }, { dir: [-1, 0], side: { mode: "march", phase: ph, expr: "shock", stride: 1.2 } });
      }
      break;
    }
    case 2: { // the brewers are proud of their vat
      const proud = t > tw(17);
      ([[-3.6, 4.7], [2.9, 5.0], [-6.4, 3.2]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 10 + i, BREWERS[i], "b" + i, x, z, { mode: "stand", expr: proud ? (i % 2 ? "laugh" : "grin") : "smile", prop: proud && i === 0 ? "thumb" : null,
          wave: proud && i === 1 ? q(Math.sin(t * 8), 30) : undefined }));
      break;
    }
    case 3: { // the clerk with his ledger shrugs at the fallen hoop
      const shrug = t > tw(35);
      if (f >= W(34) - 5) add(out, cam, t, 20, CLERK, "clerk", -5.2, 4.6, { mode: "stand", expr: shrug ? "smile_closed" : "neutral", prop: shrug ? "shrug" : "ledger" });
      once(out, t, T(F_HOOP + 8), 0.35, (u) => ({ key: `clang${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 8, 30, 160), x: -2.2, y: 0.25, z: 2.6, w: 0.9, h: 0.9 }));
      break;
    }
    case 4: { // the vat bursts; the workers end up waist-deep
      const burst = f >= F_BURST - 1, saved = t > tw(56);
      ([[5.2, 4.0], [-5.6, 3.6]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 10 + i, BREWERS[i], "b" + i, x, z, { mode: "stand", expr: burst ? "shock" : "neutral" }, { blob: !burst }));
      ([[4.2, 5.6], [6.1, 4.5], [2.6, 6.5]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 30 + i, BREWERS[(i + 1) % 3], "w" + i, x, z, { mode: "stand", expr: saved ? "relief_open" : burst ? "shock" : "neutral", prop: burst && !saved ? "palm" : null }, { blob: false }));
      once(out, t, T(F_BURST), 0.9, (u) => ({ key: `beerburst${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u, "#c9874a", "#8a4f1c"), x: 0, y: 2.6, z: 3.8, w: 9, h: 9 }));
      break;
    }
    case 5: { // the wall gives way
      if (f < F_WALL + 20) add(out, cam, t, 40, TOWNS1814[1], "t1", -10.5, 15.4, { mode: "stand", expr: f >= F_WALL - 2 ? "shock" : "neutral" });
      const ws = T(f - F_WALL) - 0.15;
      if (ws > 0.4 && ws < 7) for (const sd of [-1, 1]) {
        const u = q(((t * 1.3 + (sd > 0 ? 0.5 : 0)) % 1), 30), x = sd * (waveFront(ws) + 0.7);
        out.fx.push({ key: `foam${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u, "#f1e3c3", "#b06a2c"), x, y: 1.4, z: 13.4, w: 4.2, h: 4.2 });
      }
      once(out, t, T(F_WALL), 1.0, (u) => ({ key: `wallsplash${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u, "#c9874a", "#8a4f1c"), x: 0, y: 3.2, z: 10.5, w: 11, h: 11 }));
      break;
    }
    case 7: { // why did it burst?
      add(out, cam, t, 20, CLERK, "clerk", -3.8, 5.2, { mode: "stand", expr: "nervous", prop: "scratch" });
      const k = smooth((t - tw(80) - 0.1) / 0.25);
      if (k > 0.01) out.fx.push({ key: "question", cw: 300, ch: 420, draw: fxQuestion, x: -3.45, y: 2.75 + 0.05 * Math.sin(t * 5), z: 5.2, w: 0.48 * k, h: 0.67 * k });
      break;
    }
    case 8: { // pressure grows toward the bottom
      const k = smooth((t - tw(88)) / 1.2), kk = q(k, 20);
      if (kk > 0.01) for (const sd of [-1, 1])
        out.fx.push({ key: `arrows${kk}`, cw: 400, ch: 1000, draw: (p) => fxArrows(p, kk), x: BARREL[0] + sd * 0.92, y: 0.66, z: BARREL[2] + 0.35, w: sd * 0.62, h: 1.3 });
      break;
    }
    case 9: case 10: { // a belt after a feast; then it goes, then the buttons, then the seams
      const belt = id === 9 || f < F_BELT - 1, seams = f >= F_SEAMS - 1;
      const expr: Expr = id === 9 ? (t > tw(100) ? "grin" : "smile") : seams ? "shock" : f >= F_BELT - 1 ? (f < F_BELT + 15 ? "shock" : "nervous") : "pained";
      add(out, cam, t, 60, belt ? FATMAN : { ...FATMAN, waist: undefined }, belt ? "fat" : "fat2", dx, dz - 0.15, { mode: "stand", expr });
      if (id === 10) {
        once(out, t, T(F_BELT), 0.9, (u) => ({ key: `belt${u}`, cw: 600, ch: 300, draw: (p) => fxBelt(p, u), x: dx + 0.5 + 1.2 * u, y: 0.78 + 0.8 * u - 1.2 * u * u, z: dz - 0.45, w: 0.9, h: 0.45 }));
        once(out, t, T(F_BELT), 0.3, (u) => ({ key: `bburst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 8, 30, 180), x: dx, y: 0.78, z: dz - 0.4, w: 0.7, h: 0.7 }));
        BUTTONS.forEach((bf, i) => once(out, t, T(bf), 0.5, (u) => ({ key: `button${u}`, cw: 300, ch: 300, draw: (p) => fxButton(p, u), x: dx + 0.05 + (i - 1) * 0.12, y: 0.85 + 0.13 * i, z: dz - 0.45, w: 0.45, h: 0.45, rot: i * 0.8 })));
        once(out, t, T(F_SEAMS), 0.5, (u) => ({ key: `seams${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#ffffff", 12, 40, 230), x: dx, y: 0.9, z: dz - 0.45, w: 1.6, h: 1.6 }));
      }
      break;
    }
    case 11: case 12: case 13: { // the inquest
      const god = f >= F_GOD - 2;
      add(out, cam, t, 70, JUDGE, "judge", cx, cz + 5.9, { mode: "stand", expr: id === 11 && god ? "neutral" : "stern", prop: id === 11 && god ? "point" : null }, { y: 0.9, blob: false });
      const refund = f >= F_REFUND - 2;
      const ownerExpr: Expr = id === 11 ? (t > tw(117) ? (god ? "grin" : "smile") : "nervous") : id === 12 ? "smile_closed" : refund ? "laugh" : "smile";
      const ownerProp: Prop = id === 12 ? "shrug" : id === 13 && refund ? "moneybag" : null;
      add(out, cam, t, 71, OWNER, "owner", cx - 2.0, cz + 1.5, { mode: "stand", expr: ownerExpr, prop: ownerProp });
      ([[2.2, 1.8], [3.3, 2.6]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 72 + i, TOWNS1814[i], "rel" + i, cx + x, cz + z, { mode: "stand", expr: id === 11 && god ? "shock" : "stern" }));
      ([[6.2, 1.0], [7.4, 2.0]] as const).forEach(([x, z], i) =>
        add(out, cam, t, 74 + i, TOWNS1814[i + 2], "jury" + i, cx + x, cz + z, { mode: "stand", expr: "neutral" }, { blob: false }));
      if (id === 13) {
        add(out, cam, t, 76, EXCISE, "excise", cx - 0.5, cz + 2.3, { mode: "stand", expr: refund ? "smile" : "neutral", prop: refund ? null : "ledger" });
        once(out, t, T(F_REFUND), 0.8, (u) => ({ key: `coins${u}`, cw: 600, ch: 600, draw: (p) => fxCoins(p, u), x: cx - 1.6, y: 2.2, z: cz + 1.4, w: 1.6, h: 1.6 }));
      }
      break;
    }
  }
  return out;
};
export { FPS };
