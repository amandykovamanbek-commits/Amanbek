-- UpgradeService: покупки за $ проверяются ТОЛЬКО на сервере.
-- Скорость, стамина, крылья, продажа существ.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local MapBuilder = require(script.Parent.MapBuilder)
local DataService = require(script.Parent.DataService)
local PlotService = require(script.Parent.PlotService)
local CharacterVisuals = require(script.Parent.CharacterVisuals)

local UpgradeService = {}

local STATION_RANGE = 25

local function nearStation(player, stationName)
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	local station = MapBuilder.stations[stationName]
	if not root or not station then
		return false
	end
	return (root.Position - station.position).Magnitude <= STATION_RANGE
end

function UpgradeService.applyWalkSpeed(player)
	local profile = DataService.get(player)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if profile and hum then
		hum.WalkSpeed = Config.walkSpeed(profile.data.speedLevel)
	end
end

function UpgradeService.buyUpgrade(player, kind)
	local def = Config.Upgrades[kind]
	if not def then
		return { ok = false, msg = "Нет такой прокачки" }
	end
	if not nearStation(player, kind) then
		return { ok = false, msg = "Подойди к станции «" .. def.title .. "»" }
	end
	local profile = DataService.get(player)
	local field = kind == "Speed" and "speedLevel" or "staminaLevel"
	local level = profile.data[field]
	if level >= def.maxLevel then
		return { ok = false, msg = "Уже максимальный уровень!" }
	end
	local cost = Config.upgradeCost(kind, level)
	if profile.data.money < cost then
		return { ok = false, msg = "Не хватает " .. Config.formatMoney(cost - profile.data.money) }
	end
	profile.data.money = profile.data.money - cost
	profile.data[field] = level + 1
	if kind == "Speed" then
		UpgradeService.applyWalkSpeed(player)
	end
	DataService.sync(player)
	return { ok = true, msg = def.title .. " → уровень " .. (level + 1) }
end

-- купить столько уровней, сколько хватает денег
function UpgradeService.buyUpgradeMax(player, kind)
	local def = Config.Upgrades[kind]
	if not def then
		return { ok = false, msg = "Нет такой прокачки" }
	end
	if not nearStation(player, kind) then
		return { ok = false, msg = "Подойди к станции «" .. def.title .. "»" }
	end
	local profile = DataService.get(player)
	local field = kind == "Speed" and "speedLevel" or "staminaLevel"
	local bought, spent = 0, 0
	while profile.data[field] < def.maxLevel do
		local cost = Config.upgradeCost(kind, profile.data[field])
		if profile.data.money < cost then
			break
		end
		profile.data.money = profile.data.money - cost
		profile.data[field] = profile.data[field] + 1
		bought = bought + 1
		spent = spent + cost
	end
	if bought == 0 then
		return { ok = false, msg = "Не хватает денег" }
	end
	if kind == "Speed" then
		UpgradeService.applyWalkSpeed(player)
	end
	DataService.sync(player)
	return { ok = true, msg = def.title .. " +" .. bought .. " ур. за " .. Config.formatMoney(spent) }
end

function UpgradeService.buyWing(player, index)
	if type(index) ~= "number" then
		return { ok = false, msg = "Ошибка" }
	end
	if not nearStation(player, "Wings") then
		return { ok = false, msg = "Подойди к магазину крыльев" }
	end
	local profile = DataService.get(player)
	local current = profile.data.wing
	local def = Config.Wings[index]
	if not def then
		return { ok = false, msg = "Нет таких крыльев" }
	end
	if index <= current then
		return { ok = false, msg = "Уже куплено" }
	end
	if index ~= current + 1 then
		return { ok = false, msg = "Сначала купи " .. Config.Wings[current + 1].name }
	end
	if profile.data.money < def.cost then
		return { ok = false, msg = "Не хватает " .. Config.formatMoney(def.cost - profile.data.money) }
	end
	profile.data.money = profile.data.money - def.cost
	profile.data.wing = index
	CharacterVisuals.applyWings(player)
	DataService.sync(player)
	return { ok = true, msg = "Новые крылья: " .. def.name .. " (x" .. def.mult .. " стамина)" }
end

function UpgradeService.sell(player, slot)
	if not nearStation(player, "Market") then
		return { ok = false, msg = "Продавать можно только на рынке" }
	end
	local profile = DataService.get(player)
	local creatures = profile.data.creatures
	if type(slot) ~= "number" or not creatures[slot] then
		return { ok = false, msg = "Нет такого существа" }
	end
	local id = table.remove(creatures, slot)
	local stored = math.floor(table.remove(profile.data.pending, slot) or 0)
	local price = Config.sellPrice(id)
	DataService.addMoney(player, price + stored)
	PlotService.refresh(player)
	DataService.sync(player)
	return { ok = true, msg = "Продано " .. Config.Creatures[id].name .. " за " .. Config.formatMoney(price + stored) }
end

function UpgradeService.sellAll(player)
	if not nearStation(player, "Market") then
		return { ok = false, msg = "Продавать можно только на рынке" }
	end
	local profile = DataService.get(player)
	local count = #profile.data.creatures
	if count == 0 then
		return { ok = false, msg = "Нечего продавать" }
	end
	local total = 0
	for _, id in ipairs(profile.data.creatures) do
		total = total + Config.sellPrice(id)
	end
	for _, v in ipairs(profile.data.pending) do
		total = total + math.floor(v)
	end
	profile.data.creatures = {}
	profile.data.pending = {}
	DataService.addMoney(player, total)
	PlotService.refresh(player)
	DataService.sync(player)
	return { ok = true, msg = "Продано " .. count .. " существ за " .. Config.formatMoney(total) }
end

return UpgradeService
