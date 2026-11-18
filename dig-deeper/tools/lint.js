// Проверка Luau-кода: синтаксис (Lua 5.1-совместимый поднабор) + неизвестные глобальные
// переменные (опечатки). Запуск: node tools/lint.js  (нужен пакет luaparse)
const fs = require('fs');
const path = require('path');
const luaparse = require('luaparse');

const ROOT = path.join(__dirname, '..', 'src');
const ROBLOX_GLOBALS = new Set([
  'game', 'workspace', 'script', 'plugin', 'shared',
  'Instance', 'Vector3', 'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect', 'Ray',
  'Enum', 'TweenInfo', 'NumberSequence', 'NumberSequenceKeypoint', 'ColorSequence', 'ColorSequenceKeypoint',
  'NumberRange', 'RaycastParams', 'OverlapParams', 'PhysicalProperties', 'Region3', 'Font', 'Axes', 'Faces',
  'task', 'tick', 'time', 'wait', 'delay', 'spawn', 'typeof', 'warn', 'print', 'error', 'assert',
  'pcall', 'xpcall', 'select', 'type', 'tostring', 'tonumber', 'pairs', 'ipairs', 'next', 'unpack',
  'setmetatable', 'getmetatable', 'rawget', 'rawset', 'rawequal', 'require',
  'math', 'string', 'table', 'os', 'coroutine', 'utf8', 'bit32', 'debug', 'buffer', 'DateTime', 'Random',
]);

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out); else if (p.endsWith('.luau') || p.endsWith('.lua')) out.push(p);
  }
  return out;
}

let problems = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'latin1');
  let ast;
  try {
    ast = luaparse.parse(src, { scope: true, locations: true, luaVersion: '5.1', encodingMode: 'pseudo-latin1' });
  } catch (e) {
    console.log(`SYNTAX ${path.relative(ROOT, file)}: ${e.message}`);
    problems++;
    continue;
  }
  for (const g of ast.globals) {
    if (!ROBLOX_GLOBALS.has(g.name)) {
      const lines = [];
      // find all usage lines
      const re = new RegExp(`\\b${g.name}\\b`, 'g');
      src.split('\n').forEach((l, i) => { if (re.test(l)) lines.push(i + 1); re.lastIndex = 0; });
      console.log(`GLOBAL ${path.relative(ROOT, file)}: '${g.name}' (lines ${lines.slice(0, 6).join(', ')})`);
      problems++;
    }
  }
}
console.log(problems ? `\n${problems} problem(s)` : 'OK: no problems');
process.exit(problems ? 1 : 0);
