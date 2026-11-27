# python3 mix.py  -> audio/sfx.wav + audio/mix.wav (music + SFX, sidechain dip under hits, -14 LUFS)
# Cue sheet comes from index.html getSfx() via: node ../render.cjs sfx audio/sfx.json
import json, subprocess, numpy as np, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
SR = 48000

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def write(path, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', path],
                   input=x.astype(np.float32).tobytes(), check=True)

cues = json.load(open('audio/sfx.json'))
dur = cues['duration']
N = int((dur + .5) * SR)
src = {k: load(f'audio/src/{k}.mp3') for k in ['punch', 'bell', 'crowd']}
# where the transient sits inside each file (seconds) -> aligned to cue time
LEAD = {'punch': 1.083, 'bell': 0.0, 'crowd': 0.0}

def onset(x):
    e = np.abs(x).max(1); return int(np.argmax(e > .1 * e.max()))
LEAD['punch'] = onset(src['punch']) / SR

sfx = np.zeros((N, 2), np.float32)
duck = np.ones(N, np.float32)
for ev in cues['events']:
    k, t, g, r = ev['k'], ev['t'], ev.get('g', 1), ev.get('r', 1)
    x = src[k]
    if r != 1:   # varispeed (pitch + speed) for variation
        idx = np.arange(0, len(x) - 1, r)
        x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)
    s0 = int((t - LEAD[k] / r) * SR)
    a, b = max(0, s0), min(N, s0 + len(x))
    if b > a: sfx[a:b] += x[a - s0:b - s0] * g
    if k == 'punch' and g > .7:   # fast sidechain dip on the music under big hits
        i0 = int(t * SR); L = int(.28 * SR)
        env = 1 - .45 * np.exp(-np.arange(L) / (.09 * SR))
        duck[i0:i0 + L] = np.minimum(duck[i0:i0 + L], env[:max(0, min(L, N - i0))])

music = load('audio/src/music.mp3')[:N]
music = np.pad(music, ((0, N - len(music)), (0, 0)))
fade = np.clip((dur - np.arange(N) / SR) / 0.7, 0, 1)[:, None]   # tail fade with the picture
mix = music * .7 * duck[:, None] * fade + sfx * 1.15
write('audio/sfx.wav', sfx)
write('audio/premix.wav', mix)
# two-pass loudnorm to -14 LUFS / TP -1
j = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'audio/premix.wav', '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True).stderr
m = json.loads(j[j.rindex('{'):j.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample={SR}")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/premix.wav', '-af', af, '-c:a', 'pcm_s16le', 'audio/mix.wav'], check=True)
os.remove('audio/premix.wav')
print('ok', len(cues['events']), 'cues, input', m['input_i'], 'LUFS')
