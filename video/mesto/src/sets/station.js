// Set: flashback — autumn railway platform seen from the departing train (shot 12)
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { rng } from '../core.js';

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8c0a0);
  scene.fog = new THREE.Fog(0xd6b896, 12, 70);
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.03, 200);
  scene.add(new THREE.HemisphereLight(0xffe0b8, 0x6a5a48, 1.1));
  const sun = new THREE.DirectionalLight(0xffb870, 2.6); sun.position.set(-12, 9, 14); sun.target.position.set(0, 0, 2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10, near: 1, far: 60 }); sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  const r = rng(6);
  const conc = (() => { const c = T.canvas(512, 512), x = c.getContext('2d'); x.fillStyle = '#9a948a'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},0,0.04)`; x.fillRect(r() * 512, r() * 512, 2, 2); } x.strokeStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 512; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); } return T.toTex(c, { repeat: [40, 2] }); })();
  const plat = P.box(120, 1.1, 6, new THREE.MeshStandardMaterial({ map: conc, roughness: 0.9 }), 10, 0.55, 3, scene); void plat;
  P.box(120, 0.02, 0.18, P.std(0xe8c020, 0.6), 10, 1.11, 0.25, scene);
  P.box(120, 0.6, 3, P.std(0x4a3a2e, 0.95), 10, 0.3, -1.6, scene);
  for (let i = 0; i < 2; i++) P.box(120, 0.08, 0.08, P.std(0x6a6a6a, 0.4, 0.8), 10, 0.64, -1.0 - i * 1.5, scene);
  const ground = P.mesh(new THREE.PlaneGeometry(300, 200), P.std(0x6a5a3a, 0.95), 0, 0, 20, scene); ground.rotation.x = -Math.PI / 2;
  // station building
  const f = T.facade({ cols: 12, rows: 2, seed: 61, lit: 0.6, wall: '#c9a27a' });
  const bld = P.mesh(new THREE.PlaneGeometry(36, 7), new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.9 }), 4, 4.6, 9, scene); void bld;
  P.box(37, 0.6, 3, P.std(0x7a3a2a, 0.8), 4, 8.3, 8, scene);
  // canopy pillars, lamps, benches
  for (let i = -3; i < 6; i++) {
    const x = i * 6;
    P.cyl(0.08, 0.08, 3.4, P.std(0x2a3a3a, 0.5, 0.5), x, 2.8, 5.0, scene, 10);
    const l = P.lampPost(3.3, 0xffe0b0, false); l.position.set(x + 3, 1.1, 1.2); l.rotation.y = Math.PI / 2; scene.add(l);
    if (i % 2 === 0) { const b = new THREE.Group(); b.position.set(x + 1.5, 1.1, 3.6); scene.add(b); P.box(1.6, 0.06, 0.4, P.std(0x6a4a30), 0, 0.45, 0, b); P.box(1.6, 0.4, 0.05, P.std(0x6a4a30), 0, 0.72, -0.18, b); for (const xx of [-0.7, 0.7]) P.box(0.06, 0.45, 0.35, P.std(0x2a2a2a), xx, 0.22, 0, b); }
  }
  P.box(60, 0.15, 3.4, P.std(0x3a4a48, 0.6, 0.3), 4, 4.55, 5.2, scene);
  // autumn trees
  const leafCols = [0xe3a21a, 0xd9661f, 0xf2c12e, 0xc8502a];
  for (let i = 0; i < 14; i++) {
    const x = -24 + i * 4.2 + r() * 2, z = 12 + r() * 6;
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    P.cyl(0.15, 0.22, 4, P.std(0x3a2a1e), 0, 2, 0, g, 8);
    for (let k = 0; k < 7; k++) P.sph(1.0 + r() * 0.7, P.std(leafCols[(i + k) % 4], 0.9), (r() - 0.5) * 2.2, 4.2 + r() * 2.2, (r() - 0.5) * 2.2, g, 12);
  }
  // falling leaves (instanced)
  const lt = T.leafTex(2);
  const N = 160, leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshStandardMaterial({ map: lt, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 }), N);
  const seeds = Array.from({ length: N }, () => [r() * 40 - 12, r() * 6 + 1.2, r() * 5 + 0.3, r() * 6.28, 0.3 + r() * 0.5]);
  leaves.setTime = t => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    seeds.forEach(([x, y, z, ph, sp], i) => {
      const yy = 1.15 + ((y - t * sp) % 6 + 6) % 6;
      e.set(t * 2 + ph, t * 1.3 + ph, t * 0.7);
      m.compose(new THREE.Vector3(x + Math.sin(t * 1.2 + ph) * 0.5 + t * 0.3, yy, z + Math.cos(t + ph) * 0.3), q.setFromEuler(e), new THREE.Vector3(1, 1, 1));
      leaves.setMatrixAt(i, m);
    });
    leaves.instanceMatrix.needsUpdate = true;
  };
  scene.add(leaves);
  // leaves on platform
  const lm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.09), leaves.material, 400);
  for (let i = 0; i < 400; i++) { const m = new THREE.Matrix4().makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationY(r() * 6)).setPosition(r() * 60 - 20, 1.105, 0.4 + r() * 5); lm.setMatrixAt(i, m); }
  scene.add(lm);
  // train window frame (attached to train, i.e. to a group moved with camera)
  const train = new THREE.Group(); scene.add(train);
  const sh = new THREE.Shape(); sh.moveTo(-3, -2); sh.lineTo(3, -2); sh.lineTo(3, 2); sh.lineTo(-3, 2); sh.closePath();
  const hole = new THREE.Path(); const ww = 1.05, wh = 0.72, rr = 0.12;
  hole.moveTo(-ww / 2 + rr, -wh / 2); hole.lineTo(ww / 2 - rr, -wh / 2); hole.quadraticCurveTo(ww / 2, -wh / 2, ww / 2, -wh / 2 + rr); hole.lineTo(ww / 2, wh / 2 - rr); hole.quadraticCurveTo(ww / 2, wh / 2, ww / 2 - rr, wh / 2); hole.lineTo(-ww / 2 + rr, wh / 2); hole.quadraticCurveTo(-ww / 2, wh / 2, -ww / 2, wh / 2 - rr); hole.lineTo(-ww / 2, -wh / 2 + rr); hole.quadraticCurveTo(-ww / 2, -wh / 2, -ww / 2 + rr, -wh / 2);
  sh.holes.push(hole);
  const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 }), P.std(0x3a3430, 0.6));
  panel.position.set(0, 1.95, -0.95); train.add(panel);
  const glass = P.mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.9, depthWrite: false }), 0, 1.95, -0.86, train, false); void glass;
  P.box(1.3, 0.05, 0.25, P.std(0x5a4a3a, 0.5), 0, 1.57, -1.05, train);
  const interiorL = new THREE.PointLight(0xffd0a0, 0.6, 3); interiorL.position.set(0, 2.3, -2); train.add(interiorL);
  const aiko = C.aiko('autumn', 32), mom = C.mom('coat');
  scene.add(aiko.root, mom.root);
  return { scene, cam, aiko, mom, train, leaves };
}
