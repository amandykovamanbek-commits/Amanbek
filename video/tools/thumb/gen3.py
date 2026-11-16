import math
src = open('/home/user/Amanbek/lead/build.py').read()
g = {'math': math}; exec(src[src.index('ICON = {'):src.index('def tool(')], g); tile = g['tile']
K = ['el', 'figma', 'canva', 'vidiq', 'notion', 'github', 'brag', 'docs', 'skill', 'research']
def spark(s, c='#fff', w=20):
    return f'<svg width="{s}" height="{s}" viewBox="-100 -100 200 200">' + ''.join(f'<line x1="0" y1="0" x2="{86*math.cos(a*math.pi/180):.1f}" y2="{86*math.sin(a*math.pi/180):.1f}" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>' for a in [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331]) + '</svg>'
cx, cy = 1010, 380
cab = ic = ''
for i, k in enumerate(K):
    a = -math.pi / 2 + i * 2 * math.pi / 10
    x, y = cx + 215 * math.cos(a), cy + 255 * math.sin(a)
    cab += f'<path d="M{cx} {cy} Q {(cx+x)/2+36*math.sin(a)} {(cy+y)/2-36*math.cos(a)} {x:.0f} {y:.0f}" stroke="#ff7a3c" stroke-width="5" fill="none"/>'
    ic += f'<div style="position:absolute;left:{x-42:.0f}px;top:{y-42:.0f}px;transform:rotate({(i%3-1)*7}deg)">{tile(k,84)}</div>'
F = f'''<div class="dots"></div><div class="halo"></div>
<svg class="cabF" width="1280" height="720">{cab}</svg>{ic}
<div class="coreF">{spark(120)}</div>
<div class="dt"><div class="d1">CLAUDE</div><div class="d2">БЕЗ ЭТОГО</div><div class="d3"><span>ПУСТОЙ</span></div></div>
<div class="pill">10 инструментов</div>'''
style = open('style.css').read() + open('style2.css').read() + '''
.halo{position:absolute;left:760px;top:120px;width:500px;height:520px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,138,76,.45),transparent);filter:blur(20px)}
.cabF{position:absolute;left:0;top:0;filter:drop-shadow(0 0 6px rgba(255,122,60,.7))}
.coreF{position:absolute;left:920px;top:290px;width:180px;height:180px;border-radius:46px;background:linear-gradient(150deg,#f0905f,#c9562c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 90px rgba(255,138,76,.8),inset 0 8px 14px rgba(255,255,255,.35),0 24px 50px rgba(60,40,20,.4)}
.x10{position:absolute;left:1120px;top:590px;padding:6px 20px 10px;border-radius:20px;background:#16110d;font-family:Unb;font-weight:900;font-size:54px;color:#ff8a4c;transform:rotate(-6deg);box-shadow:0 14px 30px rgba(60,40,20,.35)}
.light .dt .d1{font-size:112px}.light .dt .d2{font-size:84px}.light .d3{margin-top:56px}.light .d3 span{font-size:108px}
'''
css = open('/home/user/Amanbek/lead/style.css').read(); tcss = css[css.index('.tile{'):css.index('.tilesrow')]
open('thumbs3.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{style}{tcss}</style></head><body><div class="t light" id="vF">{F}</div></body></html>')
