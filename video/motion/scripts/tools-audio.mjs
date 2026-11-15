// SFX bed for the Tools composition (no music by request).
// node scripts/tools-audio.mjs -> public/tools/sfx.wav
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildTools } from '../src/tools/timeline.ts';
const words = JSON.parse(readFileSync(new URL('../src/tools/words.json', import.meta.url)));
const lines = JSON.parse(readFileSync(new URL('../src/tools/lines.json', import.meta.url)));
const tl = buildTools(lines, words);
const SR = 48000, DUR = tl.duration, N = Math.ceil((DUR + .2) * SR);
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

// ---------------- sfx (one key: A, one room)
const fx = bus();
let G = 1;
const S = {
  whoosh: (t0) => { let lp = 0, bp = 0; add(fx, t0, .6, (t) => { const k = t / .6, env = Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.15)), 2); const c = .015 + .16 * k; lp += c * (rnd() - lp); bp += .5 * (lp - bp); return (lp - bp * .5) * env * 1.0; }, 0, G); },
  swish: (t0) => { let lp = 0; add(fx, t0, .3, (t) => { const k = t / .3; lp += (.1 + .4 * k) * (rnd() - lp); return lp * Math.sin(Math.PI * k) * .5; }, .4, G); },
  boom: (t0) => { let ph = 0, lp = 0; add(fx, t0, 2.2, (t) => { ph += 2 * Math.PI * (40 + 40 * Math.exp(-t * 6)) / SR; lp += .01 * (rnd() - lp); return Math.sin(ph) * Math.exp(-t * 2) * .6 + lp * Math.exp(-t * 3) * 1.2; }, 0, G); },
  impact: (t0) => { let ph = 0, lp = 0; add(fx, t0, 1.2, (t) => { ph += 2 * Math.PI * (55 + 120 * Math.exp(-t * 30)) / SR; lp += .2 * (rnd() - lp); return Math.sin(ph) * Math.exp(-t * 5) * .55 + lp * Math.exp(-t * 25) * .5; }, 0, G); S.shimmer(t0 + .02, .5); },
  thud: (t0) => { let ph = 0; add(fx, t0, .4, (t) => { ph += 2 * Math.PI * (70 + 60 * Math.exp(-t * 20)) / SR; return Math.sin(ph) * Math.exp(-t * 12) * .6; }, 0, G); },
  chime: (t0, g = 1) => [69 + 12, 76 + 12, 81 + 12].forEach((m, i) => { const f = hz(m); add(fx, t0 + i * .06, 2, (t) => (Math.sin(2 * Math.PI * f * t) + .25 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6)) * Math.exp(-t * 2.2) * .06 * g, (i - 1) * .4, G); }),
  shimmer: (t0, g = 1) => [88, 93, 91, 96, 98, 100].forEach((m, i) => { const f = hz(m); add(fx, t0 + i * .06, 1, (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5) * .028 * g, (i % 2 ? .5 : -.5), G); }),
  ding: (t0) => { const f = hz(93); add(fx, t0, 1.2, (t) => (Math.sin(2 * Math.PI * f * t) + .3 * Math.sin(2 * Math.PI * f * 2 * t)) * Math.exp(-t * 4) * .07, .1, G); add(fx, t0 + .08, 1, (t) => Math.sin(2 * Math.PI * hz(100) * t) * Math.exp(-t * 5) * .05, -.1, G); },
  coin: (t0) => { [88, 95].forEach((m, i) => add(fx, t0 + i * .07, .5, (t) => Math.sign(Math.sin(2 * Math.PI * hz(m) * t)) * Math.exp(-t * 10) * .03, 0, G)); },
  ui: (t0) => add(fx, t0, .12, (t) => Math.sin(2 * Math.PI * hz(88) * t) * Math.exp(-t * 40) * .09, 0, G),
  ui2: (t0) => { add(fx, t0, .15, (t) => Math.sin(2 * Math.PI * hz(81) * t) * Math.exp(-t * 30) * .08, 0, G); add(fx, t0 + .07, .25, (t) => Math.sin(2 * Math.PI * hz(88) * t) * Math.exp(-t * 20) * .08, 0, G); },
  tick: (t0) => add(fx, t0, .04, (t) => Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 160) * .1, rnd() * .3, G),
  click: (t0) => { let pv = 0; [0, .045].forEach((o, j) => add(fx, t0 + o, .03, (t) => { const n = rnd(), h = n - pv; pv = n; return (h * .6 + Math.sin(2 * Math.PI * (j ? 2600 : 3400) * t) * .5) * Math.exp(-t * (j ? 320 : 420)) * (j ? .16 : .26); }, 0, G)); },
  pop: (t0) => { let ph = 0; add(fx, t0, .12, (t) => { ph += 2 * Math.PI * (hz(81) * (1.6 - 4 * t)) / SR; return Math.sin(ph) * Math.exp(-t * 30) * .18; }, rnd() * .3, G); },
  drop: (t0) => { let ph = 0; add(fx, t0, .25, (t) => { ph += 2 * Math.PI * (130 - 200 * t) / SR; return Math.sin(ph) * Math.exp(-t * 22) * .34; }, 0, G); S.ui(t0 + .02); },
  send: (t0) => { let lp = 0; add(fx, t0, .45, (t) => { const k = t / .45; lp += (.05 + .35 * k) * (rnd() - lp); return lp * Math.sin(Math.PI * k) * .45 + Math.sin(2 * Math.PI * hz(76 + 12 * k) * t) * .045 * (1 - k); }, -.2, G); },
  data: (t0) => add(fx, t0, .03, (t) => Math.sin(2 * Math.PI * hz([81, 84, 88, 91, 93][Math.floor(Math.abs(rnd()) * 5)]) * t) * Math.exp(-t * 120) * .028, rnd() * .6, G),
  key: (t0) => { let pv = 0; add(fx, t0, .025, (t) => { const n = rnd(), h = n - pv; pv = n; return (h * .8 + Math.sin(2 * Math.PI * (1800 + 900 * Math.abs(rnd())) * t) * .3) * Math.exp(-t * 300) * (.08 + .05 * Math.abs(rnd())); }, (rnd()) * .3, G); },
  riser: (t0) => { let lp = 0; add(fx, t0, .95, (t) => { const k = t / .95; lp += (.01 + .25 * k * k) * (rnd() - lp); return (lp * .8 + Math.sin(2 * Math.PI * (hz(57) + hz(57) * 1.5 * k * k) * t) * .045) * k * k; }, 0, G); },
  zap: (t0) => { let ph = 0; add(fx, t0, .5, (t) => { ph += 2 * Math.PI * (hz(69) * (1 + 2 * Math.exp(-t * 8))) / SR; return Math.sin(ph) * Math.exp(-t * 6) * .07 * (1 + .5 * Math.sin(t * 90)); }, 0, G); S.shimmer(t0 + .05, .6); },
  paper: (t0) => { let lp = 0; add(fx, t0, .35, (t) => { const k = t / .35; lp += .5 * (rnd() - lp); return lp * Math.sin(Math.PI * k) * .16 * (1 + Math.sin(t * 160)); }, .2, G); },
  toggle: (t0) => { S.click(t0); add(fx, t0 + .05, .3, (t) => Math.sin(2 * Math.PI * hz(84 + 7 * Math.min(1, t * 12)) * t) * Math.exp(-t * 14) * .07, 0, G); },
  glitch: (t0) => { for (let i = 0; i < 9; i++) { const a = t0 + i * .045; add(fx, a, .035, (t) => (Math.sign(Math.sin(2 * Math.PI * (200 + Math.abs(rnd()) * 1800) * t)) * .5 + rnd() * .5) * .06, rnd() * .6, G); } },
  rewind: (t0) => { let ph = 0, lp = 0; add(fx, t0, .6, (t) => { const k = t / .6; ph += 2 * Math.PI * (900 - 700 * k) / SR; lp += .3 * (rnd() - lp); return (Math.sin(ph) * .04 + lp * .08) * Math.sin(Math.PI * k); }, 0, G); },
  slash: (t0) => { let lp = 0; add(fx, t0, .25, (t) => { const k = t / .25; lp += (.4 - .3 * k) * (rnd() - lp); return lp * Math.exp(-t * 10) * .5; }, .3, G); S.thud(t0 + .05); },
  lock: (t0) => { S.impact(t0); let pv = 0; [0, .07].forEach((o) => add(fx, t0 + o, .05, (t) => { const n = rnd(), h = n - pv; pv = n; return (h * .7 + Math.sin(2 * Math.PI * 1500 * t) * .5) * Math.exp(-t * 200) * .3; }, 0, G)); },
  denied: (t0) => { [0, .14].forEach((o) => add(fx, t0 + o, .12, (t) => Math.sign(Math.sin(2 * Math.PI * hz(52) * t)) * Math.exp(-t * 10) * .05, 0, G)); S.thud(t0); },
};
for (const e of tl.sfx) { G = e.g ?? 1; (S[e.k] || S.ui)(e.t); }
const fxR = reverb(fx, .32, .84);
mkdirSync(new URL('../public/tools/', import.meta.url), { recursive: true });
writeWav(new URL('../public/tools/sfx.wav', import.meta.url), fxR, 1.1);
console.log('tools sfx', DUR.toFixed(2), 's,', tl.sfx.length, 'events');
