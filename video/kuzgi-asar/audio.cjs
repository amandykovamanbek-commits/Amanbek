// node audio.cjs out.wav — music (D major, 100 BPM, dombyra-like plucks) + SFX on the same beat grid.
const fs = require('node:fs');
const TL = require('./src/timeline.json');
const out = process.argv[2] || 'brag-output/work/mix_raw.wav';
const SR = 48000, BEAT = 60 / TL.bpm, BAR = BEAT * 4, FPS = TL.fps;
const beats = TL.scenes.reduce((a, s) => a + s.beats, 0);
const bars = Math.ceil(beats / 4);
const DUR = beats * BEAT;
const N = Math.ceil((DUR + 0.2) * SR);
const L = new Float32Array(N), R = new Float32Array(N), REV = new Float32Array(N);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const put = (t0, arr, gain = 1, pan = 0, send = 0) => {
  const s0 = Math.round(t0 * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < arr.length; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; L[j] += arr[i] * gl * 1.414; R[j] += arr[i] * gr * 1.414; REV[j] += arr[i] * send; }
};
const gen = (len, fn) => { const a = new Float32Array(Math.round(len * SR)); for (let i = 0; i < a.length; i++) a[i] = fn(i / SR, i); return a; };

/* ---------- instruments ---------- */
const pluck = (m, len = 0.9, bright = 0.5) => { // Karplus-Strong
  const f = mtof(m), P = Math.max(2, Math.round(SR / f)), buf = new Float32Array(P);
  for (let i = 0; i < P; i++) buf[i] = rnd() * (0.5 + 0.5 * bright);
  let lp = 0; const a = new Float32Array(Math.round(len * SR));
  for (let i = 0; i < a.length; i++) {
    const k = i % P, nx = (k + 1) % P; const v = 0.5 * (buf[k] + buf[nx]) * 0.996; buf[k] = v;
    lp += 0.55 * (v - lp); a[i] = lp * Math.min(1, (len * SR - i) / 2000);
  }
  return a;
};
const kick = () => { let ph = 0; return gen(0.35, (t) => { ph += 2 * Math.PI * (45 + 90 * Math.exp(-t * 30)) / SR; return Math.sin(ph) * Math.exp(-t * 9) * (1 - Math.exp(-t * 900)); }); };
const clap = () => { let lp = 0, hp = 0; return gen(0.22, (t) => { const n = rnd(); lp += 0.35 * (n - lp); hp = n - lp; const env = (t < 0.03 ? (Math.floor(t / 0.01) % 2 ? 0.6 : 1) : 1) * Math.exp(-t * 22); return hp * env; }); };
const hat = (open) => { let prev = 0, lp = 0; return gen(open ? 0.14 : 0.05, (t) => { const n = rnd(); const h = n - prev; prev = n; lp += 0.45 * (h - lp); return lp * Math.exp(-t * (open ? 26 : 80)); }); };
const bass = (m, len) => { let ph = 0, lp = 0; const f = mtof(m); return gen(len, (t) => { ph += f / SR; const saw = 2 * (ph % 1) - 1; lp += 0.06 * (saw - lp); const env = Math.min(1, t * 200) * Math.exp(-t * 2.2) * Math.min(1, (len - t) * 40); return (lp * 0.8 + Math.sin(2 * Math.PI * f * t) * 0.6) * env; }); };
const pad = (ms, len) => gen(len, (t) => { const env = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.6); let v = 0; for (const m of ms) { const f = mtof(m); v += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 1.003 * t + 1) + 0.15 * Math.sin(4 * Math.PI * f * t); } return v * env / ms.length; });
const bell = (m, len = 1.6) => { const f = mtof(m); return gen(len, (t) => (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 12)) * Math.exp(-t * 3) * Math.min(1, t * 2000)); };
const whoosh = (len = 0.55) => { let lp = 0, lp2 = 0; return gen(len, (t) => { const k = t / len; const env = Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.15)), 2) * (k < 0.87 ? 1 : (1 - k) / 0.13); const c = 0.02 + 0.22 * Math.sin(Math.PI * k); lp += c * (rnd() - lp); lp2 += c * (lp - lp2); return lp2 * env * 2.2; }); };

/* ---------- music ---------- */
const CH = [ // pluck tones, bass, pad
  {p: [62, 66, 69, 74], b: 38, pad: [50, 57, 62, 66]},
  {p: [59, 62, 66, 71], b: 35, pad: [47, 54, 59, 62]},
  {p: [62, 67, 71, 74], b: 43, pad: [43, 50, 55, 59]},
  {p: [61, 64, 69, 73], b: 45, pad: [45, 52, 57, 61]},
];
const K = kick(), C = clap(), HC = hat(false), HO = hat(true);
for (let b = 0; b < bars; b++) {
  const t0 = b * BAR, ch = CH[b % 4], last = b === bars - 1, intro = false;
  put(t0, pad(ch.pad, BAR + 0.6), 0.05, 0, 0.4);
  if (last) { // final ring
    put(t0, pad(CH[0].pad, BAR), 0.06, 0, 0.5);
    [62, 66, 69, 74, 78].forEach((m, i) => put(t0 + i * 0.07, pluck(m, 2.2, 0.7), 0.16, (i - 2) * 0.25, 0.35));
    put(t0, K, 0.5); put(t0, bass(38, 2.2), 0.22);
    continue;
  }
  for (let q = 0; q < 4; q++) {
    const tb = t0 + q * BEAT;
    // dombyra gallop: 8th + two 16ths
    const tones = ch.p, top = q === 0 ? tones[3] : tones[(q + 1) % 3];
    put(tb, pluck(top, 0.8, 0.8), 0.15, -0.25, 0.25);
    put(tb + BEAT / 2, pluck(tones[1], 0.5, 0.4), 0.09, 0.2, 0.2);
    put(tb + BEAT * 3 / 4, pluck(tones[2], 0.5, 0.4), 0.08, 0.25, 0.2);
    if (intro) continue;
    if (q === 0 || q === 2) put(tb, K, 0.55);
    if (q === 3 && b % 2 === 1) put(tb + BEAT / 2, K, 0.35);
    if (q === 1 || q === 3) put(tb, C, 0.08, 0.05, 0.35);
    put(tb + BEAT / 2, HO, 0.035, 0.35); put(tb, HC, 0.02, -0.35);
    // bass: root on 1, root on and-of-2, fifth on 3
    if (q === 0) put(tb, bass(ch.b, BEAT * 1.4), 0.22);
    if (q === 1) put(tb + BEAT / 2, bass(ch.b, BEAT * 0.9), 0.18);
    if (q === 2) put(tb, bass(ch.b + 7, BEAT * 0.9), 0.17);
    if (q === 3) put(tb + BEAT / 2, bass(ch.b + 12, BEAT * 0.4), 0.1);
  }
}
// pentatonic bell motif over hook and outro
const motif = [[0, 74], [0.75, 76], [1.5, 78], [2, 81], [3, 78], [3.5, 76], [4, 74]];
for (const [bt, m] of motif) put(bt * BEAT, bell(m), 0.05, 0.15, 0.5);

/* ---------- SFX (cues from the same timeline) ---------- */
const PENTA = [74, 76, 78, 81, 83, 86];
let start = 0;
TL.scenes.forEach((s, si) => {
  const t0 = start * BEAT;
  if (si > 0) put(t0 - TL.wipe / FPS - 0.05, whoosh(0.55), 0.18, si % 2 ? 0.3 : -0.3, 0.3);
  let prevQ = -1;
  s.pops.forEach((f, k) => {
    const S16 = BEAT / 4, t = Math.round((t0 + f / FPS) / S16) * S16; // quantize to the 16th grid
    if (t <= prevQ + 1e-6) return; prevQ = t;
    put(t, pluck(PENTA[(k + si) % PENTA.length], 0.5, 0.9), 0.08, (k % 2 ? 0.3 : -0.3), 0.3);
  });
  start += s.beats;
});
// chime on the title and on the final quote
const chime = (t) => [74, 78, 81, 86].forEach((m, i) => put(t + i * 0.06, bell(m, 1.8), 0.05, (i - 1.5) * 0.3, 0.6));
chime((beats - TL.scenes[TL.scenes.length - 1].beats) * BEAT);

/* ---------- reverb (Schroeder) on send ---------- */
const comb = (x, d, g) => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] + (i >= d ? g * y[i - d] : 0); return y; };
const allp = (x, d, g) => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) { const xd = i >= d ? x[i - d] : 0, yd = i >= d ? y[i - d] : 0; y[i] = -g * x[i] + xd + g * yd; } return y; };
let lpr = 0; for (let i = 0; i < N; i++) { lpr += 0.3 * (REV[i] - lpr); REV[i] = lpr; }
const mkRev = (offs) => { const c = [1557, 1617, 1491, 1422].map((d) => comb(REV, d + offs, 0.8)); const s = new Float32Array(N); for (let i = 0; i < N; i++) s[i] = (c[0][i] + c[1][i] + c[2][i] + c[3][i]) / 4; return allp(allp(s, 225 + offs, 0.5), 556 + offs, 0.5); };
const RL = mkRev(0), RR = mkRev(23);

/* ---------- master ---------- */
const fadeIn = 0.05 * SR, fadeOut = 1.2 * SR, end = Math.round(DUR * SR);
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  let g = Math.min(1, i / fadeIn); if (i > end - fadeOut) g *= Math.max(0, (end - i) / fadeOut);
  const l = Math.tanh((L[i] + RL[i] * 0.35) * 1.1) * g, r = Math.tanh((R[i] + RR[i] * 0.35) * 1.1) * g;
  pcm.writeInt16LE(Math.round(l * 30000), i * 4); pcm.writeInt16LE(Math.round(r * 30000), i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([h, pcm]));
console.log('audio', DUR.toFixed(2), 's ->', out);
