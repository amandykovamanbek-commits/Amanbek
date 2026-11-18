// Shots 1-8: city, apartment, phone, flashback (snow angels), sink, notification
import * as THREE from 'three';
import { kf, kv, clamp, inv, sstep, aim, V3, shake, lerp, ease } from './core.js';
import { G, mixG } from './grades.js';
import * as O from './overlay.js';
import * as T from './tex.js';

const S1 = {
  id: 1, t0: 0, t1: 5, set: 'city',
  run(lt, s, t) {
    const a = s.arman; a.reset();
    a.root.updateMatrixWorld(true);
    a.sit(0.47, 0.42, { lean: 0.28 });
    // elbow on desk, chin resting on right hand, left hand on keyboard
    const W = a.root.matrixWorld;
    a.armIK('R', V3(-0.05, 1.33, 0.12).applyMatrix4(W), V3(-0.35, 0.6, 0.3).applyMatrix4(W), [0.2, 0, -0.4]);
    a.armIK('L', V3(0.12, 0.79, 0.42).applyMatrix4(W), V3(0.5, 0.6, 0.0).applyMatrix4(W));
    a.j.head.rotation.z = -0.12; a.j.head.rotation.x = 0.28;
    a.expr('tired').expr('sad', 0.4);
    a.update(t);
    s.snow.setTime(t);
    const k = ease.io(clamp(lt / 5));
    const tg = s.target;
    const pos = V3(lerp(tg.x + 4, tg.x + 0.6, k), lerp(2.2, tg.y - 0.5, k), tg.z + lerp(40, 10.5, k));
    const look = V3(lerp(tg.x * 0.5, tg.x, k), lerp(11, tg.y + 0.05, k), tg.z);
    aim(s.cam, pos.add(shake(t, 0.03, 0.4, 1)), look, lerp(42, 22, k));
    return {
      look: { bloom: { strength: 0.55, radius: 0.55, threshold: 0.82 }, grade: { ...G.now, temp: -0.3, saturation: 0.95 } },
      comp: { fade: 1 - sstep(0, 1.6, lt), grain: 0.05 },
      overlay: ctx => O.reveal(ctx, 'В этом году я сказал маме, что не приеду', lt - 1.0, { y: 872, size: 52, perChar: 0.03, dur: 0.9, fadeOut: [3.3, 0.7] }),
    };
  }
};

export const shots = [S1];

// ---------- helpers ----------
export const Lw = (c, x, y, z) => V3(x, y, z).applyMatrix4(c.root.matrixWorld);
function deskPose(a, s, lt) { // sitting at the desk facing the window (-Z)
  a.place(s.win.x, 0, -s.RD + 1.0, Math.PI); a.root.updateMatrixWorld(true);
  a.sit(0.47, 0.4, { lean: 0.12 });
}
function lapScroll(s, t) { const k = Math.floor(t * 4); if (s._lapK === k) return; s._lapK = k; s.lapCanvas.getContext('2d').drawImage(T.spreadsheet(k * 0.25), 0, 0); s.lapTex.needsUpdate = true; }
export function apartmentBase(s, t, o = {}) {
  s.outSnow.setTime(t);
  s.phone.screen.material.map = s.phone.tex; s.phone.screen.material.color.setRGB(1.15, 1.15, 1.15); s.phone.screen.material.needsUpdate = true; if (s.phone.land) s.phone.land.visible = false; if (s.refl) s.refl.visible = false; s.phoneLight.color.set(0xbfd6ff);
  s.jacket.position.set(-s.RW + 0.12, 1.72, 1.3); s.jacket.rotation.set(0, 0, 0); s.arman.root.visible = true;
  s.lapLight.intensity = o.lap ?? 1.4; s.kitchenLight.intensity = o.kitchen ?? 0; s.led.material.emissiveIntensity = (o.kitchen ?? 0) > 0 ? 0.5 : 0;
  s.phoneLight.intensity = o.phone ?? 0; s.hall.intensity = o.hall ?? 0; s.fill.intensity = o.fill ?? 0; if (o.fillPos) s.fill.position.copy(o.fillPos);
  s.noodle.visible = o.noodle ?? false; s.jacket.visible = o.jacket ?? true; s.doorPivot.rotation.y = o.door ?? 0;
  s.lap.lid.rotation.x = o.lid ?? -0.28; s.lap.screen.visible = (o.lid ?? -0.28) < -0.1;
  s.phone.visible = o.phoneVis ?? false;
  const cl = o.clock || [21, 47, 0]; s.clock.setTime(...cl);
  s.chair.position.set(s.win.x, 0, -s.RD + 1.0); s.chair.rotation.y = Math.PI;
}
const lookNow = (o = {}) => ({ bloom: { strength: 0.45, radius: 0.5, threshold: 0.85, ...(o.bloom || {}) }, grade: { ...G.now, ...(o.grade || {}) }, dof: o.dof || null });

// ---------- S2: face in laptop light ----------
const S2 = {
  id: 2, t0: 5, t1: 9, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 1.8 });
    const a = s.arman; a.reset(); deskPose(a, s, lt);
    a.autoBlink = false; a.blink(5.9); a.blink(8.75);
    // reading saccades
    a.gaze.yaw = Math.sin(lt * 2.2) * 0.12 * (lt < 1.6 ? 1 : 0.3); a.gaze.pitch = 0.32;
    a.expr('tired', 1).expr('sad', 0.25);
    const rub = sstep(1.5, 2.1, lt) * (1 - sstep(3.1, 3.7, lt));
    a.j.spine.rotation.x = 0.14 + rub * 0.06 - sstep(3.2, 3.7, lt) * 0.05 * (1 - sstep(3.7, 4, lt));
    a.j.head.rotation.x = 0.12 + rub * 0.22;
    a.setFace({ closed: rub * 0.95 });
    // left hand on keyboard, right hand rubs eyes
    a.armIK('L', Lw(a, 0.12, 0.79, 0.52), Lw(a, 0.45, 0.6, 0.0));
    const rest = Lw(a, -0.13, 0.79, 0.5);
    const face = Lw(a, -0.035 + Math.sin(lt * 9) * 0.008 * rub, 1.24 + Math.cos(lt * 9) * 0.006 * rub, 0.25);
    a.armIK('R', rest.lerp(face, rub), Lw(a, -0.4, 0.75, 0.15), [rub * -0.5, 0, rub * 0.3]);
    a.curl.R = 0.35 - rub * 0.2;
    a.breath = 1 + sstep(3.1, 3.5, lt) * 1.8 * (1 - sstep(3.6, 4.2, lt));
    a.update(t);
    lapScroll(s, t);
    // camera: 3/4 close-up from his left-front, slow push
    const head = Lw(a, 0, 1.33, 0.08);
    const k = lt / 4;
    const pos = Lw(a, lerp(0.42, 0.36, k), lerp(1.3, 1.31, k), lerp(0.78, 0.66, k)).add(shake(t, 0.003, 0.6, 2));
    aim(s.cam, pos, head.add(V3(0, 0.0, 0)), 28);
    return { look: lookNow({ dof: { focus: pos.distanceTo(head), aperture: 0.6, maxBlur: 16 }, bloom: { strength: 0.5 } }), comp: { grain: 0.05 } };
  }
};

// ---------- S3/S4: phone chat ----------
const MSG0 = [{ me: false, text: 'Сынок, ты же приедешь 31-го?', time: '18:20' }, { me: false, text: 'Айко каждый день спрашивает', time: '18:21' }];
const WORDS = [[9.35, 'Мам,'], [9.65, 'завал'], [9.9, 'на'], [10.2, 'работе.'], [10.95, 'В'], [11.2, 'следующем'], [11.5, 'году'], [11.8, 'точно'], [12.1, 'приеду']];
const SENT = 12.45;
export function chatState(t) {
  const st = { mode: 'chat', time: '21:47', msgs: MSG0.map(m => ({ ...m })), kb: t < 12.9, clock: t, status: 'в сети' };
  let typed = ''; let pressed = null;
  for (const [wt, w] of WORDS) if (t >= wt) { typed += (typed ? ' ' : '') + w; if (t - wt < 0.09) pressed = w.slice(-1).toLowerCase(); }
  if (t < SENT) { st.typed = typed; st.cursor = Math.floor(t * 2.2) % 2 === 0 || (t > 9.3 && t < 12.2); st.pressed = pressed; }
  else {
    st.typed = ''; st.cursor = false;
    st.msgs.push({ me: true, text: 'Мам, завал на работе. В следующем году точно приеду', time: '21:47', read: t > 13.2, enter: ease.out(clamp((t - SENT) / 0.25)) });
  }
  const dots = (a, b) => clamp((t - a) / 0.15) * (1 - clamp((t - b) / 0.15));
  const d = Math.max(dots(13.4, 14.3), dots(14.9, 15.6));
  st.typingDots = d; if (d > 0.5) st.status = 'печатает…';
  if (t > 16.0) st.msgs.push({ me: false, text: 'Хорошо, сынок', heart: true, time: '21:49', enter: ease.out(clamp((t - 16.0) / 0.3)) });
  return st;
}
function holdPhone(a, s, o = {}) { // phone held in both hands in front of chest; hands grip from behind/below
  const ph = s.phone; ph.visible = true;
  const land = o.landscape || 0;
  const c = Lw(a, 0, o.y ?? 1.0, o.z ?? 0.33);
  const eye = Lw(a, 0, 1.34, 0.1);
  ph.position.copy(c); ph.lookAt(eye); ph.rotateZ(land * -Math.PI / 2);
  ph.updateMatrixWorld(true);
  const P = (x, y, z) => V3(x, y, z).applyMatrix4(ph.matrixWorld);
  if (land) {
    a.armIK('L', P(-0.1, -0.01, -0.035), Lw(a, 0.45, 0.7, -0.1), [0.0, 0, 0.6]);
    a.armIK('R', P(0.1, -0.01, -0.035), Lw(a, -0.45, 0.7, -0.1), [0.0, 0, -0.6]);
  } else {
    a.armIK('L', P(-0.03, -0.11, -0.04), Lw(a, 0.45, 0.6, -0.1), [0.6, 0, 0.5]);
    a.armIK('R', P(0.03, -0.11, -0.04), Lw(a, -0.45, 0.6, -0.1), [0.6, 0, -0.5]);
  }
  a.curl.L = a.curl.R = 0.9; a.thumbCurl.L = a.thumbCurl.R = 0.3;
  return ph;
}
const S3 = {
  id: 3, t0: 9, t1: 13, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 1.0, phone: 0.06, phoneVis: true });
    const a = s.arman; a.reset(); deskPose(a, s, lt);
    a.j.spine.rotation.x = 0.02; a.j.head.rotation.x = 0.42;
    a.expr('tired', 0.7).expr('anxious', 0.3 + sstep(10.4, 10.9, t) * 0.4 * (1 - sstep(11.0, 11.4, t)));
    const ph = holdPhone(a, s, { y: 1.02, z: 0.32 });
    // thumb taps
    const tap = WORDS.some(([wt]) => t >= wt - 0.06 && t < wt + 0.04) || (t > SENT - 0.06 && t < SENT + 0.04);
    a.thumbCurl.R = tap ? 0.7 : 0.15;
    a.update(t); a.j.head.visible = false;
    ph.draw(chatState(t)); s.phoneLight.position.copy(V3(0, 0, 0.2).applyMatrix4(ph.matrixWorld));
    const scr = V3(0, -0.012, 0).applyMatrix4(ph.matrixWorld);
    const n = V3(0, 0, 1).applyQuaternion(ph.quaternion);
    const k = ease.sine(lt / 4);
    const pos = scr.clone().addScaledVector(n, lerp(0.36, 0.31, k)).add(V3(0.03, 0.01, 0)).add(shake(t, 0.0012, 0.8, 3));
    aim(s.cam, pos, scr, 30, -0.06);
    return { look: lookNow({ dof: { focus: pos.distanceTo(scr), aperture: 0.5, maxBlur: 14 }, bloom: { strength: 0.3, threshold: 0.9 } }), comp: { grain: 0.045 } };
  }
};
const S4 = {
  id: 4, t0: 13, t1: 17, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 1.0, phone: 0.06, phoneVis: true });
    const a = s.arman; a.reset(); deskPose(a, s, lt);
    a.j.spine.rotation.x = 0.02; a.j.head.rotation.x = 0.42;
    const ph = holdPhone(a, s, { y: 1.02, z: 0.32 });
    a.update(t); a.j.head.visible = false;
    ph.draw(chatState(t)); s.phoneLight.position.copy(V3(0, 0, 0.2).applyMatrix4(ph.matrixWorld));
    const top = V3(0, -0.004, 0).applyMatrix4(ph.matrixWorld);
    const n = V3(0, 0, 1).applyQuaternion(ph.quaternion);
    const k = ease.sine(lt / 4);
    const pos = top.clone().addScaledVector(n, lerp(0.3, 0.255, k)).add(V3(-0.01, 0.0, 0)).add(shake(t, 0.001, 0.7, 4));
    aim(s.cam, pos, top, 30, 0.04);
    s.cam.up.set(0, 1, 0);
    return { look: lookNow({ dof: { focus: pos.distanceTo(top), aperture: 0.4, maxBlur: 12 }, bloom: { strength: 0.25, threshold: 0.9 } }), comp: { grain: 0.045 } };
  }
};

// ---------- S5: 31 December, wide empty room ----------
const S5 = {
  id: 5, t0: 17, t1: 20, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 0.5, noodle: true, lid: -1.2, clock: [21, 40, lt * 1] });
    const a = s.arman; a.reset(); deskPose(a, s, lt);
    a.j.spine.rotation.x = 0.3; a.j.head.rotation.x = 0.35;
    // slowly eating: right hand fork to mouth
    const e = (Math.sin(lt * 1.6 - 1) + 1) / 2;
    a.armIK('R', Lw(a, -0.1, lerp(0.86, 1.15, e), lerp(0.42, 0.26, e)), Lw(a, -0.4, 0.7, 0.1));
    a.armIK('L', Lw(a, 0.14, 0.8, 0.4), Lw(a, 0.45, 0.6, 0.1));
    a.expr('tired', 0.8).expr('sad', 0.5);
    a.update(t);
    s.noodle.position.set(s.win.x - 0.08, 0.75, -s.RD + 0.72);
    const k = lt / 3;
    aim(s.cam, V3(-2.25 + k * 0.08, 1.95, 2.75 - k * 0.1), V3(0.35, 1.0, -1.6), 52);
    return { look: lookNow({ bloom: { strength: 0.4 }, grade: { exposure: 1.7 } }), comp: { grain: 0.05, fade: 1 - sstep(0, 0.5, lt) },
      overlay: ctx => O.reveal(ctx, '31 декабря', lt - 0.5, { x: 600, y: 470, size: 92, font: 'italic 300 92px "Cormorant Garamond"', perChar: 0.06, dur: 1.1, tracking: 0.06, fadeOut: [2.4, 0.6] }) };
  }
};

// ---------- S7: eating over the sink ----------
const S7 = {
  id: 7, t0: 25, t1: 27, set: 'apartment',
  run(lt, s, t) {
    apartmentBase(s, t, { lap: 0.6, kitchen: 1.6, lid: -1.2, phoneVis: true });
    const a = s.arman; a.reset();
    a.place(-1.6, 0, -2.18, Math.PI); a.root.updateMatrixWorld(true); a.stand({ spread: 0.12 });
    a.j.spine.rotation.x = 0.22; a.j.head.rotation.x = 0.5;
    const cupP = Lw(a, 0.1, 1.02, 0.32);
    a.armIK('L', cupP.clone().add(V3(0, -0.03, 0)), Lw(a, 0.45, 0.8, 0.0));
    const e = (Math.sin(lt * 2.4) + 1) / 2;
    a.armIK('R', Lw(a, -0.06, lerp(1.06, 1.3, e), lerp(0.36, 0.22, e)), Lw(a, -0.45, 0.8, 0.0));
    a.expr('tired', 1).expr('sad', 0.5); a.face.mouthOpen = e * 0.2;
    a.update(t);
    s.noodle.visible = true; s.noodle.position.copy(cupP).add(V3(0, -0.08, 0));
    s.phone.position.set(-1.05, 0.905, -2.62); s.phone.rotation.set(-Math.PI / 2, 0, 0.3); s.phone.draw({ mode: 'off' });
    aim(s.cam, V3(-0.45, 1.38, -2.52).add(shake(t, 0.005, 0.5, 5)), V3(-1.6, 1.28, -2.15), 36);
    return { look: lookNow({ dof: { focus: 1.9, aperture: 0.12, maxBlur: 8 } }), comp: { grain: 0.05 } };
  }
};

// ---------- S8: phone lights up on the counter ----------
const S8 = {
  id: 8, t0: 27, t1: 30, set: 'apartment',
  run(lt, s, t) {
    const wake = sstep(0.35, 0.55, lt);
    apartmentBase(s, t, { lap: 0.6, kitchen: 0.9, lid: -1.2, phoneVis: true, phone: wake * 0.05 });
    const a = s.arman; a.reset();
    a.place(-1.6, 0, -2.18, Math.PI); a.root.updateMatrixWorld(true); a.stand({ spread: 0.12 });
    a.update(t);
    const ph = s.phone;
    const buzz = (lt > 0.4 && lt < 0.75) || (lt > 0.95 && lt < 1.3) ? Math.sin(lt * 260) * 0.0025 : 0;
    ph.position.set(-1.15 + buzz, 0.906, -2.6); ph.rotation.set(-Math.PI / 2, 0, 0.25 + buzz * 4);
    ph.draw({ mode: 'lock', time: '22:51', notif: ease.out(clamp((lt - 0.6) / 0.4)), wake });
    s.phoneLight.position.set(-1.15, 1.05, -2.6);
    s.noodle.visible = false;
    const k = ease.sine(lt / 3);
    aim(s.cam, V3(-1.15 + 0.05, lerp(1.2, 1.14, k), -2.6 + 0.14), V3(-1.15, 0.9, -2.6), 32, -0.25);
    return { look: lookNow({ dof: { focus: 0.27, aperture: 0.3, maxBlur: 12 }, bloom: { strength: 0.3, threshold: 0.92 } }), comp: { grain: 0.05 } };
  }
};

shots.push(S2, S3, S4, S5, S7, S8);

// ---------- S6: flashback — snow angels at sunset ----------
function lieAngel(c, x, feetZ, phase, freq, t, lift = 0.085) {
  c.reset();
  c.root.position.set(x, lift, feetZ); c.root.rotation.set(-Math.PI / 2, 0, 0, 'YXZ');
  c.root.rotation.order = 'YXZ'; c.root.rotation.set(-Math.PI / 2, 0, 0);
  const sw = (Math.sin(t * freq * Math.PI * 2 + phase) + 1) / 2;
  const arm = lerp(0.3, 2.3, sw), leg = lerp(0.06, 0.42, sw);
  c.j.shL.rotation.set(0, 0, arm); c.j.shR.rotation.set(0, 0, -arm);
  c.j.elL.rotation.x = -0.08; c.j.elR.rotation.x = -0.08;
  c.j.hipL.rotation.set(0, 0, leg); c.j.hipR.rotation.set(0, 0, -leg);
  c.j.knL.rotation.x = 0.06; c.j.knR.rotation.x = 0.06;
  return sw;
}
const S6 = {
  id: 6, t0: 20, t1: 25, set: 'courtyard', trans: { dur: 0.9, mode: 1 },
  run(lt, s, t) {
    s.flakes.setTime(t);
    const A = s.teen, B = s.tod;
    lieAngel(A, -0.55, 0.85, 0, 0.75, lt);
    A.j.head.rotation.y = 0.55 + Math.sin(lt * 1.3) * 0.05; A.j.neck.rotation.y = 0.2;
    A.expr('joy', 1); A.face.mouthOpen = 0.25 + 0.15 * Math.max(0, Math.sin(lt * 7)); A.face.cheek = 0.8;
    A.gazeTarget = { p: B.root.position.clone().add(V3(0, 0.15, -0.6)), amt: 1 };
    A.update(t);
    const sw = lieAngel(B, 0.5, 0.35, 1.2, 1.25, lt, 0.07);
    B.j.head.rotation.y = -0.35 + Math.sin(lt * 5) * 0.12; B.j.head.rotation.z = Math.sin(lt * 4.3) * 0.08;
    B.expr('laugh', 1); B.face.mouthOpen = 0.45 + 0.3 * Math.abs(Math.sin(lt * 9));
    B.gaze.yaw = -0.3; B.gaze.pitch = -0.1;
    B.j.chest.rotation.x = -Math.abs(Math.sin(lt * 9)) * 0.06;
    B.update(t); void sw;
    // top-down camera slowly rotating and descending
    const k = ease.sine(clamp(lt / 5));
    const ang = lerp(-0.2, 0.1, k), hgt = lerp(2.75, 2.05, k);
    const ctr = V3(0.05, 0, -0.35);
    const pos = ctr.clone().add(V3(Math.sin(ang) * 0.6, hgt, Math.cos(ang) * 0.6));
    s.cam.up.set(0, 1, 0);
    aim(s.cam, pos, ctr, 40);
    s.cam.rotateZ(ang * 0.6);
    return { look: { bloom: { strength: 0.6, radius: 0.6, threshold: 0.75 }, grade: { ...G.flash } }, comp: { grain: 0.11, dust: 0.8 } };
  }
};
shots.push(S6);
