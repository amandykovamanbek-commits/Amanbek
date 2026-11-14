# Sound for the Pisa short: synthesized SFX on the picture's events (same word-timed shot table as story.ts / cast.ts),
# an original light Italian march (mandolin, tuba oompah, glockenspiel, snare; darker for 1934 and the 1990s crisis),
# and the mix: voice unchanged, music ducked under speech at the "+3 dB" standard bed, SFX stem -6 dB,
# master -15 LUFS integrated, true peak <= -1 dBTP, exactly TOTAL frames long, 48 kHz stereo 24-bit.
# usage: python pisa_audio.py   (reads ../voice/voice.wav + words.json, writes mix.wav, stems, cues.md here)
import json
import os
import numpy as np
from scipy import signal
from dsp import (SR, ns, tt, rng, dbg, lp, hp, bp, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, momentary_max, true_peak, read_wav, write_wav, phase, modal)
import sfx_gen as G
import instruments as I

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FPS, TOTAL = 30, 2090
DUR = TOTAL / FPS
N = ns(DUR)
WORDS = json.load(open(os.path.join(ROOT, "voice", "words.json"), encoding="utf-8"))
W = lambda i: round(WORDS[i]["s"] * FPS)          # frame of word i (story.ts W)
LEAD = 2 / FPS
tw = lambda i: W(i) / FPS - LEAD                    # reaction time (cast.ts tw)
fr = lambda f: f / FPS
CUT = lambda i: W(i) - 3
B = [0, CUT(8), CUT(16), CUT(27), CUT(38), CUT(45), CUT(53), CUT(62), CUT(71), CUT(80), CUT(90), CUT(97), CUT(109), CUT(119),
     CUT(125), CUT(139), CUT(153), CUT(161), CUT(172), TOTAL]
S = lambda i: fr(B[i - 1])                          # shot i start (s)
E = lambda i: fr(B[i])                              # shot i end (s)
L1, L2, POP = fr(W(78)), fr(W(116)), fr(W(185))
SFX_DB = -6.0                                        # user standard: SFX -6 dB
MUSIC_REL = -10.0                                    # bed vs voice (LU), the "+3 dB music" standard
DUCK_DB = -3.0

R = rng(1173)
def rr():
    return rng(int(R.integers(1 << 30)))


# ================================================================ SFX
CUES = []  # (t, x (mono or stereo), level dB rel voice, kind "event"|"bed", pan, label)
def cue(t, x, level, kind="event", p=0.0, label=""):
    CUES.append((t, x, level, kind, p, label))


def strike_times(t0, t1, ph, per=0.95):
    """cast.ts strike(): the blow lands at c = 0.645 of the cycle"""
    out, k = [], int(np.floor(t0 / per + ph)) - 1
    while True:
        t = (k + 0.645 - ph) * per
        if t > t1:
            return out
        if t >= t0:
            out.append(t)
        k += 1


def stone_groan(dur, r, up=False):
    """the tower grinding into the clay: low stick-slip groan + rumble"""
    y = G.creak(dur, r, 34 if not up else 30, 60 if not up else 90, G.TIMBER, scale=0.45, rough=0.2, noise=0.02)
    n = len(y)
    rum = lp(colored(n, r, 1.6), 120, 2) * np.interp(np.linspace(0, 1, n), [0, 0.2, 0.8, 1], [0, 1, 0.8, 0])
    return y / (np.abs(y).max() + 1e-9) + 0.9 * rum / (np.abs(rum).max() + 1e-9)


def thud(r, f=55, dur=0.6):
    t = tt(dur)
    body = np.exp(-t / 0.16) * np.sin(phase(f * (1 + 0.6 * np.exp(-t / 0.03))))
    dust = lp(r.standard_normal(len(t)), 900, 2) * np.exp(-t / 0.08) * 0.5
    return fades(body + dust, 0.0, 0.05)


def splat(r, dur=0.5, wet=1.0):
    t = tt(dur)
    nz = r.standard_normal(len(t))
    y = lp(nz, 1400, 2) * np.exp(-t / 0.07) + 0.5 * bp(nz, 300, 2500, 1) * np.exp(-t / 0.03)
    y += wet * G.bubbles(dur, r, 26, 250, 1300)
    return fades(y, 0.0, 0.05)


def drill(dur, r):
    """auger rig: diesel thrum + gritty grinding"""
    n = ns(dur)
    t = np.arange(n) / SR
    eng = np.sin(phase(np.full(n, 31.0))) * (0.7 + 0.3 * np.sin(2 * np.pi * 7.8 * t))
    eng += 0.5 * np.sin(phase(np.full(n, 62.0)))
    grind = bp(colored(n, r, 0.4), 500, 2600, 1) * (0.5 + 0.5 * smooth_noise(n, r, 9))
    return fades(0.8 * eng + 0.5 * grind, 0.15, 0.25)


def engine(dur, r, rate=4.2):
    """1930s pump engine: chugging thumps + a hiss"""
    n = ns(dur)
    y = np.zeros(n)
    for k in range(int(dur * rate)):
        c = thud(r, 70, 0.22) * r.uniform(0.7, 1.0)
        i = ns(k / rate)
        y[i:i + len(c)] += c[: n - i]
    y += 0.15 * hp(colored(n, r, 0.2), 3000) * (0.6 + 0.4 * np.sin(2 * np.pi * rate * np.arange(n) / SR))
    return fades(y, 0.1, 0.2)


def hiss(dur, r):
    n = ns(dur)
    env = np.interp(np.linspace(0, 1, n), [0, 0.1, 0.8, 1], [0, 1, 0.9, 0])
    return hp(colored(n, r, -0.3), 2500, 2) * env * (0.8 + 0.2 * smooth_noise(n, r, 6))


def waves(dur, r):
    n = ns(dur)
    t = np.arange(n) / SR
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 4.3) ** 2
    x = st(lp(colored(n, r, 1.0), 900, 2) * swell)
    return x + widen(hp(colored(n, r, 0.3), 3000) * swell ** 3 * 0.25, r, 10, 1.0)


def shutter(r):
    d = 0.12
    t = tt(d)
    a = modal(d, [(2600, 0.7, 0.01), (5200, 0.4, 0.006)], r) + 0.6 * hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.004)
    b = modal(d, [(2200, 0.6, 0.01)], r) * 0.8
    y = np.zeros(ns(0.2))
    y[: len(a)] += a
    y[ns(0.06): ns(0.06) + len(b)] += b
    return y


def snip(r):
    y = np.zeros(ns(0.3))
    for k, tm in enumerate([0.0, 0.07]):
        c = modal(0.12, [(3400 + 400 * k, 0.8, 0.012), (6100, 0.4, 0.008)], r)
        y[ns(tm): ns(tm) + len(c)] += c
    return y


def boing(r, dur=0.9):
    t = tt(dur)
    f = 180 + 260 * np.exp(-t / 0.18) * np.cos(2 * np.pi * 9 * t) ** 2
    return fades(np.sin(phase(f)) * np.exp(-t / 0.35), 0.002, 0.1)


def scrape(r, dur=0.35):
    t = tt(dur)
    return bp(r.standard_normal(len(t)), 700, 4500, 1) * np.sin(np.pi * t / dur) ** 2


def ambience_day(dur, r, birds=0.5):
    n = ns(dur)
    x = G.breeze(dur, r, 0.6, 0.15, 800)
    x += pan(G.bird_chirps(dur, r, birds, "sparrow") * 0.07, -0.5)
    x += pan(G.bird_chirps(dur, r, birds * 0.6, "blackbird") * 0.05, 0.6)
    return fades(x, 0.2, 0.3)


def ambience_golden(dur, r):
    x = G.breeze(dur, r, 0.6, 0.1, 650)
    x += widen(G.crickets(dur, r, 3) * 0.01, r, 9, 1.0)
    x += pan(G.bird_chirps(dur, r, 0.25, "blackbird") * 0.05, 0.4)
    return fades(x, 0.25, 0.4)


def murmur(dur, r, voices=6):
    n = ns(dur)
    out = np.zeros((2, n))
    for v in range(voices):
        base, scale = (r.uniform(95, 140), 1.0) if v % 2 else (r.uniform(180, 235), 1.15)
        y = lp(G.babble(dur, r, base, scale, r.uniform(3.6, 4.8), r.uniform(0.55, 0.8), fmax=3400), 3000, 1) * r.uniform(0.4, 1.0)
        out += pan(y, r.uniform(-0.8, 0.8))
    return fades(out, 0.3, 0.6)


def cheer(dur, r, people=14, clap=True):
    n = ns(dur)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for v in range(people):
        kid = v % 6 == 5
        base = r.uniform(270, 340) if kid else (r.uniform(105, 160) if v % 2 else r.uniform(180, 250))
        h = G.hurrah(r, base, 1.3 if kid else (1.0 if v % 2 else 1.15), kid)
        place(out, pan(lp(h, 4000, 1) * r.uniform(0.35, 1.0), r.uniform(-0.9, 0.9)), r.uniform(0.05, 0.6))
    if clap:
        out += G.applause(dur, r, 24, np.interp(t, [0, 0.3, 1.0, dur], [0, 0.8, 1.0, 0])) * 0.8
    return fades(out, 0.03, 0.4)


def flash(r):
    y = G.whoosh(0.7, r, 0.3, 500, 4200, 0.9, 0.09, 0.4)
    t = tt(0.7)
    boom = np.where(t > 0.3, np.exp(-(t - 0.3) / 0.12) * np.sin(2 * np.pi * 62 * (t - 0.3)), 0) * 0.8
    return widen(y + boom, r, 12, 0.9)


def build_cues():
    # whooshes on the glides (peak at the middle of the move) and on the big cuts
    for t, dur in [(fr(W(13) - 10 + 14), 0.7), (fr(W(33) - 10 + 16), 0.8), (fr(W(49) - 8 + 13), 0.6), (fr(W(135) - 10 + 13), 0.6), (fr(W(177) - 8 + 17), 0.8)]:
        cue(t - 0.3, G.whoosh(dur, rr(), 0.3), -12, p=0.0, label="whoosh glide")
    for t in [fr(W(6) - 6), fr(W(25) - 5), fr(W(61) - 5), fr(W(69) - 5), fr(W(78) - 7), fr(W(116) - 6), fr(W(150) - 5), fr(W(167) - 5)]:
        cue(t - 0.12, G.whoosh(0.35, rr(), 0.12, 600, 3000, 0.8, 0.08), -15, label="whoosh cut")
    # ambiences per shot (beds)
    for i in range(1, 20):
        a, b = S(i), E(i)
        if i == 15:
            cue(a, waves(b - a, rr()), -17, "bed", label="sea")
        elif i in (5, 13, 14, 19):
            cue(a, ambience_golden(b - a, rr()), -24, "bed", label="golden air")
        else:
            cue(a, ambience_day(b - a, rr(), 0.6 if i in (2, 3, 6, 7) else 0.3), -25, "bed", label="day air")
    # 1 hook: the drill and the earth coming out from under the tower; the flash
    cue(0.0, drill(E(1), rr()), -15, "bed", -0.2, "drill")
    for t in np.arange(0.2, E(1), 0.7):
        cue(t, thud(rr(), 90, 0.25), -16, p=-0.1, label="clod")
    cue(tw(6), splat(rr(), 0.6, 0.3), -8, label="earth bursts out")
    cue(fr(B[1] - 3) - 0.3, flash(rr()), -9, label="flash")
    # 2 masons' chisels, townsfolk proud
    for i in range(4):
        for t in strike_times(S(2) + 0.2, E(2), i * 0.31):
            cue(t, G.clink(rr(), rr().uniform(2400, 3400), 0.15), -19, p=0.3 - 0.2 * i, label="chisel")
    cue(tw(10), cheer(E(2) - tw(10), rr(), 8, clap=True), -14, "bed", 0.3, "proud townsfolk")
    # 3 hammering, then the lean: groan; soft clay splats
    for i in range(3):
        for t in strike_times(S(3), tw(20), i * 0.31):
            cue(t, G.clink(rr(), rr().uniform(2400, 3400), 0.15), -16, p=-0.3 + 0.3 * i, label="chisel")
    cue(tw(20), stone_groan(2.0, rr()), -9, label="the stump starts to lean")
    cue(tw(25), splat(rr(), 0.6), -7, label="clay splat")
    cue(tw(25) + 0.5, splat(rr(), 0.5), -11, p=0.3, label="clay splat 2")
    cue(fr(W(25)), thud(rr(), 50), -10, label="kick")
    # 4 knights march off: boots + armour
    t0 = S(4)
    k = 0
    while True:
        t = t0 + k / (2 * 0.81)
        if t > E(4):
            break
        b = np.zeros(ns(0.4))
        for j in range(5):
            x = G.boot(rr(), rr().uniform(0.7, 1.0))
            o = ns(rr().uniform(0, 0.025))
            b[o: o + len(x)] += x[: len(b) - o]
        cue(t, b, -15, p=0.2, label="march")
        if k % 2 == 0:
            cue(t + 0.03, G.rattle(0.3, rr(), 40, None, heavy=False), -20, p=0.2, label="armour")
        k += 1
    # 6 masons on the scaffold
    for i in range(2):
        for t in strike_times(S(6) + 0.1, E(6), i * 0.4):
            cue(t, G.clink(rr(), rr().uniform(2600, 3600), 0.15), -19, p=-0.2 + 0.4 * i, label="chisel high")
    # 7 banana
    cue(fr(W(61)) - LEAD, boing(rr(), 0.6), -14, label="banana boing")
    # 8 Mussolini stamps on "позорит"
    cue(fr(W(69)), thud(rr(), 65, 0.4), -12, label="stamp")
    # 9 the grout pump; the lurch
    cue(S(9), engine(L1 - S(9) + 0.3, rr()), -15, "bed", -0.3, "grout pump")
    cue(L1 - 0.25, stone_groan(1.6, rr()), -6, label="lurch groan")
    cue(L1, thud(rr(), 45, 0.9), -5, label="lurch thud")
    cue(L1 + 0.05, G.rattle(0.8, rr(), 50, None, heavy=True), -14, label="debris")
    # 10 tourists, the barrier
    cue(S(10), murmur(E(10) - S(10), rr(), 6), -19, "bed", label="tourists")
    cue(fr(W(89)) - 0.05, G.clink(rr(), 1500, 0.3, 0.6), -10, label="barrier down")
    cue(fr(W(89)), thud(rr(), 120, 0.3), -14, label="barrier thunk")
    # 11 crane + lead
    cue(S(11), lp(engine(E(11) - S(11), rr(), 9), 900), -18, "bed", label="crane motor")
    cue(fr(W(96)), thud(rr(), 60, 0.6), -9, label="pallet lands")
    for j in range(5):
        cue(fr(W(96)) + 0.02 + 0.06 * j, G.clink(rr(), rr().uniform(900, 1500), 0.25, 0.5), -16, label="ingots")
    # 12 thumbs up; tourists' cameras
    cue(S(12), murmur(E(12) - S(12), rr(), 5), -21, "bed", label="tourists")
    for t in [tw(101) + 0.3, tw(104), tw(107) + 0.2]:
        cue(t, shutter(rr()), -16, p=-0.3, label="camera shutter")
    # 13 nitrogen hiss, the second lurch
    cue(S(13), hiss(L2 - S(13) + 0.4, rr()), -15, "bed", 0.2, "nitrogen")
    cue(L2 - 0.25, stone_groan(1.6, rr()), -6, label="lurch groan")
    cue(L2, thud(rr(), 45, 0.9), -5, label="lurch thud")
    # 14 question ping
    cue(tw(119) + 0.15, I.glock(I.m2f(84), 0.7, rr()), -14, label="question ping")
    # 15 wet sand: squelch, straining, scooping
    tA, tB, tC = tw(130), tw(132), tw(135)
    cue(tA, splat(rr(), 0.5, 1.2), -9, label="foot sinks")
    cue(tB, G.oof(rr(), "ugh", 300, 1.3), -14, label="kid strains")
    cue(tB + 0.6, G.oof(rr(), "ugh", 320, 1.3), -16, label="kid strains")
    for j in range(5):
        cue(tC + 0.12 + j * 2 * np.pi / 13 / 1.0 * 0.5, scrape(rr()), -15, p=0.2, label="spade scoop")
    cue(tC + 1.3, splat(rr(), 0.4, 0.6), -14, label="other foot settles")
    # 16 the drill again; the room rises
    cue(S(16), drill(fr(W(150) - 5) - S(16), rr()), -15, "bed", -0.2, "drill")
    cue(fr(W(150)) - 0.35, G.whoosh(0.6, rr(), 0.35, 200, 1500), -12, label="room rises")
    cue(fr(W(150)) + 0.5, thud(rr(), 70, 0.5), -10, label="room lands")
    # 17 the tower comes back: a rising groan, cheers
    cue(fr(W(155)), stone_groan(1.9, rr(), up=True), -9, label="tower straightens")
    cue(tw(155) + 1.2, cheer(2.0, rr(), 6, clap=False), -14, label="engineers cheer")
    # 18 the ribbon, the crowd
    cue(tw(166), snip(rr()), -10, label="scissors")
    cue(tw(166) + 0.08, cheer(E(18) - tw(166), rr(), 12, clap=True), -12, "bed", label="opening cheer")
    cue(tw(167) + 0.4, shutter(rr()), -15, p=0.3, label="photo")
    # 19 pushing, then by itself
    for j, t in enumerate(np.arange(S(19) + 0.3, tw(177), 1.25)):
        cue(t, G.oof(rr(), ["oof", "ugh"][j % 2], [130, 210][j % 2], [1.0, 1.15][j % 2]), -17, p=-0.3 + 0.3 * (j % 3), label="push grunt")
    cue(POP - LEAD, boing(rr(), 0.9), -9, label="it straightens by itself")
    cue(POP + 0.02, I.glock(I.m2f(91), 0.8, rr()), -13, label="sparkle")


def render_sfx(v_ref):
    out = np.zeros((2, N))
    send = np.zeros(N)
    rows = []
    for t, x, level, kind, p, label in CUES:
        x = np.asarray(x, float)
        x = pan(x, p) if x.ndim == 1 else x
        cur = momentary_max(x) if kind == "event" else integrated(x)
        tgt = v_ref + level + SFX_DB
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        place(out, x, t)
        G._place_mono(send, 0.35 * x.mean(0), t)
        rows.append((t, label, kind, level + SFX_DB))
    out += 0.5 * convolve_st(send, make_ir(1.2, 9, pre=0.01, hf=1.5))
    return hp(out, 25, 2), rows


# ================================================================ music (original)
BPM = 120
Q = 60 / BPM
BAR = 4 * Q
F = I.m2f
CH = {  # tuba roots (oom), after-beat chord (pah), mandolin arpeggio
    "F": ([41, 48], [65, 69, 72]), "C7": ([36, 43], [64, 67, 70]), "Bb": ([46, 41], [62, 65, 70]), "Dm": ([38, 45], [62, 65, 69]),
    "A7": ([45, 40], [61, 64, 67]), "Gm": ([43, 38], [62, 67, 70]), "C": ([36, 43], [64, 67, 72]), "Am": ([45, 40], [60, 64, 69]),
}
# 4-bar theme (beat offset, length in beats, midi), F major, our own
THEME = [(0, 1, 72), (1, 0.5, 74), (1.5, 0.5, 72), (2, 1, 69), (3, 1, 65), (4, 1.5, 70), (5.5, 0.5, 69), (6, 1, 67), (7, 1, 64),
         (8, 1, 72), (9, 0.5, 74), (9.5, 0.5, 76), (10, 1, 77), (11, 1, 72), (12, 1, 74), (13, 1, 70), (14, 2, 72)]
THEME_MIN = [(0, 1, 69), (1, 0.5, 70), (1.5, 0.5, 69), (2, 1, 65), (3, 1, 62), (4, 1.5, 67), (5.5, 0.5, 65), (6, 1, 64), (7, 1, 61),
             (8, 1, 69), (9, 0.5, 70), (9.5, 0.5, 72), (10, 1, 74), (11, 1, 69), (12, 1, 70), (13, 1, 67), (14, 2, 69)]


class Band:
    def __init__(self):
        self.tr = {}

    def add(self, name, x, t, p=0.0, g=1.0):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
        place(self.tr[name], pan(np.asarray(x, float) * g, p), t)


def music():
    b = Band()
    t_sec = lambda bar, beat=0.0: bar * BAR + beat * Q
    nbars = int(np.ceil(DUR / BAR)) + 1
    # sections by time: (start s, style, chords per bar)
    secs = [(0.0, "bright"), (S(2), "medieval"), (S(5), "rest"), (S(6), "medieval"), (S(8), "dark"), (S(10), "crisis"),
            (S(15), "beach"), (S(16), "solve"), (S(19), "finale")]
    prog = {"bright": ["F", "C7", "F", "Bb"], "medieval": ["F", "Bb", "C", "F"], "rest": ["F", "Bb", "F", "C"], "dark": ["Dm", "A7", "Dm", "Gm"],
            "crisis": ["Dm", "Bb", "A7", "Dm"], "beach": ["F", "Am", "Bb", "C"], "solve": ["F", "C", "Bb", "F"], "finale": ["F", "C7", "F", "F"]}
    style = lambda t: [s for s in secs if s[0] <= t + 1e-6][-1][1]
    for bar in range(nbars):
        t0 = t_sec(bar)
        if t0 >= DUR:
            break
        sty = style(t0)
        ch = CH[prog[sty][bar % 4]]
        r = rr()
        # tuba oompah (not on the beach, soft in the rest)
        if sty not in ("beach",):
            for beat in (0, 2):
                v = 0.55 if sty == "rest" else (0.8 if sty in ("dark", "crisis") else 0.7)
                b.add("tuba", I.brass(F(ch[0][beat // 2]), 0.32, v, rr(), "tuba"), t0 + beat * Q, -0.1)
        # after-beats: mandolin plucks (bright styles) / horn stabs (dark)
        for beat in (1, 3):
            for k, m in enumerate(ch[1]):
                if sty in ("dark", "crisis"):
                    b.add("horn", I.brass(F(m - 12), 0.18, 0.35, rr(), "horn", scoop=-12), t0 + beat * Q + 0.004 * k, 0.3 - 0.15 * k)
                else:
                    b.add("mando", I.pluck(F(m), 0.45, rr(), 0.5, 0.6), t0 + beat * Q + 0.01 * k, 0.35 - 0.2 * k)
                    b.add("mando", I.pluck(F(m), 0.3, rr(), 0.4, 0.6), t0 + (beat + 0.5) * Q + 0.01 * k, 0.35 - 0.2 * k)
        # snare: light march; rolls into the lurches
        if sty in ("bright", "medieval", "solve", "finale"):
            for s16, v in [(0, 0.5), (4, 0.8), (8, 0.5), (12, 0.8), (14, 0.4)]:
                b.add("snare", I.snare(v * 0.6, rr()), t0 + s16 * Q / 4, 0.05)
        if sty == "crisis":
            b.add("timp", I.timpani(F(38), 0.6, rr()), t0, 0.0)
        if sty == "beach":
            for beat in range(4):
                b.add("vibes", I.vibes(F(ch[1][beat % 3] + 12), 0.4, rr(), 1.4, 0.6), t0 + beat * Q, 0.2)
        # melody: glock (bright / solve / finale), fife (medieval), low pluck (dark)
        phrase = bar % 4
        if sty in ("bright", "solve", "finale", "medieval", "dark") and phrase in (0, 2):
            mel = THEME_MIN if sty == "dark" else THEME
            half = 0 if phrase == 0 else 8
            for (beat, d, m) in mel[: 9] if half == 0 else mel[9:]:
                bb = beat - half
                if bb < 0:
                    continue
                tm = t0 + bb * Q
                if sty == "medieval":
                    b.add("fife", I.fife(F(m), d * Q * 0.9, 0.45, rr()), tm, -0.25)
                elif sty == "dark":
                    b.add("lowpluck", I.pluck(F(m - 12), 0.6, rr(), 0.8, 0.4), tm, -0.2)
                else:
                    b.add("glock", I.glock(F(m), 0.5, rr()), tm, -0.25)
    # the rolls into the lurches and the ending stab on "Сама."
    for tl in (L1, L2):
        for t, v in I.snare_roll(tl - 1.2, tl - 0.02, 0.15, 0.7, rr()):
            b.add("snare", I.snare(v, rr(), dur=0.14, buzz=True), t, 0.05)
        b.add("cym", I.cymbal(0.6, rr()), tl, 0.0)
    b.add("cym", I.cymbal(0.7, rr()), POP, 0.0)
    b.add("tuba", I.brass(F(41), 0.6, 0.9, rr(), "tuba"), POP, -0.1)
    for k, m in enumerate([65, 69, 72, 77]):
        b.add("horn", I.brass(F(m), 0.5, 0.5, rr(), "horn", scoop=-12), POP + 0.005 * k, 0.3 - 0.2 * k)
    gains = {"tuba": 1.0, "horn": 0.8, "mando": 0.55, "snare": 0.45, "timp": 0.7, "vibes": 0.5, "glock": 0.6, "fife": 0.5, "lowpluck": 0.7, "cym": 0.4}
    mix = np.zeros((2, N))
    for k, x in b.tr.items():
        mix += x * gains.get(k, 0.6) / (np.abs(x).max() + 1e-9)
    mix += 0.25 * convolve_st(mix.mean(0), make_ir(1.6, 31, pre=0.015, hf=1.4))
    # a short fade at the very end (the video ends on the last word)
    end = ns(DUR - 0.15)
    mix[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return hp(mix, 30, 2)


# ================================================================ mix
def speech_spans(merge=0.3):
    sp = []
    for w in WORDS:
        s, e = float(w["s"]), float(w["e"])
        if sp and s - sp[-1][1] < merge:
            sp[-1][1] = max(sp[-1][1], e)
        else:
            sp.append([s, e])
    return sp


def duck_curve(depth=DUCK_DB, pre=0.08, post=0.12, att=0.07, rel=0.45):
    g = np.zeros(N)
    for s, e in speech_spans():
        g[max(0, ns(s - pre)): min(N, ns(e + post))] = 1
    # attack / release smoothing
    k_a, k_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    y = signal.lfilter([1 - k_r], [1, -k_r], g)
    y = np.maximum(y, signal.lfilter([1 - k_a], [1, -k_a], g))
    return dbg(depth * np.clip(y, 0, 1))


def limiter(x, ceil_db=-1.2, look=0.003, rel=0.08):
    over = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(over).max(0).reshape(-1, 4).max(1)[: x.shape[1]]
    ceil = dbg(ceil_db)
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    w = ns(look)
    need = -np.lib.stride_tricks.sliding_window_view(np.pad(-need, (0, w - 1), constant_values=-1.0), w).max(1)  # look-ahead min
    k = np.exp(-1 / (rel * SR))
    g = signal.lfilter([1 - k], [1, -k], need - 1) + 1
    g = np.minimum(g, need)
    return x * g[None, :]


def main():
    v, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, sr
    v = v[0] if v.shape[0] == 1 else v.mean(0)
    voice = np.zeros(N)
    voice[: min(N, len(v))] = v[:N]
    voice = st(voice)
    v_ref = integrated(voice)
    print("voice", round(v_ref, 2), "LUFS")
    build_cues()
    sfx, rows = render_sfx(v_ref)
    mus = music()
    mus *= duck_curve()[None, :]                      # duck first: the bed level is measured after ducking (skill standard)
    mus *= dbg(v_ref + MUSIC_REL - integrated(mus))
    full = voice + mus + sfx
    g = dbg(-15.0 - integrated(full))
    out = limiter(full * g)
    print("mix", round(integrated(out), 2), "LUFS, true peak", round(true_peak(out), 2), "dBTP, len", out.shape[1] / SR)
    write_wav(os.path.join(HERE, "mix.wav"), out)
    for name, x in [("voice", voice), ("music", mus), ("sfx", sfx)]:
        write_wav(os.path.join(HERE, f"stem_{name}.wav"), x * g)
    with open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8") as fh:
        fh.write(f"# Pisa short: sound cues\n\nvoice {v_ref:.1f} LUFS; music bed {MUSIC_REL} LU vs voice, ducked {DUCK_DB} dB under speech; "
                 f"SFX standard {SFX_DB} dB; master -15 LUFS, <= -1 dBTP.\n\n| t (s) | event | kind | level vs voice (dB) |\n|---|---|---|---|\n")
        for t, label, kind, lev in sorted(rows):
            fh.write(f"| {t:6.2f} | {label} | {kind} | {lev:+.0f} |\n")


if __name__ == "__main__":
    main()
