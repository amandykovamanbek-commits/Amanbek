// node sfx.cjs cues.json out.wav  -> synthesizes sound effects at cue times (no music)
const fs = require('node:fs');
const [inp, out] = process.argv.slice(2);
const { duration, events } = JSON.parse(fs.readFileSync(inp, 'utf8'));
const SR = 48000, N = Math.ceil((duration + 1) * SR), buf = new Float32Array(N);
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const add = (t0, len, fn) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < len * SR; i++) { const j = s0 + i; if (j >= 0 && j < N) buf[j] += fn(i / SR); } };
const tone = (f, t) => Math.sin(2 * Math.PI * f * t);
const S = {
  pop: t0 => { let ph = 0; add(t0, .09, t => { ph += 2 * Math.PI * (900 - 6000 * t) / SR; return Math.sin(ph) * Math.exp(-t * 45) * .32; }); },
  whoosh: t0 => { let lp = 0; add(t0, .38, t => { const k = t / .38, env = Math.sin(Math.PI * k) ** 2, a = .03 + .25 * env; lp += a * (rnd() - lp); return lp * env * .9; }); },
  send: t0 => { let lp = 0; add(t0, .14, t => { const k = t / .14, env = Math.sin(Math.PI * k); lp += (.05 + .4 * k) * (rnd() - lp); return lp * env * .35; }); },
  beep: t0 => add(t0, .14, t => Math.sign(tone(2100, t)) * .07 * (t < .12 ? 1 : 0) * Math.min(1, t * 400)),
  sparkle: t0 => { for (let k = 0; k < 7; k++) { const f = 2400 + k * 330; add(t0 + k * .05, .35, t => tone(f, t) * Math.exp(-t * 14) * .06); } },
  tick: t0 => add(t0, .02, t => tone(3200, t) * Math.exp(-t * 300) * .14),
  click: t0 => add(t0, .015, t => rnd() * Math.exp(-t * 500) * .12),
  coin: t0 => { add(t0, .08, t => tone(988, t) * .16 * Math.exp(-t * 10)); add(t0 + .08, .5, t => tone(1319, t) * .18 * Math.exp(-t * 7)); },
  hit: t0 => { let ph = 0; add(t0, .3, t => { ph += 2 * Math.PI * (140 - 260 * t) / SR; return Math.sin(ph) * Math.exp(-t * 12) * .55 + rnd() * Math.exp(-t * 60) * .2; }); },
  stamp: t0 => { let ph = 0; add(t0, .25, t => { ph += 2 * Math.PI * (110 - 200 * t) / SR; return Math.sin(ph) * Math.exp(-t * 14) * .6 + rnd() * Math.exp(-t * 80) * .3; }); },
  wah: t0 => { let ph = 0, lp = 0; add(t0, .9, t => { const f = (t < .3 ? 233 : t < .55 ? 220 : 196 - 12 * (t - .55)) * (1 + .02 * Math.sin(t * 38)); ph += f / SR; const saw = 2 * (ph % 1) - 1; lp += .12 * (saw - lp); return lp * .22 * Math.min(1, t * 30) * (t > .8 ? (0.9 - t) * 10 : 1); }); },
  buzz: t0 => add(t0, .65, t => Math.tanh(3 * tone(150, t)) * .16 * (.5 + .5 * Math.sign(Math.sin(2 * Math.PI * 9 * t))) * Math.min(1, t * 50)),
  ding: t0 => add(t0, 1.1, t => (tone(1568, t) * .6 + tone(2093, t) * .4 + tone(3136, t) * .15 * Math.exp(-t * 9)) * Math.exp(-t * 4) * .17),
  success: t0 => [523, 659, 784, 1047].forEach((f, i) => add(t0 + i * .07, .5, t => (tone(f, t) + .3 * tone(2 * f, t)) * Math.exp(-t * 6) * .1)),
};
for (const e of events) (S[e.k] || S.pop)(e.t);
// soft limiter
const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) pcm.writeInt16LE(Math.round(Math.tanh(buf[i] * 1.2) * 32000), i * 2);
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([h, pcm]));
console.log('sfx events', events.length, 'dur', duration.toFixed(2));
