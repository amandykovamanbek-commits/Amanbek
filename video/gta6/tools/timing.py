"""Build remotion/src/timing.json from data/tts_text.json (+ audio/Sxx.mp3 when present).

Without audio: word times are estimated from syllables and punctuation.
With audio:    word times are aligned to the real speech using silence detection
               (punctuation boundaries matched to pauses, words spread by syllables).
usage: python3 tools/timing.py
"""
import json, re, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TXT = json.loads((ROOT / 'data' / 'tts_text.json').read_text())
FPS = 30
LEAD = 0.6          # silence before the first line
TITLE = 3.2         # title card after S01
GAP = 1.0           # pause between scenes
END = 4.5           # end card after S10
RATE = 14.0         # estimated chars per second (ElevenLabs ru)

norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
syl = lambda w: max(1, len(re.findall(r'[аеёиоуыэюяaeiou]', w.lower()))) + 0.35


def tokens(text):
    out = []
    for w in text.split():
        if norm(w):
            out.append(w)
        elif out:
            out[-1] += ' ' + w  # attach dashes etc.
    return out


def pause_after(w):
    if re.search(r'[.!?…]»?$', w): return 0.42
    if re.search(r'[:;]$', w): return 0.25
    if re.search(r'[,—]$', w): return 0.16
    return 0.0


def estimate(words, total):
    weights = [syl(w) for w in words]
    pauses = [pause_after(w) for w in words]
    speak = max(0.5, total - sum(pauses[:-1]))
    k = speak / sum(weights)
    t, out = 0.0, []
    for w, wt, p in zip(words, weights, pauses):
        out.append((t, t + wt * k))
        t += wt * k + p
    return out


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]))


def align(words, audio):
    dur = duration(audio)
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(audio), '-af', 'silencedetect=noise=-36dB:d=0.12', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    sil = list(zip(st, en))
    if len(st) > len(en): sil.append((st[-1], dur))
    speech, t = [], 0.0
    for a, b in sil:
        if a - t > 0.03: speech.append((t, a))
        t = b
    if dur - t > 0.03: speech.append((t, dur))
    lead, tail = speech[0][0], speech[-1][1]

    def rt2sp(x):
        acc = 0
        for a, b in speech:
            if x <= a: return acc
            if x <= b: return acc + x - a
            acc += b - a
        return acc

    def sp2rt(p):
        acc = 0
        for a, b in speech:
            if p <= acc + (b - a): return a + (p - acc)
            acc += b - a
        return speech[-1][1]

    sy = [syl(w) for w in words]
    cum = [0]
    for s in sy: cum.append(cum[-1] + s)
    r = rt2sp(tail) / cum[-1]
    B = [(i + 1, 3 if re.search(r'[.!?…]', w) else 2 if re.search(r'[:»]', w) else 1)
         for i, w in enumerate(words[:-1]) if re.search(r'[.!?…,:—»]$', w)]
    gaps = [(speech[k][1], speech[k + 1][0]) for k in range(len(speech) - 1)]
    gp = [rt2sp(a) for a, b in gaps]
    INF = 1e9
    nB, nG = len(B), len(gaps)
    D = [[INF] * (nG + 1) for _ in range(nB + 1)]
    P = [[None] * (nG + 1) for _ in range(nB + 1)]
    D[0][0] = 0
    skipB = lambda s: {1: .25, 2: .6, 3: 1.2}[s]
    skipG = lambda g: 0.4 + 2.0 * (g[1] - g[0])
    for i in range(nB + 1):
        for j in range(nG + 1):
            if D[i][j] >= INF: continue
            if i < nB and D[i][j] + skipB(B[i][1]) < D[i + 1][j]:
                D[i + 1][j] = D[i][j] + skipB(B[i][1]); P[i + 1][j] = (i, j, None)
            if j < nG and D[i][j] + skipG(gaps[j]) < D[i][j + 1]:
                D[i][j + 1] = D[i][j] + skipG(gaps[j]); P[i][j + 1] = (i, j, None)
            if i < nB and j < nG:
                c = abs(cum[B[i][0]] * r - gp[j]) * 1.6
                if D[i][j] + c < D[i + 1][j + 1]:
                    D[i + 1][j + 1] = D[i][j] + c; P[i + 1][j + 1] = (i, j, (i, j))
    i, j, anchors = nB, nG, []
    while (i, j) != (0, 0):
        pi, pj, m = P[i][j]
        if m: anchors.append(m)
        i, j = pi, pj
    anchors.reverse()
    A = [(0, lead, lead)] + [(B[bi][0], gaps[gj][0], gaps[gj][1]) for bi, gj in anchors] + [(len(words), tail, tail)]
    times = [None] * len(words)
    for (w0, _, s0), (w1, e1, _) in zip(A, A[1:]):
        if w1 == w0: continue
        p0, p1 = rt2sp(s0), rt2sp(e1)
        tot = cum[w1] - cum[w0]
        for k in range(w0, w1):
            a = p0 + (p1 - p0) * (cum[k] - cum[w0]) / tot
            b = p0 + (p1 - p0) * (cum[k + 1] - cum[w0]) / tot
            times[k] = (sp2rt(a + 1e-4), sp2rt(b - 1e-4))
    return times, dur


scenes, t = [], LEAD
for i, (sid, text) in enumerate(TXT.items()):
    words = tokens(text)
    audio = ROOT / 'audio' / f'{sid}.mp3'
    if audio.exists():
        times, dur = align(words, audio)
        src = audio.name
    else:
        dur = len(text) / RATE
        times = estimate(words, dur)
        src = None
    scenes.append({
        'id': sid, 'start': round(t, 3), 'dur': round(dur, 3), 'audio': src,
        'words': [{'w': w, 'n': norm(w), 's': round(t + a, 3), 'e': round(t + b, 3)} for w, (a, b) in zip(words, times)],
    })
    t += dur
    if sid == 'S01':
        scenes[-1]['title'] = [round(t + 0.3, 3), round(t + TITLE, 3)]
        t += TITLE
    elif i < len(TXT) - 1:
        t += GAP
end = [round(t + 0.4, 3), round(t + END, 3)]
total = t + END
out = {'fps': FPS, 'total': round(total, 3), 'frames': int(round(total * FPS)), 'end': end, 'scenes': scenes}
(ROOT / 'remotion' / 'src' / 'timing.json').write_text(json.dumps(out, ensure_ascii=False, indent=0))
real = sum(1 for s in scenes if s['audio'])
print(f'total {total:.1f}s ({total/60:.2f} min), frames {out["frames"]}, scenes with real audio {real}/{len(scenes)}')
for s in scenes: print(f"  {s['id']} start {s['start']:7.2f}  dur {s['dur']:6.2f}  {'audio' if s['audio'] else 'estimate'}")
