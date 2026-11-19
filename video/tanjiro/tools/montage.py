import sys, glob
from PIL import Image, ImageDraw
src, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 3
files = sorted(glob.glob(src + '/*.jpg'))
W, H = 640, 360
per = cols * 4
for p in range(0, len(files), per):
    chunk = files[p:p + per]
    rows = (len(chunk) + cols - 1) // cols
    im = Image.new('RGB', (cols * W, rows * H), 'black')
    d = ImageDraw.Draw(im)
    for i, f in enumerate(chunk):
        t = Image.open(f).resize((W, H))
        im.paste(t, ((i % cols) * W, (i // cols) * H))
        d.text(((i % cols) * W + 8, (i // cols) * H + 6), f.split('/')[-1], fill='yellow')
    im.save(f'{out}_{p // per}.jpg', quality=85)
    print(f'{out}_{p // per}.jpg')
