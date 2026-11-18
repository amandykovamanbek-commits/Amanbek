-- Копай глубже / Dig to the Core — все настройки и цены игры.
-- Меняй цифры здесь, остальной код трогать не нужно.

local Config = {}

Config.Version = "0.2.0"
Config.GameName = { ru = "Копай глубже", en = "Dig to the Core" }

-- Шахта
Config.BlockSize = 6 -- размер блока в studs
Config.MineWidth = 16 -- ширина шахты в блоках (16 x 16)
Config.MaxDepth = 1000 -- глубина шахты в блоках (метрах)
Config.SurfaceY = 6100 -- высота поверхности (шахта уходит вниз от неё)
Config.MineResetMinutes = 20 -- как часто шахта обновляется
Config.SwingCooldown = 0.3 -- базовая пауза между ударами (сек)
Config.Reach = 22 -- дальность удара (studs)
Config.BaseRareChance = 0.08 -- шанс редкой руды в блоке

-- true = в Roblox Studio все геймпассы включены бесплатно (для теста)
Config.StudioFreePasses = false

-- Слои шахты. From/To — глубина в метрах. Hp — прочность блока.
-- MinPower — минимальная сила кирки, чтобы копать этот слой.
Config.Layers = {
	{
		Id = "Dirt", Name = { ru = "Земля", en = "Dirt" },
		From = 0, To = 50, Hp = 1, MinPower = 1,
		Color = Color3.fromRGB(124, 88, 58), Material = Enum.Material.Ground,
		Common = { Id = "Dirt", Name = { ru = "Земля", en = "Dirt" }, Value = 1, Color = Color3.fromRGB(150, 110, 75) },
		Rare = { Id = "Coal", Name = { ru = "Уголь", en = "Coal" }, Value = 5, Color = Color3.fromRGB(45, 45, 50) },
	},
	{
		Id = "Stone", Name = { ru = "Камень", en = "Stone" },
		From = 50, To = 150, Hp = 4, MinPower = 2,
		Color = Color3.fromRGB(120, 120, 125), Material = Enum.Material.Slate,
		Common = { Id = "Copper", Name = { ru = "Медь", en = "Copper" }, Value = 15, Color = Color3.fromRGB(200, 120, 70) },
		Rare = { Id = "Iron", Name = { ru = "Железо", en = "Iron" }, Value = 20, Color = Color3.fromRGB(215, 205, 195) },
	},
	{
		Id = "Caves", Name = { ru = "Кристальные пещеры", en = "Crystal Caves" },
		From = 150, To = 300, Hp = 16, MinPower = 8,
		Color = Color3.fromRGB(70, 55, 95), Material = Enum.Material.Basalt,
		Common = { Id = "Amethyst", Name = { ru = "Аметист", en = "Amethyst" }, Value = 100, Color = Color3.fromRGB(170, 90, 230) },
		Rare = { Id = "Sapphire", Name = { ru = "Сапфир", en = "Sapphire" }, Value = 250, Color = Color3.fromRGB(50, 110, 255) },
	},
	{
		Id = "Lava", Name = { ru = "Лава", en = "Lava" },
		From = 300, To = 500, Hp = 60, MinPower = 16,
		Color = Color3.fromRGB(70, 30, 25), Material = Enum.Material.CrackedLava,
		Common = { Id = "Ruby", Name = { ru = "Рубин", en = "Ruby" }, Value = 800, Color = Color3.fromRGB(230, 30, 60) },
		Rare = { Id = "Obsidian", Name = { ru = "Обсидиан", en = "Obsidian" }, Value = 1500, Color = Color3.fromRGB(60, 20, 90) },
	},
	{
		Id = "Ruins", Name = { ru = "Древние руины", en = "Ancient Ruins" },
		From = 500, To = 800, Hp = 200, MinPower = 35,
		Color = Color3.fromRGB(160, 140, 95), Material = Enum.Material.Sandstone,
		Common = { Id = "Artifact", Name = { ru = "Артефакт", en = "Artifact" }, Value = 5000, Color = Color3.fromRGB(255, 200, 60) },
		Rare = { Id = "Emerald", Name = { ru = "Древний изумруд", en = "Ancient Emerald" }, Value = 12000, Color = Color3.fromRGB(40, 220, 110) },
	},
	{
		Id = "Core", Name = { ru = "Ядро планеты", en = "Planet Core" },
		From = 800, To = 1000, Hp = 600, MinPower = 80,
		Color = Color3.fromRGB(255, 120, 30), Material = Enum.Material.Neon,
		Common = { Id = "StarOre", Name = { ru = "Звёздная руда", en = "Star Ore" }, Value = 50000, Color = Color3.fromRGB(255, 255, 160) },
		Rare = { Id = "PlanetHeart", Name = { ru = "Сердце планеты", en = "Planet Heart" }, Value = 150000, Color = Color3.fromRGB(255, 60, 200) },
	},
}

-- Кирки: Power — урон по блоку за удар, Speed — множитель скорости ударов
Config.Pickaxes = {
	{ Name = { ru = "Деревянная", en = "Wooden" }, Price = 0, Power = 1, Speed = 1, Color = Color3.fromRGB(160, 110, 60) },
	{ Name = { ru = "Каменная", en = "Stone" }, Price = 100, Power = 2, Speed = 1, Color = Color3.fromRGB(130, 130, 130) },
	{ Name = { ru = "Железная", en = "Iron" }, Price = 750, Power = 4, Speed = 1, Color = Color3.fromRGB(215, 215, 220) },
	{ Name = { ru = "Золотая", en = "Gold" }, Price = 5000, Power = 8, Speed = 1.1, Color = Color3.fromRGB(255, 200, 40) },
	{ Name = { ru = "Алмазная", en = "Diamond" }, Price = 40000, Power = 16, Speed = 1.2, Color = Color3.fromRGB(80, 230, 255) },
	{ Name = { ru = "Лавовая", en = "Magma" }, Price = 250000, Power = 35, Speed = 1.3, Color = Color3.fromRGB(255, 90, 20) },
	{ Name = { ru = "Древняя", en = "Ancient" }, Price = 2000000, Power = 80, Speed = 1.5, Color = Color3.fromRGB(90, 220, 120) },
	{ Name = { ru = "Звёздная", en = "Star" }, Price = 15000000, Power = 200, Speed = 2, Color = Color3.fromRGB(255, 120, 255) },
}

-- Рюкзаки: Capacity — сколько руды помещается
Config.Backpacks = {
	{ Name = { ru = "Мешок", en = "Sack" }, Price = 0, Capacity = 10 },
	{ Name = { ru = "Рюкзак", en = "Backpack" }, Price = 200, Capacity = 25 },
	{ Name = { ru = "Большой рюкзак", en = "Big Pack" }, Price = 2000, Capacity = 60 },
	{ Name = { ru = "Сундук", en = "Chest" }, Price = 25000, Capacity = 150 },
	{ Name = { ru = "Пещерный мешок", en = "Cave Bag" }, Price = 300000, Capacity = 400 },
	{ Name = { ru = "Бездонный", en = "Bottomless" }, Price = 5000000, Capacity = 1000 },
}

-- Перерождение
Config.Rebirth = {
	BaseCost = 1000000, -- цена первого
	Growth = 2.5, -- каждое следующее дороже в 2.5 раза
	BonusPerRebirth = 0.5, -- +50% дохода за каждое
}

-- Геймпассы: вставь Id после создания на create.roblox.com (0 = пока не продаётся)
Config.GamePasses = {
	{ Key = "MegaBackpack", Id = 0, Price = 15, Name = { ru = "Большой рюкзак+", en = "Mega Backpack" }, Desc = { ru = "x3 вместимость", en = "x3 capacity" } },
	{ Key = "FastMine", Id = 0, Price = 15, Name = { ru = "Быстрая кирка", en = "Fast Mine" }, Desc = { ru = "+50% скорость", en = "+50% speed" } },
	{ Key = "SellAnywhere", Id = 0, Price = 19, Name = { ru = "Продажа везде", en = "Sell Anywhere" }, Desc = { ru = "Продавай где угодно", en = "Sell from anywhere" } },
	{ Key = "AutoMine", Id = 0, Price = 25, Name = { ru = "Авто-копание", en = "Auto Mine" }, Desc = { ru = "Копает само", en = "Mines for you" } },
	{ Key = "DoubleCash", Id = 0, Price = 29, Name = { ru = "x2 Деньги", en = "2x Cash" }, Desc = { ru = "x2 доход", en = "x2 income" } },
	{ Key = "Lucky", Id = 0, Price = 35, Name = { ru = "Удача", en = "Lucky" }, Desc = { ru = "x2 редкая руда", en = "x2 rare ore" } },
	{ Key = "VIP", Id = 0, Price = 49, Name = { ru = "VIP", en = "VIP" }, Desc = { ru = "Золотой ник, +25% денег", en = "Gold name, +25% cash" } },
}

-- Разовые покупки (Developer Products)
Config.Products = {
	{ Key = "DeepTeleport", Id = 0, Price = 5, Name = { ru = "Телепорт вниз", en = "Deep Teleport" }, Desc = { ru = "На самое дно шахты", en = "To the deepest tunnel" } },
	{ Key = "PileOfCash", Id = 0, Price = 5, Cash = 10000, Name = { ru = "Горсть монет", en = "Pile of Cash" }, Desc = { ru = "+10K $", en = "+10K $" } },
	{ Key = "SpeedPotion", Id = 0, Price = 9, Name = { ru = "Зелье скорости", en = "Speed Potion" }, Desc = { ru = "x2 скорость, 15 мин", en = "x2 speed, 15 min" } },
	{ Key = "LuckPotion", Id = 0, Price = 10, Name = { ru = "Зелье удачи", en = "Luck Potion" }, Desc = { ru = "x3 редкая руда, 15 мин", en = "x3 rare ore, 15 min" } },
	{ Key = "BagOfCash", Id = 0, Price = 25, Cash = 100000, Name = { ru = "Мешок монет", en = "Bag of Cash" }, Desc = { ru = "+100K $", en = "+100K $" } },
	{ Key = "ChestOfCash", Id = 0, Price = 75, Cash = 1000000, Name = { ru = "Сундук монет", en = "Chest of Cash" }, Desc = { ru = "+1M $", en = "+1M $" } },
}
Config.PotionSeconds = 15 * 60

-- Справочник всех руд по Id (заполняется автоматически)
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

function Config.RebirthCost(rebirths)
	return math.floor(Config.Rebirth.BaseCost * Config.Rebirth.Growth ^ rebirths)
end

return Config
