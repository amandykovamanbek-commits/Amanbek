"""Map known script words onto ASR word timestamps (faster-whisper) with a global DP alignment.
usage: python3 -I asr_align.py script_words.json asr_words.json out.json"""
import json, sys, re, difflib
S = json.load(open(sys.argv[1])); A = json.load(open(sys.argv[2]))
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
TR = dict(zip('abcdefghijklmnopqrstuvwxyz', ['а','б','к','д','е','ф','г','х','и','дж','к','л','м','н','о','п','к','р','с','т','у','в','в','кс','и','з']))
lat = lambda w: ''.join(TR.get(c, c) for c in w)
s = [norm(w) for w in S]; a = [lat(norm(x['w'])) for x in A]
def sim(x, y):
    if not x or not y: return 0
    return difflib.SequenceMatcher(None, x, y).ratio()
n, m = len(s), len(a)
INF = 1e18
D = [[INF] * (m + 1) for _ in range(n + 1)]; P = [[None] * (m + 1) for _ in range(n + 1)]
D[0][0] = 0
GAP_S, GAP_A = .9, .6
for i in range(n + 1):
    for j in range(m + 1):
        d = D[i][j]
        if d >= INF: continue
        if i < n and j < m:
            c = d + (1 - sim(s[i], a[j])) * 1.6
            if c < D[i + 1][j + 1]: D[i + 1][j + 1] = c; P[i + 1][j + 1] = (i, j, 'm')
            # one script word spoken as two ASR tokens / two script words merged in one ASR token
            if j + 1 < m:
                c2 = d + (1 - sim(s[i], a[j] + a[j + 1])) * 1.6 + .2
                if c2 < D[i + 1][j + 2]: D[i + 1][j + 2] = c2; P[i + 1][j + 2] = (i, j, 'm2')
            if i + 1 < n:
                c3 = d + (1 - sim(s[i] + s[i + 1], a[j])) * 1.6 + .2
                if c3 < D[i + 2][j + 1]: D[i + 2][j + 1] = c3; P[i + 2][j + 1] = (i, j, 's2')
        if i < n and d + GAP_S < D[i + 1][j]: D[i + 1][j] = d + GAP_S; P[i + 1][j] = (i, j, 'ds')
        if j < m and d + GAP_A < D[i][j + 1]: D[i][j + 1] = d + GAP_A; P[i][j + 1] = (i, j, 'da')
T = [None] * n
i, j = n, m
while (i, j) != (0, 0):
    pi, pj, op = P[i][j]
    if op == 'm': T[pi] = (A[pj]['s'], A[pj]['e'])
    elif op == 'm2': T[pi] = (A[pj]['s'], A[pj + 1]['e'])
    elif op == 's2':
        st, en = A[pj]['s'], A[pj]['e']; L1, L2 = len(s[pi]), len(s[pi + 1]); mid = st + (en - st) * L1 / (L1 + L2)
        T[pi] = (st, mid); T[pi + 1] = (mid, en)
    i, j = pi, pj
# interpolate gaps
miss = [k for k in range(n) if T[k] is None]
for k in range(n):
    if T[k] is None:
        a0 = max([q for q in range(k) if T[q]], default=None); b0 = min([q for q in range(k + 1, n) if T[q]], default=None)
        st = T[a0][1] if a0 is not None else 0; en = T[b0][0] if b0 is not None else st + .4
        span = [q for q in range(n) if (a0 is None or q > a0) and (b0 is None or q < b0)]
        tot = sum(len(s[q]) + 1 for q in span); acc = sum(len(s[q]) + 1 for q in span if q < k)
        T[k] = (st + (en - st) * acc / tot, st + (en - st) * (acc + len(s[k]) + 1) / tot)
# whisper often stretches word ends into pauses: clamp each end to next start
out = []
for k in range(n):
    st, en = T[k]
    if k + 1 < n: en = min(en, T[k + 1][0])
    out.append({'s': round(st, 3), 'e': round(max(en, st + .05), 3)})
json.dump(out, open(sys.argv[3], 'w'))
print('script', n, 'asr', m, 'interpolated', len(miss), [S[k] for k in miss][:30])
