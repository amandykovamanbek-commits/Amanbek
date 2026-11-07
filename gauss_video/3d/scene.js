import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const P = new URLSearchParams(location.search);
const W = +(P.get('w') || 1080), H = +(P.get('h') || 1920);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.22, 0.5, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------ helpers
const rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const ease = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const backOut = x => { x = Math.min(1, Math.max(0, x)); const c = 1.70158; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const lerp = (a, b, u) => a + (b - a) * u;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const gradTex = (() => {
  const d = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: gradTex });
const std = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const basic = c => new THREE.MeshBasicMaterial({ color: c });
const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x1b1311, side: THREE.BackSide });

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.userData = { canvas: c, g }; return t;
}

function mesh(geo, mat, pos = [0, 0, 0], scale = [1, 1, 1], parent = null, opt = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.scale.set(...scale);
  m.castShadow = opt.cast !== false; m.receiveShadow = opt.receive !== false;
  if (opt.outline) {
    const o = new THREE.Mesh(geo, OUTLINE);
    const k = opt.outline;
    o.scale.set(1 + k / scale[0], 1 + k / scale[1], 1 + k / scale[2]);
    o.castShadow = false; m.add(o);
  }
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const SPH = new THREE.SphereGeometry(1, 40, 28);
const SPH_LO = new THREE.SphereGeometry(1, 18, 12);
const HEMI = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 18);

// ------------------------------------------------------------ characters
const SKIN = 0xf6eadb;
function makeChar(o) {
  const root = new THREE.Group();
  const bodyCol = new THREE.Color(o.body);
  const armCol = bodyCol.clone().multiplyScalar(0.78);
  const ch = { root, o };
  // legs (pivot at hip)
  ch.legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.22, 1.05, 0); root.add(hip);
    mesh(CYL, basic(0x1b1311), [0, -0.5, 0], [0.07, 1.0, 0.07], hip);
    mesh(SPH_LO, basic(0x1b1311), [0, -1.0, 0.1], [0.17, 0.1, 0.24], hip);
    ch.legs.push(hip);
  }
  // body
  const body = mesh(new THREE.CapsuleGeometry(0.5, 0.95, 8, 24), toon(o.body), [0, 1.95, 0], [1, 1, 1], root, { outline: 0.05 });
  ch.body = body;
  mesh(new THREE.CylinderGeometry(0.33, 0.42, 0.18, 24), toon(0xf3f0e8), [0, 2.85, 0.02], [1, 1, 1], root, { outline: 0.03 }); // collar
  for (let k = 0; k < 3; k++) mesh(SPH_LO, basic(0x2a1e1a), [0, 2.55 - k * 0.32, 0.5], [0.045, 0.045, 0.03], root);
  // arms
  ch.arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.47, 2.6, 0); root.add(sh);
    mesh(new THREE.CapsuleGeometry(0.1, 0.75, 6, 12), toon(armCol), [0, -0.45, 0], [1, 1, 1], sh, { outline: 0.03 });
    mesh(SPH_LO, toon(SKIN), [0, -0.95, 0], [0.13, 0.13, 0.13], sh, { outline: 0.03 });
    sh.rotation.z = sx * 0.18;
    ch.arms.push(sh);
  }
  // head
  const head = new THREE.Group(); head.position.set(0, 3.78, 0); root.add(head); ch.head = head;
  mesh(SPH, toon(SKIN), [0, 0, 0], [1, 1, 1], head, { outline: 0.045 });
  // blush
  const blush = new THREE.MeshBasicMaterial({ color: 0xf29c9c, transparent: true, opacity: 0.45, depthWrite: false });
  for (const sx of [-1, 1]) mesh(SPH_LO, blush, [sx * 0.52, -0.25, 0.83], [0.15, 0.08, 0.04], head, { cast: false });
  // eyes
  ch.eyes = []; ch.pupils = []; ch.lids = []; ch.brows = [];
  for (const sx of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sx * 0.34, 0.08, 0.9); eg.rotation.y = sx * 0.33; head.add(eg);
    mesh(SPH, basic(0x1b1311), [0, 0, -0.02], [0.23, 0.28, 0.08], eg, { cast: false });
    mesh(SPH, basic(0xffffff), [0, 0, 0], [0.2, 0.25, 0.09], eg, { cast: false });
    const pg = new THREE.Group(); pg.position.set(0, 0, 0.075); eg.add(pg);
    mesh(SPH_LO, basic(0x120c0a), [0, 0, 0], [0.09, 0.09, 0.03], pg, { cast: false });
    mesh(SPH_LO, basic(0xffffff), [0.03, 0.035, 0.02], [0.028, 0.028, 0.01], pg, { cast: false });
    const lid = mesh(HEMI, toon(SKIN), [0, 0, 0.005], [0.235, 0.29, 0.1], eg, { cast: false });
    const lidLine = mesh(box(0.47, 0.035, 0.03), basic(0x1b1311), [0, 0, 0.09], [1, 1, 1], eg, { cast: false });
    lid.add(lidLine); lidLine.position.set(0, 0, 0.9); lidLine.scale.set(1 / 0.235 * 0.22, 1 / 0.29, 1 / 0.1);
    const brow = mesh(box(0.3, 0.06, 0.05), basic(0x1b1311), [0, 0.42, 0.03], [1, 1, 1], eg, { cast: false });
    ch.eyes.push(eg); ch.pupils.push(pg); ch.lids.push(lid); ch.brows.push(brow);
  }
  // mouths
  const mz = o.beard ? 1.12 : 0.93, my = o.beard ? -0.42 : -0.43;
  const mg = new THREE.Group(); mg.position.set(0, my, mz); mg.rotation.x = -0.3; head.add(mg);
  const tor = (arc, r = 0.17) => new THREE.TorusGeometry(r, 0.034, 8, 24, arc);
  ch.mouths = {
    smile: mesh(tor(Math.PI), basic(0x1b1311), [0, 0.05, 0], [1, 1, 1], mg, { cast: false }),
    grin: mesh(new THREE.CircleGeometry(0.2, 24, Math.PI, Math.PI), basic(0x5a1f1f), [0, 0.04, 0], [1, 1, 1], mg, { cast: false }),
    smirk: mesh(tor(Math.PI * 0.55, 0.15), basic(0x1b1311), [0.06, 0.04, 0], [1, 1, 1], mg, { cast: false }),
    open: mesh(SPH_LO, basic(0x5a1f1f), [0, 0, 0], [0.11, 0.15, 0.04], mg, { cast: false }),
    line: mesh(box(0.22, 0.04, 0.03), basic(0x1b1311), [0, 0, 0], [1, 1, 1], mg, { cast: false }),
    frown: mesh(tor(Math.PI, 0.13), basic(0x1b1311), [0, -0.08, 0], [1, 1, 1], mg, { cast: false }),
  };
  ch.mouths.smile.rotation.z = Math.PI;
  ch.mouths.smirk.rotation.z = Math.PI * 1.15;
  // sweat
  ch.sweat = mesh(SPH_LO, new THREE.MeshStandardMaterial({ color: 0x8fd8ff, roughness: 0.1, emissive: 0x2a5a80 }),
    [0.72, 0.45, 0.62], [0.09, 0.14, 0.09], head, { cast: false });
  // hair
  const hc = toon(o.hairColor || 0x6b3e22);
  if (o.hair === 'messy') {
    const dirs = [[0, 1, 0], [0.5, 0.85, 0], [-0.5, 0.85, 0], [0.75, 0.55, -0.2], [-0.75, 0.55, -0.2], [0, 0.75, -0.6],
      [0.45, 0.6, -0.6], [-0.45, 0.6, -0.6], [0, 0.3, -0.95], [0.3, 0.85, 0.42], [-0.3, 0.85, 0.42], [0, 0.88, 0.45],
      [0.62, 0.7, 0.3], [-0.62, 0.7, 0.3]];
    for (const d of dirs) { const v = V(...d).normalize().multiplyScalar(0.9); mesh(SPH_LO, hc, [v.x, v.y, v.z], [0.4, 0.38, 0.4], head, { outline: 0.03 }); }
  } else if (o.hair === 'bowl' || o.hair === 'pony') {
    const h = mesh(HEMI, hc, [0, 0.05, -0.05], [1.07, 1.0, 1.07], head, { outline: 0.03 }); h.rotation.x = -0.45;
    if (o.hair === 'pony') mesh(SPH_LO, hc, [0, 0.2, -1.05], [0.32, 0.38, 0.32], head, { outline: 0.03 });
  } else if (o.hair === 'grey') {
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++)
      mesh(SPH_LO, hc, [sx * (0.93 - k * 0.03), 0.25 - k * 0.2, -0.15 - k * 0.05], [0.27, 0.25, 0.3], head, { outline: 0.025 });
    mesh(SPH_LO, hc, [0, 0.35, -0.9], [0.5, 0.35, 0.3], head, { outline: 0.025 });
  }
  if (o.beard) {
    mesh(SPH, toon(0xd6d2cb), [0, -0.55, 0.5], [0.78, 0.62, 0.58], head, { outline: 0.03 });
    mesh(SPH_LO, toon(0xd6d2cb), [0, -0.2, 0.86], [0.38, 0.12, 0.15], head, { outline: 0.02 }); // moustache
  }
  if (o.glasses) {
    const gm = basic(0x3b2a20);
    for (const sx of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.27, 0.028, 8, 32), gm, [sx * 0.36, 0.08, 1.0], [1, 1, 1], head, { cast: false }); r.rotation.y = sx * 0.33; }
    mesh(box(0.2, 0.03, 0.03), gm, [0, 0.12, 1.05], [1, 1, 1], head, { cast: false });
  }
  ch.crown = new THREE.Group(); ch.crown.position.set(0, 0.92, 0); ch.crown.rotation.z = 0.12; head.add(ch.crown);
  const gold = new THREE.MeshStandardMaterial({ color: 0xf7c531, metalness: 0.85, roughness: 0.25, emissive: 0x5a3a00 });
  mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.3, 32, 1, true), gold, [0, 0, 0], [1, 1, 1], ch.crown, { cast: false });
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2;
    mesh(new THREE.ConeGeometry(0.11, 0.32, 12), gold, [Math.cos(a) * 0.48, 0.3, Math.sin(a) * 0.48], [1, 1, 1], ch.crown, { cast: false });
    mesh(SPH_LO, new THREE.MeshStandardMaterial({ color: 0xe2374b, roughness: 0.2, emissive: 0x400010 }), [Math.cos(a) * 0.5, 0.02, Math.sin(a) * 0.5], [0.06, 0.06, 0.06], ch.crown, { cast: false });
  }
  ch.crown.visible = false;
  ch.set = (st = {}) => setState(ch, st);
  setState(ch, {});
  return ch;
}

function setState(ch, st) {
  const expr = st.expr || 'neutral';
  const look = st.look || [0, 0];
  const blink = !!st.blink;
  for (const k in ch.mouths) ch.mouths[k].visible = false;
  const mouthFor = { neutral: 'line', smile: 'smile', happy: 'grin', smirk: 'smirk', shock: 'open', stress: 'frown', grumpy: 'frown', proud: 'smirk' };
  ch.mouths[mouthFor[expr] || 'line'].visible = true;
  const big = expr === 'shock' ? 1.4 : 1;
  ch.eyes.forEach((eg, i) => {
    const sx = i === 0 ? -1 : 1;
    eg.scale.set(big, blink ? 0.08 : big, 1);
    const pg = ch.pupils[i];
    pg.position.x = look[0] * 0.08; pg.position.y = look[1] * 0.1;
    pg.scale.setScalar(expr === 'shock' ? 0.55 : 1);
    const lid = ch.lids[i];
    lid.visible = ['smirk', 'proud', 'grumpy', 'stress'].includes(expr);
    lid.rotation.x = expr === 'smirk' || expr === 'proud' ? 0.25 : 0.65;
    const br = ch.brows[i];
    br.position.y = expr === 'shock' ? 0.62 : 0.42;
    br.rotation.z = { grumpy: sx * 0.35, stress: -sx * 0.4, shock: -sx * 0.15, smirk: sx * 0.12, proud: -sx * 0.1 }[expr] || 0;
    br.visible = !['happy'].includes(expr);
  });
  ch.sweat.visible = !!st.sweat;
  ch.crown.visible = !!st.crown;
}

function pose(ch, p, t = 0) {
  const [L, R] = ch.arms;
  L.rotation.set(0, 0, -0.18); R.rotation.set(0, 0, 0.18);
  ch.legs.forEach(l => l.rotation.set(0, 0, 0));
  if (p === 'slate') { L.rotation.set(-1.15, 0, 0.35); R.rotation.set(-1.15, 0, -0.35); }
  if (p === 'chalk') { R.rotation.set(-2.5, 0, -0.15); }
  if (p === 'chin') { R.rotation.set(-2.2, 0, -0.75); }
  if (p === 'point') { R.rotation.set(-1.4, 0, 0.6); }
  if (p === 'cheer') { L.rotation.set(0, 0, -2.5); R.rotation.set(0, 0, 2.5); }
  if (p === 'write') { R.rotation.set(-1.2 + Math.sin(t * 14) * 0.08, 0, -0.3); L.rotation.set(-1.0, 0, 0.25); }
  if (p === 'walk') {
    const s = Math.sin(t * 9);
    ch.legs[0].rotation.x = s * 0.5; ch.legs[1].rotation.x = -s * 0.5;
  }
}

// ------------------------------------------------------------ props
function slateTex(text) {
  return canvasTex(512, 340, (g, w, h) => {
    g.fillStyle = '#26302c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`; g.fillRect(Math.random() * w, Math.random() * h, 60, 6); }
    if (text) { g.fillStyle = '#f4f2e8'; g.font = 'bold 170px "Comic Neue", Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 8); }
  });
}
function makeSlate(text) {
  const gr = new THREE.Group();
  mesh(box(1.6, 1.1, 0.1), std(0x9a6a3c, 0.7), [0, 0, 0], [1, 1, 1], gr, { outline: 0.02 });
  mesh(new THREE.PlaneGeometry(1.4, 0.92), (() => { const tx = slateTex(text); return new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0.0 }); })(), [0, 0, 0.056], [1, 1, 1], gr, { cast: false });
  return gr;
}

// ------------------------------------------------------------ room
const ROOM = { w: 30, d: 30, h: 13 };
const world = new THREE.Group(); scene.add(world);

const wallTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#efe9dc'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(120,100,80,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  const y0 = h * 0.62;
  g.fillStyle = '#7fa88e'; g.fillRect(0, y0, w, h - y0);
  for (let x = 0; x < w; x += 128) { g.strokeStyle = 'rgba(40,70,50,0.35)'; g.lineWidth = 4; g.strokeRect(x + 12, y0 + 30, 104, h - y0 - 70); }
  g.fillStyle = '#5c3a22'; g.fillRect(0, y0 - 14, w, 22); g.fillRect(0, h - 26, w, 26);
  // scuffs
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(60,40,30,${Math.random() * 0.08})`; g.beginPath(); g.ellipse(Math.random() * w, y0 + Math.random() * (h - y0), 30, 8, 0, 0, 7); g.fill(); }
}, [3, 1]);
const floorTex = canvasTex(1024, 1024, (g, w, h) => {
  const pw = 64, ph = 256;
  for (let x = 0; x < w; x += pw) for (let y = -((x / pw) % 2) * ph / 2; y < h; y += ph) {
    const v = 0.8 + Math.random() * 0.35;
    g.fillStyle = `rgb(${107 * v | 0},${46 * v | 0},${31 * v | 0})`; g.fillRect(x, y, pw, ph);
    g.strokeStyle = 'rgba(30,10,5,0.6)'; g.lineWidth = 3; g.strokeRect(x, y, pw, ph);
    for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(40,15,8,${Math.random() * 0.25})`; g.lineWidth = 1; g.beginPath(); const xx = x + Math.random() * pw; g.moveTo(xx, y); g.lineTo(xx + 3, y + ph); g.stroke(); }
  }
}, [4, 4]);

function wallMat(rx) { const t = wallTex.clone(); t.needsUpdate = true; t.repeat.set(rx, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); }

// floor & ceiling
mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }), [0, 0, 0], [1, 1, 1], world, { cast: false }).rotation.x = -Math.PI / 2;
const ceil = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), std(0xe8e0d0), [0, ROOM.h, 0], [1, 1, 1], world, { cast: false }); ceil.rotation.x = Math.PI / 2;
for (let x = -12; x <= 12; x += 6) mesh(box(0.6, 0.6, ROOM.d), std(0x6a4a30), [x, ROOM.h - 0.3, 0], [1, 1, 1], world, { cast: false }); // beams
// back wall (board side) z=-15, front wall z=+15, right wall x=+15
mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), wallMat(3), [0, ROOM.h / 2, -ROOM.d / 2], [1, 1, 1], world);
const fw = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), wallMat(3), [0, ROOM.h / 2, ROOM.d / 2], [1, 1, 1], world); fw.rotation.y = Math.PI;
const rw = mesh(new THREE.PlaneGeometry(ROOM.d, ROOM.h), wallMat(3), [ROOM.w / 2, ROOM.h / 2, 0], [1, 1, 1], world); rw.rotation.y = -Math.PI / 2;
// left wall with 3 window openings (built from boxes so sun shafts pass through)
const LW = new THREE.Group(); world.add(LW);
const winZ = [-9, -1, 7], winW = 4.2, winY0 = 4.0, winY1 = 10.5;
const lwMat = wallMat(1);
const addLW = (z0, z1, y0, y1) => { const m = mesh(box(0.6, y1 - y0, z1 - z0), lwMat, [-ROOM.w / 2 - 0.3, (y0 + y1) / 2, (z0 + z1) / 2], [1, 1, 1], LW); };
let zc = -ROOM.d / 2;
for (const z of winZ) { addLW(zc, z - winW / 2, 0, ROOM.h); addLW(z - winW / 2, z + winW / 2, 0, winY0); addLW(z - winW / 2, z + winW / 2, winY1, ROOM.h); zc = z + winW / 2; }
addLW(zc, ROOM.d / 2, 0, ROOM.h);
// window frames + sills + outside view
const frameMat = std(0xf2ede2, 0.6);
for (const z of winZ) {
  mesh(box(0.25, 0.25, winW), frameMat, [-14.75, (winY0 + winY1) / 2, z], [1, 1, 1], world);
  mesh(box(0.25, winY1 - winY0, 0.25), frameMat, [-14.75, (winY0 + winY1) / 2, z], [1, 1, 1], world);
  mesh(box(0.9, 0.25, winW + 0.6), std(0xd9b27c), [-14.45, winY0 - 0.1, z], [1, 1, 1], world);
  // plants on sill
  const pot = mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 16), std(0xb5552e), [-14.4, winY0 + 0.3, z + 1.2], [1, 1, 1], world, { outline: 0.02 });
  for (let k = 0; k < 5; k++) mesh(SPH_LO, toon(0x4e8a3e), [-14.4 + (rnd() - 0.5) * 0.4, winY0 + 0.85 + rnd() * 0.4, z + 1.2 + (rnd() - 0.5) * 0.5], [0.3, 0.3, 0.3], world);
  // radiator under window
  for (let k = 0; k < 9; k++) mesh(box(0.35, 2.2, 0.22), std(0xdedad0, 0.5, 0.3), [-14.3, 1.6, z - 1.6 + k * 0.4], [1, 1, 1], world);
}
const outsideTex = canvasTex(1024, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9cc7ec'); gr.addColorStop(1, '#f6dcb0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // houses with red roofs (old German town)
  for (let i = 0; i < 9; i++) {
    const x = i * 120 - 20 + Math.random() * 30, hw = 90 + Math.random() * 40, hh = 90 + Math.random() * 60, by = h * 0.78;
    g.fillStyle = ['#e8dcc4', '#d9c7a5', '#f0e6d2'][i % 3]; g.fillRect(x, by - hh, hw, hh);
    g.fillStyle = '#b4472f'; g.beginPath(); g.moveTo(x - 10, by - hh); g.lineTo(x + hw / 2, by - hh - 70); g.lineTo(x + hw + 10, by - hh); g.fill();
    g.fillStyle = '#6b4a30'; for (let k = 0; k < 3; k++) g.fillRect(x + 12 + k * (hw / 3), by - hh + 20, 6, hh - 20);
    g.fillStyle = '#ffd36b'; g.fillRect(x + hw / 2 - 12, by - hh / 2, 24, 30);
  }
  g.fillStyle = '#5f8a4a'; g.fillRect(0, h * 0.78, w, h);
  for (let i = 0; i < 14; i++) { g.fillStyle = '#3f6e3a'; g.beginPath(); g.arc(Math.random() * w, h * 0.8, 40 + Math.random() * 40, 0, 7); g.fill(); }
});
const outside = mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: outsideTex }), [-30, 8, -1], [1, 1, 1], world, { cast: false, receive: false });
outside.rotation.y = Math.PI / 2;

// chalkboard (dynamic texture)
const BOARD = { w: 14, h: 5.6, x: -1, y: 6.6, z: -14.85 };
const boardTex = canvasTex(1400, 560, () => { });
mesh(box(BOARD.w + 0.7, BOARD.h + 0.7, 0.25), std(0x6a3f22, 0.7), [BOARD.x, BOARD.y, BOARD.z], [1, 1, 1], world, { outline: 0.03 });
const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.95, emissiveMap: boardTex, emissive: 0xffffff, emissiveIntensity: 0.12 });
const boardMesh = mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), boardMat, [BOARD.x, BOARD.y, BOARD.z + 0.14], [1, 1, 1], world, { cast: false });
mesh(box(BOARD.w + 0.8, 0.18, 0.5), std(0x5c3a22), [BOARD.x, BOARD.y - BOARD.h / 2 - 0.45, BOARD.z + 0.3], [1, 1, 1], world);
mesh(box(0.5, 0.12, 0.12), std(0xf4f2e8), [BOARD.x - 4, BOARD.y - BOARD.h / 2 - 0.3, BOARD.z + 0.35], [1, 1, 1], world);
mesh(box(0.4, 0.12, 0.12), std(0xf2d45c), [BOARD.x - 3.3, BOARD.y - BOARD.h / 2 - 0.3, BOARD.z + 0.35], [1, 1, 1], world);

// posters / clock / map on walls
function poster(w, h, draw, pos, rotY, parent = world) {
  const t = canvasTex(Math.round(w * 100), Math.round(h * 100), draw);
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), pos, [1, 1, 1], parent, { cast: false });
  m.rotation.y = rotY; return m;
}
poster(3.2, 4, (g, w, h) => {
  g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c0392b'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#c0392b'; g.font = 'bold 44px Montserrat'; g.textAlign = 'center'; g.fillText('ПРАВИЛА', w / 2, 80);
  g.fillStyle = '#3a2a20'; g.font = '30px Montserrat'; ['1. Тишина', '2. Не списывать', '3. Считать', '   самому!'].forEach((s, i) => g.fillText(s, w / 2, 160 + i * 60));
}, [8.5, 7.5, -14.95], 0);
poster(2.6, 3.2, (g, w, h) => {
  g.fillStyle = '#e9dfc4'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c3e50'; g.font = 'bold 40px "Comic Neue"'; g.textAlign = 'center';
  for (let i = 1; i <= 9; i++) g.fillText(`${i} × ${i} = ${i * i}`, w / 2, 40 + i * 30);
}, [-11.5, 7.2, -14.95], 0);
// map
poster(5, 3.4, (g, w, h) => {
  g.fillStyle = '#d9c9a0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9fb88a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 80, 50, Math.random(), 0, 7); g.fill(); }
  g.strokeStyle = '#6a4a30'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#3a2a20'; g.font = 'bold 34px Montserrat'; g.fillText('DEUTSCHLAND', 30, 50);
}, [14.95, 7.5, -4], -Math.PI / 2);
// clock
const clockTex = canvasTex(256, 256, () => { });
const clock = mesh(new THREE.CylinderGeometry(1, 1, 0.2, 40), [std(0x5c3a22), new THREE.MeshStandardMaterial({ map: clockTex }), std(0x5c3a22)], [7.5, 11, -14.85], [0.85, 0.85, 0.85], world, { cast: false });
clock.rotation.x = Math.PI / 2; clock.rotation.y = Math.PI / 2;
function drawClock(sec) {
  const { g, canvas } = clockTex.userData; const w = 256;
  g.fillStyle = '#f6f0e0'; g.fillRect(0, 0, w, w); g.strokeStyle = '#2a1e1a'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#2a1e1a'; g.fillRect(128 + Math.cos(a) * 95 - 5, 128 + Math.sin(a) * 95 - 5, 10, 10); }
  const hand = (a, l, wd, c) => { g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); g.stroke(); };
  hand(Math.PI * 1.7, 55, 10, '#2a1e1a'); hand(Math.PI * 0.2 + sec / 3600 * Math.PI * 2, 85, 7, '#2a1e1a'); hand(Math.floor(sec) / 60 * Math.PI * 2, 95, 3, '#c0392b');
  clockTex.needsUpdate = true;
}
// bookshelf on right wall
const shelf = new THREE.Group(); shelf.position.set(14.2, 0, 6); shelf.rotation.y = -Math.PI / 2; world.add(shelf);
mesh(box(6, 7, 1.2), std(0x5c3a22), [0, 3.5, 0], [1, 1, 1], shelf, { outline: 0.02 });
const bookCols = [0xb33a3a, 0x3a6ab3, 0xd9a441, 0x3e8e5e, 0x7a4aa0, 0xc4683a, 0x2e4e7e, 0xe0d4b8];
for (let r = 0; r < 4; r++) { mesh(box(5.8, 0.15, 1.1), std(0x3e2414), [0, 0.9 + r * 1.65, 0.06], [1, 1, 1], shelf);
  let x = -2.7; while (x < 2.6) { const bw = 0.18 + rnd() * 0.22, bh = 0.9 + rnd() * 0.5; mesh(box(bw, bh, 0.8), std(bookCols[(rnd() * 8) | 0]), [x + bw / 2, 0.98 + r * 1.65 + bh / 2, 0.2], [1, 1, 1], shelf); x += bw + 0.03; } }
// coat hooks with coats on front wall
for (let k = 0; k < 5; k++) {
  const x = -10 + k * 2.2;
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), std(0x3b2a20), [x, 8.2, 14.7], [1, 1, 1], world).rotation.x = Math.PI / 2;
  mesh(new THREE.CapsuleGeometry(0.55, 1.6, 6, 12), toon([0x4d7fbf, 0xc04848, 0x5e9e5e, 0x8e5eb0, 0xd08a2a][k]), [x, 7, 14.4], [1, 1, 0.5], world, { outline: 0.03 });
}
// lanterns from beams
const lanterns = [];
for (const [x, z] of [[-6, -6], [6, -6], [-6, 4], [6, 4]]) {
  mesh(CYL, std(0x2a1e1a), [x, 12, z], [0.04, 2, 0.04], world);
  const lm = mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0xffd38a, emissive: 0xffb050, emissiveIntensity: 1.2 }), [x, 10.6, z], [1, 1, 1], world, { cast: false, outline: 0.03 });
  lanterns.push(lm);
}
// teacher desk
const tdesk = new THREE.Group(); tdesk.position.set(6.5, 0, -9); world.add(tdesk);
mesh(box(5, 0.3, 2.4), std(0x8a5a33, 0.6), [0, 2.6, 0], [1, 1, 1], tdesk, { outline: 0.03 });
mesh(box(4.8, 2.45, 2.2), std(0x6e4426, 0.8), [0, 1.3, 0], [1, 1, 1], tdesk, { outline: 0.03 });
mesh(box(1.2, 0.35, 0.9), std(0xb33a3a), [-1.6, 2.92, 0.2], [1, 1, 1], tdesk); mesh(box(1.1, 0.3, 0.85), std(0x3a6ab3), [-1.55, 3.24, 0.2], [1, 1, 1], tdesk);
const bell = mesh(new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8a93a, metalness: 0.8, roughness: 0.3 }), [1.7, 2.75, 0.3], [1, 1, 1], tdesk, { outline: 0.02 });
mesh(SPH_LO, std(0x3e7eb3), [2.1, 3.65, -0.8], [0.45, 0.45, 0.45], tdesk, { outline: 0.02 });
mesh(CYL, std(0x5c3a22), [2.1, 3.1, -0.8], [0.08, 0.6, 0.08], tdesk);
const deskSlate = makeSlate('5050'); deskSlate.position.set(0.2, 2.8, 0.6); deskSlate.rotation.x = -Math.PI / 2 + 0.15; tdesk.add(deskSlate);
// student desks + kids
const DESK_X = [-7, 0, 7], DESK_Z = [-3.5, 1.5, 6.5];
const desksG = new THREE.Group(); world.add(desksG);
function studentDesk(x, z) {
  const d = new THREE.Group(); d.position.set(x, 0, z); desksG.add(d);
  mesh(box(4.2, 0.22, 1.8), std(0xd9b27c, 0.6), [0, 2.25, 0], [1, 1, 1], d, { outline: 0.03 });
  mesh(box(4.0, 1.4, 0.15), std(0xb88a55), [0, 1.5, -0.8], [1, 1, 1], d, { outline: 0.02 });
  for (const sx of [-1.9, 1.9]) mesh(box(0.15, 2.2, 1.6), std(0x8a5a33), [sx, 1.1, 0], [1, 1, 1], d);
  mesh(box(4.2, 0.2, 1.0), std(0x8a5a33), [0, 1.0, 1.6], [1, 1, 1], d, { outline: 0.02 }); // bench
  return d;
}
const kidSpecs = [
  ['#4d7fbf', 'bowl', 0x2b1b12], ['#c04848', 'pony', 0x8a5a2b], ['#5e9e5e', 'bowl', 0x1e1a22],
  ['#8e5eb0', 'pony', 0x5b3a1e], ['#3e9a9a', 'bowl', 0x8a5a2b], ['#b04870', 'pony', 0x1e1a22],
  ['#6a7a3a', 'bowl', 0x5b3a1e], ['#7a6a9a', 'bowl', 0x2b1b12], ['#a0705a', 'pony', 0x3b2a20], ['#58708a', 'bowl', 0x5b3a1e]];
const kids = [];
let ki = 0;
const SEATS = [];
for (const z of DESK_Z) for (const x of DESK_X) {
  studentDesk(x, z);
  for (const off of [-1.0, 1.0]) SEATS.push([x + off, z]);
}
const GAUSS_SEAT = SEATS.findIndex(s => s[0] === -8 && s[1] === 1.5);
for (let i = 0; i < SEATS.length; i++) {
  if (i === GAUSS_SEAT) continue;
  const [b, hr, hc] = kidSpecs[ki % kidSpecs.length]; ki++;
  // muted versions (secondary characters)
  const col = new THREE.Color(b).lerp(new THREE.Color(0x8a8078), 0.35);
  const k = makeChar({ body: col.getHex(), hair: hr, hairColor: hc });
  k.seat = SEATS[i]; k.idx = i;
  k.root.position.set(SEATS[i][0], 0.55, SEATS[i][1] + 1.45); k.root.rotation.y = Math.PI;
  k.legs.forEach(l => l.visible = false);
  k.root.scale.setScalar(0.62);
  world.add(k.root); kids.push(k);
  // slate on desk in front of kid
  const s = makeSlate(''); s.scale.setScalar(0.45); s.position.set(SEATS[i][0], 2.4, SEATS[i][1] + 0.2); s.rotation.x = -Math.PI / 2 + 0.2; desksG.add(s);
}
// main characters
const gauss = makeChar({ body: 0xf08a24, hair: 'messy', hairColor: 0x6b3e22 });
gauss.root.scale.setScalar(0.62); world.add(gauss.root);
const gSlate = makeSlate('5050'); gSlate.scale.setScalar(0.75 / 0.62); gSlate.visible = false; gauss.root.add(gSlate);
const teacher = makeChar({ body: 0x3a3f55, hair: 'grey', hairColor: 0xd6d2cb, beard: true, glasses: true });
teacher.root.scale.setScalar(1.1); world.add(teacher.root);
const tSlate = makeSlate('5050'); tSlate.visible = false; teacher.root.add(tSlate);
const chalkPiece = mesh(box(0.08, 0.3, 0.08), std(0xffffff), [0, -1.05, 0.05], [1, 1, 1], gauss.arms[1]);

// dust particles
const dustGeo = new THREE.BufferGeometry(); const N = 500; const dpos = new Float32Array(N * 3); const dseed = [];
for (let i = 0; i < N; i++) { dseed.push([rnd() * 28 - 14, rnd() * 12, rnd() * 28 - 14, rnd()]); }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffe2a8, size: 0.06, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
world.add(dust);
function updateDust(t) {
  for (let i = 0; i < N; i++) { const [x, y, z, s] = dseed[i]; dpos[i * 3] = x + Math.sin(t * 0.3 + s * 10) * 0.6; dpos[i * 3 + 1] = (y + t * 0.08 * (0.5 + s)) % 12; dpos[i * 3 + 2] = z + Math.cos(t * 0.25 + s * 7) * 0.6; }
  dustGeo.attributes.position.needsUpdate = true;
}

// light shafts (fake volumetrics)
const shaftMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const shafts = new THREE.Group(); world.add(shafts);
for (const z of winZ) for (let k = 0; k < 3; k++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(winW * 0.9, 22), shaftMat); m.position.set(-6 + k * 0.4, 5, z + 2.5 + k * 0.3);
  m.rotation.set(0, Math.PI / 2 - 0.25 + k * 0.05, -0.95); shafts.add(m);
}

// ------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x6b2e1f, 0.9); scene.add(hemi);
const amb = new THREE.AmbientLight(0xfff0dd, 0.35); scene.add(amb);
const sun = new THREE.DirectionalLight(0xffd59a, 4.2);
sun.position.set(-40, 26, 14); sun.target.position.set(0, 0, -2); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 100 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
const warm = new THREE.PointLight(0xffb060, 30, 30, 1.6); warm.position.set(4, 10, 2); scene.add(warm);
const spot = new THREE.SpotLight(0xffe2b0, 0, 40, 0.38, 0.5, 1.2); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); scene.add(spot, spot.target);
const rim = new THREE.PointLight(0x7aa0ff, 0, 20, 1.5); scene.add(rim);
scene.fog = new THREE.Fog(0x0e1530, 30, 80);

function lightMode(mode, k = 1) {
  if (mode === 'day') {
    hemi.intensity = 0.9; amb.intensity = 0.35; sun.intensity = 4.2; warm.intensity = 30; spot.intensity = 0; rim.intensity = 0;
    shafts.visible = true; scene.fog.near = 60; scene.fog.far = 120; renderer.toneMappingExposure = 1.05;
    lanterns.forEach(l => l.material.emissiveIntensity = 0.6);
    scene.background = new THREE.Color(0x9cc7ec);
  } else { // night / dramatic
    hemi.intensity = 0.12; amb.intensity = 0.06; sun.intensity = 0; warm.intensity = 0; spot.intensity = 60 * k; rim.intensity = 25;
    shafts.visible = false; scene.fog.near = 8; scene.fog.far = 40; renderer.toneMappingExposure = 1.15;
    lanterns.forEach(l => l.material.emissiveIntensity = 0.0);
    scene.background = new THREE.Color(0x0e1530);
  }
}

// ------------------------------------------------------------ board drawing
const PAIRC = ['#ffd65a', '#78dcff', '#ff8caa', '#aaf08c'];
const ROW = ['1', '2', '3', '4', '...', '97', '98', '99', '100'];
const PAIRS = [[0, 8], [1, 7], [2, 6], [3, 5]];
let boardKey = '';
function drawBoard(state, p = 1, glowAmt = 0) {
  const key = state + '|' + p.toFixed(2) + '|' + glowAmt.toFixed(2);
  if (key === boardKey) return; boardKey = key;
  const { g } = boardTex.userData; const w = 1400, h = 560;
  g.fillStyle = '#273f33'; g.fillRect(0, 0, w, h);
  const rs = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(230,240,230,${0.02 + rs() * 0.04})`; g.beginPath(); g.ellipse(rs() * w, rs() * h, 140, 40, rs(), 0, 7); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const chalk = (txt, x, y, size, col = '#f2f2ea', a = 1, align = 'center') => {
    g.globalAlpha = a; g.textAlign = align; g.font = `bold ${size}px "Comic Neue", Montserrat`; g.fillStyle = col;
    g.shadowColor = col; g.shadowBlur = 6; g.fillText(txt, x, y); g.shadowBlur = 0; g.globalAlpha = 1;
  };
  const write = (txt, x, y, size, prog, col) => { const n = Math.ceil(txt.length * Math.min(1, prog)); if (n > 0) { g.font = `bold ${size}px "Comic Neue", Montserrat`; const tw = g.measureText(txt).width; chalk(txt.slice(0, n), x - tw / 2, y, size, col, 1, 'left'); } };
  if (state === 'empty') { boardTex.needsUpdate = true; return; }
  if (state === 'question') { write('1 + 2 + ... + 100', w / 2, h / 2 - 60, 96, p * 1.3, '#f2f2ea'); write('= ?', w / 2, h / 2 + 70, 110, (p - 0.75) * 4, '#ffd65a'); boardTex.needsUpdate = true; return; }
  if (state.startsWith('heptagon')) {
    const cx = w / 2, cy = h / 2 + 10, R = 220, n = 17;
    g.strokeStyle = '#ffd65a'; g.lineWidth = 7; g.shadowColor = '#ffd65a'; g.shadowBlur = 25 * (0.5 + glowAmt);
    g.beginPath(); const m = Math.max(1, Math.round(n * p));
    for (let i = 0; i <= m; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2; const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(240,240,230,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    chalk('17', cx, cy, 120, '#ffd65a', Math.min(1, p * 1.5));
    chalk('?', 1220, 160, 160, '#ff6b6b', glowAmt); chalk('?', 190, 400, 120, '#ff6b6b', glowAmt);
    boardTex.needsUpdate = true; return;
  }
  if (state.startsWith('formula')) {
    write('1 + 2 + ... + n', w / 2, 100, 84, p * 2, '#f2f2ea');
    const q = Math.min(1, Math.max(0, p * 2 - 0.8));
    if (q > 0) {
      g.globalAlpha = q; chalk('=', 430, 350, 110); chalk('n · (n + 1)', 740, 290, 90, '#ffd65a');
      g.fillStyle = '#f2f2ea'; g.fillRect(540, 348, 400, 8); chalk('2', 740, 420, 90, '#78dcff'); g.globalAlpha = 1;
      if (p > 0.85) { g.strokeStyle = '#ffd65a'; g.lineWidth = 8; g.strokeRect(330, 210, 740, 280); }
    }
    boardTex.needsUpdate = true; return;
  }
  // pair states
  const ORDER = ['p1', 'p2', 'p3', 'all', 'half', 'mult'];
  const si = ORDER.indexOf(state);
  chalk('1 + 2 + 3 + ... + 100', w / 2, 46, 52);
  const RY = 235, RX = i => 352 + i * 87;
  ROW.forEach((it, i) => {
    let col = '#f2f2ea';
    PAIRS.forEach(([a, b], k) => { if ((k <= si && k < 3) || (si >= 3)) if (i === a || i === b) col = PAIRC[k]; });
    chalk(it, RX(i), RY, 50, col);
  });
  const np = si < 3 ? si + 1 : 4;
  for (let k = 0; k < np; k++) {
    const [a, b] = PAIRS[k]; let pr = 1;
    if (k === si && si < 3) pr = ease(p * 1.6);
    if (si === 3 && k === 3) pr = ease(p * 2);
    const x0 = RX(a), x1 = RX(b), hh = 30 + (3 - k) * 24, y = RY - 36;
    g.strokeStyle = PAIRC[k]; g.lineWidth = 7; g.shadowColor = PAIRC[k]; g.shadowBlur = 8; g.beginPath();
    const m = Math.max(2, Math.round(40 * pr));
    for (let j = 0; j < m; j++) { const u = j / 39; const x = x0 + (x1 - x0) * u, yy = y - Math.sin(Math.PI * u) * hh; j ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.stroke(); g.shadowBlur = 0;
    if (pr > 0.95 && k === np - 1) chalk('101', (x0 + x1) / 2, y - hh - 16, 28, PAIRC[k]);
  }
  // right side: big equation
  const EX = 1050;
  if (si < 3) {
    const [a, b] = PAIRS[si];
    write(`${ROW[a]} + ${ROW[b]} = 101`, w / 2, 400, 96, p * 1.4, PAIRC[si]);
  } else if (si === 3) {
    write('пара = 101', w / 2, 400, 100, p * 1.5, '#ffd65a');
  } else if (si === 4) {
    write('100 : 2 = 50', w / 2, 380, 96, p * 1.4, '#f2f2ea');
    if (p > 0.6) chalk('50 пар', w / 2, 480, 64, '#78dcff', Math.min(1, (p - 0.6) * 4));
  } else {
    write('50 × 101 =', w / 2, 360, 90, p * 2, '#f2f2ea');
    const q = Math.min(1, Math.max(0, (p - 0.45) / 0.2));
    if (q > 0) { g.save(); g.translate(w / 2, 470); g.scale(backOut(q), backOut(q)); chalk('5050', 0, 0, 130, '#ffd65a'); g.restore(); }
  }
  boardTex.needsUpdate = true;
}

// ------------------------------------------------------------ shots
function placeCam(pos, look, fov = 40) { camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; camera.updateProjectionMatrix(); }
const blinkAt = (t, s = 0) => ((t + s * 1.37) % 3.4) < 0.11;
function seatGauss() {
  gauss.root.position.set(-8, 0.55, 1.5 + 1.45); gauss.root.rotation.y = Math.PI; gauss.legs.forEach(l => l.visible = false);
}
function resetAll(t) {
  lightMode('day');
  seatGauss(); gauss.set({ expr: 'smirk', blink: blinkAt(t, 2) }); pose(gauss, 'idle'); gSlate.visible = false; chalkPiece.visible = false;
  teacher.root.position.set(6.5, 0, -11.2); teacher.root.rotation.y = 0; teacher.set({ expr: 'grumpy', blink: blinkAt(t), look: [0, -0.3] }); pose(teacher, 'idle'); tSlate.visible = false;
  deskSlate.visible = false;
  kids.forEach((k, i) => {
    k.set({ expr: 'stress', sweat: i % 3 === 0, blink: blinkAt(t, i), look: [0, -0.9] }); pose(k, 'write', t + i);
    k.root.position.y = 0.55 + Math.abs(Math.sin(t * 6 + i)) * 0.03; k.root.visible = true;
    k.head.rotation.set(0.25, 0, 0);
  });
  gauss.head.rotation.set(0, 0, 0); teacher.head.rotation.set(0, 0, 0);
  drawClock(9 * 3600 + 15 * 60 + t);
  updateDust(t);
  world.visible = true; desksG.visible = true; teacher.root.visible = true; tdesk.visible = true;
}

const SHOTS = {
  hook_face(u, t) {
    gauss.root.rotation.y = 0; gauss.root.position.set(-8, 0.55, 2.95);
    gauss.set({ expr: 'smirk', blink: blinkAt(t, 2), look: [0.2, 0] });
    kids.forEach(k => k.set({ expr: 'stress', look: [0, -0.9], blink: blinkAt(t, k.idx) }));
    // gauss turns to camera: hide own desk issue by looking from front-low
    const hp = gauss.head.getWorldPosition(V(0, 0, 0));
    placeCam(V(hp.x + 0.5 - u * 0.2, hp.y - 0.3, hp.z + 4.4 - u * 0.9), V(hp.x, hp.y - 0.25, hp.z), 38);
  },
  hook_slate(u, t) {
    gauss.root.position.set(-3.6, 0, -6.2); gauss.root.rotation.y = 0.15; gauss.legs.forEach(l => l.visible = true);
    gauss.set({ expr: 'proud', blink: blinkAt(t, 1) }); pose(gauss, 'slate'); gSlate.visible = true; gSlate.position.set(0, 2.55, 0.95); gSlate.rotation.set(0.1, 0, 0);
    const p = backOut(u * 3); gSlate.position.y = 2.2 + 0.35 * p;
    kids.forEach(k => { k.set({ expr: 'shock', look: [0, 0], blink: false }); pose(k, 'idle'); k.head.rotation.set(0, 0, 0); });
    placeCam(V(-3.0 - u * 0.3, 0.9, -1.6 + u * 0.4), V(-3.6, 2.3, -6.2), 42);
  },
  wide(u, t) {
    placeCam(V(12.5 - u * 1.2, 10.5 - u * 0.6, 13.5 - u * 1.5), V(-1.5, 3.5, -6), 50);
  },
  teacher(u, t) {
    teacher.set({ expr: u < 0.45 ? 'smirk' : 'grumpy', blink: blinkAt(t), look: [-0.4, 0] }); pose(teacher, u < 0.45 ? 'idle' : 'point');
    teacher.arms[1].rotation.set(-1.7, 0, 1.2);
    drawBoard('question', ease((u - 0.25) / 0.45));
    placeCam(V(3.6 + u * 0.4, 5.0, -2.6 - u * 1.2), V(5.6, 4.3, -11.5), 44);
  },
  kids_count(u, t) {
    drawBoard('question', 1);
    placeCam(V(-1.5 + u * 1.5, 5.2, -9.5), V(-0.5, 2.4, 4), 50);
  },
  walk(u, t) {
    drawBoard('question', 1);
    const p = ease(u / 0.85);
    const A = V(-3.5, 0, 3.5), B = V(-3.5, 0, -6.3), C = V(4.6, 0, -6.6);
    let pos, dir;
    if (p < 0.55) { pos = A.clone().lerp(B, p / 0.55); dir = B.clone().sub(A); }
    else { pos = B.clone().lerp(C, (p - 0.55) / 0.45); dir = C.clone().sub(B); }
    gauss.root.position.set(pos.x, p < 0.98 ? Math.abs(Math.sin(t * 9)) * 0.07 : 0, pos.z);
    gauss.root.rotation.y = p < 0.98 ? Math.atan2(dir.x, dir.z) : Math.PI;
    gauss.legs.forEach(l => l.visible = true);
    pose(gauss, p < 0.98 ? 'walk' : 'idle', t);
    gauss.set({ expr: 'proud', blink: blinkAt(t, 3) });
    if (p < 0.97) { gSlate.visible = true; gSlate.position.set(0.55, 1.55, 0.5); gSlate.rotation.set(-0.3, -0.6, 0); gauss.arms[1].rotation.set(-0.5, 0, 0.3); }
    else deskSlate.visible = true;
    teacher.set({ expr: 'smirk', look: [-0.6, -0.2], blink: blinkAt(t) });
    kids.forEach(k => { const d = gauss.root.position.clone().sub(k.root.position); k.head.rotation.set(0, Math.atan2(d.x, -d.z) * 0.6, 0); k.set({ expr: 'shock', look: [0, 0] }); pose(k, 'idle'); });
    const gp = gauss.root.position;
    placeCam(V(11.5, 6.5, 3.5), V(gp.x * 0.7 + 1, 1.6, gp.z - 1), 48);
  },
  slate_ecu(u, t) {
    deskSlate.visible = true;
    const sp = deskSlate.getWorldPosition(V(0, 0, 0));
    deskSlate.children[1].material.emissiveIntensity = 0.25 * ease(u * 2);
    placeCam(V(sp.x + 0.1, sp.y + 3.6 - u * 0.6, sp.z + 1.4 - u * 0.2), sp, 34);
  },
  teacher_shock(u, t, seg) {
    deskSlate.visible = false; tSlate.visible = true; tSlate.position.set(0, 2.75, 0.95); tSlate.rotation.set(0.25, 0, 0);
    pose(teacher, 'slate');
    const shockAt = 0.5;
    const sh = u > shockAt;
    teacher.set({ expr: sh ? 'shock' : 'neutral', look: [0, sh ? 0 : -0.8], blink: !sh && blinkAt(t), sweat: sh });
    const hp = teacher.head.getWorldPosition(V(0, 0, 0));
    let punch = 0, shake = [0, 0];
    if (sh) { const q = (u - shockAt) * seg.dur; punch = Math.max(0, 1 - q / 0.15) * 0.9; if (q < 0.4) shake = [(Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06]; }
    placeCam(V(hp.x + shake[0], hp.y - 0.2 + shake[1], hp.z + 6.2 - u * 0.6 - punch * 1.5), V(hp.x, hp.y - 0.9, hp.z), 40);
  },
  gauss_board(u, t) {
    drawBoard('question', 1);
    gauss.root.position.set(-2.2, 0, -12.6); gauss.root.rotation.y = 0.35; gauss.legs.forEach(l => l.visible = true);
    gauss.set({ expr: u < 0.4 ? 'neutral' : 'smirk', look: [-0.7, 0.4], blink: blinkAt(t, 1) });
    pose(gauss, 'chin'); chalkPiece.visible = false;
    placeCam(V(1.0 - u * 0.6, 2.6, -5.8 - u * 0.8), V(-1.6, 3.4, -13), 46);
  },
  board(u, t, seg) {
    const st = seg.board;
    drawBoard(st, seg.board === 'mult' ? u : Math.min(1, u * 1.3));
    gauss.root.position.set(-3.5, 0, -12.4); gauss.root.rotation.y = 0.45;
    kids.forEach(k => k.root.visible = false); desksG.visible = false; gauss.legs.forEach(l => l.visible = true);
    gauss.set({ expr: st === 'mult' && u > 0.6 ? 'happy' : 'proud', look: [1, 0.6], blink: blinkAt(t, 2) }); pose(gauss, 'chalk'); chalkPiece.visible = true;
    gauss.arms[1].rotation.set(-2.3 + Math.sin(t * 6) * 0.08, 0, -0.8);
    const k = seg.k || 0;
    placeCam(V(BOARD.x + 0.4 - k * 0.08, 5.6, BOARD.z + 19.5 - k * 0.3 - u * 0.5), V(BOARD.x, 5.4, BOARD.z), 40);
  },
  formula(u, t) {
    drawBoard('formula', Math.min(1, u * 1.15));
    kids.forEach(k => k.root.visible = false); desksG.visible = false;
    gauss.root.position.set(-1, 0, -11.6); gauss.root.rotation.y = 0; gauss.legs.forEach(l => l.visible = true);
    gauss.set({ expr: 'happy', blink: blinkAt(t, 4) }); pose(gauss, u > 0.6 ? 'cheer' : 'idle');
    placeCam(V(-1 + Math.sin(u * 1.2) * 1.2, 4.6, 4.5 - u * 2.5), V(-1, 5.0, -13), 40);
  },
  king(u, t) {
    lightMode('night', ease(u * 3));
    kids.forEach(k => k.root.visible = false); teacher.root.visible = false; desksG.visible = false; tdesk.visible = false;
    drawBoard('empty');
    gauss.root.position.set(0, 0, -3); gauss.root.rotation.y = 0; gauss.legs.forEach(l => l.visible = true);
    gauss.root.scale.setScalar(0.8);
    gauss.set({ expr: 'proud', crown: true, blink: blinkAt(t, 5) }); pose(gauss, 'idle');
    gauss.crown.rotation.y = t * 0.6;
    spot.position.set(3, 11, 3); spot.target.position.set(0, 1, -3);
    rim.position.set(-3, 4, -6);
    const a = -0.5 + u * 0.7;
    placeCam(V(Math.sin(a) * 6.5, 1.6 + u * 0.4, -3 + Math.cos(a) * 6.5), V(0, 2.6, -3), 44);
  },
  cliff(u, t, seg) {
    lightMode('night', 1);
    kids.forEach(k => k.root.visible = false); teacher.root.visible = false; desksG.visible = false; tdesk.visible = false;
    gauss.root.scale.setScalar(0.62);
    drawBoard('heptagon', Math.min(1, u * 1.6), ease((u - 0.5) * 2));
    boardMat.emissiveIntensity = 0.25;
    gauss.root.position.set(-1, 0, -9); gauss.root.rotation.y = Math.PI; gauss.legs.forEach(l => l.visible = true);
    gauss.set({ expr: 'neutral' }); pose(gauss, 'idle');
    spot.position.set(-1, 12, -6); spot.target.position.set(-1, 6, -14.8);
    rim.position.set(-1, 3, -6);
    placeCam(V(-1, 3.0, 2.0 - u * 3.5), V(-1, 5.4, -14), 46);
  },
};

// ------------------------------------------------------------ main entry
let TL = null;
window.setTimeline = tl => { TL = tl; };
window.renderAt = (t) => {
  let seg = TL.segments[0];
  for (const s of TL.segments) if (t >= s.shotStart) seg = s;
  resetAll(t);
  boardMat.emissiveIntensity = 0.12;
  gauss.root.scale.setScalar(0.62);
  deskSlate.children[1].material.emissiveIntensity = 0;
  const dur = seg.shotEnd - seg.shotStart;
  const u = Math.min(1, Math.max(0, (t - seg.shotStart) / dur));
  if (!['teacher', 'kids_count', 'walk', 'gauss_board', 'board', 'formula', 'king', 'cliff'].includes(seg.shot)) drawBoard('question', 1);
  SHOTS[seg.shot](u, t, Object.assign({ dur }, seg));
  composer.render();
  return renderer.domElement.toDataURL('image/jpeg', 0.93);
};
window.ready = document.fonts.load('bold 80px "Comic Neue"').then(() => document.fonts.load('bold 80px Montserrat')).then(() => { boardKey = ''; return true; });
