"""Pilot 2 sound bed: dark drone + impacts + whooshes on cuts -> sfx.wav; then mixes final pilot2.mp4."""
import json, os, subprocess, wave
import numpy as np

SC = os.path.dirname(os.path.abspath(__file__)); PJ = os.path.abspath(os.path.join(SC, ".."))
T = json.load(open(os.path.join(PJ, "timing.json"), encoding="utf-8"))

SR = 44100; TT = T["total"]; n = int(SR * TT); t = np.arange(n) / SR
rng = np.random.default_rng(1)
drone = 0.5 * np.sin(2 * np.pi * 55 * t) + 0.35 * np.sin(2 * np.pi * 82.4 * t + 0.5) + 0.2 * np.sin(2 * np.pi * 110.3 * t)
drone *= 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.0)
noise = np.convolve(rng.standard_normal(n), np.ones(400) / 400, "same") * 6
bed = (drone + noise) * 0.06
bed *= np.clip(t / 1.5, 0, 1) * np.clip((TT - t) / 1.5, 0, 1)
# heartbeat in hospital
for b in np.arange(T["cuts"][4], T["cuts"][5], 0.8):
    i = int(b * SR); m = int(0.18 * SR); e = np.exp(-np.linspace(0, 9, m))
    bed[i:i + m] += 0.25 * np.sin(2 * np.pi * 48 * np.arange(m) / SR) * e
for imp, g in [(T["t_name"], .45), (T["t_ryaba"], .5), (T["t_fall"], 1.0), (T["t_hosp"], .4), (T["t_stand"], .5)]:
    i = int(imp * SR); m = int(0.9 * SR); tt = np.arange(m) / SR
    f = 60 * np.exp(-tt * 4) + 35
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5)
    crack = rng.standard_normal(m) * np.exp(-tt * 35) * 0.5
    seg = 0.55 * g * (thump + crack); bed[i:i + m] += seg[: len(bed[i:i + m])]
for c in T["cuts"][1:]:
    i = int((c - 0.35) * SR); m = int(0.5 * SR); env = np.sin(np.linspace(0, np.pi, m)) ** 2
    w = np.convolve(rng.standard_normal(m), np.ones(30) / 30, "same") * env * 0.5
    bed[i:i + m] += w[: len(bed[i:i + m])]
bed = np.clip(bed, -1, 1)
sfx = os.path.join(PJ, "sfx.wav")
with wave.open(sfx, "w") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((bed * 32767).astype(np.int16).tobytes())
print("sfx ok")

vid = os.path.join(PJ, "pilot2_video.mp4"); voice = os.path.join(PJ, "voice.mp3"); out = os.path.join(PJ, "pilot2.mp4")
if os.path.exists(vid):
    if os.path.exists(voice):
        fc = "[1:a]volume=1.0[v];[2:a]volume=0.55[s];[v][s]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[a]"
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", voice, "-i", sfx, "-filter_complex", fc]
    else:
        fc = "[1:a]volume=0.55,alimiter=limit=0.95[a]"
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", sfx, "-filter_complex", fc]
    subprocess.run(cmd + ["-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(TT), out], check=True)
    print("final ok", out)
