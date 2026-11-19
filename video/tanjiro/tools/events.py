"""Shared: resolve every shot (start/end), its music mood and SFX events to absolute times (mirror of Main.tsx)."""
import re, json, pathlib
here = pathlib.Path(__file__).parent.parent
GAP, INTRO, OUTRO = 1.6, 2.4, 4.0
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))

def shots():
    tl = json.loads((here / 'src/data/timeline.json').read_text())
    blocks = {}
    for f in sorted((here / 'src/shots').glob('ch*.tsx')):
        src = f.read_text()
        for m in re.finditer(r'export const CH(\d+): Shot\[\] = \[(.*?)\n\];', src, re.S):
            parts = re.split(r'\n  \{\n    at: ', m.group(2))[1:]
            out = []
            for p in parts:
                at = re.match(r'"([^"]*)"', p).group(1)
                head = p.split('r: (')[0]
                mus = re.search(r'music: "(\w+)"', head)
                sfx = re.search(r'sfx: (\[\[.*?\]\])', head)
                ev = json.loads(sfx.group(1)) if sfx else []
                cut = re.search(r'cut: "(\w+)"', head)
                out.append({'at': at, 'music': mus.group(1) if mus else None, 'sfx': ev, 'cut': cut.group(1) if cut else 'cut'})
            blocks[int(m.group(1))] = out
    CH = tl['chapters']
    res = []
    for ci, c in enumerate(CH):
        vs = 0 if c['i'] == 0 else c['start'] - GAP + 0.55
        frm, starts = 0, []
        for k, s in enumerate(blocks[c['i']]):
            if k == 0 or s['at'] == '^': starts.append(vs); continue
            cw = [norm(x) for x in s['at'].split() if norm(x)]
            for i in range(frm, len(c['words'])):
                if all(i + j < len(c['words']) and norm(c['words'][i + j]['w']) == cw[j] for j in range(len(cw))):
                    starts.append(c['start'] + c['words'][i]['s'] - 0.2); frm = i; break
            else: raise SystemExit(f'cue not found ch{c["i"]}: {s["at"]}')
        end = CH[ci + 1]['start'] - GAP + 0.55 if ci + 1 < len(CH) else tl['end'] + OUTRO
        for k, s in enumerate(blocks[c['i']]):
            res.append({**s, 'ch': c['i'], 'k': k, 'start': starts[k], 'end': starts[k + 1] if k + 1 < len(starts) else end})
    return tl, res
