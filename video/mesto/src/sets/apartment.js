// Set: Arman's small rented studio (cold). Used by shots 2-5, 7-9a, 11, 13, 14.
import * as THREE from 'three';
import * as P from '../props.js';
import * as T from '../tex.js';
import * as C from '../cast.js';
import { drawPhone } from '../phoneui.js';

export function build(W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080e);
  const cam = new THREE.PerspectiveCamera(35, W / H, 0.02, 120);
  const RW = 2.6, RD = 3, RH = 2.7;
  const wallMat = new THREE.MeshStandardMaterial({ map: T.wallpaper(0x8e9aa6, 0x7c8996, { motif: 'stripe', repeat: [6, 2] }), roughness: 0.95 });
  const floorMat = new THREE.MeshStandardMaterial({ map: T.woodTex(0x8a6a4a, { planks: 8, repeat: [3, 3] }), roughness: 0.55 });
  const floor = P.mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), floorMat, 0, 0, 0, scene); floor.rotation.x = -Math.PI / 2;
  const ceil = P.mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), P.std(0xb8bec6, 0.95), 0, RH, 0, scene); ceil.rotation.x = Math.PI / 2;
  // walls (back wall has a window opening)
  const win = { x: 0.7, w: 1.5, y0: 0.9, y1: 2.4 };
  const wb = (w, h, x, y, z, ry = 0) => { const m = P.mesh(new THREE.PlaneGeometry(w, h), wallMat, x, y, z, scene); m.rotation.y = ry; return m; };
  wb(win.x - win.w / 2 + RW, RH, (-RW + win.x - win.w / 2) / 2, RH / 2, -RD);
  wb(RW - win.x - win.w / 2, RH, (RW + win.x + win.w / 2) / 2, RH / 2, -RD);
  wb(win.w, win.y0, win.x, win.y0 / 2, -RD); wb(win.w, RH - win.y1, win.x, (RH + win.y1) / 2, -RD);
  wb(RD + 1.62, RH, -RW, RH / 2, (-RD + 1.62) / 2, Math.PI / 2); wb(RD - 2.58, RH, -RW, RH / 2, (RD + 2.58) / 2, Math.PI / 2); wb(0.96, RH - 2.12, -RW, (RH + 2.12) / 2, 2.1, Math.PI / 2); wb(RD * 2, RH, RW, RH / 2, 0, -Math.PI / 2); wb(RW * 2, RH, 0, RH / 2, RD, Math.PI);
  // thick wall shell behind (so light only enters through window)
  const shell = new THREE.Mesh(new THREE.BoxGeometry(RW * 2 + 0.6, RH + 0.6, 0.25), P.std(0x333333)); shell.position.set(0, RH / 2, -RD - 0.14); shell.castShadow = true;
  const shellHole = new THREE.Group(); scene.add(shellHole);
  for (const [w, h, x, y] of [[win.x - win.w / 2 + RW + 0.3, RH + 0.6, (-RW - 0.3 + win.x - win.w / 2) / 2, RH / 2], [RW + 0.3 - win.x - win.w / 2, RH + 0.6, (RW + 0.3 + win.x + win.w / 2) / 2, RH / 2], [win.w, win.y0 + 0.3, win.x, (win.y0 - 0.3) / 2], [win.w, RH + 0.3 - win.y1, win.x, (RH + 0.3 + win.y1) / 2]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), P.std(0x333333)); m.position.set(x, y, -RD - 0.14); m.castShadow = true; shellHole.add(m);
  }
  const wf = P.windowFrame(win.w, win.y1 - win.y0, 0.18); wf.position.set(win.x, (win.y0 + win.y1) / 2, -RD - 0.05); scene.add(wf);
  P.box(win.w + 0.2, 0.04, 0.3, P.std(0xeae6de, 0.5), win.x, win.y0 - 0.02, -RD + 0.1, scene);
  const glassM = new THREE.MeshStandardMaterial({ color: 0x0a1018, transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0.8 });
  P.mesh(new THREE.PlaneGeometry(win.w, win.y1 - win.y0), glassM, win.x, (win.y0 + win.y1) / 2, -RD - 0.08, scene, false);
  // radiator under window
  for (let i = 0; i < 8; i++) P.box(0.07, 0.5, 0.08, P.std(0xe8e6e0, 0.4), win.x - 0.42 + i * 0.12, 0.42, -RD + 0.08, scene, 0.02);

  // outside: facade across the street + snow + distant lights
  const f = T.facade({ cols: 10, rows: 8, seed: 33, lit: 0.97, wall: '#a39c91' });
  const across = P.mesh(new THREE.PlaneGeometry(36, 24), new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.9 }), 2, 6, -22, scene, false);
  void across;
  const sky = P.mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshBasicMaterial({ color: 0x0b1424 }), 0, 30, -60, scene, false); void sky;
  const outSnow = P.makeSnow({ count: 2500, min: [-6, -2, -20], max: [8, 8, -3.3], size: 0.03, speed: 0.9, wind: 0.25 });
  scene.add(outSnow);
  scene.add(P.sagGarland(new THREE.Vector3(-8, 4, -15), new THREE.Vector3(10, 4.5, -15), 1.2, { n: 40, r: 0.07, k: 6 }));
  const streetLamp = P.sprite(P.glowMap(), 0xffb060, 3, 3, 0.7); streetLamp.position.set(-3, 3.5, -12); scene.add(streetLamp);

  // lights
  scene.add(new THREE.HemisphereLight(0x4a6488, 0x181c24, 0.55));
  const moon = new THREE.DirectionalLight(0x8fb0e8, 2.2); moon.position.set(win.x + 2.5, 5.5, -9); moon.target.position.set(win.x - 0.6, 0, -0.8);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 }); moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.02;
  scene.add(moon, moon.target);
  const lapLight = new THREE.PointLight(0xa8c8ff, 1.4, 3.2, 1.6); scene.add(lapLight);
  const kitchenLight = new THREE.PointLight(0xdfe9ff, 0, 2.6, 1.5); kitchenLight.position.set(-1.6, 1.45, -2.65); scene.add(kitchenLight);
  const phoneLight = new THREE.PointLight(0xbfd6ff, 0, 0.9, 2); scene.add(phoneLight);
  const fill = new THREE.PointLight(0x9cb8ee, 0, 4, 1.5); scene.add(fill);

  // furniture
  const wood = P.std(0x6a5038, 0.6), dark = P.std(0x2b2d31, 0.6);
  const desk = P.table(1.3, 0.62, 0.75, wood); desk.position.set(win.x, 0, -RD + 0.33); scene.add(desk);
  const lapCanvas = T.spreadsheet(0), lapTex = new THREE.CanvasTexture(lapCanvas); lapTex.colorSpace = THREE.SRGBColorSpace;
  const lap = P.laptop(lapTex); lap.position.set(win.x, 0.75, -RD + 0.38); scene.add(lap);
  lapLight.position.set(win.x, 1.0, -RD + 0.55);
  const mug = P.mug(0xd8dde4); mug.position.set(win.x + 0.42, 0.75, -RD + 0.42); scene.add(mug);
  for (let i = 0; i < 3; i++) { const pp = P.box(0.21, 0.004, 0.297, P.std(0xf2f2ee, 0.9), win.x - 0.45 + i * 0.02, 0.752 + i * 0.004, -RD + 0.35, scene); pp.rotation.y = 0.2 * i - 0.1; }
  const lamp = new THREE.Group(); lamp.position.set(win.x - 0.52, 0.75, -RD + 0.15); scene.add(lamp);
  P.cyl(0.07, 0.08, 0.02, dark, 0, 0.01, 0, lamp); P.cyl(0.01, 0.01, 0.38, dark, 0, 0.2, 0, lamp); const sh = P.cyl(0.04, 0.09, 0.12, dark, 0.05, 0.38, 0.02, lamp); sh.rotation.z = -0.6;
  const chairM = P.chair(P.std(0x3a3c40, 0.5)); chairM.position.set(win.x, 0, -RD + 1.0); chairM.rotation.y = Math.PI; scene.add(chairM);
  const noodle = P.noodleCup(); noodle.position.set(win.x + 0.3, 0.75, -RD + 0.62); scene.add(noodle);
  // kitchen corner
  const cab = P.std(0xdedcd6, 0.55), top = P.std(0x5a5e66, 0.35, 0.1);
  P.box(1.9, 0.86, 0.6, cab, -1.65, 0.43, -RD + 0.3, scene, 0.01);
  P.box(1.94, 0.04, 0.64, top, -1.65, 0.88, -RD + 0.3, scene);
  const sink = P.box(0.5, 0.05, 0.4, P.std(0xb8bcc4, 0.2, 0.9), -1.6, 0.885, -RD + 0.3, scene); void sink;
  P.box(0.44, 0.02, 0.34, P.std(0x22262c, 0.3, 0.6), -1.6, 0.905, -RD + 0.3, scene);
  const tap = new THREE.Group(); tap.position.set(-1.6, 0.9, -RD + 0.08); scene.add(tap);
  P.cyl(0.015, 0.015, 0.3, P.std(0xc8ccd2, 0.15, 1), 0, 0.15, 0, tap, 10); const sp = P.cyl(0.012, 0.012, 0.18, P.std(0xc8ccd2, 0.15, 1), 0, 0.3, 0.08, tap, 10); sp.rotation.x = Math.PI / 2;
  P.box(1.9, 0.6, 0.35, cab, -1.65, 1.85, -RD + 0.18, scene, 0.01);
  const led = P.box(1.7, 0.012, 0.03, P.emis(0xdfe9ff, 0), -1.65, 1.545, -RD + 0.06, scene);
  P.box(1.9, 0.05, 0.03, cab, -1.65, 1.53, -RD + 0.34, scene); led.castShadow = false;
  const tiles = P.mesh(new THREE.PlaneGeometry(1.9, 0.62), new THREE.MeshStandardMaterial({ map: T.wallpaper(0xd8dde2, 0xa0a8b2, { motif: 'stripe', repeat: [10, 3] }), roughness: 0.25 }), -1.65, 1.22, -RD + 0.005, scene, false); void tiles;
  const kettle = new THREE.Group(); kettle.position.set(-0.8, 0.9, -RD + 0.22); scene.add(kettle);
  P.cyl(0.07, 0.08, 0.18, P.std(0x2a2c30, 0.3, 0.5), 0, 0.09, 0, kettle);
  const fridge = P.box(0.6, 1.7, 0.62, P.std(0xe8e8e6, 0.35), -RW + 0.32, 0.85, -1.6, scene, 0.03); void fridge;
  // sofa bed + boxes
  const sofa = new THREE.Group(); sofa.position.set(RW - 0.45, 0, 0.6); scene.add(sofa);
  const sm = P.std(0x4a5260, 0.9); P.box(0.85, 0.42, 1.9, sm, 0, 0.21, 0, sofa, 0.05); P.box(0.22, 0.8, 1.9, sm, 0.32, 0.4, 0, sofa, 0.05);
  P.box(0.7, 0.08, 1.6, P.std(0x7a8494, 0.95), -0.05, 0.46, 0.1, sofa, 0.04);
  const card = P.std(0xb08a5a, 0.85);
  for (const [x, y, z, s] of [[RW - 0.4, 0.22, 2.3, 0.44], [RW - 0.9, 0.2, 2.5, 0.4], [RW - 0.45, 0.62, 2.3, 0.36]]) { const b = P.box(s * 1.2, s, s, card, x, y, z, scene, 0.01); b.rotation.y = x * 2; P.box(s * 1.21, 0.004, 0.06, P.std(0xc8b088, 0.4), x, y + s / 2 + 0.002, z, scene).rotation.y = x * 2; }
  // door + coat hook + jacket
  const doorPivot = new THREE.Group(); doorPivot.position.set(-RW + 0.02, 0, 2.55); scene.add(doorPivot);
  const door = P.box(0.05, 2.08, 0.9, P.std(0x5a4a3c, 0.55), 0, 1.04, -0.45, doorPivot, 0.01); void door;
  const handle = P.box(0.06, 0.02, 0.12, P.std(0xc0c4c8, 0.2, 1), 0.04, 1.0, -0.8, doorPivot); void handle;
  for (const z of [1.6, 2.6]) P.box(0.06, 2.16, 0.08, P.std(0xdedad2, 0.5), -RW + 0.03, 1.08, z, scene);
  P.box(0.06, 0.08, 1.08, P.std(0xdedad2, 0.5), -RW + 0.03, 2.16, 2.1, scene);
  const hall = new THREE.PointLight(0xffd9a0, 0, 4, 1.5); hall.position.set(-RW - 1.2, 1.9, 2.1); scene.add(hall);
  const hallWall = P.mesh(new THREE.PlaneGeometry(3, 2.7), P.std(0xc8b89a, 0.9), -RW - 1.5, 1.35, 2.1, scene); hallWall.rotation.y = Math.PI / 2;
  const hookBoard = P.box(0.03, 0.08, 0.6, wood, -RW + 0.015, 1.72, 1.3, scene); void hookBoard;
  const jacket = new THREE.Group(); jacket.position.set(-RW + 0.12, 1.72, 1.3); scene.add(jacket);
  const jq = T.quilted(0x8a3224);
  const jm = new THREE.MeshStandardMaterial({ map: jq.map, bumpMap: jq.bump, bumpScale: 3, roughness: 0.55 });
  const jb = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 6, 16), jm); jb.scale.set(1, 1, 0.55); jb.position.set(0.04, -0.35, 0); jb.rotation.y = Math.PI / 2; jb.castShadow = true; jacket.add(jb);
  for (const s of [-1, 1]) { const sl = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 4, 10), jm); sl.position.set(0.05, -0.42, s * 0.19); sl.rotation.x = s * 0.08; sl.castShadow = true; jacket.add(sl); }
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), jm); hood.scale.set(0.8, 0.7, 1); hood.position.set(0.02, -0.02, 0); jacket.add(hood);
  // wall clock (right wall, visible from desk)
  const clock = P.wallClock(); clock.position.set(RW - 0.01, 1.95, -1.5); clock.rotation.y = -Math.PI / 2; scene.add(clock);
  // ceiling bulb (off)
  P.cyl(0.005, 0.005, 0.4, dark, 0, RH - 0.2, 0, scene, 6); P.sph(0.05, P.std(0xdddddd, 0.2), 0, RH - 0.42, 0, scene, 12);

  // phone
  const pc = document.createElement('canvas'); pc.width = 540; pc.height = 1170;
  const ph = P.phone(pc); scene.add(ph);
  ph.canvas = pc; ph.draw = st => { drawPhone(pc, st); ph.tex.needsUpdate = true; };

  const arman = C.arman('hoodie', 11); scene.add(arman.root);
  return { scene, cam, hall, fill, arman, lap, lapCanvas, lapTex, lapLight, kitchenLight, led, phone: ph, phoneLight, noodle, mug, chair: chairM, doorPivot, jacket, clock, win, outSnow, moon, desk, RW, RD, RH };
}
