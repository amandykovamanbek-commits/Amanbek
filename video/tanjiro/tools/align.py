"""Offline forced alignment of each chapter's known text to its voiceover (no ASR):
silence segmentation (ffmpeg silencedetect) + monotone DP matching punctuation to pauses,
words inside a span distributed by syllable count.
usage: python3 tools/align.py  -> src/data/timeline.json"""
import re, json, subprocess, pathlib
here = pathlib.Path(__file__).parent.parent
chapters = json.loads((here / 'tools' / 'chapters.json').read_text())
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))

def tokens(text):
    words = []
    for para_i, para in enumerate(text.split('\n\n')):
        for w in para.split():
            if norm(w): words.append({'w': w, 'p': para_i})
            elif words: words[-1]['w'] += ' ' + w  # dash etc. glued to previous word
    return words

def align(words, audio):
    W = [x['w'] for x in words]
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]))
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', audio, '-af', 'silencedetect=noise=-36dB:d=0.11', '-f', 'null', '-'], capture_output=True, text=True).stderr
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
    Ts = rt2sp(tail)
    syl = [max(1, len(re.findall(r'[аеёиоуыэюяaeiou]', w.lower()))) + 0.35 for w in W]
    cum = [0]
    for s in syl: cum.append(cum[-1] + s)
    r = Ts / cum[-1]
    B = [(i + 1, 3 if re.search(r'[.!?…]', w) else 2 if re.search(r'[:»]', w) else 1) for i, w in enumerate(W[:-1]) if re.search(r'[.!?…,:—»]$', w)]
    gaps = [(speech[k][1], speech[k + 1][0]) for k in range(len(speech) - 1)]
    gp = [rt2sp(a) for a, b in gaps]
    INF = 1e9
    nB, nG = len(B), len(gaps)
    D = [[INF] * (nG + 1) for _ in range(nB + 1)]; P = [[None] * (nG + 1) for _ in range(nB + 1)]
    D[0][0] = 0
    skipB = lambda s: {1: .25, 2: .6, 3: 1.2}[s]
    skipG = lambda g: 0.4 + 2.0 * (g[1] - g[0])
    for i in range(nB + 1):
        for j in range(nG + 1):
            if D[i][j] >= INF: continue
            if i < nB and D[i][j] + skipB(B[i][1]) < D[i + 1][j]: D[i + 1][j] = D[i][j] + skipB(B[i][1]); P[i + 1][j] = (i, j, None)
            if j < nG and D[i][j] + skipG(gaps[j]) < D[i][j + 1]: D[i][j + 1] = D[i][j] + skipG(gaps[j]); P[i][j + 1] = (i, j, None)
            if i < nB and j < nG:
                c = abs(cum[B[i][0]] * r - gp[j]) * 1.6
                if D[i][j] + c < D[i + 1][j + 1]: D[i + 1][j + 1] = D[i][j] + c; P[i + 1][j + 1] = (i, j, (i, j))
    i, j, anchors = nB, nG, []
    while (i, j) != (0, 0):
        pi, pj, m = P[i][j]
        if m: anchors.append(m)
        i, j = pi, pj
    anchors.reverse()
    A = [(0, lead, lead)] + [(B[bi][0], gaps[gj][0], gaps[gj][1]) for bi, gj in anchors] + [(len(W), tail, tail)]
    times = [None] * len(W)
    for (w0, _, s0), (w1, e1, _) in zip(A, A[1:]):
        p0, p1 = rt2sp(s0), rt2sp(e1)
        tot = cum[w1] - cum[w0]
        for k in range(w0, w1):
            a = p0 + (p1 - p0) * (cum[k] - cum[w0]) / tot
            b = p0 + (p1 - p0) * (cum[k + 1] - cum[w0]) / tot
            times[k] = (round(sp2rt(a + 1e-4), 3), round(sp2rt(b - 1e-4), 3))
    return dur, times, len(anchors), nB

GAP = 1.6      # seconds of ink transition / chapter card before each chapter (not before the hook)
INTRO = 2.4    # spoiler warning plate
out, t = [], INTRO
for i, ch in enumerate(chapters):
    audio = here / 'public' / 'vo' / f'{i:02d}.mp3'
    if not audio.exists():
        print('missing', audio.name); continue
    if i > 0: t += GAP
    words = tokens(ch['text'])
    dur, times, na, nb = align(words, str(audio))
    for w, (s, e) in zip(words, times): w['s'], w['e'] = s, e
    out.append({'i': i, 'head': ch['head'], 'start': round(t, 3), 'dur': round(dur, 3), 'words': words})
    print(f"{i:2d} start {t:7.2f} dur {dur:6.2f} words {len(words)} anchors {na}/{nb}")
    t += dur
(here / 'src' / 'data').mkdir(exist_ok=True)
(here / 'src' / 'data' / 'timeline.json').write_text(json.dumps({'chapters': out, 'end': round(t, 3)}, ensure_ascii=False))
print('total', round(t, 2))
