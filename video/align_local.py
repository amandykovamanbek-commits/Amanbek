"""Offline forced alignment of the known script to the voiceover (no ASR needed).
Speech/silence segmentation via ffmpeg silencedetect, phrase boundaries (punctuation)
matched to pauses with monotone DP, words inside spans distributed by syllable count.
usage: python3 align_local.py audio/voice.mp3  -> data/words.js"""
import re, sys, json, subprocess, pathlib
here = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(__file__).parent
audio = sys.argv[1]
html = (here / 'index.html').read_text()
texts = re.findall(r"\{ id: '\w+',\s*bg: '\w+',\s*text: '([^']+)' \}", html)
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
words = []
for t in texts:
    for w in t.split():
        if norm(w): words.append(w)
        elif w.strip() == '—' and words and not re.search(r'[.!?…,:—»]$', words[-1]): words[-1] += ' —'
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]))
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', audio, '-af', 'silencedetect=noise=-36dB:d=0.11', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
sil = [(a, b) for a, b in zip(st, en)]
if len(st) > len(en): sil.append((st[-1], dur))
# speech intervals
speech, t = [], 0.0
for a, b in sil:
    if a - t > 0.03: speech.append((t, a))
    t = b
if dur - t > 0.03: speech.append((t, dur))
lead, tail = speech[0][0], speech[-1][1]
# real-time <-> speech-time mapping
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
syl = [max(1, len(re.findall(r'[аеёиоуыэюяaeiou]', w.lower()))) + 0.35 for w in words]
cum = [0]
for s in syl: cum.append(cum[-1] + s)
r = Ts / cum[-1]
# candidate boundaries after punctuated words; strength by punctuation
B = [(i + 1, 3 if re.search(r'[.!?…]', w) else 2 if re.search(r'[:»]', w) else 1) for i, w in enumerate(words[:-1]) if re.search(r'[.!?…,:—»]$', w)]
# interior silences (between speech segments)
gaps = [(speech[k][1], speech[k + 1][0]) for k in range(len(speech) - 1)]
gp = [rt2sp(a) for a, b in gaps]
# DP: match boundaries to gaps monotonically
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
# anchors: word index -> (speech end before gap, speech start after gap)
A = [(0, lead, lead)] + [(B[bi][0], gaps[gj][0], gaps[gj][1]) for bi, gj in anchors] + [(len(words), tail, tail)]
times = [None] * len(words)
for (w0, _, s0), (w1, e1, _) in zip(A, A[1:]):
    p0, p1 = rt2sp(s0), rt2sp(e1)
    tot = cum[w1] - cum[w0]
    for k in range(w0, w1):
        a = p0 + (p1 - p0) * (cum[k] - cum[w0]) / tot
        b = p0 + (p1 - p0) * (cum[k + 1] - cum[w0]) / tot
        times[k] = (round(sp2rt(a + 1e-4), 3), round(sp2rt(b - 1e-4), 3))
(here / 'data' / 'words.js').write_text('window.WORDS = ' + json.dumps([{'s': s, 'e': e} for s, e in times]) + ';\n')
print(f'words {len(words)} boundaries {nB} gaps {nG} anchored {len(anchors)} speech {lead:.2f}-{tail:.2f}')
for (bi, gj) in anchors: print(f'  {words[B[bi][0]-1]:>18} | gap {gaps[gj][0]:.2f}-{gaps[gj][1]:.2f}')
