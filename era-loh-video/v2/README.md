# Ера лох — v2 (по скиллам obsion-motion + стайлгайд)

`../era_loh_v2.mp4` — 1080×1920, 60 fps, H.264 + AAC, звук −14 LUFS / −2.2 dBTP, 46.8 с.

Сборка:
1. `python3 timeline.py <voices_dir> .` — единый таймлайн: сцены, реплики, огибающие для липсинка, SFX-события → `data.js`, `voices.json`.
2. `node prender.cjs index.html frames 60 <worker> <workers> [--audio]` — покадровый рендер (`window.__seek(t)`), воркер 0 с `--audio` пишет `sfx.wav` (sfx.js: SFX + музыкальная подложка).
3. `python3 mix2.py sfx.wav voices.json <voices_dir> mix_raw.wav && python3 loudness.py mix_raw.wav mix.wav`.
4. `ffmpeg -framerate 60 -i frames/f%06d.png -i mix.wav ... era_loh_v2.mp4`.

Голоса лежат файлами `h1..h12.wav` (крик по сценам), `v_who/v_grandma/v_woman/v_agree/v_yera.wav` —
их можно заменить на озвучку ElevenLabs и пересобрать звук без перерендера картинки (тайминги субтитров пересчитаются в шаге 1, но тогда картинку нужно перерендерить).
