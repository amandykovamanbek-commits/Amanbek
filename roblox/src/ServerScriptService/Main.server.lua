-- Main: точка входа сервера Wings & Brainrots.

local Players = game:GetService("Players")

local Services = game:GetService("ServerScriptService"):WaitForChild("Services")
local Net = require(Services.Net)
local MapBuilder = require(Services.MapBuilder)
local DataService = require(Services.DataService)
local PlotService = require(Services.PlotService)
local BrainrotService = require(Services.BrainrotService)
local UpgradeService = require(Services.UpgradeService)
local MonetizationService = require(Services.MonetizationService)
local CharacterVisuals = require(Services.CharacterVisuals)

Players.CharacterAutoLoads = false

MapBuilder.build()
DataService.init()
BrainrotService.init()
MonetizationService.init()

MonetizationService.onPassesChanged = function(player)
	PlotService.refresh(player)
	CharacterVisuals.apply(player)
end

-- окна станций открываются по ProximityPrompt
for name, station in pairs(MapBuilder.stations) do
	station.prompt.Triggered:Connect(function(player)
		Net.OpenPanel:FireClient(player, name)
	end)
end

-- все запросы клиента идут сюда; сервер сам проверяет деньги и расстояние
local handlers = {
	BuyUpgrade = function(player, arg)
		return UpgradeService.buyUpgrade(player, arg)
	end,
	BuyWing = function(player, arg)
		return UpgradeService.buyWing(player, arg)
	end,
	Sell = function(player, arg)
		return UpgradeService.sell(player, arg)
	end,
	SellAll = function(player)
		return UpgradeService.sellAll(player)
	end,
	BuyUpgradeMax = function(player, arg)
		return UpgradeService.buyUpgradeMax(player, arg)
	end,
	GoHome = function(player)
		local profile = DataService.get(player)
		if profile.carrying then
			return { ok = false, msg = "С существом домой — только своим ходом!" }
		end
		if profile.homeAt and os.clock() - profile.homeAt < 10 then
			return { ok = false, msg = "Подожди " .. math.ceil(10 - (os.clock() - profile.homeAt)) .. " сек" }
		end
		profile.homeAt = os.clock()
		BrainrotService.teleportHome(player)
		return { ok = true, msg = "🏠 Ты дома!" }
	end,
	BuyPass = function(player, arg)
		return MonetizationService.buyPass(player, arg)
	end,
	BuyProduct = function(player, arg)
		return MonetizationService.buyProduct(player, arg)
	end,
}

local lastRequest = {}
Net.Request.OnServerInvoke = function(player, action, arg)
	if not DataService.get(player) then
		return { ok = false, msg = "Данные ещё загружаются" }
	end
	local t = os.clock()
	if lastRequest[player] and t - lastRequest[player] < 0.15 then
		return { ok = false, msg = "" }
	end
	lastRequest[player] = t
	local handler = handlers[action]
	if not handler then
		return { ok = false, msg = "Неизвестное действие" }
	end
	local ok, result = pcall(handler, player, arg)
	if not ok then
		warn("[Main] Ошибка в " .. tostring(action) .. ": " .. tostring(result))
		return { ok = false, msg = "Ошибка сервера" }
	end
	return result
end

local function onCharacter(player, char)
	local hum = char:WaitForChild("Humanoid")
	char:WaitForChild("HumanoidRootPart")
	UpgradeService.applyWalkSpeed(player)
	CharacterVisuals.apply(player)
	task.defer(function()
		BrainrotService.teleportHome(player)
	end)
	hum.Died:Connect(function()
		BrainrotService.drop(player)
		task.wait(3)
		if player.Parent then
			player:LoadCharacter()
		end
	end)
end

local function onPlayerAdded(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local money = Instance.new("IntValue")
	money.Name = "$"
	money.Parent = stats
	local count = Instance.new("IntValue")
	count.Name = "Существа"
	count.Parent = stats
	stats.Parent = player

	DataService.load(player)
	if not player.Parent then
		DataService.release(player)
		return
	end
	MonetizationService.loadPasses(player)
	if not PlotService.assign(player) then
		player:Kick("Сервер заполнен, попробуй другой")
		return
	end
	PlotService.refresh(player)
	DataService.sync(player)
	player:SetAttribute("Loaded", true)

	player.CharacterAdded:Connect(function(char)
		onCharacter(player, char)
	end)
	player:LoadCharacter()
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(onPlayerAdded, p)
end

Players.PlayerRemoving:Connect(function(player)
	lastRequest[player] = nil
	if not DataService.get(player) then
		return
	end
	BrainrotService.drop(player)
	PlotService.release(player)
	DataService.release(player)
end)

-- доход каждую секунду копится у подиумов (забираешь кнопкой на базе)
task.spawn(function()
	while true do
		task.wait(1)
		for player, profile in pairs(DataService.all()) do
			if player.Parent and profile.plotIndex then
				PlotService.accumulate(player)
				DataService.sync(player)
			end
		end
	end
end)
