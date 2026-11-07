#!/usr/bin/env python3
"""Build timeline.json + voice.wav.
mode rhvoice: synthesize every segment locally (placeholder voice)
mode file <voice.mp3>: split one narration file into segments at the longest pauses."""
import json, os, re, subprocess, sys, wave
import numpy as np

SR = 44100
SEGS = [
    # spoken, caption, shot, extra
    ("Девятилетний мальчик решил задачу, на которую у всего класса ушёл бы час.",
     "Девятилетний мальчик решил задачу, на которую у всего класса ушёл бы час.", "hook_face", {}),
    ("За одну минуту!", "За одну минуту!", "hook_slate", {}),
    ("Германия, тысяча семьсот восемьдесят шестой год.", "Германия, 1786 год.", "wide", {}),
    ("Учитель хочет отдохнуть и даёт классу задание: сложить все числа от одного до ста.",
     "Учитель хочет отдохнуть и даёт классу задание: сложить все числа от 1 до 100.", "teacher", {}),
    ("Дети начинают считать: один плюс два, плюс три, плюс четыре...",
     "Дети начинают считать: 1 + 2, + 3, + 4...", "kids_count", {}),
    ("Но через минуту маленький Карл Гаусс кладёт на стол свою доску.",
     "Но через минуту маленький Карл Гаусс кладёт на стол свою доску.", "walk", {}),
    ("На ней одно число: пять тысяч пятьдесят.", "На ней одно число: 5050.", "slate_ecu", {}),
    ("Учитель проверяет... и это правильный ответ!", "Учитель проверяет... и это правильный ответ!", "teacher_shock", {}),
    ("Как? Гаусс заметил закономерность.", "Как? Гаусс заметил закономерность.", "gauss_board", {}),
    ("Один плюс сто — сто один.", "1 + 100 = 101", "board", {"board": "p1", "k": 0}),
    ("Два плюс девяносто девять — сто один.", "2 + 99 = 101", "board", {"board": "p2", "k": 1}),
    ("Три плюс девяносто восемь — снова сто один!", "3 + 98 снова 101!", "board", {"board": "p3", "k": 2}),
    ("Каждая пара даёт сто один.", "Каждая пара даёт 101.", "board", {"board": "all", "k": 3}),
    ("А пар — ровно пятьдесят.", "А пар ровно 50.", "board", {"board": "half", "k": 4}),
    ("Пятьдесят умножить на сто один — пять тысяч пятьдесят.", "50 × 101 = 5050", "board", {"board": "mult", "k": 5}),
    ("Этим приёмом мы пользуемся до сих пор.", "Этим приёмом мы пользуемся до сих пор.", "formula", {}),
    ("А самого мальчика потом назовут королём математиков.",
     "А самого мальчика потом назовут королём математиков.", "king", {}),
]

def read_wav(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768

def to_wav(src, dst, extra_af=""):
    af = "aresample=44100" + ("," + extra_af if extra_af else "")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", af, "-ac", "1", dst], check=True)

def main():
    out = sys.argv[1]
    mode = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    LEAD = 0.25
    segs = []
    if mode == "rhvoice":
        GAP = 0.3
        parts = []
        t = LEAD
        for i, (sp, cap, shot, ex) in enumerate(SEGS):
            raw, fin = f"{out}/s{i:02d}_raw.wav", f"{out}/s{i:02d}.wav"
            if not os.path.exists(fin):
                subprocess.run(["RHVoice-test", "-p", "aleksandr-hq", "-o", raw], input=sp.encode(), check=True)
                to_wav(raw, fin, "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                                 "silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=1.15")
            a = read_wav(fin)
            segs.append(dict(start=t, dur=len(a) / SR))
            parts.append((t, a))
            t += len(a) / SR + GAP
        total = t + 0.6
        voice = np.zeros(int(total * SR) + 1, np.float32)
        for st, a in parts:
            i0 = int(st * SR); voice[i0:i0 + len(a)] += a
    else:
        src = sys.argv[3]
        to_wav(src, f"{out}/vo_full.wav")
        a = read_wav(f"{out}/vo_full.wav")
        # trim leading/trailing silence
        env = np.convolve(np.abs(a), np.ones(441) / 441, mode="same")
        thr = max(0.008, env.max() * 0.03)
        act = env > thr
        idx = np.where(act)[0]
        a = a[max(0, idx[0] - 2000): idx[-1] + 4000]
        env = env[max(0, idx[0] - 2000): idx[-1] + 4000]
        act = env > thr
        # find silent runs
        runs, i = [], 0
        n = len(act)
        while i < n:
            if not act[i]:
                j = i
                while j < n and not act[j]:
                    j += 1
                if (j - i) / SR > 0.07 and i > 0 and j < n:
                    runs.append(((j - i) / SR, i, j))
                i = j
            else:
                i += 1
        need = len(SEGS) - 1
        cand = sorted(runs, key=lambda r: r[1])
        # expected boundaries from text length (chars, with punctuation weight)
        # syllable nuclei: band energy peaks
        hop, win = 441, 1024
        nfr = (len(a) - win) // hop
        fr = np.lib.stride_tricks.as_strided(a, (nfr, win), (a.strides[0] * hop, a.strides[0]))
        spec = np.abs(np.fft.rfft(fr * np.hanning(win), axis=1))
        fq = np.fft.rfftfreq(win, 1 / SR)
        e = spec[:, (fq > 300) & (fq < 2500)].sum(1)
        e = np.convolve(e, np.hanning(7) / np.hanning(7).sum(), mode="same")
        thr_e = np.percentile(e, 35)
        peaks = []
        for i in range(2, len(e) - 2):
            if e[i] > thr_e and e[i] == e[i - 6:i + 7].max():
                lo = min(e[max(0, i - 12):i].min(), e[i + 1:i + 13].min())
                if e[i] - lo > 0.25 * e[i]:
                    peaks.append(i * hop / SR + win / 2 / SR)
        V = [max(1, len(re.findall(r"[аеёиоуыэюяАЕЁИОУЫЭЮЯ]", x[0]))) for x in SEGS]
        print("nuclei", len(peaks), "vowels", sum(V))
        cv = np.cumsum(V)[:-1] / sum(V) * len(peaks)
        cum = []
        for c in cv:
            i = int(c)
            cum.append((peaks[i - 1] + peaks[min(i, len(peaks) - 1)]) / 2 if i > 0 else peaks[0])
        cum = np.array(cum)
        ct = [((r[1] + r[2]) / 2) / SR for r in cand]
        cl = [r[0] for r in cand]
        m, K = len(cand), need
        INF = 1e18
        sig = 0.6
        cost = lambda k, j: ((ct[j] - cum[k]) / sig) ** 2 - 2.0 * np.log(cl[j] / 0.07)
        D = np.full((K, m), INF); B = np.zeros((K, m), int)
        for j in range(m): D[0, j] = cost(0, j)
        for k in range(1, K):
            best, bj = INF, -1
            for j in range(m):
                if j > 0 and D[k - 1, j - 1] < best: best, bj = D[k - 1, j - 1], j - 1
                if best < INF: D[k, j] = best + cost(k, j); B[k, j] = bj
        j = int(np.argmin(D[K - 1])); sel = [j]
        for k in range(K - 1, 0, -1): j = B[k, j]; sel.append(j)
        cuts = [cand[j] for j in sorted(sel)]
        bounds = [0] + [(r[1] + r[2]) // 2 for r in cuts] + [len(a)]
        for k in range(len(SEGS)):
            s0, s1 = bounds[k], bounds[k + 1]
            # speech start/end inside the chunk
            ia = np.where(act[s0:s1])[0]
            st = (s0 + (ia[0] if len(ia) else 0)) / SR
            en = (s0 + (ia[-1] if len(ia) else s1 - s0)) / SR
            segs.append(dict(start=LEAD + st, dur=en - st))
        total = LEAD + len(a) / SR + 1.0
        voice = np.zeros(int(total * SR) + 1, np.float32)
        voice[int(LEAD * SR): int(LEAD * SR) + len(a)] = a
    voice *= 0.95 / max(1e-6, np.abs(voice).max())
    with wave.open(f"{out}/voice.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((voice * 32767).astype(np.int16).tobytes())
    tl = []
    for k, ((sp, cap, shot, ex), s) in enumerate(zip(SEGS, segs)):
        d = dict(i=k, text=sp, cap=cap, shot=shot, start=s["start"], dur=s["dur"], **ex)
        tl.append(d)
    # shot boundaries: consecutive identical non-board shots merge; cut slightly before speech
    for k, d in enumerate(tl):
        d["shotStart"] = 0.0 if k == 0 else d["start"] - 0.12
    merged = []
    for d in tl:
        if merged and d["shot"] == merged[-1]["shot"] and d["shot"] not in ("board",):
            d["shotStart"] = merged[-1]["shotStart"]
        merged.append(d)
    for k, d in enumerate(tl):
        nxt = next((e["shotStart"] for e in tl[k + 1:] if e["shotStart"] != d["shotStart"]), total)
        d["shotEnd"] = nxt
    json.dump(dict(fps=30, total=total, segments=tl), open(f"{out}/timeline.json", "w"), ensure_ascii=False, indent=1)
    print("total", round(total, 2), "segments", len(tl))

main()
