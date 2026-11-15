// node music.cjs <duration_s> out.wav [bpm]  -> light upbeat bed in A minor (Am F C G), beat grid from t=0
const fs = require('node:fs');
const [durS, out, bpmS] = process.argv.slice(2);
const dur = +durS, BPM = +(bpmS || 110), B = 60 / BPM, SR = 48000, N = Math.ceil((dur + .5) * SR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const add = (t0, len, fn, pan = 0) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < len * SR; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; const v = fn(i / SR); L[j] += v * (1 - pan); R[j] += v * (1 + pan); } };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const CH = [[45, [57, 60, 64]], [41, [57, 60, 65]], [48, [55, 60, 64]], [43, [55, 59, 62]]]; // Am F C G
const bars = Math.ceil(dur / (4 * B));
for (let bar = 0; bar < bars; bar++) {
  const [root, tri] = CH[bar % 4], t0 = bar * 4 * B, intro = bar === 0;
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * B;
    // kick on 1 & 3 (+ pickup)
    if (!intro && (b === 0 || b === 2)) { let ph = 0; add(tb, .35, t => { ph += 2 * Math.PI * (45 + 90 * Math.exp(-t * 30)) / SR; return Math.sin(ph) * Math.exp(-t * 9) * .55; }); }
    // clap on 2 & 4
    if (!intro && (b === 1 || b === 3)) { let hp = 0, pv = 0; add(tb, .18, t => { const n = rnd(); hp = .7 * (hp + n - pv); pv = n; return hp * Math.exp(-t * 28) * .16; }); }
    // hats on 8ths
    for (let e = 0; e < 2; e++) { let pv = 0; add(tb + e * B / 2, .05, t => { const n = rnd(), h = n - pv; pv = n; return h * Math.exp(-t * 90) * (e ? .06 : .035); }, e ? .3 : -.3); }
    // bass 8th pulse
    if (!intro) for (let e = 0; e < 2; e++) { const f = hz(root - (e && b === 3 ? -7 : 0)); let ph = 0, lp = 0; add(tb + e * B / 2, B / 2 * .9, t => { ph += f / SR; const saw = 2 * (ph % 1) - 1; lp += .08 * (saw - lp); return lp * .32 * Math.min(1, t * 200) * Math.exp(-t * 3); }); }
    // pluck chord on the off-beat
    tri.forEach((m, i) => { const f = hz(m + 12); add(tb + B / 2 + i * .012, .5, t => (Math.sin(2 * Math.PI * f * t) + .25 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 9) * .045, (i - 1) * .4); });
  }
  // soft pad under the bar
  tri.forEach((m, i) => { const f = hz(m); add(t0, 4 * B, t => { const env = Math.min(1, t * 2) * Math.min(1, (4 * B - t) * 3); return (Math.sin(2 * Math.PI * f * t) + .5 * Math.sin(2 * Math.PI * f * 1.003 * t)) * env * .022; }, (i - 1) * .5); });
  // little melody hook every other bar (pentatonic)
  if (bar % 2 === 1) [[0, 76], [.5, 79], [1, 81], [1.5, 79], [2.5, 76], [3, 74]].forEach(([o, m]) => { const f = hz(m); add(t0 + o * B, .35, t => (Math.sin(2 * Math.PI * f * t) * .7 + Math.sin(6 * Math.PI * f * t) * .08) * Math.exp(-t * 7) * .05, .2); });
}
// fade out over the last 1.5 s
const fo = Math.round((dur - 1.5) * SR);
for (let i = fo; i < N; i++) { const g = Math.max(0, 1 - (i - fo) / (1.5 * SR)); L[i] *= g; R[i] *= g; }
const n = Math.round(dur * SR), pcm = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) { pcm.writeInt16LE(Math.round(Math.tanh(L[i] * 1.1) * 30000), i * 4); pcm.writeInt16LE(Math.round(Math.tanh(R[i] * 1.1) * 30000), i * 4 + 2); }
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([h, pcm]));
console.log('music', dur.toFixed(2), 's @', BPM, 'bpm');
