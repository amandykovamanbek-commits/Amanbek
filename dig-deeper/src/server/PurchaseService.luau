-- Покупки за Robux: геймпассы (навсегда) и разовые покупки (Developer Products).
-- Id геймпассов и покупок задаются в Config.luau.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.DataService)

local PurchaseService = {}

local owned = {} -- [player] = { [passKey] = true/false }
local PlayerService = nil -- подключается в init (чтобы не было круговой зависимости)

local function studioFree()
	return RunService:IsStudio() and Config.StudioFreePasses
end

function PurchaseService.passes(player)
	local t = owned[player]
	if not t then
		t = {}
		owned[player] = t
	end
	return t
end

function PurchaseService.owns(player, key)
	return PurchaseService.passes(player)[key] == true
end

local function checkPass(player, pass)
	if studioFree() then
		return true
	end
	if not pass.Id or pass.Id == 0 then
		return false
	end
	local ok, has = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, pass.Id)
	end)
	return ok and has == true
end

function PurchaseService.load(player)
	local t = PurchaseService.passes(player)
	for _, pass in ipairs(Config.GamePasses) do
		t[pass.Key] = checkPass(player, pass)
	end
end

local function productById(productId)
	for _, product in ipairs(Config.Products) do
		if product.Id ~= 0 and product.Id == productId then
			return product
		end
	end
	return nil
end

local function processReceipt(info)
	local player = Players:GetPlayerByUserId(info.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local data = Data.get(player)
	if not data or not PlayerService then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	-- защита от двойного начисления
	for _, id in ipairs(data.Receipts) do
		if id == info.PurchaseId then
			return Enum.ProductPurchaseDecision.PurchaseGranted
		end
	end
	local product = productById(info.ProductId)
	if not product then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local ok, granted = pcall(PlayerService.grantProduct, player, product)
	if not ok or not granted then
		warn("[Копай глубже] Не удалось выдать покупку: " .. tostring(granted))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	table.insert(data.Receipts, info.PurchaseId)
	while #data.Receipts > 30 do
		table.remove(data.Receipts, 1)
	end
	Data.save(player)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

function PurchaseService.init(playerService)
	PlayerService = playerService

	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
		if not purchased then
			return
		end
		for _, pass in ipairs(Config.GamePasses) do
			if pass.Id ~= 0 and pass.Id == passId then
				PurchaseService.passes(player)[pass.Key] = true
				PlayerService.onPassBought(player, pass.Key)
			end
		end
	end)

	MarketplaceService.ProcessReceipt = processReceipt

	Players.PlayerRemoving:Connect(function(player)
		owned[player] = nil
	end)
end

return PurchaseService
