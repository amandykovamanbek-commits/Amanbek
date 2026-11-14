import * as THREE from 'three';

// =====================================================================
//  Трасса: стадион (две прямые + два полукруга), 4 полосы в одну сторону
// =====================================================================
const L = 1000;                       // длина прямой, м
const R = 220;                        // радиус поворота, м
const P = 2 * L + 2 * Math.PI * R;    // длина круга
const ROAD_HALF = 10;                 // полуширина дороги с обочинами
const LANES = [6, 2, -2, -6];         // смещение полос от осевой (+ = вправо/внутрь)
const LANE_SPEED = [16, 20, 24, 28];  // скорость потока по полосам, м/с (правые медленнее)
const LOT = { hw: 180, hd: 130 };     // дрифт-площадка в центре (полуширина/полуглубина)

function trackPoint(s) {
  s = ((s % P) + P) % P;
  let x, z, dx, dz;
  if (s < L) { x = -L / 2 + s; z = -R; dx = 1; dz = 0; }
  else if (s < L + Math.PI * R) {
    const th = -Math.PI / 2 + (s - L) / R;
    x = L / 2 + R * Math.cos(th); z = R * Math.sin(th); dx = -Math.sin(th); dz = Math.cos(th);
  } else if (s < 2 * L + Math.PI * R) { x = L / 2 - (s - L - Math.PI * R); z = R; dx = -1; dz = 0; }
  else {
    const th = Math.PI / 2 + (s - 2 * L - Math.PI * R) / R;
    x = -L / 2 + R * Math.cos(th); z = R * Math.sin(th); dx = -Math.sin(th); dz = Math.cos(th);
  }
  // n — нормаль вправо по ходу движения (внутрь кольца)
  return { x, z, dx, dz, nx: -dz, nz: dx, h: Math.atan2(dx, dz) };
}

function trackProject(x, z) {
  if (x >= -L / 2 && x <= L / 2) {
    if (z < 0) return { s: x + L / 2, off: z + R };
    return { s: L + Math.PI * R + (L / 2 - x), off: R - z };
  }
  if (x > L / 2) {
    const dx = x - L / 2;
    return { s: L + (Math.atan2(z, dx) + Math.PI / 2) * R, off: R - Math.hypot(dx, z) };
  }
  const dx = x + L / 2;
  let th = Math.atan2(z, dx); if (th < 0) th += 2 * Math.PI;
  return { s: 2 * L + Math.PI * R + (th - Math.PI / 2) * R, off: R - Math.hypot(dx, z) };
}

const inLot = (x, z) => Math.abs(x) < LOT.hw && Math.abs(z) < LOT.hd;
const onRoad = (x, z) => Math.abs(trackProject(x, z).off) < ROAD_HALF;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// =====================================================================
//  Режимы
// =====================================================================
const MODES = {
  drift:   { name: 'Дрифт',      perLane: 5,  engine: 15, maxSpeed: 52, brake: 26, grip: 2.6, hbGrip: 0.8, steer: 0.65, steerV: 16, steerPow: 1.5 },
  traffic: { name: 'Шашки',      perLane: 32, engine: 13, maxSpeed: 75, brake: 30, grip: 6.5, hbGrip: 1.1, steer: 0.6,  steerV: 14, steerPow: 1.7 },
  free:    { name: 'Покатушки',  perLane: 9,  engine: 13, maxSpeed: 70, brake: 30, grip: 5.0, hbGrip: 1.0, steer: 0.62, steerV: 15, steerPow: 1.6 },
};

// =====================================================================
//  Рендер и сцена
// =====================================================================
const canvas = document.getElementById('view');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const SKY = 0x9fc7e8;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 150, 900);

const camera = new THREE.PerspectiveCamera(65, 1, 0.5, 2000);

scene.add(new THREE.HemisphereLight(0xdfefff, 0x4a5a3a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2dd, 1.8);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 200 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}

function noise(g, w, h, base, spread, count) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const v = Math.random() * spread - spread / 2;
    g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

// --- Земля ---
{
  const tex = canvasTex(256, 256, (g, w, h) => noise(g, w, h, '#5d8a3c', 60, 6000), 300);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

// --- Дорога (лента вдоль трассы) ---
{
  const tex = canvasTex(512, 512, (g, w, h) => {
    noise(g, w, h, '#3b3e44', 50, 9000);
    const px = (off) => ((off + ROAD_HALF) / (2 * ROAD_HALF)) * w;
    g.fillStyle = '#eeeeee';
    for (const off of [-8, 8]) g.fillRect(px(off) - 4, 0, 8, h);
    g.fillStyle = '#e9e9e9';
    for (const off of [-4, 0, 4]) g.fillRect(px(off) - 3, 0, 6, h * 0.35);
    g.fillStyle = '#c94a3a';
    for (const off of [-ROAD_HALF, ROAD_HALF]) g.fillRect(px(off) - (off < 0 ? 0 : 10), 0, 10, h);
  });
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping;
  const step = 4, n = Math.ceil(P / step);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * P, t = trackPoint(s);
    for (const side of [-1, 1]) {
      pos.push(t.x + t.nx * ROAD_HALF * side, 0.04, t.z + t.nz * ROAD_HALF * side);
      uv.push(side < 0 ? 0 : 1, s / 20);
    }
    if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const road = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  road.receiveShadow = true;
  scene.add(road);
}

// --- Дрифт-площадка ---
const DONUTS = [[-100, -50], [-100, 50], [0, 0], [100, -50], [100, 50]];
{
  const tex = canvasTex(1024, 740, (g, w, h) => {
    noise(g, w, h, '#2f3237', 40, 30000);
    const sx = w / (LOT.hw * 2), sz = h / (LOT.hd * 2);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.setLineDash([16, 12]);
    for (const [x, z] of DONUTS) { g.beginPath(); g.arc((x + LOT.hw) * sx, (z + LOT.hd) * sz, 16 * sx, 0, Math.PI * 2); g.stroke(); }
    g.setLineDash([]);
    g.fillStyle = 'rgba(255,213,79,.85)';
    g.font = 'bold 60px system-ui'; g.textAlign = 'center';
    g.fillText('DRIFT ZONE', w / 2, h / 2 - 90);
  });
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(LOT.hw * 2, LOT.hd * 2), new THREE.MeshLambertMaterial({ map: tex }));
  lot.rotation.x = -Math.PI / 2; lot.position.y = 0.04; lot.receiveShadow = true;
  scene.add(lot);

  // конусы: вокруг точек для «пончиков» и по периметру
  const pts = [];
  for (const [x, z] of DONUTS) for (let a = 0; a < 8; a++) pts.push([x + Math.cos(a / 8 * Math.PI * 2) * 3, z + Math.sin(a / 8 * Math.PI * 2) * 3]);
  for (let x = -LOT.hw; x <= LOT.hw; x += 12) pts.push([x, -LOT.hd], [x, LOT.hd]);
  for (let z = -LOT.hd + 12; z < LOT.hd; z += 12) pts.push([-LOT.hw, z], [LOT.hw, z]);
  const cone = new THREE.InstancedMesh(new THREE.ConeGeometry(0.3, 0.8, 10).translate(0, 0.4, 0),
    new THREE.MeshLambertMaterial({ color: 0xff6d00 }), pts.length);
  const m = new THREE.Matrix4();
  pts.forEach(([x, z], i) => cone.setMatrixAt(i, m.makeTranslation(x, 0, z)));
  cone.castShadow = true;
  scene.add(cone);
}

// --- Деревья и столбы ---
{
  const rnd = mulberry32(777);
  const trees = [];
  while (trees.length < 900) {
    const x = (rnd() - 0.5) * 2200, z = (rnd() - 0.5) * 1200;
    const p = trackProject(x, z);
    if (Math.abs(p.off) < ROAD_HALF + 8) continue;
    if (Math.abs(x) < LOT.hw + 12 && Math.abs(z) < LOT.hd + 12) continue;
    trees.push([x, z, 0.7 + rnd() * 0.8]);
  }
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 6).translate(0, 1, 0),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2b }), trees.length);
  const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 6, 7).translate(0, 5, 0),
    new THREE.MeshLambertMaterial({ color: 0x2f6b2f }), trees.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  trees.forEach(([x, z, s], i) => {
    m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
    trunk.setMatrixAt(i, m); crown.setMatrixAt(i, m);
  });
  crown.castShadow = true;
  scene.add(trunk, crown);

  // фонари по внешнему краю — дают ощущение скорости
  const n = Math.floor(P / 30);
  const pole = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 7, 0.25).translate(0, 3.5, 0),
    new THREE.MeshLambertMaterial({ color: 0xb0b6bf }), n);
  for (let i = 0; i < n; i++) {
    const t = trackPoint(i * 30);
    pole.setMatrixAt(i, m.makeTranslation(t.x - t.nx * (ROAD_HALF + 1.5), 0, t.z - t.nz * (ROAD_HALF + 1.5)));
  }
  pole.castShadow = true;
  scene.add(pole);
}

// =====================================================================
//  Модель машины игрока
// =====================================================================
function makeCar(color) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b222b, metalness: 0.2, roughness: 0.2 });
  const add = (geo, mat, x, y, z, parent = body) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
  };
  add(new THREE.BoxGeometry(1.9, 0.55, 4.4), paint, 0, 0.6, 0);
  add(new THREE.BoxGeometry(1.6, 0.5, 2.1), dark, 0, 1.1, -0.35);
  add(new THREE.BoxGeometry(1.85, 0.08, 0.45), paint, 0, 1.12, -2.05);
  add(new THREE.BoxGeometry(0.1, 0.3, 0.1), dark, 0.6, 0.95, -2.05);
  add(new THREE.BoxGeometry(0.1, 0.3, 0.1), dark, -0.6, 0.95, -2.05);
  const head = new THREE.MeshBasicMaterial({ color: 0xfff6d5 });
  const tail = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  for (const sx of [-0.65, 0.65]) {
    add(new THREE.BoxGeometry(0.4, 0.15, 0.05), head, sx, 0.7, 2.21);
    add(new THREE.BoxGeometry(0.4, 0.15, 0.05), tail, sx, 0.72, -2.21);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14).rotateZ(Math.PI / 2);
  const tire = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const front = [];
  for (const [x, z] of [[0.95, 1.4], [-0.95, 1.4], [0.95, -1.4], [-0.95, -1.4]]) {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.36, z); g.add(pivot);
    const w = new THREE.Mesh(wheelGeo, tire); w.castShadow = true; pivot.add(w);
    if (z > 0) front.push(pivot);
  }
  g.userData = { body, front };
  return g;
}

function makeLabel(text, color) {
  const tex = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.beginPath(); g.roundRect(4, 8, w - 8, h - 16, 16); g.fill();
    g.fillStyle = color; g.fillRect(16, 26, 12, 12);
    g.fillStyle = '#fff'; g.font = 'bold 28px system-ui'; g.textBaseline = 'middle';
    g.fillText(text, 38, h / 2 + 1);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(4, 1, 1); s.position.y = 2.6; s.renderOrder = 10;
  return s;
}

// =====================================================================
//  Поток машин (детерминированный: все клиенты считают одинаково)
// =====================================================================
const TRAFFIC_COLORS = [0xeeeeee, 0x222222, 0x8a8f99, 0x1e4fa8, 0xb71c1c, 0x2e7d32, 0xf9a825, 0x5d4037, 0x4a148c, 0x90caf9];
const MAX_TRAFFIC = 140;
const traffic = { list: [], body: null, cab: null, wheels: null, lights: null };
{
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = true; m.count = 0; scene.add(m); return m; };
  traffic.body = mk(boxGeo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }), MAX_TRAFFIC);
  traffic.cab = mk(boxGeo, new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2 }), MAX_TRAFFIC);
  traffic.wheels = mk(new THREE.CylinderGeometry(1, 1, 1, 10).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x111111 }), MAX_TRAFFIC * 4);
  traffic.lights = mk(boxGeo, new THREE.MeshBasicMaterial({ color: 0xff1a1a }), MAX_TRAFFIC * 2);
  traffic.lights.castShadow = false;
}

function local(x, y, z, sx, sy, sz) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
}

function buildTraffic(seed, perLane) {
  const rnd = mulberry32(seed);
  const list = [];
  const col = new THREE.Color();
  for (let li = 0; li < 4; li++) {
    const gap = P / perLane, base = rnd() * P;
    for (let k = 0; k < perLane; k++) {
      const truck = rnd() < (li === 0 ? 0.35 : 0.1);
      const len = truck ? 7.5 : 4.4, wid = truck ? 2.4 : 1.9;
      const c = TRAFFIC_COLORS[Math.floor(rnd() * TRAFFIC_COLORS.length)];
      const v = {
        s0: base + k * gap + (rnd() - 0.5) * gap * 0.5, lane: li, speed: LANE_SPEED[li], len, wid,
        x: 0, z: 0, h: 0, fx: 0, fz: 1, prevLong: NaN,
        parts: truck ? {
          body: local(0, 1.55, -0.95, wid, 2.4, len - 2.1), cab: local(0, 1.2, len / 2 - 1, wid * 0.95, 1.7, 1.9),
          bodyColor: 0xdadada, cabColor: c, wr: 0.5,
        } : {
          body: local(0, 0.62, 0, wid, 0.62, len), cab: local(0, 1.18, -0.25, wid * 0.84, 0.52, len * 0.48),
          bodyColor: c, cabColor: 0x1b222b, wr: 0.34,
        },
      };
      const wz = len / 2 - (truck ? 1.1 : 0.95), wr = v.parts.wr;
      v.parts.wheels = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => local(sx * (wid / 2 - 0.1), wr, sz * wz, wr, 0.3, wr));
      v.parts.lights = [1, -1].map((sx) => local(sx * (wid / 2 - 0.3), truck ? 0.8 : 0.75, -len / 2 - 0.01, 0.35, 0.16, 0.05));
      list.push(v);
    }
  }
  traffic.list = list;
  const n = list.length;
  traffic.body.count = n; traffic.cab.count = n; traffic.wheels.count = n * 4; traffic.lights.count = n * 2;
  list.forEach((v, i) => {
    traffic.body.setColorAt(i, col.setHex(v.parts.bodyColor));
    traffic.cab.setColorAt(i, col.setHex(v.parts.cabColor));
  });
  for (const m of [traffic.body, traffic.cab]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
}

const _M = new THREE.Matrix4(), _O = new THREE.Matrix4();
function updateTraffic(tSec) {
  const list = traffic.list;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    const t = trackPoint(v.s0 + v.speed * tSec);
    const off = LANES[v.lane];
    v.x = t.x + t.nx * off; v.z = t.z + t.nz * off; v.h = t.h; v.fx = t.dx; v.fz = t.dz;
  }
}
function drawTraffic() {
  const list = traffic.list;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    _M.makeRotationY(v.h).setPosition(v.x, 0, v.z);
    traffic.body.setMatrixAt(i, _O.multiplyMatrices(_M, v.parts.body));
    traffic.cab.setMatrixAt(i, _O.multiplyMatrices(_M, v.parts.cab));
    for (let k = 0; k < 4; k++) traffic.wheels.setMatrixAt(i * 4 + k, _O.multiplyMatrices(_M, v.parts.wheels[k]));
    for (let k = 0; k < 2; k++) traffic.lights.setMatrixAt(i * 2 + k, _O.multiplyMatrices(_M, v.parts.lights[k]));
  }
  for (const m of [traffic.body, traffic.cab, traffic.wheels, traffic.lights]) m.instanceMatrix.needsUpdate = true;
}

// =====================================================================
//  Следы шин и дым
// =====================================================================
const MAX_SKIDS = 5000;
const skids = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(0.28, 1).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  MAX_SKIDS);
skids.frustumCulled = false;
skids.renderOrder = 1;
{
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < MAX_SKIDS; i++) skids.setMatrixAt(i, zero);
}
scene.add(skids);
let skidIdx = 0;
const _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _s = new THREE.Vector3();

function emitSkid(trail, k, x, z) {
  const last = trail[k];
  if (!last) { trail[k] = { x, z }; return; }
  const dx = x - last.x, dz = z - last.z, d = Math.hypot(dx, dz);
  if (d < 0.35) return;
  if (d > 4) { trail[k] = { x, z }; return; }
  _q.setFromAxisAngle(_up, Math.atan2(dx, dz));
  _p.set((x + last.x) / 2, 0.08, (z + last.z) / 2);
  _s.set(1, 1, d);
  skids.setMatrixAt(skidIdx, _O.compose(_p, _q, _s));
  skidIdx = (skidIdx + 1) % MAX_SKIDS;
  skids.instanceMatrix.needsUpdate = true;
  trail[k] = { x, z };
}

const smokeTex = canvasTex(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const smoke = [];
for (let i = 0; i < 70; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, color: 0xdddddd, opacity: 0 }));
  s.visible = false; scene.add(s);
  smoke.push({ s, life: 0, max: 1, vx: 0, vz: 0 });
}
let smokeIdx = 0;
function emitSmoke(x, z, vx, vz) {
  const p = smoke[smokeIdx]; smokeIdx = (smokeIdx + 1) % smoke.length;
  p.life = 0; p.max = 1 + Math.random() * 0.6;
  p.vx = vx * 0.15 + (Math.random() - 0.5); p.vz = vz * 0.15 + (Math.random() - 0.5);
  p.s.position.set(x, 0.5, z); p.s.visible = true;
}
function updateSmoke(dt) {
  for (const p of smoke) {
    if (!p.s.visible) continue;
    p.life += dt;
    if (p.life >= p.max) { p.s.visible = false; continue; }
    const k = p.life / p.max;
    p.s.position.x += p.vx * dt; p.s.position.z += p.vz * dt; p.s.position.y += dt * 0.8;
    const sc = 1.2 + k * 4.5; p.s.scale.set(sc, sc, 1);
    p.s.material.opacity = 0.38 * (1 - k);
  }
}

// =====================================================================
//  Звук (WebAudio: мотор + визг шин)
// =====================================================================
const VOLUME = 0.28; // общая громкость (было 0.5)
const sound = {
  ctx: null, muted: false,
  init() {
    if (this.ctx) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain(); master.gain.value = VOLUME; master.connect(ctx.destination);
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900;
      const eg = ctx.createGain(); eg.gain.value = 0.08; filt.connect(eg); eg.connect(master);
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
      const o2 = ctx.createOscillator(); o2.type = 'square';
      const g2 = ctx.createGain(); g2.gain.value = 0.4;
      o1.connect(filt); o2.connect(g2); g2.connect(filt); o1.start(); o2.start();
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const nz = ctx.createBufferSource(); nz.buffer = buf; nz.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 2;
      const sg = ctx.createGain(); sg.gain.value = 0;
      nz.connect(bp); bp.connect(sg); sg.connect(master); nz.start();
      Object.assign(this, { ctx, master, o1, o2, eg, sg });
    } catch { this.ctx = null; }
  },
  update(speed, throttle, slip) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const gear = Math.min(5, Math.floor(speed / 14));
    const frac = (speed - gear * 14) / 14;
    const f = 55 + frac * 95 + gear * 12 + throttle * 18;
    this.o1.frequency.setTargetAtTime(f, t, 0.05);
    this.o2.frequency.setTargetAtTime(f / 2, t, 0.05);
    this.eg.gain.setTargetAtTime(0.05 + throttle * 0.06, t, 0.1);
    this.sg.gain.setTargetAtTime(Math.min(0.25, slip * 0.012), t, 0.05);
  },
  toggle() {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.value = this.muted ? 0 : VOLUME;
    toast(this.muted ? 'Звук выкл' : 'Звук вкл', '#fff');
  },
};

// =====================================================================
//  Управление
// =====================================================================
const keys = {};
const touchState = { left: false, right: false, gas: false, brake: false, hand: false };
const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!game.running) return;
  if (e.code === 'KeyR') respawn();
  if (e.code === 'KeyC') game.camFar = !game.camFar;
  if (e.code === 'KeyM') sound.toggle();
  if (e.code === 'Escape') toMenu();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function bindTouch(id, key) {
  const el = document.getElementById(id);
  const on = (e) => { e.preventDefault(); touchState[key] = true; el.classList.add('on'); };
  const off = (e) => { e.preventDefault(); touchState[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, off);
}
bindTouch('tLeft', 'left'); bindTouch('tRight', 'right'); bindTouch('tGas', 'gas'); bindTouch('tBrake', 'brake'); bindTouch('tHand', 'hand');

function readInput() {
  return {
    gas: keys.KeyW || keys.ArrowUp || touchState.gas ? 1 : 0,
    brake: keys.KeyS || keys.ArrowDown || touchState.brake ? 1 : 0,
    steer: (keys.KeyD || keys.ArrowRight || touchState.right ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || touchState.left ? 1 : 0),
    hand: keys.Space || touchState.hand ? 1 : 0,
  };
}

// =====================================================================
//  Состояние игры
// =====================================================================
const game = {
  running: false, mode: 'drift', cfg: MODES.drift, online: false, code: null,
  camFar: false, total: 0, chain: 0, mult: 1, chainTimer: 0, driftTime: 0,
};
const car = {
  x: 0, z: 0, h: 0, vx: 0, vz: 0, av: 0, steer: 0, slip: 0, drifting: false,
  protect: 0, crashCd: 0, trail: [null, null], smokeT: 0,
  mesh: null, input: { gas: 0, brake: 0, steer: 0, hand: 0 },
};

function spawn() {
  const slot = (net.myId || 0) % 5;
  if (game.mode === 'drift') {
    car.x = -140 + slot * 8; car.z = -100; car.h = 0;
  } else {
    const t = trackPoint(40 + slot * 14);
    car.x = t.x + t.nx * LANES[1]; car.z = t.z + t.nz * LANES[1]; car.h = t.h;
  }
  car.vx = car.vz = car.av = car.steer = 0;
  car.protect = 3; car.trail = [null, null];
}

function respawn() {
  if (game.mode === 'drift' && (inLot(car.x, car.z) || !onRoad(car.x, car.z))) { spawn(); return; }
  const p = trackProject(car.x, car.z);
  const t = trackPoint(p.s);
  car.x = t.x + t.nx * LANES[0]; car.z = t.z + t.nz * LANES[0]; car.h = t.h;
  car.vx = car.vz = car.av = 0;
  car.protect = 3; car.trail = [null, null];
  loseChain(null);
}

// --- Очки: «серия» копится и засчитывается, когда закончится таймер ---
function bankChain() {
  if (game.chain >= 1) {
    const v = Math.floor(game.chain);
    game.total += v;
    toast(`+${fmt(v)}`, '#7CFC9A');
  }
  game.chain = 0; game.mult = 1; game.driftTime = 0;
}
function loseChain(reason) {
  if (game.chain >= 1 && reason) toast(reason, '#ff5252');
  game.chain = 0; game.mult = 1; game.chainTimer = 0; game.driftTime = 0;
}

// =====================================================================
//  Физика (аркадная модель с регулируемым боковым сцеплением)
// =====================================================================
function physicsStep(dt, tSec) {
  const cfg = game.cfg, inp = car.input;
  const fx = Math.sin(car.h), fz = Math.cos(car.h);
  const rx = -fz, rz = fx;
  let vf = car.vx * fx + car.vz * fz;
  let vr = car.vx * rx + car.vz * rz;
  const offroad = !inLot(car.x, car.z) && !onRoad(car.x, car.z);

  // руль: плавно к вводу
  const sTarget = inp.steer;
  const sRate = sTarget === 0 ? 6 : 4;
  car.steer += Math.sign(sTarget - car.steer) * Math.min(Math.abs(sTarget - car.steer), sRate * dt);

  // газ / тормоз / задний ход
  if (inp.gas) {
    if (vf < -0.5) vf += cfg.brake * dt;
    else vf += cfg.engine * (1 - Math.max(0, vf) / cfg.maxSpeed) * dt;
  }
  if (inp.brake) {
    if (vf > 0.5) vf -= cfg.brake * dt;
    else vf = Math.max(vf - 8 * dt, -14);
  }
  if (!inp.gas && !inp.brake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 1.5 * dt);
  if (offroad) vf -= vf * 0.9 * dt;

  // боковое сцепление
  let grip = inp.hand ? cfg.hbGrip : cfg.grip;
  if (game.mode === 'drift' && inp.gas && Math.abs(vr) > 2 && !inp.hand) grip *= 0.55; // «газ держит занос»
  if (offroad) grip *= 0.55;
  vr *= Math.exp(-grip * dt);
  if (inp.hand) vf *= Math.exp(-0.6 * dt);

  // поворот
  const a = cfg.steer / (1 + Math.pow(Math.abs(vf) / cfg.steerV, cfg.steerPow));
  let target = vf * Math.tan(car.steer * a) / 2.6;
  if (inp.hand) target *= 1.35;
  car.av += (target - car.av) * Math.min(1, dt * (inp.hand ? 4 : 10));

  car.vx = fx * vf + rx * vr;
  car.vz = fz * vf + rz * vr;
  car.h -= car.av * dt;
  car.x += car.vx * dt;
  car.z += car.vz * dt;

  // за пределами карты — назад
  if (Math.abs(car.x) > 1400 || Math.abs(car.z) > 900) spawn();

  const speed = Math.hypot(car.vx, car.vz);
  car.slip = speed > 3 ? Math.atan2(Math.abs(vr), Math.abs(vf)) * 180 / Math.PI : 0;
  car.drifting = !offroad && speed > 8 && car.slip > 12 && vf > 0;
  car.skidding = !offroad && speed > 4 && (Math.abs(vr) > 3.5 || (inp.hand && speed > 6));

  car.protect = Math.max(0, car.protect - dt);
  car.crashCd = Math.max(0, car.crashCd - dt);

  trafficInteraction(dt, speed);
  scoring(dt, speed, offroad);
}

function trafficInteraction(dt, speed) {
  for (const v of traffic.list) {
    const dx = car.x - v.x, dz = car.z - v.z;
    if (dx * dx + dz * dz > 900) { v.prevLong = NaN; continue; }
    const rx = -v.fz, rz = v.fx;
    const lon = dx * v.fx + dz * v.fz;
    const lat = dx * rx + dz * rz;
    const hl = (v.len + 4.4) / 2, hw = (v.wid + 1.9) / 2;

    if (car.protect <= 0 && Math.abs(lon) < hl && Math.abs(lat) < hw) {
      // столкновение: выталкиваем по меньшему перекрытию, гасим относительную скорость
      const tvx = v.fx * v.speed, tvz = v.fz * v.speed;
      let rvl = (car.vx - tvx) * v.fx + (car.vz - tvz) * v.fz;
      let rvt = (car.vx - tvx) * rx + (car.vz - tvz) * rz;
      const ol = hl - Math.abs(lon), ot = hw - Math.abs(lat);
      let nl = lon, nt = lat;
      if (ol < ot) { nl = Math.sign(lon) * hl; if (rvl * Math.sign(lon) < 0) rvl = -rvl * 0.25; rvt *= 0.7; }
      else { nt = Math.sign(lat) * hw; if (rvt * Math.sign(lat) < 0) rvt = -rvt * 0.3; rvl *= 0.6; }
      car.x = v.x + v.fx * nl + rx * nt; car.z = v.z + v.fz * nl + rz * nt;
      const impact = Math.hypot(car.vx - tvx, car.vz - tvz);
      car.vx = tvx + v.fx * rvl + rx * rvt; car.vz = tvz + v.fz * rvl + rz * rvt;
      car.av *= 0.3;
      if (impact > 5 && car.crashCd <= 0) {
        car.crashCd = 1;
        if (game.chain >= 1) loseChain('АВАРИЯ — серия потеряна');
        else toast('АВАРИЯ', '#ff5252');
      }
    }

    // «шашки»: обгон впритирку
    if (game.mode === 'traffic' && !Number.isNaN(v.prevLong) && v.prevLong < 0 && lon >= 0 && speed > 20 && car.protect <= 0) {
      const gap = Math.abs(lat) - hw;
      if (gap < 2.4 && gap > -0.01) {
        const close = gap < 1.0;
        const pts = (100 + (speed - 20) * 6) * (close ? 2.5 : 1);
        game.chain += pts * game.mult;
        game.mult = Math.min(10, game.mult + 1);
        game.chainTimer = 4;
        toast(close ? `ВПРИТИРКУ! +${fmt(pts)}` : `ОБГОН +${fmt(pts)}`, close ? '#ffd54f' : '#fff');
      }
    }
    v.prevLong = lon;
  }
}

function scoring(dt, speed, offroad) {
  if (game.mode === 'drift') {
    if (car.drifting) {
      game.driftTime += dt;
      game.mult = Math.min(8, 1 + Math.floor(game.driftTime / 1.5));
      game.chain += speed * (Math.min(car.slip, 70) / 15) * dt * game.mult * 2;
      game.chainTimer = 1.5;
    } else if (offroad && game.chain > 0) {
      loseChain('ВЫЛЕТ — серия потеряна');
    }
  }
  if (game.chain > 0) {
    game.chainTimer -= dt;
    if (game.chainTimer <= 0) bankChain();
  }
}

// =====================================================================
//  Сеть
// =====================================================================
const net = {
  ws: null, myId: 0, offset: 0, bestRtt: Infinity, remotes: new Map(), roster: [], sendT: 0, pingT: 0,
  connected: false,
};
const serverNow = () => Date.now() + net.offset;
const netStatus = document.getElementById('netStatus');

function connect() {
  if (location.protocol === 'file:') { netStatus.textContent = 'Офлайн: открой через сервер для мультиплеера'; return; }
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
  net.ws = ws;
  ws.onopen = () => { net.connected = true; netStatus.textContent = 'Сервер: подключено ✓'; };
  ws.onclose = () => {
    net.connected = false;
    netStatus.textContent = 'Сервер недоступен — переподключение…';
    if (game.running && game.online) { toast('Связь потеряна — играешь офлайн', '#ff5252'); game.online = false; clearRemotes(); }
    setTimeout(connect, 2000);
  };
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'welcome') {
      net.myId = m.id; net.offset = m.now - Date.now(); net.bestRtt = Infinity;
      startGame(m.mode, m.seed, m.code, true);
    } else if (m.t === 'error') {
      document.getElementById('menuError').textContent = m.text;
    } else if (m.t === 'pong') {
      const now = Date.now(), rtt = now - m.c;
      if (rtt < net.bestRtt) { net.bestRtt = rtt; net.offset = m.now - (m.c + rtt / 2); }
    } else if (m.t === 'snap' && game.online) {
      onSnap(m);
    } else if (m.t === 'leave') {
      removeRemote(m.id);
    } else if (m.t === 'info' && game.online) {
      toast(m.text, '#90caf9');
    }
  };
}
function send(m) { if (net.ws && net.ws.readyState === 1) net.ws.send(JSON.stringify(m)); }

function onSnap(m) {
  net.roster = m.players;
  const seen = new Set();
  for (const p of m.players) {
    if (p.id === net.myId) continue;
    seen.add(p.id);
    let r = net.remotes.get(p.id);
    if (!r) {
      const mesh = makeCar(p.color);
      mesh.add(makeLabel(p.name, p.color));
      scene.add(mesh);
      r = { mesh, buf: [], trail: [null, null], smokeT: 0 };
      net.remotes.set(p.id, r);
    }
    r.buf.push({ t: m.now, x: p.x, z: p.z, h: p.h, vx: p.vx, vz: p.vz, d: p.d });
    if (r.buf.length > 30) r.buf.shift();
  }
  for (const id of [...net.remotes.keys()]) if (!seen.has(id)) removeRemote(id);
  renderRoster();
}
function removeRemote(id) {
  const r = net.remotes.get(id);
  if (!r) return;
  scene.remove(r.mesh);
  r.mesh.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  net.remotes.delete(id);
}
function clearRemotes() { for (const id of [...net.remotes.keys()]) removeRemote(id); net.roster = []; renderRoster(); }

const lerpAngle = (a, b, t) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * t; };

function updateRemotes(dt) {
  const rt = serverNow() - 120; // рендерим чуть в прошлом и интерполируем между снапшотами
  for (const r of net.remotes.values()) {
    const b = r.buf;
    if (!b.length) continue;
    let st;
    if (rt <= b[0].t) st = b[0];
    else if (rt >= b[b.length - 1].t) {
      const l = b[b.length - 1], ex = Math.min(0.3, (rt - l.t) / 1000);
      st = { x: l.x + l.vx * ex, z: l.z + l.vz * ex, h: l.h, d: l.d, vx: l.vx, vz: l.vz };
    } else {
      let i = 0; while (b[i + 1].t < rt) i++;
      const a = b[i], c = b[i + 1], k = (rt - a.t) / (c.t - a.t);
      st = { x: a.x + (c.x - a.x) * k, z: a.z + (c.z - a.z) * k, h: lerpAngle(a.h, c.h, k), d: c.d, vx: c.vx, vz: c.vz };
    }
    r.mesh.position.set(st.x, 0, st.z);
    r.mesh.rotation.y = st.h;
    if (st.d) wheelEffects(r, st.x, st.z, st.h, st.vx, st.vz, dt, true);
    else r.trail = [null, null];
  }
}

function wheelEffects(obj, x, z, h, vx, vz, dt, withSmoke) {
  const fx = Math.sin(h), fz = Math.cos(h), rx = -fz, rz = fx;
  obj.smokeT -= dt;
  [-0.8, 0.8].forEach((lx, k) => {
    const wx = x + rx * lx - fx * 1.4, wz = z + rz * lx - fz * 1.4;
    emitSkid(obj.trail, k, wx, wz);
    if (withSmoke && obj.smokeT <= 0) emitSmoke(wx, wz, vx, vz);
  });
  if (obj.smokeT <= 0) obj.smokeT = 0.045;
}

// =====================================================================
//  HUD
// =====================================================================
const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.floor(n).toLocaleString('ru-RU');
let toastTimer = 0;
function toast(text, color) {
  const el = $('toast');
  el.textContent = text; el.style.color = color || '#fff';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

function renderRoster() {
  const box = $('players');
  const rows = game.online ? [...net.roster] : [{ id: 0, name: myName(), color: myColor, sc: game.total }];
  if (game.online && !rows.length) rows.push({ id: net.myId, name: myName(), color: myColor, sc: game.total });
  rows.sort((a, b) => b.sc - a.sc);
  box.innerHTML = '';
  for (const p of rows) {
    const d = document.createElement('div');
    const left = document.createElement('span');
    const dot = document.createElement('i'); dot.style.background = p.color;
    left.append(dot, document.createTextNode(p.name + (p.id === net.myId && game.online ? ' (ты)' : '')));
    const right = document.createElement('b');
    right.textContent = game.mode === 'free' ? '' : fmt(p.sc);
    d.append(left, right);
    box.append(d);
  }
}

const mini = $('minimap'), mctx = mini.getContext('2d');
function drawMinimap() {
  const W = mini.width, H = mini.height;
  const sc = Math.min((W - 12) / (L + 2 * R + 40), (H - 12) / (2 * R + 40));
  const mx = (x) => W / 2 + x * sc, my = (z) => H / 2 + z * sc;
  mctx.clearRect(0, 0, W, H);
  mctx.strokeStyle = 'rgba(255,255,255,.55)'; mctx.lineWidth = 4;
  mctx.beginPath();
  for (let s = 0; s <= P; s += 40) { const t = trackPoint(s); s === 0 ? mctx.moveTo(mx(t.x), my(t.z)) : mctx.lineTo(mx(t.x), my(t.z)); }
  mctx.closePath(); mctx.stroke();
  mctx.fillStyle = 'rgba(255,213,79,.25)';
  mctx.fillRect(mx(-LOT.hw), my(-LOT.hd), LOT.hw * 2 * sc, LOT.hd * 2 * sc);
  for (const [id, r] of net.remotes) {
    const p = net.roster.find((q) => q.id === id);
    mctx.fillStyle = p ? p.color : '#fff';
    mctx.beginPath(); mctx.arc(mx(r.mesh.position.x), my(r.mesh.position.z), 3.5, 0, 7); mctx.fill();
  }
  mctx.fillStyle = '#fff';
  mctx.beginPath(); mctx.arc(mx(car.x), my(car.z), 4.5, 0, 7); mctx.fill();
  mctx.fillStyle = myColor;
  mctx.beginPath(); mctx.arc(mx(car.x), my(car.z), 3, 0, 7); mctx.fill();
}

function updateHud(speed) {
  $('speed').textContent = Math.round(speed * 3.6);
  $('total').textContent = game.mode === 'free' ? '' : fmt(game.total);
  const chain = $('chain');
  if (game.chain >= 1) {
    chain.classList.remove('hidden');
    $('chainLabel').textContent = game.mode === 'drift' ? 'ДРИФТ' : 'ШАШКИ';
    $('chainValue').textContent = fmt(game.chain);
    $('chainMult').textContent = '×' + game.mult;
  } else chain.classList.add('hidden');
}

// =====================================================================
//  Меню
// =====================================================================
const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#f5f5f5', '#212121', '#ec407a'];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } },
};
let myColor = store.get('color') || COLORS[0];
let menuMode = 'drift';
const nameInput = $('name');
nameInput.value = store.get('name') || '';
const myName = () => nameInput.value.trim().slice(0, 16) || 'Игрок';

{
  const box = $('colors');
  for (const c of COLORS) {
    const b = document.createElement('button');
    b.style.background = c; if (c === myColor) b.classList.add('on');
    b.onclick = () => { myColor = c; store.set('color', c); box.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
    box.append(b);
  }
  $('modes').querySelectorAll('button').forEach((b) => {
    b.onclick = () => { menuMode = b.dataset.mode; $('modes').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
  });
  const params = new URLSearchParams(location.search);
  if (params.get('room')) $('code').value = params.get('room').toUpperCase().slice(0, 4);
}

function beforeStart() {
  store.set('name', myName());
  $('menuError').textContent = '';
  sound.init();
  if (sound.ctx && sound.ctx.state === 'suspended') sound.ctx.resume();
  // на телефоне: полный экран и горизонтальная ориентация (где браузер позволяет)
  if (isTouch && document.documentElement.requestFullscreen && !document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
      .catch(() => {});
  }
}
$('createBtn').onclick = () => {
  beforeStart();
  if (!net.connected) { $('menuError').textContent = 'Нет связи с сервером. Можно сыграть одному.'; return; }
  send({ t: 'create', mode: menuMode, name: myName(), color: myColor });
};
$('joinBtn').onclick = () => {
  beforeStart();
  const code = $('code').value.trim().toUpperCase();
  if (code.length !== 4) { $('menuError').textContent = 'Введи код из 4 символов'; return; }
  if (!net.connected) { $('menuError').textContent = 'Нет связи с сервером'; return; }
  send({ t: 'join', code, name: myName(), color: myColor });
};
$('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('joinBtn').click(); });
$('soloBtn').onclick = () => { beforeStart(); net.myId = 0; startGame(menuMode, 1, null, false); };
$('menuBtn').onclick = () => toMenu();
$('copyBtn').onclick = async () => {
  const link = `${location.origin}/?room=${game.code}`;
  try { await navigator.clipboard.writeText(link); toast('Ссылка скопирована', '#7CFC9A'); }
  catch { prompt('Скопируй ссылку:', link); }
};

function startGame(mode, seed, code, online) {
  game.mode = MODES[mode] ? mode : 'free';
  game.cfg = MODES[game.mode];
  game.online = online; game.code = code;
  game.total = 0; game.chain = 0; game.mult = 1; game.chainTimer = 0; game.driftTime = 0;
  clearRemotes();
  buildTraffic(seed >>> 0, game.cfg.perLane);
  if (car.mesh) scene.remove(car.mesh);
  car.mesh = makeCar(myColor);
  scene.add(car.mesh);
  spawn();
  game.running = true;
  document.body.classList.add('playing');
  $('menu').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('touch').classList.toggle('hidden', !isTouch);
  document.body.classList.toggle('touch', isTouch);
  $('modeName').textContent = game.cfg.name + (online ? '' : ' · офлайн');
  $('roomBox').classList.toggle('hidden', !online);
  $('roomCode').textContent = code || '—';
  if (online) history.replaceState(null, '', `?room=${code}`);
  renderRoster();
  toast(game.mode === 'drift' ? 'Ручник + газ = занос' : game.mode === 'traffic' ? 'Обгоняй впритирку!' : 'Катайся!', '#ffd54f');
}

function toMenu() {
  if (game.online) send({ t: 'leave' });
  game.running = false; game.online = false;
  document.body.classList.remove('playing');
  clearRemotes();
  $('menu').classList.remove('hidden');
  $('hud').classList.add('hidden');
  $('touch').classList.add('hidden');
  history.replaceState(null, '', location.pathname);
}

// =====================================================================
//  Главный цикл
// =====================================================================
const camPos = new THREE.Vector3(0, 30, -60), camLook = new THREE.Vector3();
let last = performance.now(), acc = 0, rosterT = 0;
const STEP = 1 / 120;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  const tSec = serverNow() / 1000 - 1.7e9;

  if (game.running) {
    car.input = readInput();
    acc += dt;
    while (acc >= STEP) {
      updateTraffic(tSec - acc);
      physicsStep(STEP, tSec - acc);
      acc -= STEP;
    }
  }
  updateTraffic(tSec);
  if (traffic.list.length) drawTraffic();

  const speed = Math.hypot(car.vx, car.vz);
  if (game.running && car.mesh) {
    const m = car.mesh;
    m.position.set(car.x, 0, car.z);
    m.rotation.y = car.h;
    m.visible = car.protect <= 0 || Math.floor(car.protect * 8) % 2 === 0;
    for (const w of m.userData.front) w.rotation.y = -car.steer * 0.5;
    const vf = car.vx * Math.sin(car.h) + car.vz * Math.cos(car.h);
    m.userData.body.rotation.z = -THREE.MathUtils.clamp(car.av * vf * 0.004, -0.07, 0.07);
    if (car.skidding) wheelEffects(car, car.x, car.z, car.h, car.vx, car.vz, dt, car.drifting || car.input.hand);
    else car.trail = [null, null];

    // сеть
    if (game.online) {
      net.sendT -= dt;
      if (net.sendT <= 0) {
        net.sendT = 1 / 15;
        send({ t: 's', x: car.x, z: car.z, h: car.h, vx: car.vx, vz: car.vz, d: car.skidding ? 1 : 0, sc: Math.floor(game.total) });
      }
      net.pingT -= dt;
      if (net.pingT <= 0) { net.pingT = 2; send({ t: 'ping', c: Date.now() }); }
    } else {
      rosterT -= dt;
      if (rosterT <= 0) { rosterT = 0.5; renderRoster(); }
    }

    // камера: сзади, слегка по вектору скорости (красиво в заносе)
    const fx = Math.sin(car.h), fz = Math.cos(car.h);
    let dx = fx, dz = fz;
    if (speed > 5) {
      const vx = car.vx / speed, vz = car.vz / speed, k = vf > 0 ? 0.35 : 0;
      dx = fx * (1 - k) + vx * k; dz = fz * (1 - k) + vz * k;
      const n = Math.hypot(dx, dz); dx /= n; dz /= n;
    }
    const dist = game.camFar ? 13 : 8.5, hgt = game.camFar ? 5.5 : 3.3;
    const want = new THREE.Vector3(car.x - dx * dist, hgt, car.z - dz * dist);
    camPos.lerp(want, 1 - Math.exp(-dt * 7));
    camLook.lerp(new THREE.Vector3(car.x + fx * 4, 1, car.z + fz * 4), 1 - Math.exp(-dt * 12));
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    const fov = 65 + Math.min(20, speed * 0.3);
    if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }

    sun.position.set(car.x + 40, 80, car.z + 25);
    sun.target.position.set(car.x, 0, car.z);

    updateHud(speed);
    drawMinimap();
    sound.update(Math.max(0, vf), car.input.gas, car.skidding ? car.slip : 0);
  } else {
    // фон меню: облёт трассы
    const t = now / 1000 * 0.05;
    camera.position.set(Math.cos(t) * 600, 160, Math.sin(t) * 320);
    camera.lookAt(0, 0, 0);
    if (sound.ctx) sound.update(0, 0, 0);
  }

  updateRemotes(dt);
  updateSmoke(dt);
  renderer.render(scene, camera);
}

document.body.classList.toggle('touch', isTouch);
$('rotate').onclick = () => document.body.classList.add('rotate-ok');
buildTraffic(1, MODES.free.perLane);
connect();
requestAnimationFrame(frame);

// для отладки из консоли
window.__game = { game, car, net, traffic };
