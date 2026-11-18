// Set: night city courtyard of panel buildings (shot 1). One dark window with Arman inside.
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { rng } from '../core.js';

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c1626, 0.011);
  scene.background = new THREE.Color(0x0a1220);
  const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 600);
  scene.add(P.skyDome('#04070f', '#16233a', '#1e2c44'));
  scene.add(P.stars(500, 300));
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), new THREE.MeshBasicMaterial({ map: T.cloudTex(3), transparent: true, opacity: 0.35, side: THREE.BackSide, fog: false, depthWrite: false, color: 0x6a7fa8 }));
  scene.add(clouds);
  scene.add(new THREE.HemisphereLight(0x5a78b0, 0x1a1f2a, 0.55));
  const moon = new THREE.DirectionalLight(0x9cb8ff, 0.6); moon.position.set(-30, 60, 40); scene.add(moon);

  const snow = T.snowTex(2);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: snow.map, bumpMap: snow.bump, bumpScale: 2, roughness: 0.9, color: 0xc8d4e8 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  snow.map.repeat.set(40, 40); snow.bump.repeat.set(40, 40);

  // main building with target window: 8 cols x 9 rows, col 3, row 5 from top (6th floor from bottom => row index 3 from top)
  const cols = 8, rows = 9, cw = 3.2, rh = 2.8;
  const tgt = { col: 4, row: 3 };
  const mkBuilding = (seed, target, lit, wall) => {
    const f = T.facade({ cols, rows, seed, target, lit, wall });
    const g = new THREE.Group();
    const Wd = cols * cw, Ht = rows * rh, D = 12;
    const side = new THREE.MeshStandardMaterial({ color: 0x8e8a84, roughness: 0.95 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Ht), new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 1.25, roughness: 0.9, alphaTest: 0.5, transparent: false }));
    front.position.set(0, Ht / 2 + 0.6, D / 2); g.add(front);
    const back = P.box(Wd, Ht, D - 0.02, side, 0, Ht / 2 + 0.6, 0, g); back.material = side;
    if (target) { // cut the box face so the room behind the window is visible: shrink box depth
      back.scale.z = 0.5; back.position.z = -D / 4;
      for (const sx of [-1, 1]) P.box(0.2, Ht, D / 2, side, sx * (Wd / 2 - 0.1), Ht / 2 + 0.6, D / 4 - 0.01, g);
      P.box(Wd, 0.6, D / 2, side, 0, 0.3, D / 4, g);
      P.box(Wd, 0.3, D / 2, side, 0, Ht + 0.75, D / 4, g);
    }
    P.box(Wd + 0.3, 0.25, D + 0.3, P.std(0xeef2f8, 0.8), 0, Ht + 0.72, 0, g, 0.08);
    P.box(Wd, 0.6, D, P.std(0x5a5650, 0.9), 0, 0.3, 0, g);
    // entrance canopies
    for (const x of [-8, 0, 8]) { P.box(2.2, 0.12, 1.4, P.std(0x6a6660), x, 2.9, D / 2 + 0.7, g); P.box(2.3, 0.1, 1.5, P.std(0xf2f5fa, 0.8), x, 3.0, D / 2 + 0.7, g, 0.04); const l = P.sprite(P.glowMap(), 0xffc580, 1.5, 1.5, 0.6); l.position.set(x, 2.7, D / 2 + 0.4); g.add(l); }
    return { g, Wd, Ht, D };
  };
  const main = mkBuilding(11, tgt, 0.93, '#b9b2a6');
  scene.add(main.g);
  // room behind target window
  const wx = (tgt.col + 0.5) * cw - main.Wd / 2, wy = main.Ht + 0.6 - (tgt.row + 0.5) * rh + rh * 0.02;
  const room = new THREE.Group(); room.position.set(wx, wy - rh / 2 + 0.05, main.D / 2); scene.add(room);
  const rmat = new THREE.MeshStandardMaterial({ color: 0x2a3446, roughness: 0.95, side: THREE.BackSide });
  const rb = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.1, rh - 0.1, 3.4), rmat); rb.position.set(0, rh / 2, -1.72); room.add(rb);
  const desk = P.table(1.3, 0.6, 0.75, P.std(0x5a4636, 0.7)); desk.position.set(0, 0, -0.45); room.add(desk);
  const lapTex = new THREE.CanvasTexture(T.spreadsheet(0)); lapTex.colorSpace = THREE.SRGBColorSpace;
  const lap = P.laptop(lapTex); lap.position.set(0, 0.75, -0.4); lap.rotation.y = Math.PI; room.add(lap);
  const arman = C.arman('hoodie', 12); arman.place(0, 0, -1.15, 0); room.add(arman.root);
  const ch = P.chair(P.std(0x2a2a2a, 0.6)); ch.position.set(0, 0, -1.2); room.add(ch);
  const glowL = new THREE.PointLight(0x8fb8ff, 0.9, 2.5, 1.5); glowL.position.set(0, 1.0, -0.6); room.add(glowL);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(cw * 0.56, rh * 0.52), new THREE.MeshStandardMaterial({ color: 0x223044, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.6 }));
  glass.position.set(wx, main.Ht + 0.6 - (tgt.row + 0.5) * rh - rh * 0.02 + 0.0, main.D / 2 + 0.01); scene.add(glass);
  const target = new THREE.Vector3(wx, glass.position.y, main.D / 2);

  // neighbours
  const nb = [[-34, 8, 0.5, 21], [34, 8, -0.5, 22], [-20, -40, 0.1, 23], [22, -46, -0.15, 24], [60, -20, -0.9, 25], [-62, -18, 0.9, 26]];
  for (const [x, z, ry, seed] of nb) { const b = mkBuilding(seed, null, 0.88, '#aaa398'); b.g.position.set(x, 0, z); b.g.rotation.y = ry; scene.add(b.g); }
  // yard dressing
  const r = rng(9);
  const carCols = [0x7a2a2a, 0x2a3a5a, 0x8a8f99, 0x1a1a1a, 0xc8c8c8, 0x3a4a3a];
  for (let i = 0; i < 7; i++) { const c = P.car(carCols[i % 6], 0.1 + r() * 0.06, i); c.position.set(-14 + i * 4.3, 0, 13.5 + (i % 2) * 0.3); c.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.08; scene.add(c); }
  for (const [x, z] of [[-10, 18], [6, 18], [20, 17]]) { const l = P.lampPost(4.6, 0xffb062, true, 30); l.position.set(x, 0, z); l.rotation.y = Math.PI / 2; scene.add(l); }
  for (const [x, z, h] of [[-16, 21, 5], [-4, 23, 6], [12, 22, 5.5], [24, 24, 4.5], [-24, 15, 5]]) { const t = P.bareTree(h, x * 7 + z); t.position.set(x, 0, z); scene.add(t); }
  // garland over the yard entrance + a lit fir
  scene.add(P.sagGarland(new THREE.Vector3(-6, 4.5, 20), new THREE.Vector3(6, 4.5, 20), 0.8, { n: 46, r: 0.06, k: 5 }));
  const fir = P.firTree(4, 3, 0.7); fir.position.set(-2, 0, 22); scene.add(fir);
  const fl = P.garland(Array.from({ length: 60 }, (_, i) => { const u = i / 59, a = u * 30; return new THREE.Vector3(Math.cos(a) * (1 - u) * 1.2, 0.8 + u * 3, Math.sin(a) * (1 - u) * 1.2); }), { n: 50, r: 0.05, k: 5, wire: false });
  fl.position.copy(fir.position); scene.add(fl);
  const snowP = P.makeSnow({ count: 9000, min: [-25, 0, -5], max: [25, 30, 45], size: 0.05, speed: 1.1, wind: 0.3 });
  scene.add(snowP);

  return { scene, cam, arman, target, lap, lapTex, snow: snowP, room, wx, wy };
}
