// Stylized 3D character: rig (FK + two-bone IK), procedural face with lids/brows/mouth/tears.
import * as THREE from 'three';
import { clamp, lerp, rng, noise1, inv } from './core.js';
import * as T from './tex.js';

const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
const texCache = {};
const cached = (k, f) => (texCache[k] ||= f());

// ---------- geometry helpers ----------
export function taperCapsule(r0, r1, len, rad = 14, capSeg = 6) {
  // along -Y from 0 (radius r0 cap centered at 0) to -len (radius r1 cap)
  const pts = [];
  for (let i = 0; i <= capSeg; i++) { const a = -Math.PI / 2 + (i / capSeg) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r1 + 1e-4, -len + Math.sin(a) * r1)); }
  for (let i = 0; i <= capSeg; i++) { const a = (i / capSeg) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r0 + 1e-4, Math.sin(a) * r0)); }
  return new THREE.LatheGeometry(pts, rad);
}
// tube along points with per-point radius (array or [r0,r1]) — closed-ish ends
export function taperTube(points, radii, radial = 6) {
  const n = points.length, pos = [], idx = [], nrm = [];
  const rad = i => Array.isArray(radii) && radii.length === n ? radii[i] : lerp(radii[0], radii[1], i / (n - 1));
  const tang = [], norm = [], bin = [];
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
    tang.push(b.clone().sub(a).normalize());
  }
  let up = Math.abs(tang[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const nn = new THREE.Vector3().crossVectors(tang[i], up).normalize();
    const bb = new THREE.Vector3().crossVectors(nn, tang[i]).normalize();
    norm.push(nn); bin.push(bb); up = bb;
  }
  for (let i = 0; i < n; i++) for (let k = 0; k <= radial; k++) {
    const a = k / radial * Math.PI * 2, r = rad(i);
    const d = norm[i].clone().multiplyScalar(Math.cos(a)).add(bin[i].clone().multiplyScalar(Math.sin(a)));
    pos.push(points[i].x + d.x * r, points[i].y + d.y * r, points[i].z + d.z * r); nrm.push(d.x, d.y, d.z);
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < radial; k++) {
    const a = i * (radial + 1) + k, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}
function ellipsoid(rx, ry, rz, mat, ws = 24, hs = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, ws, hs), mat); m.scale.set(rx, ry, rz); return m;
}
const shadowify = o => o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });

// ---------- expression presets ----------
export const EXPR = {
  neutral: {},
  tired: { lidUp: 0.42, browInL: 0.25, browInR: 0.32, smile: -0.12, lidLo: 0.1 },
  sad: { lidUp: 0.35, browInL: 0.8, browInR: 0.95, browOutL: -0.35, browOutR: -0.3, smile: -0.55, lidTilt: 0.6, lidLo: 0.12 },
  cry: { lidUp: 0.45, browInL: 0.95, browInR: 1, browOutL: -0.4, browOutR: -0.45, smile: -0.75, lidTilt: 0.7, lidLo: 0.35, mouthOpen: 0.08, press: 0.3 },
  longing: { lidUp: 0.25, browInL: 0.5, browInR: 0.6, smile: 0.08, lidTilt: 0.3 },
  surprise: { browInL: 0.9, browInR: 0.85, browOutL: 1, browOutR: 0.95, wide: 1, mouthOpen: 0.4, ooh: 0.7 },
  joy: { smile: 1, cheek: 0.75, browInL: 0.15, browInR: 0.2, browOutL: 0.25, browOutR: 0.2, mouthOpen: 0.12 },
  laugh: { smile: 1, cheek: 1, mouthOpen: 0.6, browInL: 0.35, browInR: 0.3, browOutL: 0.2, browOutR: 0.25 },
  sleep: { closed: 1, smile: 0.06, mouthOpen: 0.05, browInL: 0.1, browInR: 0.1 },
  determined: { browDown: 0.6, lidUp: 0.12, smile: -0.12, press: 0.55, browOutL: 0.15, browOutR: 0.1 },
  hope: { browInL: 0.5, browInR: 0.45, smile: 0.45, wide: 0.25, cheek: 0.2 },
  touched: { browInL: 0.75, browInR: 0.85, smile: 0.4, lidUp: 0.25, lidLo: 0.25, cheek: 0.35, lidTilt: 0.35 },
  proud: { smile: 0.8, cheek: 0.5, browInL: 0.2, browInR: 0.25, browOutL: 0.35, browOutR: 0.3, wide: 0.15 },
  anxious: { browInL: 0.6, browInR: 0.7, browDown: 0.2, press: 0.35, smile: -0.25, wide: 0.15 },
  breath: { mouthOpen: 0.28, ooh: 0.3, browInL: 0.3, browInR: 0.35 },
  gasp: { browInL: 1, browInR: 1, browOutL: 0.6, browOutR: 0.6, wide: 0.8, mouthOpen: 0.5, ooh: 0.9 },
};
const FACE_KEYS = ['lidUp', 'lidLo', 'closed', 'wide', 'cheek', 'browInL', 'browInR', 'browOutL', 'browOutR', 'browDown', 'smile', 'mouthOpen', 'ooh', 'press', 'lidTilt', 'asym'];

export class Character {
  constructor(o) {
    this.o = o = Object.assign({
      h: 1.78, kid: false, head: [0.112, 0.128, 0.118], skin: 0xe9b998, seed: 1,
      shoulderW: 0.19, chestR: 0.165, waistR: 0.148, hipR: 0.158, depth: 0.64, belly: 0, bust: 0,
      armR: [0.05, 0.041, 0.034], legR: [0.078, 0.058, 0.042], neckR: 0.05, neckLen: 0.06, handK: 1,
      top: { color: 0x8a8a8a }, pants: { color: 0x2d3e5c }, shoes: { color: 0x222222 },
      hair: { style: 'short', color: 0x1d1612 }, face: {},
    }, o);
    this.face = {}; this.rand = rng(o.seed);
    this.root = new THREE.Group(); this.root.name = o.name || 'char';
    this.j = {};
    this.blinks = []; let bt = 0.6 + this.rand() * 1.5;
    while (bt < 140) { this.blinks.push(bt); bt += 2.2 + this.rand() * 3.4; }
    this.extraBlinks = []; this.autoBlink = true;
    this.build();
    this.reset();
  }

  // ---------- build ----------
  build() {
    const o = this.o, H = o.h, [rx, ry, rz] = o.head;
    const kid = o.kid;
    this.headPivotY = H - 1.82 * ry;
    this.shoulderY = this.headPivotY - o.neckLen;
    this.hipY = kid ? H * 0.43 : H * 0.48;
    this.torsoL = this.shoulderY - this.hipY;
    this.upperLen = H * (kid ? 0.155 : 0.172);
    this.foreLen = H * (kid ? 0.13 : 0.142);
    this.thighLen = this.hipY * 0.5;
    this.shinLen = this.hipY * 0.44;
    const skinMat = this.skinMat = new THREE.MeshPhysicalMaterial({ color: o.skin, roughness: 0.52, sheen: 0.35, sheenColor: new THREE.Color(0xff7a5a), sheenRoughness: 0.6 });
    this.mats = { skin: skinMat };
    const top = this.makeMat(o.top), pants = this.makeMat(o.pants), shoes = this.makeMat(o.shoes);
    this.mats.top = top; this.mats.pants = pants; this.mats.shoes = shoes;
    const sleeve = o.top.sleeve ? this.makeMat(o.top.sleeve) : top;

    const pelvis = this.j.pelvis = new THREE.Group(); pelvis.position.y = this.hipY; this.root.add(pelvis);
    const spine = this.j.spine = new THREE.Group(); pelvis.add(spine);
    const chest = this.j.chest = new THREE.Group(); chest.position.y = this.torsoL * 0.45; spine.add(chest);
    const neck = this.j.neck = new THREE.Group(); neck.position.y = this.torsoL * 0.55; chest.add(neck);
    const head = this.j.head = new THREE.Group(); head.position.y = o.neckLen; neck.add(head);
    for (const jj of [neck, head, spine, pelvis, chest]) jj.rotation.order = 'YXZ';
    this.root.rotation.order = 'YXZ';

    // torso (lathe) attached to spine
    const L = this.torsoL, cR = o.chestR, wR = o.waistR, hR = o.hipR;
    const hem = o.top.hem ?? 0.12, coat = o.top.coatLen || 0;
    const prof = [];
    if (coat > 0) {
      const flare = o.top.flare ?? 1.35;
      prof.push([0.001, -coat - 0.01], [hR * flare, -coat], [hR * flare * 1.02, -coat + 0.03], [hR * (1 + (flare - 1) * 0.5), -coat * 0.45]);
    } else prof.push([0.001, -L * hem - 0.012], [hR * 1.04, -L * hem], [hR * 1.06, -L * hem + 0.02]);
    prof.push([hR * 1.02, L * 0.05], [wR, L * 0.38], [cR, L * 0.68], [cR * 0.98, L * 0.86], [cR * 0.8, L * 0.97], [o.neckR * 1.5, L * 1.02], [o.neckR * 1.15, L * 1.04], [0.001, L * 1.04]);
    const torsoG = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40, Math.PI, Math.PI * 2);
    { // depth scale + belly + bust
      const p = torsoG.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        z *= o.depth;
        if (o.belly && z > 0) { const k = Math.exp(-(((y - L * 0.3) / (L * 0.28)) ** 2)); z *= 1 + o.belly * k; x *= 1 + o.belly * 0.25 * k; }
        if (o.bust && z > 0) { const k = Math.exp(-(((y - L * 0.66) / (L * 0.12)) ** 2)) * Math.exp(-(((Math.abs(x) - cR * 0.45) / (cR * 0.4)) ** 2)); z *= 1 + o.bust * k; }
        p.setXYZ(i, x, y, z);
      }
      torsoG.computeVertexNormals();
    }
    const torso = new THREE.Mesh(torsoG, top); spine.add(torso); this.torsoMesh = torso;
    // pelvis (pants)
    const pelG = new THREE.LatheGeometry([[0.001, -0.07], [hR * 0.9, -0.07], [hR * 0.98, -0.02], [hR, 0.06], [hR * 0.96, 0.1], [0.001, 0.1]].map(([r, y]) => new THREE.Vector2(r, y)), 28);
    pelG.scale(1, 1, o.depth * 1.02);
    pelvis.add(new THREE.Mesh(pelG, pants));
    // neck
    const neckM = new THREE.Mesh(taperCapsule(o.neckR, o.neckR * 1.05, o.neckLen + 0.02, 14, 4), skinMat);
    neckM.position.y = o.neckLen + 0.01; neck.add(neckM);

    // arms
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const sh = this.j['sh' + s] = new THREE.Group(); sh.position.set(sx * o.shoulderW, L * 0.47, 0); chest.add(sh);
      const cap = ellipsoid(o.armR[0] * 1.12, o.armR[0] * 1.05, o.armR[0] * 1.08, sleeve); cap.position.set(-sx * 0.018, -0.004, 0); sh.add(cap);
      const ua = new THREE.Mesh(taperCapsule(o.armR[0], o.armR[1], this.upperLen), sleeve); sh.add(ua);
      const el = this.j['el' + s] = new THREE.Group(); el.position.y = -this.upperLen; sh.add(el);
      const fa = new THREE.Mesh(taperCapsule(o.armR[1], o.armR[2], this.foreLen), sleeve); el.add(fa);
      if (o.top.cuff) { const cf = new THREE.Mesh(new THREE.CylinderGeometry(o.armR[2] * 1.12, o.armR[2] * 1.12, 0.035, 16), this.makeMat(o.top.cuff)); cf.position.y = -this.foreLen + 0.01; el.add(cf); }
      const wr = this.j['wr' + s] = new THREE.Group(); wr.position.y = -this.foreLen; el.add(wr);
      this.buildHand(wr, s, o.mittens ? this.makeMat(o.mittens) : skinMat, !!o.mittens);
    }
    // legs
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const hp = this.j['hip' + s] = new THREE.Group(); hp.position.set(sx * hR * 0.52, 0, 0); pelvis.add(hp);
      const th = new THREE.Mesh(taperCapsule(o.legR[0], o.legR[1], this.thighLen), pants); hp.add(th);
      const kn = this.j['kn' + s] = new THREE.Group(); kn.position.y = -this.thighLen; hp.add(kn);
      const shn = new THREE.Mesh(taperCapsule(o.legR[1], o.legR[2], this.shinLen), o.legsMat ? this.makeMat(o.legsMat) : pants); kn.add(shn);
      const an = this.j['an' + s] = new THREE.Group(); an.position.y = -this.shinLen; kn.add(an);
      const fl = o.legR[2] * 2.6;
      const foot = ellipsoid(o.legR[2] * 1.25, this.hipY * 0.05, fl * 0.62, shoes, 20, 12);
      foot.position.set(0, -this.hipY * 0.045, fl * 0.32); an.add(foot);
      if (o.shoes.boot) { const b = new THREE.Mesh(taperCapsule(o.legR[2] * 1.3, o.legR[2] * 1.25, 0.08), shoes); b.position.y = 0.06; an.add(b); }
    }
    this.ankleH = this.hipY - this.thighLen - this.shinLen;

    this.buildHead(head);
    this.buildClothesExtras();
    shadowify(this.root);
  }

  makeMat(spec) {
    if (spec.isMaterial) return spec;
    const p = { color: spec.color ?? 0xffffff, roughness: spec.rough ?? 0.85, metalness: 0 };
    if (spec.map) { p.map = spec.map; p.color = 0xffffff; }
    if (spec.bump) { p.bumpMap = spec.bump; p.bumpScale = spec.bumpScale ?? 1.2; }
    if (spec.sheen) { return new THREE.MeshPhysicalMaterial({ ...p, sheen: spec.sheen, sheenColor: new THREE.Color(spec.sheenColor ?? 0xffffff), sheenRoughness: 0.8 }); }
    return new THREE.MeshStandardMaterial(p);
  }

  buildHand(wr, s, mat, mitten) {
    const k = this.o.handK * (this.o.kid ? 0.78 : 1) * this.o.h / 1.78;
    const sx = s === 'L' ? 1 : -1;
    const hand = this.j['hand' + s] = new THREE.Group(); wr.add(hand);
    if (mitten) {
      const m = ellipsoid(0.026 * k, 0.05 * k, 0.04 * k, mat); m.position.y = -0.045 * k; hand.add(m);
      const th = ellipsoid(0.017 * k, 0.03 * k, 0.017 * k, mat); th.position.set(-sx * 0.01 * k, -0.035 * k, 0.035 * k); th.rotation.x = -0.6; hand.add(th);
      this.fingers = this.fingers || {}; this.fingers[s] = [];
      return;
    }
    const palm = ellipsoid(0.017 * k, 0.04 * k, 0.036 * k, mat); palm.position.y = -0.036 * k; hand.add(palm);
    const fs = [];
    const fz = [0.024, 0.008, -0.008, -0.023], fl = [0.03, 0.033, 0.031, 0.025], fr = [0.0085, 0.0088, 0.0083, 0.0074];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Group(); b.position.set(0, -0.07 * k, fz[i] * k); hand.add(b);
      b.add(new THREE.Mesh(taperCapsule(fr[i] * k, fr[i] * 0.95 * k, fl[i] * 0.55 * k, 8, 3), mat));
      const m = new THREE.Group(); m.position.y = -fl[i] * 0.55 * k; b.add(m);
      m.add(new THREE.Mesh(taperCapsule(fr[i] * 0.95 * k, fr[i] * 0.85 * k, fl[i] * 0.45 * k, 8, 3), mat));
      fs.push([b, m]);
    }
    const tb = new THREE.Group(); tb.position.set(-sx * 0.008 * k, -0.02 * k, 0.03 * k); hand.add(tb);
    tb.rotation.set(-0.5, 0, -sx * 0.35);
    tb.add(new THREE.Mesh(taperCapsule(0.011 * k, 0.009 * k, 0.03 * k, 8, 3), mat));
    const tm = new THREE.Group(); tm.position.y = -0.03 * k; tb.add(tm);
    tm.add(new THREE.Mesh(taperCapsule(0.009 * k, 0.008 * k, 0.022 * k, 8, 3), mat));
    this.fingers = this.fingers || {}; this.fingers[s] = fs; this.thumbs = this.thumbs || {}; this.thumbs[s] = [tb, tm];
  }

  buildClothesExtras() {
    const o = this.o, L = this.torsoL, top = this.mats.top, chest = this.j.chest, spine = this.j.spine;
    const kind = o.top.kind;
    if (kind === 'hoodie') {
      const hood = new THREE.Mesh(new THREE.TorusGeometry(o.neckR * 1.9, o.neckR * 0.9, 10, 24, Math.PI * 1.25), top);
      hood.rotation.set(Math.PI / 2 + 0.25, 0, Math.PI * 0.875 - Math.PI / 2 - Math.PI * 0.125 + Math.PI);
      hood.position.set(0, L * 0.555, -o.neckR * 0.35); hood.scale.set(1, 0.85, 1.25); chest.add(hood);
      const back = ellipsoid(o.chestR * 0.6, L * 0.14, o.neckR * 1.1, top); back.position.set(0, L * 0.45, -o.chestR * o.depth * 0.85); chest.add(back);
      const strMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
      for (const sx of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, L * 0.24, 6), strMat);
        st.position.set(sx * o.neckR * 0.9, L * 0.42, o.chestR * o.depth * 0.98 + 0.004); chest.add(st);
      }
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(o.waistR * 1.25, L * 0.2, 0.02), top);
      pocket.position.set(0, L * 0.2, o.waistR * o.depth * 0.95); pocket.rotation.x = -0.12; spine.add(pocket);
    }
    if (kind === 'jacket') {
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(o.neckR * 1.55, o.neckR * 1.75, 0.07, 20, 1, true), top);
      collar.position.y = L * 0.6; collar.material = top.clone(); collar.material.side = THREE.DoubleSide; chest.add(collar);
      const zip = new THREE.Mesh(new THREE.BoxGeometry(0.008, L * 0.95, 0.006), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 }));
      zip.position.set(0, L * 0.47, o.chestR * o.depth * 1.0); spine.add(zip);
    }
    if (kind === 'shirt') {
      const colMat = top;
      for (const sx of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.05), colMat);
        c.position.set(sx * 0.032, L * 0.58, o.neckR * 0.9); c.rotation.set(0.5, sx * 0.4, sx * -0.5); chest.add(c);
      }
    }
    if (o.scarf) {
      const sm = this.makeMat(o.scarf);
      const sc = new THREE.Mesh(new THREE.TorusGeometry(o.neckR * 1.45, o.neckR * 0.65, 10, 24), sm);
      sc.rotation.x = Math.PI / 2; sc.position.y = L * 0.57; chest.add(sc);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, L * 0.38, 0.025), sm);
      tail.position.set(o.neckR * 0.8, L * 0.38, o.chestR * o.depth * 1.02); tail.rotation.z = 0.1; chest.add(tail);
    }
  }

  // ---------- head & face ----------
  surf(u, v, off = 0) { // face coords (u,v in [-1,1]) -> head-local point
    const zz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
    return this.shape(new THREE.Vector3(u, v, zz).normalize(), off);
  }
  shape(d, off = 0) { // unit direction -> deformed surface point (head local, relative to head center)
    const [rx, ry, rz] = this.o.head;
    let x = d.x, y = d.y, z = d.z;
    const jaw = y < 0 ? 1 - (this.o.kid ? 0.1 : 0.17) * Math.pow(-y, 1.6) : 1;
    const chin = (y < -0.3 && z > 0) ? 1 + 0.06 * z * inv(-0.3, -0.9, y) : 1;
    const cheek = 1 + (this.o.kid ? 0.06 : 0.03) * Math.exp(-((y + 0.25) ** 2) / 0.04) * Math.exp(-((Math.abs(x) - 0.55) ** 2) / 0.06) * Math.max(0, z);
    const back = z < 0 ? 1 + 0.05 * (-z) : 1;
    const k = 1 + off;
    return new THREE.Vector3(x * rx * jaw * cheek * k, y * ry * k, z * rz * chin * back * cheek * k).add(this.headC);
  }
  buildHead(head) {
    const o = this.o, [rx, ry, rz] = o.head, f = o.face;
    this.headC = new THREE.Vector3(0, ry * 0.82, rz * 0.08);
    const g = new THREE.SphereGeometry(1, 64, 48), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i).normalize(); const s = this.shape(_v); p.setXYZ(i, s.x, s.y, s.z); }
    g.computeVertexNormals();
    this.headGeo = g;
    const hm = new THREE.Mesh(g, this.skinMat); head.add(hm);
    // face shell (stubble/blush/wrinkles)
    if (f.stubble || f.blush || f.wrinkles || f.freckles) {
      const tex = T.faceShell({ stubble: f.stubble || 0, blush: f.blush || 0, wrinkles: f.wrinkles || 0, freckles: f.freckles || 0, seed: o.seed });
      const sg = new THREE.SphereGeometry(1, 64, 48), sp = sg.attributes.position;
      for (let i = 0; i < sp.count; i++) { _v.fromBufferAttribute(sp, i).normalize(); const s = this.shape(_v, 0.004); sp.setXYZ(i, s.x, s.y, s.z); }
      sg.computeVertexNormals();
      const sm = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
      head.add(sm);
    }
    // eyes
    const eyeU = f.eyeU ?? 0.34, eyeV = f.eyeV ?? 0.1, eyeR = (f.eyeR ?? (o.kid ? 0.3 : 0.24)) * rx;
    this.lidRest = f.lidRest ?? (o.kid ? 0 : 0.14);
    this.eyeU = eyeU; this.eyeV = eyeV; this.eyeRf = eyeR / rx;
    const irisTex = T.eyeTex(f.iris ?? 0x5a3a22, { irisR: f.irisR ?? (o.kid ? 0.56 : 0.54), pupilR: o.kid ? 0.24 : 0.21, seed: o.seed });
    const eyeMat = new THREE.MeshPhysicalMaterial({ map: irisTex, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 });
    this.eyeMat = eyeMat;
    const lidMat = this.skinMat;
    const lashMat = new THREE.MeshStandardMaterial({ color: f.lash ?? 0x1a120e, roughness: 0.8 });
    this.eyes = {};
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const sp = this.surf(sx * eyeU, eyeV);
      const n = sp.clone().sub(this.headC).normalize();
      const grp = new THREE.Group(); grp.position.copy(sp).addScaledVector(n, -eyeR * (f.sink ?? 0.68)); head.add(grp);
      grp.rotation.y = sx * 0.06;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 32, 24), eyeMat); grp.add(ball);
      const catchL = new THREE.Mesh(new THREE.CircleGeometry(eyeR * 0.12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
      const cd = new THREE.Vector3(-0.32, 0.36, 0.88).normalize(); catchL.position.copy(cd.multiplyScalar(eyeR * 1.012)); catchL.lookAt(catchL.position.clone().multiplyScalar(2)); grp.add(catchL);
      const lidR = eyeR * 1.07;
      const up = new THREE.Group(); grp.add(up);
      up.add(new THREE.Mesh(new THREE.SphereGeometry(lidR, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidMat));
      const lash = new THREE.Mesh(new THREE.TorusGeometry(lidR, eyeR * (f.lashes ? 0.075 : 0.05), 6, 28, Math.PI), lashMat);
      lash.rotation.x = Math.PI / 2; lash.rotation.z = Math.PI; up.add(lash);
      if (f.lashes) { // little flick at the outer corner
        const fl = new THREE.Mesh(new THREE.ConeGeometry(eyeR * 0.08, eyeR * 0.35, 6), lashMat);
        fl.position.set(sx * lidR * 0.95, 0.0, lidR * 0.25); fl.rotation.z = -sx * 1.1; up.add(fl);
      }
      const lo = new THREE.Group(); grp.add(lo);
      lo.add(new THREE.Mesh(new THREE.SphereGeometry(eyeR * 1.05, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lidMat));
      const loLine = new THREE.Mesh(new THREE.TorusGeometry(eyeR * 1.05, eyeR * 0.02, 5, 28, Math.PI), new THREE.MeshStandardMaterial({ color: 0x9a5a48, roughness: 0.8 }));
      loLine.rotation.x = Math.PI / 2; loLine.rotation.z = Math.PI; lo.add(loLine);
      this.eyes[s] = { grp, ball, up, lo, catchL, sx };
    }
    // nose
    const nose = ellipsoid(rx * (f.nose ?? 0.17), rx * (f.nose ?? 0.17) * 0.9, rx * (f.nose ?? 0.17) * 1.05, this.skinMat);
    const np = this.surf(0, f.noseV ?? -0.12); nose.position.copy(np).add(new THREE.Vector3(0, 0, -rx * 0.04)); head.add(nose);
    // ears
    for (const sx of [-1, 1]) {
      const e = ellipsoid(rx * 0.13, ry * 0.25, rx * 0.2, this.skinMat);
      e.position.copy(this.shape(new THREE.Vector3(sx, -0.08, -0.08).normalize(), -0.02)); e.rotation.y = sx * 0.3; head.add(e);
    }
    // dynamic face parts
    this.browMat = new THREE.MeshStandardMaterial({ color: f.brow ?? 0x1a120e, roughness: 0.85 });
    this.lipMat = new THREE.MeshStandardMaterial({ color: f.lip ?? 0x6a2a24, roughness: 0.6 });
    this.mouthMat = new THREE.MeshStandardMaterial({ color: 0x3a1214, roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
    this.teethMat = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 });
    this.tongueMat = new THREE.MeshStandardMaterial({ color: 0xc4566a, roughness: 0.6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 });
    this.dyn = new THREE.Group(); head.add(this.dyn);
    this.tearMat = new THREE.MeshPhysicalMaterial({ color: 0xbfd0e0, roughness: 0.02, transparent: true, opacity: 0.32, clearcoat: 1, specularIntensity: 1, envMapIntensity: 2.5 });
    this.mouthV = f.mouthV ?? -0.44; this.mouthW = f.mouthW ?? (o.kid ? 0.2 : 0.22);
    this.buildHair(head);
    if (f.mustache) this.buildMustache(head, f.mustache);
    if (f.glasses) this.buildGlasses(head);
  }

  buildHair(head) {
    const o = this.o, hs = o.hair, [rx, ry] = o.head;
    if (!hs || hs.style === 'none') return;
    const hairTex = cached('hair' + hs.color, () => {
      const c = T.canvas(512, 256), x = c.getContext('2d');
      x.fillStyle = '#' + new THREE.Color(hs.color).getHexString(); x.fillRect(0, 0, 512, 256);
      const r = rng(5);
      for (let i = 0; i < 900; i++) { const v = r() < 0.5 ? 255 : 0; x.strokeStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.08})`; x.lineWidth = 1 + r(); const xx = r() * 512; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx + (r() - 0.5) * 20, 256); x.stroke(); }
      if (hs.grey) for (let i = 0; i < 500 * hs.grey; i++) { x.strokeStyle = 'rgba(220,220,220,0.35)'; const xx = r() * 512; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx + (r() - 0.5) * 20, 256); x.stroke(); }
      return T.toTex(c);
    });
    const mat = this.hairMat = new THREE.MeshPhysicalMaterial({ map: hairTex, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xc8a888), sheenRoughness: 0.35 });
    const lines = { // hairline y by azimuth: [front, temple, side, back]
      short: [0.5, 0.4, 0.18, -0.5], kid: [0.62, 0.32, -0.05, -0.55], bun: [0.56, 0.36, 0.04, -0.52],
      receding: [0.66, 0.52, 0.12, -0.45], old: [0.58, 0.42, 0.1, -0.5], hat: [0.3, 0.25, 0.15, -0.2],
    };
    const hl = lines[hs.line || hs.style] || lines.short;
    const hairline = d => {
      const az = Math.abs(Math.atan2(d.x, d.z));
      const a = [0, 0.7, 1.45, Math.PI];
      for (let i = 1; i < 4; i++) if (az <= a[i]) return lerp(hl[i - 1], hl[i], (az - a[i - 1]) / (a[i] - a[i - 1]));
      return hl[3];
    };
    const vol = hs.vol ?? 0.07;
    const g = new THREE.SphereGeometry(1, 80, 60), p = g.attributes.position;
    const keep = new Uint8Array(p.count);
    for (let i = 0; i < p.count; i++) {
      _v.fromBufferAttribute(p, i).normalize();
      const d = _v.clone(), h = hairline(d);
      const k = THREE.MathUtils.smoothstep(d.y, h - 0.005, h + 0.11);
      keep[i] = d.y > h - 0.14 ? 1 : 0;
      const top = Math.max(0, d.y) ** 2;
      const s = this.shape(d, (vol + top * (hs.topVol ?? 0.06)) * k - 0.03 * (1 - k));
      p.setXYZ(i, s.x, s.y, s.z);
    }
    const idx = g.index.array, nidx = [];
    for (let i = 0; i < idx.length; i += 3) if (keep[idx[i]] && keep[idx[i + 1]] && keep[idx[i + 2]]) nidx.push(idx[i], idx[i + 1], idx[i + 2]);
    g.setIndex(nidx); g.computeVertexNormals();
    const cap = new THREE.Mesh(g, mat); head.add(cap);
    const r = rng(o.seed + 17);
    // flat sculpted clump lying on the scalp: d = direction on head, flow = direction the strands point (head-local)
    const clump = (d, sc, flow, lift = 0.85) => {
      const n0 = d.clone().normalize();
      const P = this.shape(n0, vol * lift + Math.max(0, n0.y) ** 2 * (hs.topVol ?? 0.06) * lift);
      const N = P.clone().sub(this.headC).normalize();
      const Y = flow.clone().addScaledVector(N, -flow.dot(N)).normalize();
      const X = new THREE.Vector3().crossVectors(Y, N).normalize();
      const e = ellipsoid(sc[0] * rx, sc[1] * rx, sc[2] * rx, mat, 18, 12);
      e.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, N));
      e.position.copy(P).addScaledVector(Y, sc[1] * rx * 0.45);
      head.add(e); return e;
    };
    this._clump = clump;
    if (hs.style === 'short' && o.hat) {
      for (let i = 0; i < 6; i++) { const u = -0.32 + i * 0.13; clump(new THREE.Vector3(u, 0.42, 0.85), [0.14, 0.3, 0.07], new THREE.Vector3(0.5, -0.8, 0.2), 1.6); }
    } else if (hs.style === 'short') {
      const crown = new THREE.Vector3(-0.15, 0.85, -0.5).normalize();
      for (let i = 0; i < 46; i++) {
        const az = (r() - 0.5) * 2.6, el = 0.25 + r() * 1.1;
        const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        if (d.y < hairline(d) + 0.1) continue;
        const flow = d.clone().sub(crown).add(new THREE.Vector3(0.35 + (r() - 0.5) * 0.4, -0.1, 0.25));
        clump(d, [0.17 + r() * 0.08, 0.36 + r() * 0.16, 0.075 + r() * 0.03], flow, 0.8);
      }
      for (let i = 0; i < 7; i++) { // swept fringe
        const u = -0.36 + i * 0.11, d = new THREE.Vector3(u, 0.6 + Math.abs(u + 0.1) * 0.12, 0.78);
        clump(d, [0.16, 0.42, 0.08], new THREE.Vector3(0.75, -0.55, 0.2), 0.9);
      }
    }
    if (hs.style === 'kid') {
      for (let i = 0; i < 11; i++) { // bangs
        const u = -0.46 + i * 0.092, d = new THREE.Vector3(u, 0.7 - Math.abs(u) * 0.28, 0.72);
        clump(d, [0.11 + r() * 0.02, 0.3, 0.07], new THREE.Vector3((r() - 0.5) * 0.15 + u * 0.3, -1, 0.15), 0.95);
      }
      for (let i = 0; i < 16; i++) { const az = (r() - 0.5) * 3.4, el = 0.5 + r() * 0.9; const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); if (d.y < hairline(d) + 0.12 || d.z > 0.55) continue; clump(d, [0.2, 0.42, 0.06], new THREE.Vector3(Math.sign(d.x || 1) * 0.9, -0.6, 0), 0.75); }
      this.pigtails = [];
      for (const sx of [-1, 1]) {
        const anchor = new THREE.Group();
        anchor.position.copy(this.shape(new THREE.Vector3(sx * 0.9, 0.45, -0.15).normalize(), vol));
        head.add(anchor);
        const tie = new THREE.Mesh(new THREE.TorusGeometry(rx * 0.12, rx * 0.05, 8, 16), new THREE.MeshStandardMaterial({ color: hs.tie ?? 0xd8243a, roughness: 0.5 }));
        tie.rotation.y = Math.PI / 2; tie.rotation.z = sx * 0.6; anchor.add(tie);
        const chain = new THREE.Group(); anchor.add(chain); chain.rotation.z = sx * 0.55;
        const rs = [0.2, 0.25, 0.24, 0.2, 0.14];
        let yy = -rx * 0.05;
        for (let k = 0; k < rs.length; k++) {
          const e = ellipsoid(rs[k] * rx, rs[k] * rx * 1.35, rs[k] * rx * 0.95, mat, 16, 12);
          yy -= rs[k] * rx * (k === 0 ? 0.6 : 1.25); e.position.set(sx * rx * 0.08, yy, 0); chain.add(e);
        }
        this.pigtails.push({ anchor, chain, sx });
      }
    }
    if (hs.style === 'bun') {
      const bun = ellipsoid(rx * 0.42, rx * 0.38, rx * 0.4, mat); bun.position.copy(this.shape(new THREE.Vector3(0, 0.62, -0.78).normalize(), vol + 0.22)); head.add(bun);
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(rx * 0.33, rx * 0.09, 8, 20), mat); wrap.position.copy(bun.position); wrap.lookAt(this.headC); head.add(wrap);
      for (const sx of [-1, 1]) {
        const pts = [this.shape(new THREE.Vector3(sx * 0.62, 0.42, 0.66).normalize(), vol), this.shape(new THREE.Vector3(sx * 0.82, 0.05, 0.5).normalize(), vol + 0.03), this.shape(new THREE.Vector3(sx * 0.86, -0.32, 0.42).normalize(), vol + 0.05)];
        const c = new THREE.CatmullRomCurve3(pts).getPoints(12);
        head.add(new THREE.Mesh(taperTube(c, [rx * 0.07, rx * 0.025], 6), mat));
      }
      for (let i = 0; i < 9; i++) { const u = -0.5 + i * 0.125; clump(new THREE.Vector3(u, 0.68 - Math.abs(u) * 0.2, 0.66), [0.2, 0.5, 0.06], new THREE.Vector3(u * 0.6, 0.55, -1), 0.8); }
    }
    if (hs.style === 'receding' || hs.style === 'old') {
      for (let i = 0; i < 18; i++) {
        const az = (r() < 0.5 ? -1 : 1) * (0.9 + r() * 1.6), el = 0.05 + r() * 0.55;
        const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        if (d.y < hairline(d) + 0.06) continue;
        clump(d, [0.18, 0.4, 0.06], new THREE.Vector3(0, -0.4, -1), 0.7);
      }
    }
    if (hs.beard) {
      const bg = new THREE.SphereGeometry(1, 48, 36), bp = bg.attributes.position, kp = new Uint8Array(bp.count);
      for (let i = 0; i < bp.count; i++) {
        _v.fromBufferAttribute(bp, i).normalize(); const d = _v.clone();
        kp[i] = (d.y < -0.18 && d.z > -0.35 && !(d.y > -0.52 && Math.abs(d.x) < 0.3 && d.z > 0.7)) ? 1 : 0;
        const s = this.shape(d, 0.025 + Math.max(0, -d.y - 0.5) * 0.08); bp.setXYZ(i, s.x, s.y, s.z);
      }
      const bi = bg.index.array, ni = []; for (let i = 0; i < bi.length; i += 3) if (kp[bi[i]] && kp[bi[i + 1]] && kp[bi[i + 2]]) ni.push(bi[i], bi[i + 1], bi[i + 2]);
      bg.setIndex(ni); bg.computeVertexNormals(); head.add(new THREE.Mesh(bg, mat));
    }
    if (o.hat) this.buildHat(head, o.hat);
  }
  buildHat(head, h) {
    const [rx] = this.o.head;
    const kt = h.knit ? T.knit(h.color, { cols: 40, rows: 30, w: 256, h: 192, seed: 3 }) : null;
    const m = this.makeMat(kt ? { map: kt.map, bump: kt.bump, bumpScale: 2 } : { color: h.color });
    const g = new THREE.SphereGeometry(1, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.5), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i).normalize(); const d = _v.clone(); d.y = d.y * 1.1 + 0.32; d.normalize(); const s = this.shape(d, 0.13); p.setXYZ(i, s.x, s.y, s.z); }
    g.computeVertexNormals();
    const hat = new THREE.Mesh(g, m); head.add(hat);
    const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.085, 10, 40), this.makeMat({ color: h.band ?? h.color }));
    band.rotation.x = Math.PI / 2; const c = this.shape(new THREE.Vector3(0, 0.3, 0).normalize(), 0);
    band.position.set(0, this.headC.y + this.o.head[1] * 0.3, this.headC.z); band.scale.set(this.o.head[0] * 1.07, this.o.head[2] * 1.12, this.o.head[0] * 0.9); head.add(band); void c;
    if (h.pom) { const pom = ellipsoid(rx * 0.32, rx * 0.3, rx * 0.32, this.makeMat({ color: h.pom })); pom.position.copy(this.headC).add(new THREE.Vector3(0, this.o.head[1] * 1.28, 0)); head.add(pom); }
  }
  buildMustache(head, col) {
    const [rx] = this.o.head; const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const pts = [this.surf(sx * 0.02, -0.27, 0.04), this.surf(sx * 0.16, -0.29, 0.05), this.surf(sx * 0.27, -0.37, 0.03)];
      const c = new THREE.CatmullRomCurve3(pts).getPoints(10);
      head.add(new THREE.Mesh(taperTube(c, c.map((_, i) => rx * (0.075 - 0.05 * (i / 10) ** 1.5)), 8), mat));
    }
  }
  buildGlasses(head) {
    const [rx] = this.o.head; const mat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.4, metalness: 0.3 });
    for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(rx * 0.3, rx * 0.025, 6, 24), mat);
      r.position.copy(this.surf(sx * this.eyeU, this.eyeV, 0.12)); head.add(r);
    }
    const b = new THREE.Mesh(new THREE.CylinderGeometry(rx * 0.02, rx * 0.02, rx * 0.2, 6), mat); b.rotation.z = Math.PI / 2; b.position.copy(this.surf(0, this.eyeV + 0.05, 0.13)); head.add(b);
  }

  // ---------- per-frame control ----------
  reset() {
    for (const k in this.j) { const j = this.j[k]; j.rotation.set(0, 0, 0); j.scale.set(1, 1, 1); }
    this.j.pelvis.position.y = this.hipY; this.j.pelvis.position.x = 0; this.j.pelvis.position.z = 0; this.j.head.visible = true; this.root.visible = true;
    this.j.shL.rotation.z = 0.1; this.j.shR.rotation.z = -0.1;
    this.j.elL.rotation.x = -0.12; this.j.elR.rotation.x = -0.12;
    for (const k of FACE_KEYS) this.face[k] = 0;
    this.gazeTarget = null; this.gaze = { yaw: 0, pitch: 0 };
    this.tear = null; this.curl = { L: 0.35, R: 0.35 }; this.thumbCurl = { L: 0.2, R: 0.2 };
    this.breath = 1; this.breathRate = 0.25; this.extraBlinks.length = 0; this.autoBlink = true;
    this.hairSwing = { x: 0, z: 0 }; this.saccade = 1;
  }
  expr(name, amt = 1) { const e = EXPR[name]; for (const k in e) this.face[k] += e[k] * amt; return this; }
  mixExpr(a, b, t) { this.expr(a, 1 - t); this.expr(b, t); return this; }
  setFace(obj) { Object.assign(this.face, obj); return this; }
  blink(t0) { this.extraBlinks.push(t0); }
  place(x, y, z, ry = 0) { this.root.position.set(x, y, z); this.root.rotation.set(0, ry, 0); return this; }

  blinkValue(t) {
    const list = this.autoBlink ? this.blinks.concat(this.extraBlinks) : this.extraBlinks;
    let v = 0;
    for (const b of list) {
      const d = t - b; if (d < 0 || d > 0.35) continue;
      const c = 2.5 / 24, h = 1 / 24, op = 4.5 / 24;
      const x = d < c ? d / c : d < c + h ? 1 : 1 - (d - c - h) / op;
      v = Math.max(v, clamp(x));
    }
    return v;
  }

  // world-space two-bone IK for arm (side 'L'|'R'); pole = world point the elbow points toward
  armIK(s, target, pole, wristRot = null) {
    this.root.updateMatrixWorld(true);
    const sh = this.j['sh' + s], el = this.j['el' + s];
    this.solve2(sh, el, this.upperLen, this.foreLen, target, pole, false);
    if (wristRot) this.j['wr' + s].rotation.set(...wristRot);
  }
  legIK(s, target, pole) {
    this.root.updateMatrixWorld(true);
    this.solve2(this.j['hip' + s], this.j['kn' + s], this.thighLen, this.shinLen, target, pole, true);
  }
  solve2(a, b, la, lb, Tw, Pw, leg) {
    const parent = a.parent; parent.updateMatrixWorld(true);
    const im = _m.copy(parent.matrixWorld).invert();
    const S = a.position.clone(), Tt = Tw.clone().applyMatrix4(im), P = Pw.clone().applyMatrix4(im);
    const D = Tt.clone().sub(S); let d = D.length();
    d = clamp(d, Math.abs(la - lb) + 1e-3, la + lb - 1e-4);
    const dir = D.normalize();
    const alpha = Math.acos(clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1));
    const w = P.clone().sub(S); w.addScaledVector(dir, -w.dot(dir));
    if (w.lengthSq() < 1e-8) w.set(0, 0, leg ? 1 : -1);
    w.normalize();
    const u = dir.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(w, Math.sin(alpha));
    const E = S.clone().addScaledVector(u, la);
    const Tc = S.clone().addScaledVector(dir, d);
    const f = Tc.clone().sub(E).normalize();
    const Y = u.clone().negate();
    let Z = f.clone().addScaledVector(u, -f.dot(u));
    if (Z.lengthSq() < 1e-8) Z = w.clone().negate();
    Z.normalize(); if (leg) Z.negate();
    const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
    Z.crossVectors(X, Y).normalize();
    a.quaternion.setFromRotationMatrix(_m.makeBasis(X, Y, Z));
    const beta = Math.acos(clamp(u.dot(f), -1, 1));
    b.rotation.set(leg ? beta : -beta, 0, 0);
  }

  // head/eyes look at a world point. head: 0..1 share of the turn taken by neck+head
  look(target, head = 0.7, eyes = 1) {
    this.root.updateMatrixWorld(true);
    const nk = this.j.neck, hd = this.j.head;
    const pivot = new THREE.Vector3(0, this.o.head[1] * 0.8, 0).applyMatrix4(hd.matrixWorld);
    const ch = this.j.chest; ch.updateMatrixWorld(true);
    const local = target.clone().sub(pivot).applyQuaternion(ch.getWorldQuaternion(_q).invert());
    const yaw = Math.atan2(local.x, local.z), pitch = -Math.atan2(local.y, Math.hypot(local.x, local.z));
    const y = clamp(yaw, -1.3, 1.3) * head, p = clamp(pitch, -0.7, 0.8) * head;
    nk.rotation.y += y * 0.4; nk.rotation.x += p * 0.35; hd.rotation.y += y * 0.6; hd.rotation.x += p * 0.65;
    if (eyes) this.gazeTarget = { p: target.clone(), amt: eyes };
  }

  // Tear: side, progress 0..1 (0-0.35 well up, 0.35-1 roll down)
  setTear(side, prog, welled = 0) { this.tear = { side, prog, welled }; }

  update(t) {
    const f = this.face, o = this.o;
    // breathing
    const br = Math.sin(t * Math.PI * 2 * this.breathRate) * this.breath;
    this.j.chest.scale.set(1 + br * 0.008, 1 + br * 0.006, 1 + br * 0.014);
    this.j.shL.position.y = this.torsoL * 0.47 + br * 0.003; this.j.shR.position.y = this.torsoL * 0.47 + br * 0.003;
    // fingers
    for (const s of ['L', 'R']) {
      const fs = this.fingers?.[s]; if (!fs || !fs.length) continue;
      const sg = s === 'L' ? -1 : 1, c = this.curl[s];
      fs.forEach(([b, m], i) => { b.rotation.z = sg * c * (1.05 + i * 0.08); m.rotation.z = sg * c * 1.2; });
      const th = this.thumbs[s]; th[1].rotation.x = -this.thumbCurl[s] * 1.2;
    }
    // pigtails swing
    if (this.pigtails) for (const pt of this.pigtails) {
      pt.chain.rotation.z = pt.sx * 0.55 + this.hairSwing.z + Math.sin(t * 1.3 + pt.sx) * 0.03;
      pt.chain.rotation.x = this.hairSwing.x;
    }
    this.root.updateMatrixWorld(true);
    // gaze
    let gy = this.gaze.yaw, gp = this.gaze.pitch;
    if (this.gazeTarget) {
      const hd = this.j.head; hd.updateMatrixWorld(true);
      const e = this.eyes.L.grp.position.clone().add(this.eyes.R.grp.position).multiplyScalar(0.5);
      const lt = this.gazeTarget.p.clone().applyMatrix4(_m.copy(hd.matrixWorld).invert()).sub(e);
      gy += Math.atan2(lt.x, lt.z) * this.gazeTarget.amt; gp += -Math.atan2(lt.y, Math.hypot(lt.x, lt.z)) * this.gazeTarget.amt;
    }
    // micro saccades
    const si = Math.floor(t * 1.4 + this.o.seed * 0.37);
    const sF = (t * 1.4 + this.o.seed * 0.37) - si;
    const sw = clamp(sF / 0.06);
    const sx0 = noise1(si * 3.1, this.o.seed) * 0.035, sx1 = noise1((si + 1) * 3.1, this.o.seed) * 0.035;
    const sy0 = noise1(si * 5.7, this.o.seed + 9) * 0.022, sy1 = noise1((si + 1) * 5.7, this.o.seed + 9) * 0.022;
    gy += lerp(sx0, sx1, sw) * this.saccade; gp += lerp(sy0, sy1, sw) * this.saccade;
    gy = clamp(gy, -0.65, 0.65); gp = clamp(gp, -0.5, 0.55);
    const blink = this.blinkValue(t);
    const closed = clamp(Math.max(f.closed, blink));
    for (const s of ['L', 'R']) {
      const E = this.eyes[s], sx = E.sx;
      E.ball.rotation.set(gp, gy - sx * 0.06, 0);
      const brIn = s === 'L' ? f.browInL : f.browInR;
      const asym = s === 'L' ? f.asym : -f.asym;
      let lo = 0.58 - f.lidLo * 0.32 - f.cheek * 0.3 + Math.max(0, gp) * 0.15 - f.wide * 0.12;
      let up = -0.66 - f.wide * 0.32 + (f.lidUp + this.lidRest * (1 - f.wide)) * 0.62 + f.cheek * 0.1 + gp * 0.55 - f.browDown * 0.1 + asym * 0.08 + brIn * 0.06;
      up = Math.min(up, lo - 0.05);
      up = lerp(up, lo + 0.1, closed);
      E.up.rotation.set(up, 0, sx * (-f.lidTilt * 0.22 + f.browDown * 0.08));
      E.lo.rotation.set(lo, 0, sx * f.lidTilt * 0.08);
      E.catchL.visible = closed < 0.85;
    }
    this.buildDynamicFace();
    this.buildTear();
  }

  buildDynamicFace() {
    const f = this.face, key = FACE_KEYS.map(k => (f[k] || 0).toFixed(3)).join(',');
    if (key === this._faceKey) return; this._faceKey = key;
    for (const c of [...this.dyn.children]) { if (c.name === 'tear') continue; c.geometry.dispose(); this.dyn.remove(c); }
    const [rx] = this.o.head, er = this.eyeRf, eu = this.eyeU, ev = this.eyeV;
    // brows
    const bt = (this.o.face.browW ?? 0.042) * rx;
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const bin = s === 'L' ? f.browInL : f.browInR, bout = s === 'L' ? f.browOutL : f.browOutR;
      const bv = ev + er * 1.42 + (s === 'L' ? f.asym : -f.asym) * 0.02;
      const pin = [sx * (eu - er * 0.95), bv + bin * 0.1 - f.browDown * 0.07 - 0.015];
      const pmid = [sx * (eu + er * 0.1), bv + 0.035 + (bin * 0.5 + bout * 0.5) * 0.06 - f.browDown * 0.035];
      const pout = [sx * (eu + er * 1.15), bv - 0.02 + bout * 0.08 - f.browDown * 0.01];
      const curve = new THREE.CatmullRomCurve3([pin, pmid, pout].map(([u, v]) => this.surf(u, v, 0.03)));
      const pts = curve.getPoints(14);
      const g = taperTube(pts, pts.map((_, i) => bt * (1.15 - 0.55 * (i / 14) ** 1.3)), 6);
      this.dyn.add(new THREE.Mesh(g, this.browMat));
    }
    // mouth
    const sm = clamp(f.smile, -1, 1), op = clamp(f.mouthOpen, 0, 1), oo = clamp(f.ooh, 0, 1);
    const w = this.mouthW * (1 + Math.max(0, sm) * 0.22 - oo * 0.4 + f.press * 0.05);
    const mv = this.mouthV, cy = mv + sm * 0.065 + (sm < 0 ? sm * 0.01 : 0);
    const uMid = mv - Math.max(0, sm) * 0.012 + Math.min(0, sm) * -0.008 + op * 0.012;
    const lMid = uMid - op * (0.2 + oo * 0.05) - Math.max(0, sm) * op * 0.06;
    const N = 18;
    const bez = (a, mid, b, tt) => { const c = 2 * mid - 0.5 * (a + b); return (1 - tt) ** 2 * a + 2 * (1 - tt) * tt * c + tt * tt * b; };
    const upper = [], lower = [];
    for (let i = 0; i <= N; i++) {
      const tt = i / N, u = lerp(-w, w, tt);
      const roundK = oo * Math.sin(Math.PI * tt) * 0.03;
      upper.push([u * (1 - oo * 0.15 * Math.sin(Math.PI * tt)), bez(cy, uMid + roundK, cy, tt)]);
      lower.push([u * (1 - oo * 0.15 * Math.sin(Math.PI * tt)), bez(cy, lMid - roundK, cy, tt)]);
    }
    const lineR = rx * (0.017 - f.press * 0.004);
    const up3 = upper.map(([u, v]) => this.surf(u, v, 0.012));
    this.dyn.add(new THREE.Mesh(taperTube(up3, up3.map((_, i) => lineR * (0.55 + 0.45 * Math.sin(Math.PI * i / N))), 5), this.lipMat));
    if (op > 0.015) {
      const lo3 = lower.map(([u, v]) => this.surf(u, v, 0.012));
      this.dyn.add(new THREE.Mesh(taperTube(lo3, lo3.map((_, i) => lineR * (0.5 + 0.6 * Math.sin(Math.PI * i / N))), 5), this.lipMat));
      const strip = (A, B, off, mat) => {
        const pos = [];
        for (let i = 0; i <= N; i++) { const a = this.surf(A[i][0], A[i][1], off), b = this.surf(B[i][0], B[i][1], off); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
        const idx = []; for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        this.dyn.add(new THREE.Mesh(g, mat));
      };
      strip(upper, lower, 0.008, this.mouthMat);
      const teethH = Math.min(0.045, (uMid - lMid) * 0.35);
      const teeth = upper.map(([u, v], i) => [u * 0.9, v - teethH * Math.sin(Math.PI * i / N) ** 0.4]);
      strip(upper.map(([u, v]) => [u * 0.9, v - 0.004]), teeth, 0.009, this.teethMat);
      const tH = (uMid - lMid) * 0.3;
      const tongue = lower.map(([u, v], i) => [u * 0.7, v + tH * Math.sin(Math.PI * i / N)]);
      strip(lower.map(([u, v]) => [u * 0.7, v + 0.004]), tongue, 0.009, this.tongueMat);
    } else {
      // lower lip hint
      const ll = [];
      for (let i = 0; i <= 10; i++) { const tt = i / 10; ll.push(this.surf(lerp(-w * 0.45, w * 0.45, tt), cy - 0.06 + Math.sin(Math.PI * tt) * -0.01 + sm * 0.02 - 0.015 * (1 - Math.abs(sm)), 0.006)); }
      const lm = new THREE.Mesh(taperTube(ll, ll.map((_, i) => rx * 0.008 * Math.sin(Math.PI * i / 10)), 5), new THREE.MeshStandardMaterial({ color: new THREE.Color(this.o.skin).multiplyScalar(0.8), roughness: 0.6 }));
      this.dyn.add(lm);
    }
  }

  buildTear() {
    const old = this.dyn.getObjectByName('tear'); if (old) { old.traverse(c => c.geometry && c.geometry.dispose()); this.dyn.remove(old); }
    if (!this.tear) return;
    const { side, prog, welled } = this.tear, sx = side === 'L' ? 1 : -1, [rx] = this.o.head;
    const g = new THREE.Group(); g.name = 'tear'; this.dyn.add(g);
    const eu = this.eyeU, ev = this.eyeV, er = this.eyeRf;
    const well = clamp(Math.max(welled, prog / 0.35));
    if (well > 0.01) { // glossy rim along lower lid
      const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.08 + 0.84 * i / 12); pts.push(this.surf(sx * eu + Math.cos(a) * er * 1.0, ev + Math.sin(a) * er * 0.92, 0.03)); }
      g.add(new THREE.Mesh(taperTube(pts, pts.map((_, i) => rx * 0.007 * well * Math.sin(Math.PI * i / 12) ** 0.5), 6), this.tearMat));
    }
    if (prog > 0.35) {
      const k = (prog - 0.35) / 0.65, e = k * k * (1.4 - 0.4 * k);
      const path = new THREE.CatmullRomCurve3([[sx * (eu - er * 0.25), ev - er * 1.0], [sx * (eu - er * 0.35), ev - er * 1.9], [sx * (eu - er * 0.15), ev - er * 3.2], [sx * (eu + er * 0.05), ev - er * 4.6]].map(([u, v]) => this.surf(u, v, 0.02)));
      const p = path.getPoint(clamp(e, 0, 1));
      const drop = new THREE.Mesh(new THREE.SphereGeometry(rx * 0.035, 14, 10), this.tearMat);
      drop.scale.set(1, 1.45, 0.8); drop.position.copy(p); g.add(drop);
      const trail = path.getPoints(24).slice(0, Math.max(2, Math.floor(e * 24)));
      if (trail.length > 2) g.add(new THREE.Mesh(taperTube(trail, trail.map((_, i) => rx * 0.006 * (0.5 + 0.5 * i / trail.length)), 5), this.tearMat));
    }
  }

  // ---------- convenience poses ----------
  sit(seatY, footZ = 0.38, opts = {}) {
    // seat height (world y offset from root) — pelvis lowered, legs IK to floor
    const p = this.j.pelvis; p.position.y = seatY + 0.06; p.position.z = opts.back ?? -0.02;
    this.j.spine.rotation.x = opts.lean ?? 0.06;
    const w = this.root.matrixWorld;
    this.root.updateMatrixWorld(true);
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1, spread = opts.spread ?? 0.11;
      const foot = new THREE.Vector3(sx * spread, this.ankleH, footZ + (s === 'L' ? opts.stagger || 0 : 0)).applyMatrix4(w);
      const pole = new THREE.Vector3(sx * spread * 1.4, seatY, footZ + 0.6).applyMatrix4(w);
      this.legIK(s, foot, pole);
    }
  }
  stand(opts = {}) {
    const w = this.root.matrixWorld; this.root.updateMatrixWorld(true);
    const dip = opts.dip || 0; this.j.pelvis.position.y = this.hipY - dip;
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const fz = (s === 'L' ? opts.footL : opts.footR) || [0, 0];
      const foot = new THREE.Vector3(sx * (opts.spread ?? 0.1) + fz[0], this.ankleH, fz[1]).applyMatrix4(w);
      const pole = new THREE.Vector3(sx * 0.15, this.hipY * 0.5, 1).applyMatrix4(w);
      this.legIK(s, foot, pole);
    }
  }
  // procedural run/walk cycle (FK). phase in cycles, k=intensity (1 run, 0.4 walk)
  cycle(phase, k = 1) {
    const a = phase * Math.PI * 2;
    const run = k > 0.6;
    const hipAmp = run ? 0.75 : 0.42, kneeBase = run ? 0.35 : 0.1, kneeAmp = run ? 1.2 : 0.55;
    for (const [s, off] of [['L', 0], ['R', Math.PI]]) {
      const ph = a + off;
      this.j['hip' + s].rotation.x = -Math.sin(ph) * hipAmp;
      this.j['kn' + s].rotation.x = kneeBase + Math.max(0, Math.sin(ph + 1.9)) * kneeAmp + Math.max(0, -Math.cos(ph)) * 0.2;
      this.j['an' + s].rotation.x = Math.sin(ph + 0.6) * 0.25;
      const arm = this.j['sh' + s];
      arm.rotation.x = Math.sin(ph) * (run ? 0.7 : 0.35);
      arm.rotation.z = (s === 'L' ? 1 : -1) * (run ? 0.18 : 0.08);
      this.j['el' + s].rotation.x = run ? -1.45 - Math.sin(ph) * 0.25 : -0.3 - Math.max(0, Math.sin(ph)) * 0.3;
    }
    this.j.pelvis.position.y = this.hipY * (run ? 0.95 : 0.99) + Math.abs(Math.sin(a)) * (run ? 0.045 : 0.018);
    this.j.pelvis.rotation.y = Math.sin(a) * (run ? 0.12 : 0.08);
    this.j.spine.rotation.x = run ? 0.22 : 0.04;
    this.j.spine.rotation.y = -Math.sin(a) * (run ? 0.2 : 0.1);
    this.j.head.rotation.y = Math.sin(a) * (run ? 0.1 : 0.05);
    this.curl.L = this.curl.R = run ? 0.9 : 0.4;
  }
}
