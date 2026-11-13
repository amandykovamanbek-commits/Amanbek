"""Procedural music + SFX for Tyap-Lyap, mixed under the voiceover. numpy only, deterministic."""
import numpy as np, json, subprocess, sys, os
SR = 48000; DUR = 108.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
base = os.path.dirname(os.path.abspath(__file__)) + '/..'

def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); j = min(len(buf), i + len(sig))
    if i >= len(buf) or j <= i: return
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    buf[i:j, 0] += sig[:j - i] * gain * l * 1.414; buf[i:j, 1] += sig[:j - i] * gain * r * 1.414
def lp(x, a):  # one-pole lowpass, a in (0,1): higher = brighter
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def lp_fast(x, cutoff):
    # FFT brickwall-ish lowpass with soft edge
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x))
def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (cutoff / np.maximum(f, 1)) ** 4); return np.fft.irfft(X, len(x))
def noise(n): return rng.standard_normal(n)
def sine(f, n, ph=0): return np.sin(2 * np.pi * np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR + ph)

# ---------- SFX ----------
def punch():
    n = int(.35 * SR); t = np.arange(n) / SR
    body = sine(110 * np.exp(-t * 18) + 45, n) * env(n, .001, .09)
    crack = lp_fast(noise(n), 3500) * env(n, .0005, .025)
    return np.tanh((body * 1.4 + crack * .8) * 1.6) * .9
def thud(d=.5, f0=70):
    n = int(d * SR); t = np.arange(n) / SR
    return np.tanh(sine(f0 * np.exp(-t * 6) + 30, n) * env(n, .001, d * .35) * 1.8 + lp_fast(noise(n), 900) * env(n, .001, .05) * .6)
def mixs(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def snowfall_hit():
    n = int(.6 * SR); return mixs(lp_fast(noise(n), 1800) * env(n, .002, .12) * .9, thud(.5, 55) * .7)
def stamp_sfx():
    n = int(.4 * SR); return mixs(thud(.4, 90) * .8, lp_fast(noise(n), 5000) * env(n, .0005, .03) * .5)
def whoosh(d=.45, up=True):
    n = int(d * SR); t = np.arange(n) / SR; x = noise(n)
    sh = np.sin(np.pi * t / d) ** 2
    out = hp_fast(lp_fast(x, 2500), 300) * sh
    return out * .6
def tick():
    n = int(.03 * SR); return hp_fast(noise(n), 2000) * env(n, .0003, .006) * .8
def coin_sfx():
    n = int(.6 * SR); s = np.zeros(n)
    for f, a in [(2637, 1), (3520, .6), (4186, .4), (5274, .25)]: s += sine(f, n) * a
    return s * env(n, .001, .12) * .35
def paper():
    n = int(.35 * SR); t = np.arange(n) / SR
    return hp_fast(noise(n), 1500) * (np.abs(np.sin(t * 60)) ** 2) * env(n, .01, .12) * .5
def scribble(d=.45):
    n = int(d * SR); t = np.arange(n) / SR
    return hp_fast(lp_fast(noise(n), 6000), 2500) * (0.5 + .5 * np.sin(t * 2 * np.pi * 9)) ** 2 * np.sin(np.pi * t / d) * .3
def heartbeat():
    return thud(.25, 55) * .9
def crunch():
    n = int(.12 * SR); return lp_fast(noise(n) * (rng.random(n) < .25), 4000) * env(n, .002, .04) * .7
def crowd(d):
    n = int(d * SR); t = np.arange(n) / SR; x = noise(n)
    s = lp_fast(x, 900) * 1.2 + lp_fast(noise(n), 2400) * .3
    mod = .6 + .4 * np.sin(t * 5.3) * np.sin(t * 2.1 + 1)
    sh = np.minimum(1, t / .4) * np.minimum(1, (d - t) / .5)
    return s * mod * sh * .5
def clock_tick():
    n = int(.05 * SR); return hp_fast(noise(n), 3000) * env(n, .0003, .01) * .6 + sine(1800, n) * env(n, .0003, .01) * .2
def gavel():
    return mixs(thud(.6, 140) * .9, punch() * .3)

sfx = np.zeros((N, 2))
HITS = [(10.15, 'slam'), (13.1, 'stamp'), (25.45, 'punch'), (30.85, 'fall'), (37.75, 'punch'), (47.75, 'punch'), (48.2, 'fall'), (51.5, 'stamp'),
        (59.45, 'punch'), (66.7, 'stamp'), (69.3, 'clash'), (73.9, 'stamp'), (77.75, 'punch'), (85.35, 'gavel'), (96.0, 'stamp')]
for t, k in HITS:
    if k == 'punch': place(sfx, punch(), t - .02, 1.0)
    elif k == 'fall': place(sfx, snowfall_hit(), t, .9)
    elif k == 'stamp': place(sfx, stamp_sfx(), t, .9)
    elif k == 'slam': place(sfx, thud(.7, 60), t, 1.0); place(sfx, stamp_sfx(), t, .6)
    elif k == 'clash': place(sfx, punch(), t, .9, -.3); place(sfx, punch(), t + .08, .8, .3); place(sfx, thud(.8, 50), t, .8)
    elif k == 'gavel': place(sfx, gavel(), t, 1.0)
for b in [4.6, 10.85, 16.0, 26.0, 42.1, 52.3, 60.4, 67.5, 72.5, 83.45, 96.65]: place(sfx, whoosh(), b - .22, .7)
# year flip ticks
tt = 2.2
while tt < 4.3:
    place(sfx, tick(), tt, .7); k = (tt - 2.2) / 2.1; tt += .045 + .12 * k ** 2
place(sfx, stamp_sfx(), 4.3, .5)
for t in [19.55, 19.75, 19.95, 20.15]: place(sfx, coin_sfx(), t, .7, .2)
place(sfx, coin_sfx(), 22.0, 1.0); place(sfx, paper(), 23.84, 1.0)
for i in range(4): place(sfx, thud(.25, 80), 18.6 + i * .5 + .5, .45)  # jump landings
for t in np.arange(14.0, 16.0, .8): place(sfx, heartbeat(), t, .8); place(sfx, heartbeat(), t + .22, .55)
for t in np.arange(16.0, 17.4, .3): place(sfx, crunch(), t, .6)
for t in np.arange(26.0, 28.8, .26): place(sfx, crunch(), t, .55)
for t in np.arange(33.2, 35.5, .3): place(sfx, crunch(), t, .55)
place(sfx, paper(), 52.3, 1.0); place(sfx, paper(), 57.6, 1.2)
for t in [53.5, 54.45, 56.6]: place(sfx, scribble(), t, .9)
for t in np.arange(58.0, 59.2, .25): place(sfx, clock_tick(), t, .8)
for t in [61.7, 62.3, 63.1]: place(sfx, thud(.35, 75), t, .55)
place(sfx, crowd(2.2), 68.6, .8)
place(sfx, crowd(4.6), 74.5, .7)
for t in np.arange(74.6, 79.0, .38): place(sfx, crunch(), t, .7); place(sfx, thud(.15, 60), t, .3)
place(sfx, paper(), 83.5, .8); place(sfx, paper(), 84.1, .9)
for i in range(28): place(sfx, tick(), 89.3 + i * 1.7 / 28, .5)
place(sfx, paper(), 91.3, .9); place(sfx, paper(), 92.6, .9)
for i in range(4): place(sfx, stamp_sfx(), 94.0 + i * .25, .35)
place(sfx, coin_sfx(), 99.0, .6); place(sfx, coin_sfx(), 104.8, .9)

# ---------- music ----------
mus = np.zeros((N, 2))
BPM = 92; beat = 60 / BPM
prog = [45, 41, 48, 43]  # A1 F1 C2 G1 (midi)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def bass_note(m, d, drive=1.0):
    n = int(d * SR); t = np.arange(n) / SR; f = mtof(m)
    s = np.sign(sine(f, n)) * .4 + sine(f, n) * .6 + sine(f * 2, n) * .2
    s = lp_fast(s, 300 + 500 * drive) * env(n, .01, d * .6)
    return np.tanh(s * (1 + drive))
def kick():
    n = int(.4 * SR); t = np.arange(n) / SR
    return np.tanh(sine(150 * np.exp(-t * 30) + 42, n) * env(n, .001, .14) * 2.2)
def hat():
    n = int(.08 * SR); return hp_fast(noise(n), 7000) * env(n, .0005, .02) * .4
def snare():
    n = int(.25 * SR); return hp_fast(noise(n), 1200) * env(n, .001, .07) * .6 + sine(190, n) * env(n, .001, .05) * .4
def pad(midis, d):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in midis:
        for det in (-.12, .0, .13):
            f = mtof(m + det); s += (2 * ((t * f) % 1) - 1) * .15
    s = lp_fast(s, 1100)
    sh = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.2)
    return s * sh
def bell(m, d=1.2):
    n = int(d * SR); f = mtof(m)
    return (sine(f, n) + sine(f * 2.76, n) * .3 + sine(f * 5.4, n) * .1) * env(n, .002, .45) * .35
def intensity(t):
    if t < 4.6: return 0
    if 42.1 <= t < 52.3 or 67.5 <= t < 80.5: return 3
    if 16 <= t < 42.1 or 60.4 <= t < 67.5: return 2
    if 83.45 <= t < 96.65: return 1.5
    if t >= 96.65: return 0
    return 1
# drone throughout intro
place(mus, pad([45, 52], 5.2) * .7, 0.0, .9)
t = 4.6; i = 0
while t < 96.6:
    it = intensity(t); bar = int((t - 4.6) / (beat * 4)); m = prog[bar % 4]
    pos = i % 4
    if it == 1.5:  # court: slow heartbeat kick + strings
        if pos in (0, 2): place(mus, kick(), t, .8)
    else:
        place(mus, kick(), t, .75 if it < 3 else .95)
        if it >= 2: place(mus, hat(), t + beat / 2, .8); place(mus, hat(), t, .35)
        if it >= 3 and pos in (1, 3): place(mus, snare(), t, .8)
    if it != 1.5: place(mus, bass_note(m, beat * .95, 1.5 if it >= 3 else .6), t, .55)
    if pos == 0 and (bar % 2 == 0): place(mus, pad([m + 24, m + 27, m + 31], beat * 8) * .9, t, .35 if it < 3 else .45)
    t += beat; i += 1
# court tension strings
place(mus, pad([57, 58], 13.0), 83.45, .5)
# finale: sad pad + music box with the 'seed' motif
place(mus, pad([45, 48, 52], 11.5), 96.6, .7)
for k, m in enumerate([76, 72, 69, 71, 72, 69, 64, 69]):
    place(mus, bell(m), 97.0 + k * .75, .9)
mus *= .55

# ---------- ambience ----------
amb = np.zeros((N, 2))
w = lp_fast(noise(N), 500); wmod = .5 + .5 * np.sin(np.arange(N) / SR * .3) * np.sin(np.arange(N) / SR * .11 + 1)
amb[:, 0] = w * wmod * .12; amb[:, 1] = np.roll(w, 2400) * wmod * .12

# ---------- mix with voice ----------
vo_wav = base + '/build/vo48.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', base + '/audio/vo.mp3', '-ar', str(SR), '-ac', '1', '-f', 'f32le', vo_wav], check=True)
vo = np.fromfile(vo_wav, dtype=np.float32).astype(np.float64)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
# ducking envelope from VO
blk = 480; rms = np.sqrt(np.convolve(vo ** 2, np.ones(blk * 8) / (blk * 8), 'same'))
duck = 1 - .55 * np.clip(rms / (rms.max() * .25), 0, 1)
duck = np.convolve(duck, np.ones(4800) / 4800, 'same')
mix = np.zeros((N, 2))
mix += np.stack([vo, vo], 1) * 1.0
mix += mus * duck[:, None] * .85
mix += sfx * .8
mix += amb * duck[:, None]
fade = np.ones(N); fs = int(107.0 * SR); fade[fs:] = np.linspace(1, 0, N - fs); mix *= fade[:, None]
mix /= np.abs(mix).max() * 1.05
mix.astype(np.float32).tofile(base + '/build/mix.f32')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', base + '/build/mix.f32',
                '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), base + '/build/mix.wav'], check=True)
os.remove(base + '/build/mix.f32'); os.remove(vo_wav)
print('ok')
