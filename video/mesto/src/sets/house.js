// Set: parents' house — warm living room + snowy exterior (shots 9b, 10, 17-20)
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { rng } from '../core.js';

function sidingTex(color) {
  const c = T.canvas(512, 512), x = c.getContext('2d'), r = rng(8);
  for (let i = 0; i < 16; i++) {
    const k = 0.9 + r() * 0.15, col = new THREE.Color(color).multiplyScalar(k);
    x.fillStyle = '#' + col.getHexString(); x.fillRect(0, i * 32, 512, 32);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, i * 32 + 29, 512, 3);
    x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(0, i * 32, 512, 2);
  }
  return T.toTex(c, { repeat: [3, 2] });
}

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b16);
  scene.fog = new THREE.FogExp2(0x0a1222, 0.018);
  const cam = new THREE.PerspectiveCamera(35, W / H, 0.03, 300);
  const RW = 4, RD = 3, RH = 2.7;
  const win = { x0: -2.7, x1: -1.3, y0: 0.62, y1: 2.12 }, door = { x0: 1.7, x1: 2.6, y1: 2.12 };

  // ---------- interior ----------
  const wallMat = new THREE.MeshStandardMaterial({ map: T.wallpaper(0xe8d6b4, 0xb8945e, { motif: 'damask', repeat: [6, 2] }), roughness: 0.9 });
  const floor = P.mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), new THREE.MeshStandardMaterial({ map: T.woodTex(0x9a6a3e, { planks: 8, repeat: [4, 3] }), roughness: 0.5 }), 0, 0, 0, scene); floor.rotation.x = -Math.PI / 2;
  const ceil = P.mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), P.std(0xf2ead8, 0.95), 0, RH, 0, scene); ceil.rotation.x = Math.PI / 2;
  const wall = (w, h, x, y, z, ry) => { const m = P.mesh(new THREE.PlaneGeometry(w, h), wallMat, x, y, z, scene); m.rotation.y = ry; return m; };
  wall(RW * 2, RH, 0, RH / 2, -RD, 0); wall(RD * 2, RH, -RW, RH / 2, 0, Math.PI / 2); wall(RD * 2, RH, RW, RH / 2, 0, -Math.PI / 2);
  // front wall (z=+RD) interior side with openings: pieces facing -Z
  const fw = (x0, x1, y0, y1) => wall(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2, RD, Math.PI);
  fw(-RW, win.x0, 0, RH); fw(win.x1, door.x0, 0, RH); fw(door.x1, RW, 0, RH);
  fw(win.x0, win.x1, 0, win.y0); fw(win.x0, win.x1, win.y1, RH); fw(door.x0, door.x1, door.y1, RH);
  // wall thickness (front): solid boxes to block light + exterior siding
  const sid = new THREE.MeshStandardMaterial({ map: sidingTex(0x6f8fa8), roughness: 0.8 });
  const ext = (x0, x1, y0, y1) => { const m = P.box(x1 - x0, y1 - y0, 0.16, sid, (x0 + x1) / 2, (y0 + y1) / 2, RD + 0.08, scene); m.material = sid; return m; };
  ext(-RW - 0.1, win.x0, 0, RH + 0.1); ext(win.x1, door.x0, 0, RH + 0.1); ext(door.x1, RW + 0.1, 0, RH + 0.1);
  ext(win.x0, win.x1, 0, win.y0); ext(win.x0, win.x1, win.y1, RH + 0.1); ext(door.x0, door.x1, door.y1, RH + 0.1);
  for (const sx of [-1, 1]) { const m = P.box(0.16, RH + 0.1, RD * 2 + 0.3, sid, sx * (RW + 0.08), RH / 2, 0, scene); m.material = sid; }
  const back = P.box(RW * 2 + 0.3, RH + 0.1, 0.16, sid, 0, RH / 2, -RD - 0.08, scene); back.material = sid;
  // roof
  const roofM = P.std(0x5a3a32, 0.8), snowM = P.std(0xf0f4fa, 0.85);
  for (const s of [-1, 1]) {
    const r = P.box(RW * 2 + 1.0, 0.12, RD + 1.1, roofM, 0, RH + 0.95, s * (RD + 1.1) / 2 * 0.98, scene); r.rotation.x = s * 0.55;
    const sn = P.box(RW * 2 + 1.05, 0.14, RD + 1.15, snowM, 0, RH + 1.04, s * (RD + 1.1) / 2 * 0.98 - s * 0.02, scene, 0.05); sn.rotation.x = s * 0.55;
  }
  // icicles along front eave
  const ic = P.std(0xdfefff, 0.05, 0, { transparent: true, opacity: 0.8 });
  const r = rng(12);
  for (let i = 0; i < 40; i++) { const x = -RW + i * 0.2 + r() * 0.1, h = 0.08 + r() * 0.25; const m = P.mesh(new THREE.ConeGeometry(0.015, h, 6), ic, x, RH + 0.48 - h / 2, RD + 0.95, scene, false); m.rotation.x = Math.PI; }
  scene.add(P.garland(Array.from({ length: 30 }, (_, i) => new THREE.Vector3(-RW + i * (RW * 2 / 29), RH + 0.5 - Math.abs(Math.sin(i * 0.9)) * 0.08, RD + 0.92)), { n: 60, r: 0.03, k: 2.2, warm: true }));

  // window: frame, glass, frost, sill, curtains, window seat
  const wf = P.windowFrame(win.x1 - win.x0, win.y1 - win.y0, 0.2, P.std(0xf2eee6, 0.5)); wf.position.set((win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, RD + 0.06); scene.add(wf);
  const glassM = new THREE.MeshStandardMaterial({ color: 0x1a2030, transparent: true, opacity: 0.1, roughness: 0.02, metalness: 0.7, depthWrite: false });
  P.mesh(new THREE.PlaneGeometry(win.x1 - win.x0, win.y1 - win.y0), glassM, (win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, RD + 0.07, scene, false);
  const frost = P.mesh(new THREE.PlaneGeometry(win.x1 - win.x0, win.y1 - win.y0), new THREE.MeshStandardMaterial({ map: T.frostTex(4), transparent: true, depthWrite: false, roughness: 0.6, emissive: 0x332a20, emissiveIntensity: 0.4 }), (win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, RD + 0.13, scene, false);
  void frost;
  P.box(win.x1 - win.x0 + 0.3, 0.06, 0.25, snowM, (win.x0 + win.x1) / 2, win.y0 - 0.03, RD + 0.25, scene, 0.03);
  const seat = P.box(win.x1 - win.x0 + 0.2, 0.08, 0.55, P.std(0xe8e2d6, 0.5), (win.x0 + win.x1) / 2, win.y0 - 0.04, RD - 0.27, scene, 0.02); void seat;
  P.box(win.x1 - win.x0 + 0.1, 0.55, 0.5, P.std(0xd9d2c4, 0.6), (win.x0 + win.x1) / 2, (win.y0 - 0.08) / 2, RD - 0.27, scene);
  const cush = P.box(win.x1 - win.x0 - 0.1, 0.09, 0.45, P.std(0x9a3a3a, 0.9), (win.x0 + win.x1) / 2, win.y0 + 0.04, RD - 0.27, scene, 0.04); void cush;
  
  const curt = P.std(0xa8442e, 0.9);
  for (const sx of [win.x0 - 0.2, win.x1 + 0.2]) { const c = P.mesh(new THREE.CylinderGeometry(0.14, 0.24, 2.3, 12, 1, true), curt, sx, 1.4, RD - 0.12, scene); c.material = curt.clone(); c.material.side = THREE.DoubleSide; c.scale.z = 0.4; }
  // door (opens inward, hinge at x1)
  const doorPivot = new THREE.Group(); doorPivot.position.set(door.x1, 0, RD + 0.02); scene.add(doorPivot);
  P.box(door.x1 - door.x0, door.y1, 0.06, P.std(0x6a3e24, 0.6), -(door.x1 - door.x0) / 2, door.y1 / 2, 0, doorPivot, 0.01);
  for (const y of [0.55, 1.45]) P.box(0.6, 0.6, 0.02, P.std(0x5a321c, 0.6), -(door.x1 - door.x0) / 2, y, 0.04, doorPivot, 0.01);
  P.sph(0.03, P.std(0xd8b060, 0.2, 1), -(door.x1 - door.x0) + 0.1, 1.0, 0.07, doorPivot, 10);
  P.sph(0.03, P.std(0xd8b060, 0.2, 1), -(door.x1 - door.x0) + 0.1, 1.0, -0.07, doorPivot, 10);
  // wreath on door (outside)
  const wr = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 20), P.std(0x1f4a2a, 0.9)); wr.position.set(-(door.x1 - door.x0) / 2, 1.6, 0.08); doorPivot.add(wr);
  P.sph(0.03, P.std(0xc8202a, 0.3), -(door.x1 - door.x0) / 2, 1.45, 0.12, doorPivot, 10);

  // furniture
  const wood = P.std(0x6a4026, 0.5);
  const rug = P.mesh(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshStandardMaterial({ map: T.wallpaper(0x7a2a2a, 0xd8a050, { motif: 'damask', repeat: [3, 2] }), roughness: 0.95 }), 0, 0.005, -0.4, scene); rug.rotation.x = -Math.PI / 2;
  const tbl = P.table(2.3, 1.15, 0.76, wood); tbl.position.set(0, 0, -0.4); scene.add(tbl);
  const cloth = P.mesh(new THREE.BoxGeometry(2.45, 0.012, 1.3), new THREE.MeshStandardMaterial({ map: T.tablecloth(), roughness: 0.8 }), 0, 0.768, -0.4, scene); void cloth;
  for (const sz of [-1, 1]) P.box(2.45, 0.16, 0.012, cloth.material, 0, 0.69, -0.4 + sz * 0.65, scene);
  const chairs = {};
  const seats = { arman: [0.55, -1.12, 0], grandma: [-0.55, -1.12, 0], uncle: [-1.55, -0.4, Math.PI / 2], aikoSeat: [-0.55, 0.32, Math.PI], mom: [0.55, 0.32, Math.PI], dad: [1.55, -0.4, -Math.PI / 2] };
  for (const [k, [x, z, ry]] of Object.entries(seats)) { const c = P.chair(wood); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c); chairs[k] = c; }
  // table dressing
  const T0 = 0.775, items = new THREE.Group(); scene.add(items);
  const place = (o, x, z) => { o.position.set(x, T0, z); items.add(o); return o; };
  const plates = {};
  for (const [k, [x, z]] of Object.entries(seats)) { const px = x * 0.72, pz = -0.4 + (z + 0.4) * 0.55; plates[k] = place(P.plate(0.12), px, pz); place(P.glass(0.14, 0xffffff, 0.5), px + 0.17, pz + (z > -0.4 ? -0.12 : 0.12)); }
  place(P.bowl(0.14, 0xe9dcb0), -0.25, -0.45); place(P.bowl(0.12, 0xc0303a), 0.35, -0.3); place(P.mandarins(7), 0.05, -0.65);
  place(P.bottle(), -0.65, -0.35); place(P.bottle(), 0.85, -0.55);
  const chicken = place(new THREE.Group(), 0.0, -0.25); P.sph(0.11, P.std(0xb86a2a, 0.4), 0, 0.07, 0, chicken, 18).scale.set(1.3, 0.7, 1); P.mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.02, 28), P.std(0xf2f0ea, 0.25), 0, 0.01, 0, chicken);
  const candles = [place(P.candle(0.16), -0.3, -0.15), place(P.candle(0.13), 0.45, -0.6), place(P.candle(0.18), -1.0, -0.5)];
  // fork/knife at empty place
  const emptyPlate = plates.arman;
  // tree, sideboard, kitchen, fridge
  const tree = P.xmasTree(2.1, 7); tree.position.set(-3.3, 0, -2.2); scene.add(tree);
  const gifts = [[0xc8202a, -3.0, -1.8], [0x2a60c0, -3.5, -1.75], [0xe0b030, -3.2, -1.55]];
  for (const [c, x, z] of gifts) { P.box(0.28, 0.22, 0.28, P.std(c, 0.6), x, 0.11, z, scene, 0.01); P.box(0.29, 0.03, 0.06, P.std(0xf2e6c0, 0.4), x, 0.18, z, scene); }
  const sb = P.box(1.6, 0.9, 0.45, wood, -1.2, 0.45, -RD + 0.24, scene, 0.02); void sb;
  P.box(1.5, 0.9, 0.35, P.std(0x5a3420, 0.5), -1.2, 1.55, -RD + 0.18, scene, 0.02);
  for (let i = 0; i < 4; i++) P.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), P.std(0xf0ece4, 0.3), -1.75 + i * 0.36, 1.55, -RD + 0.3, scene).rotation.x = Math.PI / 2;
  // photos on wall
  for (let i = 0; i < 3; i++) { P.box(0.32, 0.4, 0.02, P.std(0x3a2416, 0.5), 0.6 + i * 0.5, 1.75 + (i % 2) * 0.12, -RD + 0.02, scene); P.box(0.26, 0.33, 0.01, P.std([0xd8b890, 0xb8a080, 0xc8a890][i], 0.6), 0.6 + i * 0.5, 1.75 + (i % 2) * 0.12, -RD + 0.035, scene); }
  const cab = P.std(0xe8e0cc, 0.5);
  P.box(1.2, 0.88, 0.6, cab, 2.25, 0.44, -RD + 0.3, scene, 0.01); P.box(1.24, 0.04, 0.64, P.std(0x8a7a6a, 0.4), 2.25, 0.9, -RD + 0.3, scene);
  P.box(1.2, 0.6, 0.35, cab, 2.25, 1.9, -RD + 0.18, scene, 0.01);
  const fridge = new THREE.Group(); fridge.position.set(3.3, 0, -RD + 0.36); scene.add(fridge);
  P.box(0.68, 1.85, 0.66, P.std(0xf2f2f0, 0.3), 0, 0.925, 0, fridge, 0.04); P.box(0.66, 0.012, 0.02, P.std(0xb0b0b0, 0.3), 0, 1.2, 0.335, fridge); P.box(0.03, 0.4, 0.04, P.std(0xb0b0b0, 0.3, 0.8), -0.25, 1.45, 0.35, fridge);
  // magnets
  for (const [x, y, c] of [[0.2, 1.65, 0xe03030], [-0.1, 0.9, 0x3070e0], [0.18, 0.6, 0xe0c030]]) P.box(0.05, 0.05, 0.015, P.std(c, 0.5), x, y, 0.34, fridge);
  // drawing (prop), and the fridge copy for the finale
  const drawing = T.familyDrawing();
  const paperM = new THREE.MeshStandardMaterial({ map: drawing.tex, roughness: 0.85, side: THREE.DoubleSide });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.297, 0.21), paperM); paper.castShadow = true; scene.add(paper);
  const fridgeArt = new THREE.Mesh(new THREE.PlaneGeometry(0.297 * 1.2, 0.21 * 1.2), paperM); fridgeArt.position.set(0, 1.42, 0.336); fridge.add(fridgeArt);
  P.box(0.03, 0.03, 0.015, P.std(0xe03030, 0.4), 0, 1.54, 0.345, fridge);
  // wall clock
  const clock = P.wallClock(); clock.position.set(RW - 0.01, 2.0, 0.6); clock.rotation.y = -Math.PI / 2; scene.add(clock);
  // garland along back wall
  scene.add(P.garland(Array.from({ length: 20 }, (_, i) => new THREE.Vector3(-RW + 0.3 + i * 0.4, 2.45 - Math.abs(Math.sin(i * 0.8)) * 0.18, -RD + 0.04)), { n: 50, r: 0.02, k: 6, warm: true }));
  scene.add(P.garland(Array.from({ length: 12 }, (_, i) => new THREE.Vector3(win.x0 - 0.1 + i * 0.15, win.y1 + 0.08 - Math.sin(i / 11 * Math.PI) * 0.12, RD - 0.06)), { n: 24, r: 0.018, k: 6 }));
  // chandelier
  const ch = new THREE.Group(); ch.position.set(0, RH, -0.4); scene.add(ch);
  P.cyl(0.006, 0.006, 0.5, P.std(0x3a2a1a), 0, -0.25, 0, ch, 6);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const sh = P.mesh(new THREE.ConeGeometry(0.07, 0.1, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffb060, emissiveIntensity: 1.4, side: THREE.DoubleSide }), Math.cos(a) * 0.22, -0.55, Math.sin(a) * 0.22, ch, false); void sh; }

  // interior lights
  const key = new THREE.SpotLight(0xffc888, 5, 9, 1.0, 0.8, 1.4); key.position.set(0.2, RH - 0.15, -0.3); key.target.position.set(0, 0, -0.4);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02; scene.add(key, key.target);
  const fillA = new THREE.PointLight(0xffb070, 1.8, 7, 1.6); fillA.position.set(-2.8, 1.6, -1.6); scene.add(fillA);
  const fillB = new THREE.PointLight(0xffc080, 1.5, 7, 1.6); fillB.position.set(2.5, 1.8, 1.4); scene.add(fillB);
  const candleL = new THREE.PointLight(0xffa040, 0.35, 2.5, 2); candleL.position.set(0, 1.25, -0.4); scene.add(candleL);
  const winIn = new THREE.PointLight(0xffc080, 1.2, 3, 1.6); winIn.position.set(-2.0, 1.4, 2.0); scene.add(winIn);
  scene.add(new THREE.HemisphereLight(0xffe2c0, 0x3a2a20, 0.25));

  // ---------- exterior ----------
  const sn = T.snowTex(9);
  const grd = new THREE.PlaneGeometry(120, 120, 60, 60); const gp = grd.attributes.position;
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), y = gp.getY(i); const d = Math.min(Math.abs(y + RD + 0.1), 100); gp.setZ(i, (Math.sin(x * 0.5) * 0.05 + Math.sin(y * 0.7) * 0.06) * Math.min(1, d / 6)); }
  grd.computeVertexNormals();
  const ground = new THREE.Mesh(grd, new THREE.MeshStandardMaterial({ map: sn.map, bumpMap: sn.bump, bumpScale: 2, roughness: 0.85, color: 0xd8e2f0 }));
  sn.map.repeat.set(20, 20); sn.bump.repeat.set(20, 20);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);
  // porch
  const porch = new THREE.Group(); porch.position.set((door.x0 + door.x1) / 2, 0, RD + 0.16); scene.add(porch);
  P.box(1.9, 0.3, 1.4, P.std(0x7a5a40, 0.7), 0, 0.15, 0.7, porch); P.box(1.92, 0.04, 1.42, snowM, 0, 0.31, 0.72, porch, 0.02);
  P.box(1.4, 0.15, 0.4, P.std(0x7a5a40, 0.7), 0, 0.075, 1.6, porch);
  const pl = new THREE.Group(); pl.position.set(door.x1 + 0.3, 1.9, RD + 0.18); scene.add(pl);
  P.box(0.14, 0.22, 0.14, new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xffb860, emissiveIntensity: 3 }), 0, 0, 0, pl, 0.02);
  const porchL = new THREE.PointLight(0xffb060, 2.5, 7, 1.5); porchL.position.set(door.x1 + 0.3, 1.8, RD + 0.6); scene.add(porchL);
  const pglow = P.sprite(P.glowMap(), 0xffb060, 1.0, 1.0, 0.6); pglow.position.copy(pl.position).add(new THREE.Vector3(0, 0, 0.1)); scene.add(pglow);
  const doorSpill = new THREE.SpotLight(0xffc080, 0, 10, 0.7, 0.6, 1.2); doorSpill.position.set((door.x0 + door.x1) / 2, 1.8, RD - 1.0); doorSpill.target.position.set((door.x0 + door.x1) / 2, 0, RD + 4); scene.add(doorSpill, doorSpill.target);
  const winSpill = new THREE.SpotLight(0xffb870, 18, 10, 0.55, 0.6, 1.3); winSpill.position.set((win.x0 + win.x1) / 2, 1.9, RD - 1.4); winSpill.target.position.set((win.x0 + win.x1) / 2, 0, RD + 3.5); scene.add(winSpill, winSpill.target);
  // moon
  const moon = new THREE.DirectionalLight(0x9ab8f0, 1.1); moon.position.set(12, 18, 20); moon.target.position.set(0, 0, 4);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -6, near: 1, far: 60 }); moon.shadow.bias = -0.0005;
  scene.add(moon, moon.target);
  const skyHemi = new THREE.HemisphereLight(0x4a6aa8, 0x202838, 0.25); scene.add(skyHemi);
  scene.add(P.skyDome('#03060f', '#101a30', '#1a2440'));
  scene.add(P.stars(700, 250, 9));
  // yard: snowman, fir with lights, fence, distant houses
  const sm = new THREE.Group(); sm.position.set(-4.6, 0, 6.2); scene.add(sm);
  for (const [y, rr] of [[0.32, 0.36], [0.85, 0.26], [1.24, 0.18]]) P.sph(rr, snowM, 0, y, 0, sm, 20);
  const nose = P.mesh(new THREE.ConeGeometry(0.03, 0.16, 8), P.std(0xe07020, 0.6), 0, 1.24, 0.24, sm); nose.rotation.x = Math.PI / 2;
  for (const sx of [-1, 1]) P.sph(0.022, P.std(0x111111), sx * 0.06, 1.3, 0.16, sm, 8);
  const sc = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16), P.std(0xc8202a, 0.9)); sc.rotation.x = Math.PI / 2; sc.position.y = 1.08; sm.add(sc);
  const fir = P.firTree(3.4, 4, 0.8); fir.position.set(-7.5, 0, 8.5); scene.add(fir);
  const fl = P.garland(Array.from({ length: 60 }, (_, i) => { const u = i / 59, a = u * 28; return new THREE.Vector3(Math.cos(a) * (1 - u) * 1.05, 0.7 + u * 2.4, Math.sin(a) * (1 - u) * 1.05); }), { n: 60, r: 0.04, k: 6, wire: false });
  fl.position.copy(fir.position); scene.add(fl);
  for (let i = 0; i < 26; i++) { const x = -12 + i * 1.0; if (Math.abs(x - 2.15) < 0.8) continue; P.box(0.08, 0.9, 0.04, P.std(0x6a5040, 0.8), x, 0.45, 12, scene); P.box(0.1, 0.06, 0.06, snowM, x, 0.92, 12, scene); }
  P.box(26, 0.06, 0.04, P.std(0x6a5040, 0.8), 0, 0.65, 12, scene);
  const far = new THREE.Group(); scene.add(far);
  for (let i = 0; i < 9; i++) {
    const x = -40 + i * 10 + r() * 3, z = 26 + r() * 10;
    const hb = P.box(6, 3.5, 6, P.std(0x2a2a34, 0.9), x, 1.75, z, far);
    void hb;
    for (let k = 0; k < 2; k++) { const w = P.mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffb060, emissiveIntensity: 1.6 }), x - 1.2 + k * 2.4, 1.7, z - 3.01, far, false); w.rotation.y = Math.PI; }
    const rf = P.box(6.6, 0.3, 6.6, snowM, x, 3.65, z, far); void rf;
  }
  for (let i = 0; i < 5; i++) { const l = P.lampPost(4.2, 0xffb060, false); l.position.set(-20 + i * 10, 0, 16); l.rotation.y = -Math.PI / 2; scene.add(l); }
  const snowP = P.makeSnow({ count: 5000, min: [-8, 0, 1], max: [8, 9, 18], size: 0.022, speed: 0.8, wind: 0.2 });
  scene.add(snowP);
  const fwk = P.fireworks([
    { p: [-7, 11, -24], t: 71.6, color: 0xffc040, n: 260 }, { p: [6, 13, -30], t: 72.1, color: 0xff4060, n: 260 },
    { p: [0, 14, -34], t: 72.5, color: 0x60c0ff, n: 300 },
    { p: [-6, 9, 26], t: 72.75, color: 0xffc040, n: 260 }, { p: [7, 11, 32], t: 73.2, color: 0xff4060, n: 280 },
    { p: [0, 13, 38], t: 73.7, color: 0x60c0ff, n: 300 }, { p: [-10, 10, 34], t: 74.1, color: 0x80ff90, n: 240 },
    { p: [9, 8, 24], t: 74.5, color: 0xffe0a0, n: 240 }, { p: [3, 12, 30], t: 74.9, color: 0xff70d0, n: 260 },
    { p: [-26, 9, 2], t: 72.9, color: 0xffd060, n: 280 }, { p: [-30, 12, -8], t: 73.5, color: 0xff5070, n: 280 }, { p: [-24, 8, 10], t: 74.0, color: 0x70c8ff, n: 280 }, { p: [-28, 11, -2], t: 74.6, color: 0xb0ff90, n: 260 },
  ]);
  scene.add(fwk);
  const fwLight = new THREE.PointLight(0xffe0c0, 0, 80, 1.0); fwLight.position.set(2, 14, 12); scene.add(fwLight);

  // cast
  const cast = { aiko: C.aiko(), mom: C.mom(), dad: C.dad(), grandma: C.grandma(), uncle: C.uncle(), arman: C.arman('jacket', 13), armanH: C.arman('hoodie', 14) };
  for (const c of Object.values(cast)) scene.add(c.root);
  const camB = new THREE.PerspectiveCamera(35, W / H, 0.03, 300);
  return { scene, cam, camB, cast, chairs, seats, plates, emptyPlate, paper, fridgeArt, fridge, clock, doorPivot, door, win, candles, tree, snow: snowP, fw: fwk, fwLight, doorSpill, winSpill, porchL, RD, RW, RH, items, key };
}
