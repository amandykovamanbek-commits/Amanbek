// Юнит-тесты общих модулей (Config, Economy, Locale) в настоящей Lua-машине (fengari).
// Запуск: node tools/test_shared.js   (нужны пакеты fengari)
const fs = require('fs');
const path = require('path');
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require('fengari');

const SHARED = path.join(__dirname, '..', 'src', 'shared');
const sources = {};
for (const f of fs.readdirSync(SHARED)) if (f.endsWith('.luau')) sources[f.replace('.luau', '')] = fs.readFileSync(path.join(SHARED, f), 'utf8');

const longStr = s => `[=======[${s}]=======]`;
let prelude = `
Vector3 = { new = function(x, y, z) return { X = x or 0, Y = y or 0, Z = z or 0 } end }
Color3 = { fromRGB = function(r, g, b) return { R = r / 255, G = g / 255, B = b / 255 } end, new = function(r, g, b) return { R = r, G = g, B = b } end }
Enum = setmetatable({}, { __index = function(t, k) local e = setmetatable({}, { __index = function(_, k2) return k .. "." .. k2 end }); rawset(t, k, e); return e end })
math.clamp = function(x, a, b) if x < a then return a elseif x > b then return b end return x end
local sources = {}
`;
for (const [name, src] of Object.entries(sources)) prelude += `sources[${JSON.stringify(name)}] = ${longStr(src)}\n`;
prelude += `
local loaded = {}
local Folder = setmetatable({}, { __index = function(_, k) return { __module = k } end })
function require(obj)
  local name = obj.__module
  if loaded[name] then return loaded[name] end
  local chunk = assert(load(sources[name], "=" .. name))
  script = { Parent = Folder, Name = name }
  loaded[name] = chunk()
  return loaded[name]
end
Config = require(Folder.Config); Economy = require(Folder.Economy); Locale = require(Folder.Locale)
local fails, passes = 0, 0
function check(name, got, want)
  if got == want then passes = passes + 1 else fails = fails + 1; print("FAIL " .. name .. ": got " .. tostring(got) .. ", want " .. tostring(want)) end
end
function near(name, got, want) check(name, math.abs(got - want) < 1e-9, true) end
function summary() print(("%d passed, %d failed"):format(passes, fails)); return fails end
`;

const tests = `
check("layer 0", Config.LayerForDepth(0).Id, "Dirt")
check("layer 49", Config.LayerForDepth(49).Id, "Dirt")
check("layer 50", Config.LayerForDepth(50).Id, "Stone")
check("layer 299", Config.LayerForDepth(299).Id, "Caves")
check("layer 999", Config.LayerForDepth(999).Id, "Core")
check("layer 1000", Config.LayerForDepth(1000).Id, "Core")
check("layers contiguous", (function() for i = 2, #Config.Layers do if Config.Layers[i].From ~= Config.Layers[i-1].To then return false end end return Config.Layers[#Config.Layers].To == Config.MaxDepth end)(), true)
check("layer power reachable", (function() for _, L in ipairs(Config.Layers) do local ok = false for _, p in ipairs(Config.Pickaxes) do if p.Power >= L.MinPower then ok = true end end if not ok then return L.Id end end return true end)(), true)
check("pick for power 8", Config.PickaxeForPower(8), 4)
check("pick for power 80", Config.PickaxeForPower(80), 7)
check("pick prices ascending", (function() for i = 2, #Config.Pickaxes do if Config.Pickaxes[i].Price <= Config.Pickaxes[i-1].Price then return i end end return true end)(), true)
check("bag prices ascending", (function() for i = 2, #Config.Backpacks do if Config.Backpacks[i].Price <= Config.Backpacks[i-1].Price then return i end end return true end)(), true)
check("ores registered", Config.Ores.Sapphire.Value, 250)
check("pass lookup", Config.FindPass("VIP").Price, 49)
check("product lookup", Config.FindProduct("ChestOfCash").Cash, 1000000)
check("rebirth cost 0", Economy.rebirthCost(0), 1000000)
check("rebirth cost 1", Economy.rebirthCost(1), 2500000)
check("rebirth cost 2", Economy.rebirthCost(2), 6250000)
near("mult base", Economy.cashMultiplier(0, {}), 1)
near("mult 2 rebirths + x2 + vip", Economy.cashMultiplier(2, { DoubleCash = true, VIP = true }), 2 * 2 * 1.25)
check("capacity", Economy.capacity(1, {}), 10)
check("capacity mega", Economy.capacity(3, { MegaBackpack = true }), 180)
near("cooldown base", Economy.swingCooldown(1, {}, false), 0.32)
near("cooldown fast+potion", Economy.swingCooldown(8, { FastMine = true }, true), 0.32 / 2 / 1.5 / 2)
check("luck", Economy.luck({ Lucky = true }, true), 6)
check("inv count", Economy.inventoryCount({ Dirt = 3, Coal = 2 }), 5)
check("inv value", Economy.inventoryValue({ Dirt = 3, Coal = 2, Unknown = 5 }), 13)
check("hits dirt", Economy.hitsToBreak(Config.Layers[1], 1), 1)
check("hits lava diamond", Economy.hitsToBreak(Config.Layers[4], 16), 4)
check("hits too weak", Economy.hitsToBreak(Config.Layers[4], 8), math.huge)
check("daily day1", Economy.dailyReward(1, 0, 1).Cash, 500)
check("daily day3 potion", Economy.dailyReward(3, 0, 1).Potion, "Speed")
check("daily day8 wraps", Economy.dailyReward(8, 0, 1).Cash, 500)
check("daily scaled", Economy.dailyReward(2, 1, 3).Cash, 1000 * 2 * 3)
check("cash pack", Economy.cashPackAmount(10000, 2), 30000)
check("depth at surface", Economy.depthAtY(Config.SurfaceY + 5), 0)
check("depth at 10", Economy.depthAtY(Config.SurfaceY - 10 * Config.BlockSize - 1), 10)
local L, i, f, left = Economy.layerProgress(100)
check("progress layer", L.Id, "Stone"); check("progress idx", i, 2); near("progress frac", f, 0.5); check("progress left", left, 50)
check("short 999", Locale.short(999), "999")
check("short 1000", Locale.short(1000), "1K")
check("short 1500", Locale.short(1500), "1.5K")
check("short 12345", Locale.short(12345), "12.3K")
check("short 150000", Locale.short(150000), "150K")
check("short 2.3M", Locale.short(2300000), "2.3M")
check("short 15M", Locale.short(15000000), "15M")
check("short 1.99M", Locale.short(1999999), "1.9M")
check("full", Locale.full(1234567), "1 234 567")
check("full small", Locale.full(12), "12")
check("timer", Locale.timer(75), "1:15")
check("duration h", Locale.duration("ru", 3725), "1ч 2м")
check("duration m", Locale.duration("en", 125), "2m 5s")
check("get fmt ru", Locale.get("ru", "Sold", "1.5K"), "Продано на $1.5K!")
check("get fmt en", Locale.get("en", "DepthFmt", 63, "Stone"), "⛏ 63 m · Stone")
check("get missing", Locale.get("ru", "NoSuchKey"), "NoSuchKey")
check("get percent raw", Locale.get("ru", "RebirthInfo"):find("50%%") ~= nil, true)
check("name", Locale.name("en", Config.Pickaxes[4].Name), "Gold")
-- все ключи ru есть в en и наоборот
local function keys(lang) local t = {} for _, k in ipairs({ "Shop","Rebirth","Bag","Premium","Rewards","Elevator","Surface" }) do t[k] = Locale.get(lang, k) end return t end
check("ru shop", keys("ru").Shop, "Магазин")
return summary()
`;

const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);
const code = prelude + tests;
const status = lauxlib.luaL_loadstring(L, to_luastring(code));
if (status !== lua.LUA_OK) { console.log('LOAD ERROR', to_jsstring(lua.lua_tostring(L, -1))); process.exit(1); }
const run = lua.lua_pcall(L, 0, 1, 0);
if (run !== lua.LUA_OK) { console.log('RUNTIME ERROR', to_jsstring(lua.lua_tostring(L, -1))); process.exit(1); }
process.exit(lua.lua_tointeger(L, -1) === 0 ? 0 : 1);
