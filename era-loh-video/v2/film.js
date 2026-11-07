/* «Ера лох» — deterministic film. Every frame is a pure function of t: window.__seek(t). */
(function () {
  "use strict";
  const D = window.DATA, SC = D.SC, TOTAL = D.TOTAL, SP = D.SPACE;
  const W = 1080, H = 1920;
  window.__duration = TOTAL;

  // ------------------------------------------------------------------ utils
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const eo = t => 1 - Math.pow(1 - clamp(t), 3);
  const eio = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const back = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const spring = (dt, f = 3.2, z = 0.32) => dt < 0 ? 0 : Math.exp(-z * 2 * Math.PI * f * dt) * Math.sin(2 * Math.PI * f * Math.sqrt(1 - z * z) * dt);
  const f2 = v => (Math.round(v * 100) / 100);
  function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex(c) { c = c.replace("#", ""); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mixc(a, b, t) { const A = hex(a), B = hex(b); t = clamp(t); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, "0")).join(""); }
  function ramp(stops, t) { // stops: [[t,color],...]
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 0; i < stops.length - 1; i++) if (t <= stops[i + 1][0]) return mixc(stops[i][1], stops[i + 1][1], (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]));
    return stops[stops.length - 1][1];
  }
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const envAt = (env, dt) => { if (!env || dt < 0) return 0; const i = Math.floor(dt * 60); return i < env.length ? env[i] : 0; };
  const INK = "#16121c";

  // ------------------------------------------------------------------ text measuring (for bubbles)
  const cvs = document.createElement("canvas").getContext("2d");
  function tw(s, size, weight = 900) { cvs.font = `${weight} ${size}px Inter`; return cvs.measureText(s).width; }
  function wrap(s, size, maxw) {
    const ws = s.split(" "), L = []; let cur = "";
    for (const w of ws) { const t = cur ? cur + " " + w : w; if (tw(t, size) <= maxw || !cur) cur = t; else { L.push(cur); cur = w; } }
    if (cur) L.push(cur); return L;
  }

  // ------------------------------------------------------------------ characters (type B: light face, big eyes, ink outline)
  function ik(sx, sy, tx, ty, l1, l2, bend) {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); d = Math.min(d, l1 + l2 - 0.01);
    const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c) * bend;
    return [sx + Math.cos(a + b) * l1, sy + Math.sin(a + b) * l1];
  }
  /* person(o): local frame = 100 units tall, feet at (0,0). o.x,o.y screen feet, o.h px height. */
  function person(o) {
    const s = o.h / 100, sw = clamp(o.h * 0.0065, 1.2, 6), ink = `stroke="${INK}" stroke-width="${f2(sw)}" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"`;
    const sk = o.skin || "#F7D3B2", body = o.body || "#888", legs = o.legs || "#2B3350";
    const walk = o.walk || 0, ph = o.phase || 0, sw1 = Math.sin(ph) * walk, bob = Math.abs(Math.cos(ph)) * walk * 1.6;
    const breathe = o.breathe == null ? 1 : 1 + 0.012 * Math.sin((o.t || 0) * 1.6 + (o.seed || 0));
    let g = "";
    // legs
    const legL = [-6 - sw1 * 9, 0], legR = [6 + sw1 * 9, 0];
    for (const [hx, f] of [[-5.5, legL], [5.5, legR]]) {
      g += `<path d="M${hx},${-36 + bob} L${f[0]},${f[1] - 2}" stroke="${legs}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
      g += `<path d="M${hx},${-36 + bob} L${f[0]},${f[1] - 2}" fill="none" ${ink} stroke-opacity="0"/>`;
      g += `<ellipse cx="${f[0] + 2}" cy="${f[1] - 1.5}" rx="6" ry="3" fill="${o.shoe || "#ECEAE6"}" ${ink}/>`;
    }
    const by = bob; // body y offset
    // torso (hoodie)
    const sh = -63 + by, hp = -34 + by;
    g += `<g transform="translate(0,${f2(hp)}) scale(1,${f2(breathe)}) translate(0,${f2(-hp)})">`;
    g += `<path d="M-13,${sh + 2} Q0,${sh - 4} 13,${sh + 2} L15,${hp} Q0,${hp + 4} -15,${hp} Z" fill="${body}" ${ink}/>`;
    if (o.pocket !== false) g += `<path d="M-8,${hp - 9} L8,${hp - 9} L9,${hp - 2} L-9,${hp - 2} Z" fill="rgba(0,0,0,.14)"/>`;
    if (o.strings) g += `<path d="M-3,${sh + 2} l-.6,9 M3,${sh + 2} l.6,9" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`;
    g += `</g>`;
    // hood behind head
    const hx0 = (o.headTilt || 0) * 0.15;
    if (o.hood !== false) g += `<ellipse cx="${hx0}" cy="${sh}" rx="13" ry="6" fill="${mixc(body, "#000000", 0.25)}" ${ink}/>`;
    // arms
    const arms = [];
    for (const side of [-1, 1]) {
      const spec = side < 0 ? o.armL : o.armR, sx = side * 12, sy = sh + 4, L1 = 14, L2 = 13;
      let e, hnd;
      if (spec && spec.target) { hnd = spec.target; e = ik(sx, sy, hnd[0], hnd[1], L1, L2, spec.bend || -side); }
      else {
        const a1 = ((spec && spec.a1 != null) ? spec.a1 : 12 - side * sw1 * 25 * side) * Math.PI / 180, a2 = ((spec && spec.a2 != null) ? spec.a2 : 10) * Math.PI / 180;
        e = [sx + Math.sin(a1) * L1 * side, sy + Math.cos(a1) * L1];
        hnd = [e[0] + Math.sin(a1 + a2) * L2 * side, e[1] + Math.cos(a1 + a2) * L2];
      }
      arms.push(`<path d="M${f2(sx)},${f2(sy)} L${f2(e[0])},${f2(e[1])} L${f2(hnd[0])},${f2(hnd[1])}" fill="none" stroke="${INK}" stroke-width="${f2(8.6 + sw * 2 / s)}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M${f2(sx)},${f2(sy)} L${f2(e[0])},${f2(e[1])} L${f2(hnd[0])},${f2(hnd[1])}" fill="none" stroke="${body}" stroke-width="8.6" stroke-linecap="round" stroke-linejoin="round"/>` +
        (spec && spec.phone ? phoneProp(hnd, o) : `<circle cx="${f2(hnd[0])}" cy="${f2(hnd[1])}" r="3.6" fill="${sk}" ${ink}/>`));
    }
    // head
    const hy = -81 + by, tilt = o.headTilt || 0;
    let head = `<g transform="rotate(${f2(tilt)} 0 ${sh})">`;
    head += hairBack(o, hy);
    head += `<circle cx="0" cy="${hy}" r="16.5" fill="${sk}" ${ink}/>`;
    if (o.earsOut) for (const sd of [-1, 1]) head += `<ellipse cx="${sd * 16.5}" cy="${hy + 1}" rx="3" ry="4" fill="${sk}" ${ink}/>`;
    head += face(o, hy, s, ink);
    head += hairFront(o, hy, ink);
    if (o.headphones) {
      head += `<path d="M-17,${hy} A17,18 0 0 1 17,${hy}" fill="none" stroke="#1d1d24" stroke-width="3.2" stroke-linecap="round"/>`;
      for (const sd of [-1, 1]) head += `<rect x="${sd * 17 - 3.5}" y="${hy - 4}" width="7" height="10" rx="3" fill="#24242c" ${ink}/>`;
      head += `<rect x="13.5" y="${hy - 3}" width="7" height="8" rx="3" fill="none" stroke="#2DE2FF" stroke-opacity=".7" stroke-width="1.2"/>`;
    }
    if (o.cap) head += `<path d="M-16,${hy - 5} Q0,${hy - 26} 16,${hy - 5} Z" fill="${o.cap}" ${ink}/><path d="M6,${hy - 6} L24,${hy - 4} L16,${hy - 2} Z" fill="${o.cap}" ${ink}/>`;
    head += `</g>`;
    // order: back arm behind? keep arms in front of torso, head on top unless hands-on-head
    const front = o.handsOverHead;
    g = g + (front ? head + arms.join("") : arms.join("") + head);
    const rot = o.lean || 0;
    return `<g transform="translate(${f2(o.x)},${f2(o.y)}) rotate(${f2(rot)}) scale(${f2(s)})" ${o.filter ? `filter="url(#${o.filter})"` : ""} opacity="${o.opacity == null ? 1 : o.opacity}">${g}</g>`;
  }
  function phoneProp(h, o) {
    const glow = o.phoneGlow == null ? 1 : o.phoneGlow;
    return `<g transform="translate(${f2(h[0])},${f2(h[1])}) rotate(-12)">` +
      `<circle r="9" fill="#2DE2FF" opacity="${f2(0.18 * glow)}"/>` +
      `<rect x="-4" y="-7" width="8" height="12" rx="1.6" fill="#15151c" stroke="${INK}" stroke-width="1" vector-effect="non-scaling-stroke"/>` +
      `<rect x="-3" y="-6" width="6" height="9.5" rx="1" fill="#7FE6FF" opacity="${f2(0.9 * glow)}"/>` +
      `<circle cx="0" cy="0" r="3.6" fill="${o.skin || "#F7D3B2"}" stroke="${INK}" stroke-width="1" vector-effect="non-scaling-stroke" transform="translate(0,4)"/></g>`;
  }
  function hairBack(o, hy) {
    if (o.hair === "bun") return `<circle cx="0" cy="${hy - 19}" r="7" fill="${o.hairCol}" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    if (o.hair === "long") return `<path d="M-17,${hy - 4} Q-20,${hy + 14} -12,${hy + 20} L12,${hy + 20} Q20,${hy + 14} 17,${hy - 4} Z" fill="${o.hairCol}" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    return "";
  }
  function hairFront(o, hy, ink) {
    const c = o.hairCol || "#5a3a22";
    switch (o.hair) {
      case "tuft": return `<path d="M-16.5,${hy - 2} Q-17,${hy - 17} 0,${hy - 18} Q15,${hy - 18} 16.6,${hy - 4} L12,${hy - 9} L9,${hy - 4} L5,${hy - 10} L1,${hy - 5} L-4,${hy - 11} L-8,${hy - 6} L-12,${hy - 10} Z" fill="${c}" ${ink}/>` +
        `<path d="M-2,${hy - 17} q4,-7 9,-5 q-4,1 -5,6" fill="${c}" ${ink}/>`;
      case "grandma": return `<path d="M-17,${hy - 1} Q-18,${hy - 19} 0,${hy - 19} Q18,${hy - 19} 17,${hy - 1} Q10,${hy - 9} 0,${hy - 9} Q-10,${hy - 9} -17,${hy - 1} Z" fill="#E8E6EC" ${ink}/>` +
        `<circle cx="-11" cy="${hy - 14}" r="4" fill="#E8E6EC" ${ink}/><circle cx="11" cy="${hy - 14}" r="4" fill="#E8E6EC" ${ink}/><circle cx="0" cy="${hy - 18}" r="4.5" fill="#E8E6EC" ${ink}/>`;
      case "none": return "";
      default: return `<path d="M-16.5,${hy - 1} Q-17,${hy - 18} 0,${hy - 18} Q17,${hy - 18} 16.5,${hy - 1} Q9,${hy - 10} -2,${hy - 9} Q-11,${hy - 8} -16.5,${hy - 1} Z" fill="${c}" ${ink}/>`;
    }
  }
  function face(o, hy, s, ink) {
    const F = o.face || {}, lk = F.look || [0, 0], ey = hy + 1, m = F.mouth || 0;
    let g = "";
    // blush
    g += `<ellipse cx="-10" cy="${hy + 6}" rx="3.6" ry="2" fill="#FF7A8A" opacity="${F.blush == null ? 0.35 : F.blush}"/><ellipse cx="10" cy="${hy + 6}" rx="3.6" ry="2" fill="#FF7A8A" opacity="${F.blush == null ? 0.35 : F.blush}"/>`;
    const eyes = F.eyes || "open", wide = eyes === "wide" ? 1.3 : 1, blink = F.blink || 0;
    for (const sd of [-1, 1]) {
      const ex = sd * 6.2;
      if (eyes === "squint") {
        g += `<path d="M${ex - sd * 3.5},${ey - 3.4} L${ex + sd * 2.6},${ey} L${ex - sd * 3.5},${ey + 3.4}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else if (eyes === "closed" || blink > 0.85) {
        window.__closedHit = true;
        g += `<path d="M${ex - 3.6},${ey} Q${ex},${ey + 2.6} ${ex + 3.6},${ey}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
      } else if (eyes === "down") {
        g += `<path d="M${ex - 3.6},${ey + 1} Q${ex},${ey + 3.4} ${ex + 3.6},${ey + 1}" fill="none" stroke="${INK}" stroke-width="${f2(1.8 * s)}" stroke-linecap="round"/>`;
      } else {
        const rx = 3.9 * wide, ry = 4.8 * wide * (1 - blink * 0.85), pr = eyes === "wide" ? 1.25 : 2.1;
        g += `<ellipse cx="${ex}" cy="${ey}" rx="${f2(rx)}" ry="${f2(ry)}" fill="#fff" ${ink}/>`;
        if (blink < 0.6) {
          g += `<circle cx="${f2(ex + lk[0] * 1.6)}" cy="${f2(ey + lk[1] * 1.6)}" r="${pr}" fill="${INK}"/>`;
          g += `<circle cx="${f2(ex + lk[0] * 1.6 + 0.8)}" cy="${f2(ey + lk[1] * 1.6 - 0.9)}" r="${f2(pr * 0.38)}" fill="#fff"/>`;
        }
      }
      // brows
      const ba = (F.brow || 0) * sd; // positive = angry (inner down)
      const by = ey - 7.2 * (eyes === "wide" ? 1.15 : 1) - (F.browUp || 0);
      g += `<path d="M${ex - 3.6},${f2(by - ba * 1.2)} L${ex + 3.6},${f2(by + ba * 1.2)}" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>`;
    }
    // mouth
    const my = hy + 9.2;
    if (m < 0.07) {
      const sm = F.smile || 0;
      g += `<path d="M-3.4,${my} Q0,${my + sm * 3} 3.4,${my}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`;
    } else {
      const rx = 2.6 + m * 4.6, ry = 1.4 + m * 6.2;
      g += `<path d="M${-rx},${my - ry * 0.25} Q0,${my - ry * 0.55} ${rx},${my - ry * 0.25} Q${rx},${my + ry} 0,${my + ry} Q${-rx},${my + ry} ${-rx},${my - ry * 0.25} Z" fill="#5A0F1A" ${ink}/>`;
      if (m > 0.3) g += `<path d="M${-rx * 0.75},${my - ry * 0.35} Q0,${my - ry * 0.5} ${rx * 0.75},${my - ry * 0.35} L${rx * 0.7},${my - ry * 0.08} Q0,${my - ry * 0.2} ${-rx * 0.7},${my - ry * 0.08} Z" fill="#fff"/>`;
      g += `<ellipse cx="0" cy="${f2(my + ry * 0.62)}" rx="${f2(rx * 0.55)}" ry="${f2(ry * 0.3)}" fill="#E8697A"/>`;
    }
    if (F.sweat) g += `<path d="M14,${hy - 10} q3.2,5 0,7 q-3.2,-2 0,-7 Z" fill="#9FD8FF" stroke="${INK}" stroke-width="1" vector-effect="non-scaling-stroke" opacity="${F.sweat}"/>`;
    return g;
  }
  function blinkAt(t, seed) { // blink every 2.6–4.8 s
    const r = rng(seed * 977 + 3); let tt = r() * 2; while (tt < t + 1) { const d = t - tt; if (d >= 0 && d < 0.14) return Math.sin(d / 0.14 * Math.PI); tt += 2.6 + r() * 2.2; } return 0;
  }

  // ------------------------------------------------------------------ bubble
  function bubble(x, y, text, size, red, opt = {}) {
    const maxw = opt.maxw || 560, lines = wrap(text, size, maxw), lh = size * 1.12;
    const w = Math.max(...lines.map(l => tw(l, size))) + size * 0.9, h = lh * lines.length + size * 0.55;
    const fill = red ? "#E8312F" : "#FFFFFF", tc = red ? "#FFFFFF" : INK;
    const tx = opt.tail ? opt.tail[0] : x + w * 0.3, ty = opt.tail ? opt.tail[1] : y + h + 40;
    const bx = clamp(tx, x + 40, x + w - 40);
    const sc = opt.scale == null ? 1 : opt.scale, ox = opt.tail ? tx : x, oy = opt.tail ? ty : y;
    let g = `<g transform="translate(${f2(ox)},${f2(oy)}) scale(${f2(sc)}) rotate(${f2(opt.rot || 0)}) translate(${f2(-ox)},${f2(-oy)})">`;
    g += `<rect x="${f2(x + 6)}" y="${f2(y + 9)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(size * 0.42)}" fill="rgba(10,6,20,.35)"/>`;
    g += `<path d="M${f2(bx - 24)},${f2(y + h - 6)} L${f2(tx)},${f2(ty)} L${f2(bx + 22)},${f2(y + h - 6)} Z" fill="${fill}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
    g += `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(size * 0.42)}" fill="${fill}" stroke="${INK}" stroke-width="5"/>`;
    g += `<path d="M${f2(bx - 20)},${f2(y + h - 8)} L${f2(tx + (bx - tx) * 0.12)},${f2(ty - (ty - y - h) * 0.12)} L${f2(bx + 18)},${f2(y + h - 8)} Z" fill="${fill}"/>`;
    if (red) g += `<rect x="${f2(x + 10)}" y="${f2(y + 8)}" width="${f2(w - 20)}" height="${f2(h * 0.32)}" rx="${f2(size * 0.3)}" fill="#fff" opacity=".12"/>`;
    lines.forEach((l, i) => {
      g += `<text x="${f2(x + w / 2)}" y="${f2(y + size * 0.28 + lh * (i + 0.82))}" font-size="${size}" font-weight="900" fill="${tc}" text-anchor="middle" letter-spacing="${f2(size * 0.01)}">${esc(l)}</text>`;
    });
    return g + `</g>`;
  }
  const shoutText = lvl => "ЕРА ЛОХ" + "!".repeat(1 + Math.round(lvl * 2.4));

  // ------------------------------------------------------------------ street world
  const VPY = 1000, FOC = 620;
  const R0 = rng(11);
  const BUILD = [];
  { let d = 0.5; const cols = ["#C8382E", "#D9A273", "#B5503A", "#E8D2AE", "#C76A3E", "#9E4A3C", "#D78E5A"];
    const signs = ["ПРОДУКТЫ 24", "АПТЕКА", "ШАУРМА", "ЦВЕТЫ", "РЕМОНТ ОБУВИ", "КОФЕ"];
    let k = 0; while (d < 46) { const w = 1.8 + R0() * 1.6; BUILD.push({ d1: d, d2: d + w, h: 3.2 + R0() * 2.4, col: cols[k % cols.length], sign: signs[k % signs.length], lit: R0(), seed: k * 13 + 1 }); d += w; k++; } }
  const BUILD_R = [];
  { let d = 2; const cols = ["#8A6A8F", "#6E7FA8", "#A07C6A", "#7C8F7A"]; let k = 0; while (d < 46) { const w = 2.2 + R0() * 2; BUILD_R.push({ d1: d, d2: d + w, h: 4 + R0() * 3, col: cols[k % cols.length], seed: 300 + k }); d += w + 0.4; k++; } }
  const SKY = [];
  { const r = rng(5); for (let i = 0; i < 26; i++) SKY.push({ x: -100 + i * 52 + r() * 30, w: 40 + r() * 46, h: 60 + r() * 150, seed: i }); }

  function streetCam(sc, lt) {
    const p = eio(lt / sc.dur);
    return { cx: lerp(-0.06, 0.08, p) + (sc.n % 2 ? 0 : -0.04), cz: lerp(0, 0.16, p) };
  }
  function mkProj(cam) {
    const VPX = 560;
    return (X, Y, d) => { const dd = Math.max(0.12, d - cam.cz); return [VPX + FOC * (X - cam.cx) / dd, VPY + FOC * (1 - Y) / dd, dd]; };
  }
  const P2 = a => a.map(p => f2(p[0]) + "," + f2(p[1])).join(" ");
  function dblur(d) { if (d < 1.05) return Math.min(8, Math.round((1.05 - d) * 14)); if (d > 14) return Math.min(3, Math.round((d - 14) * 0.12)); return 0; }
  function wrapBlur(svg, d) { const b = dblur(d); return b ? `<g filter="url(#b${b})">${svg}</g>` : svg; }
  function matrixFor(p0, p1, p3, w, h) { return `matrix(${f2((p1[0] - p0[0]) / w)},${f2((p1[1] - p0[1]) / w)},${f2((p3[0] - p0[0]) / h)},${f2((p3[1] - p0[1]) / h)},${f2(p0[0])},${f2(p0[1])})`; }

  /* shout state for a scene at local time lt */
  function shoutState(sc, lt) {
    const S = sc.shout, dt = lt - S.at;
    const active = dt >= -0.3 && dt < S.dur + 0.15;
    const env = envAt(S.env, dt);
    return { dt, active, env, on: dt >= 0 && dt < S.dur, pre: dt < 0 && dt > -0.3 ? (dt + 0.3) / 0.3 : 0 };
  }

  function renderStreet(sc, lt, t) {
    const lvl = sc.lvl, cam = streetCam(sc, lt), pr = mkProj(cam), sh = shoutState(sc, lt);
    const items = []; // {d, svg}
    const add = (d, svg) => items.push({ d, svg }); const walls = [];
    // --- sky
    const top = ramp([[0, "#4F5FA8"], [0.3, "#5D4C98"], [0.55, "#5A2E6E"], [0.8, "#3A1230"], [1, "#22081a"]], lvl);
    const bot = ramp([[0, "#F6A77C"], [0.3, "#F48C6A"], [0.55, "#EE6A4C"], [0.8, "#E2453A"], [1, "#C8281E"]], lvl);
    let g = `<defs><linearGradient id="sky${sc.n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mixc(top, bot, 0.55)}"/><stop offset="1" stop-color="${bot}"/></linearGradient>` +
      `<radialGradient id="sun${sc.n}"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".25" stop-color="#FFD36B" stop-opacity=".95"/><stop offset=".6" stop-color="#FF9A5A" stop-opacity=".35"/><stop offset="1" stop-color="#FF7A50" stop-opacity="0"/></radialGradient></defs>`;
    g += `<rect x="-200" y="-200" width="${W + 400}" height="${VPY + 300}" fill="url(#sky${sc.n})"/>`;
    const sunY = VPY - 150 + lvl * 160 - lt * 6, sunX = 880 - cam.cx * 40;
    g += `<circle cx="${f2(sunX)}" cy="${f2(sunY)}" r="330" fill="url(#sun${sc.n})"/><circle cx="${f2(sunX)}" cy="${f2(sunY)}" r="70" fill="#FFE9A8"/>`;
    // clouds (blurred, drifting, slight parallax)
    for (let i = 0; i < 6; i++) {
      const r = rng(40 + i), cx = ((r() * 1300 + t * (8 + r() * 10)) % 1500) - 200 - cam.cx * 30, cy = 380 + r() * 380, s = 0.7 + r() * 0.9;
      g += `<g filter="url(#b4)" opacity=".85" transform="translate(${f2(cx)},${f2(cy)}) scale(${f2(s)})"><ellipse cx="0" cy="0" rx="110" ry="34" fill="${mixc("#FFE3D6", "#FF9C80", lvl)}"/><ellipse cx="-40" cy="-18" rx="56" ry="36" fill="${mixc("#FFEFE6", "#FFB090", lvl)}"/><ellipse cx="38" cy="-24" rx="64" ry="44" fill="${mixc("#FFEFE6", "#FFB090", lvl)}"/></g>`;
    }
    // far skyline: panel blocks with lit windows (haze)
    let sky = "";
    for (const b of SKY) {
      const x = b.x - cam.cx * 18, y = VPY - b.h + 6, col = mixc("#6B5A8E", "#3A1A3A", lvl);
      sky += `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(b.w)}" height="${f2(b.h + 10)}" fill="${col}"/>`;
      const r = rng(b.seed * 7 + 1);
      for (let yy = y + 10; yy < VPY - 8; yy += 14) for (let xx = x + 6; xx < x + b.w - 8; xx += 11) if (r() < 0.32 + lvl * 0.4) sky += `<rect x="${f2(xx)}" y="${f2(yy)}" width="5" height="6" fill="#FFD36B" opacity="${f2(0.55 + r() * 0.45)}"/>`;
    }
    g += `<g filter="url(#b1)">${sky}</g><rect x="-200" y="${VPY - 240}" width="${W + 400}" height="250" fill="url(#haze)" opacity="${f2(0.55 + lvl * 0.2)}"/>`;
    // ground
    const roadL = 0.42, roadR = 3.4;
    g += `<rect x="-200" y="${VPY}" width="${W + 400}" height="${H}" fill="${mixc("#C9C3BA", "#8D7A78", lvl)}"/>`;
    const q = (X1, X2, d1, d2, fill, extra = "") => `<polygon points="${P2([pr(X1, 0, d1), pr(X1, 0, d2), pr(X2, 0, d2), pr(X2, 0, d1)])}" fill="${fill}" ${extra}/>`;
    g += q(roadL, roadR, 0.5, 300, mixc("#5E5F6B", "#4A3F49", lvl));
    g += q(roadR, roadR + 1.6, 0.5, 300, mixc("#BDB5AA", "#857172", lvl));
    g += q(roadL - 0.08, roadL, 0.5, 300, "#E9E4DA");
    for (let k = 0; k < 60; k++) { const d1 = 0.6 + k * 1.5; g += q(1.82, 1.94, d1, d1 + 0.75, "#F2EEE6"); }
    for (let k = 0; k < 80; k++) { const dd = 0.6 + k * 0.62, a = pr(-1.3, 0, dd), b = pr(roadL, 0, dd); g += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="rgba(60,40,40,.13)" stroke-width="${f2(Math.max(0.6, 2.4 / dd))}"/>`; }
    for (let k = 1; k < 5; k++) { const X = -1.3 + k * 0.35, a = pr(X, 0, 0.6), b = pr(X, 0, 120); g += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="rgba(60,40,40,.10)" stroke-width="1.5"/>`; }
    // manhole + puddle
    { const c = pr(-0.35, 0, 2.6); g += `<ellipse cx="${f2(c[0])}" cy="${f2(c[1])}" rx="${f2(120 / 2.6)}" ry="${f2(26 / 2.6)}" fill="#6d6560" stroke="${INK}" stroke-opacity=".5"/>`; }
    // --- left facades (far → near)
    for (let i = BUILD.length - 1; i >= 0; i--) {
      const b = BUILD[i]; if (b.d2 < cam.cz + 0.4) continue;
      const d1 = Math.max(b.d1, cam.cz + 0.35), X = -1.3, fcol = mixc(b.col, "#3a1424", lvl * 0.45);
      let s = `<polygon points="${P2([pr(X, 0, d1), pr(X, b.h, d1), pr(X, b.h, b.d2), pr(X, 0, b.d2)])}" fill="${fcol}" stroke="${INK}" stroke-width="${f2(Math.max(1, 3 / b.d1))}" stroke-linejoin="round"/>`;
      // cornice
      s += `<polygon points="${P2([pr(X, b.h, d1), pr(X + 0.12, b.h - 0.1, d1), pr(X + 0.12, b.h - 0.1, b.d2), pr(X, b.h, b.d2)])}" fill="${mixc(fcol, "#000000", 0.25)}"/>`;
      const r = rng(b.seed), n = Math.max(1, Math.floor((b.d2 - b.d1) / 0.62));
      for (let ii = 0; ii < n; ii++) for (let j = 0; j < Math.floor((b.h - 1.5) / 0.85); j++) {
        const w1 = b.d1 + (ii + 0.28) * (b.d2 - b.d1) / n, w2 = b.d1 + (ii + 0.72) * (b.d2 - b.d1) / n; if (w1 < d1) continue;
        const y1 = 1.55 + j * 0.85, y2 = y1 + 0.52, lit = r() < 0.25 + lvl * 0.5 * (b.lit);
        s += `<polygon points="${P2([pr(X, y2, w1), pr(X, y1, w1), pr(X, y1, w2), pr(X, y2, w2)])}" fill="${lit ? "#FFD36B" : "#2B3150"}" stroke="#F4EEE4" stroke-width="${f2(Math.max(0.6, 2.2 / w1))}"/>`;
        if (r() < 0.18) s += `<polygon points="${P2([pr(X, y1 - 0.02, w1 - 0.05), pr(X + 0.22, y1 - 0.02, w1 - 0.05), pr(X + 0.22, y1 - 0.02, w2 + 0.05), pr(X, y1 - 0.02, w2 + 0.05)])}" fill="${mixc(fcol, "#000000", 0.35)}"/>` +
          `<polygon points="${P2([pr(X + 0.22, y1 - 0.02, w1 - 0.05), pr(X + 0.22, y1 + 0.28, w1 - 0.05), pr(X + 0.22, y1 + 0.28, w2 + 0.05), pr(X + 0.22, y1 - 0.02, w2 + 0.05)])}" fill="none" stroke="${INK}" stroke-width="${f2(Math.max(0.6, 2 / w1))}"/>`; // balcony
        else if (r() < 0.12) s += `<polygon points="${P2([pr(X, y2 + 0.05, w2 + 0.02), pr(X + 0.12, y2 + 0.05, w2 + 0.02), pr(X + 0.12, y2 + 0.25, w2 + 0.02), pr(X, y2 + 0.25, w2 + 0.02)])}" fill="#E6E3DC" stroke="${INK}" stroke-width="${f2(Math.max(0.5, 1.6 / w1))}"/>`; // AC unit
      }
      // shop front + sign
      const sd1 = Math.max(d1, b.d1 + 0.15), sd2 = b.d2 - 0.15;
      if (sd2 > sd1 + 0.3) {
        s += `<polygon points="${P2([pr(X, 1.0, sd1), pr(X, 0.05, sd1), pr(X, 0.05, sd2), pr(X, 1.0, sd2)])}" fill="#2B2E3E" stroke="${INK}" stroke-width="${f2(Math.max(0.6, 2 / sd1))}"/>`;
        s += `<polygon points="${P2([pr(X, 1.0, sd1), pr(X, 0.05, sd1), pr(X, 0.05, sd2), pr(X, 1.0, sd2)])}" fill="#FFD36B" opacity="${f2(0.18 + lvl * 0.1)}"/>`;
        const p0 = pr(X, 1.38, sd1), p1 = pr(X, 1.38, sd2), p3 = pr(X, 1.08, sd1);
        s += `<polygon points="${P2([p0, p1, pr(X, 1.08, sd2), p3])}" fill="#1D2A44" stroke="${INK}" stroke-width="${f2(Math.max(0.6, 2 / sd1))}"/>`;
        const sw = 100 * (sd2 - sd1) / 0.3, size = 30;
        s += `<g transform="${matrixFor(p0, p1, p3, 1000, 100)}"><text x="500" y="72" font-size="62" font-weight="900" fill="#FFE08A" text-anchor="middle" textLength="${Math.min(900, b.sign.length * 70)}" lengthAdjust="spacingAndGlyphs">${b.sign}</text></g>`;
        // awning
        s += `<polygon points="${P2([pr(X, 1.06, sd1), pr(X + 0.42, 0.9, sd1), pr(X + 0.42, 0.9, sd2), pr(X, 1.06, sd2)])}" fill="${["#E23B3B", "#2E8F5A", "#F5B83D", "#3A6FD0"][b.seed % 4]}" stroke="${INK}" stroke-width="${f2(Math.max(0.6, 2 / sd1))}"/>`;
      }
      walls.push(`<g ${b.d1 < 0.9 ? 'filter="url(#b2)"' : ''}>${s}</g>`);
    }
    // right side buildings (across the road)
    for (let i = BUILD_R.length - 1; i >= 0; i--) {
      const b = BUILD_R[i], X = roadR + 1.6, fcol = mixc(b.col, "#2a1028", lvl * 0.5);
      let s = `<polygon points="${P2([pr(X, 0, b.d1), pr(X, b.h, b.d1), pr(X, b.h, b.d2), pr(X, 0, b.d2)])}" fill="${fcol}" stroke="${INK}" stroke-width="${f2(Math.max(0.8, 2.5 / b.d1))}"/>`;
      const r = rng(b.seed);
      for (let ii = 0; ii < Math.floor((b.d2 - b.d1) / 0.7); ii++) for (let j = 0; j < Math.floor((b.h - 1) / 0.9); j++) {
        const w1 = b.d1 + 0.2 + ii * 0.7, y1 = 1.1 + j * 0.9, lit = r() < 0.3 + lvl * 0.5;
        s += `<polygon points="${P2([pr(X, y1 + 0.5, w1), pr(X, y1, w1), pr(X, y1, w1 + 0.35), pr(X, y1 + 0.5, w1 + 0.35)])}" fill="${lit ? "#FFD36B" : "#2B3150"}"/>`;
      }
      add(b.d1 + 0.02, s);
    }
    // street lamps + trees + wires
    const lamps = [1.7, 4.2, 7.4, 11, 15, 20, 26];
    lamps.forEach((dd, i) => {
      const a = pr(roadL - 0.04, 0, dd), b = pr(roadL - 0.04, 3.0, dd), c = pr(roadL + 0.35, 3.05, dd), wv = Math.max(1.5, 14 / dd);
      let s = `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="#2a2a34" stroke-width="${f2(wv)}" stroke-linecap="round"/>`;
      s += `<path d="M${f2(b[0])},${f2(b[1])} Q${f2(b[0])},${f2(c[1] - 12 / dd)} ${f2(c[0])},${f2(c[1])}" fill="none" stroke="#2a2a34" stroke-width="${f2(wv * 0.7)}"/>`;
      s += `<circle cx="${f2(c[0])}" cy="${f2(c[1] + 6 / dd)}" r="${f2(160 / dd)}" fill="url(#lampglow)" opacity="${f2(0.4 + lvl * 0.5)}"/>`;
      s += `<ellipse cx="${f2(c[0])}" cy="${f2(c[1] + 4 / dd)}" rx="${f2(16 / dd)}" ry="${f2(8 / dd)}" fill="#FFE9A8"/>`;
      if (i < lamps.length - 1) { // wire to the next lamp
        const n = pr(roadL - 0.04, 2.9, lamps[i + 1]);
        s += `<path d="M${f2(b[0])},${f2(b[1] + 4 / dd)} Q${f2((b[0] + n[0]) / 2)},${f2((b[1] + n[1]) / 2 + 40 / dd)} ${f2(n[0])},${f2(n[1])}" fill="none" stroke="#1d1d24" stroke-width="${f2(Math.max(0.8, 3 / dd))}"/>`;
      }
      add(dd, s);
    });
    const trees = [2.9, 6, 9.4, 13, 17.5, 23];
    trees.forEach((dd, i) => {
      const base = pr(roadL + 0.15, 0, dd), top = pr(roadL + 0.15, 1.9, dd), r = 0.75 * FOC / (dd - cam.cz), shake = sh.on ? Math.sin(t * 40 + i) * lvl * 6 / dd * 4 : 0;
      let s = `<line x1="${f2(base[0])}" y1="${f2(base[1])}" x2="${f2(top[0])}" y2="${f2(top[1])}" stroke="#5a3b28" stroke-width="${f2(30 / dd)}" stroke-linecap="round"/>`;
      const fc = mixc("#3E7A4A", "#5a3a2a", lvl * 0.7), fc2 = mixc("#5A9A5E", "#7a4a2a", lvl * 0.7);
      s += `<g transform="translate(${f2(top[0] + shake)},${f2(top[1])})"><circle cx="0" cy="${f2(-r * 0.3)}" r="${f2(r * 0.62)}" fill="${fc}" stroke="${INK}" stroke-width="${f2(Math.max(1, 4 / dd))}"/>` +
        `<circle cx="${f2(-r * 0.45)}" cy="${f2(r * 0.05)}" r="${f2(r * 0.45)}" fill="${fc}" stroke="${INK}" stroke-width="${f2(Math.max(1, 4 / dd))}"/><circle cx="${f2(r * 0.45)}" cy="${f2(0)}" r="${f2(r * 0.48)}" fill="${fc}" stroke="${INK}" stroke-width="${f2(Math.max(1, 4 / dd))}"/>` +
        `<circle cx="${f2(-r * 0.15)}" cy="${f2(-r * 0.45)}" r="${f2(r * 0.3)}" fill="${fc2}"/></g>`;
      add(dd + 0.01, s);
    });
    // falling leaves after shouts
    if (sh.dt > 0) {
      const r = rng(sc.n * 17);
      for (let k = 0; k < 10 + lvl * 20; k++) {
        const dd = trees[k % 3], top = pr(roadL + 0.15, 1.9, dd), u = sh.dt - r() * 0.4; if (u < 0) continue;
        const x = top[0] + (r() - 0.5) * 220 / dd * 3 + Math.sin(u * 4 + k) * 30, y = top[1] + u * (160 + r() * 140);
        g += ""; add(dd - 0.05, `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(22 / dd)}" ry="${f2(11 / dd)}" transform="rotate(${f2(u * 300 + k * 40)} ${f2(x)} ${f2(y)})" fill="${mixc("#6FAF5A", "#E28A3A", r())}"/>`);
      }
    }
    // parked car with alarm (reaction 2)
    {
      const X1 = roadL + 0.25, X2 = X1 + 0.75, d1 = 5.0, d2 = 7.2, col = "#3A6FD0";
      const alarm = sc.n >= 2 && sh.dt > 0.25 && Math.floor((sh.dt - 0.25) * 4) % 2 === 0;
      let s = `<polygon points="${P2([pr(X1, 0.2, d1), pr(X1, 0.75, d1), pr(X1, 0.75, d2), pr(X1, 0.2, d2)])}" fill="${col}" stroke="${INK}" stroke-width="2"/>`;
      s += `<polygon points="${P2([pr(X1, 0.75, d1 + 0.5), pr(X1 + 0.1, 1.15, d1 + 0.8), pr(X1 + 0.1, 1.15, d2 - 0.6), pr(X1, 0.75, d2 - 0.2)])}" fill="${mixc(col, "#ffffff", 0.15)}" stroke="${INK}" stroke-width="2"/>`;
      s += `<polygon points="${P2([pr(X1 + 0.05, 0.8, d1 + 0.85), pr(X1 + 0.1, 1.08, d1 + 1.0), pr(X1 + 0.1, 1.08, d2 - 0.75), pr(X1 + 0.05, 0.8, d2 - 0.35)])}" fill="#BCD6EE" opacity=".9"/>`;
      s += `<polygon points="${P2([pr(X1, 0.75, d1), pr(X2, 0.75, d1), pr(X2, 0.2, d1), pr(X1, 0.2, d1)])}" fill="${mixc(col, "#000000", 0.2)}" stroke="${INK}" stroke-width="2"/>`;
      for (const dd of [d1 + 0.45, d2 - 0.45]) { const w = pr(X1 - 0.02, 0.18, dd); s += `<ellipse cx="${f2(w[0])}" cy="${f2(w[1])}" rx="${f2(60 / dd)}" ry="${f2(80 / dd)}" fill="#1a1a20" stroke="${INK}"/><ellipse cx="${f2(w[0])}" cy="${f2(w[1])}" rx="${f2(24 / dd)}" ry="${f2(32 / dd)}" fill="#9a9aa6"/>`; }
      const hl = pr(X1 + 0.1, 0.55, d1), hr = pr(X2 - 0.1, 0.55, d1);
      for (const h of [hl, hr]) s += `<circle cx="${f2(h[0])}" cy="${f2(h[1])}" r="${alarm ? 46 : 9}" fill="${alarm ? "#FFB43A" : "#FFE9A8"}" opacity="${alarm ? 0.55 : 0.9}"/>`;
      add(d1, s);
    }
    // bench + bin + pigeons
    { const a = pr(-1.05, 0.45, 3.1), b = pr(-1.05, 0.45, 3.9), c = pr(-1.05, 0, 3.1), d = pr(-1.05, 0, 3.9);
      add(3.1, `<polygon points="${P2([a, b, pr(-0.8, 0.45, 3.9), pr(-0.8, 0.45, 3.1)])}" fill="#8A5A3A" stroke="${INK}" stroke-width="2"/><line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(c[0])}" y2="${f2(c[1])}" stroke="${INK}" stroke-width="4"/><line x1="${f2(b[0])}" y1="${f2(b[1])}" x2="${f2(d[0])}" y2="${f2(d[1])}" stroke="${INK}" stroke-width="3"/><polygon points="${P2([pr(-1.25, 0.95, 3.1), pr(-1.25, 0.95, 3.9), b, a])}" fill="#9A6A48" stroke="${INK}" stroke-width="2"/>`); }
    { const c = pr(-1.08, 0, 2.2), r = 26 * 2.6 / (2.2 - cam.cz), hb = 0.8 * FOC / (2.2 - cam.cz);
      const kick = sc.n >= 6 ? spring(sh.dt - 0.1, 2.2, 0.25) * 12 : 0;
      add(2.2, `<g transform="rotate(${f2(kick)} ${f2(c[0])} ${f2(c[1])})"><path d="M${f2(c[0] - r)},${f2(c[1] - hb)} L${f2(c[0] + r)},${f2(c[1] - hb)} L${f2(c[0] + r * 0.8)},${f2(c[1])} L${f2(c[0] - r * 0.8)},${f2(c[1])} Z" fill="#3E6A55" stroke="${INK}" stroke-width="3"/><rect x="${f2(c[0] - r * 1.1)}" y="${f2(c[1] - hb - 10)}" width="${f2(r * 2.2)}" height="12" rx="5" fill="#2E5242" stroke="${INK}" stroke-width="3"/></g>`); }
    // pigeons: peck in 1–2, fly in 3
    if (sc.n <= 3) {
      const r = rng(77);
      for (let k = 0; k < 7; k++) {
        const X = -0.7 + r() * 0.9, dd = 2.6 + r() * 1.6, base = pr(X, 0, dd), s0 = 1.6 / (dd - cam.cz);
        let x = base[0], y = base[1], flap = 0, peck = Math.max(0, Math.sin(t * 5 + k * 1.7)) * 6;
        if (sc.n === 3) { const u = clamp((sh.dt - 0.05 - r() * 0.25) / 1.8); if (u > 0) { x += u * (300 + r() * 500) * (k % 2 ? 1 : 0.6); y -= u * u * (900 + r() * 500) + u * 300; flap = Math.sin(t * 38 + k) * 16; peck = 0; } }
        add(dd - 0.02, `<g transform="translate(${f2(x)},${f2(y)}) scale(${f2(s0)})"><ellipse cx="0" cy="-22" rx="22" ry="15" fill="#8D93A8" stroke="${INK}" stroke-width="2.5"/><circle cx="${f2(16)}" cy="${f2(-36 + peck)}" r="9" fill="#7A8098" stroke="${INK}" stroke-width="2.5"/><path d="M24,${f2(-37 + peck)} l7,2 l-7,2 Z" fill="#E8B04A"/><path d="M-6,-26 q-18,${f2(-14 - flap)} -30,${f2(-4 - flap * 1.5)} q14,6 30,2 Z" fill="#6F7590" stroke="${INK}" stroke-width="2"/>${flap ? "" : `<path d="M-2,-8 l-3,8 M4,-8 l3,8" stroke="#E07A5A" stroke-width="3"/>`}</g>`);
      }
    }
    // grandma window (scene 4)
    if (sc.n === 4) {
      const X = -1.3, d1 = 2.5, d2 = 3.15, y1 = 1.95, y2 = 2.75, open = eo((lt - 0.75) / 0.25);
      const p = (y, d) => pr(X, y, d);
      let s = `<polygon points="${P2([p(y2, d1), p(y1, d1), p(y1, d2), p(y2, d2)])}" fill="#FFD36B" stroke="#F4EEE4" stroke-width="4"/>`;
      const gx = (p(y1, d1)[0] + p(y1, d2)[0]) / 2, gy = p(y1, (d1 + d2) / 2)[1], pop = eo((lt - 0.85) / 0.3);
      if (pop > 0) s += person({ x: gx, y: gy + 175 - pop * 60, h: 330, body: "#9A5A8A", hair: "grandma", skin: "#F3CBAE", t, seed: 9, face: { eyes: "squint", brow: 1.5, mouth: envAt(sc.line.env, lt - sc.line.at) * 0.9, blush: 0.5 }, armL: { a1: 20, a2: 20 }, armR: { target: [24 + Math.sin(t * 22) * 3, -96] }, opacity: 1 });
      // shutters swing
      const sw = (1 - open);
      s += `<polygon points="${P2([p(y2, d1), p(y1, d1), p(y1, lerp(d1, (d1 + d2) / 2, sw)), p(y2, lerp(d1, (d1 + d2) / 2, sw))])}" fill="#E9F2FA" fill-opacity=".85" stroke="${INK}" stroke-width="3"/>`;
      s += `<polygon points="${P2([p(y2, lerp(d2, (d1 + d2) / 2, sw)), p(y1, lerp(d2, (d1 + d2) / 2, sw)), p(y1, d2), p(y2, d2)])}" fill="#E9F2FA" fill-opacity=".85" stroke="${INK}" stroke-width="3"/>`;
      add(d1 - 0.01, `<g clip-path="url(#gwin)">${s}</g>` + `<clipPath id="gwin"><polygon points="${P2([p(y2 + 0.6, d1), p(y1, d1), p(y1, d2), p(y2 + 0.6, d2)])}"/></clipPath>`);
    }
    // ambient walkers (react: jump + look, ears from 150 dB, blown in 200 dB)
    const WALK = [
      { X: -0.95, d0: 18, sp: -1.1, body: "#7A8BB5", hair: "short", hairCol: "#2a2018" },
      { X: -0.55, d0: 6, sp: 0.8, body: "#B5866A", hair: "bun", hairCol: "#5a3020" },
      { X: -0.2, d0: 24, sp: -1.4, body: "#8A9A7A", hair: "short", hairCol: "#a07a40", cap: "#C8382E" },
      { X: -1.0, d0: 11, sp: 0.9, body: "#9A7AA8", hair: "long", hairCol: "#2a1a10" },
      { X: 0.05, d0: 30, sp: -1.0, body: "#A8A08A", hair: "short", hairCol: "#1a1a1a" },
    ];
    WALK.forEach((w, i) => {
      let dd = w.d0 + w.sp * (t - (sc.t0 - 3)); dd = ((dd - 2) % 30 + 30) % 30 + 2.2;
      const base = pr(w.X, 0, dd), h = 1.72 * FOC / (dd - cam.cz);
      const delay = 0.12 + dd * 0.035, react = sh.dt - delay, jump = react > 0 ? Math.max(0, spring(react, 2.6, 0.35)) * 26 * (0.4 + lvl) : 0;
      const ears = lvl >= 0.45 && react > 0, blown = sc.n === 7 && react > 0 ? eo(react / 0.5) : 0;
      add(dd, person({ x: base[0] + blown * 160 / dd * 6, y: base[1] - jump, h, body: w.body, hair: w.hair, hairCol: w.hairCol, cap: w.cap, t, seed: i, walk: ears || blown ? 0 : 1, phase: t * 7 + i * 2, lean: blown * 22,
        face: { eyes: react > 0 && react < 2.5 ? (ears ? "squint" : "wide") : "open", look: react > 0 ? [-1, 0] : [w.sp > 0 ? 0 : 0, 0], mouth: react > 0 && react < 1.2 ? 0.35 : 0, blink: blinkAt(t, i + 5) },
        armL: ears ? { target: [-17, -82] } : null, armR: ears ? { target: [17, -82] } : null, earsOut: false, filter: dblur(dd) ? "b" + dblur(dd) : null }));
    });
    // Yera — carrier of the joke: always on his phone, never turns
    {
      const dd = 5.4, X = 0.18, base = pr(X, 0, dd), h = 1.78 * FOC / (dd - cam.cz);
      add(dd, person({ x: base[0], y: base[1], h, body: "#4E8F63", legs: "#283048", hair: "short", hairCol: "#24180f", headphones: true, t, seed: 21, headTilt: 6,
        face: { eyes: "down", mouth: 0, smile: 1.2, blush: 0.25 }, armL: { a1: 24, a2: 70 }, armR: { a1: 24, a2: 85, phone: true }, phoneGlow: 1 }));
      // name tag over him
      const tagY = base[1] - h - 46 + Math.sin(t * 3) * 4;
      add(dd - 0.001, `<g transform="translate(${f2(base[0])},${f2(tagY)})"><rect x="-58" y="-30" width="116" height="48" rx="14" fill="#7CE0A0" stroke="${INK}" stroke-width="4"/><text x="0" y="6" font-size="30" font-weight="900" fill="${INK}" text-anchor="middle">ЕРА</text><path d="M-10,18 L0,32 L10,18 Z" fill="#7CE0A0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="-9" y="14" width="18" height="6" fill="#7CE0A0"/></g>`);
    }
    // scripted speaker
    if (sc.line && sc.line.who === "walker") {
      const L = sc.line, k = eo(lt / 1.25), dd = lerp(9, 2.75, k), base = pr(-0.02, 0, dd), h = 1.75 * FOC / (dd - cam.cz);
      const spk = lt >= L.at && lt < L.at + L.dur, m = envAt(L.env, lt - L.at);
      const ears = sc.n === 5, cols = { 1: ["#3A78C8", "short", "#1d1d1d"], 5: ["#D64C8A", "long", "#3a2016"], 7: ["#E8A02A", "short", "#5a3a20"] }[sc.n];
      add(dd, person({ x: base[0], y: base[1], h, body: cols[0], hair: cols[1], hairCol: cols[2], t, seed: 31 + sc.n, walk: lt < 1.25 ? 1 : 0, phase: t * 7,
        face: { eyes: sc.n === 5 ? "squint" : "open", look: [1, -0.3], mouth: m * 0.8, brow: sc.n === 5 ? 1 : -0.5, smile: sc.n === 7 ? 2 : 0, blink: blinkAt(t, sc.n) },
        armL: ears ? { target: [-17, -82] } : null, armR: ears ? { target: [17, -82] } : sc.n === 7 && lt > L.at ? { a1: 160, a2: -30 } : null }));
    }
    // cracks
    if (sc.n >= 6) {
      const r = rng(sc.n * 3), grow = eo((sh.dt - 0.05) / 0.7) * (sc.n === 7 ? 1.3 : 1), o = pr(-0.5, 0, 1.25);
      let s = "";
      for (let k = 0; k < 9; k++) {
        let x = o[0] + (r() - 0.5) * 60, y = o[1], a = -Math.PI / 2 + (r() - 0.5) * 2.6; const pts = [[x, y]];
        for (let j = 0; j < 7; j++) { a += (r() - 0.5) * 0.9; const L = (40 + r() * 70) * grow; x += Math.cos(a) * L; y -= Math.sin(a) * L * 0.25 - 4 * grow; pts.push([x, y]); }
        s += `<polyline points="${P2(pts)}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${P2(pts)}" fill="none" stroke="#FF8A3A" stroke-width="2" opacity="${f2(lvl * 0.8)}"/>`;
      }
      add(1.3, s);
    }
    // shockwave rings on the ground (200 dB)
    if (sc.n === 7 && sh.dt > 0) {
      let s = ""; const c = pr(-0.5, 0, 1.25);
      for (let k = 0; k < 3; k++) { const u = sh.dt - k * 0.22; if (u <= 0) continue; const R = u * 1500, a = clamp(1 - u / 1.4); s += `<ellipse cx="${f2(c[0])}" cy="${f2(c[1] - 40)}" rx="${f2(R)}" ry="${f2(R * 0.32)}" fill="none" stroke="#FFF2D8" stroke-width="${f2(18 * a + 1)}" opacity="${f2(a)}"/>`; }
      add(1.2, `<g filter="url(#b2)">${s}</g>`);
    }
    // --- hero (action plane, sharp)
    const hero = heroState(sc, lt, t, sh);
    const hb = pr(-0.5, 0, 1.25), hh = 1.6 * FOC / (1.25 - cam.cz);
    add(1.25, heroSVG(hb[0], hb[1], hh, hero, t));
    // sound arcs from the mouth
    const mouth = [hb[0] + hh * 0.02, hb[1] - hh * 0.72];
    if (sh.on) {
      let s = "";
      for (let k = 0; k < 4; k++) { const u = ((sh.dt * 1.6 + k * 0.25) % 1), R = 70 + u * (260 + lvl * 520); s += `<path d="M${f2(mouth[0] + R * Math.cos(-0.7))},${f2(mouth[1] + R * Math.sin(-0.7))} A${f2(R)},${f2(R)} 0 0 1 ${f2(mouth[0] + R * Math.cos(0.55))},${f2(mouth[1] + R * Math.sin(0.55))}" fill="none" stroke="#FFFFFF" stroke-width="${f2(6 + lvl * 10)}" stroke-linecap="round" opacity="${f2((1 - u) * 0.85)}"/>`; }
      add(1.2, s);
    }
    // foreground props (blurred, near lens): lamp pole + leaves corner
    { const a = pr(roadL - 0.04, 0, 0.8), b = pr(roadL - 0.04, 3.0, 0.8); add(0.8, `<line x1="${f2(a[0])}" y1="${f2(a[1] + 200)}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="#1d1a22" stroke-width="56"/>`); }
    items.sort((a, b) => b.d - a.d);
    g += walls.reverse().join('');
    for (const it of items) g += wrapBlur(it.svg, it.d);
    // hero bubble (screen space over world)
    if (sh.dt >= 0) {
      const half = sh.dt < (sc.shout.on + (sc.shout.off - sc.shout.on) * 0.45);
      const txt = half ? "ЕРА…" : shoutText(lvl), size = Math.round(70 + lvl * 34), sc0 = back(sh.dt / 0.22) * (1 + (sh.on ? sh.env * 0.04 : 0));
      const shake = sh.on ? Math.sin(t * 61) * lvl * 6 : 0;
      g += bubble(470 + shake, 640 - lvl * 30, txt, size, lvl >= 0.3, { tail: [mouth[0] + 70, mouth[1] - 30], scale: sc0, rot: shake * 0.3, maxw: 560 });
    }
    // dust burst at the hero's feet for loud screams
    if (lvl > 0.4 && sh.dt > 0) {
      const r = rng(sc.n * 91); let s = "";
      for (let k = 0; k < 14; k++) { const u = clamp(sh.dt / 1.2), a = Math.PI + r() * Math.PI, R = u * (120 + r() * 260); s += `<circle cx="${f2(hb[0] + Math.cos(a) * R * 1.6)}" cy="${f2(hb[1] - 20 + Math.sin(a) * R * 0.4)}" r="${f2(20 + u * 40)}" fill="#E8DCC8" opacity="${f2((1 - u) * 0.55)}"/>`; }
      g += `<g filter="url(#b3)">${s}</g>`;
    }
    return { svg: g, mouth };
  }

  function heroState(sc, lt, t, sh) {
    const lvl = sc.lvl;
    const st = { mouth: 0, eyes: "open", brow: 0.8, lean: 0, sweat: 0, handsHead: lvl >= 0.45, squash: 1, blush: 0.4 + lvl * 0.4, look: [1, 0] };
    if (sh.pre > 0) { st.lean = -6 * sh.pre; st.squash = 1 - 0.04 * sh.pre; st.mouth = 0.15 * sh.pre; st.eyes = "open"; } // inhale (anticipation)
    if (sh.on) { st.mouth = 0.35 + sh.env * (0.5 + lvl * 0.3); st.lean = 4 + lvl * 6; st.squash = 1 + 0.035 * sh.env; st.eyes = lvl >= 0.3 ? "squint" : "open"; st.brow = 1.6; }
    else if (sh.dt > 0) { st.mouth = 0.05; st.eyes = "open"; st.brow = 0.6; st.look = [1, -0.2]; st.sweat = lvl > 0.5 ? 0.9 : 0; }
    st.blink = sh.on ? 0 : blinkAt(t, 1);
    st.shake = sh.on ? lvl * 5 : 0;
    return st;
  }
  function heroSVG(x, y, h, st, t, opt = {}) {
    const sx = st.shake ? Math.sin(t * 73) * st.shake : 0, sy = st.shake ? Math.cos(t * 59) * st.shake : 0;
    return `<g transform="translate(${f2(x + sx)},${f2(y + sy)}) scale(1,${f2(st.squash || 1)}) translate(${f2(-x)},${f2(-y)})">` + person({
      x, y, h, body: "#E8452F", legs: "#2B3350", hair: "tuft", hairCol: "#6B3E22", strings: true, t, seed: 1, lean: st.lean || 0, handsOverHead: st.handsHead,
      face: { eyes: st.eyes, brow: st.brow, mouth: st.mouth, look: st.look, sweat: st.sweat, blink: st.blink, blush: st.blush },
      armL: st.handsHead ? { target: [-20, -96] } : { a1: 16, a2: 18 }, armR: st.handsHead ? { target: [20, -96] } : { a1: 16, a2: 18 }, opacity: opt.opacity
    }) + `</g>`;
  }

  // ------------------------------------------------------------------ map (220 dB)
  const MAP = [];
  { const r = rng(808); for (let gx = -14; gx <= 14; gx++) for (let gy = -22; gy <= 22; gy++) { if (r() < 0.06) continue; MAP.push({ gx, gy, park: r() < 0.08, h: 0.3 + r(), c: r(), bang: r() < 0.22, sd: r() }); } }
  function renderMap(sc, lt, t) {
    const sh = shoutState(sc, lt), cx = 540, cy = 1080;
    const z = Math.exp(lerp(Math.log(3.4), Math.log(0.82), eio(lt / sc.dur * 1.05))), rot = lerp(6, -10, eio(lt / sc.dur));
    const R = sh.dt > 0 ? eo(sh.dt / 2.4) * 2600 : 0;
    let g = `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="#1B1E2B"/>`;
    let m = `<g transform="translate(${cx},${cy}) rotate(${f2(rot)}) scale(${f2(z)})">`;
    // river
    m += `<path d="M-1600,-500 C-600,-300 -300,300 400,260 S1400,700 1800,600" fill="none" stroke="#24406E" stroke-width="150"/><path d="M-1600,-500 C-600,-300 -300,300 400,260 S1400,700 1800,600" fill="none" stroke="#2F5590" stroke-width="90"/>`;
    const cell = 92;
    for (const b of MAP) {
      const x = b.gx * cell, y = b.gy * cell, dist = Math.hypot(x, y), heard = dist < R - b.sd * 60;
      if (Math.abs(y - (260 + x * 0.12)) < 70 && x > -600) continue; // keep the river open-ish
      if (b.park) { m += `<rect x="${x - 38}" y="${y - 38}" width="76" height="76" rx="10" fill="${heard ? "#3DDC84" : "#2D5A3E"}" opacity=".9"/>`; continue; }
      const col = heard ? mixc("#F5B83D", "#FFD36B", b.c) : mixc("#3A3F55", "#4A4F66", b.c), roof = heard ? "#FFF0B8" : "#5A607A";
      m += `<rect x="${x - 36}" y="${y - 30}" width="72" height="66" rx="6" fill="${mixc(col, "#000000", 0.35)}"/><rect x="${x - 36}" y="${y - 36}" width="72" height="62" rx="6" fill="${col}"/><rect x="${x - 26}" y="${y - 28}" width="52" height="20" rx="4" fill="${roof}" opacity=".5"/>`;
      if (heard && b.bang) { const u = clamp((R - dist) / 260); m += `<g transform="translate(${x},${y - 46 - u * 20}) scale(${f2(back(u) / Math.max(0.9, z))})"><circle r="22" fill="#E8312F" stroke="${INK}" stroke-width="4"/><text y="11" font-size="32" font-weight="900" fill="#fff" text-anchor="middle">!</text></g>`; }
    }
    // the wave: glow ring + dashed front
    if (R > 0) {
      m += `<circle r="${f2(R)}" fill="none" stroke="#F5B83D" stroke-width="${f2(60)}" opacity=".18" filter="url(#b6)"/>`;
      m += `<circle r="${f2(R)}" fill="none" stroke="#FFD36B" stroke-width="10" stroke-dasharray="40 26" stroke-dashoffset="${f2(-t * 120)}"/>`;
    }
    m += `</g>`;
    g += m;
    // hero pin (screen-space size) + bubble
    const pulse = 1 + 0.12 * Math.sin(t * 8);
    g += `<circle cx="${cx}" cy="${cy}" r="${f2(60 * pulse)}" fill="#E8312F" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="24" fill="#E8312F" stroke="#fff" stroke-width="7"/>`;
    g += `<g transform="translate(${cx - 26},${cy - 150})">${headIcon(52, "#E8452F", sh.on ? 0.8 : 0.1)}</g>`;
    if (sh.dt > 0) g += bubble(cx - 250, cy - 400, shoutText(sc.lvl), 74, true, { tail: [cx + 10, cy - 170], scale: back(sh.dt / 0.22) });
    // vignette tint
    return { svg: g, mouth: [cx, cy] };
  }
  function headIcon(r, body, mouth) {
    return person({ x: r * 0.5, y: r * 2.4, h: r * 2.6, body, hair: "tuft", hairCol: "#6B3E22", face: { eyes: mouth > 0.3 ? "squint" : "open", mouth, brow: 1.4 } });
  }

  // ------------------------------------------------------------------ earth (250 / 290 / 340)
  const STARS = []; { const r = rng(3); for (let i = 0; i < 260; i++) STARS.push([r() * 1400 - 160, r() * 2200 - 140, 0.6 + r() * 2.4, r()]); }
  const CONT = []; { const r = rng(44); for (let i = 0; i < 9; i++) { const cx = r() * 2 - 1, cy = r() * 1.6 - 0.8, pts = []; const n = 14, rad = 0.18 + r() * 0.24; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, rr = rad * (0.6 + r() * 0.6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); } CONT.push(pts); } }
  function smoothPath(pts, s = 1, ox = 0, oy = 0) {
    let d = ""; const n = pts.length; for (let i = 0; i < n; i++) { const p0 = pts[i], p1 = pts[(i + 1) % n], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2; d += (i ? " Q" : "M") + (i ? `${f2(ox + p0[0] * s)},${f2(oy + p0[1] * s)} ` : "") + `${f2(ox + mx * s)},${f2(oy + my * s)}`; }
    return d + " Z";
  }
  function spaceBG(t, par = 1) {
    let g = `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#spacebg)"/>`;
    g += `<circle cx="200" cy="500" r="520" fill="#6B2D8F" opacity=".22" filter="url(#b8)"/><circle cx="900" cy="1500" r="600" fill="#1E4A8F" opacity=".25" filter="url(#b8)"/>`;
    for (const s of STARS) { const tw = 0.55 + 0.45 * Math.sin(t * (1 + s[3] * 3) + s[3] * 20); g += `<circle cx="${f2(s[0] - t * 6 * s[2] * par)}" cy="${f2(s[1])}" r="${f2(s[2] * 0.75)}" fill="#fff" opacity="${f2(tw * (0.4 + s[3] * 0.6))}"/>`; }
    return g;
  }
  function earth(cx, cy, R, t, mode, lt, sh) {
    let g = "";
    const shake = sh.dt > 0 ? [0, 3, 9][mode] * Math.max(0, 1 - sh.dt / 3) : 0;
    cx += Math.sin(t * 53) * shake; cy += Math.cos(t * 47) * shake;
    g += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R + 34)}" fill="#4FA8FF" opacity=".28" filter="url(#b8)"/>`;
    g += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}" fill="url(#ocean)"/>`;
    g += `<clipPath id="eclip"><circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}"/></clipPath><g clip-path="url(#eclip)">`;
    const rotX = (t * 0.035) % 2;
    for (const off of [0, -2, 2]) for (const c of CONT) g += `<path d="${smoothPath(c.map(p => [p[0] + off + rotX, p[1]]), R, cx, cy)}" fill="#3FAE5E" stroke="#2B8A48" stroke-width="3"/>`;
    // clouds
    const r = rng(9);
    for (let i = 0; i < 14; i++) { const x = cx + ((r() * 2.4 - 1.2 + t * 0.05) % 2.4 - 1.2) * R, y = cy + (r() * 1.8 - 0.9) * R; g += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(R * (0.12 + r() * 0.16))}" ry="${f2(R * 0.04)}" fill="#fff" opacity=".55" filter="url(#b3)"/>`; }
    const yx = cx - R * 0.12, yy = cy + R * 0.18;
    if (mode === 0 && sh.dt > 0) for (let k = 0; k < 3; k++) { const u = sh.dt - k * 0.3; if (u <= 0) continue; const rr = u * R * 0.9; g += `<circle cx="${f2(yx)}" cy="${f2(yy)}" r="${f2(rr)}" fill="none" stroke="#FFFFFF" stroke-width="${f2(Math.max(2, 14 - u * 4))}" opacity="${f2(clamp(1 - u / 2.6))}"/>`; }
    if (mode === 2) {
      const rr = rng(13), grow = eo(sh.dt / 1.4);
      for (let k = 0; k < 16; k++) { let a = rr() * Math.PI * 2, x = yx, y = yy; const pts = [[x, y]]; for (let j = 0; j < 8; j++) { a += (rr() - 0.5) * 0.9; x += Math.cos(a) * R * 0.16 * grow; y += Math.sin(a) * R * 0.16 * grow; pts.push([x, y]); }
        g += `<polyline points="${P2(pts)}" fill="none" stroke="#FF7A1A" stroke-width="16" opacity=".7" filter="url(#b3)"/><polyline points="${P2(pts)}" fill="none" stroke="#FFE08A" stroke-width="5"/>`; }
    }
    g += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}" fill="url(#night)"/></g>`;
    g += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}" fill="none" stroke="#9AD8FF" stroke-width="5" opacity=".7"/>`;
    // "ТЫ" pin
    g += `<circle cx="${f2(yx)}" cy="${f2(yy)}" r="34" fill="#E8312F" opacity="${f2(0.3 + 0.2 * Math.sin(t * 8))}"/><circle cx="${f2(yx)}" cy="${f2(yy)}" r="15" fill="#E8312F" stroke="#fff" stroke-width="5"/>`;
    g += `<g transform="translate(${f2(yx)},${f2(yy - 44)})"><rect x="-44" y="-38" width="88" height="46" rx="14" fill="#fff" stroke="${INK}" stroke-width="4"/><text y="-4" font-size="30" font-weight="900" fill="${INK}" text-anchor="middle">ТЫ</text></g>`;
    return { svg: g, pin: [yx, yy], c: [cx, cy] };
  }
  function renderEarth(sc, lt, t) {
    const sh = shoutState(sc, lt), mode = sc.mode;
    let g = spaceBG(t);
    // sun with bloom
    g += `<circle cx="880" cy="560" r="300" fill="url(#sunS)"/><circle cx="880" cy="560" r="82" fill="#FFF1B0"/>`;
    // moon
    g += `<circle cx="${f2(170 + Math.sin(t * 0.3) * 10)}" cy="760" r="58" fill="#C9C6D6" stroke="${INK}" stroke-width="4"/><circle cx="150" cy="745" r="12" fill="#AAA6BC"/><circle cx="190" cy="780" r="8" fill="#AAA6BC"/>`;
    let zoom = 1, zc = [520, 1180];
    if (sc.n === 9) zoom = Math.exp(lerp(Math.log(5.5), 0, eio(lt / 0.9)));     // arrives from the map: we were the red dot
    const E = earth(520, 1180, 360, t, mode, lt, sh);
    let world = g + E.svg;
    if (mode === 1) world += internetDown(E, t, sh);
    if (mode === 2) world += starBlast(E, t, sh);
    // shout bubble from the pin
    if (sh.dt > 0) world += bubble(E.pin[0] - 120, E.pin[1] - 360, shoutText(1), 66, true, { tail: [E.pin[0], E.pin[1] - 90], scale: back(sh.dt / 0.22) });
    const pin = E.pin;
    const tf = `translate(${f2(pin[0])},${f2(pin[1])}) scale(${f2(zoom)}) translate(${f2(-pin[0])},${f2(-pin[1])})`;
    return { svg: `<g transform="${tf}">${world}</g>`, mouth: pin };
  }
  function internetDown(E, t, sh) {
    let g = ""; const [cx, cy] = E.c;
    // orbit back half, satellites, front half
    g += `<ellipse cx="${cx}" cy="${cy}" rx="520" ry="150" fill="none" stroke="#7FB2FF" stroke-opacity=".35" stroke-width="3" stroke-dasharray="10 12" transform="rotate(-18 ${cx} ${cy})"/>`;
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + t * 0.6, x = cx + Math.cos(a) * 520, y = cy + Math.sin(a) * 150, rx = cx + (x - cx) * Math.cos(-0.314) - (y - cy) * Math.sin(-0.314), ry = cy + (x - cx) * Math.sin(-0.314) + (y - cy) * Math.cos(-0.314);
      const dead = sh.dt > 0.3 + k * 0.22, col = dead ? "#FF4B4B" : "#2DE2FF";
      g += `<g transform="translate(${f2(rx)},${f2(ry)}) rotate(${f2(dead ? (sh.dt - 0.3) * 200 : 0)})"><rect x="-34" y="-8" width="24" height="16" fill="#3A6FD0" stroke="${INK}" stroke-width="3"/><rect x="10" y="-8" width="24" height="16" fill="#3A6FD0" stroke="${INK}" stroke-width="3"/><rect x="-10" y="-12" width="20" height="24" rx="4" fill="#D8D8E4" stroke="${INK}" stroke-width="3"/></g>`;
      g += `<g transform="translate(${f2(rx)},${f2(ry - 48)})">` + [0, 1, 2].map(j => `<path d="M${-10 - j * 8},${-j * 6} Q0,${-12 - j * 10} ${10 + j * 8},${-j * 6}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`).join("") + (dead ? `<path d="M-26,-34 L26,8 M26,-34 L-26,8" stroke="#FF4B4B" stroke-width="7" stroke-linecap="round"/>` : "") + `</g>`;
    }
    return g;
  }
  function starBlast(E, t, sh) {
    let g = ""; const [cx, cy] = E.c;
    for (let k = 0; k < 3; k++) { const u = sh.dt - k * 0.35; if (u <= 0) continue; const R = 380 + u * 520, a = clamp(1 - u / 2.2); g += `<circle cx="${cx}" cy="${cy}" r="${f2(R)}" fill="none" stroke="#FFB43A" stroke-width="${f2(30 * a)}" opacity="${f2(a)}" filter="url(#b3)"/>`; }
    const r = rng(5);
    for (let k = 0; k < 18; k++) { const u = clamp((sh.dt - 0.4) / 2.5), a = r() * Math.PI * 2, d = 360 + u * (200 + r() * 500), s = 10 + r() * 22; if (u <= 0) continue;
      g += `<polygon points="${P2([[0, -s], [s * 0.9, s * 0.4], [-s * 0.7, s * 0.8]])}" transform="translate(${f2(cx + Math.cos(a) * d)},${f2(cy + Math.sin(a) * d)}) rotate(${f2(u * 400 * (r() - 0.5))})" fill="#5A4A3A" stroke="#FF8A3A" stroke-width="3"/>`; }
    // heat tint
    g += `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="#FF5A1A" opacity="${f2(clamp(sh.dt / 2.6) * 0.25)}"/>`;
    return g;
  }

  // ------------------------------------------------------------------ space finale
  const SHARDS = []; { const r = rng(71); for (let i = 0; i < 34; i++) SHARDS.push({ x: r() * 1300 - 110, y: r() * 2000 - 40, s: 12 + r() * 36, a: r() * 6, va: (r() - 0.5) * 1.4, vx: (r() - 0.5) * 50, vy: (r() - 0.5) * 40, col: ["#3A6FD0", "#3DDC84", "#C9C6D6", "#5A4A3A", "#2DE2FF"][i % 5], z: r() }); }
  function renderSpace(sc, lt, t) {
    const sh = shoutState(sc, lt);
    let g = spaceBG(t, 0.5);
    // drifting Earth shards (back)
    for (const s of SHARDS) { if (s.z > 0.5) continue; g += shard(s, lt, 0.6); }
    // hero floats; turns toward phone after the call
    const call = lt - SP.call, ans = lt - SP.answer, hit = lt - SP.hit;
    const hx = 420 + Math.sin(lt * 0.5) * 30, hy = 1300 + Math.sin(lt * 0.8) * 26, rot = -16 + Math.sin(lt * 0.6) * 8 + (call > 0 ? eo(call / 0.6) * 14 : 0);
    const L = sc.line, yspk = lt - L.at;
    const st = { mouth: 0.05, eyes: "open", brow: 0.6, lean: rot, look: [1, 0], blink: blinkAt(t, 1), blush: 0.6, handsHead: false };
    if (sh.on) { st.mouth = 0.35 + sh.env * 0.6; st.eyes = "squint"; st.brow = 1.6; st.handsHead = true; }
    if (sh.dt > sc.shout.dur) { st.eyes = "open"; st.look = [0.6, -0.6]; st.brow = -0.6; }
    if (call > 0) { st.look = [1, 0.4]; st.eyes = "wide"; }
    if (yspk > 0) { st.sweat = 1; st.mouth = 0.12; st.brow = -1.2; }
    // camera: slow push, then the payoff close-up on the face
    const close = hit > 0 ? eo(hit / 0.18) : 0;
    const cz = lerp(1, 1.08, eio(lt / sc.dur)) * lerp(1, 2.7, close);
    const focus = [lerp(540, hx, close), lerp(1060, hy - 520, close)];
    let world = "";
    world += `<g transform="rotate(${f2(rot)} ${f2(hx)} ${f2(hy - 300)})">` + heroSVG(hx, hy, 640, Object.assign(st, { lean: 0 }), t) + `</g>`;
    // vacuum: the bubble appears, but the sound rings die instantly
    if (sh.dt > 0 && call < 0) {
      world += bubble(110, 640, "ЕРА ЛОХ!!!", 92, true, { tail: [hx + 40, hy - 470], scale: back(sh.dt / 0.22) });
      if (sh.on) for (let k = 0; k < 3; k++) { const u = (sh.dt * 2 + k * 0.33) % 1, R = 40 + u * 80; world += `<circle cx="${f2(hx + 20)}" cy="${f2(hy - 450)}" r="${f2(R)}" fill="none" stroke="#fff" stroke-width="4" opacity="${f2((1 - u) * 0.35)}" stroke-dasharray="6 10"/>`; }
      const mu = eo((sh.dt - 0.9) / 0.3);
      if (mu > 0) world += `<g transform="translate(860,640) scale(${f2(back((sh.dt - 0.9) / 0.3))})"><circle r="70" fill="#1C2340" stroke="#B58CFF" stroke-width="6"/><path d="M-30,-14 L-12,-14 L10,-34 L10,34 L-12,14 L-30,14 Z" fill="#E8E6F4"/><path d="M-44,-44 L44,44" stroke="#FF4B4B" stroke-width="12" stroke-linecap="round"/></g>`;
    }
    // shards front
    for (const s of SHARDS) { if (s.z <= 0.5) continue; world += shard(s, lt, 1); }
    // phone
    if (call > 0) world += phone(lt, call, ans, yspk, L, t);
    const scr = [lerp(focus[0], 540, close), lerp(focus[1], 1050, close)];
    const tf = `translate(${f2(scr[0])},${f2(scr[1])}) scale(${f2(cz)}) translate(${f2(-focus[0])},${f2(-focus[1])})`;
    g += `<g transform="${tf}">${world}</g>`;
    // payoff flash
    if (hit > 0 && hit < 0.25) g += `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="#fff" opacity="${f2(0.7 * (1 - hit / 0.25))}"/>`;
    return { svg: g, mouth: [hx, hy - 460] };
  }
  function shard(s, lt, k) {
    const x = s.x + s.vx * lt * k, y = s.y + s.vy * lt * k, a = s.a + s.va * lt;
    return `<polygon points="${P2([[0, -s.s], [s.s * 0.9, s.s * 0.5], [-s.s * 0.8, s.s * 0.7]])}" transform="translate(${f2(x)},${f2(y)}) rotate(${f2(a * 57)})" fill="${s.col}" stroke="${INK}" stroke-width="3" ${k < 1 ? 'filter="url(#b2)" opacity=".7"' : ""}/>`;
  }
  function phone(lt, call, ans, yspk, L, t) {
    const k = eo(call / 0.45), x = lerp(1250, 600, k), y = 1180, ring = ans < 0 ? Math.sin(t * 50) * 4 * (Math.floor(call * 2.4) % 2) : 0;
    let g = `<g transform="translate(${f2(x + ring)},${f2(y)}) rotate(${f2(-6 + ring * 0.5)})">`;
    g += `<rect x="-14" y="-14" width="448" height="868" rx="70" fill="#7CE0A0" opacity=".25" filter="url(#b6)"/>`;
    g += `<rect x="0" y="0" width="420" height="840" rx="62" fill="#111118" stroke="${INK}" stroke-width="6"/>`;
    g += `<rect x="14" y="14" width="392" height="812" rx="50" fill="url(#phonebg)"/>`;
    g += `<rect x="160" y="30" width="100" height="26" rx="13" fill="#000"/>`;
    const lab = ans < 0 ? "входящий вызов" : "00:0" + Math.min(9, Math.floor(ans + 0.5));
    g += `<text x="210" y="140" font-size="30" font-weight="600" fill="#C9D4F0" text-anchor="middle">${lab}</text>`;
    g += `<text x="210" y="208" font-size="72" font-weight="900" fill="#fff" text-anchor="middle">Ера</text>`;
    // avatar = Yera's head with headphones, lip-synced
    const m = yspk > 0 ? envAt(L.env, yspk) : 0;
    g += `<circle cx="210" cy="400" r="120" fill="#1C2340" stroke="#7CE0A0" stroke-width="6"/>`;
    if (yspk > 0) for (let j = 0; j < 3; j++) g += `<circle cx="210" cy="400" r="${f2(130 + j * 22 + m * 30)}" fill="none" stroke="#7CE0A0" stroke-width="4" opacity="${f2(m * (0.6 - j * 0.18))}"/>`;
    g += `<clipPath id="avc"><circle cx="210" cy="400" r="116"/></clipPath><g clip-path="url(#avc)">` + person({ x: 210, y: 690, h: 340, body: "#4E8F63", hair: "short", hairCol: "#24180f", headphones: true, face: { eyes: yspk > 0 ? "squint" : "open", brow: yspk > 0 ? 1.8 : 0, mouth: m * 0.9, blush: 0.5 } }) + `</g>`;
    // sound bars
    if (yspk > 0) { for (let j = 0; j < 9; j++) { const hh = 10 + envAt(L.env, yspk - j * 0.03) * 70; g += `<rect x="${f2(110 + j * 24)}" y="${f2(600 - hh / 2)}" width="12" height="${f2(hh)}" rx="6" fill="#7CE0A0"/>`; } }
    if (ans < 0) {
      g += `<circle cx="100" cy="720" r="52" fill="#FF4B4B"/><path d="M78,724 q22,-18 44,0" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>`;
      const pulse = 1 + 0.08 * Math.sin(t * 10);
      g += `<circle cx="320" cy="720" r="${f2(52 * pulse)}" fill="#3DDC84"/><path d="M298,716 q22,18 44,0" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>`;
      g += `<text x="100" y="808" font-size="24" font-weight="600" fill="#C9D4F0" text-anchor="middle">отклонить</text><text x="320" y="808" font-size="24" font-weight="600" fill="#C9D4F0" text-anchor="middle">ответить</text>`;
    } else {
      const press = ans < 0.15 ? 0.85 : 1;
      g += `<circle cx="210" cy="730" r="${f2(52 * press)}" fill="#FF4B4B"/><path d="M188,734 q22,-18 44,0" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    }
    return g + `</g>`;
  }

  // ------------------------------------------------------------------ HUD: dB plate, subtitles, vignette, grain
  function hud(sc, lt, t) {
    let g = "";
    // vignette
    g += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#vig)"/>`;
    const space = sc.kind === "space";
    // plate pop at the first scene and on space; number bump every scene
    const pop = sc.n === 1 || space ? back(lt / 0.3) : 1, bump = 1 + 0.08 * Math.max(0, spring(lt - 0.05, 2.4, 0.4));
    const x0 = 56, y0 = 236, w = W - 112;
    const prev = sc.n > 1 && !space ? SC[sc.n - 2].db : (space ? 340 : 60);
    const val = Math.round(lerp(prev, sc.db, eo(lt / (space ? 1.1 : 0.45))));
    const numCol = space ? "#B58CFF" : sc.db >= 180 ? "#FF4B4B" : sc.db >= 110 ? "#F5B83D" : "#F2C94C";
    const capLines = wrap(sc.cap, 42, w - 70), ph = 228 + capLines.length * 50;
    g += `<g transform="translate(${x0 + w / 2},${y0}) scale(${f2(pop)}) translate(${-(x0 + w / 2)},${-y0})">`;
    g += `<rect x="${x0 + 6}" y="${y0 + 10}" width="${w}" height="${ph}" rx="30" fill="rgba(0,0,0,.35)"/>`;
    g += `<rect x="${x0}" y="${y0}" width="${w}" height="${ph}" rx="30" fill="#1C2340" fill-opacity=".9" stroke="#3A4472" stroke-width="3"/>`;
    g += `<text x="${x0 + 36}" y="${y0 + 56}" font-size="30" font-weight="800" fill="#9AA6D8" letter-spacing="3">КРИК #${sc.n}</text>`;
    if (!space && sc.n > 1) { const tg = "КАЖДЫЙ РАЗ В 2 РАЗА ГРОМЧЕ", tww = tw(tg, 22, 800) + 32; g += `<rect x="${x0 + w - 36 - tww}" y="${y0 + 26}" width="${tww}" height="40" rx="12" fill="#E8403A"/><text x="${x0 + w - 36 - tww / 2}" y="${y0 + 54}" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">${tg}</text>`; }
    const nsz = 132, ns = String(val), nw = tw(ns, nsz);
    g += `<g transform="translate(${x0 + 30},${y0 + 182}) scale(${f2(bump)})"><text x="0" y="0" font-size="${nsz}" font-weight="900" fill="${numCol}" letter-spacing="-3">${ns}</text><text x="${f2(nw + 12)}" y="0" font-size="62" font-weight="900" fill="${numCol}">дБ</text></g>`;
    g += `<text x="${x0 + 36 + nw + 130}" y="${y0 + 132}" font-size="26" font-weight="800" fill="#E8E6F4" letter-spacing="1.5">${esc(sc.label)}</text>`;
    // loudness meter: 11 segments, filled to the current scream
    const segs = 11, mx = x0 + 36 + nw + 130, my = y0 + 150, sw = (w - (mx - x0) - 40) / segs;
    for (let i = 0; i < segs; i++) {
      const on = space ? false : i < sc.n, c = i < 3 ? "#3DDC84" : i < 7 ? "#F5B83D" : "#FF4B4B", cur = i === sc.n - 1 && !space;
      g += `<rect x="${f2(mx + i * sw)}" y="${f2(my - (cur ? 6 * Math.abs(Math.sin(t * 9)) : 0))}" width="${f2(sw - 6)}" height="34" rx="6" fill="${on ? c : "#2B3358"}" opacity="${on ? 1 : 0.8}"/>`;
    }
    const capIn = clamp(lt / 0.2);
    capLines.forEach((l, i) => g += `<text x="${x0 + 36}" y="${y0 + 258 + i * 50}" font-size="42" font-weight="800" fill="#fff" opacity="${f2(capIn)}">${esc(l)}</text>`);
    g += `</g>`;
    // subtitles (1–3 words, speaker colour, key words red)
    const L = sc.line;
    if (L) {
      const dt = lt - L.at; let cur = null;
      for (const c of L.subs) if (dt >= c[0] - 0.02) cur = c;
      if (cur && dt < L.off + 0.35) {
        const age = dt - cur[0], sz = 76, words = cur[1].split(" ");
        const who = { walker: "ПРОХОЖИЙ", grandma: "БАБУШКА", yera: "ЕРА" }[L.who] + (sc.n === 5 ? "" : "");
        const whoT = sc.n === 5 ? "ПРОХОЖАЯ" : who, s = 1 + 0.12 * Math.max(0, spring(age, 3, 0.45));
        let parts = "", total = tw(cur[1], sz);
        let x = -total / 2;
        for (const wd of words) { const key = /^ер[аеу]/i.test(wd) || /лох/i.test(wd) || /орёшь/i.test(wd); parts += `<text x="${f2(x)}" y="0" font-size="${sz}" font-weight="900" fill="${key ? "#FF4B4B" : L.color}" stroke="#0b0812" stroke-width="12" paint-order="stroke" stroke-linejoin="round">${esc(wd)}</text>`; x += tw(wd + " ", sz); }
        g += `<g transform="translate(540,1490) scale(${f2(s)})"><rect x="${f2(-tw(whoT, 24, 800) / 2 - 16)}" y="-120" width="${f2(tw(whoT, 24, 800) + 32)}" height="40" rx="12" fill="${L.color}"/><text x="0" y="-92" font-size="24" font-weight="800" fill="#0b0812" text-anchor="middle" letter-spacing="1.5">${whoT}</text>${parts}</g>`;
      }
    }
    // finale: «Часть 2»
    if (space && lt > SP.part2) {
      const u = lt - SP.part2, s = back(u / 0.3);
      g += `<g transform="translate(540,1500) scale(${f2(s)}) rotate(-3)"><rect x="-380" y="-110" width="760" height="190" rx="34" fill="#F5B83D" stroke="${INK}" stroke-width="8"/><text x="0" y="-20" font-size="84" font-weight="900" fill="${INK}" text-anchor="middle">ЧАСТЬ 2</text><text x="0" y="50" font-size="42" font-weight="800" fill="${INK}" text-anchor="middle">Ера отвечает. Скоро.</text></g>`;
    }
    // grain
    const gi = Math.floor(t * 24) % 4; g += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#gp${gi})" opacity=".09"/>`;
    return g;
  }

  // ------------------------------------------------------------------ defs
  const GRAIN = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"), im = x.createImageData(256, 256), r = rng(5); for (let i = 0; i < im.data.length; i += 4) { const v = Math.floor(r() * 255); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c.toDataURL(); })();
  const DEFS = (() => {
    let d = "<defs>";
    for (let i = 1; i <= 8; i++) d += `<filter id="b${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${i * (i > 5 ? 3 : 1.6)}"/></filter>`;
    for (let i = 0; i < 4; i++) d += `<pattern id="gp${i}" patternUnits="userSpaceOnUse" width="256" height="256" x="${i * 61}" y="${i * 97}"><image href="${GRAIN}" width="256" height="256"/></pattern>`;
    d += `<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>`;
    d += `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC8A0" stop-opacity="0"/><stop offset="1" stop-color="#FFC8A0" stop-opacity=".9"/></linearGradient>`;
    d += `<radialGradient id="lampglow"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset=".3" stop-color="#FFD36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFD36B" stop-opacity="0"/></radialGradient>`;
    d += `<radialGradient id="spacebg" cx=".5" cy=".4" r=".9"><stop offset="0" stop-color="#1A2547"/><stop offset=".6" stop-color="#0E1530"/><stop offset="1" stop-color="#080C1E"/></radialGradient>`;
    d += `<radialGradient id="sunS"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".3" stop-color="#FFD36B" stop-opacity=".8"/><stop offset=".65" stop-color="#FF9A3A" stop-opacity=".22"/><stop offset="1" stop-color="#FF9A3A" stop-opacity="0"/></radialGradient>`;
    d += `<radialGradient id="ocean" cx=".62" cy=".32" r=".85"><stop offset="0" stop-color="#4B9BF0"/><stop offset=".6" stop-color="#2560C2"/><stop offset="1" stop-color="#123A7A"/></radialGradient>`;
    d += `<linearGradient id="night" x1=".85" y1=".1" x2=".1" y2=".95"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#05081a" stop-opacity=".15"/><stop offset="1" stop-color="#05081a" stop-opacity=".72"/></linearGradient>`;
    d += `<linearGradient id="phonebg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#2A3A6E"/><stop offset=".5" stop-color="#1C2340"/><stop offset="1" stop-color="#0E1530"/></linearGradient>`;
    return d + "</defs>";
  })();

  // ------------------------------------------------------------------ transitions + frame
  function sceneAt(t) { for (let i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function renderScene(i, t) {
    const sc = SC[i], lt = t - sc.t0;
    return ({ street: renderStreet, map: renderMap, earth: renderEarth, space: renderSpace })[sc.kind](sc, lt, t);
  }
  const WIPE = 0.34;
  const world = document.getElementById("world"), hudEl = document.getElementById("hud");
  const camMoves = [], camAcc = [], camFocus = [];
  SC.forEach((s, i) => {
    const push = s.kind === "street" ? 0.045 : s.kind === "space" ? 0 : 0.03;
    camMoves.push([s.t0 + 0.001, 1.0], [s.t0 + s.dur - 0.002, 1 + push]);
    if (s.kind !== "space") camAcc.push([s.t0 + s.shout.at + 0.03, 0.02 + s.lvl * 0.035]);
    camFocus.push([s.t0 + 0.001, s.kind === "street" ? "40% 55%" : "50% 58%"]);
  });
  const cam = CAMLIFE.attach(document.getElementById("cam"), { drift: { x: 6, y: 5, rot: 0.35, seed: 4 }, moves: camMoves, accents: camAcc, focus: camFocus });

  function frame(t) {
    t = clamp(t, 0, TOTAL - 1e-4);
    const i = sceneAt(t), sc = SC[i], lt = t - sc.t0;
    let svg = DEFS;
    const cur = renderScene(i, t);
    if (i > 0 && lt < WIPE && sc.kind === "street") {
      // the sound wave of the previous scream wipes in the next one (circle from the hero's mouth)
      const prev = renderScene(i - 1, t), u = eio(lt / WIPE), R = u * 2300;
      svg += prev.svg + `<clipPath id="wipe"><circle cx="${f2(cur.mouth[0])}" cy="${f2(cur.mouth[1])}" r="${f2(R)}"/></clipPath><g clip-path="url(#wipe)">${cur.svg}</g>` +
        `<circle cx="${f2(cur.mouth[0])}" cy="${f2(cur.mouth[1])}" r="${f2(R)}" fill="none" stroke="#fff" stroke-width="${f2(36 * (1 - u) + 6)}" opacity=".9"/>`;
    } else svg += cur.svg;
    // cut flashes: map→earth already zooms; earth→earth & into space: white flash
    if (sc.kind === "earth" && sc.n > 9 && lt < 0.18) svg += `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="#fff" opacity="${f2(1 - lt / 0.18)}"/>`;
    if (sc.kind === "space" && lt < 0.6) svg += `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="#FFF6E0" opacity="${f2(1 - eo(lt / 0.6))}"/>`;
    if (sc.kind === "map" && lt < 0.25) svg += `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="#fff" opacity="${f2(0.8 * (1 - lt / 0.25))}"/>`;
    world.innerHTML = svg;
    hudEl.innerHTML = DEFS + hud(sc, lt, t);
    cam(t);
    // fade out at the very end
    document.getElementById("stage").style.filter = t > TOTAL - 0.35 ? `brightness(${f2(1 - (t - (TOTAL - 0.35)) / 0.35)})` : "";
  }
  window.__seek = frame;
  window.__audioWav = async () => SFX.toWavBase64(await SFX.render(D.EVENTS, TOTAL, { bed: D.BED, seed: 7 }));
  window.__ready = document.fonts ? document.fonts.ready : Promise.resolve();
  const q = new URLSearchParams(location.search);
  frame(q.has("t") ? +q.get("t") : 0);
})();
