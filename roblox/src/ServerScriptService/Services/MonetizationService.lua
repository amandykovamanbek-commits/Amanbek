-- MonetizationService: Game Pass и Developer Product (покупки за Robux).
-- Пока в Config id = 0, в Studio покупка выдаётся бесплатно для теста.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)
local Net = require(script.Parent.Net)

local MonetizationService = {}

MonetizationService.onPassesChanged = nil -- функция(player), задаёт Main

local function passKeyById(id)
	for key, def in pairs(Config.GamePasses) do
		if def.id ~= 0 and def.id == id then
			return key
		end
	end
	return nil
end

local function productKeyById(id)
	for key, def in pairs(Config.Products) do
		if def.id ~= 0 and def.id == id then
			return key
		end
	end
	return nil
end

local function passesChanged(player)
	DataService.sync(player)
	if MonetizationService.onPassesChanged then
		MonetizationService.onPassesChanged(player)
	end
end

function MonetizationService.loadPasses(player)
	local profile = DataService.get(player)
	for key, def in pairs(Config.GamePasses) do
		if def.id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, def.id)
			end)
			if ok and owns then
				profile.passes[key] = true
			end
		end
	end
end

local function grantProduct(player, key)
	local def = Config.Products[key]
	if def.luck then
		local t = workspace:GetServerTimeNow()
		local untilT = math.max(workspace:GetAttribute("LuckUntil") or 0, t) + Config.LuckBoostSeconds
		workspace:SetAttribute("LuckUntil", untilT)
		Net.announce(player.DisplayName .. " включил Удачу сервера на 15 минут! 🍀", "divine")
	else
		local amount = Config.productAmount(key, DataService.income(player))
		DataService.addMoney(player, amount)
		Net.notify(player, "Получено " .. Config.formatMoney(amount) .. "! Спасибо за поддержку!", "success")
	end
	DataService.sync(player)
end

function MonetizationService.buyPass(player, key)
	local def = Config.GamePasses[key]
	if not def then
		return { ok = false, msg = "Нет такого товара" }
	end
	if DataService.hasPass(player, key) then
		return { ok = false, msg = "Уже куплено" }
	end
	if def.id == 0 then
		if RunService:IsStudio() then
			DataService.get(player).testPasses[key] = true
			passesChanged(player)
			return { ok = true, msg = "[ТЕСТ] Выдан " .. def.title .. " (только в Studio)" }
		end
		return { ok = false, msg = "Этот Game Pass ещё не настроен" }
	end
	MarketplaceService:PromptGamePassPurchase(player, def.id)
	return { ok = true, msg = "" }
end

function MonetizationService.buyProduct(player, key)
	local def = Config.Products[key]
	if not def then
		return { ok = false, msg = "Нет такого товара" }
	end
	if def.id == 0 then
		if RunService:IsStudio() then
			grantProduct(player, key)
			return { ok = true, msg = "[ТЕСТ] " .. def.title .. " выдан (только в Studio)" }
		end
		return { ok = false, msg = "Этот товар ещё не настроен" }
	end
	MarketplaceService:PromptProductPurchase(player, def.id)
	return { ok = true, msg = "" }
end

function MonetizationService.init()
	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
		if not purchased then
			return
		end
		local key = passKeyById(passId)
		local profile = DataService.get(player)
		if key and profile then
			profile.passes[key] = true
			passesChanged(player)
			Net.notify(player, "Куплено: " .. Config.GamePasses[key].title .. "!", "success")
		end
	end)

	MarketplaceService.ProcessReceipt = function(receipt)
		local player = Players:GetPlayerByUserId(receipt.PlayerId)
		local profile = player and DataService.get(player)
		if not profile then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		local receipts = profile.data.receipts
		for _, rid in ipairs(receipts) do
			if rid == receipt.PurchaseId then
				return Enum.ProductPurchaseDecision.PurchaseGranted
			end
		end
		local key = productKeyById(receipt.ProductId)
		if not key then
			warn("[Monetization] Неизвестный ProductId " .. tostring(receipt.ProductId))
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		grantProduct(player, key)
		table.insert(receipts, receipt.PurchaseId)
		while #receipts > 50 do
			table.remove(receipts, 1)
		end
		if profile.canSave and not DataService.save(player) then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
end

return MonetizationService
