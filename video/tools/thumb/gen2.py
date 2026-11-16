import math
src = open('/home/user/Amanbek/lead/build.py').read()
g = {'math': math}; exec(src[src.index('ICON = {'):src.index('def tool(')], g); tile = g['tile']
K = ['el', 'figma', 'canva', 'vidiq', 'notion', 'github', 'brag', 'docs', 'skill', 'research']
def spark(s, c='#d97757', w=18):
    return f'<svg width="{s}" height="{s}" viewBox="-100 -100 200 200">' + ''.join(f'<line x1="0" y1="0" x2="{86*math.cos(a*math.pi/180):.1f}" y2="{86*math.sin(a*math.pi/180):.1f}" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>' for a in [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331]) + '</svg>'
lock = '<svg width="50" height="50" viewBox="0 0 24 24"><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="5" y="10.5" width="14" height="10.5" rx="2.6" fill="#fff"/></svg>'
# C: Claude core with 10 tools plugged in by glowing cables
cx, cy, R = 980, 360, 265
cab, ic = '', ''
for i, k in enumerate(K):
    a = -math.pi / 2 + i * 2 * math.pi / 10
    x, y = cx + 250 * math.cos(a), cy + R * math.sin(a)
    cab += f'<path d="M{cx} {cy} Q {(cx+x)/2+40*math.sin(a)} {(cy+y)/2-40*math.cos(a)} {x} {y}" stroke="#ff8a4c" stroke-width="5" fill="none" opacity=".75"/>'
    ic += f'<div style="position:absolute;left:{x-44}px;top:{y-44}px;transform:rotate({(i%3-1)*6}deg)">{tile(k,88)}</div>'
C = f'''<div class="glowc"></div>
<svg class="cab" width="1280" height="720">{cab}</svg>{ic}
<div class="core">{spark(150, '#fff', 20)}</div>
<div class="ctext"><div class="c1">ПРОКАЧАЙ</div><div class="c2">CLAUDE</div><div class="c3">×10</div></div>'''
# D: light, bold, hand-drawn
icD = ''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;transform:rotate({r}deg)">{tile(k,s)}</div>' for k, x, y, r, s in [('el', 860, 70, -10, 120), ('figma', 1040, 110, 8, 110), ('canva', 930, 230, 6, 130), ('vidiq', 1110, 290, -8, 110), ('notion', 830, 380, -6, 110), ('github', 1000, 430, 10, 120), ('brag', 1140, 520, -4, 100), ('docs', 880, 560, 8, 110), ('skill', 1020, 600, -12, 90), ('research', 760, 520, 4, 90)])
D = f'''<div class="dots"></div>{icD}
<div class="dt"><div class="d1">CLAUDE</div><div class="d2">БЕЗ ЭТОГО</div><div class="d3"><span>ПУСТОЙ</span></div></div>
<svg class="arr" width="260" height="200"><path d="M10 170 C 80 190, 170 150, 220 50" stroke="#ff3d2e" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M188 62 L224 40 L238 82" stroke="#ff3d2e" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
<div class="pill">10 инструментов</div>'''
# E: battery before/after
E = f'''<div class="glowe"></div>
<div class="et">ПОДКЛЮЧИ ЭТО</div>
<div class="bat b0"><div class="lab">{spark(56, '#8a8a8f', 16)}<span>обычный</span></div><div class="cell"><i style="width:9%;background:#ff3b30"></i></div><b class="pc gray">9%</b></div>
<div class="bat b1"><div class="lab">{spark(56)}<span>с инструментами</span></div><div class="cell on"><i style="width:100%"></i></div><b class="pc">100%</b></div>
<div class="erow">{''.join(tile(k, 84) for k in K)}<div class="lk">{lock}</div></div>'''
style = open('style.css').read() + open('style2.css').read()
css = open('/home/user/Amanbek/lead/style.css').read(); tcss = css[css.index('.tile{'):css.index('.tilesrow')]
open('thumbs2.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{style}{tcss}</style></head><body><div class="t" id="vC">{C}</div><div class="t light" id="vD">{D}</div><div class="t" id="vE">{E}</div></body></html>')
