// Cinematic score + SFX for the Cine composition, one key (A minor), one beat grid (BPM from timeline).
// node scripts/cine-audio.mjs  -> public/cine/music.wav, public/cine/sfx.wav
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildRicks, BPM } from '../src/ricks/timeline.ts';
const words = JSON.parse(readFileSync(new URL('../src/ricks/words.json', import.meta.url)));
const lines = JSON.parse(readFileSync(new URL('../src/ricks/lines.json', import.meta.url)));
const meta = JSON.parse(readFileSync(new URL('../src/ricks/meta.json', import.meta.url)));
const tl = buildRicks(lines, words, meta.lead || 0);
const SR = 48000, DUR = tl.duration, N = Math.ceil((DUR + .2) * SR), B = 60 / BPM;
const St = (id) => tl.sc.find((s) => s.id === id).start;
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const bus = () => [new Float32Array(N), new Float32Array(N)];
const add = (b, t0, len, fn, pan = 0, g = 1) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < len * SR; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; const v = fn(i / SR, i) * g; b[0][j] += v * (1 - pan) ; b[1][j] += v * (1 + pan); } };
// Schroeder/Freeverb-ish stereo reverb
function reverb(b, wet = .3, size = .84, damp = .3) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116], aps = [556, 441, 341, 225];
  const out = bus();
  for (let ch = 0; ch < 2; ch++) {
    const x = b[ch], y = out[ch], sp = ch ? 23 : 0;
    const cb = combs.map((d) => ({ buf: new Float32Array(Math.round((d + sp) * SR / 44100)), i: 0, lp: 0 }));
    const ab = aps.map((d) => ({ buf: new Float32Array(Math.round((d + sp) * SR / 44100)), i: 0 }));
    for (let n = 0; n < N; n++) {
      let s = 0; const inp = x[n] * .015;
      for (const c of cb) { const o = c.buf[c.i]; c.lp = o * (1 - damp) + c.lp * damp; c.buf[c.i] = inp + c.lp * size; c.i = (c.i + 1) % c.buf.length; s += o; }
      for (const a of ab) { const o = a.buf[a.i]; const v = -s + o; a.buf[a.i] = s + o * .5; a.i = (a.i + 1) % a.buf.length; s = v; }
      y[n] = x[n] * (1 - wet * .5) + s * wet * 3;
    }
  }
  return out;
}
function writeWav(path, b, gain = 1) {
  const n = Math.round(DUR * SR), pcm = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) pcm.writeInt16LE(Math.round(Math.tanh(b[c][i] * gain) * 30000), i * 4 + c * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40); writeFileSync(path, Buffer.concat([h, pcm]));
}

// ---------------- sfx (same key, same room)
const fx = bus();
const S = {
  whoosh: (t0) => { let lp = 0, bp = 0; add(fx, t0, .55, (t) => { const k = t / .55, env = Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.15)), 2); const c = .02 + .18 * k; lp += c * (rnd() - lp); bp += .5 * (lp - bp); return (lp - bp * .5) * env * 1.1; }, 0); },
  swish: (t0) => { let lp = 0; add(fx, t0, .3, (t) => { const k = t / .3; lp += (.1 + .4 * k) * (rnd() - lp); return lp * Math.sin(Math.PI * k) * .5; }, .4); },
  boom: (t0) => { let ph = 0, lp = 0; add(fx, t0, 2.2, (t) => { ph += 2 * Math.PI * (38 + 40 * Math.exp(-t * 6)) / SR; lp += .01 * (rnd() - lp); return Math.sin(ph) * Math.exp(-t * 1.8) * .7 + lp * Math.exp(-t * 3) * 1.4; }); },
  chime: (t0) => [69 + 12, 76 + 12, 81 + 12].forEach((m, i) => { const f = hz(m); add(fx, t0 + i * .06, 2, (t) => (Math.sin(2 * Math.PI * f * t) + .25 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6)) * Math.exp(-t * 2.2) * .07, (i - 1) * .4); }),
  shimmer: (t0) => [88, 93, 91, 96, 98, 100].forEach((m, i) => { const f = hz(m); add(fx, t0 + i * .07, 1, (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5) * .03, (i % 2 ? .5 : -.5)); }),
  ui: (t0) => add(fx, t0, .12, (t) => Math.sin(2 * Math.PI * hz(88) * t) * Math.exp(-t * 40) * .09),
  ui2: (t0) => { add(fx, t0, .15, (t) => Math.sin(2 * Math.PI * hz(81) * t) * Math.exp(-t * 30) * .08); add(fx, t0 + .07, .25, (t) => Math.sin(2 * Math.PI * hz(88) * t) * Math.exp(-t * 20) * .08); },
  click: (t0) => { let pv = 0; [0, .045].forEach((o, j) => add(fx, t0 + o, .03, (t) => { const n = rnd(), h = n - pv; pv = n; return (h * .6 + Math.sin(2 * Math.PI * (j ? 2600 : 3400) * t) * .5) * Math.exp(-t * (j ? 320 : 420)) * (j ? .16 : .26); })); },
  hover: (t0) => add(fx, t0, .1, (t) => Math.sin(2 * Math.PI * hz(93) * t) * Math.exp(-t * 45) * .035, .2),
  appopen: (t0) => { let lp = 0; add(fx, t0, .7, (t) => { const k = t / .7; lp += (.03 + .3 * (1 - k)) * (rnd() - lp); return lp * Math.sin(Math.PI * Math.min(1, k * 1.4)) * .7 + Math.sin(2 * Math.PI * (hz(57) * (1 + k)) * t) * .08 * (1 - k); }); },
  pop: (t0) => { let ph = 0; add(fx, t0, .12, (t) => { ph += 2 * Math.PI * (hz(81) * (1.6 - 4 * t)) / SR; return Math.sin(ph) * Math.exp(-t * 30) * .2; }); },
  drop: (t0) => { let ph = 0; add(fx, t0, .25, (t) => { ph += 2 * Math.PI * (130 - 200 * t) / SR; return Math.sin(ph) * Math.exp(-t * 22) * .38; }); S.ui(t0 + .02); },
  send: (t0) => { let lp = 0; add(fx, t0, .45, (t) => { const k = t / .45; lp += (.05 + .35 * k) * (rnd() - lp); return lp * Math.sin(Math.PI * k) * .5 + Math.sin(2 * Math.PI * hz(76 + 12 * k) * t) * .05 * (1 - k); }, -.2); },
  data: (t0) => add(fx, t0, .03, (t) => Math.sin(2 * Math.PI * hz([81, 84, 88, 91, 93][Math.floor(Math.abs(rnd()) * 5)]) * t) * Math.exp(-t * 120) * .03, rnd() * .6),
  key: (t0) => { let pv = 0; add(fx, t0, .025, (t) => { const n = rnd(), h = n - pv; pv = n; return (h * .8 + Math.sin(2 * Math.PI * (1800 + 900 * Math.abs(rnd())) * t) * .3) * Math.exp(-t * 300) * (.09 + .05 * Math.abs(rnd())); }, (rnd()) * .3); },
  press: (t0) => { let ph = 0; add(fx, t0, .18, (t) => { ph += 2 * Math.PI * (180 - 400 * t) / SR; return Math.sin(ph) * Math.exp(-t * 25) * .35; }); },
  riser: (t0) => { let lp = 0; add(fx, t0, .95, (t) => { const k = t / .95; lp += (.01 + .25 * k * k) * (rnd() - lp); return (lp * .9 + Math.sin(2 * Math.PI * (hz(57) + hz(57) * 1.5 * k * k) * t) * .05) * k * k; }); },
  flash: (t0) => { let lp = 0; add(fx, t0 - .6, .6, (t) => { const k = t / .6; lp += (.02 + .3 * k) * (rnd() - lp); return lp * k * k * .9; }); let l2 = 0; add(fx, t0, 1.6, (t) => { l2 += .3 * (rnd() - l2); return l2 * Math.exp(-t * 3) * .35; }); S.chime(t0 + .02); },
};
for (const e of tl.sfx) if (!['chime', 'shimmer', 'riser'].includes(e.k)) (S[e.k] || S.ui)(e.t);
const fxR = reverb(fx, .4, .86);
mkdirSync(new URL('../public/ricks/', import.meta.url), { recursive: true });
writeWav(new URL('../public/ricks/sfx.wav', import.meta.url), fxR, 1.1);
console.log('ricks audio', DUR.toFixed(2), 's; cuts', tl.sc.map((s) => s.start.toFixed(2)).join(' '));
