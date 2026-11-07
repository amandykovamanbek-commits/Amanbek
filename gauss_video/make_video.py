#!/usr/bin/env python3
"""Shorts-style video: how 9-year-old Gauss summed 1..100.
Cartoon round-head characters, warm lighting, word-by-word captions."""
import math, os, random, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)
W, H = 720, 1280
FPS = 30
SS = 2  # supersampling for static layers / sprites
random.seed(7)

F_CAP = "/usr/share/fonts/opentype/montserrat/Montserrat-ExtraBold.otf"
F_BLACK = "/usr/share/fonts/opentype/montserrat/Montserrat-Black.otf"
F_CHALK = "/usr/share/fonts/opentype/comic-neue/ComicNeue-Bold.otf"
_fc = {}
def font(path, size):
    size = max(1, int(size))
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]

# ---------------------------------------------------------------- script
# (spoken text, caption text, scene)
SEGMENTS = [
    ("Германия, тысяча семьсот восемьдесят шестой год.", "Германия, 1786 год.", "teacher"),
    ("Учитель хотел немного отдохнуть и заставил весь класс сложить все числа от одного до ста.",
     "Учитель хотел немного отдохнуть и заставил весь класс сложить все числа от 1 до 100.", "teacher"),
    ("Без калькуляторов.", "Без калькуляторов.", "kids_calc"),
    ("Дети начали считать: один плюс два, плюс три, плюс четыре...",
     "Дети начали считать: 1 + 2, + 3, + 4...", "kids"),
    ("Но уже через минуту один мальчик положил свою доску на стол.",
     "Но уже через минуту один мальчик положил свою доску на стол.", "walk"),
    ("Его звали Карл Гаусс, и ему было девять лет.", "Его звали Карл Гаусс, и ему было 9 лет.", "gauss_close"),
    ("Учитель усмехнулся... а потом увидел ответ: пять тысяч пятьдесят.",
     "Учитель усмехнулся... а потом увидел ответ: 5050.", "shock"),
    ("И это было правильно.", "И это было правильно.", "shock"),
    ("Гаусс заметил закономерность.", "Гаусс заметил закономерность.", "idea"),
    ("Один плюс сто — сто один.", "1 + 100 = 101", "board1"),
    ("Два плюс девяносто девять — тоже сто один.", "2 + 99 тоже 101", "board2"),
    ("Три плюс девяносто восемь — снова сто один!", "3 + 98 снова 101!", "board3"),
    ("Каждая пара даёт сто один.", "Каждая пара даёт 101.", "board_all"),
    ("А пар всего — сто пополам, то есть пятьдесят.", "А пар всего: 100 / 2, то есть 50.", "board_half"),
    ("Он просто умножил: пятьдесят на сто один — пять тысяч пятьдесят.",
     "Он просто умножил: 50 × 101 = 5050", "board_mult"),
    ("Так девятилетний мальчик придумал метод, которым мы пользуемся до сих пор.",
     "Так 9-летний мальчик придумал метод, которым мы пользуемся до сих пор.", "formula"),
    ("А позже его назовут королём математиков.", "А позже его назовут королём математиков.", "king"),
]

# ---------------------------------------------------------------- TTS
def synth(i, text):
    raw = f"{OUT}/seg{i:02d}_raw.wav"
    fin = f"{OUT}/seg{i:02d}.wav"
    if not os.path.exists(fin):
        subprocess.run(["RHVoice-test", "-p", "aleksandr-hq", "-o", raw], input=text.encode(), check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                        "atempo=1.12,aresample=44100", "-ac", "1", fin], check=True)
    with wave.open(fin) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return data

SR = 44100
LEAD = 0.35
GAP = 0.28
voice_parts, timeline = [], []
t = LEAD
for i, (spoken, cap, scene) in enumerate(SEGMENTS):
    a = synth(i, spoken)
    d = len(a) / SR
    timeline.append(dict(i=i, start=t, dur=d, cap=cap, scene=scene, audio=a))
    t += d + GAP
TOTAL = t + 1.2
print("total duration", round(TOTAL, 2))

# word timings: proportional to word length (+ pause weight on punctuation)
words = []
for seg in timeline:
    ws = seg["cap"].split()
    wts = [len(w.strip(".,!?:")) + 2 + (3 if w[-1] in ".,!?:" else 0) for w in ws]
    tot = sum(wts)
    acc = seg["start"]
    for w, wt in zip(ws, wts):
        d = seg["dur"] * wt / tot
        words.append((acc, acc + d, w))
        acc += d
# extend each word until the next one starts (no flicker between words)
words = [(s, (words[k + 1][0] if k + 1 < len(words) and words[k + 1][0] - e < 0.5 else e + 0.15), w)
         for k, (s, e, w) in enumerate(words)]

# scene blocks (merge consecutive segments with same scene; board* share one block)
def block_key(s):
    return "board" if s.startswith("board") else s
blocks = []
for seg in timeline:
    k = block_key(seg["scene"])
    if blocks and blocks[-1]["key"] == k:
        blocks[-1]["segs"].append(seg)
    else:
        blocks.append(dict(key=k, segs=[seg]))
for bi, b in enumerate(blocks):
    b["start"] = 0.0 if bi == 0 else b["segs"][0]["start"] - GAP / 2
    b["end"] = TOTAL if bi == len(blocks) - 1 else None
for bi in range(len(blocks) - 1):
    blocks[bi]["end"] = blocks[bi + 1]["start"]

# ---------------------------------------------------------------- drawing helpers
def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def back_out(x):
    x = max(0.0, min(1.0, x))
    c = 1.70158
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def lin_grad(w, h, c1, c2, vertical=True):
    a = np.linspace(0, 1, h if vertical else w)[:, None] if vertical else np.linspace(0, 1, w)[None, :]
    c1, c2 = np.array(c1, np.float32), np.array(c2, np.float32)
    g = c1 + (c2 - c1) * a[..., None]
    g = np.broadcast_to(g, (h, w, 3))
    return Image.fromarray(g.astype(np.uint8), "RGB")

def hexc(s, a=255):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4)) + (a,)

OUTLINE = hexc("#2A1E1A")
SKIN = hexc("#F6EFE2")

def vignette(w, h, strength=0.55):
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    v = 1 - strength * np.clip(d - 0.45, 0, 1) ** 1.4
    return v.astype(np.float32)

VIG = vignette(W, H)

def grain_frames(n=12):
    rs = np.random.RandomState(3)
    return [(rs.randn(H, W, 1) * 5).astype(np.float32) for _ in range(n)]
GRAIN = grain_frames()

# ---------------------------------------------------------------- characters
def character(R=110, body="#F08A24", hair="messy", hair_color="#6B3E22", expr="neutral",
              beard=False, glasses=False, cap=False, crown=False, arm="down",
              slate_text=None, sweat=False, look=(0, 0), blink=False, legs=True, lift=0.0):
    """Return RGBA sprite. Anchor: bottom-centre at feet."""
    s = SS
    r = R * s
    cw, ch = int(r * 3.4), int(r * 5.6)
    im = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = max(3, int(r * 0.045))
    cx = cw // 2
    hy = int(r * 1.35)  # head centre
    body_top, body_bot = hy + int(r * 0.75), hy + int(r * 2.45)
    bw = int(r * 0.62)
    bc = hexc(body)
    dark = tuple(int(c * 0.72) for c in bc[:3]) + (255,)
    # legs
    if legs:
        for sx in (-1, 1):
            x = cx + sx * int(r * 0.22)
            d.line([(x, body_bot - 10), (x, body_bot + int(r * 0.85))], fill=OUTLINE, width=int(lw * 1.6))
            d.ellipse([x - int(r * 0.2) + sx * int(r * 0.06), body_bot + int(r * 0.78),
                       x + int(r * 0.2) + sx * int(r * 0.06), body_bot + int(r * 0.98)], fill=OUTLINE)
    # body (capsule coat)
    d.rounded_rectangle([cx - bw, body_top, cx + bw, body_bot], radius=int(bw * 0.95), fill=bc,
                        outline=OUTLINE, width=lw)
    d.rounded_rectangle([cx - bw + lw * 2, body_top + int(r * 0.35), cx - bw + int(bw * 0.5), body_bot - lw * 3],
                        radius=int(bw * 0.4), fill=dark)  # shading
    d.line([(cx, body_top + int(r * 0.3)), (cx, body_bot - int(r * 0.2))], fill=dark, width=lw)
    # collar
    d.polygon([(cx - int(r * 0.32), body_top + 6), (cx, body_top + int(r * 0.3)), (cx + int(r * 0.32), body_top + 6)],
              fill=hexc("#F3F0E8"), outline=OUTLINE)
    # arms
    sh_y = body_top + int(r * 0.35)
    def hand(x, y):
        hr = int(r * 0.13)
        d.ellipse([x - hr, y - hr, x + hr, y + hr], fill=SKIN, outline=OUTLINE, width=lw)
    if arm == "down":
        for sx in (-1, 1):
            x0 = cx + sx * (bw - 4)
            x1 = cx + sx * (bw + int(r * 0.22))
            d.line([(x0, sh_y), (x1, sh_y + int(r * 0.85))], fill=dark, width=int(r * 0.2))
            hand(x1, sh_y + int(r * 0.95))
    elif arm == "chin":
        x0 = cx - (bw - 4)
        d.line([(x0, sh_y), (cx - bw - int(r * 0.2), sh_y + int(r * 0.7))], fill=dark, width=int(r * 0.2))
        hand(cx - bw - int(r * 0.2), sh_y + int(r * 0.8))
        x0 = cx + (bw - 4)
        d.line([(x0, sh_y), (cx + int(r * 0.7), sh_y + int(r * 0.25)), (cx + int(r * 0.35), hy + int(r * 0.88))],
               fill=dark, width=int(r * 0.2), joint="curve")
    elif arm == "up":
        d.line([(cx - bw + 4, sh_y), (cx - bw - int(r * 0.25), sh_y + int(r * 0.8))], fill=dark, width=int(r * 0.2))
        hand(cx - bw - int(r * 0.25), sh_y + int(r * 0.9))
        d.line([(cx + bw - 4, sh_y), (cx + bw + int(r * 0.45), sh_y - int(r * 0.7))], fill=dark, width=int(r * 0.2))
        hand(cx + bw + int(r * 0.45), sh_y - int(r * 0.8))
    # ---- head
    d.ellipse([cx - r, hy - r, cx + r, hy + r], fill=SKIN, outline=OUTLINE, width=lw)
    # soft cheek shade
    shade = Image.new("RGBA", im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.ellipse([cx - r + lw, hy - r + lw, cx + r - lw, hy + r - lw], fill=(200, 160, 120, 60))
    sd.ellipse([cx - r * 0.9, hy - r * 1.05, cx + r * 0.75, hy + r * 0.75], fill=(0, 0, 0, 0))
    im.alpha_composite(shade)
    d = ImageDraw.Draw(im)
    # hair
    hc = hexc(hair_color)
    if hair == "messy":
        d.chord([cx - r, hy - r, cx + r, hy + r], 205, 335, fill=hc, outline=OUTLINE, width=lw)
        for k in range(7):
            a = math.radians(200 + k * 23.3)
            px, py = cx + math.cos(a) * r * 0.97, hy + math.sin(a) * r * 0.97
            tr = r * 0.27
            d.ellipse([px - tr, py - tr, px + tr, py + tr], fill=hc)
    elif hair == "bowl":
        d.chord([cx - r * 1.03, hy - r * 1.03, cx + r * 1.03, hy + r * 0.9], 170, 370, fill=hc, outline=OUTLINE,
                width=lw)
    elif hair == "pony":
        d.chord([cx - r * 1.03, hy - r * 1.03, cx + r * 1.03, hy + r * 0.9], 175, 365, fill=hc, outline=OUTLINE,
                width=lw)
        d.ellipse([cx + r * 0.75, hy - r * 0.2, cx + r * 1.25, hy + r * 0.5], fill=hc, outline=OUTLINE, width=lw)
    elif hair == "grey_sides":
        for sx in (-1, 1):
            for k in range(4):
                px = cx + sx * r * (0.92 - k * 0.04)
                py = hy - r * 0.15 + k * r * 0.18
                tr = r * 0.22
                d.ellipse([px - tr, py - tr, px + tr, py + tr], fill=hc, outline=None)
    if cap:
        d.chord([cx - r * 1.02, hy - r * 1.06, cx + r * 1.02, hy + r * 0.55], 180, 360, fill=hexc("#1E1A22"),
                outline=OUTLINE, width=lw)
    if crown:
        cy0 = hy - r * 0.78
        pts = [(cx - r * 0.5, cy0), (cx - r * 0.55, cy0 - r * 0.55), (cx - r * 0.27, cy0 - r * 0.3),
               (cx, cy0 - r * 0.7), (cx + r * 0.27, cy0 - r * 0.3), (cx + r * 0.55, cy0 - r * 0.55),
               (cx + r * 0.5, cy0)]
        d.polygon(pts, fill=hexc("#F7C531"), outline=OUTLINE, width=lw)
        for (px, py) in [pts[1], pts[3], pts[5]]:
            d.ellipse([px - r * 0.07, py - r * 0.07, px + r * 0.07, py + r * 0.07], fill=hexc("#E2374B"))
    # beard
    if beard:
        bcx = hexc("#C9C5BE")
        d.chord([cx - r * 0.85, hy - r * 0.35, cx + r * 0.85, hy + r * 1.25], 0, 180, fill=bcx, outline=OUTLINE,
                width=lw)
        d.ellipse([cx - r * 0.45, hy + r * 0.1, cx + r * 0.45, hy + r * 0.45], fill=bcx)
    # eyes
    ex, ey = r * 0.34, hy - r * 0.05
    big = 1.35 if expr == "shock" else 1.0
    erx, ery = r * 0.2 * big, r * 0.25 * big
    for sx in (-1, 1):
        x = cx + sx * ex
        if blink:
            d.line([(x - erx, ey), (x + erx, ey)], fill=OUTLINE, width=lw)
            continue
        d.ellipse([x - erx, ey - ery, x + erx, ey + ery], fill=(255, 255, 255, 255), outline=OUTLINE, width=lw)
        pr = r * (0.06 if expr == "shock" else 0.095)
        px, py = x + look[0] * erx * 0.45, ey + look[1] * ery * 0.4
        d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=OUTLINE)
        d.ellipse([px - pr * 0.35 + pr * 0.3, py - pr * 0.75, px + pr * 0.15 + pr * 0.3, py - pr * 0.25],
                  fill=(255, 255, 255, 255))
        if expr in ("smirk", "grumpy", "stress"):
            # half-closed lid
            top = ey - ery - 2
            lid_y = ey - ery * (0.1 if expr == "smirk" else 0.25)
            d.chord([x - erx, ey - ery, x + erx, ey + ery], 180, 360, fill=SKIN)
            d.rectangle([x - erx - 1, top, x + erx + 1, lid_y], fill=SKIN)
            d.line([(x - erx, lid_y), (x + erx, lid_y)], fill=OUTLINE, width=int(lw * 1.5))
            d.arc([x - erx, ey - ery, x + erx, ey + ery], 0, 180, fill=OUTLINE, width=lw)
        if expr == "grumpy":
            d.line([(x - erx * 1.1 * sx, ey - ery * 1.7), (x + erx * 1.1 * sx, ey - ery * 1.15)], fill=OUTLINE,
                   width=int(lw * 1.6))
        if expr == "stress":
            d.line([(x - erx * 1.1 * sx, ey - ery * 1.25), (x + erx * 1.1 * sx, ey - ery * 1.75)], fill=OUTLINE,
                   width=int(lw * 1.3))
        if expr == "shock":
            d.arc([x - erx, ey - ery * 2.4, x + erx, ey - ery * 1.0], 200, 340, fill=OUTLINE, width=lw)
    if glasses:
        for sx in (-1, 1):
            x = cx + sx * ex
            gr = r * 0.27 * big
            d.ellipse([x - gr, ey - gr, x + gr, ey + gr], outline=hexc("#3B2A20"), width=lw)
        d.line([(cx - ex + r * 0.27, ey), (cx + ex - r * 0.27, ey)], fill=hexc("#3B2A20"), width=lw)
    # mouth
    my = hy + r * 0.42
    mfill = hexc("#5A2323")
    if expr == "neutral":
        d.line([(cx - r * 0.12, my), (cx + r * 0.12, my)], fill=OUTLINE, width=lw)
    elif expr == "smile":
        d.chord([cx - r * 0.25, my - r * 0.15, cx + r * 0.25, my + r * 0.18], 0, 180, fill=mfill, outline=OUTLINE,
                width=lw)
    elif expr == "smirk":
        d.arc([cx - r * 0.1, my - r * 0.22, cx + r * 0.35, my + r * 0.06], 20, 160, fill=OUTLINE, width=lw)
    elif expr == "grumpy":
        d.arc([cx - r * 0.18, my - r * 0.02, cx + r * 0.18, my + r * 0.2], 200, 340, fill=OUTLINE, width=lw)
    elif expr == "shock":
        d.ellipse([cx - r * 0.13, my - r * 0.12, cx + r * 0.13, my + r * 0.25], fill=mfill, outline=OUTLINE,
                  width=lw)
    elif expr == "stress":
        pts = [(cx - r * 0.2 + k * r * 0.08, my + (r * 0.04 if k % 2 else -r * 0.03)) for k in range(6)]
        d.line(pts, fill=OUTLINE, width=lw)
    if sweat:
        sx0, sy0 = cx + r * 0.85, hy - r * 0.45
        d.polygon([(sx0, sy0 - r * 0.2), (sx0 - r * 0.1, sy0 + r * 0.02), (sx0 + r * 0.1, sy0 + r * 0.02)],
                  fill=hexc("#7FD0F5"))
        d.ellipse([sx0 - r * 0.1, sy0 - r * 0.07, sx0 + r * 0.1, sy0 + r * 0.13], fill=hexc("#7FD0F5"))
    # slate held in front
    if arm == "slate":
        sw, sh = r * 1.5, r * 1.05
        sx0, sy0 = cx - sw / 2, body_top + r * 0.15 - lift * r
        d.rounded_rectangle([sx0 - r * 0.08, sy0 - r * 0.08, sx0 + sw + r * 0.08, sy0 + sh + r * 0.08],
                            radius=int(r * 0.08), fill=hexc("#9A6A3C"), outline=OUTLINE, width=lw)
        d.rectangle([sx0, sy0, sx0 + sw, sy0 + sh], fill=hexc("#2B3330"))
        if slate_text:
            f = font(F_CHALK, int(r * 0.55))
            d.text((cx, sy0 + sh / 2), slate_text, font=f, fill=(245, 245, 235, 255), anchor="mm")
        for sx in (-1, 1):
            hand(cx + sx * sw * 0.47, sy0 + sh * 0.85)
    if not legs:
        pass
    sm = im.resize((cw // s, ch // s), Image.LANCZOS)
    return sm

_spr = {}
def sprite(**kw):
    key = tuple(sorted((k, str(v)) for k, v in kw.items()))
    if key not in _spr:
        _spr[key] = character(**kw)
    return _spr[key]

def place(canvas, spr, x, y_feet, scale=1.0):
    if scale != 1.0:
        spr = spr.resize((max(1, int(spr.width * scale)), max(1, int(spr.height * scale))), Image.BILINEAR)
    canvas.alpha_composite(spr, (int(x - spr.width / 2), int(y_feet - spr.height)))

# ---------------------------------------------------------------- environments (static, cached)
def classroom_bg():
    w, h = W * SS, H * SS
    img = lin_grad(w, h, (226, 196, 152), (176, 132, 92)).convert("RGBA")
    d = ImageDraw.Draw(img)
    floor_y = int(h * 0.66)
    # wainscot
    d.rectangle([0, int(h * 0.53), w, floor_y], fill=hexc("#7A4B2B"))
    for x in range(0, w, int(w * 0.12)):
        d.rectangle([x + 10, int(h * 0.545), x + int(w * 0.12) - 10, floor_y - 14], outline=hexc("#5C371F"),
                    width=6)
    d.rectangle([0, int(h * 0.525), w, int(h * 0.537)], fill=hexc("#5C371F"))
    # floor with perspective planks
    d.rectangle([0, floor_y, w, h], fill=hexc("#8B5A33"))
    vx, vy = w * 0.5, h * 0.42
    for k in range(-14, 15):
        xb = w * 0.5 + k * w * 0.11
        d.line([(vx + (xb - vx) * ((floor_y - vy) / (h - vy)), floor_y), (xb, h)], fill=hexc("#6E4426"), width=5)
    for k in range(1, 9):
        yy = floor_y + (h - floor_y) * (k / 9) ** 1.6
        d.line([(0, yy), (w, yy)], fill=hexc("#7A4B2B"), width=3)
    # blackboard
    bx0, by0, bx1, by1 = int(w * 0.06), int(h * 0.17), int(w * 0.7), int(h * 0.41)
    d.rectangle([bx0 - 22, by0 - 22, bx1 + 22, by1 + 22], fill=hexc("#6A3F22"), outline=OUTLINE, width=6)
    d.rectangle([bx0, by0, bx1, by1], fill=hexc("#2D4536"))
    d.rectangle([bx0 - 30, by1 + 18, bx1 + 30, by1 + 40], fill=hexc("#5C371F"))
    fch = font(F_CHALK, 64)
    d.text((bx0 + 40, by0 + 40), "1 + 2 + 3 + ... + 100 = ?", font=fch, fill=(235, 235, 225, 210))
    for k in range(18):
        x = random.randint(bx0 + 30, bx1 - 120)
        y = random.randint(by0 + 150, by1 - 40)
        d.line([(x, y), (x + random.randint(40, 140), y + random.randint(-12, 12))], fill=(220, 225, 215, 70),
               width=5)
    # window
    wx0, wy0, wx1, wy1 = int(w * 0.78), int(h * 0.12), int(w * 1.02), int(h * 0.45)
    d.rectangle([wx0 - 18, wy0 - 18, wx1, wy1 + 18], fill=hexc("#6A3F22"), outline=OUTLINE, width=6)
    sky = lin_grad(wx1 - wx0, wy1 - wy0, (255, 236, 190), (250, 205, 140)).convert("RGBA")
    img.alpha_composite(sky, (wx0, wy0))
    d = ImageDraw.Draw(img)
    d.line([((wx0 + wx1) / 2, wy0), ((wx0 + wx1) / 2, wy1)], fill=hexc("#6A3F22"), width=14)
    d.line([(wx0, (wy0 + wy1) / 2), (wx1, (wy0 + wy1) / 2)], fill=hexc("#6A3F22"), width=14)
    # picture frame + map
    d.rectangle([int(w * 0.3), int(h * 0.05), int(w * 0.48), int(h * 0.13)], fill=hexc("#E9D9B0"),
                outline=hexc("#6A3F22"), width=10)
    d.ellipse([int(w * 0.35), int(h * 0.065), int(w * 0.43), int(h * 0.115)], outline=hexc("#8A6A4A"), width=6)
    # light beams
    beams = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(beams)
    bd.polygon([(wx0, wy0), (wx1, wy0 + 40), (w * 0.55, h * 0.95), (w * 0.05, h * 0.85)], fill=(255, 220, 150, 55))
    beams = beams.filter(ImageFilter.GaussianBlur(60))
    img.alpha_composite(beams)
    return img.resize((W, H), Image.LANCZOS)

def chalkboard_bg():
    w, h = W, H
    rs = np.random.RandomState(11)
    base = np.zeros((h, w, 3), np.float32) + np.array([38, 58, 47], np.float32)
    noise = rs.randn(h // 8, w // 8).astype(np.float32)
    noise = np.array(Image.fromarray(((noise + 3) * 40).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC),
                     np.float32) / 255 - 0.47
    base += noise[..., None] * 18
    img = Image.fromarray(base.clip(0, 255).astype(np.uint8)).convert("RGBA")
    sm = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(sm)
    for k in range(14):
        x, y = rs.randint(0, w), rs.randint(0, h)
        d.ellipse([x - 160, y - 50, x + 160, y + 50], fill=(220, 230, 220, 18))
    sm = sm.filter(ImageFilter.GaussianBlur(30))
    img.alpha_composite(sm)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, h - 1], outline=hexc("#6A3F22"), width=18)
    d.rectangle([18, 18, w - 19, h - 19], outline=hexc("#3E2414"), width=4)
    d.rectangle([0, h - 70, w, h], fill=hexc("#6A3F22"))
    d.rectangle([0, h - 70, w, h - 62], fill=hexc("#3E2414"))
    d.rounded_rectangle([90, h - 92, 200, h - 70], radius=6, fill=hexc("#F0EEE6"))
    d.rounded_rectangle([230, h - 90, 270, h - 72], radius=6, fill=hexc("#F2D45C"))
    return img

def night_study_bg():
    w, h = W * SS, H * SS
    img = lin_grad(w, h, (34, 38, 78), (58, 44, 70)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # window with stars and moon
    wx0, wy0, wx1, wy1 = int(w * 0.52), int(h * 0.08), int(w * 0.95), int(h * 0.4)
    d.rectangle([wx0 - 20, wy0 - 20, wx1 + 20, wy1 + 20], fill=hexc("#3B2A20"), outline=OUTLINE, width=6)
    sky = lin_grad(wx1 - wx0, wy1 - wy0, (14, 20, 54), (40, 52, 110)).convert("RGBA")
    img.alpha_composite(sky, (wx0, wy0))
    d = ImageDraw.Draw(img)
    for k in range(60):
        x, y = random.randint(wx0, wx1), random.randint(wy0, wy1)
        rr = random.choice([2, 3, 4, 5])
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(255, 250, 220, random.randint(140, 255)))
    d.ellipse([wx1 - 210, wy0 + 60, wx1 - 70, wy0 + 200], fill=hexc("#FFF4C8"))
    d.ellipse([wx1 - 175, wy0 + 45, wx1 - 40, wy0 + 180], fill=(30, 40, 90, 255))
    d.line([((wx0 + wx1) / 2, wy0), ((wx0 + wx1) / 2, wy1)], fill=hexc("#3B2A20"), width=16)
    # bookshelf left
    sx0, sx1 = int(w * 0.03), int(w * 0.45)
    d.rectangle([sx0, int(h * 0.06), sx1, int(h * 0.62)], fill=hexc("#4A2E1E"), outline=OUTLINE, width=6)
    cols = ["#B33A3A", "#3A6AB3", "#D9A441", "#3E8E5E", "#7A4AA0", "#C4683A", "#2E4E7E"]
    for r_ in range(5):
        y1 = int(h * (0.15 + r_ * 0.1))
        d.rectangle([sx0, y1, sx1, y1 + 14], fill=hexc("#2E1C12"))
        x = sx0 + 16
        while x < sx1 - 40:
            bw = random.randint(26, 52)
            bh = random.randint(110, 170)
            d.rectangle([x, y1 - bh, x + bw, y1], fill=hexc(random.choice(cols)), outline=OUTLINE, width=3)
            x += bw + 4
    # floor + desk
    d.rectangle([0, int(h * 0.68), w, h], fill=hexc("#3A2433"))
    d.rectangle([int(w * 0.55), int(h * 0.6), w, int(h * 0.64)], fill=hexc("#6A3F22"), outline=OUTLINE, width=6)
    d.rectangle([int(w * 0.6), int(h * 0.64), int(w * 0.63), int(h * 0.78)], fill=hexc("#4A2E1E"))
    d.rectangle([int(w * 0.92), int(h * 0.64), int(w * 0.95), int(h * 0.78)], fill=hexc("#4A2E1E"))
    # telescope
    d.line([(int(w * 0.68), int(h * 0.6)), (int(w * 0.62), int(h * 0.48))], fill=OUTLINE, width=10)
    d.line([(int(w * 0.68), int(h * 0.6)), (int(w * 0.74), int(h * 0.5))], fill=OUTLINE, width=10)
    d.line([(int(w * 0.6), int(h * 0.47)), (int(w * 0.86), int(h * 0.38))], fill=hexc("#C9A23A"), width=44)
    # globe
    d.ellipse([int(w * 0.8), int(h * 0.52), int(w * 0.92), int(h * 0.6)], fill=hexc("#3E7EB3"), outline=OUTLINE,
              width=5)
    # candle
    d.rectangle([int(w * 0.57), int(h * 0.55), int(w * 0.6), int(h * 0.6)], fill=hexc("#F2EAD3"), outline=OUTLINE,
                width=4)
    return img.resize((W, H), Image.LANCZOS)

BG_CLASS = classroom_bg()
BG_CLASS_BLUR = BG_CLASS.filter(ImageFilter.GaussianBlur(9))
BG_BOARD = chalkboard_bg()
BG_NIGHT = night_study_bg()

def desk(canvas, x, y, w_, h_):
    d = ImageDraw.Draw(canvas)
    d.rectangle([x - w_ / 2, y, x + w_ / 2, y + h_ * 0.22], fill=hexc("#A86F3D"), outline=OUTLINE, width=3)
    d.rectangle([x - w_ / 2 + 6, y + h_ * 0.22, x + w_ / 2 - 6, y + h_], fill=hexc("#7E4D29"), outline=OUTLINE,
                width=3)
    d.line([(x - w_ / 2 + 12, y + h_ * 0.6), (x + w_ / 2 - 12, y + h_ * 0.6)], fill=hexc("#5C371F"), width=3)

def lectern(canvas, x, y, scale=1.0):
    d = ImageDraw.Draw(canvas)
    w0, w1, hh = 230 * scale, 190 * scale, 300 * scale
    d.polygon([(x - w0 / 2, y), (x + w0 / 2, y), (x + w1 / 2, y + hh), (x - w1 / 2, y + hh)], fill=hexc("#7E4D29"),
              outline=OUTLINE, width=4)
    d.rectangle([x - w0 / 2 - 14 * scale, y - 18 * scale, x + w0 / 2 + 14 * scale, y + 6 * scale],
                fill=hexc("#A86F3D"), outline=OUTLINE, width=4)
    d.rectangle([x - w1 / 2 + 22 * scale, y + 50 * scale, x + w1 / 2 - 22 * scale, y + hh - 40 * scale],
                outline=hexc("#5C371F"), width=4)
    # bell
    bx = x + w0 / 2 - 40 * scale
    d.pieslice([bx - 26 * scale, y - 60 * scale, bx + 26 * scale, y - 8 * scale], 180, 360, fill=hexc("#D8A93A"),
               outline=OUTLINE, width=3)
    d.rectangle([bx - 28 * scale, y - 36 * scale, bx + 28 * scale, y - 18 * scale], fill=hexc("#D8A93A"),
                outline=OUTLINE, width=3)
    d.ellipse([bx - 7 * scale, y - 72 * scale, bx + 7 * scale, y - 58 * scale], fill=OUTLINE)

def dust(canvas, t, n=40, color=(255, 230, 170)):
    d = ImageDraw.Draw(canvas)
    rs = random.Random(5)
    for k in range(n):
        x0, y0 = rs.uniform(0, W), rs.uniform(0, H * 0.8)
        sp = rs.uniform(6, 18)
        x = (x0 + math.sin(t * 0.6 + k) * 20 + t * sp) % W
        y = (y0 + t * sp * 0.6) % (H * 0.8)
        r = rs.uniform(1.2, 2.8)
        d.ellipse([x - r, y - r, x + r, y + r], fill=color + (rs.randint(70, 160),))

def blink_at(t, seed=0):
    p = (t + seed * 1.37) % 3.1
    return p < 0.12

def glow(canvas, x, y, rad, col=(255, 220, 120), alpha=150):
    g = Image.new("RGBA", (int(rad * 2), int(rad * 2)), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    gd.ellipse([rad * 0.4, rad * 0.4, rad * 1.6, rad * 1.6], fill=col + (alpha,))
    g = g.filter(ImageFilter.GaussianBlur(rad / 5))
    canvas.alpha_composite(g, (int(x - rad), int(y - rad)))

def text_c(canvas, xy, txt, f, fill, stroke=0, stroke_fill=(0, 0, 0), alpha=255, anchor="mm"):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text(xy, txt, font=f, fill=fill[:3] + (255,), anchor=anchor, stroke_width=stroke,
                               stroke_fill=stroke_fill)
    if alpha < 255:
        a = layer.getchannel("A").point(lambda v: v * alpha // 255)
        layer.putalpha(a)
    canvas.alpha_composite(layer)

# ---------------------------------------------------------------- scenes
def zoom(img, s, cx=0.5, cy=0.5):
    s = max(1.0, s)
    if abs(s - 1) < 1e-3:
        return img
    w, h = img.size
    nw, nh = w / s, h / s
    x0 = (w - nw) * cx
    y0 = (h - nh) * cy
    return img.resize((w, h), Image.BILINEAR, box=(x0, y0, x0 + nw, y0 + nh))

def scene_teacher(t, dur, b):
    c = BG_CLASS.copy()
    dust(c, t)
    tex = "grumpy"
    spr = sprite(R=95, body="#3A3F55", hair="grey_sides", hair_color="#C9C5BE", expr=tex, beard=True, glasses=True,
                 blink=blink_at(t), look=(0.4, 0.2))
    place(c, spr, 460, 1000)
    lectern(c, 470, 820, 1.0)
    # kids silhouettes from behind in front
    for i, (x, col, hcol) in enumerate([(120, "#4D7FBF", "#2B1B12"), (330, "#C04848", "#8A5A2B"),
                                        (560, "#5E9E5E", "#1E1A22")]):
        sp = sprite(R=80, body=col, hair="bowl", hair_color=hcol, expr="neutral", legs=False)
        # back view: cover face by hair (draw hair-coloured ellipse)
        back = sp.copy()
        bd = ImageDraw.Draw(back)
        cx, hy, r = back.width / 2, 80 * 1.35, 80
        bd.ellipse([cx - r, hy - r, cx + r, hy + r], fill=hexc(hcol), outline=OUTLINE, width=3)
        place(c, back, x, 1420 + i % 2 * 30)
    if b["si"] == 1:
        # teacher points at the board sum
        prog = ease((t - b["seg_t0"]) / 1.2)
        d = ImageDraw.Draw(c)
        f = font(F_CHALK, 54)
        text_c(c, (220, 395), "1 + 2 + ... + 100", f, (255, 240, 120), alpha=int(255 * prog))
    s = 1.0 + 0.07 * ease(t / dur)
    return zoom(c, s, 0.6, 0.45)

def scene_kids(t, dur, b, calc=False):
    c = BG_CLASS.copy()
    dust(c, t)
    rows = [  # y_desk, scale, xs
        (720, 0.62, [150, 360, 570]),
        (900, 0.8, [110, 360, 610]),
        (1130, 1.05, [130, 590]),
    ]
    palette = [("#4D7FBF", "#2B1B12", "bowl"), ("#C04848", "#8A5A2B", "messy"), ("#5E9E5E", "#1E1A22", "pony"),
               ("#8E5EB0", "#5B3A1E", "bowl"), ("#D08A2A", "#2B1B12", "pony"), ("#3E9A9A", "#8A5A2B", "bowl"),
               ("#B04870", "#1E1A22", "messy"), ("#6A7A3A", "#5B3A1E", "bowl")]
    k = 0
    for (yd, sc, xs) in rows:
        for x in xs:
            body, hc, hs = palette[k % len(palette)]
            k += 1
            bob = math.sin(t * 7 + k) * 3
            spr = sprite(R=70, body=body, hair=hs, hair_color=hc, expr="stress", sweat=(k % 2 == 0), legs=False,
                         blink=blink_at(t, k), look=(0, 0.8))
            place(c, spr, x, yd + 40 * sc + bob, sc * 1.0)
            desk(c, x, yd, 230 * sc, 120 * sc)
            # slate on desk
            d = ImageDraw.Draw(c)
            d.polygon([(x - 50 * sc, yd + 4), (x + 50 * sc, yd + 4), (x + 40 * sc, yd - 14 * sc),
                       (x - 40 * sc, yd - 14 * sc)], fill=hexc("#2B3330"), outline=OUTLINE)
    # number ticker panel (like a chalk list) at top
    tl = t - b["block_t0"]
    if not calc:
        seq = ["1", "+ 2", "+ 3", "+ 4", "+ 5", "+ 6", "+ 7", "+ 8", "+ 9", "+ 10", "+ 11", "+ 12"]
        n = min(len(seq), int(tl / 0.32) + 1)
        panel = Image.new("RGBA", (W, 300), (0, 0, 0, 0))
        pd = ImageDraw.Draw(panel)
        pd.rounded_rectangle([30, 20, W - 30, 280], radius=26, fill=(25, 30, 36, 215))
        f = font(F_CHALK, 54)
        x, y = 60, 50
        for i in range(n):
            tw = pd.textlength(seq[i] + " ", font=f)
            if x + tw > W - 60:
                x, y = 60, y + 70
            pd.text((x, y), seq[i], font=f, fill=(255, 225, 120) if i == n - 1 else (240, 240, 235))
            x += tw
        c.alpha_composite(panel, (0, 70))
    else:
        # calculator with red cross
        p = back_out(tl / 0.45)
        cal = Image.new("RGBA", (300, 420), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cal)
        cd.rounded_rectangle([10, 10, 290, 410], radius=34, fill=hexc("#454C5A"), outline=OUTLINE, width=8)
        cd.rounded_rectangle([40, 40, 260, 130], radius=12, fill=hexc("#B9D8A8"), outline=OUTLINE, width=5)
        cd.text((245, 85), "5050?", font=font(F_CHALK, 50), fill=hexc("#2B3330"), anchor="rm")
        for r_ in range(4):
            for c_ in range(3):
                x0, y0 = 45 + c_ * 72, 155 + r_ * 62
                cd.rounded_rectangle([x0, y0, x0 + 58, y0 + 48], radius=10,
                                     fill=hexc("#F08A24") if c_ == 2 else hexc("#D9DCE3"), outline=OUTLINE, width=3)
        sc = max(0.01, p)
        cal = cal.resize((int(300 * sc), int(420 * sc)), Image.BILINEAR)
        c.alpha_composite(cal, (int(W / 2 - cal.width / 2), int(380 - cal.height / 2)))
        q = ease((tl - 0.35) / 0.3)
        if q > 0:
            d = ImageDraw.Draw(c)
            L = 190 * q
            d.line([(W / 2 - 190, 380 - 230), (W / 2 - 190 + 2 * L, 380 - 230 + 2.4 * L)], fill=hexc("#E53935"),
                   width=34)
            if q > 0.5:
                q2 = (q - 0.5) * 2
                d.line([(W / 2 + 190, 380 - 230), (W / 2 + 190 - 380 * q2, 380 - 230 + 456 * q2)],
                       fill=hexc("#E53935"), width=34)
    s = 1.04 + 0.05 * ease(tl / max(dur, 0.1))
    return zoom(c, s, 0.5, 0.5)

def scene_walk(t, dur, b):
    c = BG_CLASS.copy()
    dust(c, t)
    tl = t - b["block_t0"]
    # kids in back row watching
    for i, (x, body, hc) in enumerate([(90, "#4D7FBF", "#2B1B12"), (250, "#C04848", "#8A5A2B")]):
        lk = (1, 0) if tl > 1.5 else (0, 0.8)
        spr = sprite(R=60, body=body, hair="bowl", hair_color=hc, expr="shock" if tl > 2.2 else "stress",
                     legs=False, look=lk)
        place(c, spr, x, 900)
        desk(c, x, 860, 190, 110)
    # teacher behind lectern on the right
    spr = sprite(R=80, body="#3A3F55", hair="grey_sides", hair_color="#C9C5BE", expr="grumpy", beard=True,
                 glasses=True, blink=blink_at(t), look=(-0.8, 0.3))
    place(c, spr, 560, 980)
    lectern(c, 560, 830, 0.85)
    # Gauss walks from left to lectern
    p = ease(tl / (dur * 0.75))
    gx = -80 + (470 - -80) * p
    walking = 0.02 < p < 0.98
    bob = abs(math.sin(tl * 9)) * 14 if walking else 0
    g = sprite(R=78, body="#F08A24", hair="messy", hair_color="#6B3E22", expr="smirk",
               arm="slate" if p < 0.98 else "down", look=(1, 0), blink=blink_at(t, 3))
    place(c, g, gx, 1230 - bob)
    if p >= 0.98:
        # slate placed on lectern
        d = ImageDraw.Draw(c)
        d.polygon([(500, 818), (620, 818), (606, 800), (514, 800)], fill=hexc("#2B3330"), outline=OUTLINE)
    s = 1.0 + 0.06 * ease(tl / dur)
    return zoom(c, s, 0.55, 0.6)

def scene_gauss_close(t, dur, b):
    tl = t - b["block_t0"]
    c = zoom(BG_CLASS_BLUR, 1.5, 0.3, 0.5).copy()
    glow(c, W / 2, 560, 330, (255, 200, 120), 110)
    g = sprite(R=200, body="#F08A24", hair="messy", hair_color="#6B3E22", expr="smirk", blink=blink_at(t, 2),
               look=(0.5, 0))
    place(c, g, W / 2, 1420 + math.sin(tl * 2) * 6)
    # name tag
    p = back_out((tl - 0.6) / 0.5)
    if p > 0:
        f = font(F_BLACK, int(52 * max(p, 0.01)))
        text_c(c, (W / 2, 190), "КАРЛ ГАУСС", f, (255, 214, 90), stroke=6, stroke_fill=(40, 20, 10))
    p2 = back_out((tl - 2.0) / 0.5)
    if p2 > 0:
        f = font(F_BLACK, int(40 * max(p2, 0.01)))
        text_c(c, (W / 2, 255), "9 ЛЕТ", f, (255, 255, 255), stroke=5, stroke_fill=(40, 20, 10))
    return zoom(c, 1.0 + 0.05 * ease(tl / dur))

def scene_shock(t, dur, b):
    tl = t - b["block_t0"]
    seg0 = b["segs"][0]
    reveal = seg0["dur"] * 0.45  # "...а потом увидел ответ"
    shocked = tl > reveal
    c = zoom(BG_CLASS_BLUR, 1.4, 0.7, 0.45).copy()
    glow(c, W / 2, 600, 360, (255, 210, 140) if not shocked else (255, 240, 200), 120)
    lift = 0.0 if not shocked else min(1.0, (tl - reveal) / 0.25) * 0.35
    spr = sprite(R=190, body="#3A3F55", hair="grey_sides", hair_color="#C9C5BE",
                 expr="smirk" if not shocked else "shock", beard=True, glasses=True, arm="slate",
                 slate_text="5050", blink=(blink_at(t) and not shocked), look=(0, 0.9), lift=round(lift, 2))
    shake = (random.uniform(-6, 6), random.uniform(-6, 6)) if shocked and tl - reveal < 0.35 else (0, 0)
    place(c, spr, W / 2 + shake[0], 1520 + shake[1])
    if shocked:
        q = ease((tl - reveal) / 0.3)
        d = ImageDraw.Draw(c)
        for k in range(12):  # shock lines
            a = k / 12 * 2 * math.pi
            r0, r1 = 300, 300 + 70 * q
            d.line([(W / 2 + math.cos(a) * r0, 520 + math.sin(a) * r0),
                    (W / 2 + math.cos(a) * r1, 520 + math.sin(a) * r1)], fill=(255, 255, 255, 200), width=6)
    if len(b["segs"]) > 1 and tl > b["segs"][1]["start"] - b["block_t0"]:
        q = back_out((tl - (b["segs"][1]["start"] - b["block_t0"])) / 0.4)
        f = font(F_BLACK, int(150 * max(q, 0.01)))
        text_c(c, (W / 2 + 200, 230), "✓", font(F_CAP, 10), (0, 0, 0), alpha=0)
        d = ImageDraw.Draw(c)
        cx, cy, rr = 590, 220, 70 * max(q, 0.01)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=hexc("#3BB54A"), outline=OUTLINE, width=5)
        d.line([(cx - rr * 0.45, cy), (cx - rr * 0.1, cy + rr * 0.38), (cx + rr * 0.5, cy - rr * 0.4)],
               fill=(255, 255, 255, 255), width=int(max(2, rr * 0.18)), joint="curve")
    zs = 1.0 + 0.03 * ease(tl / dur) + (0.08 * (1 - ease((tl - reveal) / 0.35)) if shocked else 0)
    return zoom(c, zs, 0.5, 0.45)

def scene_idea(t, dur, b):
    tl = t - b["block_t0"]
    c = zoom(BG_CLASS_BLUR, 1.3, 0.2, 0.6).copy()
    ov = Image.new("RGBA", (W, H), (20, 14, 30, 110))
    c.alpha_composite(ov)
    # floating numbers
    rs = random.Random(9)
    for k in range(26):
        n = rs.randint(1, 100)
        x0, y0 = rs.uniform(30, W - 30), rs.uniform(80, H * 0.7)
        y = (y0 - tl * rs.uniform(15, 40)) % (H * 0.75)
        text_c(c, (x0, y), str(n), font(F_CHALK, rs.randint(30, 60)), (255, 230, 160), alpha=rs.randint(60, 140))
    g = sprite(R=170, body="#F08A24", hair="messy", hair_color="#6B3E22", expr="smirk", arm="chin",
               blink=blink_at(t, 1), look=(0.6, -0.7))
    place(c, g, W / 2 - 20, 1500)
    desk(c, W / 2, 1180, 640, 200)
    # bulb
    p = back_out((tl - 0.3) / 0.5)
    if p > 0:
        bx, by = W / 2 + 10, 260
        glow(c, bx, by, 200 * p, (255, 230, 120), 170)
        d = ImageDraw.Draw(c)
        rr = 70 * p
        d.ellipse([bx - rr, by - rr, bx + rr, by + rr], fill=hexc("#FFE680"), outline=OUTLINE, width=5)
        d.rectangle([bx - rr * 0.45, by + rr * 0.8, bx + rr * 0.45, by + rr * 1.35], fill=hexc("#9AA0A8"),
                    outline=OUTLINE, width=4)
        for k in range(8):
            a = k / 8 * 2 * math.pi + tl
            d.line([(bx + math.cos(a) * rr * 1.3, by + math.sin(a) * rr * 1.3),
                    (bx + math.cos(a) * rr * 1.7, by + math.sin(a) * rr * 1.7)], fill=hexc("#FFE680"), width=6)
    return zoom(c, 1.0 + 0.06 * ease(tl / dur))

# ---- chalkboard math
ROW_Y = 400
ROW_ITEMS = ["1", "2", "3", "4", "...", "97", "98", "99", "100"]
ROW_X = [60 + i * 75 for i in range(len(ROW_ITEMS))]
PAIRS = [(0, 8, (255, 214, 90)), (1, 7, (120, 220, 255)), (2, 6, (255, 140, 170)), (3, 5, (170, 240, 140))]

def chalk_arc(d, x0, x1, y, hgt, prog, col, width=6):
    n = 40
    m = max(2, int(n * prog))
    pts = []
    for k in range(m):
        u = k / (n - 1)
        x = x0 + (x1 - x0) * u
        yy = y - math.sin(math.pi * u) * hgt
        pts.append((x, yy))
    if len(pts) > 1:
        d.line(pts, fill=col + (255,), width=width, joint="curve")

def scene_board(t, dur, b):
    tl = t - b["block_t0"]
    c = BG_BOARD.copy()
    d = ImageDraw.Draw(c)
    # which sub-step: index in block segments by time
    seg_idx = 0
    for k, sg in enumerate(b["segs"]):
        if t >= sg["start"] - 0.1:
            seg_idx = k
    step = b["segs"][seg_idx]["scene"]
    st = t - b["segs"][seg_idx]["start"]
    order = ["board1", "board2", "board3", "board_all", "board_half", "board_mult"]
    si = order.index(step)
    # title
    text_c(c, (W / 2, 105), "1 + 2 + 3 + ... + 100", font(F_CHALK, 58), (240, 240, 232))
    # number row
    fr = font(F_CHALK, 46)
    for i, (it, x) in enumerate(zip(ROW_ITEMS, ROW_X)):
        col = (240, 240, 232)
        for (a, bb, pc) in PAIRS[:min(si + 1, 3) if si < 3 else 4]:
            if i in (a, bb):
                col = pc
        text_c(c, (x, ROW_Y), it, fr, col)
    # arcs
    npairs = 1 + min(si, 2) if si < 3 else 4
    for k in range(npairs):
        a, bb, pc = PAIRS[k]
        prog = 1.0
        if k == si and si < 3:
            prog = ease(st / 0.7)
        if si >= 3 and k == 3:
            prog = ease(st / 0.6) if si == 3 else 1.0
        chalk_arc(d, ROW_X[a], ROW_X[bb], ROW_Y - 40, 60 + (3 - k) * 38, prog, pc)
        if prog > 0.95:
            text_c(c, ((ROW_X[a] + ROW_X[bb]) / 2, ROW_Y - 40 - (60 + (3 - k) * 38) - 22), "101", font(F_CHALK, 30),
                   pc)
    # main equation area
    big = font(F_CHALK, 110)
    def write(txt, y, prog, col=(245, 245, 238), f=big):
        n = int(len(txt) * prog + 0.999)
        if n <= 0:
            return
        f_w = ImageDraw.Draw(c).textlength(txt, font=f)
        x0 = W / 2 - f_w / 2
        text_c(c, (x0, y), txt[:n], f, col, anchor="lm")
    if si <= 2:
        a, bb, pc = PAIRS[si]
        eq = f"{ROW_ITEMS[a]} + {ROW_ITEMS[bb]} = 101"
        write(eq, 640, ease(st / 0.9), pc)
        # previous equations small
        for k in range(si):
            a2, b2, pc2 = PAIRS[k]
            text_c(c, (W / 2, 820 + k * 80), f"{ROW_ITEMS[a2]} + {ROW_ITEMS[b2]} = 101", font(F_CHALK, 60), pc2,
                   alpha=200)
    elif si == 3:
        write("пара = 101", 640, ease(st / 0.8), (255, 214, 90), font(F_CAP, 96))
        for k in range(3):
            a2, b2, pc2 = PAIRS[k]
            text_c(c, (W / 2, 820 + k * 80), f"{ROW_ITEMS[a2]} + {ROW_ITEMS[b2]} = 101", font(F_CHALK, 60), pc2,
                   alpha=170)
    elif si == 4:
        write("100 / 2 = 50", 600, ease(st / 1.0))
        q = ease((st - 1.4) / 0.6)
        if q > 0:
            text_c(c, (W / 2, 760), "50 пар", font(F_CAP, 74), (120, 220, 255), alpha=int(255 * q))
    else:
        write("50 × 101 =", 560, ease(st / 0.9))
        p = back_out((st - 2.0) / 0.5)
        if p > 0:
            glow(c, W / 2, 760, 230, (255, 220, 120), 110)
            text_c(c, (W / 2, 760), "5050", font(F_CHALK, int(190 * max(p, 0.05))), (255, 214, 90))
    zs = 1.02 + 0.02 * math.sin(tl * 0.5)
    return zoom(c, zs)

def scene_formula(t, dur, b):
    tl = t - b["block_t0"]
    c = BG_BOARD.copy()
    d = ImageDraw.Draw(c)
    p = ease(tl / 0.9)
    text_c(c, (W / 2, 260), "1 + 2 + 3 + ... + n", font(F_CHALK, 74), (240, 240, 232), alpha=int(255 * p))
    q = ease((tl - 0.8) / 0.8)
    if q > 0:
        a = int(255 * q)
        text_c(c, (190, 470), "=", font(F_CHALK, 110), (240, 240, 232), alpha=a)
        text_c(c, (420, 400), "n · (n + 1)", font(F_CHALK, 84), (255, 214, 90), alpha=a)
        d.line([(250, 470), (590, 470)], fill=(240, 240, 232, a), width=7)
        text_c(c, (420, 545), "2", font(F_CHALK, 84), (120, 220, 255), alpha=a)
    r_ = ease((tl - 2.2) / 0.6)
    if r_ > 0:
        d.rounded_rectangle([60, 150, W - 60, 620], radius=30, outline=(255, 214, 90, int(255 * r_)), width=6)
    g = sprite(R=120, body="#F08A24", hair="messy", hair_color="#6B3E22", expr="smile", arm="up",
               blink=blink_at(t, 4), look=(-0.6, -0.6))
    place(c, g, W - 200, H - 70 + math.sin(tl * 3) * 4)
    return zoom(c, 1.0 + 0.04 * ease(tl / dur))

def scene_king(t, dur, b):
    tl = t - b["block_t0"]
    c = BG_NIGHT.copy()
    fl = 0.85 + 0.15 * math.sin(tl * 13) * math.sin(tl * 7.3)
    glow(c, int(W * 0.585), int(H * 0.53), 170 * fl, (255, 190, 90), 140)
    d = ImageDraw.Draw(c)
    fx, fy = W * 0.585, H * 0.535
    d.ellipse([fx - 9, fy - 26 * fl, fx + 9, fy + 4], fill=hexc("#FFD45A"))
    g = sprite(R=150, body="#2E2A3A", hair="grey_sides", hair_color="#E6E3DC", expr="smile", cap=True,
               crown=True, blink=blink_at(t, 5), look=(0.2, -0.2))
    place(c, g, W * 0.4, 1270 + math.sin(tl * 1.5) * 4)
    # sparkles around crown
    rs = random.Random(int(tl * 6))
    for k in range(7):
        a = k / 7 * 2 * math.pi + tl
        x = W * 0.4 + math.cos(a) * 170
        y = 470 + math.sin(a) * 70
        s = 10 + 8 * abs(math.sin(tl * 4 + k))
        d.polygon([(x, y - s), (x + s * 0.3, y), (x, y + s), (x - s * 0.3, y)], fill=(255, 236, 140, 230))
        d.polygon([(x - s, y), (x, y + s * 0.3), (x + s, y), (x, y - s * 0.3)], fill=(255, 236, 140, 230))
    p = back_out((tl - 1.2) / 0.6)
    if p > 0:
        text_c(c, (W / 2, 150), "КОРОЛЬ", font(F_BLACK, int(84 * max(p, 0.01))), (255, 214, 90), stroke=7,
               stroke_fill=(40, 20, 10))
        text_c(c, (W / 2, 240), "МАТЕМАТИКОВ", font(F_BLACK, int(60 * max(p, 0.01))), (255, 255, 255), stroke=6,
               stroke_fill=(40, 20, 10))
    return zoom(c, 1.0 + 0.07 * ease(tl / dur), 0.4, 0.4)

SCENES = {"teacher": scene_teacher, "kids": scene_kids, "kids_calc": lambda t, d, b: scene_kids(t, d, b, True),
          "walk": scene_walk, "gauss_close": scene_gauss_close, "shock": scene_shock, "idea": scene_idea,
          "board": scene_board, "formula": scene_formula, "king": scene_king}

# ---------------------------------------------------------------- captions
CAP_Y = {"shock": 0.84, "walk": 0.62, "board": 0.875}
SCENE_NOW = [""]

def caption(canvas, t):
    cur = None
    for (s, e, w) in words:
        if s <= t < e:
            cur = (s, e, w)
            break
    if not cur:
        return
    s, e, w = cur
    w = w.rstrip(",:.!?")
    p = (t - s) / 0.12
    sc = 1.0 + 0.18 * (1 - ease(p))
    size = int(66 * sc)
    f = font(F_CAP, size)
    y = H * CAP_Y.get(SCENE_NOW[0], 0.70)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.text((W / 2 + 3, y + 5), w, font=f, fill=(0, 0, 0, 140), anchor="mm", stroke_width=7, stroke_fill=(0, 0, 0, 140))
    layer = layer.filter(ImageFilter.GaussianBlur(4))
    ld = ImageDraw.Draw(layer)
    ld.text((W / 2, y), w, font=f, fill=(255, 255, 255, 255), anchor="mm", stroke_width=6,
            stroke_fill=(20, 16, 14, 255))
    canvas.alpha_composite(layer)

# ---------------------------------------------------------------- audio mix
def build_audio():
    n = int(TOTAL * SR)
    vo = np.zeros(n, np.float32)
    for seg in timeline:
        a = seg["audio"]
        st = int(seg["start"] * SR)
        vo[st:st + len(a)] += a[: max(0, n - st)]
    vo *= 0.95 / max(1e-6, np.abs(vo).max())
    tt = np.arange(n) / SR
    # soft music-box bed: arpeggios over I-vi-IV-V in C
    music = np.zeros(n, np.float32)
    chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
    step = 0.25
    k = 0
    tpos = 0.0
    while tpos < TOTAL:
        ch = chords[int(tpos / 2.0) % 4]
        note = ch[k % 4] + (12 if (k // 4) % 2 else 0)
        f0 = 440 * 2 ** ((note - 69) / 12)
        L = int(1.2 * SR)
        i0 = int(tpos * SR)
        seg_t = np.arange(min(L, n - i0)) / SR
        env = np.exp(-seg_t * 4.5) * np.minimum(1, seg_t * 200)
        tone = (np.sin(2 * np.pi * f0 * seg_t) + 0.25 * np.sin(4 * np.pi * f0 * seg_t)) * env
        music[i0:i0 + len(tone)] += tone.astype(np.float32)
        k += 1
        tpos += step
    # bass
    for bi in range(int(TOTAL / 2.0) + 1):
        root = chords[bi % 4][0] - 24
        f0 = 440 * 2 ** ((root - 69) / 12)
        i0 = int(bi * 2.0 * SR)
        L = min(int(2.0 * SR), n - i0)
        if L <= 0:
            break
        st_ = np.arange(L) / SR
        music[i0:i0 + L] += (np.sin(2 * np.pi * f0 * st_) * np.exp(-st_ * 1.2) * 0.8).astype(np.float32)
    music *= 0.10 / max(1e-6, np.abs(music).max())
    # ducking under voice
    envv = np.convolve(np.abs(vo), np.ones(2205) / 2205, mode="same")
    duck = 1 - 0.45 * np.clip(envv / 0.05, 0, 1)
    music *= duck
    # whooshes at scene cuts + dings
    fx = np.zeros(n, np.float32)
    rs = np.random.RandomState(1)
    for bl in blocks[1:]:
        i0 = int(max(0, bl["start"] - 0.15) * SR)
        L = int(0.35 * SR)
        noise = rs.randn(L).astype(np.float32)
        noise = np.convolve(noise, np.ones(12) / 12, mode="same")
        env = np.sin(np.linspace(0, np.pi, L)) ** 2
        fx[i0:i0 + L] += (noise * env * 0.25)[: max(0, n - i0)]
    def ding(tsec, f0=1318.5, amp=0.25):
        i0 = int(tsec * SR)
        L = int(1.0 * SR)
        st_ = np.arange(L) / SR
        tone = (np.sin(2 * np.pi * f0 * st_) + 0.5 * np.sin(2 * np.pi * f0 * 2.01 * st_)) * np.exp(-st_ * 5) * amp
        fx[i0:i0 + L] += tone[: max(0, n - i0)].astype(np.float32)
    for seg in timeline:
        if seg["scene"] == "shock" and "5050" in seg["cap"]:
            ding(seg["start"] + seg["dur"] * 0.45)
        if seg["scene"] == "board_mult":
            ding(seg["start"] + 2.0, 1567.98)
        if seg["scene"] in ("board1", "board2", "board3"):
            ding(seg["start"] + 0.8, 1046.5, 0.12)
        if seg["scene"] == "idea":
            ding(seg["start"] + 0.3, 1760, 0.15)
    mix = vo + music + fx
    mix = np.tanh(mix * 1.1) * 0.92
    pcm = (mix * 32767).astype(np.int16)
    with wave.open(f"{OUT}/mix.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

# ---------------------------------------------------------------- render
def render(preview_times=None):
    def frame_at(t):
        b = blocks[0]
        for bl in blocks:
            if bl["start"] <= t:
                b = bl
        b["block_t0"] = b["start"]
        si = 0
        for k, sg in enumerate(b["segs"]):
            if t >= sg["start"] - 0.1:
                si = k
        b["si"] = si
        b["seg_t0"] = b["segs"][si]["start"]
        SCENE_NOW[0] = b["key"]
        img = SCENES[b["key"]](t, b["end"] - b["start"], b)
        img = img.convert("RGBA")
        # cut punch: brief white flash fade at scene start
        dt = t - b["start"]
        if 0 <= dt < 0.12 and b is not blocks[0]:
            fl = Image.new("RGBA", (W, H), (255, 245, 230, int(120 * (1 - dt / 0.12))))
            img.alpha_composite(fl)
        caption(img, t)
        arr = np.asarray(img.convert("RGB"), np.float32)
        arr = arr * VIG[..., None]
        arr += GRAIN[int(t * FPS) % len(GRAIN)]
        if t < 0.4:
            arr *= t / 0.4
        if t > TOTAL - 0.6:
            arr *= max(0, (TOTAL - t) / 0.6)
        return arr.clip(0, 255).astype(np.uint8)

    if preview_times:
        for tp in preview_times:
            Image.fromarray(frame_at(tp)).save(f"{OUT}/prev_{tp:05.1f}.png")
        return
    build_audio()
    nf = int(TOTAL * FPS)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-i", f"{OUT}/mix.wav", "-c:v", "libx264", "-preset", "medium",
                          "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest",
                          "-movflags", "+faststart", f"{OUT}/gauss_short.mp4"], stdin=subprocess.PIPE)
    for fi in range(nf):
        p.stdin.write(frame_at(fi / FPS).tobytes())
        if fi % 150 == 0:
            print("frame", fi, "/", nf, flush=True)
    p.stdin.close()
    p.wait()

if __name__ == "__main__":
    if os.environ.get("PREVIEW"):
        ts = []
        for bl in blocks:
            ts.append(round(bl["start"] + (bl["end"] - bl["start"]) * 0.7, 1))
        render(ts)
        print("blocks:", [(bl["key"], round(bl["start"], 1)) for bl in blocks])
    else:
        render()
