"""Insert silences after the LAST word of given scenes, cutting in the middle of the real pause (silencedetect).
usage: python3 -I holds_tools.py voice_raw.mp3 aligned.json wl.json holds.json out.wav out_words.json lead"""
import sys, json, subprocess, array, re, wave
raw, al, wl, hl, out_wav, out_words, lead = sys.argv[1:8]; lead = float(lead)
SR = 48000
pcm = array.array('h', subprocess.run(['ffmpeg', '-v', 'error', '-i', raw, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout)
T = json.load(open(al)); W = json.load(open(wl)); H = json.load(open(hl))
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'silencedetect=noise=-38dB:d=0.08', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
sil = list(zip(st, en))
# refine ASR times: a start inside a pause moves to the pause end, an end inside a pause moves to the pause start
for x in T:
    for a, e in sil:
        if a + .02 < x['s'] < e: x['s'] = e
        if a < x['e'] < e - .02: x['e'] = max(a, x['s'] + .05)
        if e - a >= .12 and x['s'] <= a < x['s'] + .3 and e < x['e']: x['s'] = e          # pause swallowed at the word start
        if e - a >= .12 and x['e'] - .3 < e <= x['e'] and a > x['s']: x['e'] = a          # pause swallowed at the word end
for k in range(len(T) - 1):
    if T[k]['e'] > T[k + 1]['s']: T[k]['e'] = T[k + 1]['s']
cuts = []
norm = lambda w: ''.join(c for c in w.lower().replace('ё', 'е') if c.isalnum())
for key, dur in H.items():
    sid, _, word = key.partition(':')
    idx = [i for i, w in enumerate(W) if w['id'] == sid and norm(w['w']) == word][0] if word else max(i for i, w in enumerate(W) if w['id'] == sid)
    b = T[idx]['e']; nxt = T[idx + 1]['s'] if idx + 1 < len(T) else b + .3
    cand = [(a, e) for a, e in sil if e > b - .35 and a < nxt + .35]
    if cand:
        a, e = min(cand, key=lambda g: abs((g[0] + g[1]) / 2 - (b + nxt) / 2))
        c = (a + e) / 2
    else:
        c = (b + nxt) / 2
    cuts.append((c, dur, key))
cuts.sort()
out = array.array('h', [0] * int(lead * SR)); prev = 0; shifts = []
for c, d, sid in cuts:
    out.extend(pcm[int(prev * SR):int(c * SR)]); out.extend([0] * int(d * SR)); prev = c; shifts.append((c, d))
out.extend(pcm[int(prev * SR):])
sh = lambda t: t + lead + sum(d for c, d in shifts if c <= t)
def fix(x):
    st, en = x['s'], x['e']
    for c, d in shifts:
        if st < c < en: st = c
    return {'s': round(sh(st), 3), 'e': round(sh(en), 3)}
json.dump([fix(x) for x in T], open(out_words, 'w'))
with wave.open(out_wav, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('cuts', [(sid, round(c, 2), d) for c, d, sid in cuts], 'dur', round(len(out) / SR, 2))
