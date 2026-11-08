-- Config: весь баланс игры в одном месте.
-- Меняй цифры здесь — сервер и клиент читают этот же модуль.

local Config = {}

---------------------------------------------------------------------
-- Сервер и база
---------------------------------------------------------------------
Config.MaxPlayers = 4            -- выставь то же число в Game Settings -> Places
Config.BaseSlots = 10            -- слотов для существ на базе
Config.ExtraSlotsPass = 5        -- +слоты за Game Pass
Config.StartMoney = 0
Config.AutosaveSeconds = 60
Config.DataStoreName = "WingsAndBrainrots_v1"

Config.WaterLevel = 0            -- верх воды
Config.GroundY = 8               -- верх стартовой платформы и островов
Config.FallDeathY = -4           -- ниже этого = упал в воду

---------------------------------------------------------------------
-- Прокачка (цена = база * 1.5 ^ уровень)
---------------------------------------------------------------------
Config.CostGrowth = 1.5
Config.Upgrades = {
	Speed = { baseCost = 50, maxLevel = 40, title = "Скорость" },
	Stamina = { baseCost = 75, maxLevel = 40, title = "Стамина" },
}

function Config.upgradeCost(kind, level)
	local def = Config.Upgrades[kind]
	return math.floor(def.baseCost * Config.CostGrowth ^ level)
end

---------------------------------------------------------------------
-- Крылья: множитель стамины и силы полёта
---------------------------------------------------------------------
Config.Wings = {
	{ name = "Перьевые крылья", mult = 1.0, cost = 0, color = Color3.fromRGB(245, 245, 245) },
	{ name = "Стрекозьи крылья", mult = 1.5, cost = 500, color = Color3.fromRGB(120, 230, 200) },
	{ name = "Облачные крылья", mult = 2.0, cost = 5000, color = Color3.fromRGB(190, 220, 255) },
	{ name = "Огненные крылья", mult = 2.5, cost = 40000, color = Color3.fromRGB(255, 120, 40) },
	{ name = "Ледяные крылья", mult = 3.0, cost = 250000, color = Color3.fromRGB(110, 200, 255) },
	{ name = "Звёздные крылья", mult = 4.0, cost = 1500000, color = Color3.fromRGB(170, 110, 255) },
	{ name = "Небесные крылья", mult = 5.0, cost = 10000000, color = Color3.fromRGB(255, 220, 90) },
}

---------------------------------------------------------------------
-- Формулы полёта и бега
---------------------------------------------------------------------
Config.CarrySpeedMult = 0.85     -- с существом в руках летишь медленнее
Config.StaminaPassMult = 1.5     -- Game Pass +50% стамины

function Config.walkSpeed(speedLevel)
	return 16 + speedLevel * 0.6
end

function Config.flySpeed(speedLevel)
	return 24 + speedLevel * 1.0
end

-- стамина = секунды полёта
function Config.maxStamina(staminaLevel, wingIndex, hasStaminaPass)
	local wing = Config.Wings[wingIndex] or Config.Wings[1]
	local value = (8 + staminaLevel * 0.6) * wing.mult
	if hasStaminaPass then
		value = value * Config.StaminaPassMult
	end
	return value
end

function Config.liftSpeed(wingIndex)
	local wing = Config.Wings[wingIndex] or Config.Wings[1]
	return 18 + 4 * wing.mult
end

function Config.maxFlightY(wingIndex)
	local wing = Config.Wings[wingIndex] or Config.Wings[1]
	return Config.GroundY + 60 + 25 * wing.mult
end

Config.SinkSpeed = 10            -- скорость снижения без пробела
Config.StaminaRegenTime = 2.5    -- секунд на земле до полной стамины

---------------------------------------------------------------------
-- Редкости и существа
---------------------------------------------------------------------
Config.Rarities = {
	{ key = "Common", name = "Обычный", color = Color3.fromRGB(200, 200, 200) },
	{ key = "Uncommon", name = "Необычный", color = Color3.fromRGB(90, 220, 90) },
	{ key = "Rare", name = "Редкий", color = Color3.fromRGB(70, 150, 255) },
	{ key = "Epic", name = "Эпический", color = Color3.fromRGB(180, 80, 255) },
	{ key = "Legendary", name = "Легендарный", color = Color3.fromRGB(255, 170, 0) },
	{ key = "Mythic", name = "Мифический", color = Color3.fromRGB(255, 60, 90) },
	{ key = "Divine", name = "Божественный", color = Color3.fromRGB(255, 240, 120) },
}

-- rarity = номер редкости, income = $/сек, weight = шанс среди своей редкости
Config.Creatures = {
	frog_slipper = { name = "Лягушонок-Тапок", rarity = 1, income = 1, weight = 70 },
	dumpling = { name = "Пельмешек", rarity = 1, income = 2, weight = 30 },
	cactus_runner = { name = "Кактус-Бегун", rarity = 2, income = 8, weight = 70 },
	mushroom_hedgehog = { name = "Грибной Ёжик", rarity = 2, income = 12, weight = 30 },
	jelly_teapot = { name = "Медузий Чайник", rarity = 3, income = 40, weight = 70 },
	banana_crab = { name = "Банановый Краб", rarity = 3, income = 65, weight = 30 },
	fire_hamster = { name = "Огненный Хомяк", rarity = 4, income = 220, weight = 70 },
	cloud_sheep = { name = "Облачная Овечка", rarity = 4, income = 320, weight = 30 },
	owl_king = { name = "Совиный Король", rarity = 5, income = 1100, weight = 70 },
	rocket_penguin = { name = "Ракетный Пингвин", rarity = 5, income = 1700, weight = 30 },
	crystal_whale = { name = "Кристальный Кит", rarity = 6, income = 6500, weight = 70 },
	shadow_fox = { name = "Теневой Лис", rarity = 6, income = 9500, weight = 30 },
	sun_dragon = { name = "Солнечный Дракоша", rarity = 7, income = 75000, weight = 100 },
}

Config.SellSeconds = 60          -- цена продажи = доход * 60

function Config.sellPrice(creatureId)
	local def = Config.Creatures[creatureId]
	if not def then
		return 0
	end
	return def.income * Config.SellSeconds
end

---------------------------------------------------------------------
-- Острова: каждый следующий дальше, промежуток растёт
---------------------------------------------------------------------
Config.Islands = {
	{ distance = 220, angle = 20, radius = 32, rarity = 1, spawns = 4 },
	{ distance = 420, angle = 75, radius = 34, rarity = 2, spawns = 4 },
	{ distance = 680, angle = 130, radius = 36, rarity = 3, spawns = 4 },
	{ distance = 1000, angle = 185, radius = 38, rarity = 4, spawns = 3 },
	{ distance = 1400, angle = 240, radius = 40, rarity = 5, spawns = 3 },
	{ distance = 1900, angle = 295, radius = 42, rarity = 6, spawns = 3 },
	{ distance = 2600, angle = 350, radius = 46, rarity = 7, spawns = 1 },
}

Config.RespawnMin = 20           -- секунд до нового существа на месте
Config.RespawnMax = 45
Config.DivineInterval = 300      -- божественный раз в 5 минут
Config.LuckChance = 0.05         -- шанс, что появится существо следующей редкости
Config.LuckBoostChance = 0.15    -- то же при донатной удаче
Config.LuckBoostSeconds = 15 * 60

---------------------------------------------------------------------
-- Донат. ID создаёшь в Creator Dashboard и вставляешь сюда.
-- Пока ID = 0, в Studio покупка срабатывает как тест (бесплатно, до выхода).
-- Цены в Robux задаются на сайте Roblox; здесь они только для текста в магазине.
---------------------------------------------------------------------
Config.GamePasses = {
	GoldName = { id = 0, price = 5, title = "Золотое имя", desc = "Золотое имя над головой" },
	DoubleMoney = { id = 0, price = 12, title = "2x прибыль навсегда", desc = "Весь доход x2" },
	ExtraSlots = { id = 0, price = 25, title = "+5 слотов", desc = "Больше места для существ на базе" },
	StaminaBoost = { id = 0, price = 39, title = "+50% стамины", desc = "Летаешь в 1.5 раза дольше" },
	VIP = { id = 0, price = 59, title = "VIP", desc = "1.2x доход, золотое имя, блеск крыльев" },
}
Config.GamePassOrder = { "GoldName", "DoubleMoney", "ExtraSlots", "StaminaBoost", "VIP" }

-- Денежные пакеты: max(minAmount, доход в секунду * seconds)
Config.Products = {
	MoneySmall = { id = 0, price = 19, title = "Мешочек $", seconds = 10 * 60, minAmount = 1000 },
	MoneyMedium = { id = 0, price = 49, title = "Сумка $", seconds = 30 * 60, minAmount = 5000 },
	MoneyLarge = { id = 0, price = 99, title = "Сундук $", seconds = 2 * 3600, minAmount = 25000 },
	MoneyHuge = { id = 0, price = 199, title = "Хранилище $", seconds = 6 * 3600, minAmount = 150000 },
	ServerLuck = { id = 0, price = 19, title = "Удача сервера 15 мин", luck = true },
}
Config.ProductOrder = { "MoneySmall", "MoneyMedium", "MoneyLarge", "MoneyHuge", "ServerLuck" }

Config.DoubleMoneyMult = 2
Config.VipMult = 1.2

function Config.productAmount(productKey, incomePerSecond)
	local def = Config.Products[productKey]
	if not def or not def.seconds then
		return 0
	end
	return math.max(def.minAmount, math.floor(incomePerSecond * def.seconds))
end

---------------------------------------------------------------------
-- Форматирование денег: 1500 -> "$1.5K"
---------------------------------------------------------------------
local suffixes = { "", "K", "M", "B", "T", "Qa", "Qi" }

function Config.formatNumber(n)
	n = math.floor(n or 0)
	local i = 1
	local value = n
	while math.abs(value) >= 1000 and i < #suffixes do
		value = value / 1000
		i = i + 1
	end
	if i == 1 then
		return tostring(n)
	end
	local text = string.format("%.1f", value)
	text = string.gsub(text, "%.0$", "")
	return text .. suffixes[i]
end

function Config.formatMoney(n)
	return "$" .. Config.formatNumber(n)
end

return Config
