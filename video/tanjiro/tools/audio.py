"""Procedural score + SFX + voice mix (numpy only, deterministic).
One event list (the shots' sfx/music tags in src/shots) drives both picture and sound.
usage: python3 tools/audio.py -> public/audio/{music,sfx,voice,mix}.wav"""
import sys, json, subprocess, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from events import shots, GAP, INTRO, OUTRO

SR = 48000
here = pathlib.Path(__file__).parent.parent
out = here / 'public' / 'audio'; out.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)
tl, SHOTS = shots()
CH = tl['chapters']
TOTAL = tl['end'] + OUTRO
N = int(TOTAL * SR) + SR

# ----------------------------------------------------------------- helpers
def T(d): return np.arange(int(d * SR)) / SR
def fft_band(x, lo=0, hi=SR / 2, soft=0.15):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo > 0: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** (2 / soft * 0.1))
    if hi < SR / 2: g *= 1 / (1 + (f / hi) ** (2 / soft * 0.1))
    return np.fft.irfft(X * g, len(x)).astype(np.float32)
def noise(d, color='white', seed=None):
    r = np.random.default_rng(seed) if seed is not None else rng
    x = r.standard_normal(int(d * SR)).astype(np.float32)
    if color == 'white': return x
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); f[0] = 1
    X *= (1 / np.sqrt(f)) if color == 'pink' else (1 / f)
    y = np.fft.irfft(X, len(x)).astype(np.float32)
    return y / (np.abs(y).max() + 1e-9)
def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-3))
    return e.astype(np.float32)
def sweep(f0, f1, d, kind='exp'):
    t = T(d)
    f = f0 * (f1 / f0) ** (t / d) if kind == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)
def norm(x, p=1.0): return (x / (np.abs(x).max() + 1e-9) * p).astype(np.float32)
def add(track, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= track.shape[1] or len(x) == 0: return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), track.shape[1] - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    track[0, i:i + n] += x[:n] * g * l * 1.414
    track[1, i:i + n] += x[:n] * g * r * 1.414

# ----------------------------------------------------------------- SFX ----
def s_whoosh(d=0.7, size=1.0):
    n = noise(d, 'pink'); t = T(d)
    lo = fft_band(n, 150 / size, 900 / size); hi = fft_band(n, 900, 5000)
    k = t / d
    shape = np.sin(np.pi * np.minimum(1, k / 0.65) * 0.5) ** 2 * np.exp(-np.maximum(0, k - 0.65) * 6)
    return norm((lo * (1 - k) + hi * k * 0.7) * shape, 0.9)
def s_slash():
    a = norm(fft_band(noise(0.18), 2500, 9000) * env(int(0.18 * SR), 0.004, 0.12), 0.9)
    ring = sum(np.sin(2 * np.pi * f * T(0.7)) * env(int(0.7 * SR), 0.002, 0.5 * w) * w for f, w in [(2210, 0.5), (3705, 0.35), (5120, 0.2), (6900, 0.1)])
    x = np.zeros(int(0.7 * SR), np.float32); x[:len(a)] += a; x += ring.astype(np.float32) * 0.5
    return norm(x + s_whoosh(0.7, 0.6) * 0.5, 0.95)
def s_hit(f0=90, f1=42, d=0.45):
    body = sweep(f0, f1, d) * env(int(d * SR), 0.002, d * 0.6)
    click = fft_band(noise(d), 0, 2500) * env(int(d * SR), 0.001, 0.04)
    return norm(body + click * 0.7, 1.0)
def s_thud(): return s_hit(70, 35, 0.5)
def s_slap(): return norm(fft_band(noise(0.12), 900, 7000) * env(int(0.12 * SR), 0.001, 0.05), 0.9)
def s_boom(d=2.2):
    sub = sweep(62, 26, d) * env(int(d * SR), 0.003, d * 0.5)
    rumble = fft_band(noise(d, 'brown'), 0, 400) * env(int(d * SR), 0.01, d * 0.7)
    crack = fft_band(noise(d), 300, 6000) * env(int(d * SR), 0.001, 0.08)
    return norm(sub * 1.0 + rumble * 0.8 + crack * 0.5, 1.0)
def s_explosion():
    b = s_boom(3.5)
    cr = np.zeros_like(b); c = fft_band(noise(3.5), 1500, 8000)
    for k in range(60):
        i = int(rng.uniform(0.05, 3.0) * SR); n = int(0.02 * SR)
        cr[i:i + n] += c[i:i + n] * np.exp(-np.arange(n) / (0.004 * SR)) * rng.uniform(0.2, 0.8)
    return norm(b + cr * 0.4, 1.0)
def s_clang():
    d = 1.2; t = T(d)
    x = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * env(len(t), 0.001, d * w) * w for f, w in [(523, 1), (1187, 0.7), (1992, 0.5), (2849, 0.35), (4105, 0.2)])
    return norm(x, 0.9)
def s_crack():
    x = np.zeros(int(0.5 * SR), np.float32)
    for k, tt in enumerate([0, 0.07, 0.16]):
        b = fft_band(noise(0.08), 500, 6000) * env(int(0.08 * SR), 0.0005, 0.02)
        i = int(tt * SR); x[i:i + len(b)] += b * (1 - k * 0.3)
    return norm(x, 0.9)
def s_coin():
    d = 0.9; t = T(d)
    return norm(sum(np.sin(2 * np.pi * f * t) * env(len(t), 0.001, d * w) * w for f, w in [(2637, 1), (4186, 0.6), (6272, 0.3)]), 0.6)
def s_chime(base=1320, d=2.5):
    t = T(d)
    return norm(sum(np.sin(2 * np.pi * base * m * t) * env(len(t), 0.002, d * w) * a for m, w, a in [(1, 1, 0.6), (2.76, 0.5, 0.25), (5.4, 0.3, 0.12)]), 0.6)
def s_bell():
    d = 5.0; t = T(d)
    x = sum(np.sin(2 * np.pi * f * t) * env(len(t), 0.003, d * w) * a for f, w, a in [(110, 1, 0.8), (111.3, 1, 0.5), (220, 0.8, 0.5), (303, 0.6, 0.3), (594, 0.4, 0.2), (1210, 0.2, 0.1)])
    return norm(x, 0.8)
def s_drum(f0=120, f1=58):
    d = 1.1
    body = sweep(f0, f1, d) * env(int(d * SR), 0.002, 0.55)
    skin = fft_band(noise(d), 80, 1500) * env(int(d * SR), 0.001, 0.05)
    return norm(body + skin * 0.6, 1.0)
def s_heart():
    x = np.zeros(int(0.9 * SR), np.float32)
    for tt, g in [(0, 1), (0.22, 0.7)]:
        b = sweep(65, 40, 0.25) * env(int(0.25 * SR), 0.004, 0.12) * g
        i = int(tt * SR); x[i:i + len(b)] += b
    return norm(x, 1.0)
def s_fire(d=2.2):
    roar = fft_band(noise(d, 'pink'), 80, 1200) * np.sin(np.pi * np.minimum(1, T(d) / d)) ** 0.5
    cr = np.zeros(int(d * SR), np.float32); c = fft_band(noise(d), 1200, 9000)
    for k in range(int(d * 35)):
        i = int(rng.uniform(0, d - 0.02) * SR); n = int(0.006 * SR)
        cr[i:i + n] += c[i:i + n] * rng.uniform(0.2, 1.0)
    return norm(roar * 0.8 + cr * 0.5 + s_whoosh(d, 0.8)[: int(d * SR)] * 0.5, 0.9)
def s_water(d=1.4):
    n = fft_band(noise(d, 'pink'), 400, 5000)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * (6 + 10 * T(d) / d) * T(d))
    gl = sweep(300, 1400, d) * 0.15 * env(int(d * SR), 0.05, d)
    return norm((n * am + gl) * np.sin(np.pi * T(d) / d) ** 0.7, 0.9)
def s_thunder():
    d = 3.8
    crack = fft_band(noise(0.3), 200, 9000) * env(int(0.3 * SR), 0.001, 0.12)
    rum = fft_band(noise(d, 'brown'), 0, 300) * env(int(d * SR), 0.05, d * 0.8)
    x = rum.copy(); x[:len(crack)] += crack * 1.2
    return norm(x, 1.0)
def s_wind(d=8.0, seed=None):
    n = fft_band(noise(d, 'pink', seed), 150, 1400)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 0.21 * T(d) + 1) * np.sin(2 * np.pi * 0.09 * T(d))
    fade = np.minimum(1, np.minimum(T(d), d - T(d)) / 1.2)
    return norm(n * am * fade, 0.8)
def s_crowd(d=5.0):
    n = fft_band(noise(d, 'pink'), 250, 2500)
    am = np.ones(int(d * SR), np.float32)
    for k in range(40):
        c = rng.uniform(0, d); w = rng.uniform(0.15, 0.5)
        am += 0.8 * np.exp(-((T(d) - c) / w) ** 2)
    fade = np.minimum(1, np.minimum(T(d), d - T(d)) / 0.8)
    return norm(n * am * fade, 0.7)
def s_train(d=6.0):
    x = fft_band(noise(d, 'brown'), 0, 250) * 0.5
    for k in range(int(d / 0.42)):
        for o in (0, 0.11):
            b = s_hit(160, 90, 0.12) * 0.5
            i = int((k * 0.42 + o) * SR); x[i:i + len(b)] += b[: max(0, len(x) - i)]
    fade = np.minimum(1, np.minimum(T(d), d - T(d)) / 0.8)
    return norm(x * fade, 0.8)
def s_growl(d=1.8):
    t = T(d)
    saw = ((t * 52) % 1 * 2 - 1) + ((t * 52.7) % 1 * 2 - 1)
    x = fft_band(saw.astype(np.float32), 0, 600) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t))
    x += fft_band(noise(d, 'brown'), 0, 300) * 0.6
    return norm(x * np.sin(np.pi * t / d) ** 0.6, 0.9)
def s_riser(d=2.0):
    t = T(d)
    x = fft_band(noise(d, 'pink'), 300, 6000) * (t / d) ** 2 + sweep(200, 1800, d) * 0.3 * (t / d)
    return norm(x, 0.8)
def s_scream(): return s_riser(1.4) * 0.6  # no human voices in SFX
def s_breath(d=1.4):
    t = T(d)
    return norm(fft_band(noise(d, 'pink'), 300, 3000) * np.sin(np.pi * t / d) ** 2, 0.6)
def s_unsheathe(d=0.6):
    t = T(d)
    x = fft_band(noise(d), 3000, 9000) * (t / d) * 0.7
    ring = sum(np.sin(2 * np.pi * f * t) * w for f, w in [(3100, 0.4), (4700, 0.25)]) * np.exp(-np.maximum(0, t - d * 0.8) * 6) * (t > d * 0.8)
    return norm(x + ring.astype(np.float32), 0.8)
def s_wings():
    x = np.zeros(int(1.0 * SR), np.float32)
    for k in range(5):
        b = fft_band(noise(0.1, 'pink'), 100, 1500) * env(int(0.1 * SR), 0.01, 0.05)
        i = int(k * 0.17 * SR); x[i:i + len(b)] += b
    return norm(x, 0.7)
def s_pop(): return norm(sweep(620, 160, 0.08) * env(int(0.08 * SR), 0.001, 0.05), 0.8)
def s_kick(): return s_hit(110, 50, 0.35)
SFX = dict(whoosh=s_whoosh, slash=s_slash, hit=s_hit, thud=s_thud, slap=s_slap, boom=s_boom, explosion=s_explosion, clang=s_clang,
           crack=s_crack, coin=s_coin, chime=s_chime, bell=s_bell, drum=s_drum, heart=s_heart, fire=s_fire, water=s_water,
           thunder=s_thunder, wind=s_wind, crowd=s_crowd, train=s_train, growl=s_growl, riser=s_riser, scream=s_scream,
           breath=s_breath, unsheathe=s_unsheathe, wings=s_wings, pop=s_pop, kick=s_kick)
SFX_GAIN = dict(wind=0.35, crowd=0.35, train=0.5, fire=0.6, bell=0.7, chime=0.6, boom=0.95, explosion=1.0, heart=0.9, growl=0.7)

sfx = np.zeros((2, N), np.float32)
cache = {}
def sound(name, seed):
    key = (name, seed % 3)
    if key not in cache:
        global rng
        rng = np.random.default_rng(1000 + hash(name) % 1000 + seed % 3)
        cache[key] = SFX[name]()
    return cache[key]
n_ev = 0
for s in SHOTS:
    for ev in s['sfx']:
        off, name = ev[0], ev[1]
        g = ev[2] if len(ev) > 2 else 0.8
        if name not in SFX: print('unknown sfx', name); continue
        x = sound(name, n_ev)
        pitch_pan = ((n_ev * 37) % 11 - 5) / 12
        add(sfx, x, s['start'] + off, g * SFX_GAIN.get(name, 0.8), pitch_pan * 0.5)
        n_ev += 1
    if s['cut'] == 'flash':
        add(sfx, sound('whoosh', n_ev), s['start'] - 0.25, 0.35, 0.0)
# chapter cards: ink swoosh + taiko + low bell
for c in CH:
    if c['i'] == 0: continue
    t0 = c['start'] - GAP
    add(sfx, s_whoosh(0.9, 1.4), t0, 0.5)
    add(sfx, sound('drum', c['i']), t0 + 0.4, 0.75)
    add(sfx, sound('bell', c['i']), t0 + 0.45, 0.35)
print('sfx events', n_ev)

# ----------------------------------------------------------------- MUSIC ----
D = 146.83  # D3
SCALES = {'yo': [0, 2, 5, 7, 9], 'in': [0, 1, 5, 7, 8], 'min': [0, 3, 5, 7, 10]}
MOOD = {
    #         scale   bpm  pad   koto  rate  flute perc  bright
    'calm':   ('yo',  70, 0.5, 0.55, 2, 0.0, None, 0.6),
    'warm':   ('yo',  76, 0.55, 0.6, 2, 0.5, None, 0.8),
    'theme':  ('yo',  80, 0.6, 0.6, 2, 0.8, 'soft', 1.0),
    'sad':    ('in',  60, 0.6, 0.45, 1, 0.55, None, 0.4),
    'tense':  ('in',  92, 0.5, 0.45, 4, 0.0, 'pulse', 0.5),
    'dread':  ('in',  60, 0.75, 0.15, 1, 0.0, 'heart', 0.2),
    'battle': ('in', 132, 0.45, 0.6, 4, 0.0, 'taiko', 0.9),
    'epic':   ('min', 112, 0.6, 0.6, 4, 0.7, 'taiko', 1.0),
    'training': ('yo', 100, 0.45, 0.55, 4, 0.0, 'light', 0.7),
    'mystic': ('in',  64, 0.6, 0.35, 1, 0.0, 'bells', 0.5),
    'comedy': ('yo', 112, 0.35, 0.65, 4, 0.0, 'light', 0.9),
    'dream':  ('yo',  66, 0.6, 0.3, 1, 0.3, 'bells', 0.6),
    'kagura': ('yo',  84, 0.5, 0.4, 2, 0.9, 'kagura', 0.9),
}
MOTIF = [(0, 1), (2, 0.5), (3, 0.5), (4, 1.5), (3, 0.5), (2, 1), (1, 1), (0, 2), (4, 1), (5, 1), (4, 0.5), (3, 0.5), (2, 2)]

def koto(f, d=1.6, vel=1.0):
    t = T(d)
    x = np.zeros(len(t), np.float32)
    for h in range(1, 9):
        fh = f * h * (1 + 0.0008 * h * h)
        x += (np.sin(2 * np.pi * fh * t) * np.exp(-t * (2.2 + h * 1.1)) / h ** 1.1).astype(np.float32)
    att = fft_band(noise(0.02), 1500, 8000) * 0.15
    x[:len(att)] += att
    return x * vel * np.minimum(1, t / 0.002)
def flute(f, d, vel=1.0):
    t = T(d)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.4)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    br = fft_band(noise(d, 'pink'), f * 0.8, f * 4) * 0.25
    e = np.minimum(1, t / 0.12) * np.minimum(1, (d - t) / 0.25)
    return ((x + br) * e * vel).astype(np.float32)
def pad(f, d):
    t = T(d)
    x = sum(np.sin(2 * np.pi * f * m * (1 + dt) * t + p) * a for m, dt, a, p in [(1, 0, 0.5, 0), (1, 0.003, 0.4, 1), (1.5, 0, 0.25, 2), (2, -0.002, 0.15, 3), (0.5, 0, 0.35, 4)])
    sw = 0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t)
    e = np.minimum(1, np.minimum(t, d - t) / 1.5)
    return (x * sw * e).astype(np.float32)

music = np.zeros((2, N), np.float32)
# sections from music tags
secs = []
cur = 'calm'
for s in SHOTS:
    if s['music'] and s['music'] != cur or not secs:
        secs.append([max(0, s['start'] - 0.3), s['music'] or cur])
        cur = s['music'] or cur
secs = [(a, b if i + 1 < len(secs) else TOTAL, m) for i, ((a, m), (b, _)) in enumerate(zip(secs, secs[1:] + [[TOTAL, None]]))]
mrng = np.random.default_rng(11)
for si, (a, b, m) in enumerate(secs):
    scale, bpm, gp, gk, rate, gf, perc, br = MOOD[m]
    sc = SCALES[scale]
    beat = 60 / bpm
    dur = b - a
    if dur < 0.5: continue
    sec = np.zeros((2, int((dur + 4) * SR)), np.float32)
    # pad: root + fifth drone
    root = D / 2 if m in ('dread', 'battle', 'tense') else D
    p = pad(root, dur + 2) * gp
    add(sec, p, 0, 0.5, -0.2); add(sec, pad(root * 1.5, dur + 2) * gp, 0, 0.25, 0.3)
    # koto arpeggio
    step = beat / rate
    nsteps = int(dur / step)
    deg = 0
    for k in range(nsteps):
        if mrng.random() > (0.92 if rate >= 4 else 0.85): continue
        deg = int(np.clip(deg + mrng.choice([-2, -1, 1, 1, 2, 0]), -2, 8))
        oct_, idx = divmod(deg, 5)
        f = D * 2 ** ((sc[idx] + 12 * oct_) / 12)
        accent = 1.0 if k % rate == 0 else 0.6
        add(sec, koto(f, 1.6 if rate < 4 else 0.9, accent * gk), k * step, 0.35, ((k * 7) % 9 - 4) / 6)
    # melody: the main motif (the through-line) on flute
    if gf > 0:
        tt, mi = 1.0 * beat * 2, 0
        while tt < dur - 1:
            dg, ln = MOTIF[mi % len(MOTIF)]
            oct_, idx = divmod(dg, 5)
            f = D * 2 * 2 ** ((sc[idx] + 12 * oct_) / 12)
            add(sec, flute(f, ln * beat * 0.95, gf), tt, 0.28, 0.1)
            tt += ln * beat; mi += 1
            if mi % len(MOTIF) == 0: tt += beat * 4
    # percussion
    if perc:
        for k in range(int(dur / beat)):
            t0 = k * beat
            if perc == 'taiko':
                add(sec, s_drum(110 if k % 4 == 0 else 150, 55), t0, 0.55 if k % 4 == 0 else 0.3)
                if k % 2 == 1: add(sec, s_drum(220, 140), t0 + beat / 2, 0.15)
            elif perc == 'pulse' and k % 2 == 0: add(sec, s_drum(90, 50), t0, 0.3)
            elif perc == 'heart' and k % 4 == 0: add(sec, s_heart(), t0, 0.35)
            elif perc == 'light': add(sec, s_drum(260, 180), t0, 0.12 if k % 2 else 0.2)
            elif perc == 'soft' and k % 4 == 0: add(sec, s_drum(100, 55), t0, 0.22)
            elif perc == 'kagura':
                add(sec, s_drum(300, 220), t0, 0.18)
                if k % 4 == 3: add(sec, s_chime(1760, 1.2), t0, 0.15)
            elif perc == 'bells' and k % 4 == 0: add(sec, s_chime(880 * 2 ** (sc[k % 5] / 12), 3.0), t0, 0.18)
    # crossfade into the master track
    L = sec.shape[1]
    fade = np.ones(L, np.float32)
    fi = int(0.8 * SR); fo = int(1.5 * SR); endi = int(dur * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[endi:endi + fo] = np.linspace(1, 0, min(fo, L - endi))[: len(fade[endi:endi + fo])]
    fade[endi + fo:] = 0
    i0 = int(a * SR); n = min(L, N - i0)
    music[:, i0:i0 + n] += sec[:, :n] * fade[:n]
    print(f'music {m:9s} {a:7.1f}-{b:7.1f}')

# simple stereo reverb on music (block-recursive combs)
def reverb(x, mix=0.25):
    y = np.zeros_like(x)
    for ch in range(2):
        acc = np.zeros(x.shape[1], np.float32)
        for dl, g in [(1557, 0.82), (1617, 0.81), (1491, 0.8), (1422, 0.79)]:
            dl += ch * 23
            c = x[ch].copy()
            for i in range(dl, len(c), dl):
                j = min(i + dl, len(c))
                c[i:j] += g * c[i - dl:j - dl]
            acc += c
        y[ch] = acc / 4
    return x * (1 - mix) + y * mix
music = reverb(music, 0.3)

# ----------------------------------------------------------------- VOICE ----
voice = np.zeros((2, N), np.float32)
venv = np.zeros(N, np.float32)
for c in CH:
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(here / 'public' / 'vo' / f"{c['i']:02d}.mp3"), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    v = np.frombuffer(pcm, np.float32)
    i0 = int(c['start'] * SR); n = min(len(v), N - i0)
    voice[0, i0:i0 + n] += v[:n]; voice[1, i0:i0 + n] += v[:n]
    venv[i0:i0 + n] = 1
# ducking envelope: music -9 dB while the narrator speaks (smoothed 0.4 s)
k = int(0.4 * SR)
sm = np.convolve(venv[::100], np.ones(k // 100) / (k // 100), 'same')
sm = np.repeat(sm, 100)[:N]
duck = (1 - 0.65 * sm).astype(np.float32)
rms = lambda x: float(np.sqrt(np.mean(x[:, ::7] ** 2)) + 1e-9)
vr = rms(voice)
music *= (vr / rms(music)) * 10 ** (-8.5 / 20)
music *= duck
sfx *= (vr / (rms(sfx) + 1e-9)) * 10 ** (-11 / 20)
mix = voice + music + sfx
peak = np.abs(mix).max(); mix /= max(1.0, peak / 0.95)
def wav(path, x):
    x = np.clip(x, -1, 1)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', str(path)], input=x.T.astype(np.float32).tobytes(), check=True)
wav(out / 'music.wav', music / max(1, np.abs(music).max() / 0.95))
wav(out / 'sfx.wav', sfx / max(1, np.abs(sfx).max() / 0.95))
wav(out / 'mix_raw.wav', mix)
print('done', TOTAL)
