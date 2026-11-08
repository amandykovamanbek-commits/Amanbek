#!/usr/bin/env python3
"""Синтезирует оригинальные звуки для игры в папку sounds/ (WAV, моно).
Запуск: python3 tools/make_sounds.py
Потом загрузи файлы в Roblox (Asset Manager -> Bulk Import) и вставь ID в Config.Sounds."""
import os, wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sounds")
rng = np.random.default_rng(1)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = int(SR * a), int(SR * r)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def tone(freq, d, kind="sine", a=0.005, r=None, vol=1.0):
    x = t(d)
    ph = 2 * np.pi * freq * x
    if kind == "square":
        w = np.sign(np.sin(ph)) * 0.5
    elif kind == "tri":
        w = 2 / np.pi * np.arcsin(np.sin(ph))
    else:
        w = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    return w * env(len(x), a, r if r is not None else d * 0.8) * vol


def seq(notes, kind="sine", gap=0.0):
    parts = []
    for f, d in notes:
        parts.append(tone(f, d, kind) if f else np.zeros(int(SR * d)))
        if gap:
            parts.append(np.zeros(int(SR * gap)))
    return np.concatenate(parts)


def mix(*tracks):
    n = max(len(x) for x in tracks)
    out = np.zeros(n)
    for x in tracks:
        out[: len(x)] += x
    return out


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def lowpass(x, k):
    # простой сглаживающий фильтр
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.85
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print("sounds/%s.wav  %.2fs" % (name, len(x) / SR))


N = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"])}


def note(n, octave):
    return N[n] * 2 ** (octave - 4)


def main():
    os.makedirs(OUT, exist_ok=True)
    save("click", tone(1800, 0.05, "tri", r=0.04))
    save("coin", seq([(note("B", 5), 0.07), (note("E", 6), 0.25)]))
    save("collect", mix(seq([(note("C", 6), 0.06), (note("E", 6), 0.06), (note("G", 6), 0.06), (note("C", 7), 0.3)]), noise(0.15) * env(int(SR * 0.15), 0.001, 0.14) * 0.15))
    save("buy", seq([(note("G", 5), 0.07), (note("C", 6), 0.07), (note("E", 6), 0.07), (note("G", 6), 0.07), (note("C", 7), 0.35)], "tri"))
    save("error", mix(tone(140, 0.25, "square", r=0.1), tone(147, 0.25, "square", r=0.1)) * 0.6)
    save("grab", np.sin(2 * np.pi * np.cumsum(np.linspace(300, 900, int(SR * 0.12))) / SR) * env(int(SR * 0.12), 0.002, 0.08))
    save("deliver", seq([(note("C", 5), 0.1), (note("E", 5), 0.1), (note("G", 5), 0.1), (note("C", 6), 0.12), (0, 0.04), (note("G", 5), 0.08), (note("C", 6), 0.45)], "square"))
    whoosh = lowpass(noise(0.28), 18) * env(int(SR * 0.28), 0.08, 0.18)
    save("flap", whoosh)
    splash = lowpass(noise(0.7), 6) * env(int(SR * 0.7), 0.002, 0.6)
    save("splash", mix(splash, tone(220, 0.15, r=0.12) * 0.3))
    fan = seq([(note("G", 4), 0.15), (note("C", 5), 0.15), (note("E", 5), 0.15), (note("G", 5), 0.3), (note("E", 5), 0.12), (note("G", 5), 0.7)], "square")
    save("divine", mix(fan, seq([(note("C", 4), 0.6), (note("G", 3), 0.6), (note("C", 4), 0.6)], "tri") * 0.6))
    save("levelup", seq([(note("C", 6), 0.05), (note("D", 6), 0.05), (note("E", 6), 0.05), (note("G", 6), 0.05), (note("C", 7), 0.3)], "tri"))

    # фоновая музыка: весёлый чиптюн-цикл ~19 сек (4 такта x 4, 100 BPM)
    beat = 60 / 100
    chords = [("C", "E", "G"), ("A", "C", "E"), ("F", "A", "C"), ("G", "B", "D")]
    melody = ["E", "G", "A", "G", "E", "D", "C", "D", "E", "E", "D", "C", "D", "G", "B", "D"]
    bars = []
    for rep in range(2):
        for ci, ch in enumerate(chords):
            bar_len = int(SR * beat * 4)
            bar = np.zeros(bar_len)
            # бас
            for b in range(4):
                bn = tone(note(ch[0], 2), beat * 0.9, "tri", r=beat * 0.4) * 0.7
                s0 = int(SR * beat * b)
                bar[s0 : s0 + len(bn)] += bn[: bar_len - s0]
            # арпеджио
            for k in range(8):
                f = note(ch[k % 3], 4 + (k // 3) % 2)
                ar = tone(f, beat / 2 * 0.9, "square", r=beat / 4) * 0.18
                s0 = int(SR * beat / 2 * k)
                bar[s0 : s0 + len(ar)] += ar[: bar_len - s0]
            # мелодия
            for k in range(4):
                m = melody[(ci * 4 + k) % len(melody)]
                ml = tone(note(m, 5), beat * 0.85, "tri", r=beat * 0.3) * (0.35 if rep == 1 else 0.25)
                s0 = int(SR * beat * k)
                bar[s0 : s0 + len(ml)] += ml[: bar_len - s0]
            # хлопки
            for b in (1, 3):
                cl = lowpass(noise(0.06), 3) * env(int(SR * 0.06), 0.001, 0.05) * 0.25
                s0 = int(SR * beat * b)
                bar[s0 : s0 + len(cl)] += cl
            bars.append(bar)
    save("music", np.concatenate(bars))


if __name__ == "__main__":
    main()
