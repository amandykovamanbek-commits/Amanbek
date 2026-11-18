-- Сохранение прогресса игроков (DataStore).
-- В Roblox Studio сохранения работают, только если включено:
-- Game Settings -> Security -> Enable Studio Access to API Services.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local DataService = {}

local STORE_NAME = "DigToCore_v1"
local AUTOSAVE_SECONDS = 120

local DEFAULT = {
	Cash = 0,
	Pickaxe = 1,
	Backpack = 1,
	Rebirths = 0,
	BestDepth = 0,
	TotalMined = 0,
	TotalEarned = 0,
	Inv = {},
	Lang = "",
	Potions = { Luck = 0, Speed = 0 },
	Daily = { Streak = 0, Last = 0 },
	Codes = {},
	Layers = {},
	CoreClaims = 0,
	SeenIntro = false,
	AutoMine = false,
	Receipts = {},
}

local store = nil
pcall(function()
	store = DataStoreService:GetDataStore(STORE_NAME)
end)

local profiles = {} -- [player] = data
local canSave = {} -- [player] = true, если загрузка прошла успешно
local warnedOffline = false

DataService.Offline = false -- true, если DataStore недоступен (например, Studio без доступа к API)

local function deepCopy(value)
	if type(value) ~= "table" then
		return value
	end
	local out = {}
	for k, v in pairs(value) do
		out[k] = deepCopy(v)
	end
	return out
end

-- Дополняет сохранённые данные новыми полями из DEFAULT (если игра обновилась)
local function reconcile(saved, template)
	local out = type(saved) == "table" and saved or {}
	for k, v in pairs(template) do
		if out[k] == nil then
			out[k] = deepCopy(v)
		elseif type(v) == "table" and type(out[k]) == "table" and next(v) ~= nil then
			out[k] = reconcile(out[k], v)
		end
	end
	return out
end

local function keyFor(player)
	return "p_" .. tostring(player.UserId)
end

function DataService.load(player)
	local data = nil
	local ok = false
	if store then
		for attempt = 1, 3 do
			local success, result = pcall(function()
				return store:GetAsync(keyFor(player))
			end)
			if success then
				data = result
				ok = true
				break
			end
			if attempt == 1 and not warnedOffline then
				warnedOffline = true
				warn("[Копай глубже] DataStore недоступен: " .. tostring(result)
					.. "\nВ Studio включи: Game Settings -> Security -> Enable Studio Access to API Services")
			end
			if attempt < 3 then
				task.wait(attempt)
			end
		end
	end
	if not ok then
		DataService.Offline = true
	end
	if not player.Parent then
		return nil
	end
	local profile = reconcile(data, DEFAULT)
	profiles[player] = profile
	canSave[player] = ok
	return profile
end

function DataService.get(player)
	return profiles[player]
end

function DataService.save(player)
	local profile = profiles[player]
	if not profile or not canSave[player] or not store then
		return false
	end
	local success, err = pcall(function()
		store:SetAsync(keyFor(player), profile)
	end)
	if not success then
		warn("[Копай глубже] Не удалось сохранить " .. player.Name .. ": " .. tostring(err))
	end
	return success
end

function DataService.release(player)
	DataService.save(player)
	profiles[player] = nil
	canSave[player] = nil
end

function DataService.init()
	-- автосохранение
	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_SECONDS)
			for _, player in ipairs(Players:GetPlayers()) do
				if profiles[player] then
					task.spawn(DataService.save, player)
					task.wait(0.5)
				end
			end
		end
	end)

	-- сохранение при выключении сервера
	game:BindToClose(function()
		local pending = 0
		for _, player in ipairs(Players:GetPlayers()) do
			if profiles[player] then
				pending = pending + 1
				task.spawn(function()
					DataService.save(player)
					pending = pending - 1
				end)
			end
		end
		local started = os.clock()
		while pending > 0 and os.clock() - started < 25 do
			task.wait(0.2)
		end
	end)
end

return DataService
