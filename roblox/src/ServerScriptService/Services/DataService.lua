-- DataService: загрузка/сохранение в DataStore и состояние игроков на сервере.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local DataService = {}

local store = nil
local storeOk = pcall(function()
	store = DataStoreService:GetDataStore(Config.DataStoreName)
end)
if not storeOk then
	warn("[DataService] DataStore недоступен. В Studio включи Game Settings -> Security -> Enable Studio Access to API Services")
end

-- profiles[player] = { data = {...}, passes = {}, carrying = nil, plotIndex = n, loaded = bool }
local profiles = {}

local function defaultData()
	return {
		money = Config.StartMoney,
		speedLevel = 0,
		staminaLevel = 0,
		wing = 1,
		creatures = {}, -- список id существ по слотам
		pending = {}, -- накопленные $ у каждого подиума (забрать кнопкой)
		receipts = {}, -- последние обработанные покупки
		totalEarned = 0,
	}
end

local function reconcile(data)
	local def = defaultData()
	for k, v in pairs(def) do
		if data[k] == nil then
			data[k] = v
		end
	end
	-- выкинуть неизвестных существ (если удалил их из конфига)
	local clean, cleanPending = {}, {}
	for i, id in ipairs(data.creatures) do
		if Config.Creatures[id] then
			table.insert(clean, id)
			table.insert(cleanPending, tonumber(data.pending[i]) or 0)
		end
	end
	data.creatures = clean
	data.pending = cleanPending
	return data
end

local function key(player)
	return "player_" .. player.UserId
end

function DataService.load(player)
	local data = nil
	local ok = false
	if store then
		for attempt = 1, 3 do
			ok = pcall(function()
				data = store:GetAsync(key(player))
			end)
			if ok then
				break
			end
			task.wait(attempt)
		end
	end
	if not ok then
		warn("[DataService] Не удалось загрузить данные " .. player.Name .. ", прогресс НЕ будет сохранён")
	end
	local profile = {
		data = reconcile(type(data) == "table" and data or defaultData()),
		passes = {},
		testPasses = {},
		carrying = nil,
		plotIndex = nil,
		canSave = ok,
	}
	profiles[player] = profile
	return profile
end

function DataService.get(player)
	return profiles[player]
end

function DataService.save(player)
	local profile = profiles[player]
	if not profile or not profile.canSave or not store then
		return false
	end
	local ok, err = pcall(function()
		store:SetAsync(key(player), profile.data)
	end)
	if not ok then
		warn("[DataService] Ошибка сохранения " .. player.Name .. ": " .. tostring(err))
	end
	return ok
end

function DataService.release(player)
	DataService.save(player)
	profiles[player] = nil
end

function DataService.all()
	return profiles
end

-- Отправляет клиенту всё нужное через атрибуты игрока.
function DataService.sync(player)
	local profile = profiles[player]
	if not profile then
		return
	end
	local d = profile.data
	player:SetAttribute("Money", d.money)
	player:SetAttribute("SpeedLevel", d.speedLevel)
	player:SetAttribute("StaminaLevel", d.staminaLevel)
	player:SetAttribute("Wing", d.wing)
	player:SetAttribute("Creatures", HttpService:JSONEncode(d.creatures))
	player:SetAttribute("MaxSlots", DataService.maxSlots(player))
	player:SetAttribute("Income", DataService.income(player))
	local pendingTotal = 0
	for _, v in ipairs(d.pending) do
		pendingTotal = pendingTotal + v
	end
	player:SetAttribute("Pending", math.floor(pendingTotal))
	player:SetAttribute("Carrying", profile.carrying and profile.carrying.id or "")
	for passKey in pairs(Config.GamePasses) do
		player:SetAttribute("Pass_" .. passKey, DataService.hasPass(player, passKey))
	end
	local stats = player:FindFirstChild("leaderstats")
	if stats then
		stats["$"].Value = d.money
		stats["Существа"].Value = #d.creatures
	end
end

function DataService.hasPass(player, passKey)
	local profile = profiles[player]
	if not profile then
		return false
	end
	return profile.passes[passKey] == true or profile.testPasses[passKey] == true
end

function DataService.maxSlots(player)
	local slots = Config.BaseSlots
	if DataService.hasPass(player, "ExtraSlots") then
		slots = slots + Config.ExtraSlotsPass
	end
	return slots
end

function DataService.incomeMultiplier(player)
	local mult = 1
	if DataService.hasPass(player, "DoubleMoney") then
		mult = mult * Config.DoubleMoneyMult
	end
	if DataService.hasPass(player, "VIP") then
		mult = mult * Config.VipMult
	end
	return mult
end

function DataService.baseIncome(player)
	local profile = profiles[player]
	if not profile then
		return 0
	end
	local total = 0
	for _, id in ipairs(profile.data.creatures) do
		total = total + Config.Creatures[id].income
	end
	return total
end

function DataService.slotIncome(player, slot)
	local profile = profiles[player]
	local id = profile and profile.data.creatures[slot]
	if not id then
		return 0
	end
	return Config.Creatures[id].income * DataService.incomeMultiplier(player)
end

function DataService.income(player)
	return math.floor(DataService.baseIncome(player) * DataService.incomeMultiplier(player))
end

function DataService.addMoney(player, amount)
	local profile = profiles[player]
	if not profile then
		return
	end
	profile.data.money = profile.data.money + amount
	if amount > 0 then
		profile.data.totalEarned = profile.data.totalEarned + amount
	end
end

function DataService.init()
	-- автосохранение
	task.spawn(function()
		while true do
			task.wait(Config.AutosaveSeconds)
			for player in pairs(profiles) do
				task.spawn(DataService.save, player)
			end
		end
	end)

	game:BindToClose(function()
		if RunService:IsStudio() then
			-- в Studio сохраняем быстро и не ждём долго
			for player in pairs(profiles) do
				DataService.save(player)
			end
			return
		end
		local pending = 0
		for player in pairs(profiles) do
			pending = pending + 1
			task.spawn(function()
				DataService.save(player)
				pending = pending - 1
			end)
		end
		local start = os.clock()
		while pending > 0 and os.clock() - start < 25 do
			task.wait(0.2)
		end
	end)
end

return DataService
