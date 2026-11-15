// Cinematic score + SFX for the Cine composition, one key (A minor), one beat grid (BPM from timeline).
// node scripts/cine-audio.mjs  -> public/cine/music.wav, public/cine/sfx.wav
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildCine, BPM } from '../src/cine/timeline.ts';
const words = JSON.parse(readFileSync(new URL('../src/cine/words.json', import.meta.url)));
const meta = JSON.parse(readFileSync(new URL('../src/cine/meta.json', import.meta.url)));
const tl = buildCine(words, meta.lead || 0);
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

// ---------------- music
const mus = bus();
const tB = St('b'), tC = St('c'), tF = St('f'), tG = St('g');
const PROG = [[45, [57, 60, 64, 71]], [41, [57, 60, 64, 65]], [48, [55, 60, 64, 67]], [43, [55, 59, 62, 67]]]; // Am(add9) Fmaj7 C G
const barLen = 4 * B, bars = Math.ceil(DUR / barLen);
for (let bar = 0; bar < bars; bar++) {
  const t0 = bar * barLen, [root, ch] = PROG[Math.floor(bar / 1) % 4];
  // warm pad: detuned saws through a slow one-pole lowpass, long attack
  ch.forEach((m, vi) => [-.08, .08].forEach((det, di) => {
    const f = hz(m) * Math.pow(2, det / 12 * .1); let ph = Math.random(), lp = 0;
    add(mus, t0, barLen + .6, (t) => { ph += f / SR; const saw = 2 * (ph % 1) - 1; const cut = .02 + .025 * (1 + Math.sin((t0 + t) * .5)); lp += cut * (saw - lp);
      const env = Math.min(1, t / .9) * Math.min(1, (barLen + .6 - t) / .6); return lp * env * .05; }, (vi - 1.5) * .25 + (di ? .15 : -.15));
  }));
  // sub bass from B on
  if (t0 + barLen > tB) add(mus, Math.max(t0, tB), t0 + barLen - Math.max(t0, tB), (t) => Math.sin(2 * Math.PI * hz(root - 12) * t) * .16 * Math.min(1, t * 4) * Math.min(1, (barLen - t) * 6));
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * B, mid = tb >= tC && tb < tF - .05, end = tb >= tG;
    // heartbeat kick
    if ((mid || end) && (b % 2 === 0 || mid)) { let ph = 0; add(mus, tb, .4, (t) => { ph += 2 * Math.PI * (42 + 70 * Math.exp(-t * 28)) / SR; return Math.sin(ph) * Math.exp(-t * 8) * (mid ? .32 : .22); }); }
    // shaker 8ths + arp 8ths in the build
    if (mid) for (let e = 0; e < 2; e++) {
      let pv = 0; add(mus, tb + e * B / 2, .06, () => { const n = rnd(), h = n - pv; pv = n; return h; }, e ? .35 : -.35, e ? .028 : .016);
      const m = ch[(b * 2 + e) % 4] + 12, f = hz(m);
      add(mus, tb + e * B / 2, .5, (t) => (Math.sin(2 * Math.PI * f * t) + .3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 7) * .045, (e ? .3 : -.3));
    }
  }
}
// bell motif after the flash (A minor pentatonic)
[[0, 81], [.5, 84], [1, 88], [2, 86], [3, 84]].forEach(([o, m]) => { const f = hz(m); add(mus, tF + o * B, 1.6, (t) => (Math.sin(2 * Math.PI * f * t) * .6 + Math.sin(2 * Math.PI * f * 2.76 * t) * .15 * Math.exp(-t * 5)) * Math.exp(-t * 2.5) * .05, .2); });
// intro: duck everything except pad until B, fade in from silence, fade out at the end
for (let i = 0; i < N; i++) { const t = i / SR; const g = Math.min(1, t / 1.2) * Math.max(0, Math.min(1, (DUR - t) / 1.6)); mus[0][i] *= g; mus[1][i] *= g; }
const musR = reverb(mus, .35);

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
  key: (t0) => { let pv = 0; add(fx, t0, .025, (t) => { const n = rnd(), h = n - pv; pv = n; return h * Math.exp(-t * 260) * .12; }, (rnd()) * .3); },
  press: (t0) => { let ph = 0; add(fx, t0, .18, (t) => { ph += 2 * Math.PI * (180 - 400 * t) / SR; return Math.sin(ph) * Math.exp(-t * 25) * .35; }); },
  riser: (t0) => { let lp = 0; add(fx, t0, .95, (t) => { const k = t / .95; lp += (.01 + .25 * k * k) * (rnd() - lp); return (lp * .9 + Math.sin(2 * Math.PI * (hz(57) + hz(57) * 1.5 * k * k) * t) * .05) * k * k; }); },
  flash: (t0) => { let lp = 0; add(fx, t0 - .6, .6, (t) => { const k = t / .6; lp += (.02 + .3 * k) * (rnd() - lp); return lp * k * k * .9; }); let l2 = 0; add(fx, t0, 1.6, (t) => { l2 += .3 * (rnd() - l2); return l2 * Math.exp(-t * 3) * .35; }); S.chime(t0 + .02); },
};
for (const e of tl.sfx) (S[e.k] || S.ui)(e.t);
const fxR = reverb(fx, .4, .86);
mkdirSync(new URL('../public/cine/', import.meta.url), { recursive: true });
writeWav(new URL('../public/cine/music.wav', import.meta.url), musR, 1.0);
writeWav(new URL('../public/cine/sfx.wav', import.meta.url), fxR, 1.1);
console.log('cine audio', DUR.toFixed(2), 's; cuts', tl.sc.map((s) => s.start.toFixed(2)).join(' '));
