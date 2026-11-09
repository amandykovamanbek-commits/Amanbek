"""Build static scene plates (1080x1920-ish) from the AI frames + hand-drawn vector scenes.
Outputs PNGs into build/plates/.
"""
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(ROOT, "..", "img")
OUT = os.path.join(ROOT, "plates")
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
FONT = "/usr/share/fonts/opentype/inter/"


def font(name, size):
    return ImageFont.truetype(FONT + name, size)


def save(im, name):
    im.save(os.path.join(OUT, name))
    print("saved", name, im.size)


A = Image.open(os.path.join(IMG, "A_landing.png")).convert("RGB")  # 1376x768
A4 = A.resize((A.width * 4, A.height * 4), Image.LANCZOS)
A4 = A4.filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2))
FACE = (687 * 4, 300 * 4)  # face centre in A4 coords
EYE_L, EYE_R = (667 * 4, 290 * 4), (707 * 4, 290 * 4)


def crop_center(im, cx, cy, h, aspect=9 / 16):
    w = h * aspect
    box = (int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2))
    return im.crop(box)


def cover(im, scale=1.12):
    return im.resize((int(W * scale), int(H * scale)), Image.LANCZOS)


# 1. landing: full height vertical crop around neighbour
land = A4.crop((1880, 0, 1880 + int(3072 * 9 / 16), 3072))
save(cover(land), "landing.png")

# 2. medium face shot (head + shoulders)
save(cover(crop_center(A4, FACE[0], FACE[1] + 420, 1500)), "face_med.png")

# 3. tight face for "doesn't blink"
save(cover(crop_center(A4, FACE[0], FACE[1] + 60, 900), 1.08), "face_tight.png")

# 4. reflection frame
F = Image.open(os.path.join(IMG, "F_reflection.png")).convert("RGB")
save(cover(F), "reflection.png")

# 5. flashback: warm grade of landing
fl = cover(land)
arr = np.asarray(fl).astype(np.float32) / 255
lum = arr.mean(2, keepdims=True)
warm = np.clip((arr * 0.55 + lum * 0.45) * np.array([1.18, 1.0, 0.72]) + 0.08, 0, 1)
save(Image.fromarray((warm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), "flashback.png")

# ---------- creepy edits on a copy of A4 ----------
def creepy_face(base, grin=1.0, eyes=True):
    im = base.copy()
    d = ImageDraw.Draw(im, "RGBA")
    if eyes:
        for (ex, ey) in (EYE_L, EYE_R):
            d.ellipse((ex - 80, ey - 70, ex + 80, ey + 90), fill=(40, 20, 30, 120))
            d.ellipse((ex - 52, ey - 52, ex + 52, ey + 52), fill=(232, 230, 220, 255), outline=(25, 20, 20, 255), width=10)
            d.ellipse((ex - 9, ey - 9, ex + 9, ey + 9), fill=(5, 5, 5, 255))
    # grin under the moustache
    mx, my = 687 * 4, 333 * 4
    half = int(150 * grin)
    top = [(mx - half + i * (2 * half) / 40, my - 10 - 60 * grin * (abs(i - 20) / 20) ** 2) for i in range(41)]
    bot = [(mx + half - i * (2 * half) / 40, my + 50 * grin - 40 * grin * (abs(i - 20) / 20) ** 2) for i in range(41)]
    d.polygon(top + bot, fill=(20, 5, 8, 255))
    # teeth
    n = 18
    for i in range(1, n):
        x = mx - half + i * (2 * half) / n
        t = abs(i - n / 2) / (n / 2)
        yt = my - 10 - 60 * grin * t ** 2
        yb = my + 50 * grin - 40 * grin * t ** 2
        s = 2 * half / n / 2
        d.polygon([(x - s, yt), (x + s, yt), (x, yt + 26 * grin)], fill=(235, 228, 205, 255))
        d.polygon([(x - s, yb), (x + s, yb), (x, yb - 22 * grin)], fill=(225, 218, 195, 255))
    d.line(top, fill=(10, 0, 0, 255), width=8)
    return im


def grade(im, mul, add=0.0, sat=1.0):
    arr = np.asarray(im).astype(np.float32) / 255
    lum = arr.mean(2, keepdims=True)
    arr = lum + (arr - lum) * sat
    arr = np.clip(arr * np.array(mul) + add, 0, 1)
    return Image.fromarray((arr * 255).astype(np.uint8))


# 6. reveal face
rev = creepy_face(A4, 1.0)
rev = crop_center(rev, FACE[0], FACE[1] + 80, 880)
rev = grade(rev, (0.78, 0.62, 0.66), -0.10, 0.25)
rev = ImageEnhance.Contrast(rev).enhance(1.5)
va = np.asarray(rev).astype(np.float32)
hh, ww = va.shape[:2]
gy_, gx_ = np.mgrid[0:hh, 0:ww]
vr = np.sqrt(((gx_ - ww / 2) / (ww / 2)) ** 2 + ((gy_ - hh * 0.42) / (hh / 2)) ** 2)
va = va * np.clip(1.25 - vr * 0.9, 0.05, 1)[..., None]
rev = Image.fromarray(np.clip(va, 0, 255).astype(np.uint8))
save(cover(rev, 1.08), "reveal.png")

# 7. peephole: fisheye of slightly-too-wide smile, dark yellow bulb light
pe = creepy_face(A4, 0.45, eyes=False)
sq = pe.crop((FACE[0] - 620, FACE[1] - 420, FACE[0] + 620, FACE[1] + 820)).resize((1400, 1400), Image.LANCZOS)
src = np.asarray(sq).astype(np.float32)
N = 1000
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
u, v = (xx - N / 2) / (N / 2), (yy - N / 2) / (N / 2)
r = np.sqrt(u ** 2 + v ** 2)
k = 0.42  # barrel distortion
rs = r * (1 - k + k * r ** 2) + 1e-6
sx = (u / np.maximum(r, 1e-6) * rs * 0.5 + 0.5) * (sq.width - 1)
sy = (v / np.maximum(r, 1e-6) * rs * 0.5 + 0.5) * (sq.height - 1)
sx = np.clip(sx, 0, sq.width - 1).astype(np.int32)
sy = np.clip(sy, 0, sq.height - 1).astype(np.int32)
fish = src[sy, sx]
fish = fish.mean(2, keepdims=True) * 0.55 + fish * 0.45
fish = fish * np.array([1.0, 0.82, 0.48]) * (1.15 - 0.85 * np.clip(r, 0, 1)[..., None] ** 2)
mask = np.clip((1.0 - r) * 60, 0, 1)[..., None]
fish = fish * mask
plate = np.zeros((int(H * 1.1), int(W * 1.1), 3), np.float32)
ox, oy = (plate.shape[1] - N) // 2, int(plate.shape[0] * 0.40) - N // 2
plate[oy:oy + N, ox:ox + N] = fish
img = Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(img)
cx, cy = ox + N // 2, oy + N // 2
d.ellipse((cx - N // 2 - 6, cy - N // 2 - 6, cx + N // 2 + 6, cy + N // 2 + 6), outline=(30, 26, 20), width=14)
save(img, "peephole.png")


# ---------- hand-drawn scenes (supersampled) ----------
SS = 2


def canvas(color):
    return Image.new("RGB", (W * SS, H * SS), color)


def S(*v):
    return tuple(int(x * SS) for x in v)


def finish(im, name, blur=0):
    im = im.resize((W, H), Image.LANCZOS)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    im = cover(im, 1.08)
    save(im, name)


OUTL = (28, 24, 22)

# 8. door plate (neighbour's padded door)
im = canvas((96, 52, 38))
d = ImageDraw.Draw(im)
step = 170
for gy in range(-2, 14):
    for gx in range(-2, 9):
        x, y = gx * step + (gy % 2) * step / 2, gy * step * 0.75
        d.polygon([S(x, y - 60), S(x + 70, y), S(x, y + 60), S(x - 70, y)], fill=(110, 61, 44))
        d.line([S(x, y), S(x + step / 2, y + step * 0.375)], fill=(70, 36, 26), width=3 * SS)
        d.line([S(x, y), S(x - step / 2, y + step * 0.375)], fill=(70, 36, 26), width=3 * SS)
        d.ellipse([*S(x - 9, y - 9), *S(x + 9, y + 9)], fill=(190, 160, 90), outline=OUTL, width=2 * SS)
# brass plate
d.rounded_rectangle([*S(250, 760), *S(830, 1010)], radius=18 * SS, fill=(196, 160, 78), outline=(90, 66, 24), width=6 * SS)
d.rounded_rectangle([*S(272, 782), *S(808, 988)], radius=12 * SS, outline=(150, 118, 50), width=3 * SS)
for (sx_, sy_) in ((290, 800), (790, 800), (290, 970), (790, 970)):
    d.ellipse([*S(sx_ - 8, sy_ - 8), *S(sx_ + 8, sy_ + 8)], fill=(120, 92, 40))
f1, f2 = font("Inter-Bold.otf", 46 * SS), font("Inter-ExtraBold.otf", 96 * SS)
d.text(S(540, 840), "кв. 48", font=f1, fill=(70, 48, 14), anchor="mm")
d.text(S(540, 925), "В. ГРОМОВ", font=f2, fill=(64, 42, 10), anchor="mm")
# peephole + handle
d.ellipse([*S(510, 470), *S(570, 530)], fill=(170, 150, 110), outline=OUTL, width=4 * SS)
d.ellipse([*S(528, 488), *S(552, 512)], fill=(30, 28, 26))
d.rounded_rectangle([*S(820, 1250), *S(1000, 1300)], radius=20 * SS, fill=(175, 170, 160), outline=OUTL, width=4 * SS)
finish(im, "doorplate.png")

# 9. dog cowering at your door
im = canvas((200, 205, 196))
d = ImageDraw.Draw(im)
d.rectangle([*S(0, 0), *S(W, 760)], fill=(196, 202, 192))
d.rectangle([*S(0, 760), *S(W, 1460)], fill=(62, 106, 78))
d.rectangle([*S(0, 752), *S(W, 768)], fill=(52, 90, 66))
d.rectangle([*S(0, 1460), *S(W, H)], fill=(196, 182, 150))
for x in range(-400, W + 400, 150):
    d.line([S(x, 1460), S(x + (x - 540) * 0.9, H)], fill=(160, 146, 116), width=3 * SS)
for y in (1540, 1660, 1820):
    d.line([S(0, y), S(W, y)], fill=(160, 146, 116), width=3 * SS)
# your door (grey metal) on the left
d.rectangle([*S(-20, 240), *S(470, 1470)], fill=(70, 74, 80), outline=OUTL, width=8 * SS)
d.rectangle([*S(30, 300), *S(420, 1420)], outline=(56, 60, 66), width=5 * SS)
d.rounded_rectangle([*S(380, 860), *S(450, 890)], radius=10 * SS, fill=(170, 168, 160), outline=OUTL, width=3 * SS)
d.ellipse([*S(400, 930), *S(426, 956)], fill=(150, 130, 70), outline=OUTL, width=3 * SS)
d.rectangle([*S(-20, 1450), *S(500, 1478)], fill=(48, 50, 54))
finish(im, "dog_bg.png", blur=0)

# dog sprite (transparent)
dog = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
d = ImageDraw.Draw(dog)
BR, DK, TAN = (150, 96, 50), (40, 32, 28), (196, 146, 88)
w6 = 6 * SS
# tail tucked under
d.chord([*S(560, 1300), *S(820, 1500)], 180, 330, fill=DK, outline=OUTL, width=w6)
# hind leg
d.ellipse([*S(600, 1240), *S(820, 1450)], fill=BR, outline=OUTL, width=w6)
d.ellipse([*S(640, 1420), *S(790, 1470)], fill=TAN, outline=OUTL, width=w6)
# body
d.ellipse([*S(330, 1180), *S(790, 1440)], fill=BR, outline=OUTL, width=w6)
d.chord([*S(380, 1160), *S(760, 1360)], 180, 360, fill=DK)
# front legs
for x0 in (330, 400):
    d.rounded_rectangle([*S(x0, 1320), *S(x0 + 60, 1460)], radius=20 * SS, fill=BR, outline=OUTL, width=w6)
    d.ellipse([*S(x0 - 20, 1430), *S(x0 + 70, 1475)], fill=TAN, outline=OUTL, width=w6)
# head, low, pushed against the door
d.ellipse([*S(250, 1120), *S(470, 1320)], fill=BR, outline=OUTL, width=w6)
d.polygon([S(290, 1220), S(170, 1260), S(160, 1300), S(300, 1310)], fill=TAN, outline=OUTL)
d.line([S(290, 1220), S(170, 1260), S(160, 1300), S(300, 1310)], fill=OUTL, width=w6)
d.ellipse([*S(150, 1252), *S(185, 1285)], fill=DK)
# flattened ears pointing back
d.polygon([S(400, 1150), S(520, 1120), S(440, 1200)], fill=DK, outline=OUTL)
d.polygon([S(370, 1140), S(480, 1095), S(410, 1185)], fill=(70, 50, 40), outline=OUTL)
# scared eye looking back toward the neighbour
d.ellipse([*S(330, 1180), *S(392, 1236)], fill=(245, 240, 230), outline=OUTL, width=4 * SS)
d.ellipse([*S(366, 1196), *S(388, 1220)], fill=(10, 10, 10))
d.line([S(325, 1170), S(395, 1160)], fill=OUTL, width=5 * SS)
# collar + leash to the floor
d.line([S(440, 1150), S(470, 1300)], fill=(180, 40, 40), width=14 * SS)
d.line([S(465, 1290), S(560, 1470), S(900, 1500)], fill=(180, 40, 40), width=8 * SS)
dog = dog.resize((W, H), Image.LANCZOS)
k_ = 1.2
big = dog.resize((int(W * k_), int(H * k_)), Image.LANCZOS)
dog = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dog.paste(big, (int(150 - 150 * k_), int(1475 - 1475 * k_)), big)
dog.save(os.path.join(OUT, "dog_sprite.png"))
# neighbour legs (out of focus) for the dog scene
legs = A4.crop((625 * 4, 470 * 4, 750 * 4, 716 * 4))
legs = legs.resize((int(legs.width * 0.5), int(legs.height * 0.5)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
legs.save(os.path.join(OUT, "dog_legs.png"))
print("legs", legs.size)

# 10. your hallway at night: locked door + glowing peephole
im = canvas((22, 28, 42))
d = ImageDraw.Draw(im)
for y in range(0, H, 6):
    t = y / H
    d.rectangle([*S(0, y), *S(W, y + 6)], fill=(int(20 + 10 * t), int(26 + 10 * t), int(40 + 12 * t)))
d.rectangle([*S(0, 1660), *S(W, H)], fill=(30, 24, 22))
d.polygon([S(200, 1720), S(880, 1720), S(960, 1880), S(120, 1880)], fill=(90, 34, 34))
d.rectangle([*S(250, 340), *S(830, 1665)], fill=(28, 26, 26), outline=OUTL, width=8 * SS)
d.rectangle([*S(290, 380), *S(790, 1660)], fill=(58, 54, 52), outline=(20, 18, 18), width=6 * SS)
d.rectangle([*S(340, 440), *S(740, 960)], outline=(46, 42, 40), width=5 * SS)
d.rectangle([*S(340, 1060), *S(740, 1600)], outline=(46, 42, 40), width=5 * SS)
d.ellipse([*S(522, 640), *S(558, 676)], fill=(250, 214, 120), outline=OUTL, width=4 * SS)
for ly in (930, 1120):
    d.rounded_rectangle([*S(690, ly - 34), *S(746, ly + 34)], radius=8 * SS, fill=(150, 120, 60), outline=OUTL, width=4 * SS)
    d.rectangle([*S(712, ly - 12), *S(724, ly + 14)], fill=(30, 24, 20))
d.rounded_rectangle([*S(640, 1010), *S(760, 1046)], radius=14 * SS, fill=(160, 156, 150), outline=OUTL, width=4 * SS)
# coat rack silhouettes on the left
d.rectangle([*S(20, 520), *S(200, 540)], fill=(40, 34, 30))
d.polygon([S(30, 540), S(110, 540), S(140, 1100), S(0, 1100)], fill=(34, 40, 46))
d.polygon([S(100, 540), S(190, 540), S(230, 980), S(80, 990)], fill=(46, 34, 32))
# warm kitchen light spilling from the right
light = Image.new("L", (W * SS, H * SS), 0)
ld = ImageDraw.Draw(light)
ld.polygon([S(W, 300), S(W, 1900), S(700, 1900)], fill=110)
light = light.filter(ImageFilter.GaussianBlur(80 * SS))
im = Image.composite(Image.new("RGB", im.size, (240, 160, 80)), im, light)
# peephole glow
glow = Image.new("L", (W * SS, H * SS), 0)
ImageDraw.Draw(glow).ellipse([*S(490, 608), *S(590, 708)], fill=170)
glow = glow.filter(ImageFilter.GaussianBlur(26 * SS))
im = Image.composite(Image.new("RGB", im.size, (255, 220, 130)), im, glow)
finish(im, "home_door.png")
print("done")
