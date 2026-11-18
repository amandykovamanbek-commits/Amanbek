// Set: flashback courtyard at sunset — snow angels (shot 6)
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { rng } from '../core.js';

function angelDecal(len, armR, seed) {
  const c = T.canvas(512, 512), x = c.getContext('2d'), r = rng(seed);
  x.clearRect(0, 0, 512, 512);
  const cx = 256, cy = 256, k = 512 / 2.4; // 2.4 m square
  x.filter = 'blur(6px)';
  const fill = 'rgba(70,95,150,0.55)';
  x.fillStyle = fill;
  // body (feet at bottom, head at top): center at cy
  x.beginPath(); x.ellipse(cx, cy, 0.17 * len * k / 1.0, 0.36 * len * k, 0, 0, 7); x.fill();
  x.beginPath(); x.arc(cx, cy - 0.45 * len * k, 0.12 * len * k, 0, 7); x.fill();
  // arm fans from shoulders
  for (const s of [-1, 1]) {
    const sx = cx + s * 0.1 * len * k, sy = cy - 0.27 * len * k;
    x.beginPath(); x.moveTo(sx, sy);
    for (let a = 0.2; a <= 2.5; a += 0.05) x.lineTo(sx + s * Math.sin(a) * armR * k, sy + Math.cos(a) * armR * k);
    x.closePath(); x.fill();
  }
  // leg fan from hips
  x.beginPath(); x.moveTo(cx, cy + 0.02 * len * k);
  for (let a = -0.5; a <= 0.5; a += 0.05) x.lineTo(cx + Math.sin(a) * 0.52 * len * k, cy + Math.cos(a) * 0.52 * len * k);
  x.closePath(); x.fill();
  x.filter = 'none';
  // crisp rim highlight
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(40,60,110,0.25)';
  for (let i = 0; i < 400; i++) x.fillRect(r() * 512, r() * 512, 2, 2);
  return T.toTex(c);
}

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb6d8);
  scene.fog = new THREE.Fog(0xc7b8a8, 8, 30);
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 80);
  const sn = T.snowTex(5);
  const gg = new THREE.PlaneGeometry(30, 30, 120, 120); const gp = gg.attributes.position, r = rng(4);
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), y = gp.getY(i); gp.setZ(i, Math.sin(x * 0.7) * 0.03 + Math.sin(y * 1.1 + 1) * 0.025 + Math.sin(x * 2.3 + y * 1.7) * 0.01); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: sn.map, bumpMap: sn.bump, bumpScale: 3, roughness: 0.85, color: 0xffffff }));
  sn.map.repeat.set(8, 8); sn.bump.repeat.set(8, 8);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  scene.add(new THREE.HemisphereLight(0x8aa8e0, 0xf0d8c0, 0.95));
  const sun = new THREE.DirectionalLight(0xffae62, 3.4); sun.position.set(-9, 2.6, 6); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const teen = C.teenArman(), tod = C.aiko('toddler');
  scene.add(teen.root, tod.root);
  const d1 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ map: angelDecal(1.72, 0.78, 3), transparent: true, depthWrite: false, roughness: 0.9 }));
  d1.rotation.x = -Math.PI / 2; d1.position.set(-0.55, 0.012, 0.85 - 0.86); scene.add(d1);
  const d2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ map: angelDecal(0.92, 0.42, 5), transparent: true, depthWrite: false, roughness: 0.9 }));
  d2.rotation.x = -Math.PI / 2; d2.position.set(0.5, 0.012, 0.35 - 0.46); scene.add(d2);
  // footprints trail
  const fpTex = (() => { const c = T.canvas(64, 128), x = c.getContext('2d'); x.filter = 'blur(2px)'; x.fillStyle = 'rgba(60,85,140,0.6)'; x.beginPath(); x.ellipse(32, 64, 18, 44, 0, 0, 7); x.fill(); return T.toTex(c); })();
  const fpm = new THREE.MeshStandardMaterial({ map: fpTex, transparent: true, depthWrite: false });
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.28), fpm); f.rotation.x = -Math.PI / 2; f.rotation.z = 0.25;
    f.position.set(1.6 + i * 0.32 + s * 0.07, 0.011, 2.2 + i * 0.12 + (s > 0 ? 0.15 : 0)); scene.add(f);
  }
  // sled
  const sled = new THREE.Group(); sled.position.set(1.45, 0.06, 1.1); sled.rotation.y = 0.7; scene.add(sled);
  P.box(0.42, 0.04, 0.85, P.std(0xc8282c, 0.45), 0, 0.1, 0, sled, 0.02);
  for (const s of [-1, 1]) { P.box(0.03, 0.04, 0.95, P.std(0x666a70, 0.3, 0.8), s * 0.18, 0.02, 0.02, sled); for (const z of [-0.3, 0.3]) P.box(0.025, 0.08, 0.025, P.std(0x666a70, 0.3, 0.8), s * 0.18, 0.06, z, sled); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 0.42), new THREE.Vector3(0.2, 0.02, 0.8), new THREE.Vector3(-0.1, 0.01, 1.2), new THREE.Vector3(-0.4, 0.01, 1.3)]), 20, 0.008, 5), P.std(0xe0c890));
  sled.add(rope);
  const mit = P.sph(0.05, P.std(0xf3eee6, 0.9), 1.0, 0.03, -0.9, scene, 12); mit.scale.set(1, 0.5, 1.4);
  // trees casting long shadows + bench
  for (const [x, z, h] of [[-5.5, 3.5, 5], [-6, -2.5, 6], [-3.5, 8, 4.5]]) { const tr = P.bareTree(h, x * 3 + z, true); tr.position.set(x, 0, z); scene.add(tr); }
  const bench = new THREE.Group(); bench.position.set(-2.6, 0, -1.9); bench.rotation.y = 0.3; scene.add(bench);
  P.box(1.6, 0.06, 0.4, P.std(0x6a4a30), 0, 0.45, 0, bench); P.box(1.62, 0.08, 0.42, P.std(0xf4f6fa, 0.85), 0, 0.51, 0, bench, 0.03);
  for (const x of [-0.7, 0.7]) P.box(0.06, 0.45, 0.35, P.std(0x2a2a2a), x, 0.22, 0, bench);
  const flakes = P.makeSnow({ count: 900, min: [-4, 0, -4], max: [4, 5, 4], size: 0.03, speed: 0.35, wind: 0.1, color: 0xfff2dc });
  scene.add(flakes);
  return { scene, cam, teen, tod, flakes, sun };
}
