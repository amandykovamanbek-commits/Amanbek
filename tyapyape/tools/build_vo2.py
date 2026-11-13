import re, json, subprocess, difflib, os
TEMPO = 1.12
GAPS = {'переворачивается.':1.3, 'ленту.':.3, 'значит.':.8, 'впишется.':.7, 'получаешь.':.9, 'синяк.':.5, 'упал.':1.0, 'снег.':1.0, 'старшие.':.6, 'удар,':.35, 'пацан.':.8, 'же.':.4, 'союзе.':.4, 'дома.':.7, 'расстрелу,':1.1, 'стоило?':2.4}
stt = []
for l in open(os.environ.get('STT', 'speko_words.txt'), encoding='utf8'):
    if l.strip(): w, a, b = l.rsplit(None, 2); stt.append((w, int(a) / 1000, int(b) / 1000))
# cut points
cuts = []; used = set()
for i, (w, a, b) in enumerate(stt):
    k = w.lower()
    if k in GAPS and k not in used and i + 1 < len(stt):
        if k == 'же.' and stt[i - 1][0] != 'своих': continue
        used.add(k); cuts.append(((b + stt[i + 1][1]) / 2, GAPS[k]))
cuts.sort()
src = os.environ.get('SRC', 'vo2.mp3'); dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]))
segs = []; prev = 0.0
for c, g in cuts: segs.append((prev, c, g)); prev = c
segs.append((prev, dur, 0))
os.makedirs('_seg', exist_ok=True); lst = []; outT = 0.0; mapping = []
for i, (a, b, g) in enumerate(segs):
    f = f'_seg/s{i}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-to', str(b), '-i', src, '-af', f'atempo={TEMPO},afade=t=in:d=0.01,afade=t=out:st={(b - a) / TEMPO - 0.012}:d=0.012', '-ar', '48000', '-ac', '1', f], check=True)
    mapping.append((a, b, outT)); outT += (b - a) / TEMPO; lst.append(f"file 's{i}.wav'")
    if g > 0:
        z = f'_seg/z{i}.wav'; subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=48000:cl=mono', '-t', str(g), z], check=True); lst.append(f"file 'z{i}.wav'"); outT += g
open('_seg/list.txt', 'w').write('\n'.join(lst))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '_seg/list.txt', '-c', 'pcm_s16le', os.environ.get('OUT', 'vo2_final.wav')], check=True)
def remap(t):
    for a, b, o in mapping:
        if t <= b + 1e-6: return o + (max(t, a) - a) / TEMPO
    return mapping[-1][2] + (t - mapping[-1][0]) / TEMPO
# script tokens
s = open(os.environ.get('SCRIPT', '../script_v2.md'), encoding='utf8').read().split('## Факты')[0].split('\n', 1)[1].replace('—', ' ').replace('…', '.')
toks = [w for w in s.split() if re.search(r'\w', w)]
norm = lambda w: re.sub(r'[^\wё-]', '', w.lower()).replace('ё', 'е')
A = [norm(w) for w in toks]; B = [norm(w) for w, _, _ in stt]
sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
times = [None] * len(toks)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1): times[i1 + k] = (stt[j1 + k][1], stt[j1 + k][2])
    elif j2 > j1:  # replace: spread span of stt words over script words
        a0, b0 = stt[j1][1], stt[j2 - 1][2]; L = [len(A[k]) + 1 for k in range(i1, i2)]; c = sum(L); x = a0
        for k, l in zip(range(i1, i2), L): d = (b0 - a0) * l / c; times[k] = (x, x + d * .95); x += d
for k in range(len(times)):
    if times[k] is None: times[k] = times[k - 1]
words = [{'w': w, 's': round(remap(a), 3), 'e': round(remap(b), 3)} for w, (a, b) in zip(toks, times)]
open('../v2/words.js', 'w', encoding='utf8').write('const WORDS=' + json.dumps(words, ensure_ascii=False) + ';')
print('tokens', len(toks), 'out dur', round(outT, 2), 'cuts', len(cuts))
print([(w['w'], w['s']) for w in words[:6]], [(w['w'], w['s']) for w in words[-4:]])
