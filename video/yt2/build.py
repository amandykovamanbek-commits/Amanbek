"""Builds yt2/index.html from the series engine (part5/index.html) + this episode's cards, script and render logic.
usage: python3 yt2/build.py   (run from video/)"""
import pathlib, re
here = pathlib.Path(__file__).parent
src = (here.parent / 'part5' / 'index.html').read_text().split('\n')
L = lambda a, b: '\n'.join(src[a - 1:b])  # 1-indexed inclusive

head = L(1, 36).replace('Зарабатываю на монтаже — часть 5', 'Американский Ютуб с нуля — серия 2')
head = head.replace('</style>', '''  .chip{display:inline-block;background:#f2f4f8;border-radius:20px;padding:12px 20px;font-size:34px;font-weight:800;margin:7px}
  .x{color:#e5383b}.ok{color:#16a34a}
  .erow{display:flex;align-items:center;gap:16px;font-size:38px;font-weight:800;padding:14px 0;border-bottom:2px solid #eef0f4}
  .erow .bad{background:#ffe3e3;color:#c92a2a;border-radius:14px;padding:6px 16px}
  .erow .good{background:#e6f7ec;color:#15803d;border-radius:14px;padding:6px 16px;opacity:.25}
  .tile{height:430px;box-sizing:border-box;padding:34px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff}
  #dark{position:absolute;inset:0;background:radial-gradient(ellipse at 66% 58%,rgba(10,8,30,0) 18%,rgba(10,8,30,.82) 75%);opacity:0}
  #confetti i{position:absolute;left:0;top:0;width:22px;height:14px;border-radius:3px;opacity:0}
</style>''')

AV = lambda ch, g: f'<div style="width:76px;height:76px;border-radius:38px;background:{g};font-size:38px;font-weight:900;display:flex;align-items:center;justify-content:center;flex:none;color:#fff">{ch}</div>'
OPT = lambda l, c, t: f'''<div class="opt" style="display:flex;align-items:center;gap:22px;background:#f2f4f8;border-radius:22px;padding:16px 20px;margin-top:14px;opacity:0">
      <div style="flex:none;width:76px;height:76px;border-radius:20px;background:{c};color:#fff;font-size:50px;font-weight:900;display:flex;align-items:center;justify-content:center">{l}</div>
      <div style="font-size:40px;font-weight:800;line-height:1.15">{t}</div></div>'''
TILE = lambda bg, small, big, meta: f'<div class="tile" style="background:{bg}"><div style="font-size:26px;font-weight:800;opacity:.85;letter-spacing:1px">{small}</div><div style="font-size:54px;font-weight:900;line-height:1.05;margin-top:8px">{big}</div><div style="font-size:26px;font-weight:700;opacity:.85;margin-top:12px">{meta}</div></div>'

CHAT = lambda ch, g, name, sub: f'<div style="display:flex;align-items:center;gap:18px">{AV(ch, g)}<div><div style="font-size:36px;font-weight:900">{name}</div><div style="color:#9aa0ad;font-size:24px;font-weight:700">{sub}</div></div></div>'
BUBL = lambda cls, txt, extra='': f'<div class="{cls}" style="margin-top:14px;background:#2c2e3a;border-radius:26px 26px 26px 6px;padding:16px 24px;font-size:38px;font-weight:800;line-height:1.2;width:fit-content;opacity:0;{extra}">{txt}</div>'
BUBR = lambda cls, txt: f'<div class="{cls}" style="margin:14px 0 0 auto;background:#4f6bff;border-radius:26px 26px 6px 26px;padding:16px 24px;font-size:36px;font-weight:800;line-height:1.2;width:fit-content;max-width:640px;opacity:0">{txt}</div>'
SPACE = '''<div style="position:relative;height:300px;border-radius:24px;overflow:hidden;background:radial-gradient(circle at 75% 25%,#3b2f7a,#0d0f2b 70%);color:#fff;padding:28px;box-sizing:border-box">
      <div class="stars2" style="position:absolute;inset:0"></div>
      <div style="position:absolute;right:40px;top:40px;width:120px;height:120px;border-radius:60px;background:radial-gradient(circle at 35% 35%,#ffd27a,#e8743b 60%,#8a2f1c);box-shadow:0 0 40px rgba(255,170,90,.6)"><div style="position:absolute;left:-34px;top:50px;width:186px;height:22px;border:7px solid rgba(255,235,190,.85);border-radius:50%;transform:rotate(-18deg)"></div></div>
      <div style="position:absolute;left:28px;bottom:24px;font-size:52px;font-weight:900;line-height:1.02">На Сатурне<br>идёт алмазный дождь 🤯</div></div>'''

body = f'''<body>
<div id="stage">
  <svg id="world" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"></svg>
  <div id="vign" class="layer"></div>
  <div id="dark" class="layer"></div>

  <div id="tag" class="pill">АМЕРИКАНСКИЙ ЮТУБ С НУЛЯ · СЕРИЯ 2</div>

  <div id="cSpend" class="card" style="width:820px">
    <div class="lbl">план трат · в голове у армана</div>
    <div class="sp row" style="opacity:0;font-size:42px;font-weight:900;padding:16px 0"><span>📱 Новый телефон</span><span style="color:#16a34a">✓</span></div>
    <div class="sp row" style="opacity:0;font-size:42px;font-weight:900;padding:16px 0"><span>💻 Нормальный компьютер</span><span style="color:#16a34a">✓</span></div>
    <div class="sp row" style="opacity:0;font-size:42px;font-weight:900;padding:16px 0;border:0"><span>🧥 Маме — тёплое пальто</span><span style="color:#e5383b">♥</span></div>
  </div>

  <div id="cEarn" class="card" style="width:820px;text-align:center">
    <div class="lbl">youtube studio · заработок</div>
    <div class="big" id="earnN" style="font-size:170px;color:#16171d">$0.00</div>
    <div id="earnLock" style="opacity:0;margin:12px auto 0;width:fit-content;background:#ffe3e3;color:#c92a2a;border-radius:24px;padding:14px 26px;font-size:40px;font-weight:900">🔒 Монетизация недоступна</div>
  </div>

  <div id="cReq" class="card" style="width:900px">
    <div class="lbl">чтобы ютуб платил за shorts</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px"><div style="font-size:40px;font-weight:900">Подписчики</div><div style="font-size:36px;font-weight:900"><span id="rqS">0</span> / 1 000 <span id="rqSok" style="color:#16a34a;opacity:0">✓</span></div></div>
    <div class="bar" style="margin-top:10px;height:36px;border-radius:18px"><i id="rqSb" style="background:linear-gradient(90deg,#51cf66,#16a34a)"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:22px"><div style="font-size:40px;font-weight:900">Просмотры Shorts</div><div style="font-size:30px;font-weight:800;color:#8a8f9c">за 90 дней</div></div>
    <div style="font-size:36px;font-weight:900;text-align:right;margin-top:4px"><span id="rqV">0</span> / 10 000 000</div>
    <div class="bar" style="margin-top:10px;height:36px;border-radius:18px"><i id="rqVb" style="background:linear-gradient(90deg,#ff8787,#e5383b)"></i></div>
    <div id="rqLack" style="opacity:0;margin-top:16px;text-align:center;font-size:46px;font-weight:900;color:#e5383b">не хватает 9 500 000</div>
  </div>

  <div id="cNote" class="card" style="width:600px;background:#FFE066;border-radius:10px 10px 46px 10px;text-align:center;padding:34px 30px 30px">
    <div style="position:absolute;left:50%;top:-18px;width:150px;height:40px;margin-left:-75px;background:rgba(255,255,255,.65);transform:rotate(-3deg)"></div>
    <div class="lbl" style="color:#8a6d00">новый план</div>
    <div class="big" style="font-size:84px;line-height:1.02">1 ВИДЕО<br>В ДЕНЬ</div>
    <div style="margin-top:14px;font-size:36px;font-weight:900;color:#8a6d00">90 дней подряд</div>
    <div id="noteStamp" class="stamp" style="left:50%;top:120px;margin-left:-210px;font-size:64px;opacity:0;background:rgba(255,255,255,.95);border-color:#16a34a;color:#16a34a">БЕЗ «ЗАВТРА»</div>
  </div>

  <div id="cTimur" class="card" style="width:880px;background:#1c1d24;color:#fff">
    {CHAT('Т', 'linear-gradient(135deg,#ffb347,#ff6b6b)', 'Тимур', 'одноклассник · день 8')}
    <div class="tm" style="margin-top:16px;border-radius:24px;overflow:hidden;opacity:0;background:#2c2e3a">
      <div style="padding:14px 20px;font-size:26px;font-weight:800;color:#9aa0ad">youtube.com/shorts/…</div>
      <div style="padding:0 20px 18px;font-size:34px;font-weight:900">🚀 На Сатурне идёт алмазный дождь</div></div>
    {BUBL('tm', 'Это же твоё видео?', 'font-size:44px;font-weight:900')}
  </div>

  <div id="cStolen" class="card" style="width:880px;padding:24px">
    {SPACE}
    <div style="display:flex;align-items:center;gap:16px;margin-top:18px">{AV('C', 'linear-gradient(135deg,#00c6ff,#7a3dff)')}<div><div style="font-size:34px;font-weight:900">COSMO FACTS 24</div><div style="color:#8a8f9c;font-size:24px;font-weight:700">8,4 млн подписчиков</div></div>
      <div style="margin-left:auto;text-align:right"><div id="stN" class="big" style="font-size:64px;color:#16171d">0</div><div style="font-size:24px;font-weight:800;color:#8a8f9c">просмотров</div></div></div>
    <div style="display:flex;gap:14px;margin-top:16px">
      <div id="stNo" style="opacity:0;flex:1;background:#ffe3e3;color:#c92a2a;border-radius:18px;padding:12px 18px;font-size:32px;font-weight:900">✕ Автор не указан</div>
      <div id="stMe" style="opacity:0;flex:1;background:#f2f4f8;border-radius:18px;padding:12px 18px;font-size:32px;font-weight:900">у Армана: <span style="color:#e5383b">0</span></div></div>
    <div id="stStamp" class="stamp" style="left:50px;top:44px;font-size:54px;opacity:0">ПЕРЕЗАЛИВ</div>
  </div>

  <div id="cReply" class="card" style="width:880px;background:#1c1d24;color:#fff">
    {CHAT('C', 'linear-gradient(135deg,#00c6ff,#7a3dff)', 'COSMO FACTS 24', 'переписка')}
    {BUBR('rp', 'Это моё видео. Укажите автора, пожалуйста.')}
    <div class="rp" style="margin-top:6px;text-align:right;font-size:24px;font-weight:700;color:#9aa0ad;opacity:0">прочитано ✓✓</div>
    {BUBL('rp', 'Докажи, что это твоё.', 'font-size:48px;font-weight:900;color:#ff6b6b')}
  </div>

  <div id="cPoll" class="card" style="width:900px;padding:30px 34px">
    <div class="lbl">серия 3 · что сделает арман?</div>
    {OPT('А', '#4f6bff', 'Подаст жалобу за нарушение авторских прав')}
    {OPT('Б', '#e5383b', 'Запишет ответное видео')}
    {OPT('В', '#16a34a', 'Попросит отметить его канал')}
    {OPT('Г', '#f59f00', 'Расскажет обо всём маме')}
  </div>

  <div id="confetti" class="layer"></div>

  <div id="cEnd" class="layer" style="opacity:0">
    <div style="position:absolute;left:0;right:0;top:1640px;text-align:center">
      <span style="display:inline-block;background:#FFD43B;color:#16171d;font-weight:900;font-size:40px;padding:14px 30px;border-radius:40px;box-shadow:0 10px 30px rgba(0,0,0,.35)">ПИШИ БУКВУ В КОММЕНТЫ ↓</span><br>
      <span style="display:inline-block;margin-top:18px;background:#16171d;color:#fff;font-weight:900;font-size:36px;padding:12px 28px;border-radius:40px">СЕРИЯ 3 — СКОРО</span>
    </div>
  </div>

  <div id="fxText"></div>

  <div id="hud">
    <div class="hb"><div class="k">ПОДПИСЧИКИ</div><div class="v" id="hBal">1 204</div></div>
    <div class="hb"><div class="k">ПРОСМОТРЫ</div><div class="v" id="hCli">500K</div></div>
    <div class="hb dark"><div class="k">ВРЕМЯ</div><div class="v" id="hTime">ПН 09:40</div></div>
  </div>

  <div id="subs"></div>
  <div id="flash"></div>
</div>
'''

scenes = '''// ============================================================ script
const SCENES = [
  { id: 's1',  bg: 'class',     text: 'Пятьсот тысяч просмотров за одну ночь! Арман уже считает деньги: новый телефон, нормальный компьютер, маме — тёплое пальто.' },
  { id: 's2',  bg: 'hall',      text: 'Он открывает вкладку «Заработок»… а там ноль долларов. Монетизация недоступна.' },
  { id: 's3',  bg: 'hall',      text: 'Оказывается, чтобы Ютуб платил за шортс, нужна тысяча подписчиков и десять миллионов просмотров за девяносто дней.' },
  { id: 's4',  bg: 'hall',      text: 'Подписчиков — тысяча двести. Есть! А просмотров — всего полмиллиона. Не хватает девяти с половиной миллионов.' },
  { id: 's5',  bg: 'bedEve',    text: 'Арман пишет новый план: одно видео каждый день. Девяносто дней подряд.' },
  { id: 's6',  bg: 'bedMorn',   text: 'Подъём в семь. Школа. На перемене — сценарий в заметках. После уроков — магазин и посуда, ведь мама теперь на двух работах. Ночью — монтаж. День третий. День пятый. День седьмой. Просмотры растут: миллион… два… три!' },
  { id: 's7',  bg: 'bedNight',  text: 'А на восьмой день друг Тимур присылает ссылку: «Это же твоё видео?»' },
  { id: 's8',  bg: 'bedNight',  text: 'Огромный канал перезалил его ролик про космос. Без указания автора. Четыре миллиона просмотров — и ни одного у Армана.' },
  { id: 's9',  bg: 'bedNight',  text: 'Арман пишет им. Ответ приходит через минуту: «Докажи, что это твоё».' },
  { id: 's10', bg: 'bedNight',  text: 'Что сделает Арман? А: подаст жалобу за нарушение авторских прав. Б: запишет ответное видео. В: попросит отметить его канал. Г: расскажет обо всём маме. Пиши букву в комментах! Серия три — скоро.' },
];'''

world = L(233, 441)
world = world.replace("skin: '#F6C9A2', skinD: '#E3A882', hair: '#2B1C17', hood: '#5560E6', hoodD: '#3E47B8', hoodL: '#6A74F0'",
                      "skin: '#EDBE95', skinD: '#D69F78', hair: '#17151c', hood: '#E5484D', hoodD: '#B4353A', hoodL: '#F47B7F'")
# old PC instead of laptop
a = world.index('<g transform="translate(610,1360)">'); b = world.index('<g filter="url(#dofNear)"><rect x="90" y="1520"')
oldpc = '''<g transform="translate(580,1318)"><rect width="430" height="330" rx="28" fill="#cfc6ad"/><rect x="14" y="14" width="402" height="302" rx="20" fill="#ddd5bd"/>
            <rect x="70" y="50" width="290" height="210" rx="46" fill="#bfb69c"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${120 + i * 40}" y="100" width="16" height="110" rx="8" fill="#a39a80"/>`).join('')}
            <rect x="40" y="36" width="80" height="44" rx="8" fill="#ffd43b" transform="rotate(-9 80 58)"/><circle cx="380" cy="290" r="9" fill="#51cf66"/>
            <rect x="150" y="320" width="130" height="30" fill="#b3aa90"/><rect x="60" y="340" width="310" height="24" rx="8" fill="#c4bba1"/></g>
          '''
world = world[:a] + oldpc + world[b:]
world = world.replace('fill="#fff">EDIT</text>', 'fill="#fff">GOAL</text>').replace('fill="#ffd3e6">MODE</text>', 'fill="#ffd3e6">$10K</text>')
world = world.replace('function desk() {', 'function desk(late) {')
world = world.replace('''<rect x="-200" y="1580" width="1480" height="600" fill="#1a1b36"/>`,''', '''<rect x="-200" y="1580" width="1480" height="600" fill="#1a1b36"/>${late ? '<rect x="-300" y="-300" width="1700" height="2600" fill="#05061a" opacity=".5"/><circle cx="770" cy="1300" r="520" fill="url(#screenGlow)" opacity=".8"/>' : ''}`,''')
# mom in the kitchen
mom = '''
          <g id="mom" transform="translate(245,1235)">
            <path d="M-200,300 Q-215,190 -120,160 L120,160 Q215,190 200,300 L230,900 L-230,900 Z" fill="#B79AE0"/>
            <path d="M-60,160 L0,330 L60,160 Z" fill="#fff"/><path d="M-200,300 Q-215,190 -120,160 L-90,160 Q-170,220 -160,900 L-230,900 Z" fill="#cdb6ee" opacity=".5"/>
            <rect x="-42" y="100" width="84" height="90" fill="#D69F78"/>
            <g id="momHead">
              <circle cx="20" cy="-178" r="62" fill="#3a2620"/>
              <path d="M-150,30 C-172,-120 -80,-180 0,-176 C96,-178 170,-112 150,30 C120,-20 110,-70 60,-104 C10,-80 -70,-84 -112,-60 C-132,-40 -142,-10 -150,30 Z" fill="#3a2620"/>
              <circle cx="-136" cy="18" r="26" fill="#EDBE95"/><circle cx="136" cy="18" r="26" fill="#EDBE95"/><circle cx="-138" cy="52" r="9" fill="#ffd43b"/><circle cx="138" cy="52" r="9" fill="#ffd43b"/>
              <ellipse cx="0" cy="10" rx="136" ry="150" fill="#EDBE95"/>
              <path d="M-150,30 C-170,-110 -84,-172 0,-170 C92,-172 168,-108 150,30 C128,-30 104,-74 56,-100 C8,-74 -64,-78 -108,-56 C-130,-38 -142,-8 -150,30 Z" fill="#3a2620"/>
              <ellipse cx="-90" cy="66" rx="24" ry="12" fill="#F2928A" opacity=".45"/><ellipse cx="90" cy="66" rx="24" ry="12" fill="#F2928A" opacity=".45"/>
              <g id="momEyes"><ellipse cx="-52" cy="12" rx="22" ry="24" fill="#fff"/><ellipse cx="52" cy="12" rx="22" ry="24" fill="#fff"/><circle cx="-46" cy="16" r="12" fill="#1f1a24"/><circle cx="58" cy="16" r="12" fill="#1f1a24"/></g>
              <path d="M-78,-4 Q-52,-22 -26,-6" stroke="#EDBE95" stroke-width="16" fill="none"/><path d="M26,-6 Q52,-22 78,-4" stroke="#EDBE95" stroke-width="16" fill="none"/>
              <path d="M-80,46 Q-56,56 -32,46 M32,46 Q56,56 80,46" stroke="#c98f76" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M-84,-40 Q-56,-58 -26,-36" stroke="#3a2620" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M26,-36 Q56,-58 84,-40" stroke="#3a2620" stroke-width="11" fill="none" stroke-linecap="round"/>
              <path d="M-2,34 Q6,54 14,44" stroke="#D69F78" stroke-width="6" fill="none" stroke-linecap="round"/>
              <path id="momMouth" d="M-30,90 Q0,106 30,90" stroke="#7a2a2e" stroke-width="8" fill="#7a2a2e" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </g>`,'''
world = world.replace('''<rect x="-200" y="1600" width="1480" height="600" fill="#e7d2b4"/>`,''', '''<rect x="-200" y="1600" width="1480" height="600" fill="#e7d2b4"/>''' + mom)
assert 'id="mom"' in world and 'late ?' in world

bg = '''
const BG = {
  class: classroom(), hall: hall(), bedEve: bedroom('bedEve', 'eve'), bedMorn: bedroom('bedMorn', 'morn'), bedNight: bedroom('bedNight', 'night'),
  street: street(), kitchenEve: kitchen(true), desk: desk(false), deskLate: (d => { d.defs = ''; return d; })(desk(true)),
};
'''
char = '\n'.join(src[446:499] + src[503:517] + src[523:551])  # drop headphones (500-503) and glasses (518-523)
a = char.index('function hairSVG() {'); b = char.index('function arm(id, side) {')
char = char[:a] + '''function hairSVG() {
  return `<path d="M-162,24 C-190,-150 -84,-218 4,-208 C112,-208 190,-136 162,24 C154,-28 140,-58 122,-80 C92,-52 40,-56 2,-90 C-28,-58 -80,-48 -120,-76 C-142,-52 -154,-20 -162,24 Z" fill="${PAL.hair}"/>
    <path d="M20,-206 C50,-250 96,-236 80,-204" stroke="${PAL.hair}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M-104,-164 C-70,-186 -24,-192 16,-186" stroke="#3b3745" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
''' + char[b:]
char = char.replace('<rect x="58" y="300" width="84" height="62" rx="14" fill="#FFD43B"/>', '<rect x="58" y="300" width="84" height="62" rx="18" fill="#fff"/>')
assert 'glasses' not in char and 'headphones' not in char

render = (here / 'render.js').read_text()
tail = L(737, 799)
tail = tail.replace('`translate(540 ${1170 + bob}) rotate(${sway * .4})`', '`translate(${CHX} ${1170 + bob}) rotate(${sway * .4})`')
tail = tail.replace('`translate(0 ${Math.sin(t * 2.2 + .5) * 3}) rotate(', '`translate(0 ${Math.sin(t * 2.2 + .5) * 3 + NODY}) rotate(')
tail = tail.replace("sc.bg === 'bedNight' ? '#ffe9a8' : '#7fb2ff'", "'#9fc4ff'")
assert 'CHX' in tail and 'NODY' in tail

out = '\n'.join([head, body, L(144, 157), scenes, L(172, 232), world, bg, char, render, tail])
(here / 'index.html').write_text(out)
print('built', len(out))
