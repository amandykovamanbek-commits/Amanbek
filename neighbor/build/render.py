"""Render 'Сосед — не человек' part 1: 1080x1920 60fps, frames piped to ffmpeg, audio mixed in numpy."""
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(ROOT, "plates")
AUD = os.path.join(ROOT, "..", "audio")
OUTDIR = os.path.join(ROOT, "..", "out")
os.makedirs(OUTDIR, exist_ok=True)
W, H, FPS = 1080, 1920, 60
BAN_Y = 1100  # Cash Worms banner occupies y 1100..1484 (full width)
END = 81.0
FONT = "/usr/share/fonts/opentype/inter/"
PREVIEW = "--preview" in sys.argv


def font(name, size):
    return ImageFont.truetype(FONT + name, size)


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def load(n):
    return Image.open(os.path.join(P, n)).convert("RGB")


import characters as C

PL = {n: load(n + ".png") for n in ["doorplate", "home_door"]}
RW = 1.5  # world plates are rendered at 1.5x the 1080x1920 frame
WORLD = {
    "stair": C.stairwell(RW),
    "stair_warm": C.stairwell(RW, warm=True),
    "entrance": C.entrance(RW),
    "doghall": C.dog_hall(RW),
}
_dk = np.asarray(WORLD["stair"]).astype(np.float32) * np.array([0.42, 0.26, 0.28])
WORLD["stair_dark"] = Image.fromarray(_dk.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
PL["landing"] = WORLD["stair"].resize((W, H))


def _env(path, a, b):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "6000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32)[int(a * 6000): int(b * 6000)]
    hop = 100  # 60 per second
    n = len(x) // hop
    r = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1))
    r = np.convolve(r, np.ones(3) / 3, mode="same")
    return np.clip(r / (np.percentile(r, 95) + 1e-6), 0, 1)


ENV1 = _env(os.path.join(AUD, "neighbor.mp3"), 0.0, 2.2)
ENV2 = _env(os.path.join(AUD, "neighbor.mp3"), 4.2, 7.52)


def talk_at(t):
    for at, env in ((5.3, ENV1), (59.6, ENV2)):
        i = int((t - at) * 60)
        if 0 <= i < len(env):
            return float(env[i]) if env[i] > 0.12 else 0.0
    return 0.0


# ---------------------------------------------------------------- timing
# narration pieces: (src_start, src_end, offset) -> timeline = src + offset
PIECES = [(0.0, 5.6, 0.0), (5.6, 50.2, 2.0), (50.2, 55.2, 4.8), (55.2, 58.9, 8.2), (58.9, 64.9, 8.5), (64.9, 68.13, 10.6)]


def T(n):
    for a, b, o in PIECES:
        if a <= n < b:
            return n + o
    return n + PIECES[-1][2]


NB1_AT, NB2_AT = 5.3, 59.6          # neighbour lines on the timeline
KNOCKS = [52.2, 53.0, 53.8, 74.6]

# scenes: (start, end, name)
SCENES = [
    (0.0, 5.3, "landing"), (5.3, 8.0, "face_med"), (8.0, 10.8, "doorplate"), (10.8, 15.6, "flashback"),
    (15.6, 25.6, "chat"), (25.6, 33.2, "sign1"), (33.2, 39.9, "dog"), (39.9, 46.6, "reflection"),
    (46.6, 51.9, "home"), (51.9, 55.0, "knock"), (55.0, 63.2, "peephole"), (63.2, 67.0, "reveal"),
    (67.0, 73.3, "phone2"), (73.3, 75.4, "black"), (75.4, END, "end"),
]

# captions: (src_start, src_end, text, {word: colour}) in narration time, or ('T', start, end, ...) absolute
Y, R = (255, 214, 10), (255, 59, 59)
CAPS_N = [
    (0.2, 1.6, "СОСЕД ЗДОРОВАЕТСЯ", {}), (1.6, 2.95, "С ТОБОЙ КАЖДОЕ УТРО.", {"КАЖДОЕ": Y}),
    (3.0, 3.9, "СЕГОДНЯ ОН НАЗВАЛ", {}), (3.9, 5.3, "ТЕБЯ ЧУЖИМ ИМЕНЕМ.", {"ЧУЖИМ": R, "ИМЕНЕМ.": R}),
    (6.2, 7.95, "ВИТЯ — ЭТО ОН САМ.", {"ОН": R, "САМ.": R}),
    (9.0, 9.85, "ПЯТЬ ЛЕТ.", {}), (9.9, 11.5, "КАЖДОЕ УТРО В 7:40.", {"7:40.": Y}),
    (11.6, 12.35, "«ДОБРОЕ!»", {"«ДОБРОЕ!»": Y}), (12.4, 13.7, "И МАШЕТ РУКОЙ.", {}),
    (14.0, 15.0, "ВЕЧЕРОМ В ЧАТЕ ДОМА", {}), (15.0, 16.1, "ПИШЕТ ЕГО ЖЕНА:", {"ЖЕНА:": Y}),
    (16.2, 17.6, "«ЕСЛИ ОН С ВАМИ ЗАГОВОРИТ —", {}), (17.6, 19.2, "ПРОВЕРЬТЕ ЧЕТЫРЕ ВЕЩИ»", {"ЧЕТЫРЕ": Y}),
    (19.3, 21.0, "ТЫ УСПЕВАЕШЬ ПРОЧИТАТЬ ТРИ.", {"ТРИ.": Y}), (21.3, 23.6, "СООБЩЕНИЕ УДАЛЕНО.", {"УДАЛЕНО.": R}),
    (24.1, 25.15, "ПРИЗНАК ПЕРВЫЙ:", {}), (25.2, 26.5, "ОН НЕ МОРГАЕТ.", {"НЕ": R, "МОРГАЕТ.": R}),
    (26.6, 27.45, "ТЫ СЧИТАЕШЬ.", {}), (27.5, 28.65, "ДВАДЦАТЬ СЕКУНД.", {}), (28.7, 29.8, "СОРОК.", {}),
    (29.9, 31.4, "МИНУТА.", {"МИНУТА.": R}),
    (31.6, 32.5, "ПРИЗНАК ВТОРОЙ:", {}), (32.5, 33.95, "СОБАКА ЕГО БОИТСЯ.", {"БОИТСЯ.": R}),
    (34.0, 34.9, "РЕКС СКУЛИТ", {}), (34.9, 36.35, "И ЖМЁТСЯ К ТВОЕЙ ДВЕРИ.", {"ТВОЕЙ": Y}),
    (36.4, 37.9, "ДОМОЙ ОН НЕ ИДЁТ.", {}),
    (38.3, 39.35, "ПРИЗНАК ТРЕТИЙ:", {}), (39.4, 40.85, "ОТРАЖЕНИЕ ОПАЗДЫВАЕТ.", {"ОПАЗДЫВАЕТ.": R}),
    (40.9, 42.65, "В СТЕКЛЕ ОН ПОВОРАЧИВАЕТСЯ…", {}), (42.7, 44.7, "НА СЕКУНДУ ПОЗЖЕ.", {"ПОЗЖЕ.": R}),
    (45.0, 45.85, "ТЫ ДОМА.", {}), (45.9, 47.4, "ЗАКРЫЛ НА ДВА ЗАМКА.", {"ДВА": Y}),
    (47.5, 48.55, "ТРИ ИЗ ЧЕТЫРЁХ —", {}), (48.6, 50.1, "ЭТО ЕЩЁ НЕ ТОЧНО.", {"НЕ": Y, "ТОЧНО.": Y}),
    (50.6, 52.0, "В ГЛАЗКЕ — СОСЕД.", {}), (52.1, 53.15, "УЛЫБАЕТСЯ.", {}),
    (53.2, 55.0, "ЧУТЬ ШИРЕ, ЧЕМ МОЖНО.", {"ШИРЕ,": R}),
    (55.7, 56.85, "ПРИЗНАК ЧЕТВЁРТЫЙ:", {}), (56.9, 58.85, "ОН СПРАШИВАЕТ РАЗРЕШЕНИЯ.", {"РАЗРЕШЕНИЯ.": R}),
    (59.2, 60.05, "ТЕЛЕФОН.", {}), (60.1, 61.6, "СООБЩЕНИЕ ОТ СОСЕДА:", {"СОСЕДА:": Y}),
    (61.7, 62.35, "«Я В БОЛЬНИЦЕ", {"БОЛЬНИЦЕ": R}), (62.35, 63.38, "С ПРОШЛОЙ НЕДЕЛИ.", {}),
    (63.4, 64.85, "КТО У ВАС НА ПЛОЩАДКЕ?»", {"КТО": R}),
]
CAPS = [(T(a), T(b), t, c) for a, b, t, c in CAPS_N]
CAPS += [
    (NB1_AT + 0.1, NB1_AT + 2.2, "«ДОБРОЕ УТРО, ВИТЯ.»", {"ВИТЯ.»": R}),
    (KNOCKS[0], KNOCKS[1], "ТУК.", {"ТУК.": R}), (KNOCKS[1], KNOCKS[2], "ТУК. ТУК.", {"ТУК.": R}),
    (KNOCKS[2], 55.0, "ТУК. ТУК. ТУК.", {"ТУК.": R}),
    (NB2_AT + 0.2, NB2_AT + 1.55, "«СОСЕД…", {}), (NB2_AT + 1.55, NB2_AT + 3.3, "МОЖНО ВОЙТИ?»", {"ВОЙТИ?»": R}),
]
CAPS.sort()

# ---------------------------------------------------------------- caption sprites
CAP_FONT = font("Inter-Black.otf", 74)
CAP_Y = 990


def caption_sprite(text, colors):
    words = text.split(" ")
    lines, cur = [], []
    for w in words:
        test = " ".join(cur + [w])
        if cur and CAP_FONT.getlength(test) > 900:
            lines.append(cur)
            cur = [w]
        else:
            cur.append(w)
    lines.append(cur)
    lh = 92
    img = Image.new("RGBA", (W, lh * len(lines) + 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    sp = CAP_FONT.getlength(" ")
    for li, ln in enumerate(lines):
        total = sum(CAP_FONT.getlength(w) for w in ln) + sp * (len(ln) - 1)
        x = (W - total) / 2
        y = 30 + li * lh
        for w in ln:
            col = colors.get(w, (255, 255, 255))
            d.text((x + 4, y + 6), w, font=CAP_FONT, fill=(0, 0, 0, 150))
            d.text((x, y), w, font=CAP_FONT, fill=col, stroke_width=7, stroke_fill=(0, 0, 0, 255))
            x += CAP_FONT.getlength(w) + sp
    return img


CAP_SPR = [(a, b, caption_sprite(t, c)) for a, b, t, c in CAPS]

# ---------------------------------------------------------------- HUD
F_HUD = font("Inter-Bold.otf", 34)
F_HUD_S = font("Inter-SemiBold.otf", 26)


def clock_at(t):
    if t < 10.8:
        return "07:40", None
    if t < 15.6:
        days = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"]
        if t < 11.9:
            return "07:40", "5 ЛЕТ НАЗАД"
        return "07:40", days[int((t - 11.9) / 0.32) % 7]
    if t < 25.6:
        return "21:15", None
    if t < 46.6:
        return "07:40", "НА СЛЕДУЮЩЕЕ УТРО" if t < 27.5 else None
    if t < 55.0:
        return "23:58", None
    if t < 67.0:
        return "23:59", None
    return "00:01", None


TICKS = [T(24.4), T(31.9), T(38.6), T(56.0)]  # when each sign gets crossed
CHECK_APPEAR = T(17.9)


def draw_hud(fr, t):
    d = ImageDraw.Draw(fr, "RGBA")
    clk, sub = clock_at(t)
    d.rounded_rectangle((40, 60, 230, 116), 12, fill=(10, 10, 14, 170), outline=(255, 255, 255, 60), width=2)
    blink = (int(t * 2) % 2 == 0)
    d.ellipse((58, 80, 74, 96), fill=(235, 50, 50, 255 if blink else 90))
    d.text((88, 88), clk, font=F_HUD, fill=(255, 255, 255), anchor="lm")
    if sub:
        wsub = F_HUD_S.getlength(sub) + 30
        d.rounded_rectangle((40, 124, 40 + wsub, 166), 10, fill=(200, 40, 40, 220))
        d.text((55, 145), sub, font=F_HUD_S, fill=(255, 255, 255), anchor="lm")
    if t >= CHECK_APPEAR:
        a = ease((t - CHECK_APPEAR) / 0.3)
        n = sum(1 for k in TICKS if t >= k)
        lab = f"ПРИЗНАКИ {n}/4"
        x0 = 1040 - int(F_HUD_S.getlength(lab)) - 36 - 4 * 30 - 10
        d.rounded_rectangle((x0, 60, 1040, 116), 12, fill=(10, 10, 14, int(170 * a)), outline=(255, 214, 10, int(200 * a)), width=2)
        d.text((x0 + 18, 88), lab, font=F_HUD_S, fill=(255, 214, 10, int(255 * a)), anchor="lm")
        for i in range(4):
            bx = 1040 - 14 - (4 - i) * 30
            on = t >= TICKS[i]
            col = (235, 50, 50, int(255 * a)) if on else (255, 255, 255, int(70 * a))
            d.rectangle((bx, 76, bx + 22, 98), fill=col)
            if on:
                d.line((bx + 4, 80, bx + 18, 94), fill=(255, 255, 255), width=3)
                d.line((bx + 18, 80, bx + 4, 94), fill=(255, 255, 255), width=3)


BANNERS = [  # (start, end, label, title, colour)
    (T(24.1), 33.2, "⚠  ПРИЗНАК 1/4", "Он не моргает", (38, 72, 210)),
    (T(31.6), 39.9, "⚠  ПРИЗНАК 2/4", "Собака его боится", (38, 72, 210)),
    (T(38.3), 46.6, "⚠  ПРИЗНАК 3/4", "Отражение опаздывает", (38, 72, 210)),
    (T(55.7), 67.0, "⚠  ПРИЗНАК 4/4", "Он спрашивает разрешения", (200, 30, 40)),
]
F_BL = font("Inter-Bold.otf", 30)
F_BT = font("Inter-ExtraBold.otf", 54)


def draw_banner(fr, t):
    for a, b, lab, title, col in BANNERS:
        if a <= t < b:
            k = ease((t - a) / 0.35)
            x = int(-900 * (1 - k)) + 40
            d = ImageDraw.Draw(fr, "RGBA")
            d.rounded_rectangle((x, 140, x + 1000, 300), 16, fill=col + (235,))
            d.rounded_rectangle((x, 140, x + 1000, 300), 16, outline=(255, 255, 255, 90), width=3)
            d.text((x + 30, 178), lab, font=F_BL, fill=(255, 255, 255, 210), anchor="lm")
            d.text((x + 30, 245), title, font=F_BT, fill=(255, 255, 255), anchor="lm")


# ---------------------------------------------------------------- helpers
def kb(img, t, t0, t1, z0, z1, fx=0.5, fy=0.5, shake=0.0):
    """Ken-Burns crop of a plate (plate larger than frame)."""
    p = ease((t - t0) / max(t1 - t0, 1e-3))
    z = z0 + (z1 - z0) * p
    iw, ih = img.size
    cw, ch = W / z, H / z  # plates are >= frame size; z=1 shows a frame-sized window
    cx = (iw - cw) * fx + cw / 2 + 7 * math.sin(t * 0.71)
    cy = (ih - ch) * fy + ch / 2 + 6 * math.sin(t * 0.53 + 1.3)
    if shake:
        cx += random.uniform(-shake, shake)
        cy += random.uniform(-shake, shake)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.transform((W, H), Image.EXTENT, box, Image.BILINEAR)


def darken(fr, k):
    if k >= 0.999:
        return fr
    return Image.eval(fr, lambda v: int(v * k))


def glitch(fr, amount, seed):
    rnd = random.Random(seed)
    a = np.asarray(fr).copy()
    sh = int(18 * amount)
    if sh:
        a[..., 0] = np.roll(a[..., 0], sh, axis=1)
        a[..., 2] = np.roll(a[..., 2], -sh, axis=1)
    for _ in range(int(10 * amount)):
        y = rnd.randrange(0, H - 80)
        h = rnd.randrange(8, 80)
        a[y:y + h] = np.roll(a[y:y + h], rnd.randrange(-120, 120), axis=1)
    return Image.fromarray(a)


# ---------------------------------------------------------------- phone UI
F_PH_T = font("Inter-Bold.otf", 30)
F_PH_S = font("Inter-Medium.otf", 22)
F_MSG = font("Inter-Medium.otf", 28)
F_MSG_N = font("Inter-Bold.otf", 22)
BG_BLUR = PL["landing"].filter(ImageFilter.GaussianBlur(28))
BG_BLUR = Image.eval(BG_BLUR, lambda v: int(v * 0.35))
BG_BLUR_NIGHT = PL["home_door"].resize((W, H)).filter(ImageFilter.GaussianBlur(24))
BG_BLUR_NIGHT = Image.eval(BG_BLUR_NIGHT, lambda v: int(v * 0.6))
PX0, PY0, PX1, PY1 = 250, 170, 830, 800


def wrap(text, fnt, maxw):
    out, cur = [], ""
    for w in text.split(" "):
        test = (cur + " " + w).strip()
        if fnt.getlength(test) > maxw and cur:
            out.append(cur)
            cur = w
        else:
            cur = test
    out.append(cur)
    return out


def phone_frame(base, title, status, status_col, avatar):
    fr = base.copy()
    d = ImageDraw.Draw(fr, "RGBA")
    d.rounded_rectangle((PX0 - 16, PY0 - 16, PX1 + 16, PY1 + 16), 60, fill=(14, 14, 16))
    d.rounded_rectangle((PX0, PY0, PX1, PY1), 46, fill=(236, 233, 240))
    d.rounded_rectangle((PX0, PY0, PX1, PY0 + 120), 46, fill=(255, 255, 255))
    d.rectangle((PX0, PY0 + 70, PX1, PY0 + 120), fill=(255, 255, 255))
    d.line((PX0, PY0 + 120, PX1, PY0 + 120), fill=(210, 206, 214), width=2)
    d.ellipse((PX0 + 24, PY0 + 34, PX0 + 84, PY0 + 94), fill=avatar[1])
    d.text((PX0 + 54, PY0 + 64), avatar[0], font=F_PH_T, fill=(255, 255, 255), anchor="mm")
    d.text((PX0 + 100, PY0 + 50), title, font=F_PH_T, fill=(20, 20, 24), anchor="lm")
    d.text((PX0 + 100, PY0 + 86), status, font=F_PH_S, fill=status_col, anchor="lm")
    return fr, d


def bubble(d, y, name, lines, mine=False, col=(255, 255, 255), txtcol=(20, 20, 24), alpha=255, name_col=(60, 110, 220), bars=0):
    bw = 440
    x = PX1 - bw - 24 if mine else PX0 + 24
    h = 24 + (34 if name else 0) + 38 * len(lines) + bars * 34 + 18
    d.rounded_rectangle((x, y, x + bw, y + h), 22, fill=col + (alpha,))
    yy = y + 18
    if name:
        d.text((x + 22, yy), name, font=F_MSG_N, fill=name_col + (alpha,))
        yy += 34
    for ln in lines:
        d.text((x + 22, yy), ln, font=F_MSG, fill=txtcol + (alpha,))
        yy += 38
    for i in range(bars):
        d.rounded_rectangle((x + 22, yy + 8, x + 22 + (330 if i % 2 == 0 else 270), yy + 26), 9, fill=(170, 170, 178, alpha))
        yy += 34
    return y + h + 16


SVETA_SHOW, SVETA_DEL = T(16.0), T(21.3)


def chat_scene(t):
    fr, d = phone_frame(BG_BLUR, "Дом 12 · подъезд 2", "47 участников", (130, 130, 140), ("Д", (90, 150, 110)))
    y = PY0 + 150
    y = bubble(d, y, "Ольга, кв. 51", wrap("Кто опять оставил коляску у лифта?", F_MSG, 390))
    if SVETA_SHOW - 1.1 <= t < SVETA_SHOW:
        d.rounded_rectangle((PX0 + 24, y, PX0 + 330, y + 64), 22, fill=(255, 255, 255))
        d.text((PX0 + 46, y + 32), "Света печатает", font=F_PH_S, fill=(200, 60, 120), anchor="lm")
        for j in range(3):
            ph = (t * 3 - j * 0.3) % 1.0
            rr = 5 + 3 * max(0.0, math.sin(ph * math.pi))
            cxp = PX0 + 250 + j * 22
            d.ellipse((cxp - rr, y + 32 - rr, cxp + rr, y + 32 + rr), fill=(200, 60, 120))
    if t >= SVETA_SHOW:
        k = ease((t - SVETA_SHOW) / 0.3)
        yy = y + int(40 * (1 - k))
        if t < SVETA_DEL:
            lines = wrap("Если он с вами заговорит — проверьте 4 вещи:", F_MSG, 390)
            bubble(d, yy, "Света, кв. 48", lines, alpha=int(255 * k), name_col=(200, 60, 120), bars=4)
        else:
            k2 = ease((t - SVETA_DEL) / 0.25)
            bubble(d, yy, "Света, кв. 48", ["⊘  Сообщение удалено"], col=(225, 222, 230), txtcol=(120, 120, 128), name_col=(200, 60, 120))
    return fr


N_SHOW = T(60.1)
M1, M2 = T(61.6), T(63.35)


def phone2_scene(t):
    fr, d = phone_frame(BG_BLUR_NIGHT, "Витя (сосед)", "в сети", (40, 160, 80), ("В", (150, 100, 70)))
    y = PY0 + 160
    d.text(((PX0 + PX1) / 2, y), "Сегодня", font=F_PH_S, fill=(130, 130, 140), anchor="mm")
    y += 40
    if t >= M1:
        k = ease((t - M1) / 0.3)
        y = bubble(d, y + int(30 * (1 - k)), None, wrap("Я в больнице с прошлой недели.", F_MSG, 390), alpha=int(255 * k))
    if t >= M2:
        k = ease((t - M2) / 0.3)
        y = bubble(d, y + int(30 * (1 - k)), None, wrap("Кто у вас на площадке?", F_MSG, 390), alpha=int(255 * k),
                   col=(255, 235, 235), txtcol=(170, 20, 30))
    if N_SHOW - 0.6 <= t < M1:  # incoming notification banner
        k = ease((t - (N_SHOW - 0.6)) / 0.3)
        yb = int(PY0 - 120 + 160 * k)
        d.rounded_rectangle((PX0 + 20, yb, PX1 - 20, yb + 100), 24, fill=(250, 250, 252, 245))
        d.text((PX0 + 50, yb + 32), "Витя (сосед)", font=F_MSG_N, fill=(20, 20, 24))
        d.text((PX0 + 50, yb + 62), "Новое сообщение", font=F_PH_S, fill=(110, 110, 120))
    return fr


# ---------------------------------------------------------------- end card
F_END1 = font("Inter-Black.otf", 92)
F_END2 = font("Inter-ExtraBold.otf", 52)
F_END3 = font("Inter-Bold.otf", 40)
END_BG = Image.eval(PL["home_door"].resize((W, H)).filter(ImageFilter.GaussianBlur(6)), lambda v: int(v * 0.32))


def end_scene(t):
    fr = END_BG.copy()
    d = ImageDraw.Draw(fr, "RGBA")
    a0 = 75.4
    k1 = ease((t - a0 - 0.6) / 0.3)
    d.text((W / 2, 250), "ОТКРЫТЬ", font=F_END1, fill=(255, 255, 255, int(255 * k1)), anchor="mm",
           stroke_width=6, stroke_fill=(0, 0, 0, int(255 * k1)))
    d.text((W / 2, 360), "ИЛИ НЕТ?", font=F_END1, fill=(255, 59, 59, int(255 * k1)), anchor="mm",
           stroke_width=6, stroke_fill=(0, 0, 0, int(255 * k1)))
    k2 = ease((t - a0 - 1.3) / 0.3)
    for i, (lab, col) in enumerate((("ОТКРЫТЬ", (46, 170, 80)), ("НЕ ОТКРЫВАТЬ", (200, 40, 50)))):
        x0 = 120 + i * 440
        yb = 470 + int(30 * (1 - k2))
        d.rounded_rectangle((x0, yb, x0 + 400, yb + 110), 55, fill=col + (int(255 * k2),))
        d.text((x0 + 200, yb + 55), lab, font=F_END3, fill=(255, 255, 255, int(255 * k2)), anchor="mm")
    k3 = ease((t - a0 - 2.3) / 0.3)
    d.text((W / 2, 660), "ПИШИ В КОММЕНТАРИЯХ", font=F_END2, fill=(255, 214, 10, int(255 * k3)), anchor="mm")
    k4 = ease((t - a0 - 3.2) / 0.3)
    d.rounded_rectangle((300, 750, 780, 840), 18, fill=(235, 40, 60, int(255 * k4)))
    d.text((W / 2, 795), "ЧАСТЬ 2 — СКОРО", font=F_END3, fill=(255, 255, 255, int(255 * k4)), anchor="mm")
    return fr


# ---------------------------------------------------------------- scene renderer
FLASH_BUB = font("Inter-Black.otf", 64)


def cam(t, t0, t1, z0, z1, cx0, cy0, cx1=None, cy1=None):
    """Camera over the 1080x1920 world: returns (bx0, by0, z)."""
    p = ease((t - t0) / max(t1 - t0, 1e-3))
    z = z0 + (z1 - z0) * p
    cx = cx0 + ((cx1 if cx1 is not None else cx0) - cx0) * p + 6 * math.sin(t * 0.71) / z
    cy = cy0 + ((cy1 if cy1 is not None else cy0) - cy0) * p + 5 * math.sin(t * 0.53 + 1.3) / z
    w, h = W / z, H / z
    bx0 = min(max(cx - w / 2, 0), W - w)
    by0 = min(max(cy - h / 2, 0), H - h)
    return bx0, by0, z


def world_bg(plate, c, shake=0.0):
    bx0, by0, z = c
    if shake:
        bx0 += random.uniform(-shake, shake) / z
        by0 += random.uniform(-shake, shake) / z
    box = (bx0 * RW, by0 * RW, (bx0 + W / z) * RW, (by0 + H / z) * RW)
    return plate.transform((W, H), Image.EXTENT, box, Image.BILINEAR)


def draw_chars(fr, c, fn, clip=None):
    """fn(d, M) where M(x, y, s) -> (ox, oy, s) in 2x supersampled screen space."""
    bx0, by0, z = c
    lay = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay, "RGBA")
    fn(d, lambda x, y, s: ((x - bx0) * z * 2, (y - by0) * z * 2, s * z * 2))
    lay = lay.reduce(2)
    if clip is not None:
        m = Image.new("L", (W, H), 0)
        x0, y0, x1, y1 = clip
        ImageDraw.Draw(m).rectangle(((x0 - bx0) * z, (y0 - by0) * z, (x1 - bx0) * z, (y1 - by0) * z), fill=255)
        a = lay.getchannel("A")
        lay.putalpha(Image.composite(a, m, m))
    base = fr.convert("RGBA")
    base.alpha_composite(lay)
    return base.convert("RGB")


NB = dict(x=540, y=1480, s=1.0)  # neighbour stands here in the stairwell world


def nb_pose(t, **kw):
    p = dict(breathe=4 * math.sin(t * 1.6))
    p.update(kw)
    return p


# peephole fisheye maps (computed once)
PN, PSRC = 940, 1300
_yy, _xx = np.mgrid[0:PN, 0:PN].astype(np.float32)
_u, _v = (_xx - PN / 2) / (PN / 2), (_yy - PN / 2) / (PN / 2)
_r = np.sqrt(_u ** 2 + _v ** 2)
_rs = _r * (0.58 + 0.42 * _r ** 2) + 1e-6
PSX = np.clip((_u / np.maximum(_r, 1e-6) * _rs * 0.5 + 0.5) * (PSRC - 1), 0, PSRC - 1).astype(np.int32)
PSY = np.clip((_v / np.maximum(_r, 1e-6) * _rs * 0.5 + 0.5) * (PSRC - 1), 0, PSRC - 1).astype(np.int32)
PMASK = (np.clip((1.0 - _r) * 60, 0, 1) * (1.12 - 0.8 * np.clip(_r, 0, 1) ** 2))[..., None]
PTINT = np.array([1.0, 0.8, 0.46])
_pbg = WORLD["stair"].crop((int(220 * RW), int(250 * RW), int(860 * RW), int(890 * RW))).resize((PSRC, PSRC))
PEEP_BG = Image.eval(_pbg, lambda v: int(v * 0.55))


def peephole_frame(t, s0, s1):
    p = ease((t - s0) / (s1 - s0))
    src = PEEP_BG.copy().convert("RGBA")
    lay = Image.new("RGBA", (PSRC, PSRC), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay, "RGBA")
    tk = talk_at(t)
    C.neighbor(d, PSRC / 2 + 20 * math.sin(t * 0.4), PSRC * 0.5 + 900 * 1.55 - 40, 1.55,
               nb_pose(t, wide=0.6 + 0.4 * p, grin=0.12 + 0.38 * p + 0.12 * tk, gaze=(0, 0.2)), pal=C.PEEP)
    src.alpha_composite(lay)
    a = np.asarray(src.convert("RGB")).astype(np.float32)
    fish = a[PSY, PSX]
    fish = (fish.mean(2, keepdims=True) * 0.5 + fish * 0.5) * PTINT * PMASK
    fish *= 0.88 + 0.12 * math.sin(t * 9.0) * math.sin(t * 3.1)
    fr = np.zeros((H, W, 3), np.float32)
    zz = 1.0 + 0.25 * p
    n = int(PN * zz)
    fimg = Image.fromarray(np.clip(fish, 0, 255).astype(np.uint8)).resize((n, n), Image.BILINEAR)
    out = Image.new("RGB", (W, H), (0, 0, 0))
    out.paste(fimg, ((W - n) // 2, 620 - n // 2))
    dd = ImageDraw.Draw(out)
    cx, cy = W // 2, 620
    dd.ellipse((cx - n // 2 - 8, cy - n // 2 - 8, cx + n // 2 + 8, cy + n // 2 + 8), outline=(34, 28, 22), width=16)
    return out


def scene_frame(t):
    for s0, s1, name in SCENES:
        if s0 <= t < s1:
            break
    lt = t - s0
    if name == "landing":
        c = cam(t, 0, 5.3, 1.0, 1.35, 540, 900, 540, 760)
        fr = world_bg(WORLD["stair"], c)
        wide = 0.15 + 0.5 * ease((t - 3.4) / 0.6)
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(NB["x"], NB["y"], NB["s"]),
                                                       nb_pose(t, wide=wide, smile=0.15)))
        if 3.05 < t < 3.25 or 3.4 < t < 3.47:
            fr = darken(fr, 0.45)
    elif name == "face_med":
        c = cam(t, s0, s1, 2.5, 2.75, 540, 760)
        fr = world_bg(WORLD["stair"], c)
        tk = talk_at(t)
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(NB["x"], NB["y"], NB["s"]),
                                                       nb_pose(t, wide=0.55, talk=tk, smile=0.25)))
    elif name == "doorplate":
        fr = kb(PL["doorplate"], t, s0, s1, 1.0, 1.3, 0.5, 0.42)
    elif name == "flashback":
        c = cam(t, s0, s1, 1.2, 1.05, 540, 820)
        fr = world_bg(WORLD["stair_warm"], c)
        wv = ease((t - (s0 + 0.4)) / 0.5)
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(NB["x"], NB["y"], NB["s"]),
                                                       nb_pose(t, happy=1, smile=1, wave=wv, wave_t=t), pal=C.WARM))
        if t >= T(11.6):
            k = ease((t - T(11.6)) / 0.2)
            d = ImageDraw.Draw(fr, "RGBA")
            bx, by = 600, 300 - int(20 * k)
            d.rounded_rectangle((bx, by, bx + 360, by + 130), 40, fill=(255, 255, 255, int(240 * k)), outline=(30, 30, 30, int(255 * k)), width=5)
            d.polygon([(bx + 60, by + 125), (bx + 20, by + 190), (bx + 120, by + 125)], fill=(255, 255, 255, int(240 * k)))
            d.text((bx + 180, by + 65), "Доброе!", font=FLASH_BUB, fill=(30, 30, 30, int(255 * k)), anchor="mm")
    elif name == "chat":
        fr = chat_scene(t)
    elif name == "sign1":
        c = cam(t, s0, s1, 3.0, 3.5, 540, 665)
        fr = world_bg(WORLD["stair"], c, shake=1.5)
        p = ease((t - s0) / (s1 - s0))
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(NB["x"], NB["y"], NB["s"]),
                                                       nb_pose(t, wide=0.8 + 0.2 * p, smile=0.1, dark_eyes=0.35 * p)))
        sw0 = T(27.5)
        if t >= sw0:
            keys = [(sw0, 0), (T(28.0), 20), (T(28.7), 40), (T(29.9), 60)]
            v = 60
            for (ta, va), (tb, vb) in zip(keys, keys[1:]):
                if ta <= t < tb:
                    v = va + (vb - va) * (t - ta) / (tb - ta)
                    break
            v = int(v)
            d = ImageDraw.Draw(fr, "RGBA")
            d.rounded_rectangle((330, 340, 750, 470), 24, fill=(10, 10, 14, 200), outline=(255, 59, 59, 230), width=4)
            d.text((540, 405), f"00:{v:02d}" if v < 60 else "01:00", font=font("Inter-Black.otf", 84),
                   fill=(255, 59, 59) if v >= 60 else (255, 255, 255), anchor="mm")
    elif name == "dog":
        c = cam(t, s0, s1, 1.0, 1.08, 540, 900, 470, 860)
        fr = world_bg(WORLD["doghall"], c)
        tr = 3.0 * math.sin(t * 47) + 1.5 * math.sin(t * 31)
        ear = max(0.0, math.sin(t * 2.3)) ** 6

        def fn(d, M):
            C.neighbor(d, *M(930, 1000, 0.62), nb_pose(t, wide=0.6))
            C.dog(d, *M(300, 1000, 1.0), tremble=tr, ear=ear, look=1.0)
        fr = draw_chars(fr, c, fn)
    elif name == "reflection":
        tz = T(42.7)
        if t < tz:
            c = cam(t, s0, tz, 1.0, 1.08, 540, 960)
        else:
            c = cam(t, tz, tz + 0.7, 1.08, 1.6, 540, 960, 790, 900)
        fr = world_bg(WORLD["entrance"], c)
        t_real, t_refl = T(41.2), T(43.2)
        tr_real = -0.9 * ease((t - t_real) / 0.4)
        tr_refl = -0.9 * ease((t - t_refl) / 0.4)
        gz_real = (-1.0 * ease((t - t_real) / 0.4), 0)
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(800, 1505, 0.82),
                        nb_pose(t, turn=tr_refl, wide=0.7 if t < t_refl else 0.3, smile=0.35 if t < t_refl else 0.0,
                                gaze=(tr_refl, 0)), pal=C.GHOST, alpha=150), clip=C.GLASS)
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(300, 1600, 0.95),
                        nb_pose(t, turn=tr_real, gaze=gz_real, wide=0.2)))
    elif name in ("home", "knock"):
        sh = 0
        for kt in KNOCKS[:3]:
            if 0 <= t - kt < 0.25:
                sh = 22 * (1 - (t - kt) / 0.25)
        fr = kb(PL["home_door"], t, 46.6, 55.0, 1.0, 1.25, 0.5, 0.35, shake=sh)
        if name == "knock":
            fr = darken(fr, 0.75)
    elif name == "peephole":
        fr = peephole_frame(t, s0, s1)
    elif name in ("reveal", "black"):
        if name == "black" and lt >= 0.6:
            return Image.new("RGB", (W, H), (0, 0, 0)), name
        c = cam(t, 63.2, 67.0, 3.2, 3.6, 540, 690)
        fr = world_bg(WORLD["stair_dark"], c, shake=5)
        fr = draw_chars(fr, c, lambda d, M: C.neighbor(d, *M(NB["x"], NB["y"], NB["s"]),
                        nb_pose(t, wide=1.0, grin=1.0, dark_eyes=1.0, gaze=(0.3 * math.sin(t * 13), 0)), pal=C.CREEPY))
        if name == "reveal" and (lt < 0.35 or 1.9 < lt < 2.05):
            fr = glitch(fr, 1.0, int(t * 30))
        if name == "black":
            fr = glitch(fr, 1.0, int(t * 30))
            if int(t * 30) % 2:
                fr = darken(fr, 0.3)
    elif name == "phone2":
        fr = phone2_scene(t)
    else:
        fr = end_scene(t)
    return fr, name


# ---------------------------------------------------------------- post FX
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = np.clip(1.15 - 0.55 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2), 0.35, 1.0)[..., None]
rng = np.random.default_rng(1)
GRAIN = [rng.normal(0, 4.5, (H // 2, W // 2, 1)).astype(np.float32).repeat(2, 0).repeat(2, 1) for _ in range(6)]


def post(fr, i):
    a = np.asarray(fr).astype(np.float32)
    a = a * VIG + GRAIN[i % 6]
    return np.clip(a, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- caption overlay
def draw_caption(fr, t):
    for a, b, spr in CAP_SPR:
        if a <= t < b:
            x = min(max((t - a) / 0.16, 0.0), 1.0)
            c1, c3 = 1.9, 2.9
            k = 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2  # easeOutBack
            sc = 0.78 + 0.22 * k
            s = spr if sc > 0.999 else spr.resize((int(spr.width * sc), int(spr.height * sc)), Image.BILINEAR)
            fr.paste(s, (int((W - s.width) / 2), int(CAP_Y - s.height / 2)), s)


_pr = np.random.default_rng(5)
DUST = _pr.random((70, 5))  # x, y, size, speed, phase
SNOW = _pr.random((110, 5))
DUST_SCENES = {"landing": (235, 245, 240), "face_med": (235, 245, 240), "flashback": (255, 225, 160),
               "sign1": (235, 245, 240), "doorplate": (255, 225, 180)}
CUTS = [s0 for s0, _, _ in SCENES[1:]]


def particles(fr, t, name):
    d = ImageDraw.Draw(fr, "RGBA")
    if name in DUST_SCENES:
        col = DUST_SCENES[name]
        for x, y, sz, sp, ph in DUST:
            px = (x * W + 40 * math.sin(t * (0.3 + sp) + ph * 6)) % W
            py = (y * H - t * (8 + 18 * sp)) % H
            r = 1.5 + sz * 3.5
            a = int(60 + 90 * (0.5 + 0.5 * math.sin(t * 1.7 + ph * 9)))
            d.ellipse((px - r * 2, py - r * 2, px + r * 2, py + r * 2), fill=col + (a // 5,))
            d.ellipse((px - r, py - r, px + r, py + r), fill=col + (a,))
    if name == "reflection":  # snow behind the glass + light drift in the hall
        for x, y, sz, sp, ph in SNOW:
            px = 560 + (x * 420 + 25 * math.sin(t * 0.8 + ph * 7))
            py = (y * 1100 + t * (40 + 60 * sp)) % 1100 + 380
            r = 1.5 + sz * 3
            d.ellipse((px - r, py - r, px + r, py + r), fill=(235, 240, 255, 150))


def flicker(t, name):
    if name in ("landing", "face_med", "sign1", "dog", "reflection"):
        n = math.sin(t * 37.0) * math.sin(t * 11.3 + 1.0)
        return 0.96 + 0.04 * n - (0.25 if (int(t * 60) % 157) < 2 else 0.0)
    if name == "peephole":
        return 0.9 + 0.1 * math.sin(t * 9.0) * math.sin(t * 3.1)
    return 1.0


def render_frame(t, i):
    fr, name = scene_frame(t)
    fr = fr.convert("RGB")
    particles(fr, t, name)
    g = flicker(t, name)
    for c in CUTS:  # quick dip to black on every cut
        dt = abs(t - c)
        if dt < 0.09:
            g *= 0.25 + 0.75 * (dt / 0.09)
    if g < 0.999:
        fr = Image.eval(fr, lambda v, g=g: int(v * g))
    if name not in ("end",):
        if name != "black":
            draw_hud(fr, t)
            draw_banner(fr, t)
        draw_caption(fr, t)
    # fade in / transitions to black
    if t < 0.25:
        fr = darken(fr, t / 0.25)
    return post(fr, i)


# ---------------------------------------------------------------- audio
SR = 48000


def decode(path, extra_af=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path]
    if extra_af:
        cmd += ["-af", extra_af]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()


def build_audio():
    n = int(END * SR)
    mix = np.zeros(n, np.float32)

    def place(sig, at, gain=1.0):
        s = int(at * SR)
        e = min(n, s + len(sig))
        if e > s:
            mix[s:e] += sig[: e - s] * gain

    nar = decode(os.path.join(AUD, "narration.mp3"))
    for a, b, o in PIECES:
        seg = nar[int(a * SR): int(b * SR)]
        place(seg, a + o, 1.0)
    nb_room = decode(os.path.join(AUD, "neighbor.mp3"), "aecho=0.8:0.6:35:0.25")
    place(nb_room[: int(2.2 * SR)], NB1_AT, 0.95)
    nb_door = decode(os.path.join(AUD, "neighbor.mp3"), "lowpass=f=1400,aecho=0.8:0.7:45|90:0.35|0.2,volume=1.6")
    place(nb_door[int(4.2 * SR):], NB2_AT, 1.0)

    t = np.arange(n) / SR
    r = np.random.default_rng(7)
    # room tone
    noise = r.normal(0, 1, n).astype(np.float32)
    k = np.exp(-2 * np.pi * 300 / SR)
    room = np.zeros(n, np.float32)
    acc = 0.0
    # simple one-pole low-pass via cumulative filter (vectorised approx with lfilter-like loop in chunks)
    from itertools import accumulate
    room = np.array(list(accumulate(noise, lambda y, x: y * k + x * (1 - k))), np.float32)
    mix += room * 0.035
    # fluorescent hum on landing-ish scenes
    hum = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.25 * np.sin(2 * np.pi * 300 * t)) * 0.006
    env = np.zeros(n, np.float32)
    for a, b in ((0, 10.8), (25.6, 46.6)):
        env[int(a * SR): int(b * SR)] = 1
    mix += hum * env
    # rising drone
    dr = (np.sin(2 * np.pi * 49 * t) + np.sin(2 * np.pi * 51.3 * t) + 0.4 * np.sin(2 * np.pi * 98 * t)) * 0.5
    denv = 0.010 + 0.035 * np.clip((t - 25) / 48, 0, 1)
    denv[(t >= 73.9) & (t < 75.4)] = 0
    mix += (dr * denv).astype(np.float32)

    def knock():
        L = int(0.35 * SR)
        tt = np.arange(L) / SR
        s = np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 22) * 0.9
        s += np.sin(2 * np.pi * 210 * tt) * np.exp(-tt * 35) * 0.4
        nz = r.normal(0, 1, L) * np.exp(-tt * 90) * 0.35
        return (s + nz).astype(np.float32)

    for kt in KNOCKS:
        place(knock(), kt, 0.9 if kt < 70 else 1.1)

    def ding():
        L = int(0.6 * SR)
        tt = np.arange(L) / SR
        s = np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) + 0.6 * np.sin(2 * np.pi * 1760 * np.clip(tt - 0.09, 0, None)) * np.exp(-np.clip(tt - 0.09, 0, None) * 9) * (tt > 0.09)
        return (s * 0.18).astype(np.float32)

    place(ding(), SVETA_SHOW)
    place(ding(), N_SHOW - 0.6)

    def click(freq=2600, dur=0.06, g=0.25):
        L = int(dur * SR)
        tt = np.arange(L) / SR
        return ((r.normal(0, 1, L) * np.exp(-tt * 150) + np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 60)) * g).astype(np.float32)

    sw0 = T(27.5)
    x = sw0
    while x < T(30.4):
        place(click(3200, 0.03, 0.12), x)
        x += 0.25
    place(click(2400, 0.08, 0.35), T(46.0))
    place(click(2100, 0.08, 0.35), T(46.6))

    def boom(g=0.5):
        L = int(1.4 * SR)
        tt = np.arange(L) / SR
        f = 70 * np.exp(-tt * 1.5) + 30
        ph = 2 * np.pi * np.cumsum(f) / SR
        s = np.sin(ph) * np.exp(-tt * 2.8) + r.normal(0, 1, L) * np.exp(-tt * 18) * 0.25
        return (s * g).astype(np.float32)

    for a, *_ in BANNERS:
        place(boom(0.45 if a < 60 else 0.7), a)
    place(boom(0.5), 0.0)

    def glitch_snd(dur):
        L = int(dur * SR)
        s = r.normal(0, 1, L).astype(np.float32)
        gate = np.repeat(r.random(L // 800 + 1) > 0.45, 800)[:L]
        s = np.round(s * 4) / 4 * gate
        return s * 0.12

    place(glitch_snd(0.35), 63.2)
    place(glitch_snd(0.15), 65.1)
    place(glitch_snd(0.6), 73.3)

    # soft limiter
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    mix *= 0.89 / max(np.max(np.abs(mix)), 1e-6)
    path = os.path.join(ROOT, "mix.wav")
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print("audio ok, raw peak", peak)
    return path


# ---------------------------------------------------------------- main
if __name__ == "__main__":
    if PREVIEW:
        times = [float(x) for x in sys.argv[sys.argv.index("--preview") + 1].split(",")]
        gif = Image.open(os.path.join(ROOT, "..", "banner", "cashworms_banner.gif"))

        def with_banner(arr, tt):
            gif.seek(int((tt % 13.2) * 50) % gif.n_frames)
            im = Image.fromarray(arr).convert("RGBA")
            im.alpha_composite(gif.convert("RGBA"), (0, BAN_Y))
            return im.convert("RGB")
        ims = [with_banner(render_frame(tt, i), tt).resize((270, 480)) for i, tt in enumerate(times)]
        cols = 6
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (270 * cols, 480 * rows))
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % cols) * 270, (i // cols) * 480))
        sheet.save(sys.argv[-1])
        sys.exit()
    wav = build_audio()
    out = os.path.join(OUTDIR, "sosed_ne_chelovek_ch1.mp4")
    gif = os.path.join(ROOT, "..", "banner", "cashworms_banner.gif")
    out = os.path.join(OUTDIR, "sosed_ne_chelovek_ch1_cashworms_v2.mp4")
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-stream_loop", "-1", "-i", gif,
           "-i", wav,
           "-filter_complex",
           f"[1:v]fps={FPS},format=rgba[b];[0:v][b]overlay=0:{BAN_Y}:shortest=1:format=auto,format=yuv420p[v];"
           "[2:a]acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=4,"
           "loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[a]",
           "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-maxrate", "16M", "-bufsize", "32M",
           "-profile:v", "high", "-r", str(FPS),
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    nf = int(END * FPS)
    for i in range(nf):
        p.stdin.write(render_frame(i / FPS, i).tobytes())
        if i % 300 == 0:
            print("frame", i, "/", nf, flush=True)
    p.stdin.close()
    p.wait()
    print("done", out)
