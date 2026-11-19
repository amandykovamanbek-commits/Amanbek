"""Align each chapter's script words to word timestamps from faster-whisper (tools/asr/NN.mp3.json).
Matched words take ASR times; unmatched runs are interpolated between neighbours.
usage: python3 tools/align_asr.py -> src/data/timeline.json (same format as align.py)"""
import re, json, difflib, subprocess, pathlib
here = pathlib.Path(__file__).parent.parent
chapters = json.loads((here / 'tools' / 'chapters.json').read_text())
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
GAP, INTRO = 1.6, 2.4

def tokens(text):
    words = []
    for pi, para in enumerate(text.split('\n\n')):
        for w in para.split():
            if norm(w): words.append({'w': w, 'p': pi})
            elif words: words[-1]['w'] += ' ' + w
    return words

out, t, report = [], INTRO, []
for i, ch in enumerate(chapters):
    audio = here / 'public' / 'vo' / f'{i:02d}.mp3'
    asr = json.loads((here / 'tools' / 'asr' / f'{i:02d}.mp3.json').read_text())
    asr = [a for a in asr if norm(a['w'])]
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(audio)]))
    if i > 0: t += GAP
    words = tokens(ch['text'])
    A = [norm(w['w']) for w in words]; B = [norm(a['w']) for a in asr]
    times = [None] * len(words)
    sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
    for op, a1, a2, b1, b2 in sm.get_opcodes():
        if op == 'equal' or (op == 'replace' and a2 - a1 == b2 - b1):
            for k in range(a2 - a1): times[a1 + k] = [asr[b1 + k]['s'], asr[b1 + k]['e']]
        elif op == 'replace' and b2 > b1:  # spread the span over the script words
            s0, e0 = asr[b1]['s'], asr[b2 - 1]['e']
            n = a2 - a1
            for k in range(n): times[a1 + k] = [s0 + (e0 - s0) * k / n, s0 + (e0 - s0) * (k + 1) / n]
    matched = sum(1 for x in times if x)
    k = 0
    while k < len(times):  # interpolate holes
        if times[k] is None:
            j = k
            while j < len(times) and times[j] is None: j += 1
            t0 = times[k - 1][1] if k else 0.1
            t1 = times[j][0] if j < len(times) else min(dur, t0 + 0.35 * (j - k))
            for q in range(k, j): times[q] = [t0 + (t1 - t0) * (q - k) / (j - k), t0 + (t1 - t0) * (q - k + 1) / (j - k)]
            k = j
        else: k += 1
    for w, (s, e) in zip(words, times):
        w['s'], w['e'] = round(s, 3), round(max(e, s + 0.05), 3)
    out.append({'i': i, 'head': ch['head'], 'start': round(t, 3), 'dur': round(dur, 3), 'words': words})
    report.append(f'{i:2d} start {t:7.2f} dur {dur:6.2f} words {len(words)} matched {matched} ({100*matched//len(words)}%)')
    t += dur
(here / 'src' / 'data' / 'timeline.json').write_text(json.dumps({'chapters': out, 'end': round(t, 3)}, ensure_ascii=False))
print('\n'.join(report)); print('total', round(t, 2))
