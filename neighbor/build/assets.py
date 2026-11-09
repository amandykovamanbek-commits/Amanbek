"""Build static hand-drawn scene plates (door plate, your hallway). No AI images.
Outputs PNGs into build/plates/.
"""
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "plates")
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
FONT = "/usr/share/fonts/opentype/inter/"


def font(name, size):
    return ImageFont.truetype(FONT + name, size)


def save(im, name):
    im.save(os.path.join(OUT, name))
    print("saved", name, im.size)



def cover(im, scale=1.12):
    return im.resize((int(W * scale), int(H * scale)), Image.LANCZOS)


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
