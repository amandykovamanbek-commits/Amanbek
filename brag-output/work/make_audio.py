"""Soundtrack for the BILIM QADAM video: music and effects written as one piece.

120 BPM in C major (C-G-Am-F, one chord per 2 s bar). Every hit, tap and
whoosh comes from video/src/timeline.json so it lands on the same beat grid
as the cuts. Output: video/public/music.wav (44.1 kHz, stereo, 16-bit).
"""
import json
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
TL = json.loads((HERE / 'video/src/timeline.json').read_text())
SR = 44100
FPS = TL['fps']
DUR = TL['duration'] / FPS            # 75 s
N = int(DUR * SR)
BEAT = 60 / TL['bpm']                 # 0.5 s
BAR = BEAT * 4
rng = np.random.default_rng(7)


def fr(frames):
    return frames / FPS


def note(name):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (o + 1) - 69) / 12)


def fft_filter(x, lo=None, hi=None, sr=SR):
    """Gentle band filter in the frequency domain (smooth roll-offs)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / sr)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X * g, n=len(x))


def env(n, a=0.005, d=0.1, s=0.0, r=0.05, hold=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if hold is None:
        e *= s + (1 - s) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
    else:
        dec = s + (1 - s) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
        e *= np.where(t < hold, dec, dec * np.exp(-(t - hold) / max(r, 1e-4)))
    return e


def saw(freq, n, detune=0.0, phase=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in (-detune, 0, detune) if detune else (0,):
        ph = (t * freq * (1 + d) + phase + rng.random()) % 1.0
        out += 2 * ph - 1
    return out / (3 if detune else 1)


def sine(freq, n, phase=0.0):
    return np.sin(2 * np.pi * freq * np.arange(n) / SR + phase)


def place(buf, sig, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


# ---------------- stems ----------------
pad = np.zeros(N); bass = np.zeros(N); kick = np.zeros(N); clap = np.zeros(N)
hat = np.zeros(N); arp = np.zeros(N); fx = np.zeros(N); bells = np.zeros(N)

CHORDS = [('C', ['C4', 'E4', 'G4', 'C5'], 'C2'), ('G', ['B3', 'D4', 'G4', 'D5'], 'G1'),
          ('Am', ['C4', 'E4', 'A4', 'E5'], 'A1'), ('F', ['C4', 'F4', 'A4', 'F5'], 'F1')]
END_GROOVE = fr(TL['final'])          # 70 s: final chord
DROP = fr(TL['scenes']['logo'][0])    # 6 s: beat enters
CLAP_IN = fr(TL['scenes']['reg'][0])  # 20 s
AI = TL['scenes']['ai']
LIGHT = (fr(AI[0]), fr(AI[1]))        # AI section: lighter drums, more arp

n_bars = int(np.ceil(DUR / BAR))
for b in range(n_bars):
    t0 = b * BAR
    if t0 >= END_GROOVE:
        break
    _, voicing, root = CHORDS[b % 4]
    n = int(BAR * SR) + int(0.6 * SR)
    chord = sum(saw(note(v), n, detune=0.004) for v in voicing) / len(voicing)
    place(pad, chord * env(n, a=0.25, d=9, s=1, r=0.5, hold=BAR), t0, 0.55)
    if t0 >= DROP:
        for k in range(8):                       # eighth-note bass
            tb = t0 + k * BEAT / 2
            m = int(BEAT / 2 * SR)
            f0 = note(root) * (2 if k % 2 else 1)
            s = 0.75 * sine(f0, m) + 0.25 * saw(f0, m)
            place(bass, s * env(m, a=0.004, d=0.18, s=0.25, r=0.03, hold=BEAT / 2 - 0.03), tb, 0.9)
    if (t0 >= fr(TL['scenes']['home'][0]) and t0 < END_GROOVE) or (LIGHT[0] <= t0 < LIGHT[1]):
        tones = [note(v) * 2 for v in voicing]   # 16th-note arpeggio, an octave up
        for k in range(16):
            ta = t0 + k * BEAT / 4
            m = int(0.22 * SR)
            f0 = tones[[0, 1, 2, 3, 2, 1, 2, 3][k % 8]]
            s = saw(f0, m) * 0.5 + np.sign(sine(f0, m)) * 0.2
            place(arp, s * env(m, a=0.002, d=0.07), ta, 0.35 if LIGHT[0] <= ta < LIGHT[1] else 0.22)

# drums on the beat grid
kick_times = []
t = DROP
while t < END_GROOVE - 1e-6:
    kick_times.append(t)
    t += BEAT
for tk in kick_times:
    m = int(0.4 * SR)
    tt = np.arange(m) / SR
    f_sweep = 45 + 85 * np.exp(-tt / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f_sweep) / SR) * np.exp(-tt / 0.16)
    place(kick, s, tk, 0.95 if not (LIGHT[0] <= tk < LIGHT[1]) else 0.7)
    th = tk + BEAT / 2
    if th < END_GROOVE:
        hm = int(0.06 * SR)
        h = fft_filter(rng.standard_normal(hm), lo=7000) * env(hm, a=0.001, d=0.018)
        place(hat, h, th, 0.22)
    beat_in_bar = round((tk % BAR) / BEAT)
    if tk >= CLAP_IN and beat_in_bar in (1, 3) and not (LIGHT[0] <= tk < LIGHT[1]):
        cm = int(0.25 * SR)
        c = fft_filter(rng.standard_normal(cm), lo=900, hi=5000) * env(cm, a=0.001, d=0.06)
        place(clap, c, tk, 0.35)

# sidechain: pad and bass dip under every kick
duck = np.ones(N)
for tk in kick_times:
    i = int(tk * SR); m = min(N - i, int(0.3 * SR))
    tt = np.arange(m) / SR
    duck[i:i + m] = np.minimum(duck[i:i + m], 1 - 0.55 * np.exp(-tt / 0.09))
pad *= duck; bass *= duck

# ---------------- effects, in key ----------------
def bell(freq, dur=1.4):
    m = int(dur * SR)
    tt = np.arange(m) / SR
    s = sine(freq, m) + 0.35 * sine(freq * 2.0, m) * np.exp(-tt / 0.3) + 0.15 * sine(freq * 3.01, m) * np.exp(-tt / 0.15)
    return s * env(m, a=0.003, d=dur / 3)


def whoosh(t_end, length=0.6, up=True):
    m = int(length * SR)
    noise = rng.standard_normal(m)
    tt = np.linspace(0, 1, m)
    shape = (tt ** 2) if up else ((1 - tt) ** 2)
    s = fft_filter(noise, lo=400, hi=6000) * shape * (1 - np.exp(-(1 - tt) * 40) if up else 1)
    place(fx, s, t_end - (length if up else 0), 0.16)


def tap(t):
    m = int(0.09 * SR)
    place(fx, sine(note('G5'), m) * env(m, a=0.001, d=0.025), t, 0.22)
    place(fx, fft_filter(rng.standard_normal(m), lo=2500, hi=8000) * env(m, a=0.0005, d=0.008), t, 0.05)


# hook words: soft bells C5, E5, G5
for t_, nm in zip(TL['hookWords'], ['C5', 'E5', 'G5']):
    place(bells, bell(note(nm), 1.8), fr(t_), 0.35)
# riser into the drop
whoosh(DROP, 1.6)
# logo: steps C5 E5 G5, star sparkle C6+G6
for t_, nm in zip(TL['logoSteps'], ['C5', 'E5', 'G5']):
    place(bells, bell(note(nm), 0.9), fr(t_), 0.28)
place(bells, bell(note('C6'), 1.6), fr(TL['logoStar']), 0.22)
place(bells, bell(note('G6'), 1.2), fr(TL['logoStar']) + BEAT / 4, 0.12)
# subject cards and chips
for t_, nm in zip(TL['whatCards'], ['C5', 'D5', 'E5', 'G5']):
    place(bells, bell(note(nm), 0.6), fr(t_), 0.16)
for t_ in TL['whatChips']:
    tap(fr(t_))
# scene changes
for t_ in TL['whooshes']:
    whoosh(fr(t_), 0.5)
# taps in the app
for k in ('tapStart', 'tapSubject', 'tapWrong', 'tapAi', 'tapReveal'):
    tap(fr(TL[k]))
# wrong answer: soft falling E4 -> C4
m = int(0.32 * SR)
w = np.concatenate([sine(note('E4'), m // 2), sine(note('C4'), m - m // 2)])
w = fft_filter(np.sign(w) * 0.4 + w * 0.6, hi=1800) * env(m, a=0.003, d=0.14)
place(fx, w, fr(TL['tapWrong']), 0.22)
# right answer: C5 E5 G5 arpeggio on sixteenths
for k, nm in enumerate(['C5', 'E5', 'G5']):
    place(bells, bell(note(nm), 0.9), fr(TL['showRight']) + k * BEAT / 4, 0.24)
# AI steps: a soft pluck as each step starts typing; warn and try cards
for t_ in TL['aiSteps']:
    place(bells, bell(note('E5'), 0.5), fr(t_), 0.12)
place(bells, bell(note('A4'), 0.7), fr(TL['aiWarn']), 0.14)
place(bells, bell(note('G5'), 0.7), fr(TL['aiTry']), 0.14)
for k, nm in enumerate(['E5', 'G5']):
    place(bells, bell(note(nm), 0.8), fr(TL['tapReveal']) + k * BEAT / 4, 0.18)
# result: bigger chime + badge pop + confetti sparkle
for k, nm in enumerate(['C5', 'E5', 'G5', 'C6']):
    place(bells, bell(note(nm), 1.4), fr(TL['resultXp']) + k * BEAT / 4, 0.26)
place(bells, bell(note('E6'), 1.0), fr(TL['resultBadge']), 0.16)
for k in range(10):
    place(bells, bell(note(['C6', 'E6', 'G6', 'C7'][k % 4]), 0.4), fr(TL['resultXp']) + 0.5 + k * BEAT / 4, 0.05)
# rank swap: whoosh up + G5 bell
whoosh(fr(TL['rankSwap']) + 0.25, 0.5)
place(bells, bell(note('G5'), 1.0), fr(TL['rankSwap']) + BEAT / 2, 0.2)
# final chord: big C major hit with a long tail
tF = fr(TL['final'])
m = int((DUR - tF) * SR)
chord = sum(saw(note(v), m, detune=0.005) for v in ['C3', 'G3', 'C4', 'E4', 'G4', 'C5']) / 6
place(pad, chord * env(m, a=0.01, d=1.6, s=0.35), tF, 0.75)
mk = int(0.6 * SR); tt = np.arange(mk) / SR
place(kick, np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-tt / 0.04)) / SR) * np.exp(-tt / 0.3), tF, 1.0)
place(bass, sine(note('C2'), m) * env(m, a=0.005, d=1.2), tF, 0.8)
for nm in ['C5', 'G5', 'C6']:
    place(bells, bell(note(nm), 3.0), tF, 0.16)

# ---------------- mix ----------------
pad = fft_filter(pad, lo=120, hi=2600)
arp = fft_filter(arp, lo=300, hi=4200)
bass = fft_filter(bass, hi=900)

def reverb(x, secs=1.8, mix=0.22):
    m = int(secs * SR)
    ir = rng.standard_normal(m) * np.exp(-np.arange(m) / SR / (secs / 5))
    ir = fft_filter(ir, lo=300, hi=6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + m
    nfft = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return x + mix * y

music = 0.9 * pad + 1.0 * bass + 0.9 * kick + clap + hat + arp
sfx = 1.2 * bells + fx
wet = reverb(0.55 * pad + 0.5 * arp + 0.8 * bells + 0.6 * fx + 0.25 * clap, 2.2, 0.35)
mixL = music + sfx + 0.35 * wet
# light stereo: arp and hats slightly wider, delayed copy on the right
d = int(0.012 * SR)
mixR = mixL.copy()
mixR[d:] = 0.85 * mixL[d:] + 0.15 * (arp + hat + 0.5 * bells)[:-d]
mixL = 0.92 * mixL + 0.08 * (arp + hat)

# fade the very end, soft limit, normalise to -1 dBFS
fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
st = np.stack([mixL * fade, mixR * fade], axis=1)
st = st / np.max(np.abs(st)) * 1.6
st = np.tanh(st)
st = st / np.max(np.abs(st)) * 10 ** (-1 / 20)

out = HERE / 'video/public/music.wav'
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print(f'wrote {out} ({DUR:.2f}s, rms {np.sqrt(np.mean(st ** 2)):.3f})')
