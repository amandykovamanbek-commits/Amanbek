"""Sound design + final mix for «Твоё место за столом». No voice-over: only music, ambience and effects.
Usage: python3 sfx.py  -> sfx.wav, mix_pre.wav (music + sfx, before loudness normalisation)"""
import numpy as np, wave, os
from scipy import signal

D = os.path.dirname(os.path.abspath(__file__))
SR = 48000; DUR = 89.5; N = int(SR * DUR)
L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
rng = np.random.default_rng(7)

def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)
def tt(d): return np.arange(int(d * SR)) / SR
def mx(*a):
    n = max(len(x) for x in a); return sum(np.pad(x, (0, n - len(x))) for x in a)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def pink(d):
    w = noise(d); b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]; a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w)
def env(n, a=0.005, r=0.1, shape=None):
    e = np.ones(n, np.float32); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def smooth_noise(d, rate, seed=0):
    r = np.random.default_rng(seed); k = max(2, int(d * rate) + 2); pts = r.uniform(0, 1, k)
    x = np.linspace(0, k - 1, int(d * SR)); return np.interp(x, np.arange(k), pts).astype(np.float32)
def add(t0, sig, g=1.0, pan=0.0, dest=None):
    Ld, Rd = dest if dest else (L, R)
    s0 = int(t0 * SR); s1 = min(len(Ld), s0 + len(sig))
    if s1 <= max(0, s0): return
    seg = sig[max(0, -s0): s1 - s0] * g
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    Ld[max(0, s0):s1] += seg * gl * 1.41; Rd[max(0, s0):s1] += seg * gr * 1.41
def reverb_ir(rt=1.2, d=None, seed=1):
    d = d or rt * 1.2; n = int(d * SR); r = np.random.default_rng(seed)
    e = np.exp(-6.9 * np.arange(n) / (rt * SR))
    irl = r.standard_normal(n) * e; irr = r.standard_normal(n) * e
    irl[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR)); irr[:int(0.015 * SR)] *= np.linspace(0, 1, int(0.015 * SR))
    return lp(irl, 6000) / np.sqrt((irl ** 2).sum()), lp(irr, 6000) / np.sqrt((irr ** 2).sum())
def verb(sig, rt=1.0, wet=0.4, seed=1):
    il, ir = reverb_ir(rt, seed=seed)
    wl = signal.fftconvolve(sig, il)[:len(sig) + len(il) // 2]; wr = signal.fftconvolve(sig, ir)[:len(sig) + len(il) // 2]
    dry = np.pad(sig, (0, len(wl) - len(sig)))
    return dry * (1 - wet) + wl * wet * 3, dry * (1 - wet) + wr * wet * 3

# ---------------- elementary sounds ----------------
def wind(d, seed=0):
    x = pink(d); x = bp(x, 120, 900)
    g = 0.35 + 0.65 * smooth_noise(d, 0.6, seed) ** 1.5
    whistle = bp(noise(d), 600, 1400) * 0.15 * smooth_noise(d, 0.3, seed + 5)
    return (x * g + whistle) * 0.5
def voice(d, f0=180, seed=0, rate=5.0, vowels=None):
    r = np.random.default_rng(seed); t = tt(d)
    f = f0 * (1 + 0.08 * np.sin(2 * np.pi * 0.7 * t + r.uniform(0, 6))) * (1 + 0.04 * smooth_noise(d, 3, seed))
    ph = np.cumsum(f / SR); src = (2 * (ph % 1) - 1) + 0.3 * r.standard_normal(len(t))
    V = vowels or [(700, 1200, 2500), (400, 2000, 2600), (500, 900, 2400), (300, 2200, 2900), (600, 1700, 2500)]
    out = np.zeros(len(t))
    syl = max(1, int(d * rate)); edges = np.linspace(0, len(t), syl + 1).astype(int)
    for i in range(syl):
        a, b = edges[i], edges[i + 1]; F = V[r.integers(len(V))]; seg = src[a:b]
        s = sum(bp(seg, F[k] * 0.85, F[k] * 1.15) * (1.0, 0.6, 0.3)[k] for k in range(3))
        s *= np.sin(np.linspace(0, np.pi, b - a)) ** 0.8 * (r.uniform(0.3, 1) if r.uniform() > 0.15 else 0)
        out[a:b] = s
    return out.astype(np.float32)
def babble(d, n=5, seed=0, f0s=(110, 240), muffle=1800):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(n):
        f0 = r.uniform(*f0s); v = voice(d, f0, seed * 31 + k, r.uniform(3.5, 6))
        v *= (0.4 + 0.6 * smooth_noise(d, 0.25, seed + k)) ** 2
        out += v
    return lp(out, muffle) * 0.25
def laugh(f0=420, n=5, form=(1000, 1700, 3300), breath=0.3, seed=0, rate=0.15):
    r = np.random.default_rng(seed); parts = []
    for i in range(n):
        d = rate * r.uniform(0.75, 1.1); t = tt(d); f = f0 * (1 - 0.06 * i / n) * (1 + 0.12 * (1 - t / d))
        ph = np.cumsum(f / SR); src = 2 * (ph % 1) - 1
        s = sum(bp(src, F * 0.88, F * 1.12) * w for F, w in zip(form, (1, 0.6, 0.3)))
        h = bp(r.standard_normal(len(t)), 900, 5000) * breath * np.exp(-t * 30)
        e = np.sin(np.pi * t / d) ** 0.6
        parts.append((s + h) * e); parts.append(np.zeros(int(r.uniform(0.03, 0.07) * SR)))
    return np.concatenate(parts).astype(np.float32) * 0.6
def click(f=3000, d=0.012, k=1.0):
    t = tt(d); x = bp(noise(d), f * 0.6, min(f * 1.8, 20000)) * np.exp(-t * 400) * k
    return x
def tick(tock=False):
    t = tt(0.06); f = 2400 if not tock else 1800
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + bp(noise(0.06), 3000, 9000) * np.exp(-t * 500) * 0.6 + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 120) * 0.4) * 0.6
def keyclick():
    t = tt(0.05); return (bp(noise(0.05), 1500, 7000) * np.exp(-t * 300) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 120) * 0.5) * 0.6
def whoosh(d, f0, f1, k=1.0):
    t = tt(d); x = noise(d); out = np.zeros_like(x); seg = int(0.02 * SR)
    for i in range(0, len(x), seg):
        u = i / len(x); fc = f0 + (f1 - f0) * u; out[i:i + seg] = bp(x[i:i + seg + 400], fc * 0.6, fc * 1.6)[:len(x[i:i + seg])]
    return out * np.sin(np.pi * t / d) ** 2 * k
def chime(freqs, d=0.9, k=0.3):
    t = tt(d); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (5 + i * 2)) * (0.6 ** i) for i, f in enumerate(freqs)) * k
def buzz(d):
    t = tt(d); x = (np.sign(np.sin(2 * np.pi * 165 * t)) * 0.5 + np.sin(2 * np.pi * 330 * t) * 0.3) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return lp(x, 1200) * env(len(t), 0.01, 0.03) * 0.5
def hum(d, f=50, k=0.02):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t) + 0.1 * lp(noise(d), 300)) * k
def clink(seed=0, k=0.3):
    r = np.random.default_rng(seed); t = tt(0.9)
    return sum(np.sin(2 * np.pi * f * r.uniform(0.97, 1.03) * t) * np.exp(-t * dcy) * a for f, dcy, a in [(2350, 6, 1), (3480, 8, 0.6), (5120, 11, 0.35), (6900, 14, 0.2)]) * k
def heartbeat():
    t = tt(0.5); lub = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 18) + np.sin(2 * np.pi * 95 * t) * np.exp(-t * 40) * 0.4
    dub = np.zeros_like(t); o = int(0.21 * SR); dub[o:] = (np.sin(2 * np.pi * 64 * t[:-o]) * np.exp(-t[:-o] * 22) * 0.7)
    return (lub + dub) * 0.9
def thump(f=70, d=0.35, k=1.0):
    t = tt(d); return (np.sin(2 * np.pi * f * t * (1 - 0.3 * t)) * np.exp(-t * 14) + lp(noise(d), 800) * np.exp(-t * 60) * 0.5) * k
def crunch(k=1.0, seed=0):
    r = np.random.default_rng(seed); d = 0.22; n = int(d * SR); x = np.zeros(n)
    for _ in range(60): p = r.integers(0, n - 300); x[p:p + 300] += r.standard_normal(300) * np.exp(-np.arange(300) / 40) * r.uniform(0.2, 1)
    x = bp(x, 400, 6000) * np.sin(np.linspace(0, np.pi, n)) ** 0.5
    return (x + thump(90, d, 0.3)[:n]) * k
def footstep(k=1.0): return (thump(85, 0.18, 0.8) + bp(noise(0.18), 200, 2500) * np.exp(-tt(0.18) * 50) * 0.3) * k
def breath(inhale=True, d=0.5, k=0.3):
    t = tt(d); x = bp(noise(d), 700 if inhale else 400, 3200 if inhale else 1800)
    e = (t / d) ** 1.5 * (1 - (t / d) ** 6) if inhale else np.sin(np.pi * np.minimum(t / d * 1.3, 1)) * (1 - t / d)
    return x * e * k
def knock():
    t = tt(0.18); return (np.sin(2 * np.pi * 1180 * t) * np.exp(-t * 60) * 0.6 + np.sin(2 * np.pi * 2450 * t) * np.exp(-t * 90) * 0.35 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 45) * 0.8 + bp(noise(0.18), 1500, 6000) * np.exp(-t * 400) * 0.5)
def horn(d=2.2):
    t = tt(d); out = np.zeros_like(t)
    for f in (277.2, 349.2, 415.3):
        ph = np.cumsum(f * (1 - 0.03 * t / d) / SR); out += (2 * (ph % 1) - 1)
    out = lp(out, 1800) * env(len(t), 0.12, 0.9)
    return out * 0.25
def rails(t0, t1, i0, i1):
    out = []; t = t0
    while t < t1:
        u = (t - t0) / (t1 - t0); out.append(t); out.append(t + 0.11); t += i0 + (i1 - i0) * u
    return out
def firework(boom=1.0, crackle=1.0, seed=0):
    r = np.random.default_rng(seed); d = 2.4; n = int(d * SR); t = tt(d)
    b = np.sin(2 * np.pi * 42 * t * (1 - 0.15 * t)) * np.exp(-t * 3.2) * 0.8 + lp(noise(d), 700) * np.exp(-t * 5) * 0.6
    c = np.zeros(n)
    for _ in range(140):
        p = int(r.uniform(0.25, 1.9) * SR); L2 = 200
        if p + L2 < n: c[p:p + L2] += r.standard_normal(L2) * np.exp(-np.arange(L2) / 25) * r.uniform(0.1, 1) * np.exp(-(p / SR - 0.3) * 1.2)
    return lp(b, 900) * boom + hp(c, 1500) * crackle * 0.5
def whistle(d=0.7):
    t = tt(d); f = 900 + 1700 * t / d; ph = np.cumsum(f / SR)
    return np.sin(2 * np.pi * ph) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t)) * env(len(t), 0.05, 0.05) * 0.08
def rustle(d=0.45, k=0.4):
    t = tt(d); return bp(noise(d), 1800, 7000) * smooth_noise(d, 30, 3) ** 2 * np.sin(np.pi * t / d) * k
def creak(d=0.5):
    t = tt(d); f = 260 + 140 * t / d + 20 * np.sin(2 * np.pi * 9 * t); ph = np.cumsum(f / SR)
    x = (2 * (ph % 1) - 1) * (0.5 + 0.5 * (np.sin(2 * np.pi * 70 * t) > 0)); return bp(x, 300, 2500) * np.sin(np.pi * t / d) * 0.15
def carpass(d=4.0, tc=2.0):
    t = tt(d); rel = (t - tc); dist = np.sqrt(rel ** 2 * 900 + 9)
    f = 95 * (1 + 0.12 * np.tanh(-rel * 2)); ph = np.cumsum(f / SR)
    eng = (2 * (ph % 1) - 1) + 0.5 * np.sin(2 * np.pi * 2 * ph)
    tire = bp(noise(d), 200, 2500)
    a = 1 / (dist / 3) ** 1.2
    return (lp(eng, 900) * 0.4 + tire * 0.6) * a * 0.6, np.clip(-rel * 0.6, -1, 1)

# ---------------- timeline ----------------
add(0, wind(5.2, 1) * env(int(5.2 * SR), 1.2, 0.5), 0.55)
add(0.6, babble(4.6, 7, 3, (140, 320), 1200) * env(int(4.6 * SR), 1.0, 0.6), 0.5, -0.3)
for tl, f0, sd in [(1.4, 300, 1), (2.9, 420, 2), (3.8, 220, 3)]: add(tl, lp(laugh(f0, 4, seed=sd), 1500), 0.22, 0.4)
add(5.0, hum(4.0, 120, 0.004) + lp(noise(4.0), 250) * 0.01, 1.0)
for t0 in np.concatenate([np.arange(5.05, 6.45, 0.13), np.arange(8.55, 9.0, 0.12)]): add(t0 + rng.uniform(0, 0.04), keyclick(), 0.18 * rng.uniform(0.6, 1), 0.15)
add(5.0, lp(noise(12.0), 400) * 0.006, 1.0)  # room tone
for wt in [9.35, 9.65, 9.9, 10.2, 10.95, 11.2, 11.5, 11.8, 12.1]:
    for j in range(3): add(wt - 0.1 + j * 0.05, click(3200, 0.01, 0.12), 1.0, 0.05)
add(12.45, whoosh(0.35, 800, 3500, 0.22), 1.0, 0.2)
add(16.0, chime([1568, 2349], 0.5, 0.12), 1.0)
add(13.0, lp(noise(4.0), 300) * 0.004, 1.0)
for s in np.arange(17.0, 20.0, 1.0): add(s, tick(int(s) % 2 == 1), 0.12, 0.35)
# flashback: kids' laughter, snow swishes, warm wind
add(20.0, wind(5.0, 4) * 0.4 * env(int(5 * SR), 0.6, 0.3), 0.4)
for tl, f0, sd in [(20.6, 430, 11), (21.7, 450, 12), (22.6, 420, 13), (23.5, 460, 14)]: add(tl, laugh(f0, 6, seed=sd), 0.17, 0.25)
for tl, sd in [(21.0, 21), (22.9, 22)]: add(tl, laugh(210, 4, form=(750, 1250, 2500), seed=sd), 0.12, -0.25)
for k in range(8): add(20.2 + k * 0.62, bp(noise(0.5), 1500, 6000) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.15, 1.0, -0.2)
# sink: fridge hum, fork clinks
add(25.0, hum(5.0, 50, 0.006), 1.0, -0.3)
for tc in [25.35, 25.9, 26.5]: add(tc, clink(int(tc * 10), 0.06), 1.0, 0.1)
# phone buzz + notification
add(27.4, buzz(0.35), 0.5); add(27.95, buzz(0.35), 0.5); add(27.62, chime([1318.5, 1975.5], 0.7, 0.2), 1.0)

# ---- the family video (through the phone speaker), 30.0-41.5 ----
VL = np.zeros(N, np.float32); VR = np.zeros(N, np.float32); vd = (VL, VR)
add(30.0, babble(11.5, 6, 9, (120, 260), 3500), 0.9, 0, vd)
for tl, f0, form, sd in [(31.5, 150, (700, 1150, 2400), 31), (31.7, 230, (850, 1300, 2600), 32), (33.0, 260, (850, 1350, 2700), 33), (34.6, 160, (700, 1100, 2400), 34)]: add(tl, laugh(f0, 5, form, seed=sd), 0.6, 0, vd)
for tl, sd in [(32.1, 41), (33.25, 42), (35.0, 43), (38.9, 44)]: add(tl, laugh(470, 4, seed=sd), 0.55, 0, vd)
add(31.75, clink(5, 0.5), 1.0, 0, vd); add(31.9, clink(6, 0.35), 1.0, 0, vd)
for ts in np.arange(31.65, 32.85, 0.17): add(ts, footstep(0.5), 1.0, 0, vd)
for ts in np.arange(36.25, 37.1, 0.3): add(ts, footstep(0.35), 1.0, 0, vd)
add(37.6, rustle(0.6, 0.6), 1.0, 0, vd)
w = wave.open(os.path.join(D, 'tv.wav')); tv = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float32) / 32768
tvm = lp(tv.mean(1), 2500)[:N]; VL[:len(tvm)] += tvm * 0.35; VR[:len(tvm)] += tvm * 0.35
vg = np.ones(N, np.float32); tl_ = np.arange(N) / SR
vg *= np.clip((tl_ - 29.9) / 0.3, 0, 1) * (1 - np.clip((tl_ - 40.2) / 1.6, 0, 1)) * (1 - 0.6 * np.clip((tl_ - 40.0) / 0.4, 0, 1))
inside = np.clip((tl_ - 31.0) / 0.6, 0, 1) * (1 - np.clip((tl_ - 39.9) / 0.3, 0, 1))
for X, out in [(VL, L), (VR, R)]:
    tinny = bp(X, 350, 4500, 3); full = bp(X, 120, 7000, 2)
    out += (tinny * (1 - inside) * 0.55 + full * inside * 0.45) * vg
# ---- station flashback ----
add(44.25, horn(2.4), 0.22, 0.5); add(44.0, wind(4.0, 9) * 0.5, 0.3)
for tr in rails(44.6, 48.0, 0.55, 0.22): add(tr, mx(thump(110, 0.12, 0.25), click(2000, 0.02, 0.2)), 0.25, 0.0)
add(44.3, babble(3.6, 4, 17, (150, 280), 1400), 0.25, -0.4)
for k in range(10): add(44.2 + k * 0.38, rustle(0.4, 0.25), 1.0, rng.uniform(-0.6, 0.6))
# ---- 23:08: ticking louder, heartbeat ----
for s in np.arange(48.0, 53.0, 1.0): add(s, tick(int(s) % 2 == 1), 0.22 + 0.12 * (s - 48) / 5, 0.3)
add(48.0, hum(5.0, 50, 0.012), 1.0, -0.3)
hb, t0 = [], 50.0
while t0 < 53.0: hb.append(t0); t0 += 1.0 - 0.45 * (t0 - 50.0) / 3.0
for h in hb: add(h, heartbeat(), 0.32 + 0.18 * (h - 50) / 3)
add(51.0, whoosh(2.0, 300, 6000, 0.2) * np.linspace(0.2, 1, int(2.0 * SR)) ** 2, 1.0)
add(52.4, breath(True, 0.55, 0.5), 1.0)
# ---- the decision ----
add(53.02, mx(whoosh(0.4, 400, 1500, 0.3), rustle(0.4, 0.3)), 1.0, -0.1)
for k, ts in enumerate([53.6, 53.85, 54.1]): add(ts, footstep(0.5), 1.0, -0.2 - k * 0.1)
add(54.45, rustle(0.5, 0.5), 1.0, -0.3); add(54.55, whoosh(0.3, 600, 2500, 0.25), 1.0, -0.3)
sl, sr_ = verb(mx(thump(62, 0.5, 1.4), bp(noise(0.06), 400, 5000) * np.exp(-tt(0.06) * 60) * 1.2), 0.9, 0.45, 3)
add(55.32, sl, 0.42, -0.2); add(55.32, sr_, 0.42, 0.2)
for k in range(4): add(55.4 + k * 0.035, click(1800, 0.015, 0.4), 1.0, -0.3)
# ---- the run ----
add(56.0, wind(4.0, 12) * 0.5, 0.45)
step = 1 / 3.6
for k, ts in enumerate(np.arange(56.07, 60.0, step)): add(ts, crunch(0.9, k), 0.55, -0.1 if k % 2 else 0.1)
for ts in np.arange(56.1, 60.0, 0.42): add(ts, breath(False, 0.35, 0.55), 1.0)
for ts in np.arange(56.3, 60.0, 0.42): add(ts, breath(True, 0.18, 0.35), 1.0)
add(56.4, babble(3.4, 6, 25, (140, 300), 1600), 0.18, 0.4)
# ---- taxi ----
cp, pan = carpass(4.0, 1.95)
for i in range(0, len(cp), 4800):
    seg = cp[i:i + 4800]; p = float(pan[min(i, len(pan) - 1)]); add(60.0 + i / SR, seg, 0.9, p)
add(61.7, whoosh(0.7, 300, 1200, 0.8), 1.0, -0.6)
add(62.0, lp(noise(2.0), 160) * 0.12 + hum(2.0, 38, 0.02), 1.0)
for k in range(16): add(60.6 + 3.0 * (k + 0.5) / 16, click(4200, 0.008, 0.25), 1.0, 0.0)
for ts in [62.55, 63.27]: add(ts, whoosh(0.45, 500, 1500, 0.25), 1.0, -0.8)
# ---- 23:58 at the window: silence, wind, breath, distant fireworks ----
add(64.0, wind(7.0, 15) * env(int(7 * SR), 0.4, 0.5), 0.38)
for k, ts in enumerate([64.05, 64.33, 64.6]): add(ts, crunch(0.7, 40 + k), 0.4)
for ts in np.arange(64.4, 71.0, 1.15): add(ts, breath(False, 0.6, 0.45), 1.0); add(ts + 0.62, breath(True, 0.45, 0.3), 1.0)
for ts, sd in [(65.3, 1), (66.8, 2), (67.6, 3)]: add(ts, lp(firework(0.4, 0.3, sd), 600), 0.25, rng.uniform(-0.7, 0.7))
kl, kr = verb(np.concatenate([knock(), np.zeros(int(0.07 * SR)), knock() * 0.9, np.zeros(int(0.07 * SR)), knock() * 1.05]), 0.5, 0.25, 4)
add(68.25, kl, 0.38, -0.15); add(68.25, kr, 0.38, 0.15)
add(69.35, breath(True, 0.3, 0.35), 1.0, 0.2)
for ts in np.arange(70.3, 71.1, 0.16): add(ts, footstep(0.45), 1.0, 0.2)
# ---- the reunion ----
add(71.08, mx(click(1500, 0.03, 0.6), creak(0.45)), 1.0, 0.1)
add(71.1, babble(4.0, 6, 51, (130, 280), 2500) * env(int(4 * SR), 0.2, 1.0), 0.45, 0.1)
add(71.1, whoosh(0.8, 200, 900, 0.5), 1.0)
fw = [(71.6, 0), (72.1, 1), (72.5, 0), (72.75, 1), (72.9, 0), (73.2, 1), (73.5, 0), (73.7, 1), (74.0, 0), (74.1, 1), (74.5, 0), (74.9, 1), (75.3, 0)]
for k, (tb, wh) in enumerate(fw):
    if wh: add(tb - 0.65, whistle(0.6), 1.0, rng.uniform(-0.5, 0.5))
    add(tb + 0.08, firework(0.9, 1.0, k + 10), 0.22, rng.uniform(-0.6, 0.6))
for tl, sd in [(72.4, 61), (73.3, 62)]: add(tl, laugh(460, 5, seed=sd), 0.3, 0.0)
add(72.0, breath(False, 0.8, 0.4), 1.0)
# ---- the family table ----
add(75.0, babble(3.2, 6, 71, (130, 300), 3000) * env(int(3.2 * SR), 0.3, 1.2), 0.5)
for tc in [75.6, 75.75, 75.95, 76.1]: add(tc, clink(int(tc * 7), 0.25), 1.0, rng.uniform(-0.4, 0.4))
for tl, f0, sd in [(75.3, 470, 81), (76.2, 200, 82), (76.5, 300, 83)]: add(tl, laugh(f0, 5, seed=sd), 0.3, rng.uniform(-0.3, 0.3))
add(75.0, wind(4.0, 30) * 0.0, 0.0)

# ---------------- music + final mix ----------------
def readwav(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
    out = np.zeros((N, 2), np.float32); m = min(N, len(a)); out[:m] = a[:m]; return out
mus = readwav(os.path.join(D, 'score.wav'))
t = np.arange(N) / SR
g = np.ones(N, np.float32)
def cut(t0, t1, fade=0.015): g[(t >= t0 + fade) & (t < t1)] = 0; m = (t >= t0) & (t < t0 + fade); g[m] *= 1 - (t[m] - t0) / fade
cut(25.0, 36.0); cut(64.0, 70.7); g[t >= 87.0] *= np.clip(1 - (t[t >= 87.0] - 87.0) / 2.0, 0, 1)
mus *= g[:, None] * 1.0
sfx = np.stack([L, R], 1)
# master fades
master = np.clip(t / 0.8, 0, 1)
mix = (mus * 1.0 + sfx * 0.9) * master[:, None]
def save(p, a):
    a = np.clip(a, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a * 32767).astype(np.int16).tobytes()); w.close()
save(os.path.join(D, 'sfx.wav'), sfx * 0.5)
from scipy.io import wavfile
wavfile.write(os.path.join(D, 'mix_pre.wav'), SR, (mix * 0.5).astype(np.float32))
print('peak', float(np.abs(mix).max()))
