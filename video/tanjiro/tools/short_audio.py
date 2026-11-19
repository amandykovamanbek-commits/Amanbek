"""Build the soundtrack of Short #5 from the long video's stems.
usage: python3 tools/short_audio.py OUT.wav
Splits mix_raw into voice + bed (music, sfx) by least squares, then:
  hook  = bed under ch14 «Ты открываешь глаза» (boom lands on «И стал им») + new hook VO
  S1/S2 = the long mix as is (ch13 «Мудзан горит…», ch14 up to «Ты возвращаешься.»)
  outro = music only (no chapter-card swoosh) + new outro VO, ducked, faded out
Times must match src/Short.tsx."""
import json, subprocess, sys, pathlib
import numpy as np
here = pathlib.Path(__file__).parent.parent
SR = 48000
tl = json.loads((here / 'src' / 'data' / 'timeline.json').read_text())

def load(p, ch=2):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.float32)
    return x.reshape(-1, ch).T.copy() if ch == 2 else x.copy()

A = here / 'public' / 'audio'
mix, music, sfx = load(A / 'mix_raw.wav'), load(A / 'music.wav'), load(A / 'sfx.wav')
N = mix.shape[1]
voice = np.zeros_like(mix)
for c in tl['chapters'][12:16]:
    v = load(here / 'public' / 'vo' / f"{c['i']:02d}.mp3", 1)
    i0 = int(c['start'] * SR); n = min(len(v), N - i0)
    voice[:, i0:i0 + n] += v[:n]

# mix_raw = g*(voice + kM*music + kS*sfx): solve for the three gains on ch13–14
s0, s1 = int(845 * SR), int(905 * SR)
X = np.stack([voice[:, s0:s1].ravel(), music[:, s0:s1].ravel(), sfx[:, s0:s1].ravel()], 1)[::5]
y = mix[:, s0:s1].ravel()[::5]
gv, gm, gs = np.linalg.lstsq(X, y, rcond=None)[0]
res = y - X @ np.array([gv, gm, gs])
print(f'gains voice {gv:.3f} music {gm:.3f} sfx {gs:.3f}  residual {np.sqrt(np.mean(res**2)) / np.sqrt(np.mean(y**2)):.4f}')
bed = gm * music + gs * sfx

def cut(x, t0, d): return x[:, int(t0 * SR):int(t0 * SR) + int(d * SR)].copy()
DUR = 49.9
out = np.zeros((2, int(DUR * SR) + SR), np.float32)
def place(x, tau, fi=0.03, fo=0.03):
    x = x.copy(); n = x.shape[1]
    a, b = int(fi * SR), int(fo * SR)
    if a: x[:, :a] *= np.linspace(0, 1, a)
    if b: x[:, n - b:] *= np.linspace(1, 0, b)
    i = int(tau * SR); out[:, i:i + n] += x

XF = 0.04  # overlap at each join
# hook 0–3.8: «И» of the hook VO at 0.12+2.45 = 2.57 ↔ boom at 867.06 (ch14 «Ты открываешь глаза» + 0.6)
place(cut(bed, 867.06 - 2.57, 3.8 + XF), 0, fi=0.02, fo=XF)
hook = load(here / 'public' / 'short' / 'hook.mp3', 1)
place(np.stack([hook, hook]) * gv, 0.12, fi=0, fo=0.01)
# S1 3.8–9.8, S2 9.8–45.37 (cut before the ch15 card swoosh at 896.95)
place(cut(mix, 853.62 - XF, 6.0 + 2 * XF), 3.8 - XF, fi=XF, fo=XF)
place(cut(mix, 861.28 - XF, 35.57 + 2 * XF), 9.8 - XF, fi=XF, fo=0.08)
# outro 45.37–49.9: the warm music continues, ducked under the CTA voice, then fades
o0 = 45.37 - 0.08
m = cut(gm * music, 896.85 - 0.08, DUR - o0)
n = m.shape[1]; tt = np.arange(n) / SR
duck = 1 - 0.45 * np.clip((tt - 0.3) / 0.4, 0, 1)
duck *= np.clip((tt[-1] - tt) / 1.2, 0, 1) ** 1.5
place(m * duck, o0, fi=0.08, fo=0.02)
outro = load(here / 'public' / 'short' / 'outro.mp3', 1)
place(np.stack([outro, outro]) * gv, 46.0, fi=0, fo=0.01)

out = out[:, :int(DUR * SR)]
out /= max(1.0, np.abs(out).max() / 0.95)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', sys.argv[1]], input=out.T.astype(np.float32).tobytes(), check=True)
print('wrote', sys.argv[1], DUR)
