// Set: festive night street — Arman runs (shot 15)
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { rng } from '../core.js';

function shopTex(name, seed) {
  const c = T.canvas(512, 384), x = c.getContext('2d'), r = rng(seed);
  const g = x.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#ffcf8a'); g.addColorStop(1, '#ff9a48');
  x.fillStyle = g; x.fillRect(0, 0, 512, 384);
  for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(${120 + r() * 100},${60 + r() * 60},${30},0.5)`; x.fillRect(20 + i * 55, 200 + r() * 60, 40, 140); }
  for (let i = 0; i < 14; i++) { x.fillStyle = ['#ff4040', '#ffe060', '#60c0ff', '#ff80ff'][i % 4]; x.beginPath(); x.arc(20 + i * 36, 18 + Math.sin(i) * 6, 6, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(60,20,10,0.85)'; x.fillRect(0, 300, 512, 84);
  return T.toTex(c);
}
function signTex(text, col) {
  const c = T.canvas(512, 128), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 512, 128);
  x.font = '600 76px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 18; x.fillText(text, 256, 66);
  return T.toTex(c);
}

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070c18);
  scene.fog = new THREE.FogExp2(0x0b1424, 0.03);
  const cam = new THREE.PerspectiveCamera(26, W / H, 0.05, 300);
  const r = rng(15);
  scene.add(new THREE.HemisphereLight(0x5a78b0, 0x1a1f2a, 0.5));
  const moon = new THREE.DirectionalLight(0x8fb0f0, 0.5); moon.position.set(-10, 20, -12); scene.add(moon);
  const sn = T.snowTex(11);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 60), new THREE.MeshStandardMaterial({ map: sn.map, bumpMap: sn.bump, bumpScale: 2, roughness: 0.8, color: 0xc8d2e4 }));
  sn.map.repeat.set(60, 9); sn.bump.repeat.set(60, 9);
  ground.rotation.x = -Math.PI / 2; ground.position.set(60, 0, 0); ground.receiveShadow = true; scene.add(ground);
  const road = P.mesh(new THREE.PlaneGeometry(400, 9), P.std(0x2a2e36, 0.45, 0.1), 60, 0.005, -4.6, scene); road.rotation.x = -Math.PI / 2;
  P.box(400, 0.15, 0.25, P.std(0x8a8c90, 0.8), 60, 0.07, -0.1, scene);
  P.box(400, 0.3, 0.6, P.std(0xe8eef6, 0.9), 60, 0.15, -0.55, scene, 0.1);
  // buildings with shops (behind the sidewalk, z = 4.2)
  const names = [['КАФЕ', '#ffb070'], ['ЦВЕТЫ', '#ff6fa0'], ['ПРОДУКТЫ', '#7fd8ff'], ['АПТЕКА', '#7fff9a'], ['ПЕКАРНЯ', '#ffd36a'], ['ПОДАРКИ', '#ff7a5a']];
  for (let i = 0; i < 18; i++) {
    const x0 = -20 + i * 9;
    const f = T.facade({ cols: 3, rows: 4, seed: 70 + i, lit: 0.9, wall: ['#9a8f84', '#8a96a0', '#a0907a'][i % 3] });
    const up = P.mesh(new THREE.PlaneGeometry(9, 12), new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.9 }), x0, 9.5, 4.2, scene, false); up.rotation.y = Math.PI;
    up.rotation.y = 0; up.position.z = 4.2; up.scale.x = -1; up.rotation.y = Math.PI; up.scale.x = 1; up.rotation.y = 0; up.position.z = 4.21;
    up.rotation.y = Math.PI; up.rotation.y = 0;
    up.material.side = THREE.DoubleSide; up.lookAt(x0, 9.5, -10);
    P.box(9, 3.5, 0.3, P.std(0x4a4440, 0.9), x0, 1.75, 4.35, scene);
    const shop = P.mesh(new THREE.PlaneGeometry(6.5, 2.4), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveMap: shopTex('', i), emissiveIntensity: 0.65 }), x0 - 0.5, 1.5, 4.18, scene, false); shop.lookAt(x0 - 0.5, 1.5, -10);
    const [nm, col] = names[i % names.length];
    const sign = P.mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveMap: signTex(nm, col), emissiveIntensity: 2.5 }), x0 - 0.5, 3.2, 4.15, scene, false); sign.lookAt(x0 - 0.5, 3.2, -10);
    const L = new THREE.PointLight(0xffb070, 1.6, 5, 1.6); L.position.set(x0 - 0.5, 1.4, 3.4); scene.add(L);
    if (i % 2 === 0) { const ft = P.firTree(1.6, i, 0.3); ft.position.set(x0 + 3.6, 0, 3.4); scene.add(ft); const fl = P.garland(Array.from({ length: 30 }, (_, k) => { const u = k / 29, a = u * 22; return new THREE.Vector3(Math.cos(a) * (1 - u) * 0.5, 0.3 + u * 1.2, Math.sin(a) * (1 - u) * 0.5); }), { n: 26, r: 0.025, k: 6, wire: false }); fl.position.copy(ft.position); scene.add(fl); }
  }
  // lamps along the curb (foreground parallax) + garlands across the street
  for (let i = 0; i < 16; i++) {
    const x = -16 + i * 11;
    const l = P.lampPost(4.4, 0xffc070, i % 3 === 0, 14); l.position.set(x, 0, 0.15); l.rotation.y = Math.PI / 2; scene.add(l);
    scene.add(P.sagGarland(new THREE.Vector3(x, 4.2, 0.2), new THREE.Vector3(x + 5.5, 6.5, 4.1), 0.6, { n: 26, r: 0.04, k: 3 }));
    scene.add(P.sagGarland(new THREE.Vector3(x, 4.3, 0.2), new THREE.Vector3(x, 5.5, -9.5), 1.0, { n: 40, r: 0.045, k: 3, warm: i % 2 === 0 }));
  }
  // cars along the far curb
  for (let i = 0; i < 9; i++) { const c = P.car([0x7a2a2a, 0x2a3a5a, 0x8a8f99, 0x1a1a1a][i % 4], 0.12, i); c.position.set(-12 + i * 17 + r() * 4, 0, -7.4); c.rotation.y = Math.PI / 2; scene.add(c); }
  const arman = C.arman('jacket', 15); scene.add(arman.root);
  const snowP = P.makeSnow({ count: 7000, min: [-10, 0, -10], max: [10, 9, 6], size: 0.04, speed: 1.0, wind: 0.2 });
  scene.add(snowP);
  // breath puffs
  const puffs = Array.from({ length: 10 }, () => { const s = P.sprite(P.glowMap(), 0xdfe8ff, 0.2, 0.2, 0, false); scene.add(s); return s; });
  return { scene, cam, arman, snow: snowP, puffs };
}
