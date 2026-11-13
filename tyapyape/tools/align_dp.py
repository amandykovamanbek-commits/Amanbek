import re, json, sys
import numpy as np
script, silf, dur, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
s = open(script).read().split('## Факты')[0].split('\n', 1)[1].replace('\n— ', ' ').replace('\n', ' ')
toks = [w for w in s.split() if re.search(r'\w', w)]
# phrase units: break after punctuation
units = []; cur = []
for w in toks:
    cur.append(w)
    if re.search(r'[.,?!…:»]$', w) or w.endswith('—'): units.append(cur); cur = []
if cur: units.append(cur)
# drop dash-only tokens inside
sil = [tuple(map(float, l.split())) for l in open(silf) if l.strip()]
start = sil[0][1] if sil[0][0] < .05 else 0.0
endt = sil[-1][0] if sil[-1][1] >= dur - .3 else dur
cands = [(a, b) for a, b in sil if a > start + .05 and b < endt - .05]
C = len(cands); K = len(units)
L = np.array([sum(len(re.sub(r'[^\wё]', '', w)) + 1 for w in u) for u in units], float)
strong = np.array([b - a for a, b in cands])
speech = (endt - start) - strong.sum() * .5
r = speech / L.sum()
endsSent = [bool(re.search(r'[.?!…]$', u[-1])) for u in units]
# DP: f[k][j] = min cost having unit k end at candidate j (k from 0..K-2), boundary K-1 = endt
INF = 1e18
f = np.full((K, C + 1), INF); bp = np.zeros((K, C + 1), int)
pos = [ (a + b) / 2 for a, b in cands ]
def ucost(k, t0, t1, pausedur):
    d = t1 - t0; e = L[k] * r
    c = (d - e) ** 2 / max(e, .3)
    # sentence end should coincide with longer pauses
    if k < K - 1: c -= (1.6 if endsSent[k] else .8) * min(pausedur, .8)
    return c
for j in range(C):
    f[0][j] = ucost(0, start, cands[j][0], strong[j])
for k in range(1, K - 1):
    for j in range(k, C):
        best = INF; bi = -1
        for i in range(max(0, j - 12), j):
            v = f[k - 1][i]
            if v >= INF: continue
            v += ucost(k, cands[i][1], cands[j][0], strong[j])
            if v < best: best, bi = v, i
        f[k][j] = best; bp[k][j] = bi
# last unit ends at endt
best = INF; bj = -1
for j in range(C):
    if f[K - 2][j] >= INF: continue
    v = f[K - 2][j] + ucost(K - 1, cands[j][1], endt, 0)
    if v < best: best, bj = v, j
seq = [bj]
for k in range(K - 2, 0, -1): seq.append(bp[k][seq[-1]])
seq = seq[::-1]
bounds = [(start, start)] + [cands[j] for j in seq] + [(endt, endt)]
words = []
for k, u in enumerate(units):
    a = bounds[k][1]; b = bounds[k + 1][0]
    ws = [w for w in u if re.search(r'\w', w)]
    wl = [len(re.sub(r'[^\wё]', '', w)) + 1.2 for w in ws]; c = sum(wl); x = a
    for w, l in zip(ws, wl):
        d = (b - a) * l / c; words.append({'w': w, 's': round(x, 3), 'e': round(x + d * .94, 3)}); x += d
json.dump(words, open(out, 'w'), ensure_ascii=False)
print('units', K, 'cands', C, 'words', len(words), 'cost', round(best, 2))
