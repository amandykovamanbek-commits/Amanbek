import re, json, sys
import numpy as np
script, silf, dur, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
body = open(script).read().split('## Факты')[0].split('\n', 1)[1]
paras = [p.replace('\n— ', ' ').replace('\n', ' ').strip() for p in re.split(r'\n\s*\n', body) if re.search(r'\w', p)]
sil = [tuple(map(float, l.split())) for l in open(silf) if l.strip()]
start = sil[0][1] if sil[0][0] < .05 else 0.0
endt = sil[-1][0] if sil[-1][1] >= dur - .3 else dur
cands = [(a, b) for a, b in sil if a > start + .05 and b < endt - .05]
clen = lambda s: len(re.sub(r'[^\wё]', '', s)) + .6 * len(re.findall(r'\s', s)) + 2.5 * len(re.findall(r'[.?!…]', s)) + 1.0 * len(re.findall(r'[,:—]', s))
def dp(units, t0, t1, cs, wpause):
    K = len(units); L = np.array([clen(u) for u in units]); C = len(cs)
    if K == 1: return [(t0, t0), (t1, t1)]
    sp = [b - a for a, b in cs]; r = ((t1 - t0) - 0) / L.sum()
    INF = 1e18; f = np.full((K, C), INF); bp = np.zeros((K, C), int)
    cost = lambda k, a, b, p: ((b - a) - L[k] * r) ** 2 / max(L[k] * r, .2) - wpause * min(p, 1.2)
    for j in range(C): f[0][j] = cost(0, t0, cs[j][0], sp[j])
    for k in range(1, K - 1):
        for j in range(C):
            for i in range(j):
                if f[k - 1][i] >= INF: continue
                v = f[k - 1][i] + cost(k, cs[i][1], cs[j][0], sp[j])
                if v < f[k][j]: f[k][j] = v; bp[k][j] = i
    best = INF; bj = -1
    for j in range(C):
        if f[K - 2][j] < INF:
            v = f[K - 2][j] + cost(K - 1, cs[j][1], t1, 0)
            if v < best: best, bj = v, j
    if bj < 0: # not enough pauses: proportional split
        acc = np.cumsum(L)[:-1] / L.sum(); return [(t0, t0)] + [(t0 + (t1 - t0) * a,) * 2 for a in acc] + [(t1, t1)]
    seq = [bj]
    for k in range(K - 2, 0, -1): seq.append(bp[k][seq[-1]])
    return [(t0, t0)] + [cs[j] for j in seq[::-1]] + [(t1, t1)]
# level 1: paragraphs, favour long pauses strongly
pb = dp(paras, start, endt, cands, 6.0)
words = []
for pi, p in enumerate(paras):
    a, b = pb[pi][1], pb[pi + 1][0]
    sents = [x.strip() for x in re.split(r'(?<=[.?!…])\s+', p) if re.search(r'\w', x)]
    inner = [c for c in cands if c[0] > a + .05 and c[1] < b - .05]
    sb = dp(sents, a, b, inner, 1.5)
    for si, snt in enumerate(sents):
        sa, se = sb[si][1], sb[si + 1][0]
        ws = [w for w in snt.replace('—', ' ').split() if re.search(r'\w', w)]
        wl = [len(re.sub(r'[^\wё]', '', w)) + 1.2 for w in ws]; c = sum(wl); x = sa
        for w, l in zip(ws, wl):
            d = (se - sa) * l / c; words.append({'w': w, 's': round(x, 3), 'e': round(x + d * .94, 3)}); x += d
json.dump(words, open(out, 'w'), ensure_ascii=False)
print('paras', len(paras), 'words', len(words))
