#!/usr/bin/env python3
"""mix2.py SFX_WAV VOICES_JSON VOICE_DIR OUT_WAV — voices over the page's procedural SFX+music, with ducking."""
import json, sys, wave, numpy as np
sfx_p, vj, vd, out_p = sys.argv[1:5]
SR = 48000

def read(p):
    with wave.open(p) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    x = x.reshape(-1, ch)
    if ch == 1: x = np.repeat(x, 2, axis=1)
    if sr != SR:
        idx = np.arange(0, len(x), sr / SR); x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1).astype(np.float32)
    return x

V = json.load(open(vj)); total = V["TOTAL"]
sfx = read(sfx_p); n = int(total * SR)
bed = np.zeros((n, 2), np.float32); bed[:min(n, len(sfx))] = sfx[:n]
vox = np.zeros((n, 2), np.float32)
for v in V["voices"]:
    x = read(f"{vd}/{v['file']}.wav") * v["gain"]
    i = int(v["t"] * SR); j = min(n, i + len(x)); vox[i:j] += x[:j - i]
# ducking: bed −7 dB under speech (smoothed envelope)
env = np.abs(vox).max(1)
k = int(0.12 * SR); env = np.convolve(env, np.ones(k) / k, mode="same")
duck = 1 - 0.55 * np.clip(env / 0.05, 0, 1)
mix = bed * duck[:, None] * 0.8 + vox * 1.0
mix /= max(1e-6, np.abs(mix).max()) / 0.9
with wave.open(out_p, "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print("mixed", total)
