// The Piazza dei Miracoli as one cartoon set: the leaning Campanile (eight storeys posed every frame: storeys built,
// lean, the banana correction of the upper storeys), the cathedral, baptistery, city wall, the town around the lawn,
// the beach far to the south (wet-sand analogy) and the props of every era (scaffold, grout pump, fence, lead
// counterweight, crane, nitrogen tanks, drill rig, the "room" of soil, the opening ribbon).
// Everything uses the bridge template's two-tone materials (lam/twoTone) so the ink and light passes treat it alike.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, quad, tri, Kit, Ray, kitClone, prop, setSight } from "./build";
import { ctex, rep, stoneHD, roofHD, grassHD, rng } from "./paint";
import { twoTone } from "./shade";
import { TW, DOOR, DRILL_AT, DRILL_YAW, PILE_AT, PUMP_AT, ROOM_AT, BEACH, TowerState, smooth, clamp01, easeOut, V3 } from "./story";

const rad = (d: number) => (d * Math.PI) / 180;

// ---------------- painted textures ----------------
const MARBLE = ["#f3eee4", "#ece6da", "#f6f2ea", "#e8e1d4"];
export const marbleTex = () => stoneHD("marbleHD", MARBLE, "#c9c0b1");
/** loggia wall behind the colonnade: marble courses with dark arched doorways between the columns (n per turn) */
const loggiaTex = (n: number, key: string) => ctex(key, 2048, 256, (g, r) => {
  const W = 2048, H = 256, cw = W / n;
  g.fillStyle = "#efe9de"; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 32) { g.fillStyle = `rgba(150,140,130,${0.08 + 0.06 * r()})`; g.fillRect(0, y, W, 2); }
  for (let i = 0; i < n; i++) {
    const cx = (i + 0.5) * cw, w = cw * 0.42, top = 70, bot = H;
    g.fillStyle = "#4e4766";
    g.beginPath(); g.moveTo(cx - w / 2, bot); g.lineTo(cx - w / 2, top + w / 2); g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, bot); g.closePath(); g.fill();
    g.strokeStyle = "rgba(60,45,60,0.8)"; g.lineWidth = 4; g.stroke();
    g.strokeStyle = "rgba(180,170,160,0.9)"; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, top + w / 2, w / 2 + 7, Math.PI, 0); g.stroke();
  }
});
/** the ground storey: blind arcade (tall shallow arches) with lozenge insets */
const arcadeTex = () => ctex("arcadeHD", 2048, 512, (g, r) => {
  const W = 2048, H = 512, n = 15, cw = W / n;
  g.fillStyle = "#efe9de"; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 34) { g.fillStyle = `rgba(150,140,130,${0.07 + 0.06 * r()})`; g.fillRect(0, y, W, 2); }
  for (let i = 0; i < n; i++) {
    const cx = (i + 0.5) * cw, w = cw * 0.8, top = 70;
    g.fillStyle = "#ddd5c7";
    g.beginPath(); g.moveTo(cx - w / 2, H - 30); g.lineTo(cx - w / 2, top + w / 2); g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, H - 30); g.closePath(); g.fill();
    g.strokeStyle = "rgba(70,55,70,0.75)"; g.lineWidth = 4; g.stroke();
    g.fillStyle = "#7e7a92"; // lozenge inset under the arch head
    g.beginPath(); g.moveTo(cx, top + 40); g.lineTo(cx + 22, top + 80); g.lineTo(cx, top + 120); g.lineTo(cx - 22, top + 80); g.closePath(); g.fill();
    g.strokeStyle = "rgba(60,45,60,0.7)"; g.lineWidth = 3; g.stroke();
  }
  g.fillStyle = "#c9c0b1"; g.fillRect(0, H - 30, W, 30);
});
/** cathedral walls: white marble with thin grey bands (Pisan Romanesque) and a blind arcade */
const bandTex = () => ctex("bandHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#efe9de"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 64) { g.fillStyle = "#b9b3ab"; g.fillRect(0, y, 1024, 14); g.fillStyle = `rgba(150,140,130,${0.1 * r()})`; g.fillRect(0, y + 32, 1024, 2); }
  for (let i = 0; i < 4; i++) {
    const cx = (i + 0.5) * 256, w = 150, top = 200;
    g.fillStyle = "rgba(120,110,130,0.18)";
    g.beginPath(); g.moveTo(cx - w / 2, 1024); g.lineTo(cx - w / 2, top + w / 2); g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, 1024); g.closePath(); g.fill();
    g.strokeStyle = "rgba(70,55,70,0.55)"; g.lineWidth = 4; g.stroke();
    g.fillStyle = "#4e4766"; g.fillRect(cx - 18, top + 140, 36, 120); // narrow window
  }
});
/** cathedral front: three portals, four galleries of small arches */
const facadeTex = () => ctex("duomoFront", 1024, 1024, (g) => {
  g.fillStyle = "#efe9de"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 64) { g.fillStyle = "#c4beb6"; g.fillRect(0, y, 1024, 10); }
  for (const [cx, w, h] of [[512, 150, 330], [250, 110, 260], [774, 110, 260]] as const) {
    g.fillStyle = "#4e4766";
    g.beginPath(); g.moveTo(cx - w / 2, 1024); g.lineTo(cx - w / 2, 1024 - h + w / 2); g.arc(cx, 1024 - h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, 1024); g.closePath(); g.fill();
    g.strokeStyle = "#3a2f3f"; g.lineWidth = 6; g.stroke();
  }
  for (let row = 0; row < 4; row++) {
    const y0 = 600 - row * 150, n = 18 - row * 3, x0 = 80 + row * 70, x1 = 944 - row * 70, cw = (x1 - x0) / n;
    g.fillStyle = "#d9d2c6"; g.fillRect(x0, y0 - 110, x1 - x0, 110);
    for (let i = 0; i < n; i++) {
      const cx = x0 + (i + 0.5) * cw;
      g.fillStyle = "#6d6683";
      g.beginPath(); g.moveTo(cx - cw * 0.32, y0); g.lineTo(cx - cw * 0.32, y0 - 70); g.arc(cx, y0 - 70, cw * 0.32, Math.PI, 0); g.lineTo(cx + cw * 0.32, y0); g.closePath(); g.fill();
      g.fillStyle = "#f3eee4"; g.fillRect(cx + cw * 0.38, y0 - 90, 6, 90);
    }
    g.strokeStyle = "rgba(60,45,60,0.6)"; g.lineWidth = 3; g.strokeRect(x0, y0 - 110, x1 - x0, 110);
  }
});
const sandTex = () => ctex("sandHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#e7cf9c"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 60; i++) {
    const y = r() * 1024, x = r() * 1024, w = 80 + r() * 160;
    g.strokeStyle = `rgba(170,130,80,${0.18 + 0.12 * r()})`; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 10, x + w, y); g.stroke();
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(150,110,70,${0.15 * r()})`; g.fillRect(r() * 1024, r() * 1024, 2, 2); }
});
const dirtTex = (door: boolean) => ctex(door ? "roomDirtDoor" : "roomDirt", 512, 512, (g, r) => {
  g.fillStyle = "#8a6440"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) {
    const x = r() * 512, y = r() * 512, s = 6 + r() * 16;
    g.fillStyle = r() < 0.5 ? "rgba(70,48,30,0.45)" : "rgba(170,130,90,0.35)";
    g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
  }
  for (let y = 60; y < 512; y += 70 + r() * 30) { g.fillStyle = "rgba(60,40,25,0.35)"; g.fillRect(0, y, 512, 4); }
  g.strokeStyle = "rgba(40,28,20,0.9)"; g.lineWidth = 10;
  if (door) { // a door, so the block reads as "a room"
    g.fillStyle = "#5a3b25"; g.fillRect(190, 180, 130, 332); g.strokeRect(190, 180, 130, 332);
    g.fillStyle = "#e0b04a"; g.beginPath(); g.arc(298, 350, 9, 0, 7); g.fill();
  } else { // a window with a cross
    g.fillStyle = "#7fb0d8"; g.fillRect(170, 150, 170, 150); g.strokeRect(170, 150, 170, 150);
    g.beginPath(); g.moveTo(255, 150); g.lineTo(255, 300); g.moveTo(170, 225); g.lineTo(340, 225); g.stroke();
  }
});
const stripeTex = () => ctex("stripesRW", 256, 32, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#d23b3b"; g.fillRect(i * 32, 0, 32, 32); }
});

// ---------------- the tower ----------------
/** cylinder wall with uv u around, v up, base at y = 0 */
const wall = (r: number, h: number, seg = 48, y0 = 0) => new THREE.CylinderGeometry(r, r, h, seg, 1, true).translate(0, y0 + h / 2, 0);
const ring = (r: number, h: number, seg = 48) => new THREE.CylinderGeometry(r, r, h, seg, 1, false).translate(0, h / 2, 0);
/** n columns (shaft + capital) around radius r, height h, merged */
const colonnade = (b: Batch, mat: THREE.Material, cap: THREE.Material, n: number, r: number, h: number, cr: number) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n, x = r * Math.cos(a), z = r * Math.sin(a);
    b.add(new THREE.CylinderGeometry(cr, cr * 1.08, h - 0.5, 10, 1, true).translate(0, (h - 0.5) / 2, 0), mat, new THREE.Matrix4().makeTranslation(x, 0, z));
    b.add(new THREE.BoxGeometry(cr * 3, 0.5, cr * 3), cap, new THREE.Matrix4().makeTranslation(x, h - 0.25, z));
  }
};

export class Tower {
  root = new THREE.Group();
  private levels: { g: THREE.Group; full: THREE.Group; core: THREE.Mesh | null; h: number }[] = [];
  readonly attach = new THREE.Group(); // scaffold etc.: lean with the tower

  constructor() {
    const marble = lam("marbleHD", () => ({ map: rep(marbleTex(), 4, 2) }));
    const capM = lam("towerCap", () => ({ color: "#e6dfd2" }));
    const colM = lam("towerCol", () => ({ color: "#f4f0e8" }));
    const rimM = lam("towerRim", () => ({ map: rep(marbleTex(), 8, 0.4) }));
    let parent: THREE.Object3D = this.root;
    const add = (h: number, build: (full: Batch, core: Batch) => void, coreOwn = false) => {
      const g = new THREE.Group(), full = new THREE.Group();
      const fb = new Batch(), cb = new Batch();
      build(fb, cb);
      fb.build(full); cb.build(g);
      let core: THREE.Mesh | null = null;
      if (coreOwn) core = g.children[g.children.length - 1] as THREE.Mesh;
      g.add(full);
      parent.add(g);
      if (parent !== this.root) g.position.y = this.levels[this.levels.length - 1].h;
      this.levels.push({ g, full, core, h });
      parent = g;
    };
    // ground storey: buried 3 m (the lean lifts the north edge), blind arcade, plinth, cornice, the door
    add(TW.h0, (fb, cb) => {
      cb.add(wall(TW.rCol - 0.15, TW.h0 + 3, 64, -3), lam("arcadeHD", () => ({ map: arcadeTex() })));
      fb.add(ring(TW.rCol + 0.25, 1.0, 64).translate(0, -0.6, 0), rimM);
      fb.add(ring(TW.rCol + 0.35, 0.55, 64).translate(0, TW.h0 - 0.55, 0), rimM);
      fb.add(quad(V(DOOR[0] - 0.03, 0, -1.2), V(DOOR[0] - 0.03, 0, 1.2), V(DOOR[0] - 0.03, 3.4, 1.2), V(DOOR[0] - 0.03, 3.4, -1.2)), lam("doorDark", () => ({ color: "#3e344c" })));
    });
    // six open loggias
    for (let k = 0; k < TW.nL; k++) add(TW.hL, (fb, cb) => {
      cb.add(wall(TW.rCore, TW.hL, 48), lam("loggia30", () => ({ map: loggiaTex(30, "loggia30") })));
      fb.add(ring(TW.rCol + 0.3, 0.4, 64), rimM); // gallery floor / cornice
      colonnade(fb, colM, capM, 30, TW.rCol - 0.05, TW.hL - 0.4, 0.2);
      fb.add(ring(TW.rCol + 0.2, 0.45, 64).translate(0, TW.hL - 0.45, 0), rimM); // architrave
    }, true);
    // belfry: narrower drum, big arches, flat top with a parapet
    add(TW.hBell, (fb, cb) => {
      cb.add(wall(TW.rBell, TW.hBell, 40), lam("loggia16", () => ({ map: loggiaTex(16, "loggia16") })));
      fb.add(ring(TW.rCol + 0.2, 0.4, 64), rimM); // terrace floor
      colonnade(fb, colM, capM, 16, TW.rBellCol, TW.hBell - 0.5, 0.24);
      fb.add(ring(TW.rBellCol + 0.3, 0.6, 48).translate(0, TW.hBell - 0.6, 0), rimM);
      fb.add(ring(TW.rBell - 0.4, 1.2, 40).translate(0, TW.hBell, 0), marble);
    }, true);
    this.levels[0].g.add(this.attach);
    this.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = true; } });
  }

  pose(s: TowerState) {
    this.root.rotation.x = rad(s.tilt);
    const built = Math.floor(s.storeys + 1e-6), frac = s.storeys - built;
    this.levels.forEach((L, k) => {
      L.g.rotation.x = k >= 3 ? -rad(s.curve) : 0;
      if (k < built) { L.g.visible = true; L.full.visible = true; L.g.scale.y = 1; }
      else if (k === built && frac > 0.02) { L.g.visible = true; L.full.visible = false; L.g.scale.y = frac; }
      else L.g.visible = false;
    });
  }
}

// ---------------- static set ----------------
const gquad = (x0: number, x1: number, z0: number, z1: number, u: number, v: number, y = 0) => quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), u, v);

/** sight lines of the film, so houses / trees never stand in front of a lens (build.ts house() and prop() test them) */
export const buildPiazza = (root: THREE.Object3D, kit: Kit, rays: Ray[]) => {
  const b = new Batch(), r = rng(7);
  setSight(rays);
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  b.add(gquad(-420, 420, -420, 650, 140, 178), grass);
  const pave = lam("paveHD", () => ({ map: rep(stoneHD("paveHD", ["#e4dccd", "#d9d0bf", "#ebe4d6", "#d2c8b7"], "#a99d8b"), 1, 1) }));
  const disc = new THREE.CircleGeometry(15, 64); disc.rotateX(-Math.PI / 2);
  const uv = disc.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 6);
  b.add(disc.translate(0, 0.015, 0), pave);
  b.add(gquad(-46, -14, -2.2, 2.2, 16, 2, 0.012), pave); // path west to the cathedral
  b.add(gquad(-3, 3, 14, 60, 3, 23, 0.012), pave);        // path south to the town gate

  // cathedral: nave + aisles + transept + crossing dome + apse + front
  const band = lam("bandHD", () => ({ map: bandTex() })), lead = lam("roofLead", () => ({ map: roofHD("#8f97a8", true), side: THREE.DoubleSide }));
  const zc = -26, x0 = -126, x1 = -46, half = 8;
  b.add(boxGeo(V(x0, 0, zc - half), V(x1, 21, zc + half), 10), band);
  b.add(quad(V(x0 - 0.3, 20.7, zc + half + 0.6), V(x1 + 0.3, 20.7, zc + half + 0.6), V(x1 + 0.3, 26, zc), V(x0 - 0.3, 26, zc), 16, 2), lead);
  b.add(quad(V(x1 + 0.3, 20.7, zc - half - 0.6), V(x0 - 0.3, 20.7, zc - half - 0.6), V(x0 - 0.3, 26, zc), V(x1 + 0.3, 26, zc), 16, 2), lead);
  for (const s of [-1, 1]) {
    const za = zc + s * half, zb = zc + s * (half + 6);
    b.add(boxGeo(V(x0 + 2, 0, Math.min(za, zb)), V(x1 - 2, 12, Math.max(za, zb)), 10), band);
    b.add(s > 0 ? quad(V(x0 + 2, 11.8, zb + 0.4), V(x1 - 2, 11.8, zb + 0.4), V(x1 - 2, 15, za), V(x0 + 2, 15, za), 14, 1) : quad(V(x1 - 2, 11.8, zb - 0.4), V(x0 + 2, 11.8, zb - 0.4), V(x0 + 2, 15, za), V(x1 - 2, 15, za), 14, 1), lead);
  }
  const tx0 = -64, tx1 = -50;
  b.add(boxGeo(V(tx0, 0, zc - 24), V(tx1, 19, zc + 24), 10), band);
  b.add(quad(V(tx0 - 0.4, 18.7, zc + 24.3), V(tx0 - 0.4, 18.7, zc - 24.3), V((tx0 + tx1) / 2, 23, zc - 24.3), V((tx0 + tx1) / 2, 23, zc + 24.3), 8, 2), lead);
  b.add(quad(V(tx1 + 0.4, 18.7, zc - 24.3), V(tx1 + 0.4, 18.7, zc + 24.3), V((tx0 + tx1) / 2, 23, zc + 24.3), V((tx0 + tx1) / 2, 23, zc - 24.3), 8, 2), lead);
  for (const s of [-1, 1]) b.add(tri(s > 0 ? V(tx0, 19, zc + 24) : V(tx1, 19, zc - 24), s > 0 ? V(tx1, 19, zc + 24) : V(tx0, 19, zc - 24), V((tx0 + tx1) / 2, 23, zc + s * 24)), band);
  b.add(new THREE.CylinderGeometry(6.2, 6.2, 4, 32, 1, true).translate(-57, 25, zc), band);
  const dome = new THREE.SphereGeometry(6.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  b.add(dome, lam("domeLead", () => ({ color: "#9a9aa6" })), new THREE.Matrix4().compose(V(-57, 27, zc), new THREE.Quaternion(), V(1, 1.15, 1)));
  const apse = new THREE.CylinderGeometry(7.5, 7.5, 17, 24, 1, true, 0, Math.PI).translate(0, 8.5, 0);
  b.add(apse, band, new THREE.Matrix4().makeTranslation(x1, 0, zc));
  b.add(quad(V(x0, 0, zc + half), V(x0, 0, zc - half), V(x0, 24, zc - half), V(x0, 24, zc + half)), lam("duomoFront", () => ({ map: facadeTex() })));
  b.add(tri(V(x0, 24, zc + half), V(x0, 24, zc - half), V(x0, 29, zc)), band);
  // baptistery
  b.add(wall(17, 20, 48).translate(-170, 0, zc), band);
  const bd = new THREE.ConeGeometry(18, 15, 48, 1, true); bd.translate(0, 27.5, 0);
  b.add(bd, lam("baptRoof", () => ({ color: "#c27a5a" })), new THREE.Matrix4().makeTranslation(-170, 0, zc));
  b.add(new THREE.SphereGeometry(4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam("domeLead", () => ({ color: "#9a9aa6" })), new THREE.Matrix4().makeTranslation(-170, 34.5, zc));

  // city wall along the north and west of the lawn, with merlons
  const brickW = lam("wallBrick", () => ({ map: rep(stoneHD("cityWall", ["#c8a47a", "#bf9a70", "#d1ae85", "#b8936a"], "#8f6f52"), 1, 1) }));
  for (const [ax, az, bx, bz] of [[-230, -78, 90, -78], [-230, -78, -230, 120]] as const) {
    const len = Math.hypot(bx - ax, bz - az), along = ax === bx;
    b.add(boxGeo(V(Math.min(ax, bx) - (along ? 1.2 : 0), 0, Math.min(az, bz) - (along ? 0 : 1.2)), V(Math.max(ax, bx) + (along ? 1.2 : 0), 10, Math.max(az, bz) + (along ? 0 : 1.2)), 4), brickW);
    for (let d = 1; d < len; d += 3) {
      const x = ax + ((bx - ax) * d) / len, z = az + ((bz - az) * d) / len;
      b.add(boxGeo(V(x - (along ? 1.2 : 0.75), 10, z - (along ? 0.75 : 1.2)), V(x + (along ? 1.2 : 0.75), 11.4, z + (along ? 0.75 : 1.2)), 4), brickW);
    }
  }
  b.build(root);

  // the town east and south of the lawn (rows of tall houses; anything blocking a camera is left out)
  const tb = new Batch();
  const H = [9.8, 11.2, 12.6, 8.4];
  for (const xr of [52, 68, 84]) for (let z = -66; z < 70; ) {
    const w = r() < 0.5 ? 7 : 9;
    house(tb, xr, z + w / 2, -Math.PI / 2, w, 8, H[Math.floor(r() * 4)], Math.floor(r() * 8));
    z += w + (r() < 0.25 ? 3 : 0.3);
  }
  for (const zr of [48, 64, 80]) for (let x = -110; x < 44; ) {
    const w = r() < 0.5 ? 7 : 9;
    if (!(x > -6 && x < 6)) house(tb, x + w / 2, zr, Math.PI, w, 8, H[Math.floor(r() * 4)], Math.floor(r() * 8));
    x += w + (r() < 0.25 ? 3 : 0.3);
  }
  // trees: pines and round trees along the lawn, a few cypresses
  for (let i = 0; i < 46; i++) {
    const x = -200 + r() * 260, z = (r() < 0.5 ? -66 + r() * 8 : 34 + r() * 8);
    if (Math.abs(x) < 20) continue;
    prop(tb, kit, r() < 0.25 ? "tree_cone" : r() < 0.6 ? "tree_fat" : "tree_oak", x, 0, z, 8 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 160 + r() * 200;
    prop(tb, kit, r() < 0.4 ? "tree_cone" : "tree_default", Math.cos(a) * d, 0, Math.min(560, Math.sin(a) * d), 10 + r() * 6, r() * 6);
  }
  tb.build(root);
  setSight([]);

  // distant hills (Monte Pisano to the north-east)
  const hb = new Batch(), hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#86b866" })), lam("hillB", () => ({ color: "#78ad5c" }))];
  ([[260, -380, 240, 60, 140], [520, -200, 220, 48, 160], [-80, -460, 260, 54, 140], [-420, -330, 220, 46, 150]] as const).forEach(([x, z, sx, sy, sz], i) =>
    hb.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, -2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  // the beach (far south): sand, an umbrella, a towel, a bucket
  const sand = lam("sandHD", () => ({ map: rep(sandTex(), 8, 4) }));
  hb.add(gquad(-80, 80, BEACH[2] - 30, BEACH[2] + 14, 1, 1, 0.01), sand);
  const pole = lam("umbPole", () => ({ color: "#f4f1ea" }));
  hb.add(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8).translate(0, 1.3, 0), pole, new THREE.Matrix4().makeTranslation(-3.2, 0, BEACH[2] + 4.5));
  const umb = new THREE.ConeGeometry(1.7, 0.7, 12, 1, true); umb.translate(0, 2.7, 0);
  hb.add(umb, lam("umbCloth", () => ({ map: stripeTex(), side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(-3.2, 0, BEACH[2] + 4.5));
  hb.add(gquad(-4.5, -2.7, BEACH[2] + 3.4, BEACH[2] + 6.2, 1, 1, 0.03), lam("towel", () => ({ color: "#3fa0c9" })));
  hb.add(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 14).translate(1.3, 0.15, BEACH[2] + 2.5), lam("bucket", () => ({ color: "#e2453c" })));
  hb.build(root);
};

// ---------------- props of every era ----------------
type Named = Record<string, THREE.Object3D>;
export class EraProps {
  g: Named = {};
  private ingots: THREE.InstancedMesh;
  private pallet: THREE.Group; private cable: THREE.Mesh;
  private room: THREE.Group;
  private gateArm: THREE.Group;
  private ribbon: THREE.Mesh[] = [];
  private nIngot = 0;

  constructor(root: THREE.Object3D, tower: Tower, kit: Kit) {
    const wood = lam("scafWood", () => ({ color: "#a8724a" })), plank = lam("scafPlank", () => ({ color: "#c9965f" }));
    const grp = (name: string, parent: THREE.Object3D = root, b?: Batch) => {
      const g = new THREE.Group(); g.name = name; parent.add(g); this.g[name] = g; if (b) b.build(g); return g;
    };
    // scaffold (leans with the tower): two heights
    const scaffold = (top: number) => {
      const b = new Batch(), n = 18, R = TW.rCol + 1.3;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, x = R * Math.cos(a), z = R * Math.sin(a);
        if (Math.abs(a - Math.PI) < 0.2) continue; // the west face stays open (the door, the cameras)
        b.add(new THREE.CylinderGeometry(0.09, 0.11, top, 6).translate(x, top / 2 - 0.5, z), wood);
        const a2 = ((i + 1) / n) * Math.PI * 2, x2 = R * Math.cos(a2), z2 = R * Math.sin(a2);
        if (Math.abs(a2 - Math.PI) < 0.2) continue;
        for (let j = 0, y = 2.5; y < top - 1; j++, y += 3) {
          const L = Math.hypot(x2 - x, z2 - z), g = new THREE.BoxGeometry(L, 0.12, 0.12);
          b.add(g, wood, new THREE.Matrix4().compose(V((x + x2) / 2, y, (z + z2) / 2), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.atan2(z2 - z, x2 - x)), V(1, 1, 1)));
          if (j % 2 === 1) b.add(new THREE.BoxGeometry(L, 0.08, 1.1), plank, new THREE.Matrix4().compose(V((x + x2) / 2 * 0.94, y + 0.1, (z + z2) / 2 * 0.94), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.atan2(z2 - z, x2 - x)), V(1, 1, 1)));
        }
      }
      return b;
    };
    grp("scafLow", tower.attach, scaffold(23));
    grp("scafHigh", tower.attach, scaffold(42));
    // marble blocks + a ladder by the stump
    const sb = new Batch(), blockM = lam("marbleHD", () => ({ map: rep(stoneHD("marbleHD", ["#f3eee4", "#ece6da", "#f6f2ea", "#e8e1d4"], "#c9c0b1"), 4, 2) }));
    const rr = rng(3);
    for (let i = 0; i < 14; i++) {
      const x = -13 - rr() * 5, z = 4 + rr() * 6, w = 1.2 + rr() * 0.8;
      sb.add(boxGeo(V(x, (i % 3) * 0.7, z), V(x + w, (i % 3) * 0.7 + 0.7, z + 0.8)), blockM);
    }
    for (let i = 0; i < 8; i++) { const x = 9 + rr() * 4, z = -8 - rr() * 4; sb.add(boxGeo(V(x, 0, z), V(x + 1.4, 0.7, z + 0.8)), blockM); }
    grp("stones", root, sb);
    // overgrown abandoned site (century of rest): bushes around the stump
    const og = grp("overgrown");
    for (const [x, z, h] of [[-9.5, 4, 1.6], [-8.6, -4.5, 1.3], [-4, 9.2, 1.4], [5.5, 9, 1.7], [9.2, -2, 1.5], [-11.5, 9.5, 1.2]] as const) {
      const o = kitClone(kit, "plant_bushLarge", h); if (o) { o.position.set(x, 0, z); og.add(o); }
    }
    // 1934 grout pump with two hoses into the foundation
    const pb = new Batch(), green = lam("pumpGreen", () => ({ color: "#4f7a55" })), black = lam("hose", () => ({ color: "#2b2830" }));
    const [px, , pz] = PUMP_AT;
    pb.add(boxGeo(V(px - 1.6, 0.6, pz - 1), V(px + 1.6, 2.2, pz + 1)), green);
    pb.add(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 10).translate(px + 1.0, 3.0, pz), black);
    for (const [dx, dz] of [[-1.2, -1.05], [1.2, -1.05], [-1.2, 1.05], [1.2, 1.05]]) {
      const w = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 16); w.rotateX(Math.PI / 2);
      pb.add(w, lam("wheel", () => ({ color: "#5a3b2a" })), new THREE.Matrix4().makeTranslation(px + dx, 0.55, pz + dz));
    }
    for (const end of [[-4.4, 0.15, -5.0], [-1.8, 0.15, -6.6]] as const) {
      const c = new THREE.CatmullRomCurve3([V(px + 0.4, 1.0, pz + 1.0), V(px + 1.5, 0.15, pz + 3.0), V((px + end[0]) / 2 + 1, 0.12, (pz + end[2]) / 2 + 1), V(end[0], end[1], end[2])]);
      pb.add(new THREE.TubeGeometry(c, 40, 0.12, 8), black);
    }
    grp("pump", root, pb);
    // fence (1990): red/white rails on a ring, the gate on the west with a barrier arm
    const fb = new Batch(), postM = lam("fencePost", () => ({ color: "#e9e4da" })), railM = lam("fenceRail", () => ({ map: rep(stripeTex(), 1, 1) }));
    const FR = 14.5, n = 40;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2;
      if (Math.cos(a) < -0.985 || Math.cos(a2) < -0.985) continue; // gate gap on the west
      const x = FR * Math.cos(a), z = FR * Math.sin(a), x2 = FR * Math.cos(a2), z2 = FR * Math.sin(a2);
      fb.add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6).translate(x, 0.6, z), postM);
      const L = Math.hypot(x2 - x, z2 - z), q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.atan2(z2 - z, x2 - x));
      for (const y of [0.55, 1.05]) fb.add(new THREE.BoxGeometry(L, 0.12, 0.05), railM, new THREE.Matrix4().compose(V((x + x2) / 2, y, (z + z2) / 2), q, V(1, 1, 1)));
    }
    const fence = grp("fence", root, fb);
    this.gateArm = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.2).translate(0, 0, 1.6), railM);
    this.gateArm.add(arm); this.gateArm.position.set(-FR, 1.0, -1.6);
    const gp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 8).translate(-FR, 0.55, -1.6), postM);
    fence.add(this.gateArm, gp);
    // lead counterweight on the north side: a concrete ring segment and stacked ingots
    const lb = new Batch(), conc = lam("concrete", () => ({ color: "#bdb7ad" }));
    const [lx, , lz] = PILE_AT;
    lb.add(boxGeo(V(lx - 5, 0, lz - 1.6), V(lx + 5, 1.0, lz + 1.2)), conc);
    this.g.lead = grp("lead", root, lb);
    const leadM = twoTone(new THREE.MeshPhongMaterial({ color: "#5c6472", specular: "#9aa2b0", shininess: 40 }), 0.15);
    this.ingots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.95, 0.32, 0.5), leadM, 160);
    const m4 = new THREE.Matrix4();
    let k = 0;
    for (let layer = 0; layer < 5; layer++) for (let row = 0; row < 4; row++) for (let i = 0; i < 8; i++) {
      if (k >= 160) break;
      const shrink = layer * 0.45;
      if (i * 1.05 > 8.4 - 2 * shrink) continue;
      m4.makeTranslation(lx - 4.2 + shrink + i * 1.05, 1.16 + layer * 0.34, lz - 1.25 + row * 0.6 + shrink * 0.15);
      this.ingots.setMatrixAt(k++, m4);
    }
    this.nIngot = k; this.ingots.count = k; this.ingots.castShadow = true; this.ingots.receiveShadow = true;
    this.g.lead.add(this.ingots);
    // crane lowering a pallet of ingots
    const cb = new Batch(), yel = lam("craneYellow", () => ({ color: "#f2b632" }));
    cb.add(boxGeo(V(11, 0.4, -19), V(18, 2.6, -16)), yel);
    cb.add(boxGeo(V(15.5, 2.6, -19), V(18, 4.6, -16)), lam("craneCab", () => ({ color: "#3a6ea5" })));
    for (const x of [12, 17]) for (const z of [-19.2, -15.8]) { const w = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 14); w.rotateX(Math.PI / 2); cb.add(w, lam("tyre", () => ({ color: "#2b2830" })), new THREE.Matrix4().makeTranslation(x, 0.6, z)); }
    const boomA = V(12, 3, -17.5), boomB = V(lx + 0.5, 21, lz - 0.8);
    const bl = boomA.distanceTo(boomB), bq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), boomB.clone().sub(boomA).normalize());
    cb.add(new THREE.BoxGeometry(0.7, bl, 0.7), yel, new THREE.Matrix4().compose(boomA.clone().add(boomB).multiplyScalar(0.5), bq, V(1, 1, 1)));
    const crane = grp("crane", root, cb);
    this.cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6).translate(0, -0.5, 0), lam("cable", () => ({ color: "#2b2830" })));
    this.cable.position.copy(boomB);
    this.pallet = new THREE.Group();
    const pal = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.66, 1.2), leadM);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.07, 8, 16), lam("cable", () => ({ color: "#2b2830" })));
    hook.position.y = 0.75; this.pallet.add(pal, hook);
    crane.add(this.cable, this.pallet);
    // liquid nitrogen tanks + frost on the ground
    const nb = new Batch(), white = lam("tankWhite", () => ({ color: "#eef2f6" })), blueB = lam("tankBlue", () => ({ color: "#3f6fb5" }));
    for (const [x, z] of [[1.6, -14.6], [3.5, -15.2], [5.4, -14.4]] as const) {
      nb.add(new THREE.CylinderGeometry(0.75, 0.75, 3.0, 20).translate(x, 1.5, z), white);
      nb.add(new THREE.CylinderGeometry(0.77, 0.77, 0.3, 20).translate(x, 2.2, z), blueB);
      nb.add(new THREE.SphereGeometry(0.75, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, 3.0, z), white);
    }
    const frost = new THREE.CircleGeometry(4.5, 32); frost.rotateX(-Math.PI / 2);
    nb.add(frost.translate(-2.5, 0.03, -11), lam("frost", () => ({ color: "#e8f4ff" })));
    grp("tanks", root, nb);
    // drill rig drilling obliquely under the north side + spoil heap
    const db = new Batch(), orange = lam("rigOrange", () => ({ color: "#e8742c" })), steel = lam("rigSteel", () => ({ color: "#7d8088" }));
    // built in rig space (rig at the origin, +z toward the tower), then turned to face the tower's centre
    db.add(boxGeo(V(-1.6, 0, -1.6), V(1.6, 0.6, 1.6)), lam("tyre", () => ({ color: "#2b2830" })));
    db.add(boxGeo(V(-1.3, 0.6, -1.4), V(1.3, 2.2, 1.0)), orange);
    const mA = V(0, 0.8, 1.2), mB = V(0, 8.5, -3.2), mq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), mB.clone().sub(mA).normalize());
    db.add(new THREE.BoxGeometry(0.45, mA.distanceTo(mB), 0.45), orange, new THREE.Matrix4().compose(mA.clone().add(mB).multiplyScalar(0.5), mq, V(1, 1, 1)));
    const aA = V(0, 1.0, 1.3), aB = V(0, -1.6, 3.4), aq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), aB.clone().sub(aA).normalize());
    db.add(new THREE.CylinderGeometry(0.16, 0.16, aA.distanceTo(aB), 10), steel, new THREE.Matrix4().compose(aA.clone().add(aB).multiplyScalar(0.5), aq, V(1, 1, 1)));
    const heap = new THREE.ConeGeometry(1.8, 1.2, 20); heap.translate(-3.4, 0.6, -0.6);
    db.add(heap, lam("heapDirt", () => ({ color: "#7a5638" })));
    const rig = grp("drill", root, db);
    rig.position.set(DRILL_AT[0], 0, DRILL_AT[2]); rig.rotation.y = DRILL_YAW;
    // the "room" of soil: 38 m3 = a block 4.2 x 2.6 x 3.5 m with a door and a window
    this.room = new THREE.Group();
    const mats = [lam("roomDirt", () => ({ map: dirtTex(false) })), lam("roomDirt", () => ({ map: dirtTex(false) })), lam("roomTop", () => ({ color: "#7a5638" })),
      lam("roomTop", () => ({ color: "#7a5638" })), lam("roomDirt", () => ({ map: dirtTex(false) })), lam("roomDoor", () => ({ map: dirtTex(true) }))];
    // BoxGeometry faces: +x, -x, +y, -y, +z, -z -> the door on -z, the window on -x
    const roomMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 3.5).translate(0, 1.3, 0), [mats[0], mats[4], mats[2], mats[3], mats[0], mats[5]]);
    roomMesh.castShadow = roomMesh.receiveShadow = true;
    this.room.add(roomMesh); this.room.position.set(...ROOM_AT);
    root.add(this.room); this.g.room = this.room;
    // opening ribbon at the door: two brass stanchions and two halves of a red ribbon
    const rg = grp("ribbon");
    const brass = lam("brass", () => ({ color: "#d1aa5c" })), red = lam("ribbonRed", () => ({ color: "#d23b3b" }));
    for (const s of [-1, 1]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.15, 10).translate(0, 0.575, 0), brass);
      st.position.set(DOOR[0] - 1.6, 0, s * 1.7); rg.add(st);
      const half = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 1.7).translate(0, 0, -s * 0.85), red);
      half.position.set(DOOR[0] - 1.6, 1.08, s * 1.7); rg.add(half); this.ribbon.push(half);
    }
    for (const o of Object.values(this.g)) o.traverse((x) => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  }

  /** show the props of shot `props` at frame f; a/b = shot range, cues = word frames used for the props' actions */
  pose(props: string[], f: number, a: number, cues: { gate: number; drop: [number, number]; room: number; cut: number }) {
    for (const [k, o] of Object.entries(this.g)) o.visible = false;
    for (const p of props) {
      if (p === "scaffold") { this.g.scafLow.visible = true; }
      else if (this.g[p]) this.g[p].visible = true;
    }
    if (props.includes("scaffoldHigh")) { this.g.scafLow.visible = false; this.g.scafHigh.visible = true; }
    // the lead pile grows while the crane works
    this.ingots.count = props.includes("crane") ? Math.round(this.nIngot * (0.35 + 0.65 * clamp01((f - a) / (cues.drop[1] - a)))) : this.nIngot;
    if (props.includes("crane")) {
      const u = smooth((f - cues.drop[0]) / (cues.drop[1] - cues.drop[0]));
      const top = this.cable.position.y, y = top - 2 - (top - 3.6) * u;
      this.cable.scale.y = top - y - 0.4;
      this.pallet.position.set(this.cable.position.x, y - 0.4, this.cable.position.z);
    }
    // the gate's barrier arm comes down on "закрывают"
    this.gateArm.rotation.x = -rad(80) * (1 - smooth((f - cues.gate + 8) / 10));
    // the room of soil rises out of the ground on "примерно одну комнату" (a little overshoot)
    const ru = clamp01((f - cues.room) / 16), ov = ru < 1 ? easeOut(ru) * (1 + 0.12 * Math.sin(ru * Math.PI)) : 1;
    const ry = props.includes("room") ? (cues.room > 0 ? (f < cues.room ? 0 : ov) : 1) : 0;
    this.room.scale.set(1, Math.max(0.001, ry), 1);
    this.room.visible = ry > 0.01;
    // ribbon: whole until "открыли", then the halves drop
    const cu = smooth((f - cues.cut) / 8);
    this.ribbon.forEach((h, i) => { h.rotation.x = (i ? -1 : 1) * rad(70) * cu; h.position.y = 1.08 - 0.1 * cu; });
  }
}
export type { V3 };
