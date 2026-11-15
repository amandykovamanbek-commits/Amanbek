"""Builds guide.html (10 pages, 1080x1350). Render to PDF with render.cjs."""
import html, pathlib
here = pathlib.Path(__file__).parent
N = 10
H = html.escape

def ph(s):  # highlight [placeholders] inside prompts
    import re
    return re.sub(r'\[\[(.+?)\]\]', r'<span class="hl">\1</span>', H(s))

def prompt(n, title, lines):
    body = ''.join(f'<p>{ph(l)}</p>' if not l.startswith('- ') else f'<li>{ph(l[2:])}</li>' for l in lines)
    body = body.replace('</p><li>', '</p><ol><li>').replace('</li><p>', '</li></ol><p>')
    if body.endswith('</li>'): body += '</ol>'
    return f'<div class="prompt"><div class="ptop"><span>ПРОМПТ {n:02d} · {title}</span><i></i><i></i><i></i></div><div class="pbody">{body}</div></div>'

def page(i, tag, title1, title2, inner):
    bars = ''.join(f'<b class="{"on" if k < i else ""}"></b>' for k in range(N))
    return f'''<section class="page">
  <div class="glow"></div>
  <header><span class="dot"></span><b>@CLAUDECODE09</b><span class="mid">CLAUDE × REMOTION</span><span class="r">ГАЙД К РОЛИКУ · 2026</span></header>
  {f'<div class="tag"><span>ШАГ {i-1:02d}</span>{tag}</div>' if tag else ''}
  {f'<h1>{title1}<br><em>{title2}</em></h1>' if title1 else ''}
  {inner}
  <footer><span>@claudecode09 · Моушен-ролик в Claude</span><span class="r">СТР. {i:02d}/{N:02d} <span class="bars">{bars}</span></span></footer>
</section>'''

SPARK = '<svg class="spark" viewBox="-100 -100 200 200">' + ''.join(
    f'<line x1="0" y1="0" x2="{90*__import__("math").cos(a*3.14159/180):.1f}" y2="{90*__import__("math").sin(a*3.14159/180):.1f}"/>'
    for a in [0, 31, 58, 92, 118, 151, 179, 211, 238, 271, 300, 331]) + '</svg>'

pages = []

# 1 — cover
pages.append(page(1, '', '', '', f'''
  <div class="covertag"><span class="new">NEW</span>CLAUDE CODE × REMOTION × ELEVENLABS</div>
  <div class="cover">{SPARK}<h1 class="big">МОУШЕН-РОЛИК<br>В CLAUDE.<br><em>БЕЗ AFTER<br>EFFECTS.</em></h1></div>
  <p class="lead">Пошаговый гайд: от референсов до готового MP4 с озвучкой, музыкой и звуками. Анимацию, монтаж и звук Claude пишет <b>кодом</b>, а ты только ставишь задачу и принимаешь работу.</p>
  <div class="stats">
    <div class="stat"><small>ПРОМПТОВ</small><strong class="o">6</strong><span>от референса<br>до готового ролика</span></div>
    <div class="stat"><small>КЛЮЧЕЙ РУКАМИ</small><strong class="g">0</strong><span>ни одного ключевого<br>кадра в таймлайне</span></div>
    <div class="stat cta"><small>СОФТ</small><strong>0 ₽</strong><span>Remotion, ffmpeg —<br>бесплатно для личного</span></div>
  </div>'''))

# 2 — how it works
pages.append(page(2, 'КАК ЭТО РАБОТАЕТ', 'ИДЕЯ — ТВОЯ.', 'МОНТАЖ — CLAUDE.', '''
  <p class="lead">Claude не двигает слои мышкой. Он пишет <b>код на React</b> для бесплатной библиотеки <code>Remotion</code>: каждый кадр — это функция времени. Потом одна команда рендерит код в MP4. Озвучку он делает через коннектор ElevenLabs, а звуки и музыку сводит сам.</p>
  <h2>ЧТО МОЖНО СОБРАТЬ</h2>
  <div class="grid3">
    <div class="card"><h3>Кинетический текст</h3><p>слова проявляются из размытия, наезды, motion blur</p></div>
    <div class="card"><h3>Сцены интерфейса</h3><p>курсор кликает, печатается промпт, летят файлы</p></div>
    <div class="card"><h3>3D и свет</h3><p>наклоны камеры, свечение, зерно, виньетка</p></div>
    <div class="card"><h3>Субтитры по словам</h3><p>каждое слово попадает в голос</p></div>
    <div class="card"><h3>Переходы в бит</h3><p>склейки стоят на долях музыки</p></div>
    <div class="card"><h3>Звук</h3><p>клики, клавиатура, свисты в тон трека</p></div>
  </div>
  <h2>ПРОХОЖДЕНИЕ</h2>
  <div class="steps">
    <div><small>01</small><b>Разведка</b><span>разбор референсов</span></div>
    <div><small>02</small><b>Сценарий</b><span>идея → текст и раскадровка</span></div>
    <div><small>03</small><b>Озвучка</b><span>ElevenLabs + тайминг слов</span></div>
    <div><small>04</small><b>Сборка</b><span>код Remotion</span></div>
    <div><small>05</small><b>Звук</b><span>музыка, SFX, громкость</span></div>
    <div class="ok"><small>06</small><b>Рендер</b><span>MP4 + обложка</span></div>
  </div>'''))

# 3 — inventory
pages.append(page(3, 'ИНВЕНТАРЬ', '15 МИНУТ', 'НА ПОДГОТОВКУ.', '''
  <div class="grid3 tall">
    <div class="card top"><small>СЛОТ 1 · ГЛАВНОЕ</small><h3>Claude Code</h3><p>claude.ai/code в браузере, десктоп-приложение или терминал. Нужна подписка Claude Pro или выше.</p></div>
    <div class="card top"><small>СЛОТ 2 · ДВИЖОК</small><h3>Node.js + ffmpeg</h3><p>Node 18+ и ffmpeg. Remotion Claude поставит сам: <code>npm i remotion @remotion/cli</code>.</p></div>
    <div class="card top"><small>СЛОТ 3 · КАРТА</small><h3>Одна папка</h3><p>Весь проект в одном месте — Claude работает внутри неё. Лучше сразу с GitHub, чтобы ничего не потерять.</p></div>
  </div>
  <pre class="tree"><g>my-video/</g>
├── reference/   <o>← ролики-референсы (mp4)</o>
├── assets/      <o>← музыка, шрифты, аватар, логотипы</o>
├── src/         <o>← сюда Claude пишет код сцен</o>
├── public/      <o>← озвучка, звуки, шрифты для рендера</o>
└── out/         <o>← готовые MP4 и обложки</o></pre>
  <h2>КОННЕКТОРЫ И СКИЛЛЫ <span class="h2n">Claude → Настройки → Коннекторы</span></h2>
  <div class="list">
    <div><span class="pill o">КОННЕКТОР</span><b>ElevenLabs</b> — озвучка. Бесплатно ~10 000 символов/мес, ролик ≈ 300–700.</div>
    <div><span class="pill">КОННЕКТОР</span><b>GitHub</b> — хранит проект и все версии ролика.</div>
    <div><span class="pill">ПО ЖЕЛАНИЮ</span><b>vidIQ</b> — названия и теги. <b>Higgsfield</b> — ИИ-видео (платно).</div>
    <div><span class="pill g">СКИЛЛ</span><b>/anthropic-skills:brag-slim</b> — хук, раскадровка, музыка в бит, рендер.</div>
    <div><span class="pill g">СКИЛЛ</span><b>/anthropic-skills:skill-creator</b> — сохрани этот процесс как свой скилл.</div>
  </div>
'''))

# 4 — recon
pages.append(page(4, 'РАЗВЕДКА', 'СНАЧАЛА РЕФЕРЕНСЫ.', 'ПОТОМ МОНТАЖ.', f'''
  <p class="lead">Скачай 3–5 роликов, на которые хочешь быть похож, и положи в <code>/reference</code>. Видео Claude не «смотрит», зато отлично читает кадры: он раскладывает ролик на картинки и разбирает каждую.</p>
  {prompt(1, 'РАЗБОР РЕФЕРЕНСОВ', [
    'В папке /reference лежат ролики-референсы. Пока ничего не собирай.',
    'Разложи каждый ролик на кадры через ffmpeg (контакт-листы, на быстрых местах — каждый кадр) и изучи. Создай [[style.md]]:',
    '- Сцены с таймкодами начала и конца.',
    '- Все элементы сцены и как они появляются и уходят.',
    '- Как анимируется текст: блоком, по словам или по буквам.',
    '- Камера: наезды, наклоны, размытие, motion blur.',
    '- Переходы и на какую долю музыки они попадают.',
    '- Размер кадра, fps, цвета в hex, шрифты (или бесплатные аналоги с кириллицей), звуки.',
    'Если что-то непонятно или слишком быстро — перечисли в конце, не угадывай.'])}
  <div class="tips"><div><b>style.md — твоя карта.</b> Дальше в промптах хватит «как в style.md», стиль заново описывать не нужно.</div><div class="gr"><b>Скинул референсы прямо в чат?</b> Тоже работает: Claude сохранит их в /reference и разберёт.</div></div>'''))

# 5 — script
pages.append(page(5, 'СЦЕНАРИЙ', 'ИДЕЯ — ЗА ТОБОЙ.', 'СЦЕНАРИЙ — ЗА МИНУТУ.', f'''
  <p class="lead">Дай тему, формат и концовку — Claude напишет текст озвучки и раскадровку, где на каждом слове что-то происходит. Подставь свои значения в подсвеченные поля.</p>
  {prompt(2, 'ИДЕЯ → СЦЕНАРИЙ', [
    'Тема ролика: [[«Как делать ИИ-видео в Claude»]]. Формат: вертикальный [[1080×1920, 25–30 секунд]], закадровый голос на русском, стиль — как в style.md.',
    'Напиши [[scenario.md]]:',
    '- Хук на первые 2 секунды — то, ради чего досмотрят.',
    '- Текст озвучки: одна короткая фраза на сцену.',
    '- Для каждой сцены: что на экране, на каком слове что происходит (клик, появление, вспышка), длительность.',
    '- Иностранные слова пиши так, как их надо произнести: Claude → «Клод».',
    'Последняя сцена — призыв: [[все промпты в моём Telegram, ссылка в шапке профиля]].'])}
  <div class="tips"><div><b>15–30 секунд.</b> Больше — досматривают хуже. Одна мысль на сцену.</div><div class="gr"><b>Нравится — фиксируй.</b> Правь сценарий сразу текстом: «сцену 3 короче», «хук жёстче». Переписывать код потом дороже.</div></div>'''))

# 6 — voice
pages.append(page(6, 'ОЗВУЧКА', 'ГОЛОС —', 'ЧЕРЕЗ ELEVENLABS.', f'''
  <p class="lead">Подключи коннектор ElevenLabs. Сначала послушай голоса (демо-записи бесплатные), потом озвучивай. Claude сам разметит время каждого слова — по нему потом двигается вся анимация.</p>
  {prompt(3, 'ГОЛОС И ТАЙМИНГ', [
    'Через коннектор ElevenLabs найди 5–6 русских голосов и пришли мне их демо — выберу сам.',
    'Потом озвучь текст из scenario.md голосом [[Nikolay]], модель [[eleven_v3]] (если занята — eleven_multilingual_v2).',
    'Скачай аудио, разметь время каждого слова по паузам (ffmpeg silencedetect) и сохрани [[words.json]].',
    'Паузы добавляй только между предложениями — не посреди фразы.'])}
  <div class="grid3 small">
    <div class="card"><h3>«Генерация занята»</h3><p>Бесплатная очередь. Повтори через минуту или смени модель.</p></div>
    <div class="card"><h3>Странное ударение</h3><p>Пиши по-русски: «Клод», «Афтер Эффектс», «Ремоушн».</p></div>
    <div class="card"><h3>Кредиты кончились</h3><p>Смотри остаток через коннектор; лимит обновляется раз в месяц.</p></div>
  </div>'''))

# 7 — build
pages.append(page(7, 'СБОРКА', 'ОДИН ПРОМПТ —', 'ВЕСЬ РОЛИК.', f'''
  <p class="lead">Главный промпт. Claude пишет все сцены на Remotion, привязывает анимацию к словам и сам проверяет кадры, прежде чем рендерить.</p>
  {prompt(4, 'СБОРКА В REMOTION', [
    'Собери ролик на Remotion по scenario.md и style.md: [[1080×1920, 30 fps]]. Каждый кадр — чистая функция времени, все анимации привязаны к словам из words.json.',
    '- Шрифты подключи локально, с кириллицей (например, [[Onest]]).',
    '- Текст — по словам, с размытием и наездом камеры; переходы-маски; 3D-наклоны; зерно и виньетка.',
    '- Интерфейсы рисуй сам: курсор, клики, печать текста, летящие файлы. Без чужих логотипов.',
    '- Перед полным рендером сделай кадры каждой сцены и середины переходов — проверь наложения, обрезку текста и контраст, исправь.',
    'Потом отрендери [[out/video.mp4]] и честно скажи, что отличается от референса.'])}
  <div class="tips"><div><b>Последняя строка — твой радар.</b> Claude сам скажет, что не получилось и что он не смог проверить.</div><div class="gr"><b>Быстрый путь.</b> Всё то же одной командой: <code>/anthropic-skills:brag-slim</code> + тема и «вертикально, моушен-дизайн».</div></div>'''))

# 8 — sound
pages.append(page(8, 'ЗВУК', 'МУЗЫКА В БИТ.', 'ЗВУКИ В ТОН.', f'''
  <p class="lead">Звук делает половину «дорогого» ощущения. Положи свой трек в <code>/assets</code> — Claude найдёт темп, поставит склейки на доли и приглушит музыку под голос.</p>
  {prompt(5, 'МУЗЫКА И SFX', [
    'Музыка — файл [[assets/music.mp3]]. Определи темп (BPM) и сильные доли, поставь все склейки сцен на доли.',
    '- Приглушай музыку, пока говорит голос, в паузах — громче.',
    '- Добавь звуки как в референсах: клики мыши, клавиатуру, свисты на переходах, «поп» на появлениях. Тихо, под музыкой, без резких пиков.',
    '- Итоговая громкость [[−14 LUFS]] — стандарт для Reels, Shorts и TikTok.'])}
  <div class="eq"><span style="height:30%"></span><span style="height:60%"></span><span style="height:85%"></span><span style="height:45%"></span><span style="height:95%"></span><span style="height:55%"></span><span style="height:70%"></span><span style="height:35%"></span><span style="height:80%"></span><span style="height:50%"></span><span style="height:90%"></span><span style="height:40%"></span><span style="height:65%"></span><span style="height:25%"></span><span style="height:75%"></span><span style="height:45%"></span></div>
  <div class="tips"><div><b>Нет своего трека?</b> Claude синтезирует фон сам — кодом, в нужной тональности.</div><div class="gr"><b>Права на музыку.</b> Для публикации бери треки из библиотеки платформы или со свободной лицензией.</div></div>'''))

# 9 — render & fix
pages.append(page(9, 'РЕНДЕР И ПРАВКИ', 'ЧТО-ТО НЕ ТАК?', 'ПРОСТО НАПИШИ.', f'''
  <p class="lead">Правки — обычным текстом, как монтажёру. Не чини код руками: опиши, что видишь, или кинь скрин и текст ошибки.</p>
  {prompt(6, 'ПРАВКИ', [
    '[[Сцена с чатом слишком быстрая — замедли, чтобы промпт успели прочитать.]]',
    '[[Убери персонажа, вместо него — звёздочка Claude. Поменяй шрифт.]]',
    'Пришли кадры до и после, потом перерендерь.'])}
  <div class="steps3">
    <div><small>01</small><b>Скрин</b><span>окно с ошибкой целиком — текст должен читаться</span></div>
    <div><small>02</small><b>Кинь Claude</b><span>прямо в чат, можно без слов</span></div>
    <div class="ok"><small>03</small><b>Респаун</b><span>Claude находит причину, чинит и рендерит заново</span></div>
  </div>
  <div class="tips one"><div class="gr"><b>Финиш.</b> Попроси обложку (лучший кадр, вшитый в первый кадр видео) и текст для поста — и публикуй.</div></div>'''))

# 10 — outro
pages.append(page(10, 'ФИНИШ', 'КОД — ЗА CLAUDE.', 'ВКУС — ЗА ТОБОЙ.', '''
  <p class="lead">Claude берёт на себя рутину: ключевые кадры, тайминг, звук и рендер. Идея, подача и то, что войдёт в финал, — это твой скилл.</p>
  <div class="done">
    <small>МИССИЯ ВЫПОЛНЕНА</small>
    <div class="row"><div><strong class="o">6</strong><span>промптов</span></div><div><strong class="g">0</strong><span>ключей руками</span></div><div><strong class="o">1</strong><span>готовый MP4</span></div></div>
    <div class="xp"><i></i></div>
  </div>
  <div class="grid2">
    <div class="card top"><small>ПРАВИЛО</small><h3>Указывай авторов</h3><p>Референсы — для учёбы. Повторяешь чужой стиль — отметь автора оригинала.</p></div>
    <div class="card top"><small>ПРАВИЛО</small><h3>Честно о процессе</h3><p>Что-то доделал руками — так и скажи. Это нормально.</p></div>
  </div>
  <div class="sub"><div><h3>Все промпты и разборы</h3><p>ИИ-видео и моушен в Claude на практике — в Telegram <b>@claudecode09</b></p></div><span class="btn">ПОДПИСАТЬСЯ ›</span></div>
  <p class="legal">Личный гайд. Не связан с Anthropic, Remotion или ElevenLabs. Claude, Remotion, ElevenLabs и After Effects — товарные знаки их владельцев.</p>'''))

css = (here / 'style.css').read_text()
(here / 'guide.html').write_text(f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Моушен-ролик в Claude — гайд</title><style>{css}</style></head><body>{"".join(pages)}</body></html>')
print('pages', len(pages))
