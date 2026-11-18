# «Твоё место за столом» — 3D-короткометражка на Three.js

Без озвучки: картинка, титры, музыка и звуки. 1920×1080, 24 fps, кадр 2.39:1 (letterbox), ~1:29.

## Как собрать
```bash
npm install
# кадры (можно параллельно диапазонами)
NODE_PATH=$(npm root -g) node render.cjs frames 0 2136 out/frames 1
# стиллы для проверки: node render.cjs stills 1,5.5,30 stills/x 0.5
# музыка (MIDI -> FluidSynth, FluidR3_GM) и звук
cd audio && python3 score.py && fluidsynth -ni -q -g 0.7 -r 48000 -F score.wav /usr/share/sounds/sf2/FluidR3_GM.sf2 score.mid \
  && fluidsynth -ni -q -g 0.7 -r 48000 -F tv.wav /usr/share/sounds/sf2/FluidR3_GM.sf2 tv.mid && python3 sfx.py && ./master.sh
```

## Устройство
- `src/character.js` — процедурный персонаж: риг, 2-костная IK, мимика (веки, брови, рот, слёзы), моргания, саккады, дыхание.
- `src/cast.js` — Арман, Айко (3, 6 и 7 лет), мама, папа, бабушка, дядя.
- `src/sets/*` — город, квартира, двор-флешбек, вокзал, улица, трасса, дом родителей.
- `src/shots_a|b|c.js` — 26 планов по сценарию (камера, игра, свет, титры).
- `src/post.js` — DOF, bloom, ACES, грейдинг по шотам, зерно, растворения.
- `audio/score.py` — оригинальная партитура (фортепиано, струнные, хор, колокола), `audio/sfx.py` — синтез звуков и сведение.
