# Ера лох — видео

`era_loh.mp4` — вертикальное видео 720x1280, 48 с: герой всё громче кричит «Ера лох!»
(70 → 340 дБ: улица, карта города, Земля, космос), прохожие реагируют, в конце звонит сам Ера.

Пересборка:
- голоса: RHVoice (`apt install rhvoice rhvoice-russian sox`), обработка — sox;
- `python3 mix.py <папка_с_wav> mix.wav` — звук;
- `python3 render.py video.mp4` — картинка (PIL + ffmpeg), затем склеить с `mix.wav` через ffmpeg.
