// St Giles, London, 1814, as one cartoon set: the Meux brewery yard (brick buildings, three great porter vats built
// stave by stave with iron hoops), its 7.6 m back wall (the breach section is loose bricks that fall), the slum
// street with cellar windows, a wave of beer posed every frame, and two small open-top rooms far away for the
// explanation (a dining room) and the inquest (a courtroom). Two-tone materials (lam) throughout, so ink + light agree.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, quad, Kit, Ray, prop, setSight } from "./build";
import { ctex, rep, stoneHD, cobbleHD, facadeHD, grassHD, brick, planksHD, rng } from "./paint";
import { VAT, BARREL, WALL_Z, WALL_H, STREET_Z0, STREET_Z1, BREACH, COURT, DINING, SetState, waveFront, waveCrest, clamp01, smooth, easeOut, V3 } from "./story";

const rad = (d: number) => (d * Math.PI) / 180;
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- painted textures ----------------
const staveTex = () => ctex("staveHD", 256, 1024, (g, r) => {
  g.fillStyle = "#9a6438"; g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(70,40,20,${0.15 + 0.2 * r()})`; g.lineWidth = 2 + 3 * r(); const x = r() * 256; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, 300, x - 10, 700, x + 6, 1024); g.stroke(); }
  g.fillStyle = "rgba(255,220,170,0.12)"; g.fillRect(30, 0, 40, 1024);
  g.fillStyle = "rgba(40,20,10,0.55)"; g.fillRect(0, 0, 8, 1024); g.fillRect(248, 0, 8, 1024); // dark seams between staves
});
const panelTex = (key: string, base: string, top: string) => ctex(key, 1024, 512, (g, r) => {
  g.fillStyle = top; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,90,60,${0.05 * r()})`; g.fillRect(r() * 1024, r() * 512, 3, 3); }
  g.fillStyle = base; g.fillRect(0, 300, 1024, 212);                                  // wainscot
  for (let x = 0; x < 1024; x += 128) { g.strokeStyle = "rgba(40,25,15,0.6)"; g.lineWidth = 6; g.strokeRect(x + 14, 320, 100, 170); }
  g.fillStyle = "#4a3020"; g.fillRect(0, 290, 1024, 14);
});
const windowTex = () => ctex("roomWindow", 256, 384, (g) => {
  g.fillStyle = "#cfe3f2"; g.fillRect(0, 0, 256, 384);
  g.strokeStyle = "#4a3020"; g.lineWidth = 14; g.strokeRect(7, 7, 242, 370);
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 384); g.moveTo(0, 130); g.lineTo(256, 130); g.moveTo(0, 255); g.lineTo(256, 255); g.stroke();
});
const clothTex = () => ctex("tablecloth", 512, 256, (g) => {
  g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "rgba(190,60,60,0.55)"; g.lineWidth = 6;
  for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let y = 0; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
const gquad = (x0: number, x1: number, z0: number, z1: number, u: number, v: number, y = 0) => quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), u, v);
const hoopGeo = (r: number, tube = 0.075) => new THREE.TorusGeometry(r, tube, 8, 64).rotateX(Math.PI / 2);
/** beer: a plain lit material with a warm glow, so it stays brown in the violet golden-hour shade (two-tone made it lavender) */
const beerMat = (col: string, glow: string, side: THREE.Side = THREE.FrontSide) => new THREE.MeshLambertMaterial({ color: col, emissive: glow, side });

/** a whole vat as static geometry (the two neighbours) */
const staticVat = (b: Batch, x: number, z: number, r: number, h: number) => {
  const wood = lam("staveHD", () => ({ map: rep(staveTex(), 18, 1) }));
  b.add(new THREE.CylinderGeometry(r, r * 1.04, h, 40, 1, false).translate(x, h / 2, z), wood);
  for (const y of [0.6, 0.27 * h, 0.5 * h, 0.73 * h, h - 0.45]) b.add(hoopGeo(r * 1.03 + 0.02, 0.075 * Math.min(1, r / 2.2)), lam("iron", () => ({ color: "#3d414c" })), new THREE.Matrix4().makeTranslation(x, y, z));
};

export const buildLondon = (root: THREE.Object3D, kit: Kit, rays: Ray[]) => {
  const b = new Batch(), r = rng(1814);
  setSight(rays);
  const cob = lam("cobbleHD", () => ({ map: cobbleHD() }));
  b.add(gquad(-140, 140, -70, 70, 70, 35), cob);
  b.add(gquad(-700, 700, -700, 700, 230, 230, -0.03), lam("grassHD", () => ({ map: grassHD() })));
  // brewery: main house north of the yard, storehouses east and west, a tall chimney
  const brickM = lam("brickWall", () => ({ map: rep(brick(), 1, 1) }));
  const front = lam("brewFront", () => ({ map: facadeHD("brewFront", 44, 16, { wall: "#a8553c", shutter: "#3b3f52", brick: true }) }));
  b.add(boxGeo(V(-22, 0, -28), V(22, 16, -12), 3), brickM);
  b.add(quad(V(-22, 0, -11.98), V(22, 0, -11.98), V(22, 16, -11.98), V(-22, 16, -11.98)), front);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -27 : 16, x1 = s < 0 ? -16 : 27;
    b.add(boxGeo(V(x0, 0, -12), V(x1, 10, 8.4), 3), brickM);
    const fx = s < 0 ? -15.98 : 15.98, side = lam("storeSide", () => ({ map: facadeHD("storeSide", 20.4, 10, { wall: "#b9654a", shutter: "#3b3f52", brick: true }) }));
    b.add(s < 0 ? quad(V(fx, 0, 8.4), V(fx, 0, -12), V(fx, 10, -12), V(fx, 10, 8.4)) : quad(V(fx, 0, -12), V(fx, 0, 8.4), V(fx, 10, 8.4), V(fx, 10, -12)), side);
  }
  b.add(new THREE.CylinderGeometry(1.1, 1.6, 32, 16, 1, true).translate(14, 16, -20), lam("chimney", () => ({ map: rep(brick(), 2, 8) })));
  // the two neighbouring vats (the great one is dynamic)
  staticVat(b, -9.6, -4.2, 3.0, 6.0); staticVat(b, 9.6, -4.4, 3.0, 6.0);
  staticVat(b, BARREL[0], BARREL[2], 0.55, 1.3); // a man-sized barrel for the pressure diagram
  // the back wall either side of the breach
  for (const [x0, x1] of [[-16, BREACH.x0], [BREACH.x1, 16]]) b.add(boxGeo(V(x0, 0, WALL_Z), V(x1, WALL_H, WALL_Z + 0.6), 3), brickM);
  b.add(boxGeo(V(BREACH.x0, WALL_H - 0.01, WALL_Z), V(BREACH.x1, WALL_H, WALL_Z + 0.6)), brickM);
  b.build(root);
  // the slum: tall shabby houses facing the street, cellar windows at the pavement
  const tb = new Batch(), H = [8.4, 9.8, 11.2, 9.8];
  for (let x = -96; x < 96; ) {
    const w = r() < 0.5 ? 6 : 7;
    house(tb, x + w / 2, STREET_Z1 + 4.3, Math.PI, w, 8, H[Math.floor(r() * 4)], [0, 2, 5, 6][Math.floor(r() * 4)]);
    x += w + 0.25;
  }
  for (const s of [-1, 1]) for (let x = 28; x < 96; ) {
    const w = r() < 0.5 ? 6 : 7;
    house(tb, s * (x + w / 2), 5.0, 0, w, 8, H[Math.floor(r() * 4)], [1, 2, 4, 6][Math.floor(r() * 4)]);
    x += w + 0.25;
  }
  const cellar = lam("cellarDark", () => ({ color: "#2a2233" })), sill = lam("cellarSill", () => ({ color: "#9a8778" }));
  for (let x = -94; x < 94; x += 3.3) {
    const z = STREET_Z1 + 0.27;
    tb.add(quad(V(x + 0.7, 0.02, z), V(x - 0.7, 0.02, z), V(x - 0.7, 0.62, z), V(x + 0.7, 0.62, z)), cellar);
    tb.add(boxGeo(V(x - 0.8, 0.62, z - 0.12), V(x + 0.8, 0.72, z + 0.02)), sill);
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 170 + r() * 220;
    prop(tb, kit, r() < 0.5 ? "tree_fat" : "tree_oak", Math.cos(a) * d, 0, Math.sin(a) * d * 0.7, 9 + r() * 5, r() * 6);
  }
  tb.build(root);
  setSight([]);

  // ---- the courtroom (open top) ----
  const rb = new Batch(), [cx, , cz] = COURT;
  const planks = lam("planksHD", () => ({ map: planksHD() }));
  rb.add(gquad(cx - 9, cx + 9, cz - 7, cz + 7, 4, 3, 0.02), planks);
  const wall = lam("courtWall", () => ({ map: panelTex("courtWall", "#5a3a26", "#d9c9a8"), side: THREE.DoubleSide }));
  rb.add(quad(V(cx + 9, 0, cz + 7), V(cx - 9, 0, cz + 7), V(cx - 9, 6, cz + 7), V(cx + 9, 6, cz + 7), 3, 1), wall);
  rb.add(quad(V(cx - 9, 0, cz - 7), V(cx - 9, 0, cz + 7), V(cx - 9, 6, cz + 7), V(cx - 9, 6, cz - 7), 2.3, 1), wall);
  rb.add(quad(V(cx + 9, 0, cz + 7), V(cx + 9, 0, cz - 7), V(cx + 9, 6, cz - 7), V(cx + 9, 6, cz + 7), 2.3, 1), wall);
  const win = lam("roomWindow", () => ({ map: windowTex(), side: THREE.DoubleSide }));
  for (const z of [cz - 3, cz + 2]) rb.add(quad(V(cx - 8.97, 2.2, z - 1), V(cx - 8.97, 2.2, z + 1), V(cx - 8.97, 5.2, z + 1), V(cx - 8.97, 5.2, z - 1)), win);
  const dark = lam("benchWood", () => ({ color: "#5a3a26" })), red = lam("benchRed", () => ({ color: "#9a2f35" }));
  rb.add(boxGeo(V(cx - 3.2, 0, cz + 4.6), V(cx + 3.2, 1.55, cz + 5.4), 0, false), dark);          // the judge's bench
  rb.add(boxGeo(V(cx - 3.0, 0, cz + 5.4), V(cx + 3.0, 0.9, cz + 6.9)), dark);                   // the dais behind it
  rb.add(boxGeo(V(cx - 1.2, 3.0, cz + 6.9), V(cx + 1.2, 5.2, cz + 6.98)), red);                 // a red cloth of state
  rb.add(boxGeo(V(cx + 5, 0, cz - 2), V(cx + 8.6, 1.0, cz + 4)), dark);                         // jury box
  for (const z of [cz - 4.6, cz - 6.2]) rb.add(boxGeo(V(cx - 6, 0, z), V(cx + 4, 0.5, z + 0.5)), dark);
  rb.build(root);
  // ---- the dining room (open top) ----
  const db = new Batch(), [dx, , dz] = DINING;
  db.add(gquad(dx - 5, dx + 5, dz - 5, dz + 4, 2, 2, 0.02), planks);
  const dw = lam("dineWall", () => ({ map: panelTex("dineWall", "#6b4a33", "#e2b77a"), side: THREE.DoubleSide }));
  db.add(quad(V(dx + 5, 0, dz + 4), V(dx - 5, 0, dz + 4), V(dx - 5, 4.5, dz + 4), V(dx + 5, 4.5, dz + 4), 2, 1), dw);
  db.add(quad(V(dx - 5, 0, dz - 5), V(dx - 5, 0, dz + 4), V(dx - 5, 4.5, dz + 4), V(dx - 5, 4.5, dz - 5), 2, 1), dw);
  db.add(quad(V(dx + 5, 0, dz + 4), V(dx + 5, 0, dz - 5), V(dx + 5, 4.5, dz - 5), V(dx + 5, 4.5, dz + 4), 2, 1), dw);
  db.add(quad(V(dx - 1.1, 1.4, dz + 3.97), V(dx + 1.1, 1.4, dz + 3.97), V(dx + 1.1, 3.9, dz + 3.97), V(dx - 1.1, 3.9, dz + 3.97)), win);
  db.add(boxGeo(V(dx - 1.7, 0, dz + 0.2), V(dx + 1.7, 0.82, dz + 1.05)), lam("tablecloth", () => ({ map: clothTex() })));
  const plate = lam("plate", () => ({ color: "#f7f4ee" })), roast = lam("roast", () => ({ color: "#b8642c" }));
  for (const x of [-1.0, 1.0]) db.add(new THREE.CylinderGeometry(0.24, 0.2, 0.04, 20).translate(dx + x, 0.84, dz + 0.55), plate);
  db.add(new THREE.CylinderGeometry(0.32, 0.27, 0.05, 24).translate(dx + 1.05, 0.845, dz + 0.55), plate);
  db.add(new THREE.SphereGeometry(0.22, 18, 12).scale(1.3, 0.75, 1).translate(dx + 1.05, 0.98, dz + 0.55), roast);
  db.add(new THREE.CylinderGeometry(0.07, 0.09, 0.42, 12).translate(dx + 0.65, 1.03, dz + 0.45), lam("bottle", () => ({ color: "#2f6a43" })));
  db.add(new THREE.CylinderGeometry(0.1, 0.09, 0.2, 14).translate(dx - 0.6, 0.92, dz + 0.4), lam("mug", () => ({ color: "#c9965f" })));
  db.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
};

// ---------------- the dynamic brewery: great vat, wall breach, beer ----------------
export class Brewery {
  private staves: THREE.Mesh[] = [];
  private hoops: THREE.Mesh[] = [];
  private top: THREE.Mesh;
  private yard: THREE.Mesh;
  private chunks: { m: THREE.Mesh; x: number; y: number; c: number; r: number }[] = [];
  private wave: THREE.Mesh; private wpos: Float32Array; private wcol: Float32Array;
  private NX = 241; private NZ = 9;

  constructor(root: THREE.Object3D) {
    const { r, h } = VAT, n = 30, wood = lam("staveHD", () => ({ map: rep(staveTex(), 18, 1) }));
    const sw = ((2 * Math.PI * r) / n) * 1.02;
    const sg = new THREE.BoxGeometry(sw, h, 0.26).translate(0, h / 2, 0);
    const uv = sg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) / 18);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, m = new THREE.Mesh(sg, wood);
      m.userData = { a };
      this.staves.push(m); root.add(m);
    }
    const iron = lam("iron", () => ({ color: "#3d414c" }));
    for (const y of [0.6, 1.9, 3.35, 4.8, 6.25]) { const m = new THREE.Mesh(hoopGeo(r + 0.16), iron); m.position.y = y; m.userData = { y }; this.hoops.push(m); root.add(m); }
    const beer = beerMat("#7a4216", "#3a1a06");
    this.top = new THREE.Mesh(new THREE.CircleGeometry(r - 0.1, 40).rotateX(-Math.PI / 2), beer); this.top.position.y = h - 0.35; root.add(this.top);
    const foam = lam("foamRing", () => ({ color: "#efe2c4" }));
    const fr = new THREE.Mesh(new THREE.RingGeometry(r - 0.9, r - 0.1, 40).rotateX(-Math.PI / 2), foam); fr.position.y = 0.01; this.top.add(fr);
    // beer flooding the yard
    this.yard = new THREE.Mesh(new THREE.PlaneGeometry(32, 21, 1, 1).rotateX(-Math.PI / 2).translate(0, 0, -1.5), beerMat("#a8642a", "#6a340e"));
    root.add(this.yard);
    // the breach: loose brick chunks
    const brickM = lam("brickWall", () => ({ map: rep(brick(), 1, 1) }));
    const cols = 5, rows = 4, cw = (BREACH.x1 - BREACH.x0) / cols, ch = (WALL_H - 0.01) / rows;
    for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
      const g = new THREE.BoxGeometry(cw - 0.02, ch - 0.02, 0.6).translate(0, ch / 2, 0.3); // pivot at the bottom-front edge's middle
      const m = new THREE.Mesh(g, brickM);
      const x = BREACH.x0 + (c + 0.5) * cw, y = rr * ch;
      this.chunks.push({ m, x, y, c, r: rr }); root.add(m);
    }
    // the wave in the street: a height field along the street, beer brown with foam on the crest
    const NX = this.NX, NZ = this.NZ, geo = new THREE.BufferGeometry();
    this.wpos = new Float32Array(NX * NZ * 3); this.wcol = new Float32Array(NX * NZ * 3);
    const idx: number[] = [];
    for (let i = 0; i < NX - 1; i++) for (let j = 0; j < NZ - 1; j++) { const a = i * NZ + j, b = a + NZ; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    geo.setAttribute("position", new THREE.BufferAttribute(this.wpos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(this.wcol, 3));
    geo.setIndex(idx);
    this.wave = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: "#ffffff", vertexColors: true, emissive: "#5a2c0c", side: THREE.DoubleSide }));
    this.wave.frustumCulled = false;
    root.add(this.wave);
    for (const m of [...this.staves, ...this.hoops, this.top, this.yard, this.wave, ...this.chunks.map((c) => c.m)]) { m.castShadow = true; m.receiveShadow = true; }
    this.wave.castShadow = false;
  }

  pose(st: SetState, t: number) {
    const { r } = VAT;
    // ---- staves: upright, or flung outward after the burst (south ones, toward the wall, go furthest)
    for (const [i, m] of this.staves.entries()) {
      const a = m.userData.a as number, out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const s = st.intact ? -1 : st.burst;
      const k = s < 0 ? 0 : easeOut(s / (0.55 + 0.25 * hh(i))), south = 0.5 + 0.5 * Math.max(0, Math.sin(a));
      const tilt = k * rad(70 + 20 * hh(i, 2)), push = k * (1.2 + 3.5 * south * hh(i, 3));
      m.position.set(out.x * (r + push), 0, out.z * (r + push));
      m.rotation.set(0, 0, 0); m.rotation.order = "YXZ";
      m.rotation.y = -a + Math.PI / 2; m.rotation.x = tilt; // outward: the stave's +z faces away from the centre
    }
    // ---- hoops: the bottom one slips off before the burst; all drop after it
    this.hoops.forEach((m, i) => {
      const y0 = m.userData.y as number;
      let y = y0, tx = 0;
      if (!st.intact) {
        if (i === 0) { y = y0 - (y0 - 0.08) * st.hoop; tx = rad(9) * st.hoop; }
        if (st.burst >= 0) { const k = smooth(st.burst / (0.45 + 0.1 * i)); y = y + (0.08 + 0.15 * i - y) * k; tx = rad(5 + 7 * i) * k; }
      }
      m.position.set(st.burst >= 0 && !st.intact ? 0.6 * i * Math.min(1, st.burst) : 0, y, st.burst >= 0 && !st.intact ? 1.2 * Math.min(1, st.burst) : 0);
      m.rotation.set(tx, 0, i % 2 ? tx * 0.5 : -tx * 0.5);
    });
    this.top.visible = st.intact || st.burst < 0;
    // ---- beer in the yard
    this.yard.visible = st.yard > 0.02; this.yard.position.y = st.yard;
    // ---- the breach falls outward into the street, top rows first, then gets dragged along by the beer
    for (const ck of this.chunks) {
      const d = 0.06 * (3 - ck.r) + 0.04 * Math.abs(ck.c - 2), s = st.intact ? -1 : st.wall - d;
      const k = s < 0 ? 0 : clamp01(s / 0.6) ** 2, drag = s < 0.6 ? 0 : Math.min(6, 4 * (s - 0.6)) * (0.5 + hh(ck.c * 7 + ck.r));
      const ang = (Math.PI / 2) * k, fallY = ck.y * (1 - k) + 0.3 * k;
      ck.m.position.set(ck.x + (ck.c - 2) * 0.4 * k + (ck.x < 0 ? -1 : 1) * drag * 0.4, fallY, WALL_Z + ck.y * Math.sin(ang) * 0.9 + drag);
      ck.m.rotation.set(ang * (0.9 + 0.2 * hh(ck.c, ck.r)), 0.3 * k * (hh(ck.r, ck.c) - 0.5), 0);
    }
    // ---- the wave along the street
    const on = st.wave >= 0;
    this.wave.visible = on;
    if (!on) return;
    const s = st.wave, front = waveFront(s), crest = waveCrest(st.crestS ?? s), base = 1.3 * Math.exp(-0.18 * s);
    const NX = this.NX, NZ = this.NZ, P = this.wpos, Cc = this.wcol;
    const beer = new THREE.Color("#8a4f1c"), foam = new THREE.Color("#f1e3c3"), c = new THREE.Color();
    for (let i = 0; i < NX; i++) {
      const x = -90 + (180 * i) / (NX - 1), d = Math.abs(x);
      let y: number, f = 0;
      if (d < front) {
        y = base * (1 - 0.6 * clamp01(d / Math.max(front, 1))) + crest * Math.exp(-(((d - (front - 1.3)) / 1.7) ** 2));
        f = clamp01((y - base) / Math.max(0.3, crest) * 1.8 - 0.2) + clamp01(1 - Math.abs(d - (front - 0.4)) / 0.9) * 0.8;
      } else y = -0.4 + 0.4 * clamp01(1 - (d - front) / 0.8);
      for (let j = 0; j < NZ; j++) {
        const z = STREET_Z0 + 0.05 + ((STREET_Z1 - STREET_Z0 + 0.2) * j) / (NZ - 1);
        const rip = d < front ? 0.07 * Math.sin(x * 1.3 + t * 5 + j) * Math.sin(z * 2.1 - t * 3) : 0;
        const nearBreach = d < 7 && st.wall > 0 ? 0.6 * Math.exp(-s * 0.4) * (1 - d / 7) : 0;
        const k = (i * NZ + j) * 3;
        P[k] = x; P[k + 1] = Math.max(-0.4, y + rip + nearBreach); P[k + 2] = z;
        c.copy(beer).lerp(foam, Math.min(1, f + (rip > 0.05 ? 0.25 : 0)));
        Cc[k] = c.r; Cc[k + 1] = c.g; Cc[k + 2] = c.b;
      }
    }
    const g = this.wave.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; g.computeVertexNormals();
  }
}
export type { V3 };
