# «Ты — Танджиро. И это вся твоя жизнь»

Remotion-проект (React + SVG). 16 глав, ~16 минут, 1920×1080, 30 fps.

## Структура
- `СЦЕНАРИЙ.md` — исходный план и текст озвучки.
- `public/vo/00..15.mp3` — озвучка ElevenLabs (голос Сергей, eleven_v4), одна глава = один файл.
- `tools/chapters.json` — текст глав (из сценария), `tools/asr/*.json` — распознанные тайм-коды слов (faster-whisper small).
- `src/data/timeline.json` — тайм-коды каждого слова на общей шкале (субтитры, привязка кадров).
- `src/rig/` — векторный риг персонажей (`Char.tsx`), причёски из прядей (`hair.tsx`), лист персонажей (`chars.ts`), узоры тканей (`Defs.tsx`).
- `src/scenes/BG.tsx` — фоны тушью с параллаксом, `src/scenes/FX.tsx` — дыхание воды/солнца, пламя Незуко, молнии, кляксы и т. д.
- `src/shots/ch*.tsx` — раскадровка: каждый план привязан к фразе голоса (`at`), у плана есть камера, персонажи, эффекты, SFX и настроение музыки.
- `src/Main.tsx` — сборка: планы, HUD «ТЕБЕ N ЛЕТ / СЕМЬЯ», субтитры с подсветкой слова, карточки глав, «живая» камера.
- `tools/audio.py` — процедурная музыка (кото, сякухати, тайко; главная тема-мотив) + SFX по событиям из раскадровки + сведение с голосом; `tools/loudness.py` — мастеринг до −14 LUFS.

## Пересборка
```bash
npm i
python3 tools/align_asr.py            # тайм-коды слов -> src/data/timeline.json
python3 tools/audio.py                # music/sfx/voice -> public/audio/mix_raw.wav
python3 tools/loudness.py public/audio/mix_raw.wav public/audio/mix.wav --target -14 --tp -1.5
npx remotion render src/index.ts Main out/silent.mp4 --muted --crf=20
ffmpeg -i out/silent.mp4 -i public/audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/Ты — Танджиро.mp4"
```
Просмотр в Studio: `npx remotion studio`.

Персонажи нарисованы с нуля векторными формами по присланным референсам; официальные кадры, арты и музыка аниме не используются.
Озвучка сделана на бесплатных аккаунтах ElevenLabs — монетизация такой озвучки не разрешена, в описании нужно указать ElevenLabs.
