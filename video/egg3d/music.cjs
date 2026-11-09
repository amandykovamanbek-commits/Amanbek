// node music.cjs out.wav : простой синтезированный бит (128 BPM): бочка, хэт, бас, арпеджио — без семплов
const fs = require('node:fs');
const SR = 48000, DUR = 30.4, N = Math.ceil(DUR * SR), buf = new Float32Array(N);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const add = (t0, len, fn) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < len * SR; i++) { const j = s0 + i; if (j >= 0 && j < N) buf[j] += fn(i / SR); } };
const BPM = 128, beat = 60 / BPM;
const bassNotes = [55, 55, 65.4, 49]; // A1 A1 C2 G1
const arp = [[220, 261.6, 329.6], [220, 261.6, 329.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
for (let b = 0; b * beat < DUR; b++) {
  const t = b * beat, bar = Math.floor(b / 4) % 4, inBar = b % 4;
  // бочка на каждую долю
  add(t, .25, u => { const f = 150 * Math.exp(-u * 28) + 45; return Math.sin(2 * Math.PI * f * u * 1.0) * Math.exp(-u * 11) * .9; });
  // хэт на восьмые
  for (let h = 0; h < 2; h++) add(t + h * beat / 2, .06, u => rnd() * Math.exp(-u * 90) * (h ? .12 : .2));
  // снейр на 2 и 4
  if (inBar % 2 === 1) add(t, .18, u => (rnd() * .5 + Math.sin(2 * Math.PI * 190 * u) * .4) * Math.exp(-u * 22) * .6);
  // бас восьмыми
  const f = bassNotes[bar];
  for (let h = 0; h < 2; h++) add(t + h * beat / 2, beat / 2 * .9, u => { const saw = 2 * ((f * u) % 1) - 1; return Math.tanh(saw * 1.5) * .22 * Math.min(1, u * 60) * Math.min(1, (beat / 2 * .9 - u) * 40); });
  // арпеджио шестнадцатыми
  const ch = arp[bar];
  for (let q = 0; q < 4; q++) { const n = ch[q % 3] * (q === 3 ? 2 : 1); add(t + q * beat / 4, .14, u => (Math.sign(Math.sin(2 * Math.PI * n * u)) * .5 + Math.sin(2 * Math.PI * n * u) * .5) * Math.exp(-u * 14) * .07); }
}
// fade in/out
for (let i = 0; i < N; i++) { const t = i / SR; buf[i] *= Math.min(1, t / .3) * Math.min(1, (DUR - t) / 1.5); }
const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) pcm.writeInt16LE(Math.round(Math.tanh(buf[i] * 1.1) * 30000), i * 2);
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(process.argv[2], Buffer.concat([h, pcm]));
console.log('music', DUR);
