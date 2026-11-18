-- Все тексты игры на двух языках. Чтобы добавить язык — добавь таблицу.
-- Во всех строках используется только %s: числа заранее превращаются в текст.

local Locale = {}

local STRINGS = {
	ru = {
		-- HUD
		Shop = "Магазин", Rebirth = "Ребёрт", Bag = "Рюкзак", Premium = "Премиум", Rewards = "Награды",
		Elevator = "Лифт", Surface = "Наверх", Auto = "Авто", AutoOn = "🤖 АВТО: ВКЛ", AutoOff = "🤖 АВТО: ВЫКЛ",
		Dig = "КОПАТЬ", Lang = "🌐 RU", Full = "ПОЛНЫЙ!",
		DepthFmt = "⛏ %s м · %s", OnSurface = "☀ На поверхности", NextLayer = "до слоя «%s»: %s м", Bottom = "Самое дно!",
		Goal = "🎯 ЦЕЛЬ",
		GoalSell = "Продай руду в красном круге",
		GoalSellAnywhere = "Рюкзак полон — нажми «Рюкзак»",
		GoalBuyPick = "Купи кирку «%s» в магазине",
		GoalSavePick = "Накопи на кирку «%s»",
		GoalDigTo = "Докопайся до слоя «%s»",
		GoalRebirth = "Накопи на перерождение",
		GoalRebirthReady = "Переродись — доход станет x%s!",
		PotionLuck = "🍀 Удача %s", PotionSpeed = "🧪 Скорость %s",

		-- Сообщения
		NeedPickaxe = "Нужна кирка «%s» или лучше!",
		BackpackFull = "Рюкзак полон! Продай руду",
		NothingToSell = "Рюкзак пуст — иди копать!",
		GoToSell = "Встань в красный круг продажи",
		Sold = "Продано на $%s!",
		NotEnough = "Не хватает денег",
		Bought = "Куплено: %s!",
		RebirthNotEnough = "Нужно $%s для перерождения",
		LayerLocked = "Сначала докопайся до этого слоя",
		LayerTooHard = "Нужна кирка «%s»",
		Teleported = "Лифт: %s",
		DailyClaimed = "Награда дня %s получена!",
		DailyWait = "Следующая награда через %s",
		CodeOk = "Код активирован! 🎉",
		CodeUsed = "Этот код уже использован",
		CodeBad = "Такого кода нет",
		ResetWarn = "⚠ Шахта обновится через %s сек!",
		ResetDone = "Шахта обновилась — копай снова!",
		Thanks = "Спасибо за покупку! ❤",
		Soon = "Скоро в продаже",
		Wait = "Подожди секунду…",
		SavesOff = "Сохранения выключены в Studio (это нормально для теста)",

		-- Магазин
		ShopTitle = "Магазин", TabPicks = "⛏ Кирки", TabBags = "🎒 Рюкзаки",
		Power = "Сила %s", Capacity = "Вмещает %s", Have = "✓ Есть", Equipped = "НАДЕТО",
		Next = "СЛЕДУЮЩАЯ", Legend = "ЛЕГЕНДА",

		-- Продажа
		SellTitle = "Продать руду", BagValue = "СТОИМОСТЬ РЮКЗАКА", SellAll = "ПРОДАТЬ ВСЁ",
		Empty = "Рюкзак пуст — иди копать!", SellHint = "Встань в красный круг у лавки — или купи «Продажу везде» и продавай прямо в шахте.",
		GoSellCircle = "🔒 К КРУГУ ПРОДАЖИ",

		-- Премиум
		PremiumTitle = "Премиум", PassesHeader = "⭐ ГЕЙМПАССЫ — НАВСЕГДА", ProductsHeader = "💰 МОНЕТЫ, ЗЕЛЬЯ, ТЕЛЕПОРТ",
		Owned = "✓ КУПЛЕНО", Badge_Hit = "ХИТ!", Badge_Best = "ЛУЧШЕЕ", Badge_Good = "ХОРОШО", Badge_Great = "ВЫГОДНО", Badge_Most = "САМОЕ ВЫГОДНОЕ",

		-- Перерождение
		RebirthTitle = "Перерождение",
		RebirthInfo = "Сбрасывает деньги, кирку и рюкзак. Навсегда даёт +50% к доходу. Рекорд глубины остаётся.",
		Now = "Сейчас x%s", After = "После x%s", RebirthBtn = "Переродиться за $%s", RebirthNeed = "🔒 Нужно $%s",
		RebirthCount = "Перерождений: %s",

		-- Награды и коды
		DailyTitle = "Ежедневная награда",
		DailySub = "Заходи каждый день — награда растёт! Пропустишь день — серия начнётся сначала.",
		Day = "День %s", Claim = "Забрать награду дня %s", ComeBack = "Следующая через %s",
		Codes = "🎟 Коды", CodePlaceholder = "Введи код…", Ok = "OK",
		Speed = "Скорость", Luck = "Удача",

		-- Лифт
		ElevatorTitle = "Лифт", ElevatorSub = "Мгновенно спустись на любой открытый слой.",
		Go = "Поехать", Locked = "🔒 Не открыт", NeedPick = "Нужна: %s", SurfaceBtn = "⬆ На поверхность", Range = "%s–%s м",

		-- Круги и таблички
		Pad_Sell = "ПРОДАЖА", Pad_PickShop = "КИРКИ", Pad_BagShop = "РЮКЗАКИ", Pad_Rebirth = "ПЕРЕРОЖДЕНИЕ",
		Pad_Elevator = "ЛИФТ", Pad_Daily = "НАГРАДЫ", StepIn = "Встань в круг",
		Sign_Title = "КОПАЙ ГЛУБЖЕ", Sign_Sub = "Докопайся до ядра планеты!", Sign_Mine = "⛏ ШАХТА",
		Sign_Sell = "💰 ЛАВКА", Sign_PickShop = "⛏ КУЗНИЦА", Sign_BagShop = "🎒 РЮКЗАКИ",
		Sign_Rebirth = "🔄 ПЕРЕРОЖДЕНИЕ", Sign_Elevator = "🛗 ЛИФТ", Sign_Daily = "🎁 НАГРАДЫ",

		-- Катсцены
		IntroTitle1 = "КОПАЙ", IntroTitle2 = "ГЛУБЖЕ!",
		IntroTag = "Копай вниз • Находи сокровища • Доберись до ядра",
		IntroGoal = "ДОКОПАЙСЯ ДО ЯДРА!", Play = "ИГРАТЬ", Skip = "Пропустить ⏭",
		NewLayer = "НОВЫЙ СЛОЙ!", LayerReward = "Глубина %s м  •  Награда +$%s", LayerDepth = "Глубина %s м",
		TapContinue = "Нажми, чтобы продолжить",
		RebirthCut = "ПЕРЕРОЖДЕНИЕ #%s", RebirthCutSub = "Доход теперь x%s!",
		CoreTitle = "ТЫ ДОКОПАЛСЯ ДО ЯДРА!", CoreSub = "Награда +$%s • Переродись, чтобы стать ещё сильнее",
		Welcome = "Копай вниз, продавай руду, покупай кирки!",

		Hours = "%sч %sм", Minutes = "%sм %sс",
	},
	en = {
		Shop = "Shop", Rebirth = "Rebirth", Bag = "Backpack", Premium = "Premium", Rewards = "Rewards",
		Elevator = "Elevator", Surface = "Surface", Auto = "Auto", AutoOn = "🤖 AUTO: ON", AutoOff = "🤖 AUTO: OFF",
		Dig = "DIG", Lang = "🌐 EN", Full = "FULL!",
		DepthFmt = "⛏ %s m · %s", OnSurface = "☀ On the surface", NextLayer = "%s: %s m to go", Bottom = "The very bottom!",
		Goal = "🎯 GOAL",
		GoalSell = "Sell ore at the red circle",
		GoalSellAnywhere = "Backpack full — tap “Backpack”",
		GoalBuyPick = "Buy the %s pickaxe in the shop",
		GoalSavePick = "Save up for the %s pickaxe",
		GoalDigTo = "Dig down to %s",
		GoalRebirth = "Save up to rebirth",
		GoalRebirthReady = "Rebirth — income becomes x%s!",
		PotionLuck = "🍀 Luck %s", PotionSpeed = "🧪 Speed %s",

		NeedPickaxe = "You need the %s pickaxe or better!",
		BackpackFull = "Backpack full! Go sell your ore",
		NothingToSell = "Backpack is empty — go dig!",
		GoToSell = "Step into the red sell circle",
		Sold = "Sold for $%s!",
		NotEnough = "Not enough cash",
		Bought = "Bought: %s!",
		RebirthNotEnough = "You need $%s to rebirth",
		LayerLocked = "Reach this layer first",
		LayerTooHard = "You need the %s pickaxe",
		Teleported = "Elevator: %s",
		DailyClaimed = "Day %s reward claimed!",
		DailyWait = "Next reward in %s",
		CodeOk = "Code redeemed! 🎉",
		CodeUsed = "You already used this code",
		CodeBad = "That code doesn't exist",
		ResetWarn = "⚠ The mine resets in %s sec!",
		ResetDone = "The mine has been reset — dig again!",
		Thanks = "Thanks for your purchase! ❤",
		Soon = "Coming soon",
		Wait = "Wait a second…",
		SavesOff = "Saving is off in Studio (normal while testing)",

		ShopTitle = "Shop", TabPicks = "⛏ Pickaxes", TabBags = "🎒 Backpacks",
		Power = "Power %s", Capacity = "Holds %s", Have = "✓ Owned", Equipped = "EQUIPPED",
		Next = "NEXT", Legend = "LEGEND",

		SellTitle = "Sell Ore", BagValue = "BACKPACK VALUE", SellAll = "SELL ALL",
		Empty = "Backpack is empty — go dig!", SellHint = "Step into the red circle at the market — or get Sell Anywhere to sell right in the mine.",
		GoSellCircle = "🔒 GO TO SELL CIRCLE",

		PremiumTitle = "Premium", PassesHeader = "⭐ GAME PASSES — FOREVER", ProductsHeader = "💰 CASH, POTIONS, TELEPORT",
		Owned = "✓ OWNED", Badge_Hit = "HOT!", Badge_Best = "BEST", Badge_Good = "GOOD VALUE", Badge_Great = "GREAT VALUE", Badge_Most = "MOST VALUE",

		RebirthTitle = "Rebirth",
		RebirthInfo = "Resets cash, pickaxe and backpack. Gives a permanent +50% income. Your depth record stays.",
		Now = "Now x%s", After = "After x%s", RebirthBtn = "Rebirth for $%s", RebirthNeed = "🔒 Need $%s",
		RebirthCount = "Rebirths: %s",

		DailyTitle = "Daily Reward",
		DailySub = "Come back every day — rewards grow! Miss a day and the streak starts over.",
		Day = "Day %s", Claim = "Claim day %s reward", ComeBack = "Next in %s",
		Codes = "🎟 Codes", CodePlaceholder = "Enter code…", Ok = "OK",
		Speed = "Speed", Luck = "Luck",

		ElevatorTitle = "Elevator", ElevatorSub = "Instantly ride down to any layer you've reached.",
		Go = "Go", Locked = "🔒 Not found yet", NeedPick = "Need: %s", SurfaceBtn = "⬆ To the surface", Range = "%s–%s m",

		Pad_Sell = "SELL", Pad_PickShop = "PICKAXES", Pad_BagShop = "BACKPACKS", Pad_Rebirth = "REBIRTH",
		Pad_Elevator = "ELEVATOR", Pad_Daily = "REWARDS", StepIn = "Step on the circle",
		Sign_Title = "DIG TO THE CORE", Sign_Sub = "Reach the center of the planet!", Sign_Mine = "⛏ MINE",
		Sign_Sell = "💰 MARKET", Sign_PickShop = "⛏ FORGE", Sign_BagShop = "🎒 BACKPACKS",
		Sign_Rebirth = "🔄 REBIRTH", Sign_Elevator = "🛗 ELEVATOR", Sign_Daily = "🎁 REWARDS",

		IntroTitle1 = "DIG TO THE", IntroTitle2 = "CORE!",
		IntroTag = "Dig down • Find gems • Reach the core",
		IntroGoal = "DIG TO THE CORE!", Play = "PLAY", Skip = "Skip ⏭",
		NewLayer = "NEW LAYER!", LayerReward = "Depth %s m  •  Reward +$%s", LayerDepth = "Depth %s m",
		TapContinue = "Tap to continue",
		RebirthCut = "REBIRTH #%s", RebirthCutSub = "Income is now x%s!",
		CoreTitle = "YOU REACHED THE CORE!", CoreSub = "Reward +$%s • Rebirth to get even stronger",
		Welcome = "Dig down, sell ore, buy pickaxes!",

		Hours = "%sh %sm", Minutes = "%sm %ss",
	},
}

Locale.Languages = { "ru", "en" }

local unpackArgs = table.unpack or unpack

function Locale.get(lang, key, ...)
	local set = STRINGS[lang] or STRINGS.en
	local s = set[key] or STRINGS.en[key] or key
	if select("#", ...) > 0 then
		local args = { ... }
		for i = 1, #args do
			args[i] = tostring(args[i])
		end
		local ok, result = pcall(string.format, s, unpackArgs(args))
		if ok then
			return result
		end
	end
	return s
end

-- Имя из таблицы { ru = "...", en = "..." }
function Locale.name(lang, tbl)
	if type(tbl) ~= "table" then
		return tostring(tbl)
	end
	return tbl[lang] or tbl.en or ""
end

-- 1500 -> 1.5K, 2300000 -> 2.3M
function Locale.short(n)
	n = math.floor(tonumber(n) or 0)
	local negative = n < 0
	if negative then
		n = -n
	end
	local units = { { 1e15, "Qa" }, { 1e12, "T" }, { 1e9, "B" }, { 1e6, "M" }, { 1e3, "K" } }
	local out = tostring(n)
	for _, u in ipairs(units) do
		if n >= u[1] then
			local v = n / u[1]
			if v >= 100 then
				out = string.format("%d", math.floor(v)) .. u[2]
			else
				out = string.format("%.1f", math.floor(v * 10) / 10):gsub("%.0$", "") .. u[2]
			end
			break
		end
	end
	if negative then
		out = "-" .. out
	end
	return out
end

-- 1234567 -> "1 234 567"
function Locale.full(n)
	local s = tostring(math.floor(tonumber(n) or 0))
	local out = s:reverse():gsub("(%d%d%d)", "%1 "):reverse()
	return (out:gsub("^%s+", ""))
end

-- 75 -> "1:15"
function Locale.timer(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", math.floor(seconds / 60), seconds % 60)
end

-- Длинное время: "5ч 12м" / "12м 30с"
function Locale.duration(lang, seconds)
	seconds = math.max(0, math.floor(seconds))
	if seconds >= 3600 then
		return Locale.get(lang, "Hours", math.floor(seconds / 3600), math.floor((seconds % 3600) / 60))
	end
	return Locale.get(lang, "Minutes", math.floor(seconds / 60), seconds % 60)
end

return Locale
