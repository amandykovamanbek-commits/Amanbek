# ⛏ Копай глубже / Dig to the Core — Roblox

**Быстрый старт:** скачай `build/DigDeeper.rbxlx` → открой двойным кликом в Roblox Studio → **Play**.

Подробно — в заметках `docs/` (открой папку `docs` в Obsidian как хранилище): начни с `🏠 Главная.md`.

- Все цены и настройки: `src/shared/Config.luau`
- Тексты RU/EN: `src/shared/Locale.luau`
- Собрать файл игры заново: `python3 tools/build_place.py`
- Проверки: `node tools/lint.js`, `node tools/test_shared.js` (нужны npm-пакеты `luaparse`, `fengari`)
- Макеты интерфейса: https://www.figma.com/design/1cKP3hDkn4fBIRNBIwlKoe
