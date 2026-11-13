import glob, os, sys
from PIL import Image, ImageDraw, ImageFont

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "flow")
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "fonts", "RobotoCondensed-VF.ttf")  # repo-root fonts/
for b in sorted(glob.glob(os.path.join(D, "*.bin"))):
    im = Image.open(b).convert("RGB")
    im.save(b[:-4] + ".png")
    os.remove(b)
pngs = sorted(glob.glob(os.path.join(D, "0*.png")))
tw, th = 480, 268
sheet = Image.new("RGB", (tw * 2 + 30, (th + 40) * (len(pngs) // 2) + 10), (20, 20, 20))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(F, 26)
for k, p in enumerate(pngs):
    im = Image.open(p).resize((tw, th))
    x = 10 + (k % 2) * (tw + 10); y = 10 + (k // 2) * (th + 40)
    sheet.paste(im, (x, y + 30))
    d.text((x, y), os.path.basename(p) + f"  {Image.open(p).size}", font=f, fill=(255, 220, 0))
sheet.save(os.path.join(D, "_contact.jpg"), quality=85)
print("ok", len(pngs))
