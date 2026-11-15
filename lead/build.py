"""Lead magnet: «10 инструментов, без которых твой Claude пустой» — 8 pages 1080x1350. Render with render.cjs."""
import html, pathlib, math
here = pathlib.Path(__file__).parent
N = 8
H = html.escape
def ph(s):
    import re
    return re.sub(r'\[\[(.+?)\]\]', r'<span class="hl">\1</span>', H(s))

def page(i, inner, tag='', t1='', t2=''):
    bars = ''.join(f'<b class="{"on" if k < i else ""}"></b>' for k in range(N))
    return f'''<section class="page"><div class="glow"></div>
  <header><span class="dot"></span><b>@CLAUDECODE09</b><span class="mid">ШПАРГАЛКА · 10 ИНСТРУМЕНТОВ</span><span class="r">2026</span></header>
  {f'<div class="tag"><span>{tag.split("|")[0]}</span>{tag.split("|")[1]}</div>' if tag else ''}
  {f'<h1>{t1}<br><em>{t2}</em></h1>' if t1 else ''}
  {inner}
  <footer><span>@claudecode09 · 10 инструментов для Claude</span><span class="r">СТР. {i:02d}/{N:02d} <span class="bars">{bars}</span></span></footer>
</section>'''

ICON = {
 'el': ('linear-gradient(150deg,#2b2b2f,#0c0c0e)', '<i class="el"></i><i class="el"></i>'),
 'figma': ('linear-gradient(150deg,#2c2c30,#111113)', '<svg width="34" height="50" viewBox="0 0 38 57"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1abcfe"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0acf83"/><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19z" fill="#ff7262"/><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#f24e1e"/><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#a259ff"/></svg>'),
 'canva': ('linear-gradient(150deg,#20c5d0,#7b3fe4)', '<span class="ic-t serif">C</span>'),
 'vidiq': ('linear-gradient(150deg,#3d8bff,#1450d8)', '<span class="ic-t sm">vidIQ</span>'),
 'notion': ('linear-gradient(150deg,#ffffff,#e9e9e6)', '<span class="ic-n">N</span>'),
 'github': ('linear-gradient(150deg,#2f353d,#0d1117)', '<svg width="44" height="44" viewBox="0 0 24 24"><path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round"/></svg>'),
 'brag': ('linear-gradient(150deg,#ff9a5c,#e8532a)', '<svg width="44" height="44" viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="#fff"/></svg>'),
 'docs': ('linear-gradient(150deg,#ff6a5c,#d8342a)', '<span class="ic-t sm">PDF</span>'),
 'skill': ('linear-gradient(150deg,#f0905f,#c9562c)', '<svg width="46" height="46" viewBox="-100 -100 200 200">' + ''.join(f'<line x1="0" y1="0" x2="{80*math.cos(a*math.pi/180):.1f}" y2="{80*math.sin(a*math.pi/180):.1f}" stroke="#fff" stroke-width="20" stroke-linecap="round"/>' for a in [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331]) + '</svg>'),
 'research': ('linear-gradient(150deg,#4cc9ff,#1479d6)', '<svg width="44" height="44" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.2" stroke="#fff" stroke-width="2.4" fill="none"/><path d="M15.2 15.2L20.5 20.5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>'),
 'cc': ('linear-gradient(150deg,#2b2420,#120e0c)', '<span class="ic-t mono">&gt;_</span>'),
 'remotion': ('linear-gradient(150deg,#3f8cff,#0b5ce0)', '<svg width="44" height="44" viewBox="0 0 24 24"><path d="M6 4.5v15l12.5-7.5z" fill="#fff"/></svg>'),
}
def tile(k, s=84):
    bg, g = ICON[k]
    return f'<div class="tile" style="width:{s}px;height:{s}px;background:{bg}">{g}</div>'

def tool(n, k, name, kind, price, what, steps, prompt):
    st = ''.join(f'<li>{ph(x)}</li>' for x in steps)
    pr_ = ''.join(f'<p>{ph(x)}</p>' for x in prompt)
    return f'''<div class="tool">
  <div class="thead">{tile(k)}<div class="tn"><small>{n:02d} · {kind}</small><h3>{H(name)}</h3></div><span class="price">{H(price)}</span></div>
  <p class="what">{ph(what)}</p>
  <div class="cols"><div><h4>КАК ПОДКЛЮЧИТЬ</h4><ol>{st}</ol></div>
  <div class="prompt"><div class="ptop"><span>ПЕРВЫЙ ПРОМПТ</span><i></i><i></i><i></i></div><div class="pbody">{pr_}</div></div></div>
</div>'''

SPARK = '<svg class="spark" viewBox="-100 -100 200 200">' + ''.join(f'<line x1="0" y1="0" x2="{90*math.cos(a*math.pi/180):.1f}" y2="{90*math.sin(a*math.pi/180):.1f}"/>' for a in [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331]) + '</svg>'
CONN = 'Claude → Настройки → Коннекторы → каталог'
pages = []
pages.append(page(1, f'''
  <div class="covertag"><span class="new">FREE</span>ШПАРГАЛКА К ВИДЕО</div>
  <div class="cover">{SPARK}<h1 class="big">БЕЗ ЭТОГО<br>ТВОЙ CLAUDE<br><em>ПУСТОЙ.</em></h1></div>
  <p class="lead">10 инструментов, которые я подключаю первым делом: <b>что делает</b> каждый, <b>как подключить</b> по шагам и <b>первый промпт</b>, чтобы проверить его прямо сейчас.</p>
  <div class="tilesrow">{''.join(tile(k, 76) for k in ['el','figma','canva','vidiq','notion','github','brag','docs','skill','research'])}</div>
  <div class="stats">
    <div class="stat"><small>КОННЕКТОРЫ</small><strong class="o">6</strong><span>руки Claude:<br>заходит в сервисы</span></div>
    <div class="stat"><small>СКИЛЛЫ</small><strong class="g">4</strong><span>навыки: делает<br>задачу как профи</span></div>
    <div class="stat cta"><small>БОНУС</small><strong>+1</strong><span>Claude Code<br>и Remotion</span></div>
  </div>'''))
pages.append(page(2, f'''
  <p class="lead">Без коннекторов и скиллов Claude <b>только советует</b>. С ними — <b>делает сам</b>: озвучивает, верстает, собирает ролики и сохраняет файлы.</p>
  <div class="grid2">
    <div class="card top big"><small>КОННЕКТОР</small><h3>Руки Claude</h3><p>Доступ к другим сервисам: ElevenLabs, Figma, Canva, vidIQ, Notion, GitHub.</p>
      <ol class="how"><li>Открой <b>Настройки → Коннекторы</b>.</li><li>Найди сервис в каталоге и нажми <b>«Подключить»</b>.</li><li>Войди в аккаунт сервиса и разреши доступ.</li><li>Нет в каталоге? <b>«Добавить свой коннектор»</b> и вставь адрес MCP сервиса.</li></ol></div>
    <div class="card top big gr"><small>СКИЛЛ</small><h3>Навыки Claude</h3><p>Готовые инструкции: как сделать задачу по шагам и в нужном формате.</p>
      <ol class="how"><li>Открой <b>Настройки → Возможности</b>.</li><li>Включи <b>выполнение кода и создание файлов</b>.</li><li>В разделе <b>«Скиллы»</b> включи нужные или загрузи свой (.zip).</li><li>В Claude Code скиллы вызываются командой: <code>/имя-скилла</code>.</li></ol></div>
  </div>
  <div class="tips"><div><b>Названия пунктов</b> в меню могут немного отличаться — ищи «Коннекторы» и «Скиллы».</div><div class="gr"><b>Почти всё бесплатно.</b> У сервисов есть бесплатные тарифы; Claude Code — в подписке Pro.</div></div>''',
  'ОСНОВА|ДВА СЛОВА, КОТОРЫЕ НАДО ЗНАТЬ', 'КОННЕКТОРЫ', 'И СКИЛЛЫ'))
pages.append(page(3, tool(1, 'el', 'ElevenLabs', 'КОННЕКТОР', '~10 000 симв./мес бесплатно', 'Озвучка: Claude пишет текст, подбирает голос и озвучивает. Голос из видео — Nikolay.',
  [f'{CONN} → ElevenLabs.', 'Нет в каталоге — «Добавить свой коннектор»: [[api.elevenlabs.io/v1/mcp]]', 'Войди в аккаунт ElevenLabs и разреши доступ.'],
  ['Через ElevenLabs найди 5 русских голосов и пришли их демо.', 'Потом озвучь этот текст голосом, который я выберу: [[текст]]']) +
  tool(2, 'figma', 'Figma', 'КОННЕКТОР', 'бесплатный план', 'Обложки, баннеры, макеты — Claude собирает дизайн прямо в Figma, каждым элементом на отдельном слое.',
  [f'{CONN} → Figma.', 'Войди в аккаунт Figma.', 'Дай ссылку на файл или попроси создать новый.'],
  ['Создай в Figma обложку YouTube 1280×720: тёмный фон, крупный текст «[[ТЕКСТ]]», оранжевый акцент. Каждый элемент — отдельным слоем.'])))
pages.append(page(4, tool(3, 'canva', 'Canva', 'КОННЕКТОР', 'бесплатный план', 'Если Figma кажется сложной: посты, сторис, презентации из шаблонов — по одному описанию.',
  [f'{CONN} → Canva.', 'Войди в аккаунт Canva.', 'Готовые дизайны появятся у тебя в Canva.'],
  ['Сделай в Canva пост 1080×1080 и сторис 9:16 на тему «[[тема]]» в оранжевом стиле — 3 варианта.']) +
  tool(4, 'vidiq', 'vidIQ', 'КОННЕКТОР', 'есть бесплатный тариф', 'Аналитика YouTube: какие ролики в теме выстрелили, их обложки и названия, теги.',
  [f'{CONN} → vidIQ.', 'Войди в аккаунт vidIQ и привяжи канал (по желанию).', 'Проси разбор по своей теме.'],
  ['Через vidIQ найди ролики-выбросы по запросу «[[тема]]» за 30 дней. Разбери обложки и названия топ-5 и предложи 10 тегов.'])))
pages.append(page(5, tool(5, 'notion', 'Notion', 'КОННЕКТОР', 'бесплатно', 'База: идеи, контент-план, сценарии. Claude сам записывает туда итоги и продолжает с того же места.',
  [f'{CONN} → Notion.', 'Выбери страницы, к которым дашь доступ.', 'Скажи Claude, в какую базу писать.'],
  ['Создай в Notion базу «Контент-план» с колонками Идеи / Сценарий / Монтаж / Готово и добавь 5 идей для роликов про [[тема]].']) +
  tool(6, 'github', 'GitHub', 'КОННЕКТОР', 'бесплатно', 'Хранит каждый проект и каждую версию. Сломал — откатился за секунду.',
  [f'{CONN} → GitHub.', 'Разреши доступ к нужным репозиториям.', 'В Claude Code просто попроси сохранить коммит.'],
  ['Создай приватный репозиторий для моих роликов и сохраняй каждую версию коммитом с понятным описанием.'])))
pages.append(page(6, tool(7, 'brag', 'brag-slim', 'СКИЛЛ', 'бесплатно', 'Промо-ролик из проекта или сайта: хук, музыка в бит, текст для поста — одной командой.',
  ['Открой Claude Code (вкладка «Код»).', 'Вызови скилл: [[/brag-slim]] + папка или ссылка.', 'Нет такого скилла — попроси skill-creator собрать похожий.'],
  ['/brag-slim [[папка проекта или ссылка]] — вертикально, 20–30 секунд, моушен-дизайн.']) +
  tool(8, 'docs', 'PDF · Word · PowerPoint', 'СКИЛЛЫ', 'бесплатно', 'Гайды, презентации, таблицы — сразу готовым файлом. Эту шпаргалку Claude сверстал сам.',
  ['Настройки → Возможности → Скиллы.', 'Включи pdf, docx, pptx (и xlsx для таблиц).', 'Проси результат файлом нужного формата.'],
  ['Сверстай PDF-гайд: 8 страниц 1080×1350, тёмный фон, оранжевые акценты, по этому тексту: [[текст]]'])))
pages.append(page(7, tool(9, 'skill', 'skill-creator', 'СКИЛЛ', 'бесплатно', 'Скилл, который делает скиллы: объясни задачу один раз — дальше хватит одной команды.',
  ['Включи skill-creator в разделе «Скиллы».', 'Сделай задачу вместе с Claude один раз.', 'Попроси сохранить процесс как скилл.'],
  ['Запомни процесс, который мы только что сделали, и сохрани его как скилл [[имя]]. Опиши шаги так, чтобы в следующий раз хватило одной команды.']) +
  tool(10, 'research', 'deep-research', 'СКИЛЛ', 'бесплатно', 'Глубокий поиск: Claude читает десятки источников и собирает отчёт со ссылками.',
  ['Включи веб-поиск в Claude.', 'Включи скилл deep-research (или режим «Исследование»).', 'Сформулируй вопрос и формат отчёта.'],
  ['Проведи глубокое исследование: [[вопрос]]. Минимум 20 источников, итог — отчёт со ссылками и таблицей сравнения.'])))
pages.append(page(8, f'''
  <div class="tool">
    <div class="thead">{tile('cc')}{tile('remotion')}<div class="tn"><small>БОНУС</small><h3>Claude Code + Remotion</h3></div></div>
    <p class="what">Claude Code пишет код сам, а бесплатная Remotion превращает код в видео. Ролик к этой шпаргалке собран так — без After Effects.</p>
    <div class="prompt"><div class="ptop"><span>ПЕРВЫЙ ПРОМПТ</span><i></i><i></i><i></i></div><div class="pbody"><p>Создай проект на Remotion и собери ролик 1920×1080 по сценарию и озвучке: каждая анимация — функция времени, переходы плавные, звуки в такт.</p></div></div>
  </div>
  <h2>МОЙ ТОП-3, ЕСЛИ СТАВИТЬ ТОЛЬКО ТРИ</h2>
  <div class="top3"><div>{tile('el', 84)}<b>ElevenLabs</b><span>голос</span></div><div>{tile('skill', 84)}<b>skill-creator</b><span>свои навыки</span></div><div>{tile('cc', 84)}<b>Claude Code</b><span>делает руками</span></div></div>
  <div class="eleven"><div class="lock">11</div><div><h3>Мой скилл: моушен-ролик в моём стиле</h3><p>Файл <code>motion-skill.md</code> лежит рядом с этой шпаргалкой в закреплённом посте. Скинь его в Claude Code — и он соберёт ролик по моему процессу: референс → сценарий → озвучка → анимация → звук → рендер.</p></div></div>
  <div class="sub"><div><h3>Больше промптов и скиллов</h3><p>Новые разборы — в Telegram <b>@claudecode09</b></p></div><span class="btn">ПОДПИСАТЬСЯ ›</span></div>
  <p class="legal">Личная шпаргалка. Не связана с Anthropic и сервисами из списка; все названия — товарные знаки их владельцев. Тарифы и меню могут меняться.</p>'''))

css = (here / 'style.css').read_text()
(here / 'sheet.html').write_text(f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>10 инструментов для Claude — шпаргалка</title><style>{css}</style></head><body>{"".join(pages)}</body></html>')
print('pages', len(pages))
