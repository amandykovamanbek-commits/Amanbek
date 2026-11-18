// Set: night highway, taxi in the snow (shot 16) + taxi interior
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { rng } from '../core.js';

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080f);
  scene.fog = new THREE.FogExp2(0x0a1020, 0.022);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 400);
  const r = rng(16);
  scene.add(new THREE.HemisphereLight(0x3a5080, 0x101418, 0.35));
  const sn = T.snowTex(13);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 1600), new THREE.MeshStandardMaterial({ map: sn.map, bumpMap: sn.bump, bumpScale: 2, roughness: 0.85, color: 0xb8c4d8 }));
  sn.map.repeat.set(20, 160); sn.bump.repeat.set(20, 160);
  ground.rotation.x = -Math.PI / 2; ground.position.z = -700; scene.add(ground);
  const asphalt = (() => { const c = T.canvas(256, 1024), x = c.getContext('2d'); x.fillStyle = '#23262c'; x.fillRect(0, 0, 256, 1024); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * 256, r() * 1024, 2, 2); } x.fillStyle = '#d8d8d0'; for (let y = 0; y < 1024; y += 128) x.fillRect(124, y, 8, 64); x.fillRect(6, 0, 6, 1024); x.fillRect(244, 0, 6, 1024); x.fillStyle = 'rgba(230,236,245,0.5)'; x.fillRect(0, 0, 14, 1024); x.fillRect(242, 0, 14, 1024); return T.toTex(c, { repeat: [1, 40] }); })();
  const road = P.mesh(new THREE.PlaneGeometry(9, 1600), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.4, metalness: 0.15 }), 0, 0.01, -700, scene); road.rotation.x = -Math.PI / 2;
  for (const sx of [-1, 1]) P.box(1.2, 0.5, 1600, P.std(0xdfe6f0, 0.9), sx * 5.4, 0.2, -700, scene, 0.2);
  // forest walls
  for (let i = 0; i < 160; i++) { const sx = r() < 0.5 ? -1 : 1; const t = P.firTree(5 + r() * 5, i, 0.5); t.position.set(sx * (10 + r() * 14), 0, 40 - i * 10 - r() * 6); scene.add(t); }
  // lamps every 30 m both sides
  const lampZ = [];
  for (let i = 0; i < 50; i++) for (const sx of [-1, 1]) { const z = 30 - i * 30 - (sx > 0 ? 15 : 0); const l = P.lampPost(8, 0xffa850, false); l.position.set(sx * 5.8, 0, z); l.rotation.y = sx > 0 ? Math.PI : 0; l.scale.set(1, 1, 1); scene.add(l); lampZ.push([sx, z]); }
  const lampLights = [0, 1, 2].map(() => { const L = new THREE.PointLight(0xffa850, 40, 30, 1.4); scene.add(L); return L; });
  // taxi + interior mock
  const taxi = P.taxi(); scene.add(taxi);
  const exterior = [...taxi.children];
  const interior = new THREE.Group(); taxi.add(interior);
  const im = P.std(0x1a1a1c, 0.8);
  P.box(1.5, 0.45, 0.6, im, 0, 0.22, -1.0, interior, 0.06);
  P.box(1.5, 0.75, 0.15, im, 0, 0.75, -1.3, interior, 0.06);
  for (const sx of [-0.4, 0.4]) P.box(0.55, 0.85, 0.15, im, sx, 0.75, 0.15, interior, 0.06);
  P.box(1.6, 0.04, 2.6, P.std(0x2a2a2c, 0.9), 0, 1.62, -0.4, interior);
  P.box(0.04, 0.5, 2.4, im, 0.8, 1.35, -0.4, interior);
  const doorPanel = new THREE.Shape(); doorPanel.moveTo(-1.2, -0.5); doorPanel.lineTo(1.2, -0.5); doorPanel.lineTo(1.2, 0.6); doorPanel.lineTo(-1.2, 0.6); doorPanel.closePath();
  const hole = new THREE.Path(); hole.moveTo(-0.55, 0.05); hole.lineTo(0.5, 0.05); hole.lineTo(0.4, 0.45); hole.lineTo(-0.45, 0.45); hole.closePath(); doorPanel.holes.push(hole);
  const dp = new THREE.Mesh(new THREE.ShapeGeometry(doorPanel), P.std(0x222224, 0.7)); dp.material.side = THREE.DoubleSide; dp.rotation.y = Math.PI / 2; dp.position.set(-0.78, 0.95, -0.85); interior.add(dp);
  interior.visible = false;
  const arman = C.arman('jacket', 16); taxi.add(arman.root);
  const passLight = new THREE.PointLight(0xffa040, 0, 5, 1.6); taxi.add(passLight);
  const dash = new THREE.PointLight(0x9ab8ff, 0.5, 2.2, 1.6); dash.position.set(0.2, 1.3, -0.35); taxi.add(dash); interior.add(dash);
  // streaking snow: line segments relative to the car
  const N = 1500, pos = new Float32Array(N * 6), seeds = Array.from({ length: N }, () => [r() * 16 - 8, r() * 7, r() * 80]);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const streak = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  streak.frustumCulled = false; scene.add(streak);
  streak.update = (carZ, speed, t) => {
    seeds.forEach(([x, y, z], i) => {
      const zz = carZ + 25 - ((z + t * speed) % 80);
      const yy = ((y - t * 1.5) % 7 + 7) % 7;
      pos.set([x, yy, zz, x, yy + 0.02, zz - speed * 0.012], i * 6);
    });
    sg.attributes.position.needsUpdate = true;
  };
  return { scene, cam, taxi, interior, exterior, arman, passLight, lampLights, lampZ, streak };
}
