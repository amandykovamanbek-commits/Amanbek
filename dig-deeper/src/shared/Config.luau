-- Копай глубже / Dig to the Core
-- ВСЕ настройки и цены игры. Меняй цифры здесь — остальной код трогать не нужно.

local Config = {}

Config.Version = "1.0.0"
Config.GameName = { ru = "Копай глубже", en = "Dig to the Core" }

---------------------------------------------------------------------
-- МИР
---------------------------------------------------------------------
Config.BlockSize = 6 -- размер блока шахты (studs)
Config.MineWidth = 16 -- шахта 16 x 16 блоков
Config.MaxDepth = 1000 -- глубина шахты в блоках (= метрах)
Config.SurfaceY = 6100 -- высота поверхности острова (шахта уходит вниз)
Config.MineResetMinutes = 20 -- как часто шахта обновляется
Config.Reach = 24 -- дальность удара киркой (studs)
Config.BaseSwing = 0.32 -- пауза между ударами деревянной киркой (сек)
Config.BaseRareChance = 0.08 -- шанс, что блок — светящаяся редкая руда
Config.ElevatorColumn = { X = 7, Z = 7 } -- колонна шахты, куда приезжает лифт
Config.WalkSpeed = 20
Config.SpawnPosition = Vector3.new(0, Config.SurfaceY + 4, -120)

-- true = в Roblox Studio все геймпассы считаются купленными (для теста)
Config.StudioFreePasses = false

---------------------------------------------------------------------
-- СЛОИ ШАХТЫ
-- From/To — глубина в метрах. Hp — прочность блока. MinPower — нужная сила кирки.
-- Reward — награда за первое открытие слоя (умножается на 1 + перерождения).
---------------------------------------------------------------------
Config.Layers = {
	{
		Id = "Dirt", Name = { ru = "Земля", en = "Dirt" }, Emoji = "🟫",
		From = 0, To = 50, Hp = 1, MinPower = 1, Reward = 0,
		Color = Color3.fromRGB(132, 86, 48), Wall = Color3.fromRGB(98, 62, 34),
		Material = Enum.Material.Plastic, Studs = true,
		Ambient = Color3.fromRGB(120, 95, 70), Fog = Color3.fromRGB(58, 38, 22), Tint = Color3.fromRGB(255, 242, 228),
		Common = { Id = "Dirt", Name = { ru = "Земля", en = "Dirt" }, Value = 1, Color = Color3.fromRGB(150, 105, 65), Emoji = "🟫" },
		Rare = { Id = "Coal", Name = { ru = "Уголь", en = "Coal" }, Value = 5, Color = Color3.fromRGB(38, 38, 44), Emoji = "⬛", Glow = false },
	},
	{
		Id = "Stone", Name = { ru = "Камень", en = "Stone" }, Emoji = "🪨",
		From = 50, To = 150, Hp = 4, MinPower = 2, Reward = 200,
		Color = Color3.fromRGB(132, 134, 145), Wall = Color3.fromRGB(92, 94, 104),
		Material = Enum.Material.Plastic, Studs = true,
		Ambient = Color3.fromRGB(115, 118, 132), Fog = Color3.fromRGB(42, 44, 52), Tint = Color3.fromRGB(238, 242, 255),
		Common = { Id = "Copper", Name = { ru = "Медь", en = "Copper" }, Value = 15, Color = Color3.fromRGB(214, 130, 70), Emoji = "🟧" },
		Rare = { Id = "Iron", Name = { ru = "Железо", en = "Iron" }, Value = 20, Color = Color3.fromRGB(236, 230, 220), Emoji = "⬜", Glow = false },
	},
	{
		Id = "Caves", Name = { ru = "Кристальные пещеры", en = "Crystal Caves" }, Emoji = "💜",
		From = 150, To = 300, Hp = 16, MinPower = 8, Reward = 3000,
		Color = Color3.fromRGB(76, 60, 116), Wall = Color3.fromRGB(52, 40, 84),
		Material = Enum.Material.Plastic, Studs = true,
		Ambient = Color3.fromRGB(125, 95, 185), Fog = Color3.fromRGB(38, 22, 70), Tint = Color3.fromRGB(238, 222, 255),
		Common = { Id = "Amethyst", Name = { ru = "Аметист", en = "Amethyst" }, Value = 100, Color = Color3.fromRGB(176, 98, 240), Emoji = "🟪" },
		Rare = { Id = "Sapphire", Name = { ru = "Сапфир", en = "Sapphire" }, Value = 250, Color = Color3.fromRGB(64, 128, 255), Emoji = "🟦", Glow = true },
	},
	{
		Id = "Lava", Name = { ru = "Лава", en = "Lava" }, Emoji = "🔥",
		From = 300, To = 500, Hp = 60, MinPower = 16, Reward = 25000,
		Color = Color3.fromRGB(96, 30, 22), Wall = Color3.fromRGB(70, 20, 14),
		Material = Enum.Material.CrackedLava, Studs = false,
		Ambient = Color3.fromRGB(190, 90, 55), Fog = Color3.fromRGB(95, 26, 10), Tint = Color3.fromRGB(255, 222, 200),
		Common = { Id = "Ruby", Name = { ru = "Рубин", en = "Ruby" }, Value = 800, Color = Color3.fromRGB(240, 40, 74), Emoji = "🟥" },
		Rare = { Id = "Obsidian", Name = { ru = "Обсидиан", en = "Obsidian" }, Value = 1500, Color = Color3.fromRGB(110, 50, 190), Emoji = "🌑", Glow = true },
	},
	{
		Id = "Ruins", Name = { ru = "Древние руины", en = "Ancient Ruins" }, Emoji = "🏛",
		From = 500, To = 800, Hp = 200, MinPower = 35, Reward = 300000,
		Color = Color3.fromRGB(200, 172, 112), Wall = Color3.fromRGB(150, 126, 80),
		Material = Enum.Material.Plastic, Studs = true,
		Ambient = Color3.fromRGB(175, 155, 105), Fog = Color3.fromRGB(70, 60, 35), Tint = Color3.fromRGB(255, 246, 222),
		Common = { Id = "Artifact", Name = { ru = "Артефакт", en = "Artifact" }, Value = 5000, Color = Color3.fromRGB(255, 204, 64), Emoji = "🏺" },
		Rare = { Id = "Emerald", Name = { ru = "Древний изумруд", en = "Ancient Emerald" }, Value = 12000, Color = Color3.fromRGB(40, 225, 115), Emoji = "🟩", Glow = true },
	},
	{
		Id = "Core", Name = { ru = "Ядро планеты", en = "Planet Core" }, Emoji = "🌋",
		From = 800, To = 1000, Hp = 600, MinPower = 80, Reward = 2500000,
		Color = Color3.fromRGB(226, 96, 32), Wall = Color3.fromRGB(150, 45, 10),
		Material = Enum.Material.Plastic, Studs = true,
		Ambient = Color3.fromRGB(255, 135, 70), Fog = Color3.fromRGB(120, 40, 10), Tint = Color3.fromRGB(255, 228, 205),
		Common = { Id = "StarOre", Name = { ru = "Звёздная руда", en = "Star Ore" }, Value = 50000, Color = Color3.fromRGB(255, 248, 170), Emoji = "⭐" },
		Rare = { Id = "PlanetHeart", Name = { ru = "Сердце планеты", en = "Planet Heart" }, Value = 150000, Color = Color3.fromRGB(255, 70, 205), Emoji = "💖", Glow = true },
	},
}

-- Награда за то, что докопался до самого дна (раз за каждое перерождение)
Config.CoreBottomReward = 5000000

---------------------------------------------------------------------
-- КИРКИ: Power — урон по блоку за удар, Speed — скорость ударов
---------------------------------------------------------------------
Config.Pickaxes = {
	{ Name = { ru = "Деревянная", en = "Wooden" }, Price = 0, Power = 1, Speed = 1, Icon = "⛏", Head = Color3.fromRGB(170, 118, 66), Glow = false, Top = Color3.fromRGB(217, 160, 102), Bottom = Color3.fromRGB(138, 90, 46) },
	{ Name = { ru = "Каменная", en = "Stone" }, Price = 100, Power = 2, Speed = 1, Icon = "⛏", Head = Color3.fromRGB(140, 142, 150), Glow = false, Top = Color3.fromRGB(195, 196, 204), Bottom = Color3.fromRGB(110, 112, 128) },
	{ Name = { ru = "Железная", en = "Iron" }, Price = 750, Power = 4, Speed = 1, Icon = "⛏", Head = Color3.fromRGB(222, 224, 232), Glow = false, Top = Color3.fromRGB(240, 242, 248), Bottom = Color3.fromRGB(163, 168, 184) },
	{ Name = { ru = "Золотая", en = "Gold" }, Price = 5000, Power = 8, Speed = 1.1, Icon = "⛏", Head = Color3.fromRGB(255, 200, 40), Glow = false, Top = Color3.fromRGB(255, 227, 107), Bottom = Color3.fromRGB(255, 178, 30) },
	{ Name = { ru = "Алмазная", en = "Diamond" }, Price = 40000, Power = 16, Speed = 1.2, Icon = "💎", Head = Color3.fromRGB(95, 235, 255), Glow = false, Top = Color3.fromRGB(143, 244, 255), Bottom = Color3.fromRGB(34, 181, 230) },
	{ Name = { ru = "Лавовая", en = "Magma" }, Price = 250000, Power = 35, Speed = 1.3, Icon = "🔥", Head = Color3.fromRGB(255, 96, 24), Glow = true, Top = Color3.fromRGB(255, 166, 92), Bottom = Color3.fromRGB(229, 64, 30) },
	{ Name = { ru = "Древняя", en = "Ancient" }, Price = 2000000, Power = 80, Speed = 1.5, Icon = "🗿", Head = Color3.fromRGB(80, 230, 125), Glow = true, Top = Color3.fromRGB(140, 245, 176), Bottom = Color3.fromRGB(46, 175, 94) },
	{ Name = { ru = "Звёздная", en = "Star" }, Price = 15000000, Power = 200, Speed = 2, Icon = "⭐", Head = Color3.fromRGB(255, 125, 255), Glow = true, Top = Color3.fromRGB(255, 168, 247), Bottom = Color3.fromRGB(155, 77, 255) },
}

---------------------------------------------------------------------
-- РЮКЗАКИ: Capacity — сколько руды помещается
---------------------------------------------------------------------
Config.Backpacks = {
	{ Name = { ru = "Мешок", en = "Sack" }, Price = 0, Capacity = 10, Icon = "👝", Top = Color3.fromRGB(217, 160, 102), Bottom = Color3.fromRGB(138, 90, 46) },
	{ Name = { ru = "Рюкзак", en = "Backpack" }, Price = 200, Capacity = 25, Icon = "🎒", Top = Color3.fromRGB(255, 130, 120), Bottom = Color3.fromRGB(214, 50, 44) },
	{ Name = { ru = "Большой рюкзак", en = "Big Pack" }, Price = 2000, Capacity = 60, Icon = "🎒", Top = Color3.fromRGB(111, 200, 255), Bottom = Color3.fromRGB(47, 134, 255) },
	{ Name = { ru = "Сундук", en = "Chest" }, Price = 25000, Capacity = 150, Icon = "🧰", Top = Color3.fromRGB(255, 227, 107), Bottom = Color3.fromRGB(255, 160, 30) },
	{ Name = { ru = "Пещерный мешок", en = "Cave Bag" }, Price = 300000, Capacity = 400, Icon = "🛍", Top = Color3.fromRGB(213, 139, 255), Bottom = Color3.fromRGB(143, 61, 255) },
	{ Name = { ru = "Бездонный", en = "Bottomless" }, Price = 5000000, Capacity = 1000, Icon = "🌌", Top = Color3.fromRGB(255, 150, 230), Bottom = Color3.fromRGB(90, 60, 220) },
}

---------------------------------------------------------------------
-- ПЕРЕРОЖДЕНИЕ
---------------------------------------------------------------------
Config.Rebirth = {
	BaseCost = 1000000, -- цена первого
	Growth = 2.5, -- каждое следующее дороже в 2.5 раза
	BonusPerRebirth = 0.5, -- +50% дохода за каждое
}

---------------------------------------------------------------------
-- ГЕЙМПАССЫ (покупаются навсегда).
-- Создай их на create.roblox.com → твоя игра → Monetization → Passes,
-- затем вставь сюда Id. Пока Id = 0 — кнопка показывает «Скоро».
---------------------------------------------------------------------
Config.GamePasses = {
	{ Key = "MegaBackpack", Id = 0, Price = 15, Icon = "🎒", Name = { ru = "Большой рюкзак+", en = "Mega Backpack" }, Desc = { ru = "x3 место", en = "x3 space" }, Top = Color3.fromRGB(111, 200, 255), Bottom = Color3.fromRGB(47, 134, 255) },
	{ Key = "FastMine", Id = 0, Price = 15, Icon = "⚡", Name = { ru = "Быстрая кирка", en = "Fast Mine" }, Desc = { ru = "+50% скорость", en = "+50% speed" }, Top = Color3.fromRGB(255, 227, 107), Bottom = Color3.fromRGB(255, 178, 30) },
	{ Key = "SellAnywhere", Id = 0, Price = 19, Icon = "💸", Name = { ru = "Продажа везде", en = "Sell Anywhere" }, Desc = { ru = "без похода", en = "from anywhere" }, Top = Color3.fromRGB(140, 242, 94), Bottom = Color3.fromRGB(63, 194, 43) },
	{ Key = "AutoMine", Id = 0, Price = 25, Icon = "🤖", Name = { ru = "Авто-копание", en = "Auto Mine" }, Desc = { ru = "копает само", en = "mines for you" }, Top = Color3.fromRGB(125, 240, 255), Bottom = Color3.fromRGB(34, 181, 230) },
	{ Key = "DoubleCash", Id = 0, Price = 29, Icon = "💰", Name = { ru = "x2 Деньги", en = "2x Cash" }, Desc = { ru = "x2 доход", en = "x2 income" }, Top = Color3.fromRGB(184, 255, 107), Bottom = Color3.fromRGB(77, 192, 42), Badge = "Hit" },
	{ Key = "Lucky", Id = 0, Price = 35, Icon = "🍀", Name = { ru = "Удача", en = "Lucky" }, Desc = { ru = "x2 редкая руда", en = "x2 rare ore" }, Top = Color3.fromRGB(124, 240, 160), Bottom = Color3.fromRGB(46, 175, 94) },
	{ Key = "VIP", Id = 0, Price = 49, Icon = "👑", Name = { ru = "VIP", en = "VIP" }, Desc = { ru = "+25% и золотой ник", en = "+25% & gold tag" }, Top = Color3.fromRGB(255, 227, 107), Bottom = Color3.fromRGB(255, 138, 30), Badge = "Best" },
}

---------------------------------------------------------------------
-- РАЗОВЫЕ ПОКУПКИ (Developer Products) — можно покупать много раз.
-- Создай их там же: Monetization → Developer Products.
---------------------------------------------------------------------
Config.Products = {
	{ Key = "PileOfCash", Id = 0, Price = 5, Icon = "💵", Cash = 10000, Name = { ru = "Горсть монет", en = "Pile of Cash" }, Desc = { ru = "+$10K", en = "+$10K" }, Top = Color3.fromRGB(140, 242, 94), Bottom = Color3.fromRGB(63, 194, 43), Badge = "Good" },
	{ Key = "BagOfCash", Id = 0, Price = 25, Icon = "💰", Cash = 100000, Name = { ru = "Мешок монет", en = "Bag of Cash" }, Desc = { ru = "+$100K", en = "+$100K" }, Top = Color3.fromRGB(140, 242, 94), Bottom = Color3.fromRGB(63, 194, 43), Badge = "Great" },
	{ Key = "ChestOfCash", Id = 0, Price = 75, Icon = "🧰", Cash = 1000000, Name = { ru = "Сундук монет", en = "Chest of Cash" }, Desc = { ru = "+$1M", en = "+$1M" }, Top = Color3.fromRGB(140, 242, 94), Bottom = Color3.fromRGB(63, 194, 43), Badge = "Most" },
	{ Key = "DeepTeleport", Id = 0, Price = 5, Icon = "⬇", Name = { ru = "Телепорт вниз", en = "Deep Teleport" }, Desc = { ru = "к рекорду", en = "to your record" }, Top = Color3.fromRGB(111, 200, 255), Bottom = Color3.fromRGB(47, 134, 255) },
	{ Key = "SpeedPotion", Id = 0, Price = 9, Icon = "🧪", Potion = "Speed", Name = { ru = "Зелье скорости", en = "Speed Potion" }, Desc = { ru = "x2 · 15 мин", en = "x2 · 15 min" }, Top = Color3.fromRGB(255, 227, 107), Bottom = Color3.fromRGB(255, 178, 30) },
	{ Key = "LuckPotion", Id = 0, Price = 10, Icon = "🍀", Potion = "Luck", Name = { ru = "Зелье удачи", en = "Luck Potion" }, Desc = { ru = "x3 · 15 мин", en = "x3 · 15 min" }, Top = Color3.fromRGB(124, 240, 160), Bottom = Color3.fromRGB(46, 175, 94) },
}
Config.PotionSeconds = 15 * 60

---------------------------------------------------------------------
-- ЕЖЕДНЕВНЫЕ НАГРАДЫ (7 дней по кругу). Деньги умножаются на
-- (1 + перерождения) x номер кирки — награда растёт вместе с игроком.
---------------------------------------------------------------------
Config.Daily = {
	{ Icon = "💰", Cash = 500 },
	{ Icon = "💰", Cash = 1000 },
	{ Icon = "🧪", Potion = "Speed" },
	{ Icon = "💰", Cash = 2500 },
	{ Icon = "🍀", Potion = "Luck" },
	{ Icon = "💰", Cash = 10000 },
	{ Icon = "🧰", Cash = 25000, Potion = "Luck" },
}
Config.DailyCooldownHours = 20 -- через сколько часов можно забрать следующую
Config.DailyStreakHours = 48 -- если не зашёл дольше — серия сбрасывается

---------------------------------------------------------------------
-- КОДЫ (пиши в описании игры и в видео). Регистр не важен.
---------------------------------------------------------------------
Config.Codes = {
	RELEASE = { Cash = 1000 },
	DIGDEEP = { Cash = 2500 },
	LUCKY = { Potion = "Luck" },
}

---------------------------------------------------------------------
-- ЗВУКИ. Можно заменить на любые из Creator Store: "rbxassetid://123456".
-- Music = "" — без музыки. Вставь Id трека, чтобы играла фоновая музыка.
---------------------------------------------------------------------
Config.Sounds = {
	Swing = "rbxasset://sounds/swordslash.wav",
	Hit = "rbxasset://sounds/collide.wav",
	Coin = "rbxasset://sounds/electronicpingshort.wav",
	Click = "rbxasset://sounds/clickfast.wav",
	Reward = "rbxasset://sounds/electronicpingshort.wav",
	Error = "rbxasset://sounds/clickfast.wav",
	Music = "",
}

-- Круги «встань в круг»: цвет и иконка
Config.Pads = {
	Sell = { Color = Color3.fromRGB(255, 84, 70), Icon = "💰" },
	PickShop = { Color = Color3.fromRGB(255, 160, 40), Icon = "⛏" },
	BagShop = { Color = Color3.fromRGB(60, 150, 255), Icon = "🎒" },
	Rebirth = { Color = Color3.fromRGB(180, 90, 255), Icon = "🔄" },
	Elevator = { Color = Color3.fromRGB(255, 200, 40), Icon = "🛗" },
	Daily = { Color = Color3.fromRGB(80, 220, 70), Icon = "🎁" },
}
Config.PadRadius = 9

---------------------------------------------------------------------
-- Служебное (не меняй)
---------------------------------------------------------------------
Config.Ores = {}
for _, layer in ipairs(Config.Layers) do
	Config.Ores[layer.Common.Id] = layer.Common
	Config.Ores[layer.Rare.Id] = layer.Rare
end

function Config.LayerForDepth(depth)
	for i, layer in ipairs(Config.Layers) do
		if depth >= layer.From and depth < layer.To then
			return layer, i
		end
	end
	return Config.Layers[#Config.Layers], #Config.Layers
end

function Config.LayerIndexById(id)
	for i, layer in ipairs(Config.Layers) do
		if layer.Id == id then
			return i
		end
	end
	return nil
end

-- Минимальная кирка, которая берёт слой с нужной силой
function Config.PickaxeForPower(power)
	for i, p in ipairs(Config.Pickaxes) do
		if p.Power >= power then
			return i
		end
	end
	return #Config.Pickaxes
end

function Config.FindPass(key)
	for _, p in ipairs(Config.GamePasses) do
		if p.Key == key then
			return p
		end
	end
	return nil
end

function Config.FindProduct(key)
	for _, p in ipairs(Config.Products) do
		if p.Key == key then
			return p
		end
	end
	return nil
end

return Config
