"""Align ElevenLabs transcript word timings to the script tokens in index.html.
usage: python3 align.py transcript_words.json  -> writes data/words.js
transcript_words.json: list of {"text"|"word", "start", "end"}"""
import json, re, sys, difflib, pathlib
here = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(__file__).parent
html = (here / 'index.html').read_text()
texts = re.findall(r"\{ id: '\w+',\s*bg: '\w+',\s*text: '([^']+)' \}", html)
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
toks = [n for t in texts for n in (norm(w) for w in t.split()) if n]
raw = json.load(open(sys.argv[1]))
raw = raw.get('words', raw) if isinstance(raw, dict) else raw
tw = [w for w in raw if w.get('type', 'word') == 'word' and norm(w.get('text', w.get('word', '')))]
tn = [norm(w.get('text', w.get('word', ''))) for w in tw]
times = [None] * len(toks)
sm = difflib.SequenceMatcher(a=toks, b=tn, autojunk=False)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        times[a + k] = (tw[b + k]['start'], tw[b + k]['end'])
# fuzzy pass for near matches inside replaced blocks
for op, a1, a2, b1, b2 in sm.get_opcodes():
    if op == 'replace' and a2 - a1 == b2 - b1:
        for k in range(a2 - a1):
            times[a1 + k] = (tw[b1 + k]['start'], tw[b1 + k]['end'])
# interpolate gaps
i = 0
while i < len(toks):
    if times[i] is None:
        j = i
        while j < len(toks) and times[j] is None: j += 1
        t0 = times[i - 1][1] if i else 0.2
        t1 = times[j][0] if j < len(toks) else t0 + 0.4 * (j - i)
        step = (t1 - t0) / (j - i)
        for k in range(i, j): times[k] = (t0 + step * (k - i), t0 + step * (k - i + 1) - 0.02)
        print('interpolated:', toks[i:j])
        i = j
    else: i += 1
(here / 'data' / 'words.js').write_text('window.WORDS = ' + json.dumps([{'s': round(s, 3), 'e': round(e, 3)} for s, e in times]) + ';\n')
print('tokens', len(toks), 'matched words', len(tw), 'end', times[-1][1])
