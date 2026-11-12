// node audio.cjs cues.json audio/  -> music.wav (with tape-stop at pauses) + sfx.wav (sfx + ambience), stereo 48 kHz
const fs = require('node:fs');
const path = require('node:path');
const [inp, outDir] = process.argv.slice(2);
const CUE = JSON.parse(fs.readFileSync(inp, 'utf8'));
const SR = 48000, DUR = CUE.duration + 1.5, N = Math.ceil(DUR * SR);
const TAU = Math.PI * 2;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function buf() { return [new Float32Array(N), new Float32Array(N)]; }
function addTo(B, t0, len, fn, pan = 0, gain = 1) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR), gl = Math.cos((pan + 1) * Math.PI / 4) * gain * 1.41, gr = Math.sin((pan + 1) * Math.PI / 4) * gain * 1.41;
  for (let i = 0; i < n; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; const v = fn(i / SR, i); B[0][j] += v * gl; B[1][j] += v * gr; }
}
const sec = id => CUE.sections.find(s => s.id === id).t;
const secEnd = id => { const i = CUE.sections.findIndex(s => s.id === id); return i < CUE.sections.length - 1 ? CUE.sections[i + 1].t : CUE.duration; };

// ---------------------------------------------------------------- instruments
function pluck(B, t0, f, dur = .5, vel = .2, pan = 0) {
  addTo(B, t0, dur + .3, t => { const e = Math.min(1, t * 400) * Math.exp(-t * 7); return (Math.sin(TAU * f * t) + .45 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 6) + .18 * Math.sin(TAU * 3 * f * t) * Math.exp(-t * 12)) * e * vel; }, pan);
}
function piano(B, t0, f, dur = 1.6, vel = .18, pan = 0) {
  addTo(B, t0, dur + .6, t => {
    const rel = t > dur ? Math.exp(-(t - dur) * 8) : 1;
    const e = Math.min(1, t * 300) * (Math.exp(-t * 2.2) * .7 + Math.exp(-t * .6) * .3) * rel;
    let v = 0; const H = [1, .5, .28, .16, .08, .05];
    for (let h = 0; h < H.length; h++) v += H[h] * Math.sin(TAU * f * (h + 1) * (1 + .0004 * h * h) * t) * Math.exp(-t * (1 + h * 1.4));
    return v * e * vel;
  }, pan);
}
function pad(B, t0, dur, notes, vel = .05, bright = .06) {
  const att = Math.min(.8, dur * .3), rel = .9;
  notes.forEach((m, k) => {
    [-1, 1].forEach(side => {
      const f = mtof(m) * (1 + side * .0035); let ph = Math.random(), lp = 0;
      addTo(B, t0, dur + rel, t => {
        ph += f / SR; const saw = 2 * (ph % 1) - 1; lp += bright * (saw - lp);
        const e = Math.min(1, t / att) * (t > dur ? Math.exp(-(t - dur) * 4) : 1);
        return lp * e * vel;
      }, side * .6);
    });
  });
}
function bass(B, t0, f, dur = .4, vel = .3) {
  addTo(B, t0, dur + .05, t => { const e = Math.min(1, t * 200) * Math.exp(-t * 3) * (t > dur ? Math.exp(-(t - dur) * 60) : 1); return (Math.sin(TAU * f * t) + .25 * Math.tanh(4 * Math.sin(TAU * f * t))) * e * vel; });
}
function kick(B, t0, vel = .6) { let ph = 0; addTo(B, t0, .35, t => { ph += TAU * (45 + 90 * Math.exp(-t * 30)) / SR; return Math.sin(ph) * Math.exp(-t * 9) * vel; }); }
function snare(B, t0, vel = .25) { let lp = 0; addTo(B, t0, .22, t => { const n = rnd(); lp += .5 * (n - lp); return ((n - lp) * .9 + Math.sin(TAU * 190 * t) * .4) * Math.exp(-t * 18) * vel; }); }
function hat(B, t0, vel = .06, pan = .3) { let lp = 0; addTo(B, t0, .06, t => { const n = rnd(); lp += .7 * (n - lp); return (n - lp) * Math.exp(-t * 70) * vel; }, pan); }
function clap(B, t0, vel = .18) { let lp = 0; addTo(B, t0, .2, t => { const n = rnd(); lp += .4 * (n - lp); const env = (t < .03 ? (Math.sin(t * 600) > 0 ? 1 : .3) : Math.exp(-(t - .03) * 20)); return (n - lp) * env * vel; }); }

// ---------------------------------------------------------------- MUSIC
const M = buf();
const CH = { Am: [57, 60, 64], C: [48 + 12, 64, 67], G: [55, 59, 62], F: [53, 57, 60], Em: [52, 55, 59], Dm: [50, 53, 57] };
const ROOT = { Am: 45, C: 48, G: 43, F: 41, Em: 40, Dm: 38 };
// A: intro (s1) mysterious 96 bpm
(function () {
  const t0 = 0.0, t1 = sec('s2'), bpm = 96, b = 60 / bpm, prog = ['Am', 'F', 'C', 'G'];
  for (let bar = 0; t0 + bar * 4 * b < t1; bar++) {
    const ch = prog[bar % 4], bt = t0 + bar * 4 * b;
    pad(M, bt, 4 * b, CH[ch].map(x => x), .03, .05);
    for (let i = 0; i < 16; i++) { const t = bt + i * b / 4; if (t >= t1) break; const n = CH[ch][[0, 1, 2, 1][i % 4]] + 12 + (i % 8 >= 4 ? 12 : 0); pluck(M, t, mtof(n), .25, .07, i % 2 ? .4 : -.4); }
    bass(M, bt, mtof(ROOT[ch]), 4 * b * .9, .22);
  }
})();
// B: playful (s2..s6) 112 bpm
(function () {
  const t0 = sec('s2'), t1 = sec('s7'), bpm = 112, b = 60 / bpm, prog = ['C', 'G', 'Am', 'F'];
  const mel = [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 76, 74, 72, 69, 67];
  for (let bar = 0; t0 + bar * 4 * b < t1; bar++) {
    const ch = prog[bar % 4], bt = t0 + bar * 4 * b;
    pad(M, bt, 4 * b, CH[ch], .022, .06);
    for (let q = 0; q < 4; q++) {
      const t = bt + q * b; if (t >= t1) break;
      if (bar > 0) { kick(M, t, q % 2 ? .25 : .5); if (q % 2) clap(M, t, .14); hat(M, t + b / 2, .05); hat(M, t, .03, -.3); }
      bass(M, t, mtof(ROOT[ch] + (q === 3 ? 7 : 0)), b * .7, .24);
      const n = mel[(bar % 4) * 4 + q]; if (bar % 2 === 1 || q % 2 === 0) pluck(M, t + (q === 1 ? b / 2 : 0), mtof(n), .3, .085, .2);
    }
  }
})();
// C: sad (s7..s9) 80 bpm piano
(function () {
  const t0 = sec('s7'), t1 = sec('s10'), bpm = 80, b = 60 / bpm, prog = ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'Em'];
  const top = [76, 72, 72, 71, 76, 77, 74, 71];
  for (let bar = 0; t0 + bar * 4 * b < t1; bar++) {
    const ch = prog[bar % 8], bt = t0 + bar * 4 * b;
    pad(M, bt, 4 * b, CH[ch], .025, .04);
    piano(M, bt, mtof(ROOT[ch]), 4 * b, .16);
    [0, 1, 2, 3].forEach(q => { const t = bt + q * b; if (t < t1) piano(M, t, mtof(CH[ch][q % 3] + 12), b * 1.4, .07, q % 2 ? .35 : -.35); });
    piano(M, bt + b * 2, mtof(top[bar % 8]), b * 2, .09, .1);
  }
})();
// D: tension (s10) pulsing
(function () {
  const t0 = sec('s10'), t1 = sec('s11') + .4, bpm = 120, b = 60 / bpm;
  for (let i = 0; t0 + i * b / 2 < t1; i++) {
    const t = t0 + i * b / 2, k = (t - t0) / (t1 - t0);
    bass(M, t, mtof(33), b * .35, .2 + .15 * k);
    if (i % 2 === 0) pluck(M, t, mtof(69 + (i % 8 === 6 ? 3 : 0)), .2, .04 + .05 * k, .3);
    if (k > .55 && i % 2 === 0) kick(M, t, .35);
  }
  pad(M, t0, t1 - t0, [45, 52, 57, 60], .03, .03);
  // riser
  let ph = 0; addTo(M, t1 - 3.2, 3.2, t => { const k = t / 3.2; ph += TAU * (200 + 1400 * k * k) / SR; return (Math.sin(ph) * .3 + rnd() * .4 * k) * k * k * .12; });
})();
// F: hope (s12..end) 84 bpm
(function () {
  const t0 = sec('s12'), t1 = CUE.duration + .5, bpm = 84, b = 60 / bpm, prog = ['F', 'C', 'G', 'Am', 'F', 'C', 'G', 'C'];
  const top = [72, 72, 74, 76, 77, 76, 74, 72];
  for (let bar = 0; t0 + bar * 4 * b < t1; bar++) {
    const ch = prog[bar % 8], bt = t0 + bar * 4 * b, k = Math.min(1, bar / 4);
    const last = t0 + (bar + 1) * 4 * b >= t1;
    pad(M, bt, last ? 3.5 : 4 * b, CH[ch].concat([CH[ch][0] + 12]), .03 + .02 * k, .05 + .04 * k);
    piano(M, bt, mtof(ROOT[ch]), 4 * b, .17);
    for (let e = 0; e < 8; e++) { const t = bt + e * b / 2; if (t < t1 - .2) piano(M, t, mtof(CH[ch][[0, 1, 2, 1][e % 4]] + 12), b, .05, e % 2 ? .4 : -.4); }
    piano(M, bt, mtof(top[bar % 8]), b * 2.5, .1, .1); piano(M, bt + 2.5 * b, mtof(top[(bar + 1) % 8] - 2), b * 1.5, .07, .1);
    if (bar >= 2 && !last) for (let q = 0; q < 4; q++) { kick(M, bt + q * b, q % 2 ? .18 : .32); if (q % 2) snare(M, bt + q * b, .08); }
  }
})();
// tape-stop / mute at pauses; duck during slow-mo
function musicGainWarp() {
  const out = buf();
  const P = CUE.pauses, S = CUE.slow;
  for (let i = 0; i < N; i++) {
    const t = i / SR; let src = t, g = 1;
    for (const [a, b] of P) {
      if (t >= a && t < b) { const d = t - a; if (d < .35) { src = a + d - d * d / .7; g = 1 - d / .35; } else g = 0; }
      if (t >= b && t < b + .25) g = Math.min(g, (t - b) / .25);
    }
    for (const [a, b] of S) if (t > a && t < b) g *= .45;
    const fi = src * SR, j = Math.floor(fi), fr = fi - j;
    if (j + 1 < N && g > 0) { out[0][i] = (M[0][j] * (1 - fr) + M[0][j + 1] * fr) * g; out[1][i] = (M[1][j] * (1 - fr) + M[1][j + 1] * fr) * g; }
  }
  return out;
}
const MW = musicGainWarp();

// ---------------------------------------------------------------- SFX
const F = buf();
const tone = (f, t) => Math.sin(TAU * f * t);
function noiseLP(a) { let lp = 0; return () => (lp += a * (rnd() - lp)); }
const SFX = {
  freeze: t0 => { // reverse suck + impact + glass shimmer + sub
    let lp = 0; addTo(F, t0 - .45, .47, t => { const k = t / .47; lp += (.02 + .5 * k) * (rnd() - lp); return lp * k * k * .9; });
    let ph = 0; addTo(F, t0, 1.2, t => { ph += TAU * (70 * Math.exp(-t * 2.5) + 28) / SR; return Math.sin(ph) * Math.exp(-t * 3.5) * .3; });
    [2093, 2637, 3136, 4186, 5274].forEach((f, k) => addTo(F, t0 + k * .015, 1.8, t => tone(f * (1 + .002 * Math.sin(t * 30)), t) * Math.exp(-t * (2.2 + k * .4)) * .045, k % 2 ? .5 : -.5));
  },
  unfreeze: t0 => { let lp = 0; addTo(F, t0, .6, t => { const k = t / .6; lp += (.5 - .45 * k) * (rnd() - lp); return lp * (1 - k) ** 2 * .7; }); let ph = 0; addTo(F, t0, .4, t => { ph += TAU * (60 + 400 * t) / SR; return Math.sin(ph) * Math.exp(-t * 6) * .3; }); },
  click: t0 => { addTo(F, t0, .03, t => (rnd() * .6 + tone(3800, t)) * Math.exp(-t * 260) * .35); addTo(F, t0 + .05, .04, t => (rnd() * .4 + tone(2600, t)) * Math.exp(-t * 200) * .25); },
  knock: t0 => { let ph = 0; addTo(F, t0, .2, t => { ph += TAU * (300 - 500 * t) / SR; return Math.sin(ph) * Math.exp(-t * 25) * .3 + rnd() * Math.exp(-t * 90) * .1; }); },
  whoosh: t0 => { let lp = 0; addTo(F, t0 - .1, .5, t => { const k = t / .5, env = Math.sin(Math.PI * k) ** 2; lp += (.03 + .3 * env) * (rnd() - lp); return lp * env * .55; }, .2); },
  swell: t0 => { let lp = 0; addTo(F, t0 - .4, .9, t => { const k = t / .9, env = Math.sin(Math.PI * k); lp += .05 * (rnd() - lp); return (lp * 1.5 + tone(110, t) * .1) * env * .5; }); },
  pop: t0 => { let ph = 0; addTo(F, t0, .1, t => { ph += TAU * (900 - 5000 * t) / SR; return Math.sin(ph) * Math.exp(-t * 40) * .28; }); },
  grab: t0 => { addTo(F, t0, .12, t => rnd() * Math.exp(-t * 50) * .2); SFX.sparkle(t0 + .05, .5); },
  catland: t0 => { let ph = 0; addTo(F, t0, .2, t => { ph += TAU * (120 - 200 * t) / SR; return Math.sin(ph) * Math.exp(-t * 20) * .3; }); },
  stamp: t0 => { let ph = 0; addTo(F, t0, .5, t => { ph += TAU * (90 - 120 * t) / SR; return Math.sin(ph) * Math.exp(-t * 8) * .5 + rnd() * Math.exp(-t * 60) * .15; }); },
  steps: t0 => { for (let i = 0; i < 9; i++) { let ph = 0; addTo(F, t0 + i * .2, .1, t => { ph += TAU * (160 - 400 * t) / SR; return (Math.sin(ph) * .4 + rnd() * .3) * Math.exp(-t * 40) * .25; }, i % 2 ? .2 : -.2); } },
  doors: t0 => { const n = noiseLP(.6); addTo(F, t0, .7, t => n() * Math.min(1, t * 20) * Math.exp(-t * 3) * .25, .3); let ph = 0; addTo(F, t0 + .75, .2, t => { ph += TAU * (110 - 100 * t) / SR; return Math.sin(ph) * Math.exp(-t * 20) * .3; }); },
  busgo: t0 => { let ph = 0; const n = noiseLP(.05); addTo(F, t0, 2.2, t => { const k = t / 2.2; ph += TAU * (45 + 50 * k) / SR; return (Math.tanh(3 * Math.sin(ph)) * .15 + n() * .4) * Math.sin(Math.PI * k) * .5; }, .4); },
  scribble: t0 => { const n = noiseLP(.4); addTo(F, t0, .7, t => n() * (.5 + .5 * Math.sin(t * 60)) * .12); },
  sparkle: (t0, v = 1) => { for (let k = 0; k < 6; k++) { const f = 2400 + k * 380; addTo(F, t0 + k * .045, .4, t => tone(f, t) * Math.exp(-t * 12) * .05 * v, k % 2 ? .4 : -.4); } },
  kick: t0 => { let ph = 0; addTo(F, t0, .2, t => { ph += TAU * (180 - 600 * t) / SR; return Math.sin(ph) * Math.exp(-t * 22) * .45 + rnd() * Math.exp(-t * 80) * .2; }, -.5); },
  catch: t0 => { addTo(F, t0, .12, t => rnd() * Math.exp(-t * 45) * .35); let ph = 0; addTo(F, t0, .15, t => { ph += TAU * (220 - 400 * t) / SR; return Math.sin(ph) * Math.exp(-t * 30) * .3; }); },
  error: t0 => { addTo(F, t0, .14, t => Math.sign(tone(440, t)) * .07 * Math.min(1, t * 300)); addTo(F, t0 + .17, .26, t => Math.sign(tone(311, t)) * .07 * Math.min(1, t * 300) * Math.exp(-t * 4)); },
  splat: t0 => { const n = noiseLP(.3); addTo(F, t0, .35, t => n() * Math.exp(-t * 12) * .8); let ph = 0; addTo(F, t0, .3, t => { ph += TAU * (90 - 100 * t) / SR; return Math.sin(ph) * Math.exp(-t * 14) * .45; }); },
  flip: t0 => { addTo(F, t0, .03, t => rnd() * Math.exp(-t * 300) * .3); addTo(F, t0 + .04, .03, t => rnd() * Math.exp(-t * 300) * .2); },
  burn: t0 => { const n = noiseLP(.7); addTo(F, t0, 1.0, t => n() * (rnd() > .97 ? 1 : .15) * Math.exp(-t * 3) * .5, .2); let lp = 0; addTo(F, t0, .8, t => { lp += .2 * (rnd() - lp); return lp * Math.exp(-t * 4) * .3; }); },
  boom: t0 => { let ph = 0; addTo(F, t0, 1.6, t => { ph += TAU * (55 * Math.exp(-t * 1.5) + 30) / SR; return Math.sin(ph) * Math.exp(-t * 2.5) * .32; }); const n = noiseLP(.08); addTo(F, t0, 1.2, t => n() * Math.exp(-t * 3) * .12); },
  bounce: t0 => { [0, .45, .8, 1.05].forEach((d, i) => { let ph = 0; addTo(F, t0 + d, .15, t => { ph += TAU * (200 - 300 * t) / SR; return Math.sin(ph) * Math.exp(-t * 25) * (.35 - i * .07); }, -.3); }); },
  carapproach: t0 => { let ph = 0; const n = noiseLP(.04); addTo(F, t0 - 1.6, 2.0, t => { const k = t / 2.0; ph += TAU * (60 + 50 * k) / SR; return (Math.tanh(2 * Math.sin(ph)) * .2 + n() * .9) * k * k * .22; }, .6); },
  horn: t0 => addTo(F, t0, .55, t => (Math.tanh(3 * tone(392, t)) * .5 + Math.tanh(3 * tone(494, t)) * .5) * Math.min(1, t * 50) * (t > .5 ? 0 : 1) * .05, .5),
  tickbig: t0 => { addTo(F, t0, .06, t => (tone(1800, t) + rnd() * .5) * Math.exp(-t * 90) * .35); let ph = 0; addTo(F, t0, .5, t => { ph += TAU * 55 / SR; return Math.sin(ph) * Math.exp(-t * 7) * .35; }); },
  screech: t0 => { let ph = 0; addTo(F, t0, 1.4, t => { ph += TAU * (1900 + 220 * Math.sin(t * 37) + 160 * Math.sin(t * 91)) / SR; const k = t / 1.4; return (Math.sin(ph) * .5 + rnd() * .25) * Math.min(1, t * 20) * (1 - k) * .22; }, -.2); },
  carpass: t0 => { let ph = 0; const n = noiseLP(.08); addTo(F, t0, 1.3, t => { const k = t / 1.3, env = Math.exp(-((k - .3) ** 2) / .03); ph += TAU * (110 - 50 * k) / SR; return (n() * 1.4 + Math.tanh(2 * Math.sin(ph)) * .3) * env * .6; }); const s = noiseLP(.5); addTo(F, t0 + .1, .9, t => s() * Math.exp(-t * 4) * .35, .3); },
  chime: t0 => [1047, 1319, 1568, 2093].forEach((f, i) => addTo(F, t0 + i * .06, 1.4, t => (tone(f, t) + .3 * tone(2 * f, t)) * Math.exp(-t * 3) * .06, i % 2 ? .3 : -.3)),
};
for (const e of CUE.events) (SFX[e.k] || SFX.pop)(e.t);
// ticking clock during every pause, heartbeat during the long one
CUE.pauses.forEach(([a, b], idx) => {
  for (let t = a + .5, k = 0; t < b - .1; t += .5, k++) addTo(F, t, .05, x => (tone(k % 2 ? 2400 : 1900, x) + rnd() * .4) * Math.exp(-x * 120) * .12, k % 2 ? .25 : -.25);
  if (b - a > 4) for (let t = a + .3; t < b - .2; t += .86) { [0, .16].forEach((d, j) => { let ph = 0; addTo(F, t + d, .25, x => { ph += TAU * (58 - 20 * x) / SR; return Math.sin(ph) * Math.exp(-x * 16) * (j ? .14 : .2); }); }); }
  // high frozen drone
  addTo(F, a, b - a, x => (tone(1760, x) * .5 + tone(2637, x) * .3) * Math.min(1, x * 2) * Math.min(1, (b - a - x) * 4) * .006);
});
// ambience: city (s1 before freeze, s7), rain (crossing; silent while frozen)
function pauseAmt(t) { let v = 0; for (const [a, b] of CUE.pauses) if (t >= a && t < b + .3) v = Math.max(v, Math.min(clamp((t - a) / .08), 1 - clamp((t - b) / .3))); return v; }
(function () {
  const n1 = noiseLP(.03), n2 = noiseLP(.25), n3 = noiseLP(.6);
  const city = [[0, CUE.pauses[0][0]], [sec('s7'), sec('s8')]], yard = [[sec('s6'), sec('s7')], [sec('s8'), sec('s9')]];
  const [r0, r1] = CUE.rain;
  for (let i = 0; i < N; i++) {
    const t = i / SR, fz = 1 - pauseAmt(t);
    let v = 0, w = 0;
    for (const [a, b] of city) if (t >= a && t < b) v += n1() * .22 * Math.min(1, (t - a) * 3, (b - t) * 6);
    for (const [a, b] of yard) if (t >= a && t < b) v += n1() * .12 * Math.min(1, (t - a) * 3, (b - t) * 6);
    if (t >= r0 - .6 && t < r1 + 1) { const e = Math.min(1, (t - r0 + .6) / .8); const a = n2(), c = n3(); v += (a * .14 + (c - a) * .13) * e; w = c * .25 * e * (rnd() > .9993 ? 4 : 1); }
    v *= fz; w *= fz;
    F[0][i] += v * .9 + w; F[1][i] += v * .9 - w;
  }
})();

// ---------------------------------------------------------------- write
function writeWav(file, B, gain = 1) {
  let pk = 0; for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(B[c][i] * gain));
  const pcm = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) for (let c = 0; c < 2; c++) pcm.writeInt16LE(Math.round(Math.tanh(B[c][i] * gain) * 32000), (i * 2 + c) * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
  console.log(path.basename(file), 'peak', pk.toFixed(2));
}
writeWav(path.join(outDir, 'music.wav'), MW, .9);
writeWav(path.join(outDir, 'sfx.wav'), F, .9);
