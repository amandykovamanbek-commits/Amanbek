"""Resolve shot cue times (mirror of Main.tsx) -> prints frame numbers for test stills.
usage: python3 tools/shot_times.py [chapters...] [--mid] -> 'frame,frame,...'"""
import re, json, sys, pathlib
here = pathlib.Path(__file__).parent.parent
tl = json.loads((here / 'src/data/timeline.json').read_text())
GAP, INTRO = 1.6, 2.4
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
shots = {}
for f in sorted((here / 'src/shots').glob('ch*.tsx')):
    src = f.read_text()
    for m in re.finditer(r'export const CH(\d+): Shot\[\] = \[(.*?)\n\];', src, re.S):
        shots[int(m.group(1))] = re.findall(r'\bat: "([^"]*)"', m.group(2))
want = [int(a) for a in sys.argv[1:] if a.isdigit()]
out = []
CH = tl['chapters']
for ci, c in enumerate(CH):
    if want and c['i'] not in want: continue
    cues = shots.get(c['i'], [])
    vs = INTRO - 0.3 if c['i'] == 0 else c['start'] - GAP + 0.55
    starts, frm = [], 0
    for k, cue in enumerate(cues):
        if k == 0 or cue == '^': starts.append(vs); continue
        cw = [norm(x) for x in cue.split() if norm(x)]
        for i in range(frm, len(c['words'])):
            if all(norm(c['words'][i + j]['w']) == cw[j] for j in range(len(cw)) if i + j < len(c['words'])):
                starts.append(c['start'] + c['words'][i]['s'] - 0.2); frm = i; break
        else: raise SystemExit(f'cue not found ch{c["i"]}: {cue}')
    end = CH[ci + 1]['start'] - GAP + 0.55 if ci + 1 < len(CH) else tl['end'] + 4
    for k, s in enumerate(starts):
        e = starts[k + 1] if k + 1 < len(starts) else end
        out.append((c['i'], k, cues[k], s, e))
if '--list' in sys.argv:
    for o in out: print(f'ch{o[0]:02d} #{o[1]:02d} {o[3]:7.2f}-{o[4]:7.2f} ({o[4]-o[3]:4.1f}s) {o[2]}')
else:
    print(','.join(str(int(((s + e) / 2 if '--mid' in sys.argv else s + min(1.2, (e - s) * 0.6)) * 30)) for _, _, _, s, e in out))
