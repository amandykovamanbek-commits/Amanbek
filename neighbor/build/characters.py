"""Code-drawn characters and backgrounds (no AI images).

World space = 1080x1920 design frame. Characters are drawn with a transform
P(x, y) = (ox + x*s, oy + y*s) where the local origin is the point between the feet.
"""
import math
from PIL import Image, ImageDraw, ImageFilter

OUTL = (30, 24, 22)

BASE_PAL = dict(
    skin=(238, 212, 192), skin_sh=(214, 184, 164), hair=(118, 106, 96), hair_sh=(92, 82, 74),
    card=(132, 84, 50), card_sh=(104, 64, 38), shirt=(192, 216, 230), pants=(118, 124, 132),
    pants_sh=(98, 104, 112), slip=(104, 66, 48), must=(58, 44, 38), eye=(250, 250, 246),
    pupil=(16, 16, 18), mouth=(110, 40, 40), outl=OUTL, brow=(70, 60, 54),
)


def tint_pal(pal, mul, add=(0, 0, 0), sat=1.0):
    out = {}
    for k, (r, g, b) in pal.items():
        l = (r + g + b) / 3
        r, g, b = (l + (r - l) * sat, l + (g - l) * sat, l + (b - l) * sat)
        out[k] = tuple(int(max(0, min(255, c * m + a))) for c, m, a in zip((r, g, b), mul, add))
    return out


WARM = tint_pal(BASE_PAL, (1.08, 1.0, 0.82), (14, 8, 0))
CREEPY = tint_pal(BASE_PAL, (0.78, 0.72, 0.76), (0, 0, 0), 0.35)
GHOST = tint_pal(BASE_PAL, (0.62, 0.74, 0.92), (10, 20, 40), 0.5)
PEEP = tint_pal(BASE_PAL, (1.0, 0.84, 0.5), (0, 0, 0), 0.6)


def _limb(d, P, s, a, b, w, fill, outl, lw):
    (x0, y0), (x1, y1) = a, b
    ang = math.atan2(y1 - y0, x1 - x0)
    nx, ny = -math.sin(ang) * w / 2, math.cos(ang) * w / 2
    pts = [P(x0 + nx, y0 + ny), P(x1 + nx, y1 + ny), P(x1 - nx, y1 - ny), P(x0 - nx, y0 - ny)]
    d.polygon(pts, fill=fill, outline=outl)
    d.line(pts + [pts[0]], fill=outl, width=lw, joint="curve")
    for (cx, cy) in (a, b):
        r = w / 2 * s
        X, Y = P(cx, cy)
        d.ellipse((X - r, Y - r, X + r, Y + r), fill=fill)


def neighbor(d, ox, oy, s, pose=None, pal=BASE_PAL, alpha=255, head_only=False):
    """Draw the neighbour. pose keys: turn(-1..1), gaze(x,y), eye(0..1 open), wide(0..1),
    talk(0..1 mouth open), smile(-1..1), grin(0..1 creepy), wave(0..1), breathe, happy(0/1), dark_eyes"""
    p = dict(turn=0.0, gaze=(0.0, 0.0), eye=1.0, wide=0.0, talk=0.0, smile=0.0, grin=0.0,
             wave=0.0, breathe=0.0, happy=0, dark_eyes=0.0, wave_t=0.0)
    if pose:
        p.update(pose)
    A = alpha

    def c(k):
        return pal[k] + (A,)

    def P(x, y):
        return (ox + x * s, oy + y * s)

    lw = max(2, int(7 * s))
    ol = c("outl")
    br = p["breathe"]
    if not head_only:
        # shadow
        X0, Y0 = P(-170, -14)
        X1, Y1 = P(170, 16)
        d.ellipse((X0, Y0, X1, Y1), fill=(0, 0, 0, int(70 * A / 255)))
        # legs
        for sx in (-1, 1):
            x0, x1 = (-108, -12) if sx < 0 else (12, 108)
            d.rounded_rectangle((*P(x0, -480), *P(x1, -26)), radius=int(18 * s), fill=c("pants"), outline=ol, width=lw)
            d.line((P((x0 + x1) / 2 + 10 * sx, -440), P((x0 + x1) / 2 + 6 * sx, -60)), fill=c("pants_sh"), width=max(1, lw // 2))
            d.ellipse((*P(x0 - 14, -46), *P(x1 + 14, 6)), fill=c("slip"), outline=ol, width=lw)
        r = 34 * s
        # torso
        d.rounded_rectangle((*P(-186, -778 + br), *P(186, -418)), radius=int(80 * s), fill=c("card"), outline=ol, width=lw)
        d.rounded_rectangle((*P(-190, -470), *P(190, -418)), radius=int(22 * s), fill=c("card_sh"), outline=ol, width=lw)
        d.polygon([P(-66, -778 + br), P(66, -778 + br), P(0, -560)], fill=c("shirt"), outline=ol)
        d.line([P(-66, -778 + br), P(0, -560), P(66, -778 + br)], fill=ol, width=lw)
        d.polygon([P(-66, -778 + br), P(-8, -730), P(-40, -700)], fill=tuple(min(255, v + 20) for v in pal["shirt"]) + (A,), outline=ol)
        d.polygon([P(66, -778 + br), P(8, -730), P(40, -700)], fill=tuple(min(255, v + 20) for v in pal["shirt"]) + (A,), outline=ol)
        d.line([P(0, -560), P(0, -420)], fill=ol, width=lw)
        for by in (-528, -486, -446):
            X, Y = P(10, by)
            r = 8 * s
            d.ellipse((X - r, Y - r, X + r, Y + r), fill=c("card_sh"), outline=ol, width=max(1, lw // 2))
        # left arm (hanging, in front of the torso edge)
        _limb(d, P, s, (-190, -730 + br), (-222, -470), 72, c("card"), ol, lw)
        X, Y = P(-224, -446)
        d.ellipse((X - r, Y - r, X + r * 1.05, Y + r * 1.2), fill=c("skin"), outline=ol, width=lw)
        # right arm: hanging or waving
        w = p["wave"]
        if w <= 0.01:
            _limb(d, P, s, (190, -730 + br), (222, -470), 72, c("card"), ol, lw)
            X, Y = P(224, -446)
            d.ellipse((X - r * 1.05, Y - r, X + r, Y + r * 1.2), fill=c("skin"), outline=ol, width=lw)
        else:
            sh = (190, -730 + br)
            el = (172 + 120 * w, -745 + 140 - 260 * w)
            ang = -math.pi / 2 - 0.35 * w + 0.35 * math.sin(p["wave_t"] * 9) * w
            hand = (el[0] + 210 * math.cos(ang) * 0.6 + 40, el[1] + 210 * math.sin(ang))
            _limb(d, P, s, sh, el, 74, c("card"), ol, lw)
            _limb(d, P, s, el, hand, 64, c("card"), ol, lw)
            X, Y = P(*hand)
            d.ellipse((X - r * 1.15, Y - r * 1.4, X + r * 1.15, Y + r * 0.9), fill=c("skin"), outline=ol, width=lw)
        # neck
        d.rectangle((*P(-42, -812 + br), *P(42, -770 + br)), fill=c("skin_sh"), outline=ol, width=lw)

    # ---- head
    hy = -900 + br
    t = p["turn"]
    fx = t * 46  # feature shift
    for sx in (-1, 1):
        if t * sx < -0.55:
            continue  # far ear hidden
        ex = sx * 108 + t * 20
        d.ellipse((*P(ex - 22, hy - 34), *P(ex + 22, hy + 34)), fill=c("skin_sh"), outline=ol, width=lw)
    d.ellipse((*P(-112, hy - 128), *P(112, hy + 124)), fill=c("skin"), outline=ol, width=lw)
    # hair on the sides (bands hugging the skull) + bald shine
    for sx in (-1, 1):
        a0, a1 = (140, 222) if sx < 0 else (-42, 40)
        outer, inner = [], []
        for i in range(13):
            a = math.radians(a0 + (a1 - a0) * i / 12)
            wob = 1.0 + 0.04 * math.sin(i * 2.3)
            outer.append(P(t * 12 + 118 * wob * math.cos(a), hy + 2 + 128 * wob * math.sin(a)))
            inner.append(P(t * 12 + 86 * math.cos(a), hy + 2 + 104 * math.sin(a)))
        band = outer + inner[::-1]
        d.polygon(band, fill=c("hair"))
        d.line(outer, fill=ol, width=lw)
        for j in range(2, 11, 3):
            d.line([outer[j], inner[j]], fill=c("hair_sh"), width=max(1, lw // 2))
    d.ellipse((*P(-46 + fx * 0.3, hy - 116), *P(6 + fx * 0.3, hy - 96)), fill=tuple(min(255, v + 14) for v in pal["skin"]) + (A,))
    # brows
    wide = p["wide"]
    by = hy - 52 - 8 * wide
    d.line([P(-66 + fx, by + 4), P(-20 + fx, by - 2)], fill=c("brow"), width=int(lw * 1.4))
    d.line([P(20 + fx, by - 2), P(66 + fx, by + 4)], fill=c("brow"), width=int(lw * 1.4))
    # eyes
    er = 25 + 6 * wide
    for sx in (-1, 1):
        ex, ey = sx * 42 + fx, hy - 18
        if p["dark_eyes"] > 0:
            rr = er + 18
            d.ellipse((*P(ex - rr, ey - rr * 0.9), *P(ex + rr, ey + rr * 1.1)), fill=(40, 16, 26, int(170 * p["dark_eyes"] * A / 255)))
        if p["happy"]:
            d.arc((*P(ex - er, ey - er * 0.6), *P(ex + er, ey + er * 0.9)), 200, 340, fill=ol, width=int(lw * 1.2))
            continue
        op = max(0.06, p["eye"])
        d.ellipse((*P(ex - er, ey - er * op), *P(ex + er, ey + er * op)), fill=c("eye"), outline=ol, width=lw)
        if op > 0.3:
            pr = 7.5 - 3.5 * wide - 2.5 * p["dark_eyes"]
            gx, gy = p["gaze"]
            px, py = ex + gx * 10 + t * 6, ey + gy * 8
            d.ellipse((*P(px - pr, py - pr), *P(px + pr, py + pr)), fill=c("pupil"))
            if pr > 4:
                d.ellipse((*P(px - pr * 0.2, py - pr * 0.7), *P(px + pr * 0.35, py - pr * 0.15)), fill=(255, 255, 255, A))
    # nose
    d.arc((*P(-14 + fx * 1.15, hy + 4), *P(16 + fx * 1.15, hy + 36)), 200, 70, fill=ol, width=lw)
    # mouth (behind moustache)
    my = hy + 64
    g = p["grin"]
    if g > 0.01:
        half = 34 + 92 * g
        n = 40
        top = [P(fx - half + i * 2 * half / n, my - 6 - 34 * g * (abs(i - n / 2) / (n / 2)) ** 2) for i in range(n + 1)]
        bot = [P(fx + half - i * 2 * half / n, my + 10 + 34 * g - 26 * g * (abs(i - n / 2) / (n / 2)) ** 2) for i in range(n + 1)]
        d.polygon(top + bot, fill=(28, 6, 10, A))
        teeth = 6 + int(14 * g)
        for i in range(1, teeth):
            xx = fx - half + i * 2 * half / teeth
            tt = abs(i - teeth / 2) / (teeth / 2)
            yt = my - 6 - 34 * g * tt ** 2
            yb = my + 10 + 34 * g - 26 * g * tt ** 2
            ww = half / teeth
            d.polygon([P(xx - ww, yt), P(xx + ww, yt), P(xx, yt + (8 + 14 * g))], fill=(236, 230, 210, A))
            d.polygon([P(xx - ww, yb), P(xx + ww, yb), P(xx, yb - (6 + 12 * g))], fill=(226, 220, 200, A))
        d.line(top, fill=ol, width=lw)
    elif p["talk"] > 0.05:
        o = p["talk"]
        d.ellipse((*P(fx - 24 - 6 * o, my - 4), *P(fx + 24 + 6 * o, my + 6 + 30 * o)), fill=c("mouth"), outline=ol, width=lw)
    else:
        sm = p["smile"]
        d.arc((*P(fx - 30, my - 14 - 10 * sm), *P(fx + 30, my + 10 + 12 * sm)), 20 if sm >= 0 else 200,
              160 if sm >= 0 else 340, fill=ol, width=lw)
    # moustache
    mus = [(-64, 46), (-34, 30), (-6, 36), (0, 32), (6, 36), (34, 30), (64, 46), (56, 60), (18, 54), (0, 58), (-18, 54), (-56, 60)]
    d.polygon([P(x + fx, hy + y) for x, y in mus], fill=c("must"), outline=ol)
    d.line([P(x + fx, hy + y) for x, y in mus] + [P(mus[0][0] + fx, hy + mus[0][1])], fill=ol, width=lw)
    # chin
    d.arc((*P(-30 + fx * 0.6, hy + 92), *P(30 + fx * 0.6, hy + 120)), 20, 160, fill=c("skin_sh"), width=max(1, lw // 2))


# ------------------------------------------------------------------ dog
def dog(d, ox, oy, s, tremble=0.0, ear=0.0, look=1.0):
    """German shepherd cowering, facing left. Origin: floor point under its chest (old design x=150,y=1470)."""
    def P(x, y):
        return (ox + (x - 150) * s, oy + (y - 1470) * s)
    BR, DK, TAN = (156, 100, 52, 255), (44, 34, 30, 255), (200, 150, 90, 255)
    lw = max(2, int(6 * s))
    sh = lambda bb: tuple(v for v in bb)
    d.ellipse((*P(200, 1455), *P(820, 1485)), fill=(0, 0, 0, 60))
    d.chord((*P(560, 1300), *P(820, 1500)), 180, 330, fill=DK, outline=OUTL, width=lw)
    d.ellipse((*P(600, 1240), *P(820, 1450)), fill=BR, outline=OUTL, width=lw)
    d.ellipse((*P(640, 1420), *P(790, 1470)), fill=TAN, outline=OUTL, width=lw)
    body_dy = tremble
    d.ellipse((*P(330, 1180 + body_dy), *P(790, 1440)), fill=BR, outline=OUTL, width=lw)
    d.chord((*P(380, 1160 + body_dy), *P(760, 1360 + body_dy)), 180, 360, fill=DK)
    for x0 in (330, 400):
        d.rounded_rectangle((*P(x0, 1320), *P(x0 + 60, 1460)), radius=int(20 * s), fill=BR, outline=OUTL, width=lw)
        d.ellipse((*P(x0 - 20, 1430), *P(x0 + 70, 1475)), fill=TAN, outline=OUTL, width=lw)
    hy = tremble * 1.5
    d.ellipse((*P(250, 1120 + hy), *P(470, 1320 + hy)), fill=BR, outline=OUTL, width=lw)
    snout = [P(290, 1220 + hy), P(170, 1260 + hy), P(160, 1300 + hy), P(300, 1310 + hy)]
    d.polygon(snout, fill=TAN, outline=OUTL)
    d.line(snout, fill=OUTL, width=lw)
    d.ellipse((*P(150, 1252 + hy), *P(185, 1285 + hy)), fill=DK)
    e = ear * 20
    d.polygon([P(400, 1150 + hy), P(520, 1120 + hy - e), P(440, 1200 + hy)], fill=DK, outline=OUTL)
    d.polygon([P(370, 1140 + hy), P(480, 1095 + hy - e), P(410, 1185 + hy)], fill=(70, 50, 40, 255), outline=OUTL)
    d.ellipse((*P(330, 1180 + hy), *P(392, 1236 + hy)), fill=(245, 240, 230, 255), outline=OUTL, width=lw)
    px = 366 + 10 * look
    d.ellipse((*P(px - 12, 1196 + hy), *P(px + 12, 1220 + hy)), fill=(10, 10, 10, 255))
    d.line((P(325, 1170 + hy), P(395, 1158 + hy)), fill=OUTL, width=lw)
    d.line((P(440, 1150 + hy), P(470, 1300 + hy)), fill=(180, 40, 40, 255), width=int(14 * s))
    d.line((P(465, 1290 + hy), P(560, 1470), P(980, 1500)), fill=(180, 40, 40, 255), width=int(8 * s))


# ------------------------------------------------------------------ backgrounds
def _canvas(R, col):
    return Image.new("RGB", (int(1080 * R), int(1920 * R)), col)


def stairwell(R=1.5, warm=False, door=True):
    SS = 2
    k = R * SS
    im = _canvas(R * SS, (200, 206, 198))
    d = ImageDraw.Draw(im, "RGBA")

    def S(*v):
        return tuple(int(x * k) for x in v)
    wall_hi = (206, 210, 202) if not warm else (238, 224, 190)
    green = (64, 108, 80) if not warm else (98, 128, 78)
    floor = (200, 186, 156) if not warm else (222, 196, 150)
    d.rectangle(S(0, 0, 1080, 200), fill=(170, 176, 172) if not warm else (214, 200, 170))
    d.polygon([S(0, 200)[:2], S(1080, 200)[:2], S(1080, 220)[:2], S(0, 220)[:2]], fill=(150, 156, 150))
    d.rectangle(S(0, 220, 1080, 930), fill=wall_hi)
    for i in range(10):
        x, y = (i * 211) % 1000, 260 + (i * 157) % 560
        d.ellipse(S(x, y, x + 140, y + 46), fill=(0, 0, 0, 10))
    d.rectangle(S(0, 930, 1080, 1470), fill=green)
    d.rectangle(S(0, 920, 1080, 940), fill=tuple(int(v * 0.8) for v in green))
    d.rectangle(S(0, 1440, 1080, 1470), fill=tuple(int(v * 0.75) for v in green))
    d.rectangle(S(0, 1470, 1080, 1920), fill=floor)
    lc = tuple(int(v * 0.82) for v in floor)
    for x in range(-600, 1700, 150):
        d.line([S(540 + (x - 540) * 0.55, 1470), S(x, 1920)], fill=lc, width=int(3 * k))
    for y in (1530, 1620, 1740, 1900):
        d.line([S(0, y), S(1080, y)], fill=lc, width=int(3 * k))
    # fluorescent tube
    d.rounded_rectangle(S(300, 60, 780, 96), radius=int(12 * k), fill=(232, 250, 246), outline=OUTL, width=int(4 * k))
    d.rectangle(S(320, 96, 760, 104), fill=(120, 130, 130))
    # electrical box + pipe
    d.rectangle(S(80, 640, 270, 860), fill=(150, 158, 160), outline=OUTL, width=int(5 * k))
    d.rectangle(S(100, 660, 250, 840), outline=(120, 128, 130), width=int(3 * k))
    d.rectangle(S(226, 730, 240, 770), fill=(80, 84, 88))
    d.rectangle(S(300, 220, 318, 1180), fill=(150, 154, 152), outline=OUTL, width=int(3 * k))
    # radiator
    for i in range(9):
        x = 60 + i * 30
        d.rounded_rectangle(S(x, 1180, x + 24, 1410), radius=int(10 * k), fill=(160, 164, 162), outline=OUTL, width=int(3 * k))
    d.rectangle(S(56, 1200, 336, 1214), fill=(140, 144, 142))
    if door:
        d.rectangle(S(760, 520, 1050, 1472), fill=(70, 40, 30), outline=OUTL, width=int(6 * k))
        d.rectangle(S(782, 542, 1030, 1450), fill=(118, 64, 46), outline=OUTL, width=int(4 * k))
        for gy in range(9):
            for gx in range(3):
                x, y = 812 + gx * 90 + (gy % 2) * 45, 580 + gy * 100
                if x < 1020:
                    d.ellipse(S(x - 6, y - 6, x + 6, y + 6), fill=(196, 166, 96))
        d.rounded_rectangle(S(800, 980, 860, 1000), radius=int(6 * k), fill=(180, 176, 168), outline=OUTL, width=int(3 * k))
        d.rounded_rectangle(S(860, 640, 950, 690), radius=int(6 * k), fill=(196, 160, 78), outline=OUTL, width=int(3 * k))
    im = im.resize((int(1080 * R), int(1920 * R)), Image.LANCZOS)
    # lamp glow
    glow = Image.new("L", im.size, 0)
    ImageDraw.Draw(glow).ellipse((int(200 * R), int(-140 * R), int(880 * R), int(420 * R)), fill=150 if not warm else 90)
    glow = glow.filter(ImageFilter.GaussianBlur(90 * R))
    im = Image.composite(Image.new("RGB", im.size, (240, 255, 250) if not warm else (255, 236, 190)), im, glow)
    if warm:  # sun beams
        beams = Image.new("L", im.size, 0)
        bd = ImageDraw.Draw(beams)
        for i in range(4):
            x = (100 + i * 170) * R
            bd.polygon([(x, 0), (x + 90 * R, 0), (x + 420 * R, 1920 * R), (x + 250 * R, 1920 * R)], fill=46)
        beams = beams.filter(ImageFilter.GaussianBlur(30 * R))
        im = Image.composite(Image.new("RGB", im.size, (255, 236, 170)), im, beams)
    return im


def entrance(R=1.5):
    SS = 2
    k = R * SS
    im = _canvas(R * SS, (150, 162, 168))
    d = ImageDraw.Draw(im, "RGBA")

    def S(*v):
        return tuple(int(x * k) for x in v)
    d.rectangle(S(0, 0, 1080, 960), fill=(150, 164, 172))
    d.rectangle(S(0, 960, 1080, 1560), fill=(58, 96, 82))
    d.rectangle(S(0, 1560, 1080, 1920), fill=(126, 132, 136))
    for x in range(-600, 1700, 160):
        d.line([S(540 + (x - 540) * 0.55, 1560), S(x, 1920)], fill=(104, 110, 114), width=int(3 * k))
    # stairs on the left
    for i in range(8):
        y = 1560 - i * 70
        d.rectangle(S(0, y - 70, 300 - i * 26, y), fill=(120 - i * 3, 126 - i * 3, 130 - i * 3), outline=OUTL, width=int(3 * k))
    # mailboxes
    for r_ in range(2):
        for c_ in range(3):
            x, y = 80 + c_ * 80, 520 + r_ * 110
            d.rectangle(S(x, y, x + 70, y + 96), fill=(130, 138, 144), outline=OUTL, width=int(3 * k))
            d.rectangle(S(x + 10, y + 14, x + 60, y + 24), fill=(60, 64, 70))
    # glass door frame
    d.rectangle(S(540, 300, 1040, 1566), fill=(84, 88, 92), outline=OUTL, width=int(8 * k))
    gx0, gy0, gx1, gy1 = 580, 340, 1000, 1500
    # outside night through glass
    for y in range(gy0, gy1, 6):
        tt = (y - gy0) / (gy1 - gy0)
        d.rectangle(S(gx0, y, gx1, y + 6), fill=(int(24 + 30 * tt), int(34 + 36 * tt), int(64 + 40 * tt)))
    for bx, bw, bh in ((600, 120, 520), (740, 160, 640), (900, 100, 420)):
        d.rectangle(S(bx, 1180 - bh, bx + bw, 1180), fill=(30, 36, 56))
        for wy in range(1180 - bh + 30, 1160, 60):
            for wx in range(bx + 16, bx + bw - 20, 40):
                if (wx * 7 + wy * 3) % 5 < 2:
                    d.rectangle(S(wx, wy, wx + 18, wy + 26), fill=(250, 210, 120))
    d.rectangle(S(gx0, 1180, gx1, gy1), fill=(200, 210, 226))
    d.rectangle(S(gx0, gy0, gx1, gy1), outline=OUTL, width=int(6 * k))
    d.rectangle(S(770, 330, 790, 1520), fill=(84, 88, 92), outline=OUTL, width=int(4 * k))
    d.rounded_rectangle(S(740, 860, 760, 1000), radius=int(6 * k), fill=(180, 180, 176), outline=OUTL, width=int(3 * k))
    d.rectangle(S(560, 760, 580, 900), fill=(40, 44, 48))
    im = im.resize((int(1080 * R), int(1920 * R)), Image.LANCZOS)
    return im


GLASS = (580, 340, 1000, 1500)


def dog_hall(R=1.5):
    """Your landing seen from floor level; floor line at y=1000."""
    SS = 2
    k = R * SS
    im = _canvas(R * SS, (200, 206, 198))
    d = ImageDraw.Draw(im, "RGBA")

    def S(*v):
        return tuple(int(x * k) for x in v)
    d.rectangle(S(0, 0, 1080, 380), fill=(200, 206, 198))
    d.rectangle(S(0, 380, 1080, 1000), fill=(64, 108, 80))
    d.rectangle(S(0, 372, 1080, 388), fill=(52, 90, 66))
    d.rectangle(S(0, 1000, 1080, 1920), fill=(198, 184, 154))
    for x in range(-900, 2000, 170):
        d.line([S(540 + (x - 540) * 0.4, 1000), S(x, 1920)], fill=(166, 152, 122), width=int(3 * k))
    for y in (1060, 1160, 1320, 1560, 1900):
        d.line([S(0, y), S(1080, y)], fill=(166, 152, 122), width=int(3 * k))
    d.rectangle(S(-20, -40, 470, 1010), fill=(70, 74, 80), outline=OUTL, width=int(8 * k))
    d.rectangle(S(30, 20, 420, 960), outline=(56, 60, 66), width=int(5 * k))
    d.rounded_rectangle(S(380, 400, 450, 430), radius=int(10 * k), fill=(170, 168, 160), outline=OUTL, width=int(3 * k))
    d.ellipse(S(400, 470, 426, 496), fill=(150, 130, 70), outline=OUTL, width=int(3 * k))
    d.rectangle(S(-20, 990, 500, 1018), fill=(48, 50, 54))
    return im.resize((int(1080 * R), int(1920 * R)), Image.LANCZOS)
