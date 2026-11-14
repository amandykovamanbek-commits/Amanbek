# Sound for the beer flood short (London 1814): synthesized SFX on the picture's events (same word-timed shot table as story.ts / cast.ts),
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
FPS, TOTAL = 30, 1843
DUR = TOTAL / FPS
N = ns(DUR)
WORDS = json.load(open(os.path.join(ROOT, "voice", "words.json"), encoding="utf-8"))
W = lambda i: round(WORDS[i]["s"] * FPS)          # frame of word i (story.ts W)
LEAD = 2 / FPS
tw = lambda i: W(i) / FPS - LEAD                    # reaction time (cast.ts tw)
fr = lambda f: f / FPS
CUT = lambda i: W(i) - 3
B = [0, CUT(12), CUT(28), CUT(43), CUT(58), CUT(71), CUT(80), CUT(84), CUT(94), CUT(104), CUT(117), CUT(128), CUT(133), TOTAL]
S = lambda i: fr(B[i - 1])                          # shot i start (s)
E = lambda i: fr(B[i])                              # shot i end (s)
F_HOOP, F_BURST, F_WALL, F_BELT, F_SEAMS, F_GOD, F_REFUND = fr(W(31) + 8), fr(W(47)), fr(W(59)), fr(W(104)), fr(W(114)), fr(W(126)), fr(W(139))
BUTTONS = [fr(W(107)), fr(W(108)), fr(W(110))]
L1, L2, POP = F_BURST, F_WALL, fr(W(143))
SFX_DB = -6.0                                        # user standard: SFX -6 dB
MUSIC_REL = -10.0                                    # bed vs voice (LU), the "+3 dB music" standard
DUCK_DB = -3.0

R = rng(1814)
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


def roar(dur, r, swell=1.0):
    """a wave of beer: low rushing noise with a slosh, swelling then easing"""
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.interp(t, [0, 0.25 * dur, 0.7 * dur, dur], [0, swell, 0.8 * swell, 0])
    body = lp(colored(n, r, 1.3), 500, 2) + 0.4 * bp(colored(n, r, 0.6), 600, 2500, 1) * (0.6 + 0.4 * smooth_noise(n, r, 3))
    y = body * env + 0.25 * G.bubbles(dur, r, 30, 200, 1200)
    return widen(fades(y, 0.05, 0.3), r, 10, 0.8)


def build_cues():
    for t, dur in [(fr(W(23) - 12 + 15), 0.7), (fr(W(66) - 10 + 15), 0.8), (fr(W(100) - 10 + 12), 0.6), (fr(W(139) - 8 + 12), 0.6)]:
        cue(t - 0.3, G.whoosh(dur, rr(), 0.3), -12, label="whoosh glide")
    for i in (4, 5, 6, 7, 8, 9, 11, 13):
        cue(S(i) - 0.12, G.whoosh(0.35, rr(), 0.12, 600, 3000, 0.8, 0.08), -16, label="whoosh cut")
    for t in [fr(W(34) - 5), fr(W(48) - 5), fr(W(123) - 5)]:
        cue(t - 0.12, G.whoosh(0.35, rr(), 0.12, 600, 3000, 0.8, 0.08), -15, label="whoosh cut")
    for i in range(1, 14):
        a, b = S(i), E(i)
        if i in (1, 4, 5, 6, 7):
            cue(a, ambience_golden(b - a, rr()), -24, "bed", label="evening air")
        elif i in (9, 10, 11, 12, 13):
            cue(a, murmur(b - a, rr(), 3 if i in (9, 10) else 6), -24, "bed", label="room murmur")
        else:
            cue(a, ambience_day(b - a, rr(), 0.4), -25, "bed", label="day air")
    # 1 hook: the wave roars down the street; people run
    cue(0.0, roar(E(1), rr()), -10, "bed", label="beer wave")
    for k in range(10):
        cue(0.15 + k * 0.32, G.stroll_step(rr(), 1.2), -18, p=-0.3 + 0.2 * (k % 3), label="running steps")
    cue(0.4, G.whoa(rr(), dur=0.5), -14, p=-0.3, label="whoa")
    cue(fr(B[1] - 3) - 0.3, flash(rr()), -9, label="flash")
    # 2 proud brewers; the great vat creaks
    cue(tw(17), cheer(1.6, rr(), 4, clap=False), -14, label="proud brewers")
    cue(fr(W(21)), G.creak(1.4, rr(), 40, 70, G.TIMBER, scale=0.6), -16, label="vat creak")
    # 3 the hoop falls off: a heavy iron clang
    cue(F_HOOP, G.clink(rr(), 900, 0.5, 0.7), -7, label="hoop clang")
    cue(F_HOOP + 0.05, thud(rr(), 110, 0.35), -12, label="hoop thud")
    # 4 the burst: timber tearing, a huge splash, the yard filling, shouts
    cue(F_BURST - 0.35, G.creak(0.5, rr(), 50, 160, G.TIMBER, scale=0.5), -10, label="staves strain")
    cue(F_BURST, G.wood_crack(rr()), -4, label="vat bursts")
    cue(F_BURST + 0.02, G.splash_big(rr()), -5, label="beer splash")
    cue(F_BURST + 0.1, roar(E(4) - F_BURST, rr(), 0.8), -11, "bed", label="beer flooding the yard")
    cue(F_BURST + 0.3, G.whoa(rr(), dur=0.6), -12, p=0.3, label="workers shout")
    cue(tw(56), G.oof(rr(), "oh", 150, 1.0), -15, p=0.3, label="pulled out")
    # 5 the wall goes
    cue(F_WALL - 0.1, G.timber_tear(rr(), 0.6), -9, label="wall cracks")
    cue(F_WALL, thud(rr(), 40, 1.1), -4, label="wall falls")
    cue(F_WALL + 0.1, G.rattle(1.2, rr(), 60, None, heavy=True), -11, label="bricks")
    cue(F_WALL + 0.15, G.splash_big(rr()), -7, label="beer into the street")
    cue(F_WALL + 0.2, roar(E(5) - F_WALL, rr(), 1.0), -10, "bed", label="beer in the street")
    # 6 cellars: only the beer, quiet
    cue(S(6), G.water_bed(E(6) - S(6), rr(), 0.8, 0.6), -18, "bed", label="beer in the cellars")
    # 7 question
    cue(tw(80) + 0.15, I.glock(I.m2f(84), 0.7, rr()), -14, label="question ping")
    # 8 the arrows grow: a rising run
    for k, m in enumerate([72, 74, 76, 77, 79, 81]):
        cue(tw(88) + 0.18 * k, I.glock(I.m2f(m), 0.5, rr()), -18, label="arrow")
    # 9-10 dinner, the belt, the buttons, the seams
    for k in range(3):
        cue(S(9) + 0.6 + 1.1 * k, G.clink(rr(), rr().uniform(2600, 3600), 0.15), -20, label="cutlery")
    cue(F_BELT, boing(rr(), 0.6), -9, label="belt pops")
    cue(F_BELT + 0.01, G.clink(rr(), 1900, 0.2), -13, label="buckle")
    for k, t in enumerate(BUTTONS):
        cue(t, G.clink(rr(), 3000 + 400 * k, 0.12, 1.2), -12, label="button pings")
    cue(F_SEAMS, fades(bp(rr().standard_normal(ns(0.45)), 900, 6000, 1) * np.exp(-np.arange(ns(0.45)) / SR / 0.12), 0.002, 0.05), -7, label="seams rip")
    # 11-13 the inquest: the gavel, a murmur, coins
    cue(fr(W(120)), G.hammer_hit(rr(), 1.0), -9, label="gavel")
    cue(F_GOD, G.hammer_hit(rr(), 1.2), -8, label="gavel: act of God")
    cue(F_GOD + 0.2, murmur(1.6, rr(), 6), -15, label="the room murmurs")
    cue(F_REFUND, G.rattle(0.9, rr(), 50, None, heavy=False), -10, label="coins")
    for k in range(4):
        cue(F_REFUND + 0.05 + 0.12 * k, G.clink(rr(), rr().uniform(2400, 4200), 0.25, 1.1), -14, label="coin")
    cue(fr(W(143)) - 0.05, I.glock(I.m2f(84), 0.8, rr()), -13, label="last word sparkle")


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
    secs = [(0.0, "crisis"), (S(2), "bright"), (S(4), "crisis"), (S(6), "rest"), (S(7), "dark"), (S(8), "solve"), (S(11), "dark"),
            (S(13), "finale")]
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
        for t, v in I.snare_roll(tl - 0.8, tl - 0.02, 0.15, 0.7, rr()):
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
