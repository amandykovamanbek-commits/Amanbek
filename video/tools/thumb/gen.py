import math
src = open('/home/user/Amanbek/lead/build.py').read()
g = {'math': math}
exec(src[src.index('ICON = {'):src.index('def tool(')], g)
tile = g['tile']
tiles = ''.join(tile(k, 112) for k in ['el', 'figma', 'canva', 'vidiq', 'notion', 'github', 'brag', 'docs', 'skill', 'research'])
spark = '<svg width="74" height="74" viewBox="-100 -100 200 200">' + ''.join(f'<line x1="0" y1="0" x2="{86*math.cos(a*math.pi/180):.1f}" y2="{86*math.sin(a*math.pi/180):.1f}" stroke="#d97757" stroke-width="18" stroke-linecap="round"/>' for a in [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331]) + '</svg>'
css = open('/home/user/Amanbek/lead/style.css').read()
tcss = css[css.index('.tile{'):css.index('.tilesrow')]
lock = '<svg width="54" height="54" viewBox="0 0 24 24"><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" stroke="#ffe1db" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="5" y="10.5" width="14" height="10.5" rx="2.6" fill="#ffe1db"/></svg>'
A = f'''<div class="glow"></div><div class="grid"></div>
<div class="title"><div class="l1">БЕЗ ЭТОГО</div><div class="l2"><span class="cl">{spark}CLAUDE</span></div><div class="l3">ПУСТОЙ</div></div>
<div class="tiles">{tiles}<div class="lk">{lock}<b>11</b></div></div>
<div class="badge">10 инструментов</div>'''
B = f'''<div class="glow b"></div><div class="grid"></div>
<div class="split"><div class="side off"><small>БЕЗ ИНСТРУМЕНТОВ</small><div class="bubble">Вот советы, как сделать видео самому: 1. Выберите редактор…</div><div class="big g">СОВЕТУЕТ</div></div>
<div class="side on"><small>С НИМИ</small><div class="ring">{tiles}</div><div class="big o">ДЕЛАЕТ</div></div></div>
<div class="top">ТВОЙ {spark} CLAUDE ПУСТОЙ?</div>'''
style = open('style.css').read()
open('thumbs.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{style}{tcss}</style></head><body><div class="t" id="v1">{A}</div><div class="t" id="v2">{B}</div></body></html>')
