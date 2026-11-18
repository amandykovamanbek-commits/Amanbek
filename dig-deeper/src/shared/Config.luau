-- Dig Deeper / Копай глубже — все настройки и цены игры.
-- Меняй цифры здесь, код трогать не нужно.

local Config = {}

Config.Version = "0.1.0"

-- Геймпассы: вставь ID после создания на create.roblox.com (0 = выключено)
Config.GamePasses = {
	MegaBackpack = { Id = 0, Price = 15 },
	FastMine     = { Id = 0, Price = 15 },
	SellAnywhere = { Id = 0, Price = 19 },
	AutoMine     = { Id = 0, Price = 25 },
	DoubleCash   = { Id = 0, Price = 29 },
	Lucky        = { Id = 0, Price = 35 },
	VIP          = { Id = 0, Price = 49 },
}

-- Разовые покупки (Developer Products)
Config.Products = {
	DeepTeleport = { Id = 0, Price = 5 },
	PileOfCash   = { Id = 0, Price = 5,  Cash = 10000 },
	SpeedPotion  = { Id = 0, Price = 9 },
	LuckPotion   = { Id = 0, Price = 10 },
	BagOfCash    = { Id = 0, Price = 25, Cash = 100000 },
	ChestOfCash  = { Id = 0, Price = 75, Cash = 1000000 },
}

return Config
