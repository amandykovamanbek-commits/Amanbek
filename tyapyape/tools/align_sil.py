import re, json, sys
script, silf, dur, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
s = open(script).read().split('## Факты')[0].split('\n', 1)[1].replace('\n— ', ' ').replace('\n', ' ')
sents = [x.strip() for x in re.split(r'(?<=[.?!…])\s+', s) if re.search(r'\w', x)]
sil = [tuple(map(float, l.split())) for l in open(silf) if l.strip()]
# speech start/end
start = sil[0][1] if sil and sil[0][0] < .05 else 0.0
endt = sil[-1][0] if sil and sil[-1][1] >= dur - .3 else dur
inner = [x for x in sil if x[0] > start + .1 and x[1] < endt - .1]
L = [len(re.sub(r'[^\wё-]', '', x)) + 2 for x in sents]
tot = sum(L); speech = endt - start - sum(b - a for a, b in inner) * .6
bounds = []; acc = 0; used = -1
for i in range(len(sents) - 1):
    acc += L[i]; e = start + (endt - start) * acc / tot
    best = None
    for j in range(used + 1, len(inner)):
        d = abs((inner[j][0] + inner[j][1]) / 2 - e)
        if d < 2.2 and (best is None or d < best[0]): best = (d, j)
    if best: used = best[1]; bounds.append(inner[best[1]])
    else: bounds.append(None)
# fill None by interpolation between known
edges = [(start, start)] + bounds + [(endt, endt)]
pts = []
for i, b in enumerate(edges):
    pts.append(b)
for i in range(len(pts)):
    if pts[i] is None:
        j = i
        while pts[j] is None: j += 1
        a = pts[i - 1][1]; bb = pts[j][0]; n = j - i + 1
        cl = [L[k - 1] for k in range(i, j + 1)]; c = sum(cl); x = a
        for k in range(i, j):
            x += (bb - a) * cl[k - i] / c; pts[k] = (x, x)
words = []
for i, sent in enumerate(sents):
    a = pts[i][1]; b = pts[i + 1][0]
    ws = [w for w in sent.replace('—', ' ').split() if re.search(r'\w', w)]
    wl = [len(re.sub(r'[^\wё-]', '', w)) + 1.5 for w in ws]; c = sum(wl); x = a
    for w, l in zip(ws, wl):
        d = (b - a) * l / c; words.append({'w': w, 's': round(x, 3), 'e': round(x + d * .92, 3)}); x += d
json.dump(words, open(out, 'w'), ensure_ascii=False)
print(len(words), 'matched', sum(1 for b in bounds if b), '/', len(bounds))
