// Shots 15-21: run, taxi, window, knock, reunion, family, moral
import * as THREE from 'three';
import { kf, kv, clamp, inv, sstep, aim, V3, shake, lerp, ease } from './core.js';
import { G, mixG } from './grades.js';
import * as O from './overlay.js';

export const shots = [];
const Lw = (c, x, y, z) => V3(x, y, z).applyMatrix4(c.root.matrixWorld);
const nightLook = (o = {}) => ({ bloom: { strength: 0.7, radius: 0.6, threshold: 0.72, ...(o.bloom || {}) }, grade: { ...G.night, ...(o.grade || {}) }, dof: o.dof || null });

// ---------- S15: the run ----------
const runX = t => -6 + 5.0 * (t - 56);
function runner(s, t) {
  const a = s.arman; a.reset();
  const x = runX(t);
  a.place(x, 0, 1.5, Math.PI / 2); a.root.updateMatrixWorld(true);
  a.cycle((t - 56) * 1.8, 1);
  a.expr('determined', 1); a.face.mouthOpen = 0.22 + 0.12 * Math.abs(Math.sin((t - 56) * Math.PI * 3.6)); a.face.ooh = 0.2;
  a.look(V3(x + 6, 1.55, 1.5), 0.3);
  a.update(t);
  s.snow.position.x = x; s.snow.setTime(t);
  s.puffs.forEach((p, i) => {
    const per = 0.42, te = 56 + Math.floor((t - 56 - i * per) / (per * s.puffs.length)) * per * s.puffs.length + i * per;
    const age = t - te;
    if (age < 0 || age > 1.3) { p.material.opacity = 0; return; }
    p.position.set(runX(te) + 0.2, 1.6 + age * 0.15, 1.5 + age * 0.05);
    const sc = 0.12 + age * 0.45; p.scale.set(sc, sc, 1); p.material.opacity = 0.28 * (1 - age / 1.3);
  });
  return x;
}
const S15a = {
  id: 18, t0: 56, t1: 58.2, set: 'street',
  run(lt, s, t) {
    const x = runner(s, t);
    const pos = V3(x + 0.6, 1.2, -3.4).add(shake(t, 0.03, 2.2, 21));
    aim(s.cam, pos, V3(x + 0.35, 1.15, 1.5), 28);
    return { look: nightLook({ dof: { focus: 4.9, aperture: 0.35, maxBlur: 14 } }), comp: { grain: 0.05, flash: Math.max(0, 1 - lt / 0.12) * 0.3, flashColor: [1, 0.9, 0.8] } };
  }
};
const S15b = {
  id: 19, t0: 58.2, t1: 60, set: 'street',
  run(lt, s, t) {
    const x = runner(s, t);
    const pos = V3(x + 6.5, 1.15, 1.35).add(shake(t, 0.025, 2.4, 22));
    aim(s.cam, pos, V3(x, 1.35, 1.5), 21);
    return { look: nightLook({ dof: { focus: 6.4, aperture: 0.7, maxBlur: 22 } }), comp: { grain: 0.05 } };
  }
};

// ---------- S16: the taxi ----------
const clockOverlay = t => ctx => {
  const m = 23 * 60 + 31 + ease.io(clamp((t - 60.6) / 3.0)) * 16;
  const a = clamp((t - 60.2) / 0.4) * (1 - clamp((t - 63.75) / 0.25));
  O.clockText(ctx, m, { x: 960, y: 800, size: 128, alpha: a * 0.92 });
};
function taxiState(s, t) {
  const tz = -55 + 30 * (t - 60);
  s.taxi.position.set(-1.9, 0, tz); s.taxi.updateMatrixWorld(true);
  s.streak.update(tz, 30, t);
  const near = s.lampZ.map(([sx, z]) => [sx, z, Math.abs(z - tz)]).sort((a, b) => a[2] - b[2]).slice(0, 3);
  near.forEach(([sx, z], i) => { s.lampLights[i].position.set(sx * 5.2, 7.5, z); });
  return tz;
}
const S16a = {
  id: 20, t0: 60, t1: 62, set: 'highway',
  run(lt, s, t) {
    const tz = taxiState(s, t);
    s.interior.visible = false; s.exterior.forEach(o => o.visible = true); s.arman.root.visible = false; s.passLight.intensity = 0;
    const camP = V3(3.0, 0.55, 5.0).add(shake(t, 0.01, 2, 23));
    const tgt = s.taxi.position.clone().add(V3(0, 0.8, 0)).lerp(V3(0, 0.8, tz + 10), 0.3);
    aim(s.cam, camP, tgt, 26);
    const d = camP.distanceTo(s.taxi.position);
    s.taxi.flares.forEach(f => f.setK(clamp(1.0 - d / 60, 0.25, 0.85)));
    return { look: nightLook({ bloom: { strength: 0.6, threshold: 0.8 } }), comp: { grain: 0.05 }, overlay: clockOverlay(t) };
  }
};
const S16b = {
  id: 21, t0: 62, t1: 64, set: 'highway',
  run(lt, s, t) {
    taxiState(s, t);
    s.interior.visible = true; s.exterior.forEach(o => o.visible = false);
    const a = s.arman; a.reset(); a.place(-0.38, 0.0, -0.95, 0); a.root.updateMatrixWorld(true);
    a.sit(0.42, 0.45, { lean: 0.05 });
    a.armIK('L', Lw(a, 0.15, 0.58, 0.36), Lw(a, 0.5, 0.45, 0)); a.armIK('R', Lw(a, -0.1, 0.62, 0.34), Lw(a, -0.5, 0.45, 0));
    const lookOut = sstep(0.2, 0.6, lt) * (1 - sstep(1.2, 1.5, lt));
    a.look(Lw(a, 1.5, 1.3, 1.2).lerp(Lw(a, 2.2, 1.25, 0.6), 0), 0.15, 1);
    a.gaze.yaw = lookOut * -0.0; a.j.head.rotation.y += -0.55 * lookOut + 0.15; a.gaze.yaw = -0.45 * lookOut;
    a.expr('anxious', 1); a.mixExpr('anxious', 'determined', sstep(1.3, 1.8, lt));
    a.update(t);
    // passing street lights sweep over his face
    const ph = ((t * 1.4) % 1);
    s.passLight.position.set(-1.7, 1.7, 2.0 - ph * 6); s.passLight.intensity = 0.4 + 3.2 * Math.exp(-((ph - 0.5) ** 2) / 0.03);
    const head = Lw(a, 0, 1.25, 0.06);
    const cp = V3(0.2, 1.22, -0.12).add(s.taxi.position).add(shake(t, 0.004, 3, 24));
    aim(s.cam, cp, head, 34);
    return { look: nightLook({ grade: { exposure: 1.15 }, bloom: { strength: 0.4, threshold: 0.85 }, dof: { focus: cp.distanceTo(head), aperture: 0.4, maxBlur: 12 } }), comp: { grain: 0.055 }, overlay: clockOverlay(t) };
  }
};

// ---------- the house (shots 17-20) ----------
function houseNight(s, t, o = {}) {
  const C = s.cast;
  const ts = o.slow ?? t;
  s.snow.setTime(ts); s.fw.setTime(t);
  let fl = 0; for (const b of s.fw.bursts) if (t > b.t) fl += Math.exp(-(t - b.t) * 3.2) * 30;
  s.fwLight.intensity = fl;
  s.fridgeArt.visible = !!o.fridgeArt; s.doorPivot.rotation.y = o.door ?? 0;
  s.doorSpill.intensity = 12 * clamp(-(o.door ?? 0) / 1.2);
  const mins = o.clock ?? 58;
  s.clock.setTime(mins >= 60 ? 0 : 23, mins % 60, (t * 1) % 60);
  for (const cd of s.candles) cd.flame.scale.set(0.07 * (1 + Math.sin(t * 13 + cd.position.x * 9) * 0.06), 0.11 * (1 + Math.sin(t * 17) * 0.08), 1);
  for (const c of Object.values(C)) { c.reset(); c.root.visible = false; }
}
function aikoSleeping(s, t, wake = 0) {
  const a = s.cast.aiko; a.root.visible = true;
  a.place(-2.52, 0.6, 2.74, Math.PI / 2); a.root.updateMatrixWorld(true);
  a.j.pelvis.position.set(0, 0.08, 0); a.j.spine.rotation.x = -0.18 + wake * 0.2; a.j.spine.rotation.z = -0.05;
  for (const sd of ['L', 'R']) { const sx = sd === 'L' ? 1 : -1; a.j['hip' + sd].rotation.set(-1.45, 0, sx * 0.05); a.j['kn' + sd].rotation.x = 0.35 + (sd === 'L' ? 0.3 : 0); }
  a.j.head.rotation.z = 0.32 * (1 - wake); a.j.head.rotation.x = 0.18 * (1 - wake); a.j.neck.rotation.z = 0.1 * (1 - wake);
  const p = s.paper; p.visible = true;
  p.position.copy(Lw(a, 0, 0.36, 0.13)); p.rotation.set(0, 0, 0); p.quaternion.copy(a.root.quaternion); p.rotateY(Math.PI); p.rotateX(-0.25); p.updateMatrixWorld(true);
  a.armIK('L', V3(-0.08, -0.02, -0.03).applyMatrix4(p.matrixWorld), Lw(a, 0.35, 0.2, -0.1));
  a.armIK('R', V3(0.08, 0.03, -0.03).applyMatrix4(p.matrixWorld), Lw(a, -0.35, 0.2, -0.1));
  a.curl.L = a.curl.R = 0.7;
  return a;
}
const S17 = {
  id: 22, t0: 64, t1: 68, set: 'house',
  run(lt, s, t) {
    houseNight(s, t, { clock: 58 });
    const a = aikoSleeping(s, t); a.expr('sleep', 1); a.breathRate = 0.18; a.breath = 1.5; a.update(t);
    const m = s.cast.arman; m.root.visible = true; m.place(-2.38, 0, 4.0, Math.PI - 0.1); m.root.updateMatrixWorld(true); m.stand({ spread: 0.12 });
    m.j.spine.rotation.x = 0.05; m.expr('touched', 0.8); m.breath = 2.2; m.breathRate = 0.55;
    m.look(a.root.position.clone().add(V3(0.1, 0.45, 0)), 0.8); m.update(t);
    const k = ease.sine(lt / 4);
    const head = a.root.position.clone().add(V3(0.1, 0.5, 0));
    const pos = V3(lerp(-1.05, -1.2, k), lerp(1.6, 1.52, k), lerp(5.15, 4.7, k)).add(shake(t, 0.005, 0.5, 25));
    aim(s.cam, pos, head, 30);
    return { look: nightLook({ dof: { focus: pos.distanceTo(head), aperture: 0.35, maxBlur: 14 }, grade: { temp: -0.1, exposure: 1.1 } }), comp: { grain: 0.05 },
      overlay: ctx => { const al = ease.out(clamp((lt - 0.6) / 0.6)) * (1 - clamp((lt - 3.3) / 0.6)); O.clockText(ctx, 23 * 60 + 58, { x: 960, y: 820, size: 110, alpha: al * 0.9 }); } };
  }
};
const S18 = {
  id: 23, t0: 68, t1: 71, set: 'house',
  run(lt, s, t) {
    houseNight(s, t, { clock: 59 });
    const wake = sstep(0.9, 1.4, lt), turn = sstep(1.1, 1.5, lt), jump = sstep(2.2, 2.9, lt);
    const a = aikoSleeping(s, t, wake);
    if (lt < 0.95) a.expr('sleep', 1);
    else if (lt < 1.5) { a.expr('sleep', 1 - sstep(0.95, 1.2, lt)); a.setFace({ closed: 1 - sstep(0.95, 1.25, lt) }); }
    else if (lt < 1.9) a.expr('surprise', 1);
    else a.mixExpr('surprise', 'laugh', sstep(1.9, 2.2, lt));
    a.j.head.rotation.y += turn * 0.95; a.j.neck.rotation.y += turn * 0.3;
    if (lt > 1.45) a.gazeTarget = { p: s.cast.arman.root.position.clone().add(V3(0, 1.6, 0)), amt: 1 };
    // jump down and run right (towards the door)
    if (jump > 0) {
      const p0 = a.root.position.clone();
      a.root.position.copy(p0.lerp(V3(-1.6, 0, 2.3), jump)); a.root.position.y = lerp(0.6, 0, jump) + Math.sin(jump * Math.PI) * 0.12;
      a.root.rotation.y = lerp(Math.PI / 2, Math.PI * 0.7, jump);
      a.j.pelvis.position.set(0, lerp(0.08, a.hipY, jump), 0);
      for (const sd of ['L', 'R']) { a.j['hip' + sd].rotation.x = lerp(-1.45, -0.2, jump); a.j['kn' + sd].rotation.x = lerp(0.5, 0.2, jump); }
      s.paper.visible = jump < 0.15;
      if (jump > 0.15) { a.j.shL.rotation.set(-0.8, 0, 0.3); a.j.shR.rotation.set(0.5, 0, -0.3); a.j.elL.rotation.x = -1.2; a.j.elR.rotation.x = -1.2; }
    }
    a.update(t);
    if (jump > 0.15) { s.paper.visible = true; s.paper.position.set(-2.1, 0.7, 2.72); s.paper.rotation.set(-Math.PI / 2, 0, 0.3); }
    // Arman outside, knocking on the glass
    const m = s.cast.arman; m.root.visible = true; m.place(-1.72, 0, 3.62, Math.PI + 0.25); m.root.updateMatrixWorld(true); m.stand({ spread: 0.12 });
    const kn = [0.25, 0.5, 0.75].reduce((v, k) => v + Math.exp(-((lt - k) ** 2) / 0.004), 0);
    const knocking = 1 - sstep(1.0, 1.3, lt);
    m.armIK('R', Lw(m, -0.05, 1.32, 0.48 + kn * 0.04).lerp(Lw(m, -0.2, 0.9, 0.2), 1 - knocking), Lw(m, -0.5, 1.0, 0));
    m.curl.R = 0.9; m.expr('touched', 0.7); if (lt > 1.6) m.mixExpr('touched', 'joy', sstep(1.6, 2.1, lt));
    m.look(a.root.position.clone().add(V3(0, 0.55, 0)), 0.7); m.breath = 1.8; m.update(t);
    const head = a.root.position.clone().add(V3(0.1, 0.5, 0));
    const pos = V3(-1.2, 1.08, 1.7).add(shake(t, 0.004, 0.6, 26));
    aim(s.cam, pos, V3(-2.2, 1.12, 3.0), 38);
    return { look: { bloom: { strength: 0.6, threshold: 0.75 }, grade: { ...G.gold, temp: 0.45, exposure: 1.0 }, dof: { focus: Math.max(0.9, pos.distanceTo(head)), aperture: 0.3, maxBlur: 12 } }, comp: { grain: 0.045 } };
  }
};
function reunion(s, t) {
    const lt = t - 71;
    const tau = lt * 0.62; // slow motion action time
    houseNight(s, t, { clock: 60, door: -1.5 * ease.out(clamp(tau / 0.16)), slow: 71 + tau });
    const C = s.cast, a = C.aiko, m = C.arman, mom = C.mom, dad = C.dad;
    a.root.visible = m.root.visible = mom.root.visible = dad.root.visible = true;
    s.paper.visible = false;
    // Arman: kneels, opens arms, catches, hugs, rises slowly turning
    const kneel = ease.out(clamp(tau / 0.35)), rise = ease.io(clamp((tau - 1.25) / 1.1));
    const spin = ease.io(clamp((tau - 1.1) / 1.4)) * 0.7;
    m.place(2.15, 0, 5.15, Math.PI + spin); m.root.updateMatrixWorld(true);
    m.j.pelvis.position.y = lerp(m.hipY, 0.58, kneel * (1 - rise)); m.j.pelvis.position.z = -0.05 * kneel;
    m.legIK('L', Lw(m, 0.12, m.ankleH, lerp(0.0, 0.42, kneel * (1 - rise))), Lw(m, 0.2, 0.8, 1.5));
    m.legIK('R', Lw(m, -0.12, lerp(m.ankleH, 0.12, kneel * (1 - rise)), lerp(0, -0.42, kneel * (1 - rise))), Lw(m, -0.2, 0.3, 1.2));
    m.j.spine.rotation.x = 0.12 * kneel * (1 - rise) - 0.1 * rise;
    // Aiko: runs out, leaps, wraps around his neck
    const run = clamp((tau - 0.08) / 0.45), leap = clamp((tau - 0.53) / 0.32), hold = tau > 0.85;
    const chest = Lw(m, 0, m.j.pelvis.position.y + m.torsoL * 0.55, 0.2);
    if (!hold) {
      let p;
      if (leap <= 0) p = V3(2.15, run > 0.62 ? 0.3 : 0.3 * (run / 0.62) + 0, lerp(2.4, 4.35, run));
      else { p = V3(2.15, 0.3, 4.35).lerp(chest.clone().add(V3(0, -0.62, 0.12)), ease.out2(leap)); p.y += Math.sin(leap * Math.PI) * 0.22; }
      a.place(p.x, p.y, p.z, 0); a.root.updateMatrixWorld(true);
      if (leap <= 0) { a.cycle(tau * 3.0, 1); a.hairSwing.z = Math.sin(tau * 18) * 0.2; }
      else {
        a.j.pelvis.position.y = a.hipY; a.j.spine.rotation.x = -0.15;
        for (const sd of ['L', 'R']) { a.j['hip' + sd].rotation.x = -0.3 - leap * 0.6; a.j['kn' + sd].rotation.x = 0.6 + leap * 0.6; a.j['sh' + sd].rotation.set(-2.2 + leap * 0.4, 0, (sd === 'L' ? 1 : -1) * 0.5); a.j['el' + sd].rotation.x = -0.3; }
        a.hairSwing.x = 0.5 * leap;
      }
      a.expr('laugh', 1);
    } else {
      const p = chest.clone().add(V3(0, -0.62, 0.0).applyQuaternion(m.root.quaternion)).add(V3(0, 0, 0));
      a.place(p.x, p.y, p.z, m.root.rotation.y + Math.PI); a.root.updateMatrixWorld(true);
      a.j.pelvis.position.y = a.hipY; a.j.spine.rotation.x = 0.1;
      for (const sd of ['L', 'R']) { const sx = sd === 'L' ? 1 : -1; a.j['hip' + sd].rotation.set(-1.0, 0, sx * 0.55); a.j['kn' + sd].rotation.x = 1.3; }
      a.armIK('L', Lw(m, -0.13, m.j.pelvis.position.y + m.torsoL * 1.0, -0.05), Lw(a, 0.5, 1.2, 0.3));
      a.armIK('R', Lw(m, 0.13, m.j.pelvis.position.y + m.torsoL * 1.0, -0.05), Lw(a, -0.5, 1.2, 0.3));
      a.j.head.rotation.set(0.15, -0.5, 0.1);
      a.expr('laugh', 0.6); a.expr('touched', 0.4); a.face.closed = 0.85;
      a.hairSwing.x = 0.3 * Math.exp(-(tau - 0.85) * 3);
    }
    a.update(71 + tau);
    // Arman's arms: open wide, then around her back
    m.root.updateMatrixWorld(true);
    if (!hold) {
      const open = kneel;
      m.armIK('L', Lw(m, 0.55 * open + 0.2, m.j.pelvis.position.y + 0.55, 0.35), Lw(m, 0.8, 0.5, -0.3));
      m.armIK('R', Lw(m, -0.55 * open - 0.2, m.j.pelvis.position.y + 0.55, 0.35), Lw(m, -0.8, 0.5, -0.3));
      m.expr('joy', 0.7); m.expr('touched', 0.5);
      m.look(a.root.position.clone().add(V3(0, 0.9, 0)), 0.7);
    } else {
      const back = Lw(a, 0, 0.75, -0.1);
      m.armIK('L', back.clone().add(V3(0.08, 0, 0).applyQuaternion(m.root.quaternion)), Lw(m, 0.6, 0.6, 0.0));
      m.armIK('R', back.clone().add(V3(-0.1, -0.12, 0).applyQuaternion(m.root.quaternion)), Lw(m, -0.6, 0.6, 0.0));
      m.j.head.rotation.set(0.2, 0.45, -0.1);
      m.expr('touched', 1); m.face.closed = 0.9; m.face.smile = 0.6;
      m.setTear('R', 0.2 + clamp((tau - 1) / 1.4) * 0.8, 1);
    }
    m.update(71 + tau);
    // Mom & Dad in the doorway
    const momIn = ease.out(clamp((tau - 0.5) / 0.4));
    mom.place(lerp(2.0, 2.05, momIn), 0, lerp(2.2, 3.0, momIn), 0.05); mom.root.updateMatrixWorld(true); mom.stand({ spread: 0.1 });
    const mouth = Lw(mom, 0, 1.45, 0.16);
    mom.armIK('L', Lw(mom, 0.17, 0.75, 0.05).lerp(mouth.clone().add(V3(0.03, -0.04, 0.02)), sstep(0.7, 1.0, tau)), Lw(mom, 0.5, 1.0, -0.2));
    mom.armIK('R', Lw(mom, -0.17, 0.75, 0.05).lerp(mouth.clone().add(V3(-0.04, -0.07, 0.04)), sstep(0.75, 1.05, tau)), Lw(mom, -0.5, 1.0, -0.2));
    mom.expr('cry', 0.55); mom.expr('joy', 0.4); mom.look(m.root.position.clone().add(V3(0, 1.0, 0)), 0.6);
    if (tau > 1.2) mom.setTear('L', clamp((tau - 1.2) / 1.2), 1);
    mom.update(71 + tau);
    const dadIn = ease.out(clamp((tau - 0.8) / 0.4));
    dad.place(lerp(2.5, 2.45, dadIn), 0, lerp(1.8, 2.55, dadIn), -0.1); dad.root.updateMatrixWorld(true); dad.stand({ spread: 0.12 });
    dad.armIK('R', Lw(dad, -0.17, 0.75, 0.05).lerp(Lw(dad, -0.05, 1.6, 0.15), sstep(1.3, 1.7, tau) * (1 - sstep(2.1, 2.4, tau))), Lw(dad, -0.6, 1.0, -0.2));
    dad.armIK('L', Lw(dad, 0.2, 0.85, 0.12).lerp(mom.root.position.clone().add(V3(0.12, 1.25, -0.15)), sstep(1.0, 1.4, tau)), Lw(dad, 0.6, 1.0, -0.2));
    dad.expr('joy', 1); dad.expr('touched', 0.3); dad.look(m.root.position.clone().add(V3(0, 1.0, 0)), 0.5);
    dad.update(71 + tau);
    return { m, a };
}
const S19 = {
  id: 24, t0: 71, t1: 72.7, set: 'house',
  run(lt, s, t) {
    reunion(s, t);
    const k = ease.sine(clamp(lt / 1.7));
    const pos = V3(lerp(3.7, 3.5, k), lerp(0.8, 0.85, k), lerp(7.3, 6.9, k)).add(shake(t, 0.006, 0.4, 27));
    aim(s.cam, pos, V3(2.15, 1.25, 4.2), 36);
    return { look: { bloom: { strength: 0.55, radius: 0.6, threshold: 0.8 }, grade: mixG(G.warmNight, G.gold, 0.45), dof: { focus: pos.distanceTo(V3(2.15, 1, 4.9)), aperture: 0.12, maxBlur: 10 } }, comp: { grain: 0.045 } };
  }
};
const S19b = {
  id: 27, t0: 72.7, t1: 75, set: 'house',
  run(lt, s, t) {
    const { m } = reunion(s, t);
    const k = ease.sine(clamp(lt / 2.3));
    const head = Lw(m, 0, m.j.pelvis.position.y + m.torsoL + 0.2, 0.02);
    const pos = Lw(m, lerp(0.85, 0.72, k), m.j.pelvis.position.y + m.torsoL + lerp(0.18, 0.2, k), lerp(0.55, 0.45, k)).add(shake(t, 0.004, 0.4, 28));
    aim(s.cam, pos, head, 34);
    return { look: { bloom: { strength: 0.6, radius: 0.6, threshold: 0.78 }, grade: mixG(G.warmNight, G.gold, 0.6), dof: { focus: pos.distanceTo(head), aperture: 0.4, maxBlur: 16 } }, comp: { grain: 0.045 } };
  }
};

// ---------- S20: the family at the table ----------
function seat(c, s, key, o = {}) {
  const [x, z, ry] = s.seats[key];
  c.root.visible = true; c.place(x, 0, z, ry); c.root.updateMatrixWorld(true); c.sit(0.47, 0.4, { lean: o.lean ?? 0.06 });
}
const S20 = {
  id: 25, t0: 75, t1: 78, set: 'house',
  run(lt, s, t) {
    houseNight(s, t, { clock: 62, fridgeArt: true });
    s.paper.visible = false;
    const C = s.cast;
    const toast = sstep(0.4, 1.0, lt) * (1 - sstep(2.2, 2.7, lt));
    for (const [k, key] of [['mom', 'mom'], ['dad', 'dad'], ['grandma', 'grandma'], ['uncle', 'uncle']]) {
      const c = C[k]; seat(c, s, key);
      c.armIK('L', Lw(c, 0.17, 0.8, 0.36), Lw(c, 0.5, 0.6, 0));
      c.armIK('R', Lw(c, -0.17, 0.8, 0.36).lerp(Lw(c, -0.12, 1.12, 0.38), toast), Lw(c, -0.5, 0.7, -0.1));
      c.expr('laugh', 0.5); c.expr('joy', 0.6); c.face.mouthOpen = 0.25 + 0.15 * Math.sin(t * 6 + c.o.seed);
      c.look(C.armanH.root.position.clone().add(V3(0, 1.1, 0)), 0.6);
      c.update(t);
    }
    const m = C.armanH; seat(m, s, 'arman', { lean: 0.0 });
    const a = C.aiko; a.root.visible = true;
    a.place(0.55, 0.3, -1.0, 0.25); a.root.updateMatrixWorld(true);
    a.j.pelvis.position.y = 0.3; for (const sd of ['L', 'R']) { a.j['hip' + sd].rotation.x = -1.4; a.j['kn' + sd].rotation.x = 1.3; }
    a.j.spine.rotation.x = -0.05; a.expr('laugh', 1); a.face.mouthOpen = 0.45 + 0.15 * Math.abs(Math.sin(t * 7));
    a.armIK('L', Lw(a, 0.15, 0.95, 0.15), Lw(a, 0.5, 0.6, 0)); a.armIK('R', Lw(a, -0.15, 0.68 + toast * 0.3, 0.3), Lw(a, -0.5, 0.6, 0));
    a.look(V3(-0.5, 1.2, 0.3), 0.6); a.update(t);
    m.armIK('L', Lw(a, 0.12, 0.6, 0.0), Lw(m, 0.6, 0.6, 0)); m.armIK('R', Lw(m, -0.17, 0.8, 0.38).lerp(Lw(m, -0.14, 1.12, 0.4), toast), Lw(m, -0.6, 0.6, -0.1));
    m.expr('joy', 1); m.expr('touched', 0.3); m.face.mouthOpen = 0.2;
    m.look(a.root.position.clone().add(V3(0, 0.95, 0)), 0.5); m.update(t);
    const k = ease.sine(lt / 3);
    const pos = V3(lerp(-0.55, -0.9, k), lerp(1.3, 1.4, k), lerp(0.85, 1.3, k));
    aim(s.cam, pos, V3(0.75, 1.05, -1.15), 36);
    return { look: { bloom: { strength: 0.7, radius: 0.6, threshold: 0.7 }, grade: { ...G.gold }, dof: { focus: pos.distanceTo(V3(0.55, 1.1, -1.0)), aperture: 0.1, maxBlur: 8 } }, comp: { grain: 0.045, fade: sstep(2.0, 3.0, lt) } };
  }
};

// ---------- S21: the moral ----------
const S21 = {
  id: 26, t0: 78, t1: 89, set: 'black',
  run(lt, s, t) {
    return {
      look: { bloom: { strength: 0 }, grade: {} }, comp: { grain: 0.03 },
      overlay: ctx => {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080);
        const f12 = 1 - clamp((lt - 8.6) / 0.9) * 0.0;
        const out = 1 - clamp((lt - 9.9) / 1.0);
        const dim = 1 - clamp((lt - 5.6) / 1.2) * 0.45;
        O.reveal(ctx, 'Мы думаем, что успеем.', lt - 0.6, { y: 430, size: 60, font: 'italic 300 60px "Cormorant Garamond"', perChar: 0.035, dur: 1.0, alpha: dim * out * f12 });
        const words = [['Приехать.', 2.6], ['Позвонить.', 3.3], ['Обнять.', 4.0]];
        ctx.save(); ctx.font = 'italic 300 60px "Cormorant Garamond"'; const ws = words.map(([w]) => ctx.measureText(w).width + 60 * 0.02 * w.length); ctx.restore();
        const total = ws.reduce((x, y) => x + y, 0) + 40 * 2; let x = 960 - total / 2;
        words.forEach(([w, t0], i) => { O.reveal(ctx, w, lt - t0, { x, y: 525, align: 'left', size: 60, font: 'italic 300 60px "Cormorant Garamond"', perChar: 0.04, dur: 0.9, alpha: dim * out }); x += ws[i] + 40; });
        O.reveal(ctx, 'Но время не вечно.', lt - 6.2, { y: 668, size: 82, font: 'italic 400 82px "Cormorant Garamond"', color: '#f6e7cf', perChar: 0.06, dur: 1.4, blur: 12, rise: 14, alpha: out });
      }
    };
  }
};

shots.push(S15a, S15b, S16a, S16b, S17, S18, S19, S19b, S20, S21);
