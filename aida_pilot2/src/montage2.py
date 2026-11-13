"""Pilot 2 montage: 7 Flow shots + slam text + snow + shake -> pilot2_video.mp4, then mix voice+sfx.
Timings (seconds) live in T below; update them from the word-level transcript of voice.mp3."""
import math, os, random, subprocess, sys, json
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 30
SC = os.path.dirname(os.path.abspath(__file__))
PJ = os.path.abspath(os.path.join(SC, ".."))
FB = next((p for p in [
    os.path.join(PJ, "..", "fonts", "RobotoCondensed-VF.ttf"),          # repo-local (variable font, Bold set below)
    "/usr/share/fonts/truetype/roboto/unhinted/RobotoCondensed-Bold.ttf",  # Linux fonts-roboto-unhinted
    "C:/Windows/Fonts/RobotoCondensed-Bold.ttf",
] if os.path.exists(p)), None)
assert FB, "Roboto Condensed font not found"

# ---- timing (overridden by timing.json if present) ----
T = {
    "total": 24.0,
    "cuts": [0, 4.0, 8.0, 11.0, 14.0, 16.0, 20.0],   # start of shots 01..07
    "t_name": 0.3, "t_city": 2.2, "t_gang": 5.6, "t_one": 8.4, "t_ryaba": 10.0,
    "t_fall": 11.3, "t_hosp": 14.2, "t_back": 16.4, "t_stand": 18.0, "t_svoy": 20.4, "t_life": 22.4,
}
TJ = os.path.join(PJ, "timing.json")
if os.path.exists(TJ):
    T.update(json.load(open(TJ, encoding="utf-8")))
TOTAL = T["total"]

_fc = {}
def font(s):
    if s not in _fc:
        f = ImageFont.truetype(FB, s)
        try: f.set_variation_by_name("Bold")
        except Exception: pass
        _fc[s] = f
    return _fc[s]

def load(n):
    return Image.open(os.path.join(PJ, n)).convert("RGB").resize((W * 2, H * 2), Image.LANCZOS)
S = {k: load(f"{k}.png") for k in ["01", "02", "03", "04", "05", "06", "07"]}

def ease(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

def kb(img, t, z0, z1, c0, c1):
    t = ease(t); z = lerp(z0, z1, t)
    cx = lerp(c0[0], c1[0], t) * W * 2; cy = lerp(c0[1], c1[1], t) * H * 2
    w, h = W * 2 / z, H * 2 / z
    x = min(max(cx - w / 2, 0), W * 2 - w); y = min(max(cy - h / 2, 0), H * 2 - h)
    return img.crop((int(x), int(y), int(x + w), int(y + h))).resize((W, H), Image.BILINEAR)

YEL, RED, WHT = (255, 214, 0), (230, 50, 40), (255, 255, 255)
def slam(base, t, t0, txt, size, xy, fill=YEL, dur=0.18):
    u = (t - t0) / dur
    if u < 0: return
    s = 1 if u >= 1 else 1.6 - 0.6 * ease(u)
    d = ImageDraw.Draw(base)
    d.text(xy, txt, font=font(int(size * s)), fill=fill, anchor="mm", stroke_width=max(4, int(8 * size / 90)), stroke_fill=(0, 0, 0))

rnd = random.Random(7)
VIGN = Image.radial_gradient("L").resize((W, H)).point(lambda v: 255 - int(max(0, v - 90) * 1.1))
DARK = Image.new("RGB", (W, H), (0, 0, 0))
GRAINS = [Image.effect_noise((W, H), 28).convert("RGB") for _ in range(4)]
flakes = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1, 3), rnd.uniform(40, 110)] for _ in range(130)]
def snow(im, dt=1 / FPS):
    d = ImageDraw.Draw(im, "RGBA")
    for f in flakes:
        f[1] += f[3] * dt; f[0] += 10 * dt
        if f[1] > H: f[1] = -4; f[0] = rnd.uniform(0, W)
        d.ellipse([f[0] - f[2], f[1] - f[2], f[0] + f[2], f[1] + f[2]], fill=(255, 255, 255, 150))

C = T["cuts"]
def rel(k): return T[k]  # absolute times; shots receive absolute t

def s01(t, u):
    im = kb(S["01"], u, 1.05, 1.3, (0.5, 0.5), (0.8, 0.35)); snow(im)
    slam(im, t, rel("t_name"), "ТЫ — ГРИША ХРИПУНОВ", 84, (W / 2, 100))
    slam(im, t, rel("t_city"), "КАЗАНЬ, 1978", 64, (W / 2, 190), WHT)
    return im
def s02(t, u):
    im = kb(S["02"], u, 1.0, 1.25, (0.5, 0.5), (0.5, 0.55))
    slam(im, t, rel("t_gang"), "БАНДА «ТЯП-ЛЯП»", 90, (W / 2, 100))
    return im
def s03(t, u):
    im = kb(S["03"], u, 1.1, 1.45, (0.5, 0.55), (0.5, 0.45))
    slam(im, t, rel("t_one"), "ОДИН УДАР", 96, (W / 2, 100), WHT)
    slam(im, t, rel("t_ryaba"), "УДАР РЯБЫ", 120, (W / 2, H - 110), RED)
    return im
def s04(t, u):
    im = kb(S["04"], u, 1.0, 1.5, (0.5, 0.5), (0.4, 0.55))
    if t > rel("t_fall") and t < rel("t_fall") + 0.12:
        im = Image.blend(im, Image.new("RGB", (W, H), (255, 255, 255)), 0.7)  # impact flash
    slam(im, t, rel("t_fall") + 0.35, "ТЫ ПАДАЕШЬ", 130, (W / 2, H - 120), RED)
    return im
def s05(t, u):
    im = kb(S["05"], u, 1.2, 1.05, (0.35, 0.5), (0.45, 0.5)); snow(im)
    slam(im, t, rel("t_hosp"), "БОЛЬНИЦА", 100, (W / 2, 100), WHT)
    return im
def s06(t, u):
    im = kb(S["06"], u, 1.3, 1.05, (0.38, 0.45), (0.5, 0.5))
    slam(im, t, rel("t_stand"), "ТЫ ВСТАЁШЬ", 110, (W / 2, H - 110))
    return im
def s07(t, u):
    im = kb(S["07"], u, 1.0, 1.3, (0.5, 0.6), (0.5, 0.45)); snow(im)
    slam(im, t, rel("t_svoy"), "ТЕПЕРЬ ТЫ СВОЙ", 100, (W / 2, 100))
    slam(im, t, rel("t_life"), "(И ЭТО ВСЯ ТВОЯ ЖИЗНЬ)", 56, (W / 2, 190), WHT)
    return im

FNS = [s01, s02, s03, s04, s05, s06, s07]
SHOTS = [(C[i], C[i + 1] if i + 1 < len(C) else TOTAL, FNS[i]) for i in range(7)]
IMPACTS = [T["t_name"], T["t_ryaba"], T["t_fall"], T["t_hosp"], T["t_stand"]]
BIG = T["t_fall"]

def shake(t):
    for t0 in IMPACTS:
        u = t - t0
        if 0 <= u < 0.35:
            k = (1 - u / 0.35) * (26 if t0 == BIG else 12)
            return int(math.sin(u * 90) * k), int(math.cos(u * 70) * k)
    return 0, 0

def render(out):
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", out],
                          stdin=subprocess.PIPE)
    for i in range(int(TOTAL * FPS)):
        t = i / FPS
        for a, b, fn in SHOTS:
            if a <= t < b:
                im = fn(t, (t - a) / (b - a)); start, end = a, b; break
        dx, dy = shake(t)
        if dx or dy:
            im = im.resize((W + 60, H + 34)).crop((30 + dx, 17 + dy, 30 + dx + W, 17 + dy + H))
        im = Image.composite(im, DARK, VIGN)
        im = Image.blend(im, GRAINS[i % 4], 0.045)
        fade = min(1, (t - start) / 0.12, (end - t) / 0.12) if start > 0 else min(1, (end - t) / 0.12, t / 0.4)
        if t > TOTAL - 1.0: fade = min(fade, (TOTAL - t) / 1.0)
        if fade < 1: im = Image.blend(DARK, im, max(0, fade))
        ff.stdin.write(im.tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == "__main__":
    vid = os.path.join(PJ, "pilot2_video.mp4")
    render(vid)
    print("video ok")
