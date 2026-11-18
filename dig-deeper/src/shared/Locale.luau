-- Тексты интерфейса на двух языках. Добавить язык = добавить ещё одну таблицу.

local Locale = {}

local STRINGS = {
	ru = {
		Bag = "🎒 %d / %d",
		Depth = "⛏ %d м · %s",
		Shop = "Магазин",
		Pickaxes = "Кирки",
		Backpacks = "Рюкзаки",
		Rebirth = "Перерождение",
		Premium = "Премиум",
		Surface = "Наверх",
		Sell = "Продать",
		AutoMine = "Авто",
		Equipped = "Надето",
		Owned = "✓",
		Power = "Сила %d",
		Capacity = "Вмещает %d",
		NeedPickaxe = "Нужна кирка получше: %s",
		BackpackFull = "Рюкзак полон! Иди продавать",
		Sold = "Продано на %s $",
		NothingToSell = "Нечего продавать",
		NotEnough = "Не хватает денег",
		Bought = "Куплено: %s",
		RebirthInfo = "Сбрасывает монеты, кирку и рюкзак.\nНавсегда +50%% к доходу.\n\nСейчас доход: x%s\nПосле: x%s",
		RebirthCost = "Переродиться за %s $",
		RebirthDone = "Перерождение %d! Доход x%s",
		MineResetSoon = "Шахта обновится через 30 сек!",
		MineResetDone = "Шахта обновилась!",
		Soon = "Скоро в продаже",
		GamePasses = "Геймпассы",
		Products = "Покупки",
		Welcome = "Копай вниз, продавай руду, покупай кирки!",
		Potion = "%s: %d:%02d",
		SellHint = "ПРОДАТЬ",
		Teleported = "Телепорт!",
	},
	en = {
		Bag = "🎒 %d / %d",
		Depth = "⛏ %d m · %s",
		Shop = "Shop",
		Pickaxes = "Pickaxes",
		Backpacks = "Backpacks",
		Rebirth = "Rebirth",
		Premium = "Premium",
		Surface = "Surface",
		Sell = "Sell",
		AutoMine = "Auto",
		Equipped = "Equipped",
		Owned = "✓",
		Power = "Power %d",
		Capacity = "Holds %d",
		NeedPickaxe = "You need a better pickaxe: %s",
		BackpackFull = "Backpack full! Go sell",
		Sold = "Sold for %s $",
		NothingToSell = "Nothing to sell",
		NotEnough = "Not enough cash",
		Bought = "Bought: %s",
		RebirthInfo = "Resets cash, pickaxe and backpack.\nPermanent +50%% income.\n\nIncome now: x%s\nAfter: x%s",
		RebirthCost = "Rebirth for %s $",
		RebirthDone = "Rebirth %d! Income x%s",
		MineResetSoon = "The mine resets in 30 sec!",
		MineResetDone = "The mine has been reset!",
		Soon = "Coming soon",
		GamePasses = "Game Passes",
		Products = "Items",
		Welcome = "Dig down, sell ore, buy pickaxes!",
		Potion = "%s: %d:%02d",
		SellHint = "SELL",
		Teleported = "Teleported!",
	},
}

function Locale.get(lang, key, ...)
	local set = STRINGS[lang] or STRINGS.en
	local s = set[key] or STRINGS.en[key] or key
	if select("#", ...) > 0 then
		return string.format(s, ...)
	end
	return s
end

-- Имя из таблицы вида { ru = "...", en = "..." }
function Locale.name(lang, tbl)
	return tbl[lang] or tbl.en
end

-- 1500 -> 1.5K, 2300000 -> 2.3M
function Locale.short(n)
	n = math.floor(n)
	local units = { { 1e12, "T" }, { 1e9, "B" }, { 1e6, "M" }, { 1e3, "K" } }
	for _, u in ipairs(units) do
		if n >= u[1] then
			local v = n / u[1]
			local s = v >= 100 and string.format("%d", v) or string.format("%.1f", v)
			s = s:gsub("%.0$", "")
			return s .. u[2]
		end
	end
	return tostring(n)
end

return Locale
