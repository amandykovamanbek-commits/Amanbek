#!/usr/bin/env python3
import sys, wave, numpy as np
A = sys.argv[1]  # audio dir
SR = 44100
D, NSC = 3.6, 11
TOTAL = D * NSC + 8.4
N = int(TOTAL * SR) + SR
out = np.zeros(N)
rng = np.random.default_rng(1)

def load(name):
    with wave.open(f"{A}/{name}.wav") as w:
        assert w.getframerate() == SR, name
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
    return x

def put(x, t, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    out[i:j] += x[:j - i] * g

def env(n, a=0.005, r=None):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if r: nr = int(r * SR); e[-nr:] *= np.linspace(1, 0, nr)
    return e

def lowpass(x, k):
    c = np.ones(k) / k
    return np.convolve(x, c, mode="same")

def boom(dur, f0, f1, g):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 3 / dur * 2)
    nz = lowpass(rng.standard_normal(n), 60) * np.exp(-t * 6 / dur) * 3
    return (s + nz) * g * env(n)

def whoosh(dur, g):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    nz = rng.standard_normal(n)
    sh = np.sin(np.pi * t) ** 2
    return (lowpass(nz, 12) - lowpass(nz, 80)) * sh * g * 4

def crack(g):
    n = int(0.6 * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n) * np.exp(-t * 18)
    clicks = np.zeros(n)
    for k in range(25):
        i = int(rng.uniform(0, 0.4) * SR); clicks[i:i + 60] += rng.standard_normal(60) * 0.8
    return (nz + clicks) * g

def flutter(dur, g):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = lowpass(rng.standard_normal(n), 6)
    am = (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t + rng.uniform(0, 6)))) * np.exp(-t * 1.2)
    return nz * am * g

def tone(f, dur, g):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * f * t) * g * env(len(t), 0.01, 0.02)

# ambience
street_end = 7 * D
n_st = int(street_end * SR)
amb = lowpass(rng.standard_normal(n_st), 40) * 0.25
# passing cars
for tc in (1.0, 6.2, 11.5, 17.0, 21.5):
    n = int(2.5 * SR); t = np.linspace(0, 1, n)
    car = lowpass(rng.standard_normal(n), 25) * np.exp(-((t - 0.5) / 0.22) ** 2) * 0.6
    i = int(tc * SR); amb[i:i + n] += car[:max(0, min(n, n_st - i))]
amb[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
put(amb, 0, 0.5)
# space hum / map hum
n = int((TOTAL - 7 * D) * SR); t = np.arange(n) / SR
put((np.sin(2 * np.pi * 55 * t) * 0.05 + lowpass(rng.standard_normal(n), 200) * 0.2) * env(n, 0.5, 1.0), 7 * D, 0.6)

for k in range(NSC):
    n_ = k + 1
    t0 = k * D
    if k > 0: put(whoosh(0.5, 0.25), t0 - 0.3)
    put(load(f"h{n_}"), t0 + 0.25, 1.0)
    if n_ >= 5: put(boom(1.6 + 0.15 * n_, 120, 30, 0.12 + 0.04 * (n_ - 5)), t0 + 0.3)
    if n_ == 3: put(flutter(1.8, 0.35), t0 + 0.35)
    if n_ in (6, 7): put(crack(0.5), t0 + 0.3)
    if n_ == 8:
        for j in range(12): put(tone(880 + j * 40, 0.06, 0.05), t0 + 0.6 + j * 0.18)   # city alarms
    if n_ == 10:
        for j in range(10): put(tone(300, 0.08, 0.08), t0 + 0.5 + j * 0.18)          # network down blips
    if n_ == 11: put(boom(3.0, 70, 20, 0.5), t0 + 0.3)

lines = {1: "who", 4: "grandma", 5: "woman", 7: "agree"}
for n_, name in lines.items():
    put(load(f"v_{name}"), (n_ - 1) * D + 1.55, 1.0)

# space scene
ts = NSC * D
put(whoosh(0.8, 0.3), ts - 0.4)
put(load("h12"), ts + 0.25, 1.0)
for j in range(4):   # ringtone 3.2 .. 4.7
    st = ts + 3.2 + j * 0.38
    put(tone(1318, 0.12, 0.12) + 0, st)
    put(tone(1046, 0.12, 0.12), st + 0.15)
put(tone(660, 0.05, 0.1), ts + 4.7)
put(load("v_yera"), ts + 4.9, 1.0)

# master: soft limiter + normalize
out = np.tanh(out * 1.3)
out = out / (np.abs(out).max() + 1e-9) * 0.95
out = out[:int(TOTAL * SR)]
fade = int(0.6 * SR); out[-fade:] *= np.linspace(1, 0, fade)
with wave.open(sys.argv[2], "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("ok", TOTAL)
