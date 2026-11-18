-- Копай глубже / Dig to the Core — запуск сервера.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Remotes = require(script.Parent.Remotes)
local Data = require(script.Parent.DataService)
local Mine = require(script.Parent.MineService)
local Purchases = require(script.Parent.PurchaseService)
local PlayerService = require(script.Parent.PlayerService)
local Leaderboards = require(script.Parent.LeaderboardService)

print(("[Копай глубже] Сервер запускается, версия %s"):format(Config.Version))

Data.init()
Mine.init()
Purchases.init(PlayerService)
PlayerService.init()
Leaderboards.init()

-- Обновление шахты по таймеру, с предупреждением и землетрясением у игроков
task.spawn(function()
	local period = math.max(2, Config.MineResetMinutes) * 60
	while true do
		Mine.NextResetAt = os.time() + period
		task.wait(period - 30)
		Remotes.Fx:FireAllClients("ResetWarn", 30)
		task.wait(30)
		Remotes.Fx:FireAllClients("Resetting")
		task.wait(1.2)
		PlayerService.surfaceAll()
		task.wait(0.3)
		Mine.reset()
		Remotes.Fx:FireAllClients("ResetDone")
	end
end)

print("[Копай глубже] Сервер готов!")
