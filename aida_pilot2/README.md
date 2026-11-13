# «Айда!» — пилот 2 (20–25 сек), картинки и клипы во Flow

## Текст озвучки (~22 сек)
Ты — Гриша Хрипунов. Казань, тысяча девятьсот семьдесят восьмой.
Чтобы стать своим в банде «Тяп-Ляп», нужно выдержать всего один удар. … Удар Рябы.
Ты падаешь. Больница.
Но ты возвращаешься. И встаёшь. … Теперь ты свой.
(шёпотом) И это вся твоя жизнь.

## Шаг 0 — «ингредиент» героя (сгенерировать первым, потом прикреплять ко всем кадрам)
**G0 — Гриша, референс**
```
Character reference sheet, detailed comic book illustration, thick black ink outlines, gritty muted colors, digital painting. GRISHA: a 15-year-old Soviet boy from the late 1970s, short dark brown hair, thin pale face, big anxious grey eyes, slightly bruised knuckles, wearing a grey wool coat with a brown fur collar and a long red knitted scarf. Front view and three-quarter view on a plain light background. No text.
```

## Кадры (16:9, к каждому прикрепить G0)
Общий стиль в начале каждого запроса: `Detailed comic book illustration, thick black ink outlines, gritty muted colors with warm highlights, digital painting, 16:9, no text.`

| № | Время | Фраза | Запрос (после общего стиля) |
|---|---|---|---|
| 01 | 0–4 с | «Ты — Гриша Хрипунов. Казань, 1978» | `Grisha walks alone through a snowy 1978 Kazan street between grey five-story panel buildings at dusk, an orange street lamp, steam from a factory chimney, he looks over his shoulder at the viewer.` |
| 02 | 4–8 с | «Чтобы стать своим в банде…» | `A cramped basement gym of a teenage street gang: homemade barbells made of pipes and car parts, a punching bag, bare light bulb, a dozen teenagers in flat caps and tracksuits standing in a circle staring at Grisha, who stands in the middle.` |
| 03 | 8–11 с | «…выдержать один удар. Удар Рябы» | `RYABA, a broad-shouldered 19-year-old gang leader with a shaved head, scar on his eyebrow and a cold stare, tracksuit jacket, slowly wraps his fist with a rag, low-angle shot, the gang behind him in shadow.` |
| 04 | 11–14 с | «Ты падаешь» | `Dramatic impact moment: Ryaba's fist hits Grisha in the chest, Grisha flies backwards toward the concrete floor, motion lines, dust, the gang watching, dutch angle.` — **кандидат на видео-клип Veo (5 с)** |
| 05 | 14–16 с | «Больница» | `Grisha lies in a 1970s Soviet hospital bed with bruises on his face, pale green walls, a barred window with snow outside, he stares at the ceiling, determined.` |
| 06 | 16–20 с | «Но ты возвращаешься. И встаёшь» | `Back in the basement gym: Grisha, bruised, rises from one knee and stands straight, fists clenched, while Ryaba nods slightly and the gang begins to clap, warm bulb light.` — **кандидат на видео-клип Veo** |
| 07 | 20–24 с | «Теперь ты свой… И это вся твоя жизнь» | `Night, falling snow: Grisha walks in the middle of the gang down a dark Kazan street, flat caps and tracksuits, seen from behind, a single street lamp ahead, ominous mood.` |

## Как отдавать мне
Скачать картинки/клипы, назвать `01.png … 07.png` (клипы `04.mp4`, `06.mp4`) и загрузить в эту папку `aida_pilot2/` на GitHub (ветка `ccr-3d5b7ae1-kwtlua`) — или запустить сессию Claude на своём компьютере, и я сделаю всё во Flow сам.

## Статус: пилот 2 собран (13.11.2026)
- **`pilot2.mp4`** — 23 с, 1280×720, 30 fps; голос + дрон/удары (sfx 0.55, limiter).
- Кадры `G0.png`, `01–07.png` — Google Flow, Nano Banana 2.1 (0 кредитов), 1376×768, по 2 варианта на кадр
  (все варианты — `variants/contact_sheet.jpg`; выбраны 01b 02a 03b 04b 05b 06b 07b). G0 прикреплялся
  «ингредиентом» ко всем кадрам с Гришей, кадр 03 (Ряба) — к 04 и 06.
- **Кадр 04 изменён:** Flow отклонил «Ряба бьёт Гришу» (правило о насилии над несовершеннолетними).
  Сделан удар от первого лица — кулак Рябы летит в камеру. В полном видео делать так же: удары по Грише — POV/последствия.
- **Озвучка `voice.mp3`** (21.3 с) — ElevenLabs, голос Fuad, `eleven_v4`, 245 кредитов. Текст сокращён под остаток кредитов:
  «Ты — Гриша Хрипунов. Казань, семьдесят восьмой. … Чтобы стать своим в «Тяп-Ляп», нужно выдержать один удар. … Удар Рябы. …
  Ты падаешь. Больница. Но ты возвращаешься. И встаёшь. Теперь ты свой. (шёпотом) И это вся твоя жизнь.»
  Free-план ElevenLabs часто отвечает «busy» — помогают повторы раз в минуту.
- **Тайминг** — scribe по словам → `timing.json` (склейки и удары). Клипы Veo для 04/06 не делались.

### Пересборка
```
pip install pillow numpy        # + ffmpeg в PATH
python aida_pilot2/src/montage2.py   # → pilot2_video.mp4 (без звука)
python aida_pilot2/src/sfx2.py       # → sfx.wav и итоговый pilot2.mp4
```
Шрифт: `fonts/RobotoCondensed-VF.ttf` (Google Fonts, OFL; начертание Bold выставляется в скрипте).
