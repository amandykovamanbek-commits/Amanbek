"""Insert silences after HOLD words (cut at the quietest point near the word boundary), shift word timings.
usage: python3 -I holds_v3.py voice_raw.mp3 aligned.json words_list.json holds.json out.wav out_words.json lead"""
import sys, json, subprocess, array
raw, al, wl, hl, out_wav, out_words, lead = sys.argv[1:8]; lead = float(lead)
SR = 48000
pcm = array.array('h', subprocess.run(['ffmpeg', '-v', 'error', '-i', raw, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout)
T = json.load(open(al)); W = json.load(open(wl)); H = json.load(open(hl))
norm = lambda w: ''.join(c for c in w.lower().replace('ё', 'е') if c.isalnum())
def rms(a, b):
    a, b = max(0, int(a * SR)), min(len(pcm), int(b * SR))
    return (sum(x * x for x in pcm[a:b]) / max(1, b - a)) ** .5
cuts = []
for key, dur in H.items():
    sid, word = key.split(':')
    idx = [i for i, w in enumerate(W) if w['id'] == sid and norm(w['w']) == word][0]
    a, b = T[idx]['e'], T[idx + 1]['s'] if idx + 1 < len(T) else T[idx]['e'] + .1
    lo, hi = min(a, b) - .08, max(a, b) + .08
    import os
    ov = json.loads(os.environ.get('CUTS', '{}'))
    if key in ov: cuts.append((ov[key], dur, idx)); continue
    best = min((rms(x / 1000, x / 1000 + .02), x / 1000) for x in range(int(lo * 1000), int(hi * 1000), 5))[1] + .01
    cuts.append((best, dur, idx))
cuts.sort()
out = array.array('h', [0] * int(lead * SR)); prev = 0; shift = lead; shifts = []
for c, d, idx in cuts:
    out.extend(pcm[int(prev * SR):int(c * SR)]); out.extend([0] * int(d * SR)); prev = c; shifts.append((c, d))
out.extend(pcm[int(prev * SR):])
def sh(t): return t + lead + sum(d for c, d in shifts if c <= t)
words = [{'s': round(sh(x['s']), 3), 'e': round(sh(x['e']), 3)} for x in T]
json.dump(words, open(out_words, 'w'))
import wave
with wave.open(out_wav, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('cuts', [(round(c, 2), d) for c, d, _ in cuts], 'dur', round(len(out) / SR, 2))
