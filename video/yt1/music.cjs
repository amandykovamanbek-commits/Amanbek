// node music.cjs cues.json music.wav sfx_clean.json -> synthesizes the music bed from section marks (k starts with '_')
const fs = require('node:fs');
const [inp, out, clean] = process.argv.slice(2);
const { duration, events } = JSON.parse(fs.readFileSync(inp, 'utf8'));
fs.writeFileSync(clean, JSON.stringify({ duration, events: events.filter(e => e.k[0] !== '_') }));
const SR = 48000, N = Math.ceil((duration + .5) * SR), buf = new Float32Array(N);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const add = (t0, len, fn, g = 1) => { const s0 = Math.round(t0 * SR), n = Math.round(len * SR); for (let i = 0; i < n; i++) { const j = s0 + i; if (j >= 0 && j < N) buf[j] += fn(i / SR) * g; } };
const sin = (f, t) => Math.sin(2 * Math.PI * f * t), tri = (f, t) => 2 * Math.abs(2 * ((f * t) % 1) - 1) - 1;
const C = { Am: [110, [220, 261.6, 329.6]], F: [87.3, [220, 261.6, 349.2]], C: [130.8, [196, 261.6, 329.6]], G: [98, [196, 246.9, 293.7]], Em: [82.4, [196, 246.9, 329.6]], Dm: [73.4, [220, 293.7, 349.2]] };
const SEC = {
  _A:  { prog: ['Am', 'F', 'C', 'G'], pad: .5, pluck: .5, hat: .25, kick: 0, clap: 0, bass: .4, g: .8 },
  _A2: { prog: ['Am', 'F', 'C', 'G'], pad: .5, pluck: .6, hat: .4, kick: .6, clap: 0, bass: .6, g: .85 },
  _B:  { prog: ['Am', 'Em', 'F', 'Dm'], pad: .8, pluck: .22, hat: 0, kick: 0, clap: 0, bass: .3, g: .7, slow: 1 },
  _C:  { prog: ['F', 'G', 'Am', 'Am'], pad: .5, pluck: .5, hat: .35, kick: .5, clap: 0, bass: .6, g: .8 },
  _C2: { prog: ['F', 'G', 'Am', 'C'], pad: .5, pluck: .7, hat: .5, kick: .9, clap: .5, bass: .8, g: .95 },
  _D:  { prog: ['Am', 'F', 'Dm', 'G'], pad: .45, pluck: .55, hat: .5, kick: .8, clap: .35, bass: .8, g: .85 },
  _D2: { prog: ['F', 'G', 'C', 'C'], pad: .5, pluck: .8, hat: .5, kick: .9, clap: .5, bass: .8, g: .95, up: 1 },
  _E0: { prog: ['Am', 'Am', 'F', 'G'], pad: .6, pluck: .3, hat: .5, kick: 0, clap: 0, bass: .3, g: .7, roll: 1 },
  _E:  { prog: ['C', 'G', 'Am', 'F'], pad: .6, pluck: .9, hat: .6, kick: 1, clap: .7, bass: .9, g: 1.1, up: 1, four: 1 },
  _F:  { prog: ['C', 'G', 'Am', 'F'], pad: .5, pluck: .6, hat: .45, kick: .8, clap: .45, bass: .7, g: .85 },
};
const BEAT = .6;
const marks = events.filter(e => SEC[e.k]).sort((a, b) => a.t - b.t);
const kick = (t0, g) => { let ph = 0; add(t0, .28, t => { ph += 2 * Math.PI * (48 + 110 * Math.exp(-t * 28)) / SR; return Math.sin(ph) * Math.exp(-t * 11); }, g * .9); };
const hat = (t0, g) => { let lp = 0; add(t0, .05, t => { const n = rnd(); lp += .35 * (n - lp); return (n - lp) * Math.exp(-t * 90); }, g * .22); };
const clap = (t0, g) => { let lp = 0; add(t0, .16, t => { const n = rnd(); lp += .5 * (n - lp); return lp * Math.exp(-t * 26) * (t < .012 || (t > .02 && t < .03) || t > .04 ? 1 : .2); }, g * .45); };
const riser = (t1, len) => { let lp = 0; add(t1 - len, len, t => { const k = t / len; lp += (.02 + .5 * k * k) * (rnd() - lp); return lp * k * k; }, .5); };
marks.forEach((m, mi) => {
  const S = SEC[m.k], t0 = m.t, t1 = mi < marks.length - 1 ? marks[mi + 1].t : duration, nb = Math.ceil((t1 - t0) / BEAT);
  const fade = t => Math.min(1, (t - t0) / .12 + .2, (t1 - t) / .12 + .0) ;
  for (let b = 0; b < nb; b++) {
    const bt = t0 + b * BEAT; if (bt >= t1 - .02) break;
    const [root, notes] = C[S.prog[Math.floor(b / 4) % 4]];
    const cut = Math.min(BEAT * 4, t1 - bt);
    if (b % 4 === 0) notes.forEach((f, i) => add(bt, cut, t => (sin(f, t) + .35 * sin(2 * f * 1.003, t) + .2 * tri(f * .5, t)) * Math.min(1, t / .35) * Math.min(1, (cut - t) / .3), S.pad * .075 * S.g));
    for (let e = 0; e < 2; e++) {
      const et = bt + e * BEAT / 2; if (et >= t1 - .03) continue;
      const idx = (b * 2 + e) % 8, f = notes[[0, 1, 2, 1, 0, 2, 1, 2][idx]] * (S.up ? 4 : 2) * (idx === 5 ? 1.5 : 1);
      if (!S.slow || e === 0) add(et, .4, t => (tri(f, t) * .7 + sin(f * 2, t) * .3) * Math.exp(-t * (S.slow ? 4 : 8)), S.pluck * .11 * S.g);
      if (S.hat) hat(et, S.hat * S.g * (e ? .7 : 1));
    }
    if (S.bass && (b % 4 === 0 || b % 4 === 2)) add(bt, BEAT * 1.6, t => (sin(root, t) + .3 * sin(root * 2, t)) * Math.min(1, t / .01) * Math.exp(-t * 2.2), S.bass * .22 * S.g);
    if (S.kick && (S.four || b % 2 === 0)) kick(bt, S.kick * S.g);
    if (S.clap && b % 2 === 1) clap(bt, S.clap * S.g);
  }
  if (S.roll) for (let x = t1 - .9, i = 0; x < t1 - .02; x += .075, i++) clap(x, .25 + i * .05);
  if (m.k === '_C2' || m.k === '_E' || m.k === '_D') riser(t0, m.k === '_E' ? 1.4 : .8);
  if (m.k === '_E') { add(t0, 2.2, t => rnd() * Math.exp(-t * 2.2), .28); [523.3, 659.3, 784, 1046.5].forEach((f, i) => add(t0 + i * .05, 1.6, t => tri(f, t) * Math.exp(-t * 2.5), .12)); }
});
// dips (silence beat under dramatic hits) and master
const dips = events.filter(e => e.k === '_dip').map(e => e.t);
const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) {
  const t = i / SR; let g = Math.min(1, t / .4, (duration - t) / 1.5);
  for (const d of dips) if (t > d - .05 && t < d + .9) g *= t < d + .5 ? .15 : .15 + .85 * (t - d - .5) / .4;
  pcm.writeInt16LE(Math.round(Math.tanh(buf[i] * Math.max(0, g) * 1.4) * 30000), i * 2);
}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([h, pcm]));
console.log('music sections', marks.length, 'dur', duration.toFixed(2));
