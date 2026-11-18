// Shots 9-14: dad's video, tear, station flashback, 23:08, decision, door slam
import * as THREE from 'three';
import { kf, kv, clamp, inv, sstep, aim, V3, shake, lerp, ease, env } from './core.js';
import { G } from './grades.js';
import * as O from './overlay.js';
import { apartmentBase } from './shots_a.js';

export const shots = [];
const Lw = (c, x, y, z) => V3(x, y, z).applyMatrix4(c.root.matrixWorld);

// ---------- the family video (house set, dad's phone POV) ----------
function sitAt(c, hs, seat, o = {}) {
  const [x, z, ry] = hs.seats[seat];
  c.reset(); c.place(x, 0, z, ry); c.root.updateMatrixWorld(true);
  c.sit(0.47, 0.4, { lean: o.lean ?? 0.08 });
  if (o.hands !== false) {
    c.armIK('L', Lw(c, 0.17, 0.8, 0.36), Lw(c, 0.5, 0.6, 0.0));
    c.armIK('R', Lw(c, -0.17, 0.8, 0.36), Lw(c, -0.5, 0.6, 0.0));
  }
}
function wave(c, side, t, amt, height = 1.45) {
  if (amt <= 0) return;
  const sx = side === 'L' ? 1 : -1;
  const base = Lw(c, sx * 0.24, height, 0.22).add(V3(0, 0, 0));
  const hand = base.clone().add(new THREE.Vector3(Math.sin(t * 9) * 0.06 * sx, 0, 0).applyQuaternion(c.root.quaternion));
  const rest = Lw(c, sx * 0.17, 0.8, 0.36);
  c.armIK(side, rest.lerp(hand, amt), Lw(c, sx * 0.6, 0.9, -0.1), [0, 0, 0]);
}
export function houseVideo(hs, t) {
  const C = hs.cast;
  hs.snow.setTime(t); hs.fw.setTime(0); hs.fwLight.intensity = 0;
  for (const k of ['dad', 'arman', 'armanH']) C[k].root.visible = false;
  hs.doorPivot.rotation.y = 0; hs.fridgeArt.visible = false; hs.doorSpill.intensity = 0; hs.paper.visible = true;
  hs.clock.setTime(22, 50 + (t - 30) / 60, (t * 1) % 60);
  for (const cd of hs.candles) cd.flame.scale.set(0.07 * (1 + Math.sin(t * 13 + cd.position.x * 9) * 0.06), 0.11 * (1 + Math.sin(t * 17) * 0.08), 1);
  // mom
  const mom = C.mom; sitAt(mom, hs, 'mom');
  mom.expr('joy', 0.8); wave(mom, 'R', t, sstep(31.3, 31.7, t) * (1 - sstep(32.6, 33.0, t)));
  mom.look(t < 33 ? hs.camB.position : t < 36.5 ? C.aiko.root.position.clone().add(V3(0, 1, 0)) : hs.emptyPlate.position.clone(), 0.6);
  if (t > 36.5) mom.mixExpr('joy', 'touched', sstep(36.5, 38, t) * 0.8);
  mom.update(t);
  const gm = C.grandma; sitAt(gm, hs, 'grandma');
  gm.expr('joy', 0.9); wave(gm, 'L', t * 0.7, sstep(31.5, 32.0, t) * (1 - sstep(33.2, 33.8, t)), 1.3);
  gm.look(t < 34 ? hs.camB.position : C.aiko.root.position.clone().add(V3(0, 0.9, 0)), 0.5); gm.update(t);
  const un = C.uncle; sitAt(un, hs, 'uncle');
  un.expr('joy', 1); un.face.mouthOpen = 0.3 * sstep(31.4, 31.6, t) * (1 - sstep(32.4, 32.8, t));
  const gl = sstep(31.4, 31.9, t) * (1 - sstep(32.8, 33.3, t));
  un.armIK('R', Lw(un, -0.17, 0.8, 0.36).lerp(Lw(un, -0.15, 1.45, 0.3), gl), Lw(un, -0.6, 0.9, -0.1));
  un.look(t < 34 ? hs.camB.position : C.aiko.root.position.clone().add(V3(0, 0.9, 0)), 0.5); un.update(t);
  // Aiko
  const a = C.aiko; a.reset();
  const path = [[31.6, [3.4, -1.7]], [32.85, [1.62, -0.5]], [36.2, [1.62, -0.5]], [37.1, [0.0, -1.28]]];
  const pp = kf(t, path.map(([tt, p]) => [tt, p, 'io2']));
  const moving = (t > 31.6 && t < 32.85) || (t > 36.2 && t < 37.1);
  let ry = t < 32.85 ? Math.atan2(1.62 - 3.4, -0.5 + 1.7) : t < 36.0 ? Math.PI / 2 : t < 37.1 ? Math.atan2(0.0 - 1.62, -1.28 + 0.5) : 0.72;
  if (t > 32.6 && t < 33.0) ry = lerp(Math.atan2(1.62 - 3.4, -0.5 + 1.7), Math.PI / 2, sstep(32.6, 33.0, t));
  if (t > 37.0) ry = lerp(Math.atan2(0.0 - 1.62, -1.28 + 0.5), 0.72, sstep(37.0, 37.4, t));
  a.place(pp[0], 0, pp[1], ry); a.root.updateMatrixWorld(true);
  const paper = hs.paper;
  if (moving) { a.cycle((t - 31.6) * (t < 33 ? 2.2 : 1.6), t < 33 ? 0.9 : 0.5); a.hairSwing.z = Math.sin(t * 14) * 0.15; }
  else a.stand({ spread: 0.07 });
  a.root.updateMatrixWorld(true);
  // drawing: held at chest while running, raised to the lens 33.0-35.2, carried, then placed on the plate
  const raise = sstep(32.95, 33.35, t) * (1 - sstep(35.2, 35.7, t));
  let pc;
  if (t < 37.25) {
    const chest = Lw(a, 0, 0.78, 0.17), up = Lw(a, 0, 0.98 + 0.02 * Math.sin(t * 3), 0.27);
    pc = chest.lerp(up, raise);
    paper.position.copy(pc);
    const yaw = a.root.rotation.y;
    paper.rotation.set(-0.35 * raise - 0.2, yaw, 0, 'YXZ');
  } else {
    const plate = hs.emptyPlate.position.clone().add(V3(0, 0.025, 0));
    const lift = Lw(a, 0, 0.82, 0.25);
    const k = sstep(37.25, 38.0, t);
    pc = lift.lerp(plate, k).add(V3(0, Math.sin(k * Math.PI) * 0.05, 0));
    paper.position.copy(pc);
    paper.rotation.set(lerp(-0.2, -Math.PI / 2, k), lerp(a.root.rotation.y, 0.6, k), 0, 'YXZ');
  }
  paper.updateMatrixWorld(true);
  const edge = (sx, dy = 0) => V3(sx * 0.13, dy - 0.03, -0.02).applyMatrix4(paper.matrixWorld);
  if (t < 38.6) {
    const smooth = sstep(37.9, 38.1, t) * (1 - sstep(38.4, 38.6, t));
    a.armIK('L', edge(-1, smooth * 0.0).add(V3(Math.sin(t * 10) * 0.02 * smooth, 0.03 * smooth, 0)), Lw(a, 0.4, 0.6, -0.2));
    a.armIK('R', edge(1).add(V3(-Math.sin(t * 10) * 0.02 * smooth, 0.03 * smooth, 0)), Lw(a, -0.4, 0.6, -0.2));
  } else { a.armIK('L', Lw(a, 0.12, 0.6, 0.16), Lw(a, 0.4, 0.6, -0.2)); a.armIK('R', Lw(a, -0.1, 0.62, 0.12), Lw(a, -0.4, 0.6, -0.2)); a.j.spine.rotation.x = 0; }
  if (t > 37.2 && t < 38.7) a.j.spine.rotation.x = 0.35 * sstep(37.2, 37.6, t) * (1 - sstep(38.3, 38.7, t));
  a.curl.L = a.curl.R = 0.55;
  // face: running joy -> proud hope with drawing -> careful -> hopeful sad smile at camera
  if (t < 33.0) a.expr('joy', 1);
  else if (t < 35.3) { a.expr('proud', 1); a.face.mouthOpen = 0.25 + 0.1 * Math.sin(t * 8); }
  else if (t < 36.2) a.expr('hope', 1);
  else if (t < 38.6) a.expr('longing', 0.6);
  else a.mixExpr('hope', 'touched', 0.5);
  const camP = hs.camB.position;
  if (t < 35.0 || t > 38.7) a.look(camP, 0.8); else if (t < 36.2) a.look(camP.clone().add(V3(0.3, 0.35, 0)), 0.8); else a.look(hs.emptyPlate.position, 0.7);
  a.update(t);
  // camera: shaky handheld phone
  const cam = hs.camB;
  const p = kv(t, [[30, [2.3, 1.52, -0.3]], [32.6, [2.32, 1.5, -0.3]], [33.4, [2.2, 1.38, -0.38]], [35.4, [2.12, 1.36, -0.4]], [37.2, [1.45, 1.42, 0.45], 'io'], [40, [1.3, 1.36, 0.3]]]);
  const tg = kv(t, [[30, [-0.6, 0.95, -0.5]], [32.4, [-0.4, 0.95, -0.45]], [33.1, [1.62, 0.95, -0.5]], [35.5, [1.6, 0.95, -0.5]], [37.2, [0.3, 0.85, -0.95], 'io'], [40, [0.32, 0.83, -0.9]]]);
  if (t > 33.2 && t < 35.4) tg.copy(V3(1.62, 0.96, -0.48).lerp(paper.position, 0.6)).add(V3(0, -0.02 * sstep(33.2, 33.6, t) * (1 - sstep(35.0, 35.4, t)), 0));
  p.add(shake(t, 0.012, 1.6, 7)); tg.add(shake(t, 0.03, 1.1, 8));
  cam.aspect = env.W / env.H; cam.updateProjectionMatrix();
  aim(cam, p, tg, kf(t, [[30, 42], [33.2, 44], [34.2, 41], [35.4, 42], [38.3, 36], [40, 32]]), Math.sin(t * 0.9) * 0.03);
  return cam;
}
let rt = null;
function landScreen(ph, tex) {
  if (!ph.land) { ph.land = new THREE.Mesh(new THREE.PlaneGeometry(0.148, 0.068), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 1.15, 1.15) })); ph.land.position.z = 0.0047; ph.land.rotation.z = Math.PI / 2; ph.add(ph.land); }
  ph.land.material.map = tex; ph.land.material.needsUpdate = true; ph.land.visible = true;
  ph.screen.material.map = null; ph.screen.material.color.set(0x000000); ph.screen.material.needsUpdate = true;
}
function videoTexture(t) {
  const hs = env.get('house');
  const cam = houseVideo(hs, t);
  const a = cam.aspect; cam.aspect = 2.2; cam.updateProjectionMatrix();
  rt ||= new THREE.WebGLRenderTarget(880, 400, { type: THREE.HalfFloatType });
  const r = env.renderer, prev = r.getRenderTarget();
  r.setRenderTarget(rt); r.clear(); r.render(hs.scene, cam); r.setRenderTarget(prev);
  cam.aspect = a; cam.updateProjectionMatrix();
  return rt.texture;
}
function videoUI(ctx, t, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const y0 = O.PIC.y, y1 = O.PIC.y + O.PIC.h;
  // top: sender
  const g = ctx.createLinearGradient(0, y0, 0, y0 + 170); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y0, 1920, 170);
  const ag = ctx.createLinearGradient(60, y0 + 30, 110, y0 + 80); ag.addColorStop(0, '#6ab0ff'); ag.addColorStop(1, '#2a72d8');
  ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(90, y0 + 58, 26, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '600 26px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('П', 90, y0 + 59);
  ctx.textAlign = 'left'; ctx.font = '600 28px Inter'; ctx.fillText('Папа', 132, y0 + 48); ctx.font = '400 21px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText('сегодня в 22:50', 132, y0 + 78);
  // bottom: progress + caption
  const g2 = ctx.createLinearGradient(0, y1 - 110, 0, y1); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g2; ctx.fillRect(0, y1 - 110, 1920, 110);
  const prog = clamp((t - 30) / 12);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(80, y1 - 46, 1760, 5);
  ctx.fillStyle = '#fff'; ctx.fillRect(80, y1 - 46, 1760 * prog, 5); ctx.beginPath(); ctx.arc(80 + 1760 * prog, y1 - 43.5, 9, 0, 7); ctx.fill();
  const sec = Math.floor((t - 30));
  ctx.font = '500 22px Inter'; ctx.fillText(`0:${String(Math.max(0, sec)).padStart(2, '0')}`, 80, y1 - 80); ctx.textAlign = 'right'; ctx.fillText('0:12', 1840, y1 - 80);
  const ce = ease.out(clamp((t - 31.9) / 0.5));
  if (ce > 0) {
    ctx.globalAlpha *= ce; ctx.textAlign = 'center'; ctx.font = 'italic 400 44px "Cormorant Garamond"'; ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 14;
    ctx.textAlign = 'left'; ctx.font = 'italic 400 40px "Cormorant Garamond"'; ctx.fillText('«Айко весь день рисовала»', 132, y0 + 124 + (1 - ce) * 10);
  }
  ctx.restore();
}

// S9a: Arman at the sink, phone in landscape playing the video; camera pushes into the screen
const S9a = {
  id: 9, t0: 30, t1: 31.4, set: 'apartment',
  run(lt, s, t) {
    const tex = videoTexture(t);
    apartmentBase(s, t, { lap: 0.5, kitchen: 0.9, lid: -1.2, noodle: true, phoneVis: true });
    s.noodle.position.set(-1.2, 0.905, -2.62);
    const a = s.arman; a.reset(); a.place(-1.6, 0, -2.05, Math.PI); a.root.updateMatrixWorld(true); a.stand({ spread: 0.12 });
    a.j.spine.rotation.x = 0.1; a.j.head.rotation.x = 0.35;
    const ph = s.phone; ph.visible = true;
    ph.position.copy(Lw(a, 0, 1.12, 0.36)); ph.lookAt(Lw(a, 0, 1.55, 0.1)); ph.rotateZ(-Math.PI / 2); ph.updateMatrixWorld(true);
    a.armIK('L', V3(-0.095, 0, -0.03).applyMatrix4(ph.matrixWorld), Lw(a, 0.45, 0.8, -0.1), [0, 0, 0.5]);
    a.armIK('R', V3(0.095, 0, -0.03).applyMatrix4(ph.matrixWorld), Lw(a, -0.45, 0.8, -0.1), [0, 0, -0.5]);
    a.curl.L = a.curl.R = 0.85;
    a.expr('longing', 0.6); a.update(t);
    landScreen(ph, tex);
    s.phoneLight.intensity = 0.05; s.phoneLight.position.copy(V3(0, 0, 0.2).applyMatrix4(ph.matrixWorld));
    const scr = V3(0, 0, 0).applyMatrix4(ph.matrixWorld), n = V3(0, 0, 1).applyQuaternion(ph.quaternion);
    const k = ease.in2(clamp(lt / 1.7));
    const pos = scr.clone().addScaledVector(n, lerp(0.26, 0.075, k));
    a.j.head.visible = false;
    aim(s.cam, pos, scr, 30);
    return { look: { bloom: { strength: 0.35, threshold: 0.9 }, grade: { ...G.now }, dof: { focus: pos.distanceTo(scr), aperture: 0.2, maxBlur: 10 } }, comp: { grain: 0.05 } };
  }
};
// S9b: inside the video
const S9b = {
  id: 10, t0: 31.4, t1: 40, set: 'house', trans: { dur: 0.6, mode: 0 },
  run(lt, s, t) {
    const cam = houseVideo(s, t);
    return { cam, look: { bloom: { strength: 0.75, radius: 0.6, threshold: 0.7 }, grade: { ...G.video }, dof: { focus: t > 33.2 && t < 35.4 ? 0.75 : 2.2, aperture: 0.05, maxBlur: 6 } }, comp: { grain: 0.035 }, overlay: ctx => videoUI(ctx, t) };
  }
};

// S11: macro — the eye, the reflection, the tear
const S11 = {
  id: 11, t0: 40, t1: 44, set: 'apartment',
  run(lt, s, t) {
    const tex = videoTexture(Math.min(t, 41.9) );
    apartmentBase(s, t, { lap: 0.4, kitchen: 0.7, lid: -1.2, phoneVis: true, fill: 0.6, fillPos: V3(-0.9, 1.6, -1.2) });
    const a = s.arman; a.reset(); a.place(-1.6, 0, -2.05, Math.PI); a.root.updateMatrixWorld(true); a.stand({ spread: 0.12 });
    a.j.spine.rotation.x = 0.1; a.j.head.rotation.x = 0.3; a.j.head.rotation.z = 0.05;
    const ph = s.phone; ph.visible = true;
    ph.position.copy(Lw(a, 0, 1.12, 0.36)); ph.lookAt(Lw(a, 0, 1.55, 0.1)); ph.rotateZ(-Math.PI / 2); ph.updateMatrixWorld(true);
    landScreen(ph, tex);
    a.armIK('L', V3(-0.095, 0, -0.03).applyMatrix4(ph.matrixWorld), Lw(a, 0.45, 0.8, -0.1)); a.armIK('R', V3(0.095, 0, -0.03).applyMatrix4(ph.matrixWorld), Lw(a, -0.45, 0.8, -0.1));
    a.autoBlink = false; a.blink(43.75);
    a.mixExpr('longing', 'touched', sstep(0.3, 2.2, lt)); a.face.press = 0.25 * sstep(1.5, 2.5, lt); a.face.lidLo = 0.15; a.face.lidUp = 0.05; a.face.wide = 0.1;
    a.gaze.pitch = 0.3; a.gaze.yaw = -0.05; a.saccade = 0.5;
    a.setTear('L', clamp((lt - 0.5) / 3.0), sstep(0.2, 1.2, lt));
    a.update(t);
    // reflection of the screen on the cornea
    if (!s.refl) {
      const E = a.eyes.L, er = a.eyeRf * a.o.head[0];
      s.refl = new THREE.Mesh(new THREE.PlaneGeometry(er * 0.7, er * 0.32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.refl.position.set(er * 0.05, -er * 0.3, er * 0.99); s.refl.rotation.x = 0.35; E.grp.add(s.refl);
    }
    s.refl.material.map = tex; s.refl.visible = true;
    s.phoneLight.intensity = 0.25; s.phoneLight.color.set(0xffc890); s.phoneLight.position.copy(V3(0, 0, 0.12).applyMatrix4(ph.matrixWorld));
    const eye = new THREE.Vector3(); a.eyes.L.grp.getWorldPosition(eye);
    const k = ease.sine(lt / 4);
    const pos = eye.clone().add(V3(lerp(0.2, 0.16, k), lerp(0.0, -0.01, k), lerp(0.26, 0.21, k)).applyQuaternion(a.root.quaternion)).add(shake(t, 0.0012, 0.5, 11));
    const tgt = eye.clone().add(V3(0, -0.012 - k * 0.012, 0)).add(V3(-0.025, 0, 0).applyQuaternion(a.root.quaternion));
    aim(s.cam, pos, tgt, 20);
    return { look: { bloom: { strength: 0.5, threshold: 0.8 }, grade: { ...G.now, temp: -0.25, exposure: 1.25 }, dof: { focus: pos.distanceTo(eye), aperture: 1.6, maxBlur: 20 } }, comp: { grain: 0.05 } };
  }
};

// S12: flashback — station, last autumn
const S12 = {
  id: 12, t0: 44, t1: 48, set: 'station', trans: { dur: 0.8, mode: 1 },
  run(lt, s, t) {
    s.leaves.setTime(t);
    const tx = 0.5 * 0.95 * Math.max(0, lt - 0.2) ** 2;
    s.train.position.x = tx;
    const a = s.aiko, m = s.mom;
    // Aiko: waves, runs along a few steps, stops, waves slower; smile fades
    const runK = sstep(1.0, 1.3, lt) * (1 - sstep(2.2, 2.6, lt));
    const ax = 0.7 + kf(lt, [[1.0, 0], [2.5, 2.4, 'out2']]);
    const camX = tx + 0.2 + sstep(1.5, 4, lt) * 0.25;
    const face = Math.atan2(camX - ax, -1.8 - 1.0);
    a.reset(); a.place(ax, 1.1, 1.0, lerp(face, Math.PI / 2 + 0.4, runK)); a.root.updateMatrixWorld(true);
    if (runK > 0.05) { a.cycle(lt * 2.4, 0.9); }
    else a.stand({ spread: 0.08 });
    a.root.updateMatrixWorld(true);
    const wv = 1 - sstep(3.3, 3.9, lt) * 0.7;
    const hand = Lw(a, -0.2, 1.22 + Math.sin(lt * 10) * 0.03, 0.12).add(V3(Math.sin(lt * (lt < 3 ? 11 : 6)) * 0.07, 0, 0));
    a.armIK('R', Lw(a, -0.12, 0.6, 0.05).lerp(hand, wv), Lw(a, -0.5, 0.9, -0.2));
    a.expr(lt < 2.6 ? 'joy' : 'sad', 1); if (lt > 2.6) a.mixExpr('joy', 'sad', sstep(2.6, 3.6, lt));
    a.face.mouthOpen = lt < 2.5 ? 0.2 : 0;
    a.hairSwing.z = Math.sin(lt * 12) * 0.2 * runK;
    const camP = V3(tx + 0.2 + sstep(1.5, 4, lt) * 0.25, 1.95, -1.8);
    a.look(camP, 0.85); a.update(t);
    m.reset(); m.place(-0.1, 1.1, 1.9, Math.PI + 0.15); m.root.updateMatrixWorld(true); m.stand({ spread: 0.1 });
    m.armIK('L', Lw(m, 0.22, 1.42 + Math.sin(lt * 5) * 0.02, 0.18).add(V3(Math.sin(lt * 5) * 0.04, 0, 0)), Lw(m, 0.6, 1.0, -0.2));
    m.armIK('R', Lw(m, -0.05, 1.25, 0.12), Lw(m, -0.5, 0.9, 0));
    m.expr('longing', 1); m.look(camP, 0.6); m.update(t);
    // camera inside the train, turning to keep her in view
    const head = a.root.position.clone().add(V3(0, 0.9, 0));
    const tg = head.clone().lerp(V3(ax - 0.3, 1.6, 1.4), 0.25);
    aim(s.cam, camP.add(shake(t, 0.006, 1.2, 13)), tg, 30);
    return { look: { bloom: { strength: 0.6, threshold: 0.75 }, grade: { ...G.flash }, dof: { focus: camP.distanceTo(head), aperture: 0.25, maxBlur: 10 } }, comp: { grain: 0.11, dust: 0.8 } };
  }
};

// S13a: the clock — 23:08
const S13a = {
  id: 13, t0: 48, t1: 50, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 0.4, kitchen: 0.6, lid: -1.2, clock: [23, 8, 15 + lt] }); s.arman.root.visible = false;
    const c = new THREE.Vector3(); s.clock.getWorldPosition(c);
    const k = ease.sine(lt / 2);
    aim(s.cam, c.clone().add(V3(-lerp(0.62, 0.5, k), -0.05, 0.12)), c, 32);
    return { look: { bloom: { strength: 0.3 }, grade: { ...G.now, exposure: 1.35 }, dof: { focus: 0.55, aperture: 0.3, maxBlur: 10 } }, comp: { grain: 0.05 },
      overlay: ctx => { const a = ease.out(clamp((lt - 0.2) / 0.5)) * (1 - clamp((lt - 1.7) / 0.3)); O.clockText(ctx, 23 * 60 + 8, { x: 560, y: 540, size: 150, alpha: a * 0.95 }); } };
  }
};
// S13b: on the floor against the cabinets — looks at the clock, then the door. Decision.
function floorPose(a, s) {
  a.place(-1.45, 0, -2.08, 0); a.root.updateMatrixWorld(true);
  a.j.pelvis.position.set(0, 0.13, -0.05); a.j.spine.rotation.x = -0.12;
  for (const sd of ['L', 'R']) { const sx = sd === 'L' ? 1 : -1; a.legIK(sd, Lw(a, sx * 0.17, a.ankleH, 0.52), Lw(a, sx * 0.25, 0.8, 0.6)); }
  a.armIK('L', Lw(a, 0.2, 0.52, 0.42), Lw(a, 0.5, 0.4, 0.1)); // forearm resting on knee
  a.armIK('R', Lw(a, -0.16, 0.3, 0.28), Lw(a, -0.5, 0.4, 0.1)); // phone hand on floor-ish
}
const S13b = {
  id: 14, t0: 50, t1: 53, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 0.4, kitchen: 0.8, lid: -1.2, phoneVis: true, clock: [23, 8, 17 + lt], fill: 1.2, fillPos: V3(-0.7, 1.3, -0.9) });
    const a = s.arman; a.reset(); floorPose(a, s);
    const ph = s.phone; ph.visible = true; ph.screen.material.map = ph.tex; ph.draw({ mode: 'off' });
    ph.position.copy(Lw(a, -0.17, 0.25, 0.32)); ph.rotation.set(-1.2, 0, 0.3);
    const clockP = new THREE.Vector3(); s.clock.getWorldPosition(clockP);
    const doorP = V3(-2.55, 1.2, 2.1);
    // eyes first, head follows: clock (0.3-1.4), then door (1.7-3)
    const toClock = sstep(0.25, 0.75, lt) * (1 - sstep(1.55, 1.85, lt)), toDoor = sstep(1.6, 2.0, lt);
    const gazeT = V3(-1.0, 0.95, -1.0).lerp(clockP, toClock).lerp(doorP, toDoor);
    a.look(gazeT, 0.25 + 0.65 * Math.max(sstep(0.35, 0.95, lt) * (1 - sstep(1.6, 2.0, lt)), sstep(1.75, 2.3, lt)), 1);
    a.mixExpr('sad', 'determined', sstep(1.9, 2.8, lt)); a.face.lidUp *= 1 - toClock * 0.5;
    a.autoBlink = false; a.blink(51.55); a.blink(52.1);
    a.breath = 1 + sstep(2.0, 2.6, lt) * 2; a.breathRate = 0.35;
    a.update(t);
    const head = Lw(a, 0, 0.95, 0.05);
    const k = ease.sine(lt / 3);
    const pos = V3(lerp(-0.85, -0.98, k), lerp(0.88, 0.9, k), lerp(-1.15, -1.32, k)).add(shake(t, 0.004, 0.6, 14));
    aim(s.cam, pos, head, 30);
    return { look: { bloom: { strength: 0.4 }, grade: { ...G.now, exposure: 1.3 }, dof: { focus: pos.distanceTo(head), aperture: 0.6, maxBlur: 14 } }, comp: { grain: 0.05 } };
  }
};
// S14a: springs up
const S14a = {
  id: 15, t0: 53, t1: 54.2, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 0.4, kitchen: 0.8, lid: -1.2, clock: [23, 8, 20 + lt], fill: 1.2, fillPos: V3(-0.6, 1.3, -0.8) });
    const a = s.arman; a.reset();
    const up = ease.out(sstep(0.08, 0.5, lt));
    if (lt < 0.55) {
      floorPose(a, s);
      a.j.pelvis.position.y = lerp(0.13, a.hipY * 0.85, up); a.j.pelvis.position.z = lerp(-0.05, 0.18, up);
      a.j.spine.rotation.x = lerp(-0.12, 0.5, sstep(0, 0.25, lt)) * (1 - up * 0.7);
      for (const sd of ['L', 'R']) { const sx = sd === 'L' ? 1 : -1; a.legIK(sd, Lw(a, sx * 0.14, a.ankleH, lerp(0.52, 0.15, up)), Lw(a, sx * 0.25, 0.8, 0.8)); }
      for (const sd of ['L', 'R']) { const sx = sd === 'L' ? 1 : -1; a.j['sh' + sd].quaternion.identity(); a.j['sh' + sd].rotation.set(-0.5 + up * 0.3, 0, sx * 0.15); a.j['el' + sd].rotation.set(-0.9 + up * 0.4, 0, 0); }
    } else {
      const wk = clamp((lt - 0.55) / 0.65);
      a.place(lerp(-1.45, -2.2, wk), 0, lerp(-1.9, -0.6, wk), lerp(-0.6, -0.5, wk)); a.root.updateMatrixWorld(true);
      a.cycle((lt - 0.55) * 2.6, 0.75);
    }
    a.expr('determined', 1); a.look(V3(-2.55, 1.4, 2.1), 0.7);
    a.update(t);
    aim(s.cam, V3(-0.4, 0.55, -0.85).add(shake(t, 0.01, 2, 15)), V3(-1.6, 1.0, -1.8), 40);
    return { look: { bloom: { strength: 0.4 }, grade: { ...G.now, exposure: 1.3 } }, comp: { grain: 0.05 } };
  }
};
// S14b: hand grabs the jacket
const S14b = {
  id: 16, t0: 54.2, t1: 55.0, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 0.4, kitchen: 0.6, lid: -1.2, clock: [23, 8, 21], fill: 1.5, fillPos: V3(-1.6, 1.8, 0.6) });
    const a = s.arman; a.reset();
    a.place(-1.75, 0, 1.0 + lt * 0.4, -Math.PI / 2 - 0.3); a.root.updateMatrixWorld(true); a.stand({ spread: 0.12 });
    const hook = V3(-2.48, 1.66, 1.3);
    const g = sstep(0.12, 0.3, lt);
    const yank = ease.in2(clamp((lt - 0.3) / 0.35));
    const hand = Lw(a, -0.35, 1.2, 0.25).lerp(hook, g).add(V3(yank * 0.6, yank * 0.25, yank * 0.5));
    a.armIK('R', hand, Lw(a, -0.6, 1.2, -0.2)); a.curl.R = 0.3 + g * 0.6;
    a.expr('determined', 1); a.update(t);
    s.jacket.position.set(-2.48 + 0.12, 1.72, 1.3).add(V3(yank * 0.6, yank * 0.25, yank * 0.5));
    s.jacket.rotation.z = -yank * 0.8;
    aim(s.cam, V3(-1.65, 1.55, 0.75), V3(-2.42, 1.5, 1.32), 34);
    return { look: { bloom: { strength: 0.4 }, grade: { ...G.now, exposure: 1.35 }, dof: { focus: 1.0, aperture: 0.3, maxBlur: 10 } }, comp: { grain: 0.05 } };
  }
};
// S14c: the door slams; the room is empty
const S14c = {
  id: 17, t0: 55.0, t1: 56.0, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 1.0, kitchen: 0.6, lid: -0.28, jacket: false }); s.arman.root.visible = false;
    const close = ease.in(clamp(lt / 0.32));
    const bounce = lt > 0.32 ? Math.sin((lt - 0.32) * 40) * Math.exp(-(lt - 0.32) * 14) * 0.04 : 0;
    s.doorPivot.rotation.y = lerp(-1.25, 0, close) + bounce;
    s.hall.intensity = 6 * (1 - close);
    s.clock.setTime(23, 8, 22 + lt);
    const sh = lt > 0.32 ? Math.exp(-(lt - 0.32) * 8) * 0.02 : 0;
    aim(s.cam, V3(0.2, 1.35, 0.6).add(shake(t * 3, sh, 4, 16)), V3(-2.5, 1.15, 1.75), 38);
    return { look: { bloom: { strength: 0.45 }, grade: { ...G.now, exposure: 1.45 } }, comp: { grain: 0.05 } };
  }
};
shots.push(S9a, S9b, S11, S12, S13a, S13b, S14a, S14b, S14c);
