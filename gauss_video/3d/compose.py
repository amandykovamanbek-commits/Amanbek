#!/usr/bin/env python3
"""Overlay captions / inserts on rendered 3D frames, mix audio, encode.
usage: compose.py <timeline_dir> <frames_dir> <out.mp4>"""
import json, math, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

TLD, FR, OUT = sys.argv[1:4]
tl = json.load(open(f"{TLD}/timeline.json"))
FPS, TOTAL, SEGS = tl["fps"], tl["total"], tl["segments"]
W, H = 1080, 1920
SR = 44100
F_BLACK = "/usr/share/fonts/opentype/montserrat/Montserrat-Black.otf"
F_XB = "/usr/share/fonts/opentype/montserrat/Montserrat-ExtraBold.otf"
_fc = {}
def font(p, s):
    s = max(1, int(s)); k = (p, s)
    if k not in _fc: _fc[k] = ImageFont.truetype(p, s)
    return _fc[k]

def clamp(x): return max(0.0, min(1.0, x))
def pop(x):  # 0.8 -> 1.05 -> 1 within ~7 frames
    x = clamp(x / 0.23)
    if x < 0.6: return 0.8 + 0.25 * (x / 0.6)
    return 1.05 - 0.05 * ((x - 0.6) / 0.4)

YELLOW, GREEN, RED = (245, 200, 66), (61, 220, 132), (255, 75, 75)
KEY = {"час": YELLOW, "минуту!": YELLOW, "1786": YELLOW, "100.": YELLOW, "1": YELLOW, "Гаусс": (240, 138, 36),
       "5050.": YELLOW, "5050": YELLOW, "правильный": GREEN, "ответ!": GREEN, "закономерность.": YELLOW,
       "101": YELLOW, "101!": YELLOW, "101.": YELLOW, "50.": YELLOW, "50": YELLOW, "королём": YELLOW,
       "математиков.": YELLOW, "задачу,": YELLOW}

# ---------------------------------------------------------------- caption chunks (1-3 words)
chunks = []
for s in SEGS:
    ws = s["cap"].split()
    groups, cur = [], []
    for w in ws:
        cur.append(w)
        n = sum(len(x) for x in cur)
        if len(cur) >= 3 or n >= 11 or w[-1] in ".,!?:" or (len(cur) == 2 and n >= 8):
            groups.append(cur); cur = []
    if cur: groups.append(cur)
    wts = [sum(len(x.strip(".,!?:")) + 2 for x in g) + (2 if g[-1][-1] in ".,!?:" else 0) for g in groups]
    acc = s["start"]
    for g, wt in zip(groups, wts):
        d = s["dur"] * wt / sum(wts)
        chunks.append([acc, acc + d, g]); acc += d
for k in range(len(chunks) - 1):
    if chunks[k + 1][0] - chunks[k][1] < 0.6: chunks[k][1] = chunks[k + 1][0]
    else: chunks[k][1] += 0.2

def draw_caption(img, t):
    c = next((c for c in chunks if c[0] <= t < c[1]), None)
    if not c: return
    s, e, g = c
    words = [w.rstrip(",:") for w in g]
    words = [w[:-3] if w.endswith("...") else w for w in words]
    jump = 1.0 + 0.06 * max(0.0, 1 - (t - s) / 0.08)
    f = font(F_BLACK, 82 * jump)
    d = ImageDraw.Draw(img)
    disp = [w.rstrip(".") if not w.endswith("...") else w for w in words]
    sp = d.textlength(" ", font=f)
    widths = [d.textlength(w, font=f) for w in disp]
    total = sum(widths) + sp * (len(disp) - 1)
    lines = [list(range(len(disp)))]
    if total > W * 0.86 and len(disp) > 1:
        lines = [list(range(len(disp) - 1)), [len(disp) - 1]]
    y = H * 0.775 - (len(lines) - 1) * 50
    for ln in lines:
        lw = sum(widths[i] for i in ln) + sp * (len(ln) - 1)
        x = W / 2 - lw / 2
        for i in ln:
            col = KEY.get(words[i], KEY.get(g[i], (255, 255, 255)))
            d.text((x + 4, y + 6), disp[i], font=f, fill=(0, 0, 0, 110), anchor="lm", stroke_width=6, stroke_fill=(0, 0, 0, 110))
            d.text((x, y), disp[i], font=f, fill=col + (255,), anchor="lm", stroke_width=6, stroke_fill=(16, 12, 10, 255))
            x += widths[i] + sp
        y += 100

# ---------------------------------------------------------------- inserts
def plate(img, cx, cy, w, h, sc, fill=(28, 35, 64, 235), border=None, radius=22):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w2, h2 = w * sc / 2, h * sc / 2
    d.rounded_rectangle([cx - w2 + 6, cy - h2 + 10, cx + w2 + 6, cy + h2 + 10], radius=radius, fill=(0, 0, 0, 90))
    layer = layer.filter(ImageFilter.GaussianBlur(8))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([cx - w2, cy - h2, cx + w2, cy + h2], radius=radius, fill=fill,
                        outline=border, width=int(8 * sc) if border else 0)
    img.alpha_composite(layer)
    return ImageDraw.Draw(img)

def seg(i): return SEGS[i]

def inserts(img, t):
    for s in SEGS:
        lt = t - s["start"]
        i = s["i"]
        end = s["start"] + s["dur"] + 0.25
        if not (s["start"] <= t < end) and not (i == 16 and t >= s["start"]): continue
        if i == 1:  # stopwatch
            sc = pop(lt); d = plate(img, W / 2, 330, 420, 150, sc)
            sec = max(0, 60 - int(lt * 12))
            d.ellipse([W / 2 - 170 * sc, 330 - 45 * sc, W / 2 - 80 * sc, 330 + 45 * sc], outline=(245, 200, 66), width=int(9 * sc))
            d.line([(W / 2 - 125 * sc, 330), (W / 2 - 125 * sc, 330 - 30 * sc)], fill=(245, 200, 66), width=int(7 * sc))
            d.text((W / 2 + 50 * sc, 330), f"00:{sec:02d}", font=font(F_BLACK, 86 * sc), fill=(245, 200, 66), anchor="mm")
        if i == 2:  # name/date plate
            sc = pop(lt); d = plate(img, W / 2, 330, 640, 150, sc, border=(245, 200, 66))
            d.text((W / 2, 330), "ГЕРМАНИЯ · 1786", font=font(F_BLACK, 66 * sc), fill=(255, 255, 255), anchor="mm")
        if i == 3 and lt > s["dur"] * 0.5:  # task card
            q = lt - s["dur"] * 0.5; sc = pop(q)
            d = plate(img, W / 2, 360, 700, 250, sc, fill=(244, 236, 216, 250), border=(200, 56, 46), radius=16)
            d.text((W / 2, 300), "ЗАДАНИЕ", font=font(F_BLACK, 56 * sc), fill=(200, 56, 46), anchor="mm")
            d.text((W / 2, 400), "1 + 2 + ... + 100", font=font(F_BLACK, 70 * sc), fill=(40, 30, 24), anchor="mm")
        if i == 4:  # timer counting up (ticks by seconds)
            sc = pop(lt); d = plate(img, W / 2, 330, 380, 140, sc)
            secs = int(lt * 1.0) + 3
            d.text((W / 2, 330), f"00:{secs:02d}", font=font(F_BLACK, 90 * sc), fill=(255, 255, 255), anchor="mm")
        if i == 5 and lt > s["dur"] * 0.45:  # name badge
            q = lt - s["dur"] * 0.45; sc = pop(q)
            d = plate(img, W / 2, 340, 600, 190, sc, fill=(240, 138, 36, 245), border=(255, 255, 255))
            d.text((W / 2, 300), "КАРЛ ГАУСС", font=font(F_BLACK, 70 * sc), fill=(255, 255, 255), anchor="mm", stroke_width=3, stroke_fill=(60, 30, 10))
            d.text((W / 2, 385), "9 ЛЕТ", font=font(F_BLACK, 52 * sc), fill=(28, 35, 64), anchor="mm")
        if i == 7 and lt > s["dur"] * 0.5:  # "ВЕРНО!" sticker
            q = lt - s["dur"] * 0.5; sc = pop(q)
            layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
            cx, cy, r = W * 0.68, 400, 190 * sc
            pts = []
            for k in range(24):
                a = k / 24 * 2 * math.pi + 0.1; rr = r * (1 if k % 2 == 0 else 0.78)
                pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
            d.polygon(pts, fill=(61, 200, 110, 255), outline=(16, 12, 10, 255), width=8)
            d.text((cx, cy), "ВЕРНО!", font=font(F_BLACK, 66 * sc), fill=(255, 255, 255), anchor="mm", stroke_width=5, stroke_fill=(16, 12, 10))
            layer = layer.rotate(-8, center=(cx, cy))
            img.alpha_composite(layer)
        if i == 16 and lt > 0.6:
            sc = pop(lt - 0.6); d = plate(img, W / 2, 330, 760, 200, sc, fill=(28, 35, 64, 235), border=(245, 184, 61))
            d.text((W / 2, 290), "КОРОЛЬ", font=font(F_BLACK, 80 * sc), fill=(245, 184, 61), anchor="mm")
            d.text((W / 2, 372), "МАТЕМАТИКОВ", font=font(F_BLACK, 58 * sc), fill=(255, 255, 255), anchor="mm")

# ---------------------------------------------------------------- grading
yy, xx = np.ogrid[:H, :W]
dd = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIG = (1 - 0.3 * np.clip(dd - 0.5, 0, 1) ** 1.3).astype(np.float32)[..., None]
rs = np.random.RandomState(3)
GR = [(rs.randn(H // 2, W // 2, 1) * 4).astype(np.float32).repeat(2, 0).repeat(2, 1) for _ in range(8)]

# ---------------------------------------------------------------- audio
def read_wav(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768

def build_audio():
    vo = read_wav(f"{TLD}/voice.wav")
    n = int(TOTAL * SR) + SR
    vo = np.pad(vo, (0, max(0, n - len(vo))))[:n]
    t = np.arange(n) / SR
    music = np.zeros(n, np.float32)
    bpm = 100; beat = 60 / bpm
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
    nb = int(TOTAL / beat) + 1
    for b in range(nb):
        t0 = b * beat; i0 = int(t0 * SR)
        ch = chords[(b // 4) % 4]
        # soft pluck arpeggio on 8ths
        for h in range(2):
            note = ch[(b * 2 + h) % 3] + 12
            f0 = 440 * 2 ** ((note - 69) / 12)
            L = int(0.6 * SR); j0 = i0 + int(h * beat / 2 * SR)
            if j0 >= n: continue
            st = np.arange(min(L, n - j0)) / SR
            music[j0:j0 + len(st)] += (np.sin(2 * np.pi * f0 * st) * np.exp(-st * 7) * 0.5).astype(np.float32)
        # kick on 1 and 3, hat on offbeats
        if b % 2 == 0:
            L = int(0.25 * SR); st = np.arange(min(L, n - i0)) / SR
            music[i0:i0 + len(st)] += (np.sin(2 * np.pi * (50 + 80 * np.exp(-st * 30)) * st) * np.exp(-st * 14) * 0.9).astype(np.float32)
        j0 = i0 + int(beat / 2 * SR)
        if j0 < n:
            L = int(0.05 * SR); st = np.arange(min(L, n - j0))
            music[j0:j0 + len(st)] += (rs.randn(len(st)) * np.exp(-st / SR * 80) * 0.12).astype(np.float32)
        if b % 4 == 0:
            root = ch[0] - 24; f0 = 440 * 2 ** ((root - 69) / 12)
            L = int(beat * 4 * SR); st = np.arange(min(L, n - i0)) / SR
            music[i0:i0 + len(st)] += (np.sin(2 * np.pi * f0 * st) * np.exp(-st * 0.8) * 0.5).astype(np.float32)
    music *= 0.13 / np.abs(music).max()
    # silence before the reveal ("...и это правильный ответ") and dark ending mood
    s7 = SEGS[7]; t_sh = s7["start"] + s7["dur"] * 0.5
    gate = np.ones(n, np.float32)
    a, b = int((t_sh - 1.3) * SR), int(t_sh * SR)
    gate[a:b] = np.linspace(1, 0.0, b - a)
    gate[b:b + int(0.4 * SR)] = np.linspace(0, 1, int(0.4 * SR))
    c0 = int(SEGS[16]["start"] * SR)
    gate[c0:] *= 1.15
    music *= gate
    env = np.convolve(np.abs(vo), np.ones(2205) / 2205, mode="same")
    music *= 1 - 0.5 * np.clip(env / 0.05, 0, 1)
    fx = np.zeros(n, np.float32)
    def add(i0, sig):
        i0 = int(i0)
        if i0 >= n: return
        fx[i0:i0 + len(sig)] += sig[: n - i0]
    def whoosh(ts, amp=0.12):
        L = int(0.3 * SR); nz = np.convolve(rs.randn(L), np.ones(10) / 10, mode="same")
        add((ts - 0.15) * SR, (nz * np.sin(np.linspace(0, np.pi, L)) ** 2 * amp).astype(np.float32))
    def ding(ts, f0=1318.5, amp=0.2):
        st = np.arange(int(1.2 * SR)) / SR
        add(ts * SR, ((np.sin(2 * np.pi * f0 * st) + 0.4 * np.sin(2 * np.pi * f0 * 2.01 * st)) * np.exp(-st * 4.5) * amp).astype(np.float32))
    def popfx(ts, amp=0.25):
        st = np.arange(int(0.12 * SR)) / SR
        add(ts * SR, (np.sin(2 * np.pi * (300 + 900 * st / 0.12) * st) * np.exp(-st * 35) * amp).astype(np.float32))
    def tick(ts, amp=0.18):
        st = np.arange(int(0.03 * SR)) / SR
        add(ts * SR, (rs.randn(len(st)) * np.exp(-st * 300) * amp).astype(np.float32))
    def hit(ts, amp=0.5):
        st = np.arange(int(0.5 * SR)) / SR
        add(ts * SR, (np.sin(2 * np.pi * (45 + 60 * np.exp(-st * 20)) * st) * np.exp(-st * 6) * amp + rs.randn(len(st)) * np.exp(-st * 25) * 0.15).astype(np.float32))
    prev = None
    for s in SEGS:
        if s["shotStart"] != prev and s["i"] > 0: whoosh(s["shotStart"])
        prev = s["shotStart"]
    S = SEGS
    popfx(S[1]["start"]); [tick(S[1]["start"] + k / 12) for k in range(int(S[1]["dur"] * 12))]
    popfx(S[2]["start"]); popfx(S[3]["start"] + S[3]["dur"] * 0.5)
    popfx(S[4]["start"]); [tick(S[4]["start"] + k) for k in range(int(S[4]["dur"]) + 1)]
    popfx(S[5]["start"] + S[5]["dur"] * 0.45)
    ding(S[6]["start"] + 0.4, 1046.5, 0.18)
    hit(t_sh); ding(t_sh + 0.05, 1567.98, 0.2)
    ding(S[8]["start"] + 0.5, 1760, 0.12)
    for k in (9, 10, 11): ding(S[k]["start"] + 0.7, [1046.5, 1174.7, 1318.5][k - 9], 0.12)
    ding(S[14]["start"] + S[14]["dur"] * 0.55, 1567.98, 0.25)
    popfx(S[16]["start"] + 0.6); ding(S[16]["start"] + 0.6, 2093, 0.12)
    mix = vo * 1.0 + music + fx
    mix = np.tanh(mix * 1.05) * 0.95
    with wave.open(f"{TLD}/mix.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())

def main():
    preview = len(sys.argv) > 4
    if not preview: build_audio()
    nf = int(TOTAL * FPS)
    frames = [round(float(x) * FPS) for x in sys.argv[4].split(",")] if preview else range(nf)
    if not preview:
        p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                              "-i", "-", "-i", f"{TLD}/mix.wav", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
                              "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", OUT],
                             stdin=subprocess.PIPE)
    for fi in frames:
        t = fi / FPS
        img = Image.open(f"{FR}/f{fi:05d}.jpg").convert("RGBA")
        inserts(img, t)
        draw_caption(img, t)
        a = np.asarray(img.convert("RGB"), np.float32) * VIG + GR[fi % 8]
        if t < 0.25: a *= t / 0.25
        if t > TOTAL - 0.5: a *= max(0, (TOTAL - t) / 0.5)
        a = a.clip(0, 255).astype(np.uint8)
        if preview:
            Image.fromarray(a).save(f"{OUT}_{fi:05d}.jpg", quality=88)
        else:
            p.stdin.write(a.tobytes())
            if fi % 300 == 0: print("compose", fi, "/", nf, flush=True)
    if not preview:
        p.stdin.close(); p.wait()

main()
