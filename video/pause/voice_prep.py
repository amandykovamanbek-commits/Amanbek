"""Shorten pauses in the ElevenLabs take, time-stretch, and remap ASR word timings.
usage: python3 voice_prep.py take.mp3 words.json tempo  -> audio/voice.wav, audio/voice.mp3, audio/words_mapped.json"""
import sys, json, subprocess, numpy as np, pathlib
here = pathlib.Path(__file__).parent
take, wj, tempo = sys.argv[1], sys.argv[2], float(sys.argv[3])
sr = 48000
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', take, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
win = int(.02 * sr); n = len(x) // win
db = 20 * np.log10(np.sqrt(np.mean(x[:n * win].reshape(n, win) ** 2, axis=1)) + 1e-9)
sil = db < -40
keep = np.ones(len(x), bool); i = 0
while i < n:
    if not sil[i]: i += 1; continue
    j = i
    while j < n and sil[j]: j += 1
    d = (j - i) * win / sr
    if i == 0:
        if d > .15: keep[:j * win - int(.15 * sr)] = False
    elif j == n:
        if d > .6: keep[i * win + int(.6 * sr):] = False
    elif d > .30:
        keep[i * win + int(.15 * sr): j * win - int(.15 * sr)] = False
    i = j
cum = np.cumsum(keep)
y = x[keep]
tmp = here / 'audio' / '_v.f32'; y.astype(np.float32).tofile(tmp)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', str(tmp), '-af',
                f'rubberband=tempo={tempo}:transients=crisp:detector=compound:phase=laminar:formant=preserved:pitchq=quality,aresample={sr}',
                '-c:a', 'pcm_s16le', str(here / 'audio' / 'voice.wav')], check=True)
tmp.unlink()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(here / 'audio' / 'voice.wav'), '-c:a', 'libmp3lame', '-b:a', '192k', str(here / 'audio' / 'voice.mp3')], check=True)
m = lambda t: cum[min(len(cum) - 1, max(0, int(t * sr)))] / sr / tempo
W = json.load(open(wj)); W = W.get('words', W)
out = [dict(w, start=round(m(w['start']), 3), end=round(m(w['end']), 3)) for w in W if w.get('type', 'word') == 'word']
json.dump(out, open(here / 'audio' / 'words_mapped.json', 'w'), ensure_ascii=False)
print('voice', len(y) / sr / tempo, 'last word end', out[-1]['end'])
