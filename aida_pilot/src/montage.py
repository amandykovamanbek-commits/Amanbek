import math, os, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1280, 720, 30
SC = os.path.dirname(os.path.abspath(__file__))
PJ = "/home/user/Amanbek/aida_pilot"
FB = "/usr/share/fonts/truetype/roboto/unhinted/RobotoCondensed-Bold.ttf"
FD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TOTAL = 64.0
font = lambda s, p=FB: ImageFont.truetype(p, s)

def load(p):
    return Image.open(p).convert("RGB").resize((W * 2, H * 2), Image.LANCZOS)

COMIC = load(f"{SC}/dl/comic.png")
CINE = load(f"{SC}/dl/cinematic.png")
BOOTS = load(f"{PJ}/04_boots.png")

def ease(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

def kb(img, t, z0, z1, c0, c1):
    t = ease(t); z = lerp(z0, z1, t)
    cx = lerp(c0[0], c1[0], t) * W * 2; cy = lerp(c0[1], c1[1], t) * H * 2
    w, h = W * 2 / z, H * 2 / z
    x = min(max(cx - w / 2, 0), W * 2 - w); y = min(max(cy - h / 2, 0), H * 2 - h)
    return img.crop((int(x), int(y), int(x + w), int(y + h))).resize((W, H), Image.BILINEAR)

def big(d, xy, txt, size, fill=(255, 214, 0), anchor="mm", stroke=8, f=FB):
    d.text(xy, txt, font=font(size, f), fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0))

def pop(t, t0, dur=0.18):
    """scale factor for a slam-in text starting at t0"""
    u = (t - t0) / dur
    if u < 0: return 0
    if u >= 1: return 1
    return 1.6 - 0.6 * ease(u)

def slam_text(base, t, t0, txt, size, xy, fill=(255, 214, 0)):
    s = pop(t, t0)
    if s == 0: return
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    big(d, (W / 2, H / 2), txt, int(size * s), fill)
    dx, dy = xy[0] - W / 2, xy[1] - H / 2
    base.paste(lay, (int(dx), int(dy)), lay)

# ---------- static assets ----------
rnd = random.Random(7)
VIGN = Image.radial_gradient("L").resize((W, H)).point(lambda v: 255 - int(max(0, v - 90) * 1.1))
DARK = Image.new("RGB", (W, H), (0, 0, 0))
GRAINS = []
for k in range(4):
    g = Image.effect_noise((W, H), 28).convert("RGB")
    GRAINS.append(g)

def paper(col=(38, 34, 30)):
    im = Image.new("RGB", (W, H), col)
    n = Image.effect_noise((W, H), 18).convert("RGB")
    return Image.blend(im, n, 0.08)

PAPER = paper()
BOARD = Image.blend(Image.new("RGB", (W, H), (34, 62, 48)), Image.effect_noise((W, H), 25).convert("RGB"), 0.07)

flakes = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1, 3), rnd.uniform(40, 110)] for _ in range(130)]
def snow(im, dt):
    d = ImageDraw.Draw(im, "RGBA")
    for f in flakes:
        f[1] += f[3] * dt; f[0] += 10 * dt
        if f[1] > H: f[1] = -4; f[0] = rnd.uniform(0, W)
        d.ellipse([f[0] - f[2], f[1] - f[2], f[0] + f[2], f[1] + f[2]], fill=(255, 255, 255, 150))

def caption(im, txt, a=1.0):
    d = ImageDraw.Draw(im, "RGBA"); f = font(38)
    tw = d.textlength(txt, font=f)
    d.rounded_rectangle([W / 2 - tw / 2 - 22, H - 104, W / 2 + tw / 2 + 22, H - 44], radius=10, fill=(0, 0, 0, int(170 * a)))
    d.text((W / 2, H - 74), txt, font=f, fill=(255, 255, 255, int(255 * a)), anchor="mm")

# ---------- shots ----------
def s_intro(t, T):  # 0 - 4.5
    im = kb(COMIC, t / T, 1.9, 2.2, (0.66, 0.38), (0.68, 0.36))
    snow(im, 1 / FPS)
    d = ImageDraw.Draw(im)
    if T and t > 0.6:
        slam_text(im, t, 0.65, "ТЫ — ГРИША ХРИПУНОВ", 84, (W / 2, 110))
    if t > 2.1:
        slam_text(im, t, 2.15, "(И ЭТО ВСЯ ТВОЯ ЖИЗНЬ)", 50, (W / 2, 195), (255, 255, 255))
    return im

KAZ, VOL = (860, 250), (430, 560)
def s_map(t, T):  # 4.5 - 12.6
    im = PAPER.copy(); d = ImageDraw.Draw(im, "RGBA")
    # river (Volga) as a wobbly line
    pts = [(300 + 40 * math.sin(i / 3), 700 - i * 22) for i in range(32)]
    pts = [(lerp(VOL[0] - 60, KAZ[0] + 80, i / 31) + 40 * math.sin(i / 2.5), lerp(H + 40, -40, i / 31)) for i in range(32)]
    d.line(pts, fill=(70, 110, 140), width=14, joint="curve")
    d.text((80, 60), "СССР", font=font(40), fill=(150, 140, 120))
    if t > 0.3: slam_text(im, t, 0.3, "1978", 130, (W - 220, 130), (220, 60, 50))
    d = ImageDraw.Draw(im, "RGBA")
    for (x, y), name, tt in [(VOL, "ВОЛГОГРАД", 2.8), (KAZ, "КАЗАНЬ", 6.5)]:
        if t > tt:
            r = 14
            d.ellipse([x - r, y - r, x + r, y + r], fill=(240, 200, 60), outline=(0, 0, 0), width=4)
            big(d, (x + 30, y), name, 46, (255, 255, 255), anchor="lm", stroke=5)
    p = ease((t - 4.4) / 2.6)
    if p > 0:
        n = int(40 * p)
        for k in range(n):
            if k % 2: continue
            u0, u1 = k / 40, (k + 1) / 40
            f = lambda u: (lerp(VOL[0], KAZ[0], u) - 140 * math.sin(math.pi * u), lerp(VOL[1], KAZ[1], u))
            d.line([f(u0), f(u1)], fill=(230, 60, 50), width=7)
        u = n / 40; x = lerp(VOL[0], KAZ[0], u) - 140 * math.sin(math.pi * u); y = lerp(VOL[1], KAZ[1], u)
        d.rectangle([x - 22, y - 12, x + 22, y + 12], fill=(40, 120, 70), outline=(0, 0, 0), width=3)
    if t > 4.3:
        caption(im, "У отца проблемы на работе. Вы переезжаете.")
    return im

def s_alone(t, T):  # 12.6 - 16.0
    im = kb(COMIC, t / T, 1.15, 1.3, (0.45, 0.55), (0.55, 0.5))
    snow(im, 1 / FPS)
    slam_text(im, t, 0.2, "НОВАЯ ШКОЛА", 70, (W / 2, 110))
    if t > 1.85: slam_text(im, t, 1.9, "БЕЗ ДРУЗЕЙ", 70, (W / 2, 200), (255, 255, 255))
    return im

def s_board(t, T):  # 16.0 - 24.2   (Зря at 20.48 -> t=4.48)
    im = BOARD.copy(); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, H], outline=(90, 60, 30), width=30)
    chalk = (235, 235, 225)
    lines = ["Урок истории", "Гриша Хрипунов:", "«Знаю ответ!»"]
    for i, ln in enumerate(lines):
        p = ease((t - 0.3 - i * 0.9) / 0.8)
        if p <= 0: continue
        f = font(64 if i == 0 else 54, FD if i else FB)
        full = d.textlength(ln, font=f); cut = ln[: max(1, int(len(ln) * p))]
        d.text((120, 120 + i * 110), cut, font=f, fill=chalk)
    if t > 4.45:
        slam_text(im, t, 4.48, "ЗРЯ.", 220, (W / 2 + 230, H / 2 + 60), (230, 50, 40))
    if t > 5.2:
        caption(im, "Одноклассник Шамсеев тебя запомнил.")
    return im

def s_boots(t, T):  # 24.2 - 30.5   (платишь at 28.64 -> 4.44)
    im = kb(BOOTS, t / T, 1.35, 1.15, (0.25, 0.45), (0.65, 0.5))
    snow(im, 1 / FPS)
    if t > 4.4: slam_text(im, t, 4.44, "ТЕПЕРЬ ТЫ ПЛАТИШЬ", 86, (W / 2, 110), (230, 50, 40))
    return im

def s_fight(t, T):  # 30.5 - 42.4  (предатель at 41.49 -> 10.99)
    if t < 6.2:
        im = kb(CINE, t / 6.2, 1.1, 1.35, (0.5, 0.5), (0.55, 0.42))
        if t > 0.4: caption(im, "Уличная компания против комсомольской дружины")
    else:
        u = (t - 6.2) / (T - 6.2)
        im = kb(CINE, u, 1.6, 1.9, (0.27, 0.45), (0.25, 0.42))
        if t < 8.6: caption(im, "Тебя вытаскивает студент Костя")
    snow(im, 1 / FPS)
    if t > 10.95: slam_text(im, t, 10.99, "ПРЕДАТЕЛЬ", 150, (W / 2, H / 2), (230, 50, 40))
    return im

def s_home(t, T):  # 42.4 - 46.6 : крик 43.52(1.12) срыв 44.16(1.76) врачей 45.36(2.96)
    im = Image.new("RGB", (W, H), (12, 10, 10)); d = ImageDraw.Draw(im)
    big(d, (W / 2, 90), "ДОМА", 60, (200, 200, 200), stroke=4)
    if t > 1.1: slam_text(im, t, 1.12, "КРИК.", 130, (W / 2 - 260, H / 2 - 20), (255, 255, 255))
    if t > 1.75: slam_text(im, t, 1.76, "СРЫВ.", 130, (W / 2 + 260, H / 2 - 20), (230, 50, 40))
    if t > 2.95: slam_text(im, t, 2.96, "ЗВОНОК 03", 110, (W / 2, H / 2 + 170), (255, 214, 0))
    return im

def s_hosp(t, T):  # 46.6 - 54.8
    im = Image.new("RGB", (W, H), (28, 46, 42)); d = ImageDraw.Draw(im, "RGBA")
    for x in range(0, W, 64):
        for y in range(0, H, 64): d.rectangle([x + 2, y + 2, x + 62, y + 62], outline=(40, 64, 58), width=2)
    # barred window
    wx, wy = W / 2, 300
    d.rectangle([wx - 170, wy - 150, wx + 170, wy + 150], fill=(150, 170, 180))
    for i in range(1, 6): d.line([wx - 170 + i * 57, wy - 150, wx - 170 + i * 57, wy + 150], fill=(20, 20, 20), width=10)
    d.line([wx - 170, wy, wx + 170, wy], fill=(20, 20, 20), width=10)
    big(d, (W / 2 - 110, 545), "ПСИХИАТРИЧЕСКАЯ БОЛЬНИЦА", 58, (255, 255, 255), stroke=6)
    a = ease((t - 3.4) / 1.5)
    if a > 0:  # doctor silhouette sliding in
        x = lerp(W + 200, W - 140, a)
        d.ellipse([x - 70, 180, x + 70, 330], fill=(5, 5, 5))
        d.rounded_rectangle([x - 140, 320, x + 140, 760], radius=70, fill=(235, 235, 230), outline=(0, 0, 0), width=6)
    im = kb(im.resize((W * 2, H * 2)), t / T, 1.0, 1.08, (0.5, 0.5), (0.55, 0.5))
    if t > 3.4: caption(im, "Доктор, который тебя понимает")
    return im

def s_doc(t, T):  # 54.8 - 64
    im = Image.new("RGB", (W, H), (6, 6, 8)); d = ImageDraw.Draw(im, "RGBA")
    a = ease(t / 1.2)
    d.ellipse([W / 2 - 300, 40, W / 2 + 300, 700], fill=(int(60 * a), int(20 * a), int(20 * a)))
    d.ellipse([W / 2 - 95, 110, W / 2 + 95, 330], fill=(0, 0, 0))
    d.rounded_rectangle([W / 2 - 200, 320, W / 2 + 200, 800], radius=90, fill=(225, 225, 220))
    d.polygon([(W / 2 - 40, 320), (W / 2 + 40, 320), (W / 2, 470)], fill=(20, 20, 20))
    big(d, (W / 2, 220), "?", 150, (230, 50, 40), stroke=6)
    if t > 0.95: slam_text(im, t, 0.96, "ЕВГЕНИЙ ЗАХАРЕВИЧ", 96, (W / 2, 560))
    if t > 6.5:
        k = ease((t - 6.5) / 0.6)
        d2 = ImageDraw.Draw(im, "RGBA"); d2.rectangle([0, 0, W, H], fill=(0, 0, 0, int(200 * k)))
        big(d2, (W / 2, H / 2), "ПРОДОЛЖЕНИЕ СЛЕДУЕТ...", 72, (255, 255, 255), stroke=5)
    return im

SHOTS = [(0, 4.5, s_intro), (4.5, 12.6, s_map), (12.6, 16.0, s_alone), (16.0, 24.2, s_board),
         (24.2, 30.5, s_boots), (30.5, 42.4, s_fight), (42.4, 46.6, s_home), (46.6, 54.8, s_hosp), (54.8, TOTAL, s_doc)]
IMPACTS = [0.65, 20.48, 28.64, 41.49, 43.52, 44.16, 45.36, 55.76]

def shake(t):
    for t0 in IMPACTS:
        u = t - t0
        if 0 <= u < 0.3:
            k = (1 - u / 0.3) * 14
            return int(math.sin(u * 90) * k), int(math.cos(u * 70) * k)
    return 0, 0

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                       "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                       f"{SC}/pilot_video.mp4"], stdin=subprocess.PIPE)
N = int(TOTAL * FPS)
for i in range(N):
    T = i / FPS
    for a, b, fn in SHOTS:
        if a <= T < b:
            im = fn(T - a, b - a); start, end = a, b; break
    dx, dy = shake(T)
    if dx or dy:
        im = im.resize((W + 40, H + 24)).crop((20 + dx, 12 + dy, 20 + dx + W, 12 + dy + H))
    im = Image.composite(im, DARK, VIGN)
    im = Image.blend(im, GRAINS[i % 4], 0.045)
    fade = min(1, (T - start) / 0.15, (end - T) / 0.15) if start > 0 else min(1, (end - T) / 0.15, T / 0.4)
    if T > TOTAL - 0.8: fade = min(fade, (TOTAL - T) / 0.8)
    if fade < 1: im = Image.blend(DARK, im, max(0, fade))
    ff.stdin.write(im.tobytes())
ff.stdin.close(); ff.wait()
print("video ok")
