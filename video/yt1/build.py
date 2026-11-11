"""Builds yt1/index.html from the series engine (part5/index.html) + this episode's cards, script and render logic.
usage: python3 yt1/build.py   (run from video/)"""
import pathlib, re
here = pathlib.Path(__file__).parent
src = (here.parent / 'part5' / 'index.html').read_text().split('\n')
L = lambda a, b: '\n'.join(src[a - 1:b])  # 1-indexed inclusive

head = L(1, 36).replace('Зарабатываю на монтаже — часть 5', 'Американский Ютуб с нуля — серия 1')
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

body = f'''<body>
<div id="stage">
  <svg id="world" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"></svg>
  <div id="vign" class="layer"></div>
  <div id="dark" class="layer"></div>

  <div id="tag" class="pill">АМЕРИКАНСКИЙ ЮТУБ С НУЛЯ · СЕРИЯ 1</div>

  <div id="cFeed" class="card" style="width:780px;padding:22px">
    <div class="lbl" style="display:flex;justify-content:space-between"><span>▶ shorts · лента</span><span id="feedN">1 / 4</span></div>
    <div style="height:430px;overflow:hidden;border-radius:24px"><div id="feedIn">
      {TILE('linear-gradient(135deg,#5b6cff,#9b5bff)', 'МОТИВАЦИЯ', 'Как я начал с нуля в 14 лет', '840 тыс. просмотров')}
      {TILE('linear-gradient(135deg,#00b894,#0984e3)', 'ЗАРАБОТОК', '$300 в день на Shorts?!', '1,1 млн просмотров')}
      {TILE('linear-gradient(135deg,#f39c12,#e84393)', 'СЕКРЕТ', 'Американский YouTube: с чего начать', '620 тыс. просмотров')}
      {TILE('linear-gradient(135deg,#e5383b,#ff7a59)', 'ИСТОРИЯ УСПЕХА', 'ШКОЛЬНИК ЗАРАБОТАЛ <span style="color:#FFD43B">$10 000</span> НА АМЕРИКАНСКОМ YOUTUBE', '2,4 млн просмотров · вчера')}
    </div></div>
  </div>

  <div id="cNote" class="card" style="width:560px;background:#FFE066;border-radius:10px 10px 46px 10px;text-align:center;padding:34px 30px 30px">
    <div style="position:absolute;left:50%;top:-18px;width:150px;height:40px;margin-left:-75px;background:rgba(255,255,255,.65);transform:rotate(-3deg)"></div>
    <div class="big" style="font-size:80px;line-height:1.02;position:relative">НАЧНУ<br>ЗАВТРА<div id="strike" style="position:absolute;left:-10px;top:50%;height:16px;width:0;background:#e5383b;border-radius:8px;transform:rotate(-7deg)"></div></div>
    <div id="noteSub" style="margin-top:14px;font-size:32px;font-weight:800;color:#8a6d00">сегодня: устал</div>
    <div id="nowStamp" class="stamp" style="left:50%;top:86px;margin-left:-190px;font-size:86px;opacity:0;background:rgba(255,255,255,.95);border-color:#16a34a;color:#16a34a">СЕЙЧАС</div>
  </div>

  <div id="cCal" class="card" style="width:860px">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><div class="lbl">календарь «начну завтра»</div><div style="font-size:38px;font-weight:900">ДЕНЬ <span id="calN">1</span></div></div>
    <div id="calGrid" style="display:grid;grid-template-columns:repeat(15,1fr);gap:7px;margin-top:8px"></div>
    <div id="calStamp" class="stamp" style="right:60px;top:120px;font-size:64px;opacity:0">3 МЕСЯЦА</div>
  </div>

  <div id="cMom" class="card" style="width:800px;border-radius:34px 34px 34px 8px">
    <div style="display:flex;align-items:center;gap:18px">{AV('М', 'linear-gradient(135deg,#b79ae0,#7c5cc4)')}<div><div style="font-size:36px;font-weight:900">Мама</div><div style="color:#8a8f9c;font-size:24px;font-weight:700">за ужином · тихо</div></div></div>
    <div class="ml" style="margin-top:16px;font-size:44px;font-weight:900;line-height:1.15;opacity:0">Сынок, зарплату <span class="x">опять задержали</span>.</div>
    <div class="ml" style="margin-top:12px;font-size:44px;font-weight:900;line-height:1.15;opacity:0">Я нашла вторую работу.</div>
    <div class="ml" style="margin-top:12px;font-size:44px;font-weight:900;line-height:1.15;opacity:0">Следи за домом, ладно?</div>
  </div>

  <div id="cGuilt" class="card" style="width:860px">
    <div class="lbl">кто чем занят</div>
    <div style="display:flex;align-items:center;gap:18px;margin-top:6px"><div style="width:190px;font-size:36px;font-weight:900">МАМА</div><div class="bar" style="flex:1;height:44px;border-radius:22px"><i id="gMom" style="background:linear-gradient(90deg,#b79ae0,#7c5cc4);border-radius:22px"></i></div><div style="width:210px;font-size:34px;font-weight:900;text-align:right">2 работы</div></div>
    <div id="gRow2" style="display:flex;align-items:center;gap:18px;margin-top:18px;opacity:0"><div style="width:190px;font-size:36px;font-weight:900">АРМАН</div><div class="bar" style="flex:1;height:44px;border-radius:22px"><i id="gMe" style="background:linear-gradient(90deg,#ff8787,#e5383b);border-radius:22px"></i></div><div style="width:210px;font-size:30px;font-weight:900;text-align:right;color:#e5383b;line-height:1.05">лента<br>4 ч 12 мин</div></div>
  </div>

  <div id="cBoot" class="card" style="width:780px;background:#1c1d24;color:#fff">
    <div class="lbl" style="color:#9aa0ad">компьютер 2011 года · вентилятор воет</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:48px;font-weight:900">Запуск…</div><div style="font-size:32px;font-weight:800;color:#ff8787">ещё <span id="bootT">3:59</span></div></div>
    <div class="bar" style="margin-top:16px;background:#2c2e3a"><i id="bootBar"></i></div>
  </div>

  <div id="cUp" class="card" style="width:820px">
    <div class="lbl">youtube studio · канал 0 подписчиков</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:46px;font-weight:900" id="upName">Видео №1</div><div id="upSt" style="font-size:30px;font-weight:800;color:#16a34a">опубликовано ✓</div></div>
    <div class="bar" style="margin-top:14px"><i id="upBar"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px"><div style="font-size:38px;font-weight:800;color:#8a8f9c">Просмотры</div><div id="upV" class="big" style="font-size:110px;color:#e5383b;opacity:0">0</div></div>
  </div>

  <div id="cSearch" class="card" style="width:880px">
    <div style="display:flex;align-items:center;gap:16px;background:#f2f4f8;border-radius:40px;padding:18px 26px"><div style="font-size:40px">🔍</div><div id="srTxt" style="font-size:36px;font-weight:800;white-space:nowrap;overflow:hidden"></div></div>
    <div class="sr" style="margin-top:18px;height:26px;border-radius:13px;background:#e9ebf0;width:92%;opacity:0"></div>
    <div class="sr" style="margin-top:14px;height:26px;border-radius:13px;background:#e9ebf0;width:74%;opacity:0"></div>
    <div class="sr" style="margin-top:14px;height:26px;border-radius:13px;background:#e9ebf0;width:83%;opacity:0"></div>
  </div>

  <div id="cErr1" class="card" style="width:900px">
    <div class="lbl"><span class="x">ошибка 1 из 3</span> · настройки аккаунта</div>
    <div class="erow"><div style="width:150px">Язык</div><div class="bad" id="e1a">Русский ✕</div><div>→</div><div class="good" id="e1c">English (US) ✓</div></div>
    <div class="erow" style="border:0"><div style="width:150px">Регион</div><div class="bad" id="e1b">не США ✕</div><div>→</div><div class="good" id="e1d">United States ✓</div></div>
  </div>

  <div id="cErr2" class="card" style="width:900px">
    <div class="lbl"><span class="x">ошибка 2 из 3</span> · скучное начало</div>
    <svg viewBox="0 0 820 300" width="820" height="300" style="display:block">
      <line x1="40" y1="250" x2="800" y2="250" stroke="#d9dde6" stroke-width="5"/><line x1="40" y1="20" x2="40" y2="250" stroke="#d9dde6" stroke-width="5"/>
      <text x="48" y="44" font-size="26" font-weight="800" fill="#8a8f9c">зрители 100%</text>
      <path id="retPath" d="M40,40 L150,48 C200,60 205,220 260,232 L800,244" fill="none" stroke="#e5383b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <g id="retMark" opacity="0"><line x1="205" y1="20" x2="205" y2="250" stroke="#16171d" stroke-width="5" stroke-dasharray="10 10"/><rect x="225" y="70" width="330" height="84" rx="20" fill="#16171d"/><text x="390" y="126" text-anchor="middle" font-size="42" font-weight="900" fill="#fff">0:02 — ушли 👆</text></g>
      <text x="205" y="286" text-anchor="middle" font-size="28" font-weight="900" fill="#16171d">0:02</text><text x="770" y="286" text-anchor="middle" font-size="28" font-weight="800" fill="#8a8f9c">0:30</text>
    </svg>
    <div class="good" id="e2fix" style="display:inline-block;background:#e6f7ec;color:#15803d;border-radius:14px;padding:6px 16px;font-size:34px;font-weight:900;opacity:.25">Крючок в первые 2 секунды ✓</div>
  </div>

  <div id="cErr3" class="card" style="width:900px">
    <div class="lbl"><span class="x">ошибка 3 из 3</span> · нет ниши</div>
    <div id="chips" style="text-align:center"><span class="chip">🐱 котики</span><span class="chip">🎮 игры</span><span class="chip">🍔 еда</span><span class="chip">⚽ футбол</span><span class="chip">😂 мемы</span><span class="chip">🚗 машины</span></div>
    <div id="e3note" style="margin-top:10px;font-size:34px;font-weight:900;color:#e5383b;text-align:center;opacity:0">Алгоритм не понимает, кому тебя показывать</div>
  </div>

  <div id="cFix" class="card" style="width:820px;padding:22px 30px">
    <div class="fx3" style="font-size:36px;font-weight:900;color:#15803d;padding:5px 0;opacity:0">✓ English (US) · United States</div>
    <div class="fx3" style="font-size:36px;font-weight:900;color:#15803d;padding:5px 0;opacity:0">✓ Крючок в первые 2 секунды</div>
    <div class="fx3" style="font-size:36px;font-weight:900;color:#15803d;padding:5px 0;opacity:0">✓ Одна ниша</div>
  </div>

  <div id="cNiche" class="card" style="width:860px;background:radial-gradient(circle at 80% 20%,#3b2f7a,#0d0f2b 70%);color:#fff;overflow:hidden">
    <div id="stars"></div>
    <div style="position:absolute;right:46px;top:36px;width:150px;height:150px;border-radius:75px;background:radial-gradient(circle at 35% 35%,#ffd27a,#e8743b 60%,#8a2f1c);box-shadow:0 0 50px rgba(255,170,90,.6)" id="planet"><div style="position:absolute;left:-40px;top:62px;width:230px;height:26px;border:8px solid rgba(255,235,190,.85);border-radius:50%;transform:rotate(-18deg)"></div></div>
    <div class="lbl" style="color:#b9b6e8">ниша канала</div>
    <div class="big" style="font-size:92px">SPACE<br>FACTS</div>
    <div style="font-size:34px;font-weight:800;color:#d8d5ff;margin-top:10px">странные факты о космосе</div>
    <div id="nUp" style="margin-top:18px;opacity:0"><div style="display:flex;justify-content:space-between;font-size:30px;font-weight:800"><span>Видео №3 · загрузка</span><span id="nPct">0%</span></div>
      <div class="bar" style="margin-top:10px;background:#2a2c55"><i id="nBar" style="background:linear-gradient(90deg,#ffd43b,#ff7a59)"></i></div></div>
    <div id="nPub" class="stamp" style="right:40px;bottom:36px;font-size:44px;opacity:0;border-color:#51cf66;color:#51cf66;background:rgba(13,15,43,.9)">ОПУБЛИКОВАНО</div>
  </div>

  <div id="cViews" class="card" style="width:900px;text-align:center">
    <div class="lbl">space facts · видео №3 · за ночь</div>
    <div class="big" id="vwN" style="font-size:168px;color:#e5383b;white-space:nowrap">0</div>
    <div style="font-size:44px;font-weight:900;margin-top:4px">просмотров 🔥</div>
    <div style="margin-top:14px"><span class="chip vn" style="opacity:0;background:#e6f7ec;color:#15803d">+1 204 подписчика</span><span class="chip vn" style="opacity:0;background:#fff3bf;color:#8a6d00">💬 892 комментария</span></div>
  </div>

  <div id="cPoll" class="card" style="width:900px;padding:30px 34px">
    <div class="lbl">серия 2 · что будет дальше?</div>
    {OPT('А', '#4f6bff', 'Ютуб заплатит первые деньги')}
    {OPT('Б', '#e5383b', 'Канал заблокируют')}
    {OPT('В', '#7c5cc4', 'Мама обо всём узнает')}
    {OPT('Г', '#f59f00', 'Ролик украдёт крупный блогер')}
  </div>

  <div id="confetti" class="layer"></div>

  <div id="cEnd" class="layer" style="opacity:0">
    <div style="position:absolute;left:0;right:0;top:1640px;text-align:center">
      <span style="display:inline-block;background:#FFD43B;color:#16171d;font-weight:900;font-size:40px;padding:14px 30px;border-radius:40px;box-shadow:0 10px 30px rgba(0,0,0,.35)">ПИШИ БУКВУ В КОММЕНТЫ ↓</span><br>
      <span style="display:inline-block;margin-top:18px;background:#16171d;color:#fff;font-weight:900;font-size:36px;padding:12px 28px;border-radius:40px">СЕРИЯ 2 — СКОРО</span>
    </div>
  </div>

  <div id="fxText"></div>

  <div id="hud">
    <div class="hb"><div class="k">ПОДПИСЧИКИ</div><div class="v" id="hBal">0</div></div>
    <div class="hb"><div class="k">ПРОСМОТРЫ</div><div class="v" id="hCli">0</div></div>
    <div class="hb dark"><div class="k">ВРЕМЯ</div><div class="v" id="hTime">ЧТ 21:40</div></div>
  </div>

  <div id="subs"></div>
  <div id="flash"></div>
</div>
'''

scenes = '''// ============================================================ script
const SCENES = [
  { id: 's1',  bg: 'bedEve',     text: 'Это Арман. Ему пятнадцать. Каждый вечер он смотрит видео: «Школьник заработал десять тысяч долларов на американском Ютубе!»' },
  { id: 's2',  bg: 'bedEve',     text: 'И каждый вечер говорит: начну завтра.' },
  { id: 's3',  bg: 'street',     text: 'Завтра — школа.' },
  { id: 's4',  bg: 'class',      text: 'Послезавтра — контрольная. Так прошло три месяца.' },
  { id: 's5',  bg: 'kitchenEve', text: 'А сегодня за ужином мама тихо говорит: «Сынок, зарплату опять задержали. Я нашла вторую работу. Следи за домом, ладно?»' },
  { id: 's6',  bg: 'kitchenEve', text: 'Арман кивает. А внутри — стыдно. Мама работает за двоих, а он только листает ленту.' },
  { id: 's7',  bg: 'desk',       text: 'После ужина он садится за старый компьютер. Никаких «завтра». Прямо сейчас!' },
  { id: 's8',  bg: 'desk',       text: 'Первое видео. Ноль просмотров. Второе. Снова ноль.' },
  { id: 's9',  bg: 'deskLate',   text: 'До ночи он ищет, в чём дело. И находит три ошибки.' },
  { id: 's10', bg: 'deskLate',   text: 'Первая: в настройках русский язык и не тот регион.' },
  { id: 's11', bg: 'deskLate',   text: 'Вторая: первые две секунды скучные, и зритель листает дальше.' },
  { id: 's12', bg: 'deskLate',   text: 'Третья: он снимал обо всём подряд, без ниши.' },
  { id: 's13', bg: 'deskLate',   text: 'Арман выбирает одну нишу: странные факты о космосе. И заливает новое видео.' },
  { id: 's14', bg: 'class',      text: 'Утром на уроке телефон не умолкает. Пятьсот тысяч просмотров! За одну ночь!' },
  { id: 's15', bg: 'class',      text: 'Что будет дальше? А: Ютуб заплатит первые деньги. Б: канал заблокируют. В: мама обо всём узнает. Г: ролик украдёт крупный блогер. Пиши букву в комментах! Серия два — скоро.' },
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
  bedEve: bedroom('bedEve', 'eve'), street: street(), class: classroom(), kitchenEve: kitchen(true), desk: desk(false), deskLate: (d => { d.defs = ''; return d; })(desk(true)),
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
