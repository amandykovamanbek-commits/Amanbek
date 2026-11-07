#!/usr/bin/env python3
# Renders the "Ера лох" scream-escalation video frames and pipes them to ffmpeg.
import math, random, sys, subprocess
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 720, 1280
S = 2                      # supersampling
FPS = 30
FONT_DIR = "/usr/share/fonts/opentype/inter/"
_fc = {}
def font(name, size):
    k = (name, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FONT_DIR + name, int(size * S))
    return _fc[k]

def P(v): return int(round(v * S))
def pts(lst): return [(P(x), P(y)) for x, y in lst]
def lerp(a, b, t): return a + (b - a) * t
def clamp(t, a=0.0, b=1.0): return max(a, min(b, t))
def ease(t): t = clamp(t); return 1 - (1 - t) ** 3
def mix(c1, c2, t): return tuple(int(lerp(a, b, clamp(t))) for a, b in zip(c1, c2))

# ---------------------------------------------------------------- scenes
SC = [
    dict(db=70,  label="ОБЫЧНЫЙ РАЗГОВОР", cap="Ера стоит в 20 метрах. Он не оборачивается.", kind="street", lvl=0.0,
         walker=dict(text="А кто такой Ера вообще?", color=(52, 120, 200))),
    dict(db=80,  label="ГРОМКИЙ ОКЛИК", cap="Ера листает ленту.", kind="street", lvl=0.1),
    dict(db=90,  label="ГАЗОНОКОСИЛКА", cap="Голуби разлетелись. Ера — нет.", kind="street", lvl=0.2, pigeons=True),
    dict(db=110, label="РОК-КОНЦЕРТ", cap="Бабушка из окна ругается. Ера не оборачивается.", kind="street", lvl=0.35,
         grandma="Молодой человек, ну потише! Люди спят!"),
    dict(db=150, label="РАЗРЫВ ПЕРЕПОНОК", cap="Прохожие затыкают уши.", kind="street", lvl=0.5,
         walker=dict(text="Да поняли мы, поняли!", color=(214, 80, 140), ears=True)),
    dict(db=180, label="СТАРТ КОСМИЧЕСКОЙ РАКЕТЫ", cap="Асфальт трескается. Ера дочитывает сообщение.", kind="street", lvl=0.7, cracks=True),
    dict(db=200, label="ПРЕДЕЛ ПРОЙДЕН", cap="Это уже не звук. Это ударная волна.", kind="street", lvl=0.85, cracks=True, wave=True,
         walker=dict(text="Полностью согласен!", color=(240, 170, 40))),
    dict(db=220, label="ИЗВЕРЖЕНИЕ ВУЛКАНА", cap="Весь город узнал, что Ера лох.", kind="map", lvl=0.9),
    dict(db=250, label="КАК КРАКАТАУ, 1883", cap="Слышно на другом конце Земли.", kind="earth", lvl=0.93, mode=0),
    dict(db=290, label="ЗА ПРЕДЕЛАМИ ШКАЛЫ", cap="Интернет падает во всём мире.", kind="earth", lvl=0.96, mode=1),
    dict(db=340, label="ВЗРЫВ ЗВЕЗДЫ", cap="Гравитация еле держит Землю целой.", kind="earth", lvl=1.0, mode=2),
    dict(db=0,   label="ЗВУК НЕ ЛЕТИТ В КОСМОСЕ", cap="В космосе твоё «Ера лох» никто не услышит.", kind="space", lvl=1.0),
]
D = 3.6
DUR_SPACE = 8.4
starts = []
t0 = 0.0
for i, s in enumerate(SC):
    s["n"] = i + 1
    s["dur"] = DUR_SPACE if s["kind"] == "space" else D
    starts.append(t0); s["t0"] = t0
    t0 += s["dur"]
TOTAL = t0
SHOUT_AT = 0.25           # shout time inside each scene
TALK_AT = 1.55            # passerby line time inside scene
CALL_AT = 3.2             # phone popup in space scene
ANSWER_AT = 4.7
YERA_AT = 4.9

# ---------------------------------------------------------------- street projection
VPX, VPY, F = 470.0, 560.0, 400.0
def proj(X, y, d):
    return (VPX + F * X / d, VPY + F * (1.0 - y) / d)

rng = random.Random(7)
BUILD_COLS = [(214, 92, 58), (232, 196, 140), (190, 60, 50), (240, 222, 190), (222, 128, 70), (176, 84, 66)]
AWN = [(220, 50, 50), (40, 140, 90), (240, 190, 40), (40, 90, 190)]
buildings = []
d = 0.6
while d < 40:
    w = rng.uniform(1.6, 3.2); h = rng.uniform(2.8, 5.2)
    buildings.append((d, d + w, h, rng.choice(BUILD_COLS), rng.choice(AWN)))
    d += w
far_sky = [(rng.uniform(560, 720), rng.uniform(470, 545), rng.uniform(18, 40)) for _ in range(9)]
clouds = [(420, 330, 52), (480, 300, 44), (530, 335, 46), (300, 420, 26), (620, 250, 30)]

def sky_cols(lvl):
    top = mix((96, 120, 190), (60, 20, 40), clamp((lvl - 0.3) / 0.6))
    bot = mix((190, 200, 225), (240, 120, 60), clamp((lvl - 0.25) / 0.5))
    return top, bot

def draw_street_bg(dr, lvl):
    top, bot = sky_cols(lvl)
    for y in range(0, P(620), 4):
        dr.rectangle([0, y, P(W), y + 4], fill=mix(top, bot, y / P(620)))
    for x, y, r in clouds:
        dr.ellipse([P(x - r), P(y - r), P(x + r), P(y + r)], fill=mix((240, 244, 252), (255, 200, 170), lvl))
    # far skyline to the right
    for x, y, h in far_sky:
        dr.rectangle([P(x), P(y), P(x + 30), P(560)], fill=mix((170, 170, 180), (150, 110, 110), lvl))
    # ground: sidewalk, road
    dr.rectangle([0, P(VPY), P(W), P(H)], fill=(205, 205, 210))
    road = [proj(0.35, 0, 0.5), proj(0.35, 0, 200), proj(4.0, 0, 200), proj(4.0, 0, 0.5)]
    dr.polygon(pts(road), fill=(105, 107, 115))
    dr.polygon(pts([proj(4.0, 0, 0.5), proj(4.0, 0, 200), (W + 50, VPY), (W + 50, H)]), fill=(120, 150, 90))
    # curb
    dr.line(pts([proj(0.35, 0, 0.5), proj(0.35, 0, 200)]), fill=(240, 240, 240), width=P(4))
    # lane dashes
    for k in range(40):
        d1 = 1.0 + k * 1.6; d2 = d1 + 0.8
        dr.polygon(pts([proj(2.1, 0, d1), proj(2.1, 0, d2), proj(2.25, 0, d2), proj(2.25, 0, d1)]), fill=(245, 245, 245))
    # sidewalk tiles
    for k in range(60):
        dd = 0.8 + k * 0.7
        a, b = proj(-1.2, 0, dd), proj(0.35, 0, dd)
        dr.line(pts([a, b]), fill=(185, 185, 192), width=P(1.5))
    # buildings (far to near)
    for (d1, d2, h, col, awn) in reversed(buildings):
        if d2 < 0.55: continue
        d1c = max(d1, 0.55)
        q = [proj(-1.2, 0, d1c), proj(-1.2, h, d1c), proj(-1.2, h, d2), proj(-1.2, 0, d2)]
        dr.polygon(pts(q), fill=mix(col, (120, 50, 60), lvl * 0.5))
        dr.line(pts([q[2], q[3]]), fill=mix(col, (0, 0, 0), 0.35), width=P(2))
        # windows
        n = max(1, int((d2 - d1) / 0.6))
        for i in range(n):
            for j in range(int((h - 1.3) / 0.8)):
                wd1 = d1 + (i + 0.3) * (d2 - d1) / n
                wd2 = d1 + (i + 0.7) * (d2 - d1) / n
                if wd1 < 0.55: continue
                y1 = 1.4 + j * 0.8; y2 = y1 + 0.5
                wq = [proj(-1.2, y1, wd1), proj(-1.2, y2, wd1), proj(-1.2, y2, wd2), proj(-1.2, y1, wd2)]
                dr.polygon(pts(wq), fill=(40, 52, 80), outline=(250, 250, 250))
        # awning
        if d1c < d2:
            aq = [proj(-1.2, 1.1, d1c), proj(-0.75, 0.95, d1c), proj(-0.75, 0.95, d2), proj(-1.2, 1.1, d2)]
            dr.polygon(pts(aq), fill=awn)
    # street lamps
    for dd in (2.5, 5.0, 8.0, 12.0):
        a, b = proj(0.25, 0, dd), proj(0.25, 2.6, dd)
        dr.line(pts([a, b]), fill=(40, 40, 50), width=P(max(1.5, 8 / dd)))
        c = proj(0.1, 2.6, dd)
        dr.line(pts([b, c]), fill=(40, 40, 50), width=P(max(1.5, 6 / dd)))

# ---------------------------------------------------------------- characters
SKIN = (246, 214, 180)
HAIR = (110, 66, 36)

def person(dr, x, y, h, body, t, walking=True, face=1, ears=False, phone=False, headphones=False, fallen=0.0, hair=(60, 40, 30), legs_col=(50, 60, 90)):
    """Small background person. (x, y) = feet, h = height in px."""
    hr = h * 0.11
    sw = math.sin(t * 9) if walking else 0
    hx, hy = x, y - h + hr
    # legs
    lw = max(2, h * 0.07)
    for sgn in (-1, 1):
        dr.line(pts([(x + sgn * h * 0.04, y - h * 0.42), (x + sgn * h * 0.06 + sgn * sw * h * 0.08, y)]), fill=legs_col, width=P(lw))
    # body
    dr.rounded_rectangle([P(x - h * 0.15), P(y - h * 0.78), P(x + h * 0.15), P(y - h * 0.38)], radius=P(h * 0.06), fill=body)
    # arms
    if ears:
        for sgn in (-1, 1):
            dr.line(pts([(x + sgn * h * 0.14, y - h * 0.72), (hx + sgn * hr * 1.05, hy)]), fill=body, width=P(lw))
    elif phone:
        dr.line(pts([(x + h * 0.12, y - h * 0.7), (x + h * 0.1, y - h * 0.62)]), fill=body, width=P(lw))
        dr.rectangle([P(x + h * 0.02), P(y - h * 0.7), P(x + h * 0.1), P(y - h * 0.6)], fill=(30, 30, 40))
    else:
        for sgn in (-1, 1):
            dr.line(pts([(x + sgn * h * 0.15, y - h * 0.74), (x + sgn * h * 0.19 - sgn * sw * h * 0.05, y - h * 0.46)]), fill=body, width=P(lw))
    # head
    dr.ellipse([P(hx - hr), P(hy - hr), P(hx + hr), P(hy + hr)], fill=SKIN)
    dr.chord([P(hx - hr), P(hy - hr * 1.1), P(hx + hr), P(hy + hr * 0.6)], 180, 360, fill=hair)
    if ears:
        for sgn in (-1, 1):
            dr.ellipse([P(hx + sgn * hr - hr * 0.35), P(hy - hr * 0.3), P(hx + sgn * hr + hr * 0.35), P(hy + hr * 0.4)], fill=SKIN)
    if headphones:
        dr.arc([P(hx - hr * 1.15), P(hy - hr * 1.25), P(hx + hr * 1.15), P(hy + hr)], 180, 360, fill=(30, 30, 30), width=P(max(1.5, hr * 0.25)))
        for sgn in (-1, 1):
            dr.ellipse([P(hx + sgn * hr * 1.05 - hr * 0.3), P(hy - hr * 0.2), P(hx + sgn * hr * 1.05 + hr * 0.3), P(hy + hr * 0.5)], fill=(30, 30, 30))
    if face and hr > 5:
        ey = hy + hr * 0.1
        for sgn in (-1, 1):
            dr.ellipse([P(hx + sgn * hr * 0.35 - hr * 0.1), P(ey - hr * 0.1), P(hx + sgn * hr * 0.35 + hr * 0.1), P(ey + hr * 0.1)], fill=(20, 20, 20))

def hero(dr, cx, cy, r, open_m, squint, hands_up, t, rot=0.0):
    """Big foreground hero. (cx, cy) head center, r head radius."""
    # hoodie body
    body = [(cx - r * 1.65, cy + r * 3.4), (cx - r * 1.3, cy + r * 1.2), (cx - r * 0.6, cy + r * 0.8),
            (cx + r * 0.6, cy + r * 0.8), (cx + r * 1.3, cy + r * 1.2), (cx + r * 1.65, cy + r * 3.4)]
    dr.polygon(pts(body), fill=(28, 28, 32))
    # hood behind head
    dr.ellipse([P(cx - r * 1.2), P(cy - r * 0.6), P(cx + r * 1.2), P(cy + r * 1.35)], fill=(22, 22, 26))
    # strings
    for sgn in (-1, 1):
        dr.line(pts([(cx + sgn * r * 0.18, cy + r * 1.15), (cx + sgn * r * 0.22, cy + r * 1.9)]), fill=(235, 235, 235), width=P(r * 0.06))
    if hands_up:
        for sgn in (-1, 1):
            dr.line(pts([(cx + sgn * r * 1.3, cy + r * 1.6), (cx + sgn * r * 1.45, cy + r * 0.3), (cx + sgn * r * 1.0, cy - r * 0.55)]),
                    fill=(28, 28, 32), width=P(r * 0.45), joint="curve")
    # head
    dr.ellipse([P(cx - r), P(cy - r), P(cx + r), P(cy + r)], fill=SKIN, outline=(40, 30, 25), width=P(2))
    # hair
    dr.chord([P(cx - r * 1.04), P(cy - r * 1.12), P(cx + r * 1.04), P(cy + r * 0.35)], 180, 360, fill=HAIR)
    dr.polygon(pts([(cx - r * 0.9, cy - r * 0.25), (cx - r * 0.4, cy - r * 0.15), (cx - r * 0.1, cy - r * 0.4),
                    (cx + r * 0.3, cy - r * 0.2), (cx + r * 0.95, cy - r * 0.3), (cx + r * 0.9, cy - r * 0.6), (cx - r * 0.9, cy - r * 0.6)]), fill=HAIR)
    # eyes
    ey = cy + r * 0.05
    for sgn in (-1, 1):
        ex = cx + sgn * r * 0.38
        if squint:
            dr.line(pts([(ex - sgn * r * 0.16, ey - r * 0.12), (ex + sgn * r * 0.12, ey), (ex - sgn * r * 0.16, ey + r * 0.12)]), fill=(20, 20, 20), width=P(r * 0.07))
        else:
            dr.ellipse([P(ex - r * 0.13), P(ey - r * 0.16), P(ex + r * 0.13), P(ey + r * 0.16)], fill=(255, 255, 255), outline=(20, 20, 20), width=P(2))
            dr.ellipse([P(ex - r * 0.07), P(ey - r * 0.08), P(ex + r * 0.07), P(ey + r * 0.08)], fill=(20, 20, 20))
        # brows (angry)
        dr.line(pts([(ex - r * 0.18, ey - r * 0.3 - sgn * 0), (ex + r * 0.18, ey - r * 0.3)]) if not squint else
                pts([(ex - r * 0.2, ey - r * 0.28 - sgn * r * 0.06), (ex + r * 0.2, ey - r * 0.28 + sgn * r * 0.06)]),
                fill=(70, 40, 20), width=P(r * 0.07))
    # mouth
    mw = r * (0.22 + 0.35 * open_m); mh = r * (0.08 + 0.55 * open_m)
    my = cy + r * 0.5
    dr.ellipse([P(cx - mw), P(my - mh * 0.5), P(cx + mw), P(my + mh)], fill=(150, 20, 30), outline=(40, 10, 10), width=P(2))
    if open_m > 0.3:
        dr.ellipse([P(cx - mw * 0.5), P(my + mh * 0.35), P(cx + mw * 0.5), P(my + mh * 0.95)], fill=(230, 90, 100))
        dr.rectangle([P(cx - mw * 0.6), P(my - mh * 0.45), P(cx + mw * 0.6), P(my - mh * 0.25)], fill=(255, 255, 255))
    if hands_up:
        for sgn in (-1, 1):
            fx, fy = cx + sgn * r * 1.0, cy - r * 0.55
            dr.ellipse([P(fx - r * 0.3), P(fy - r * 0.3), P(fx + r * 0.3), P(fy + r * 0.3)], fill=SKIN, outline=(40, 30, 25), width=P(2))

# ---------------------------------------------------------------- UI pieces
def text_size(txt, f):
    b = f.getbbox(txt)
    return (b[2] - b[0]) / S, (b[3] - b[1]) / S

def wrap(txt, f, maxw):
    words = txt.split(); lines = []; cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        if text_size(test, f)[0] <= maxw: cur = test
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def bubble(dr, x, y, txt, size, red, maxw=330, tail=None, alpha_t=1.0):
    """Speech bubble with top-left at (x,y). tail=(tx,ty) point."""
    f = font("Inter-Black.otf", size)
    lines = wrap(txt, f, maxw)
    lh = size * 1.18
    tw = max(text_size(l, f)[0] for l in lines)
    bw, bh = tw + 34, lh * len(lines) + 22
    fill = (220, 38, 38) if red else (255, 255, 255)
    tcol = (255, 255, 255) if red else (20, 20, 20)
    if tail:
        tx, ty = tail
        bx = clamp(tx, x + 30, x + bw - 30)
        dr.polygon(pts([(bx - 16, y + bh - 4), (bx + 16, y + bh - 4), (tx, ty)]), fill=fill, outline=(20, 20, 20))
    dr.rounded_rectangle([P(x), P(y), P(x + bw), P(y + bh)], radius=P(16), fill=fill, outline=(20, 20, 20), width=P(3))
    if tail:
        dr.polygon(pts([(bx - 13, y + bh - 5), (bx + 13, y + bh - 5), (tx + (bx - tx) * 0.15, ty - (ty - y - bh) * 0.15)]), fill=fill)
    for i, l in enumerate(lines):
        lw_ = text_size(l, f)[0]
        dr.text((P(x + (bw - lw_) / 2), P(y + 9 + i * lh)), l, font=f, fill=tcol)
    return bw, bh

def stroke_text(dr, xy, txt, f, fill, sw=3):
    dr.text((P(xy[0]), P(xy[1])), txt, font=f, fill=fill, stroke_width=P(sw), stroke_fill=(10, 10, 14))

def header(dr, s, lt):
    n = s["n"]; db = s["db"]
    prev = SC[n - 2]["db"] if n > 1 and s["kind"] != "space" else (db if s["kind"] != "space" else 340)
    val = int(round(lerp(prev, db, ease(lt / 0.6))))
    if db <= 90: col = (255, 255, 255)
    elif db <= 150: col = (255, 214, 40)
    else: col = (240, 50, 40)
    if s["kind"] == "space": col = (170, 170, 255)
    stroke_text(dr, (34, 40), f"КРИК #{n}", font("Inter-ExtraBold.otf", 20), (235, 235, 235), 2)
    fb = font("InterDisplay-Black.otf", 104)
    num = str(val)
    stroke_text(dr, (30, 58), num, fb, col, 4)
    nw = text_size(num, fb)[0]
    stroke_text(dr, (40 + nw, 104), "дБ", font("InterDisplay-Black.otf", 56), col, 3)
    stroke_text(dr, (34, 184), s["label"], font("Inter-ExtraBold.otf", 20), (240, 240, 240), 2)
    y = 214
    if 1 < n < 12:
        f = font("Inter-ExtraBold.otf", 15)
        tag = "КАЖДЫЙ РАЗ В 2 РАЗА ГРОМЧЕ"
        tw = text_size(tag, f)[0]
        dr.rectangle([P(34), P(y), P(34 + tw + 16), P(y + 26)], fill=(220, 38, 38))
        dr.text((P(42), P(y + 3)), tag, font=f, fill=(255, 255, 255))
        y += 40
    else:
        y += 8
    fc = font("Inter-Black.otf", 31)
    for i, l in enumerate(wrap(s["cap"], fc, 640)):
        stroke_text(dr, (34, y + i * 40), l, fc, (255, 255, 255), 3)

def shout_text(lvl):
    return "ЕРА ЛОХ" + "!" * (1 + int(lvl * 3))

# ---------------------------------------------------------------- scene renderers
def walkers_bg(dr, lt, n, lvl, blown=0.0):
    """Ambient pedestrians walking on the sidewalk in depth."""
    r = random.Random(n * 31)
    cols = [(200, 60, 60), (60, 140, 90), (230, 180, 50), (90, 90, 200), (150, 90, 160), (60, 160, 180)]
    for k in range(4):
        speed = r.uniform(1.0, 2.2)
        X = r.uniform(-1.0, -0.2)
        toward = r.random() < 0.5
        phase = r.uniform(0, 14)
        dist = (phase + lt * speed) % 14
        dd = (16 - dist) if toward else (2.2 + dist)
        if dd < 1.8: continue
        x, y = proj(X, 0, dd)
        h = F * 1.7 / dd
        if blown > 0:
            x += blown * 60 / dd * 10
        person(dr, x, y, h, cols[k % len(cols)], lt * speed + k, ears=lvl >= 0.5, hair=r.choice([(60, 40, 30), (20, 20, 20), (200, 160, 80)]))

def draw_yera(dr, lt):
    x, y = proj(0.3, 0, 5.5)
    h = F * 1.75 / 5.5
    person(dr, x, y, h, (60, 150, 80), lt, walking=False, phone=True, headphones=True, hair=(30, 25, 20))
    f = font("Inter-Black.otf", 15)
    tw = text_size("ЕРА", f)[0]
    ty = y - h - 34
    dr.rounded_rectangle([P(x - tw / 2 - 8), P(ty), P(x + tw / 2 + 8), P(ty + 22)], radius=P(6), fill=(30, 30, 30))
    dr.text((P(x - tw / 2), P(ty + 2)), "ЕРА", font=f, fill=(255, 255, 255))
    dr.polygon(pts([(x - 6, ty + 22), (x + 6, ty + 22), (x, ty + 30)]), fill=(30, 30, 30))

def speaker(dr, s, lt):
    w = s["walker"]
    # walks in from depth and stops
    k = ease(lt / 1.3)
    dd = lerp(9.0, 2.9, k)
    x, y = proj(-0.45, 0, dd)
    h = F * 1.75 / dd
    walking = lt < 1.3 or lt > 3.3
    person(dr, x, y, h, w["color"], lt, walking=walking, ears=w.get("ears", False) or s["lvl"] >= 0.5, hair=(40, 30, 25))
    if TALK_AT <= lt:
        bubble(dr, 425, y - h - 95, w["text"], 22, False, maxw=260, tail=(x + 8, y - h + 8))

def grandma(dr, s, lt):
    q = [proj(-1.2, 2.5, 2.2), proj(-1.2, 1.5, 2.2), proj(-1.2, 1.5, 3.0), proj(-1.2, 2.5, 3.0)]
    dr.polygon(pts(q), fill=(30, 36, 60), outline=(255, 255, 255))
    gx = (q[0][0] + q[2][0]) / 2; gy = (q[0][1] + q[1][1]) / 2 + 6
    pop = ease((lt - 0.9) / 0.4)
    if pop > 0:
        hr = 20
        gy2 = gy + (1 - pop) * 40
        dr.ellipse([P(gx - hr * 1.4), P(gy2 + hr * 0.6), P(gx + hr * 1.4), P(gy2 + hr * 2.4)], fill=(150, 70, 120))
        dr.ellipse([P(gx - hr), P(gy2 - hr), P(gx + hr), P(gy2 + hr)], fill=SKIN)
        dr.chord([P(gx - hr * 1.15), P(gy2 - hr * 1.25), P(gx + hr * 1.15), P(gy2 + hr * 0.5)], 180, 360, fill=(220, 220, 225))
        dr.ellipse([P(gx - 10), P(gy2 - 34), P(gx + 10), P(gy2 - 18)], fill=(220, 220, 225))
        for sgn in (-1, 1):
            dr.line(pts([(gx + sgn * 6 - sgn * 10, gy2 - 8), (gx + sgn * 6 + sgn * 6, gy2 - 4)]), fill=(20, 20, 20), width=P(3))
        dr.arc([P(gx - 10), P(gy2 + 6), P(gx + 10), P(gy2 + 18)], 200, 340, fill=(20, 20, 20), width=P(3))
        # shaking fist
        fx = gx + hr * 1.6 + math.sin(lt * 20) * 4
        dr.ellipse([P(fx - 11), P(gy2 - 6), P(fx + 11), P(gy2 + 16)], fill=SKIN, outline=(40, 30, 25))
    if lt >= TALK_AT - 0.1:
        bubble(dr, gx + 50, 312, s["grandma"], 22, False, maxw=300, tail=(gx + 26, gy - 10))

def pigeons(dr, lt):
    r = random.Random(3)
    for k in range(9):
        bx = 300 + r.uniform(-30, 160); by = 700 + r.uniform(-20, 30)
        t = clamp((lt - SHOUT_AT - r.uniform(0, 0.3)) / 2.2)
        x = bx + t * r.uniform(150, 400); y = by - t * r.uniform(350, 650)
        flap = math.sin(lt * 30 + k) * 10 if t > 0 else 0
        s = 1 + t * 0.5
        dr.ellipse([P(x - 9 * s), P(y - 5 * s), P(x + 9 * s), P(y + 5 * s)], fill=(120, 125, 140))
        dr.line(pts([(x - 16 * s, y - flap * s), (x, y), (x + 16 * s, y - flap * s)]), fill=(90, 95, 110), width=P(3))

def cracks(dr, lt, lvl, cx, cy):
    r = random.Random(11)
    grow = ease((lt - SHOUT_AT) / 1.0)
    for k in range(9):
        ang = r.uniform(-0.2, math.pi + 0.2)
        x, y = cx, cy
        L = r.uniform(120, 330) * grow * (0.7 + lvl * 0.5)
        steps = 6
        line = [(x, y)]
        for st in range(steps):
            a = ang + r.uniform(-0.5, 0.5)
            x += math.cos(a) * L / steps; y += abs(math.sin(a)) * L / steps * 0.6 + 4
            line.append((x, y))
        dr.line(pts(line), fill=(25, 25, 25), width=P(4), joint="curve")

def shockwave(dr, lt, cx, cy):
    for k in range(3):
        rr = ((lt - SHOUT_AT) * 520 - k * 160)
        if rr <= 0: continue
        a = clamp(1 - rr / 900)
        dr.ellipse([P(cx - rr), P(cy - rr * 0.8), P(cx + rr), P(cy + rr * 0.8)], outline=mix((255, 220, 200), (255, 255, 255), a), width=P(6 * a + 1))

def render_street(img, s, lt):
    dr = ImageDraw.Draw(img)
    lvl = s["lvl"]
    draw_street_bg(dr, lvl)
    if s.get("grandma"): grandma(dr, s, lt)
    walkers_bg(dr, lt + s["n"], s["n"], lvl, blown=(ease((lt - SHOUT_AT) / 0.8) if s.get("wave") else 0))
    draw_yera(dr, lt)
    if s.get("walker"): speaker(dr, s, lt)
    if s.get("pigeons"): pigeons(dr, lt)
    hx, hy, hr = 215, 790, 92
    if s.get("cracks"): cracks(dr, lt, lvl, hx + 40, 1110)
    st = lt - SHOUT_AT
    shouting = 0 <= st < 2.2
    open_m = (0.35 + 0.65 * lvl) * (1.0 if shouting else 0.15)
    if shouting:
        open_m *= 0.85 + 0.15 * math.sin(lt * 40)
    # sound arcs
    if shouting:
        for k in range(3):
            rr = 40 + ((st * 160 + k * 45) % 140) * (1 + lvl)
            dr.arc([P(hx + 40 - rr), P(hy + 40 - rr), P(hx + 40 + rr), P(hy + 40 + rr)], -50, 30, fill=(255, 255, 255), width=P(3 + 3 * lvl))
    if s.get("wave"): shockwave(dr, lt, hx, hy)
    hero(dr, hx, hy, hr, open_m, lvl >= 0.5, lvl >= 0.5, lt)
    if st >= 0:
        txt = "ЕРА," if st < 0.35 else shout_text(lvl)
        size = 30 + lvl * 26
        red = lvl >= 0.35
        bubble(dr, 30, 560 - lvl * 40, txt, size, red, maxw=420, tail=(hx + 20, hy - 70))

# ---- map
map_rng = random.Random(5)
BLOCKS = []
for gx in range(-8, 9):
    for gy in range(-12, 13):
        BLOCKS.append((gx, gy, map_rng.random()))
def render_map(img, s, lt):
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 0, P(W), P(H)], fill=(225, 225, 220))
    cx, cy = 360, 790
    rad = ease((lt - SHOUT_AT) / 2.6) * 820
    cell = 46
    for gx, gy, rv in BLOCKS:
        x = cx + gx * cell; y = cy + gy * cell
        dist = math.hypot(x - cx, y - cy)
        heard = dist < rad - rv * 30
        col = (90, 180, 100) if heard else (170, 170, 168)
        dr.rectangle([P(x - 17), P(y - 17), P(x + 17), P(y + 17)], fill=col, outline=(120, 120, 120))
        if heard and rv > 0.55:
            dr.text((P(x - 6), P(y - 13)), "!", font=font("Inter-Black.otf", 20), fill=(255, 255, 255))
    # dashed ring
    if rad > 0:
        for a in range(0, 360, 8):
            dr.arc([P(cx - rad), P(cy - rad), P(cx + rad), P(cy + rad)], a, a + 4, fill=(230, 190, 40), width=P(6))
    dr.ellipse([P(cx - 12), P(cy - 12), P(cx + 12), P(cy + 12)], fill=(220, 38, 38), outline=(255, 255, 255), width=P(3))
    if lt >= SHOUT_AT:
        bubble(dr, cx - 85, cy - 80, shout_text(1), 22, True, tail=(cx, cy - 14))
    # tiny people dots running
    r = random.Random(9)
    for k in range(40):
        x = cx + r.uniform(-340, 340); y = cy + r.uniform(-500, 480)
        if math.hypot(x - cx, y - cy) < rad:
            dr.ellipse([P(x - 4), P(y - 4), P(x + 4), P(y + 4)], fill=(30, 30, 30))

# ---- space / earth
star_rng = random.Random(2)
STARS = [(star_rng.uniform(0, W), star_rng.uniform(0, H), star_rng.uniform(0.6, 2.2)) for _ in range(220)]
earth_rng = random.Random(4)
CONT = [(earth_rng.uniform(-0.8, 0.8), earth_rng.uniform(-0.8, 0.8), earth_rng.uniform(0.15, 0.4), earth_rng.uniform(0.1, 0.3)) for _ in range(14)]

def space_bg(dr, lt):
    dr.rectangle([0, 0, P(W), P(H)], fill=(10, 12, 28))
    for x, y, r in STARS:
        tw = 0.6 + 0.4 * math.sin(lt * 3 + x)
        c = int(200 * tw)
        dr.ellipse([P(x - r / 2), P(y - r / 2), P(x + r / 2), P(y + r / 2)], fill=(c, c, c + 30 if c < 225 else 255))

def earth(img, cx, cy, R, lt, mode, shake=0):
    dr = ImageDraw.Draw(img)
    cx += shake * math.sin(lt * 50); cy += shake * math.cos(lt * 43)
    # atmosphere glow
    for k in range(6, 0, -1):
        g = R + k * 7
        dr.ellipse([P(cx - g), P(cy - g), P(cx + g), P(cy + g)], fill=(20 + k * 4, 40 + k * 6, 90 + k * 12))
    layer = Image.new("RGB", img.size, (30, 90, 190))
    ld = ImageDraw.Draw(layer)
    for ox, oy, a, b in CONT:
        x = cx + ox * R; y = cy + oy * R
        ld.ellipse([P(x - a * R), P(y - b * R), P(x + a * R), P(y + b * R)], fill=(50, 150, 80))
    # you dot
    yx, yy = cx - R * 0.05, cy + R * 0.25
    if mode == 0:
        rr = ease((lt - SHOUT_AT) / 2.5) * R * 2.2
        for k in range(3):
            q = rr - k * 40
            if q > 0:
                ld.ellipse([P(yx - q), P(yy - q), P(yx + q), P(yy + q)], outline=(230, 240, 255), width=P(4))
    if mode == 2:
        r = random.Random(13)
        grow = ease((lt - SHOUT_AT) / 1.5)
        for k in range(14):
            a = r.uniform(0, math.tau); x, y = yx, yy; line = [(x, y)]
            for st in range(7):
                a += r.uniform(-0.6, 0.6)
                x += math.cos(a) * R * 0.2 * grow; y += math.sin(a) * R * 0.2 * grow
                line.append((x, y))
            ld.line(pts(line), fill=(255, 150, 40), width=P(5))
            ld.line(pts(line), fill=(255, 230, 150), width=P(2))
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse([P(cx - R), P(cy - R), P(cx + R), P(cy + R)], fill=255)
    img.paste(layer, (0, 0), mask)
    dr = ImageDraw.Draw(img)
    # night shade
    dr.ellipse([P(yx - 9), P(yy - 9), P(yx + 9), P(yy + 9)], fill=(230, 30, 30), outline=(255, 255, 255), width=P(2))
    dr.text((P(yx - 12), P(yy - 34)), "ТЫ", font=font("Inter-Black.otf", 16), fill=(255, 255, 255))
    if mode == 1:
        # global network going down: wifi icons crossing out around Earth
        for k in range(10):
            a = k / 10 * math.tau + lt * 0.3
            x = cx + math.cos(a) * (R + 70); y = cy + math.sin(a) * (R + 70)
            on = lt < SHOUT_AT + 0.25 + k * 0.18
            col = (120, 220, 255) if on else (230, 50, 50)
            for j in range(3):
                q = 6 + j * 7
                dr.arc([P(x - q), P(y - q), P(x + q), P(y + q)], 220, 320, fill=col, width=P(3))
            if not on:
                dr.line(pts([(x - 18, y - 22), (x + 18, y + 8)]), fill=(230, 50, 50), width=P(4))
        for k in range(4):
            rr = ((lt - SHOUT_AT) * 300 + k * 90) % 420 + R
            if lt > SHOUT_AT:
                dr.ellipse([P(cx - rr), P(cy - rr), P(cx + rr), P(cy + rr)], outline=(255, 140, 60), width=P(2))
    if mode == 2:
        for k in range(3):
            rr = R + ((lt - SHOUT_AT) * 260 + k * 120) % 400
            if lt > SHOUT_AT:
                dr.ellipse([P(cx - rr), P(cy - rr), P(cx + rr), P(cy + rr)], outline=(255, 200, 80), width=P(3))
    return yx, yy

def render_earth(img, s, lt):
    dr = ImageDraw.Draw(img)
    space_bg(dr, lt)
    sx, sy = 560, 470
    for k in range(5, 0, -1):
        g = 50 + k * 10
        dr.ellipse([P(sx - g), P(sy - g), P(sx + g), P(sy + g)], fill=(40 + k * 25, 35 + k * 22, 20 + k * 4))
    dr.ellipse([P(sx - 50), P(sy - 50), P(sx + 50), P(sy + 50)], fill=(255, 220, 60))
    mode = s["mode"]
    shake = [0, 4, 10][mode] if lt > SHOUT_AT else 0
    earth(img, 330, 820, 230, lt, mode, shake)

TRI_rng = random.Random(8)
TRIS = [(TRI_rng.uniform(0, W), TRI_rng.uniform(300, H), TRI_rng.uniform(12, 30), TRI_rng.uniform(0, 6.28),
         TRI_rng.choice([(60, 120, 230), (60, 200, 110), (200, 210, 230), (40, 80, 200)]), TRI_rng.uniform(-40, 40), TRI_rng.uniform(-30, 30)) for _ in range(28)]

def render_space(img, s, lt):
    dr = ImageDraw.Draw(img)
    space_bg(dr, lt)
    for x, y, sz, a, col, vx, vy in TRIS:
        x = (x + vx * lt) % W; y = 300 + (y - 300 + vy * lt) % (H - 300)
        a += lt * 0.8
        p = [(x + math.cos(a + k * 2.094) * sz, y + math.sin(a + k * 2.094) * sz) for k in range(3)]
        dr.polygon(pts(p), fill=col)
    # floating hero (rotated layer)
    layer = Image.new("RGBA", (P(420), P(520)), (0, 0, 0, 0))
    ldr = ImageDraw.Draw(layer)
    shouting = SHOUT_AT <= lt < 2.8
    om = (0.9 + 0.1 * math.sin(lt * 40)) if shouting else (0.25 if lt < ANSWER_AT else 0.1)
    hero(ldr, 210, 170, 80, om, shouting, False, lt)
    ang = -18 + math.sin(lt * 0.8) * 8
    layer = layer.rotate(ang, resample=Image.BICUBIC, expand=False)
    hx, hy = 70 + lt * 6, 640 + math.sin(lt * 1.1) * 12
    img.paste(layer, (P(hx), P(hy)), layer)
    dr = ImageDraw.Draw(img)
    if SHOUT_AT <= lt < ANSWER_AT:
        bubble(dr, 70, 470, "ЕРА ЛОХ!!!", 40, True, maxw=500, tail=(hx + 230, hy + 150))
        # silent: no sound arcs, just muted icon
        if lt > 1.2:
            mx, my = 600, 560
            dr.ellipse([P(mx - 34), P(my - 34), P(mx + 34), P(my + 34)], fill=(40, 40, 60), outline=(200, 200, 220), width=P(3))
            dr.polygon(pts([(mx - 16, my - 8), (mx - 6, my - 8), (mx + 6, my - 18), (mx + 6, my + 18), (mx - 6, my + 8), (mx - 16, my + 8)]), fill=(230, 230, 240))
            dr.line(pts([(mx - 22, my - 22), (mx + 22, my + 22)]), fill=(230, 50, 50), width=P(5))
    # incoming call
    if lt >= CALL_AT:
        k = ease((lt - CALL_AT) / 0.4)
        px = lerp(W + 10, 400, k); py = 930
        ring = (lt < ANSWER_AT) and int(lt * 8) % 2 == 0
        dr.rounded_rectangle([P(px), P(py), P(px + 290), P(py + 240)], radius=P(30), fill=(28, 30, 44), outline=(170, 170, 200), width=P(3))
        f1 = font("Inter-Bold.otf", 18); f2 = font("Inter-Black.otf", 34)
        lab = "Входящий вызов" if lt < ANSWER_AT else "00:0" + str(min(9, int(lt - ANSWER_AT)))
        dr.text((P(px + 24), P(py + 20)), lab, font=f1, fill=(200, 200, 220))
        dr.text((P(px + 24), P(py + 48)), "Ера 📱".replace(" 📱", ""), font=f2, fill=(255, 255, 255))
        sh = 3 if ring else 0
        if lt < ANSWER_AT:
            dr.ellipse([P(px + 40), P(py + 130 + sh), P(px + 110), P(py + 200 + sh)], fill=(230, 50, 50))
            dr.ellipse([P(px + 180), P(py + 130 - sh), P(px + 250), P(py + 200 - sh)], fill=(50, 200, 90))
            dr.text((P(px + 197), P(py + 145 - sh)), "✆", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", P(34)), fill=(255, 255, 255))
            dr.text((P(px + 57), P(py + 145 + sh)), "✆", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", P(34)), fill=(255, 255, 255))
        else:
            dr.ellipse([P(px + 110), P(py + 130), P(px + 180), P(py + 200)], fill=(230, 50, 50))
            dr.text((P(px + 127), P(py + 145)), "✆", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", P(34)), fill=(255, 255, 255))
    if lt >= YERA_AT:
        bubble(dr, 230, 700, "Ты чё орёшь?! Я тебя с первого раза услышал!", 28, True, maxw=440, tail=(540, 935))

# ---------------------------------------------------------------- frame
def scene_at(t):
    for i in range(len(SC) - 1, -1, -1):
        if t >= SC[i]["t0"]: return SC[i], t - SC[i]["t0"]
    return SC[0], t

def render_frame(fi):
    t = fi / FPS
    s, lt = scene_at(t)
    img = Image.new("RGB", (P(W), P(H)), (0, 0, 0))
    {"street": render_street, "map": render_map, "earth": render_earth, "space": render_space}[s["kind"]](img, s, lt)
    dr = ImageDraw.Draw(img)
    header(dr, s, lt)
    # camera shake
    lvl = s["lvl"]
    st = lt - SHOUT_AT
    out = img.resize((W, H), Image.LANCZOS)
    if s["kind"] != "space" and 0 <= st < 1.6 and lvl > 0.15:
        amp = lvl * 14 * (1 - st / 1.6)
        dx = int(math.sin(t * 77) * amp); dy = int(math.cos(t * 63) * amp)
        sh = Image.new("RGB", (W, H), (0, 0, 0))
        sh.paste(out, (dx, dy))
        out = sh
    # white flash at shout for loud scenes
    if s["kind"] != "space" and 0 <= st < 0.12 and lvl >= 0.5:
        out = Image.blend(out, Image.new("RGB", (W, H), (255, 255, 255)), 0.5 * (1 - st / 0.12))
    # scene fade-in
    if lt < 0.12 and s["n"] > 1:
        out = Image.blend(Image.new("RGB", (W, H), (255, 255, 255) if s["kind"] != "space" else (0, 0, 0)), out, lt / 0.12)
    if t > TOTAL - 0.6:
        out = Image.blend(out, Image.new("RGB", (W, H), (0, 0, 0)), clamp((t - (TOTAL - 0.6)) / 0.6))
    return out.tobytes()

if __name__ == "__main__":
    out = sys.argv[1]
    only = sys.argv[2] if len(sys.argv) > 2 else None
    if only:   # preview frames at given times
        for ts in only.split(","):
            fi = int(float(ts) * FPS)
            Image.frombytes("RGB", (W, H), render_frame(fi)).save(f"{out}_{ts}.png")
        sys.exit(0)
    n = int(TOTAL * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for i, b in enumerate(pool.imap(render_frame, range(n), chunksize=8)):
            ff.stdin.write(b)
            if i % 150 == 0: print(i, "/", n, flush=True)
    ff.stdin.close(); ff.wait()
    print("TOTAL", TOTAL)
