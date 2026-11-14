# Word-by-word captions burned onto a rendered JPEG sequence, timed to words.json.
# Look: one word at a time (short function words ride with the next one), extra-bold sans in capitals, white fill,
# thick dark-plum outline (the characters' ink colour), soft drop shadow, key words in warm yellow, and a springy
# pop on every new word (scale 0.78 -> 1.08 -> 1.0 over ~5 frames, fade in over 2 frames). Supersampled 2x.
# usage: python3 scripts/subtitles.py <frames dir> <words.json> <out dir> [fps] [highlight stems, comma-separated]
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

src, words_p, out = sys.argv[1:4]
FPS = float(sys.argv[4]) if len(sys.argv) > 4 else 30.0
HL = [s.strip().upper() for s in (sys.argv[5] if len(sys.argv) > 5 else "").split(",") if s.strip()]
FONT = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
Y = 0.665            # caption centre, fraction of frame height (reference 60-74 %)
SIZE = 0.094         # font size, fraction of frame width
STROKE = 0.0115      # outline width, fraction of frame width
INK, WHITE, GOLD = (36, 23, 38), (255, 255, 255), (255, 214, 74)
GAP_HIDE = 0.35      # a pause longer than this hides the caption 0.12 s after the word ends
SS = 2               # supersampling

W = json.load(open(words_p, encoding="utf-8"))
clean = lambda w: re.sub(r"[.,:;!«»\"]+$", "", re.sub(r"^[«»\"]+", "", w)).upper()
cards, i = [], 0
while i < len(W):
    txt, s, e = clean(W[i]["w"]), W[i]["s"], W[i]["e"]
    while len(re.sub(r"[^А-ЯЁA-Z0-9]", "", txt)) <= 2 and i + 1 < len(W) and W[i + 1]["s"] - e < 0.3:
        i += 1
        txt, e = txt + " " + clean(W[i]["w"]), W[i]["e"]
    cards.append([txt, s, e])
    i += 1
for k, c in enumerate(cards):
    nxt = cards[k + 1][1] if k + 1 < len(cards) else c[2] + 0.4
    c.append(nxt if nxt - c[2] <= GAP_HIDE else c[2] + 0.12)

files = sorted(f for f in os.listdir(src) if f.endswith((".jpeg", ".jpg", ".png")))
os.makedirs(out, exist_ok=True)
w, h = Image.open(os.path.join(src, files[0])).size
base_size = round(SIZE * w)
cache = {}


def sprite(txt):
    """the caption as an RGBA image at 1.0 scale (supersampled), with its shadow; cached per text"""
    if txt in cache:
        return cache[txt]
    size = base_size
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    while probe.textlength(txt, font=ImageFont.truetype(FONT, size)) > 0.86 * w and size > 24:
        size -= 4
    f = ImageFont.truetype(FONT, size * SS)
    sw = round(STROKE * w * SS)
    l, t, r, b = probe.textbbox((0, 0), txt, font=f, stroke_width=sw)
    pad = 40 * SS
    cw, ch = r - l + 2 * pad, b - t + 2 * pad
    gold = any(txt.startswith(p) or (" " + p) in txt for p in HL)
    layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    # soft shadow: the outlined text in dark ink, blurred and pushed down
    sh = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((pad - l, pad - t + 7 * SS), txt, font=f, fill=INK + (150,), stroke_width=sw, stroke_fill=INK + (150,))
    layer.alpha_composite(sh.filter(ImageFilter.GaussianBlur(9 * SS)))
    ImageDraw.Draw(layer).text((pad - l, pad - t), txt, font=f, fill=GOLD if gold else WHITE, stroke_width=sw, stroke_fill=INK)
    cache[txt] = layer
    return layer


def pop(age_frames):
    """springy scale and alpha for the first frames of a word"""
    curve = [0.78, 0.97, 1.08, 1.04, 1.0]
    sc = curve[age_frames] if age_frames < len(curve) else 1.0
    alpha = min(1.0, (age_frames + 1) / 2)
    return sc, alpha


for n, fname in enumerate(files):
    t = n / FPS
    im = Image.open(os.path.join(src, fname)).convert("RGBA")
    card = next((c for c in cards if c[1] - 1 / FPS <= t < c[3]), None)  # appears on the word's first frame
    if card:
        age = int(round((t - (card[1] - 1 / FPS)) * FPS))
        sc, alpha = pop(age)
        spr = sprite(card[0])
        sw_, sh_ = max(1, round(spr.width * sc / SS)), max(1, round(spr.height * sc / SS))
        s2 = spr.resize((sw_, sh_), Image.LANCZOS)
        if alpha < 1:
            a = s2.getchannel("A").point(lambda v: int(v * alpha))
            s2.putalpha(a)
        im.alpha_composite(s2, (round(w / 2 - sw_ / 2), round(Y * h - sh_ / 2)))
    im.convert("RGB").save(os.path.join(out, fname), quality=95)
print(len(files), "frames,", len(cards), "captions,", sum(1 for c in cards if any(c[0].startswith(p) or (' ' + p) in c[0] for p in HL)), "highlighted")
