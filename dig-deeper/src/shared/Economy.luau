-- Чистая математика экономики. Используется и сервером, и клиентом,
-- поэтому цифры в интерфейсе всегда совпадают с тем, что считает сервер.

local Config = require(script.Parent.Config)

local Economy = {}

function Economy.cashMultiplier(rebirths, passes)
	local m = 1 + Config.Rebirth.BonusPerRebirth * (rebirths or 0)
	if passes and passes.DoubleCash then
		m = m * 2
	end
	if passes and passes.VIP then
		m = m * 1.25
	end
	return m
end

function Economy.rebirthMultiplier(rebirths)
	return 1 + Config.Rebirth.BonusPerRebirth * (rebirths or 0)
end

function Economy.rebirthCost(rebirths)
	return math.floor(Config.Rebirth.BaseCost * Config.Rebirth.Growth ^ (rebirths or 0))
end

function Economy.capacity(backpackIndex, passes)
	local bp = Config.Backpacks[backpackIndex] or Config.Backpacks[1]
	local cap = bp.Capacity
	if passes and passes.MegaBackpack then
		cap = cap * 3
	end
	return cap
end

function Economy.swingCooldown(pickIndex, passes, speedPotion)
	local pick = Config.Pickaxes[pickIndex] or Config.Pickaxes[1]
	local cd = Config.BaseSwing / pick.Speed
	if passes and passes.FastMine then
		cd = cd / 1.5
	end
	if speedPotion then
		cd = cd / 2
	end
	return cd
end

function Economy.luck(passes, luckPotion)
	local l = 1
	if passes and passes.Lucky then
		l = l * 2
	end
	if luckPotion then
		l = l * 3
	end
	return l
end

function Economy.inventoryCount(inv)
	local n = 0
	for _, count in pairs(inv or {}) do
		n = n + count
	end
	return n
end

function Economy.inventoryValue(inv)
	local total = 0
	for id, count in pairs(inv or {}) do
		local ore = Config.Ores[id]
		if ore then
			total = total + ore.Value * count
		end
	end
	return total
end

-- Сколько ударов нужно, чтобы сломать блок слоя
function Economy.hitsToBreak(layer, power)
	if power < layer.MinPower then
		return math.huge
	end
	return math.max(1, math.ceil(layer.Hp / power))
end

-- Награда ежедневного входа: деньги растут вместе с прогрессом игрока
function Economy.dailyReward(day, rebirths, pickIndex)
	local list = Config.Daily
	local entry = list[((day - 1) % #list) + 1]
	local reward = { Icon = entry.Icon, Potion = entry.Potion, Cash = 0 }
	if entry.Cash then
		reward.Cash = math.floor(entry.Cash * (1 + (rebirths or 0)) * math.max(1, pickIndex or 1))
	end
	return reward
end

-- Множитель денег за товар «монеты» в магазине Robux
function Economy.cashPackAmount(baseCash, rebirths)
	return math.floor(baseCash * (1 + (rebirths or 0)))
end

-- Глубина (в метрах) по высоте Y
function Economy.depthAtY(y)
	local depth = math.floor((Config.SurfaceY - y) / Config.BlockSize)
	if depth < 0 then
		return 0
	end
	return depth
end

-- Прогресс внутри текущего слоя: слой, индекс, 0..1, метров до следующего
function Economy.layerProgress(depth)
	local layer, index = Config.LayerForDepth(depth)
	local span = layer.To - layer.From
	local fraction = math.clamp((depth - layer.From) / span, 0, 1)
	return layer, index, fraction, math.max(0, layer.To - depth)
end

return Economy
