-- Игроки: загрузка, копание, продажа, магазин, перерождение, лифт,
-- ежедневные награды, коды, кирка в руках, таблица лидеров над игроками.
-- Все проверки делаются на сервере — клиент только просит.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local PhysicsService = game:GetService("PhysicsService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))
local Locale = require(Shared:WaitForChild("Locale"))
local Remotes = require(script.Parent.Remotes)
local Data = require(script.Parent.DataService)
local Mine = require(script.Parent.MineService)
local Purchases = require(script.Parent.PurchaseService)

local PlayerService = {}

local sessions = {} -- [player] = сессия
local pads = {} -- { { Kind = "Sell", Part = part } }
local PLAYER_GROUP = "Players"

---------------------------------------------------------------------
-- Вспомогательные
---------------------------------------------------------------------
local function fx(player, kind, ...)
	Remotes.Fx:FireClient(player, kind, ...)
end

local function toast(player, key, ...)
	local s = sessions[player]
	if not s then
		return
	end
	local now = os.clock()
	if s.toasts[key] and now - s.toasts[key] < 1.5 then
		return
	end
	s.toasts[key] = now
	fx(player, "Toast", key, ...)
end

local function passesOf(player)
	return Purchases.passes(player)
end

local function potionActive(data, name)
	return (data.Potions[name] or 0) > os.time()
end

local function markDirty(player)
	local s = sessions[player]
	if s then
		s.dirty = true
	end
end
PlayerService.markDirty = markDirty

local function dailyStatus(data)
	local now = os.time()
	local last = data.Daily.Last or 0
	local cooldown = Config.DailyCooldownHours * 3600
	local canClaim = now - last >= cooldown
	local streak = data.Daily.Streak or 0
	if last > 0 and now - last > Config.DailyStreakHours * 3600 then
		streak = 0
	end
	local nextDay = (streak % #Config.Daily) + 1
	return canClaim, math.max(0, cooldown - (now - last)), nextDay, streak
end

local function buildState(player)
	local data = Data.get(player)
	local passes = passesOf(player)
	local canClaim, nextIn, nextDay, streak = dailyStatus(data)
	local passCopy = {}
	for _, pass in ipairs(Config.GamePasses) do
		passCopy[pass.Key] = passes[pass.Key] == true
	end
	return {
		Cash = data.Cash,
		Pickaxe = data.Pickaxe,
		Backpack = data.Backpack,
		Rebirths = data.Rebirths,
		BestDepth = data.BestDepth,
		TotalMined = data.TotalMined,
		Inv = data.Inv,
		InvCount = Economy.inventoryCount(data.Inv),
		Capacity = Economy.capacity(data.Backpack, passes),
		Lang = data.Lang,
		Passes = passCopy,
		Potions = {
			Luck = math.max(0, (data.Potions.Luck or 0) - os.time()),
			Speed = math.max(0, (data.Potions.Speed or 0) - os.time()),
		},
		Cooldown = Economy.swingCooldown(data.Pickaxe, passes, potionActive(data, "Speed")),
		Mult = Economy.cashMultiplier(data.Rebirths, passes),
		Daily = { CanClaim = canClaim, NextIn = nextIn, Day = nextDay, Streak = streak },
		Layers = data.Layers,
		SeenIntro = data.SeenIntro,
		AutoMine = data.AutoMine and passes.AutoMine == true,
		MineResetIn = math.max(0, Mine.NextResetAt - os.time()),
		Offline = Data.Offline,
	}
end

local function updateLeaderstats(player)
	local data = Data.get(player)
	local stats = player:FindFirstChild("leaderstats")
	if not data or not stats then
		return
	end
	stats.Depth.Value = data.BestDepth
	stats.Cash.Value = "$" .. Locale.short(data.Cash)
	stats.Rebirths.Value = data.Rebirths
end

local function pushState(player)
	local s = sessions[player]
	if not s or not Data.get(player) then
		return
	end
	s.dirty = false
	updateLeaderstats(player)
	Remotes.State:FireClient(player, buildState(player))
end

local function rootPart(player)
	local char = player.Character
	return char and char:FindFirstChild("HumanoidRootPart")
end

local function teleport(player, cf)
	local char = player.Character
	local root = rootPart(player)
	if not char or not root then
		return
	end
	char:PivotTo(cf)
	root.AssemblyLinearVelocity = Vector3.zero
end

local function surfaceCFrame()
	local spawn = workspace:FindFirstChild("Map") and workspace.Map:FindFirstChild("Spawn", true)
	local base = spawn and spawn.Position + Vector3.new(0, 4, 0) or Config.SpawnPosition
	local offset = Vector3.new(math.random(-4, 4), 0, math.random(-4, 4))
	-- смотрим в сторону шахты
	return CFrame.lookAt(base + offset, Vector3.new(0, base.Y, 0))
end

local function nearPad(player, kind)
	local root = rootPart(player)
	if not root then
		return false
	end
	for _, pad in ipairs(pads) do
		if pad.Kind == kind then
			local delta = root.Position - pad.Part.Position
			local flat = Vector3.new(delta.X, 0, delta.Z).Magnitude
			if flat <= Config.PadRadius + 5 and math.abs(delta.Y) < 12 then
				return true
			end
		end
	end
	return false
end

---------------------------------------------------------------------
-- Кирка в руках (собирается из деталей)
---------------------------------------------------------------------
local function buildPickaxe(index)
	local cfg = Config.Pickaxes[index] or Config.Pickaxes[1]
	local tool = Instance.new("Tool")
	tool.Name = "Pickaxe"
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.ToolTip = cfg.Name.en
	tool.Grip = CFrame.new(0, -1.25, 0)
	tool:SetAttribute("Tier", index)

	local function piece(name, size, color, material)
		local p = Instance.new("Part")
		p.Name = name
		p.Size = size
		p.Color = color
		p.Material = material
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Massless = true
		p.CastShadow = false
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		return p
	end

	local headMaterial = cfg.Glow and Enum.Material.Neon or Enum.Material.SmoothPlastic
	local handle = piece("Handle", Vector3.new(0.34, 4.2, 0.34), Color3.fromRGB(122, 78, 42), Enum.Material.Wood)
	handle.Parent = tool

	local head = piece("Head", Vector3.new(0.5, 0.62, 2.6), cfg.Head, headMaterial)
	head.CFrame = handle.CFrame * CFrame.new(0, 1.85, 0)
	head.Parent = tool

	local tipA = piece("TipA", Vector3.new(0.42, 0.42, 1.1), cfg.Head, headMaterial)
	tipA.CFrame = head.CFrame * CFrame.new(0, -0.2, 1.55) * CFrame.Angles(math.rad(-28), 0, 0)
	tipA.Parent = tool

	local tipB = piece("TipB", Vector3.new(0.42, 0.42, 1.1), cfg.Head, headMaterial)
	tipB.CFrame = head.CFrame * CFrame.new(0, -0.2, -1.55) * CFrame.Angles(math.rad(28), 0, 0)
	tipB.Parent = tool

	local band = piece("Band", Vector3.new(0.46, 0.5, 0.46), Color3.fromRGB(60, 40, 24), Enum.Material.SmoothPlastic)
	band.CFrame = handle.CFrame * CFrame.new(0, 1.35, 0)
	band.Parent = tool

	for _, p in ipairs({ head, tipA, tipB, band }) do
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = handle
		weld.Part1 = p
		weld.Parent = p
	end

	-- фонарик на кирке: светит под землёй
	local light = Instance.new("PointLight")
	light.Name = "Lamp"
	light.Range = 22
	light.Brightness = 1.4
	light.Color = cfg.Glow and cfg.Head or Color3.fromRGB(255, 236, 200)
	light.Shadows = false
	light.Parent = head

	if cfg.Glow then
		local sparkle = Instance.new("ParticleEmitter")
		sparkle.Name = "Sparkle"
		sparkle.Color = ColorSequence.new(cfg.Head)
		sparkle.LightEmission = 1
		sparkle.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.25), NumberSequenceKeypoint.new(1, 0) })
		sparkle.Lifetime = NumberRange.new(0.4, 0.8)
		sparkle.Rate = 12
		sparkle.Speed = NumberRange.new(0.5, 1.5)
		sparkle.SpreadAngle = Vector2.new(180, 180)
		sparkle.Parent = head
	end
	return tool
end

local function giveTool(player, equip)
	local data = Data.get(player)
	if not data then
		return
	end
	local function clear(container)
		if not container then
			return
		end
		for _, item in ipairs(container:GetChildren()) do
			if item:IsA("Tool") and item.Name == "Pickaxe" then
				item:Destroy()
			end
		end
	end
	clear(player:FindFirstChild("Backpack"))
	clear(player:FindFirstChild("StarterGear"))
	clear(player.Character)

	local gear = player:FindFirstChild("StarterGear")
	if gear then
		buildPickaxe(data.Pickaxe).Parent = gear
	end
	local backpack = player:FindFirstChild("Backpack")
	if backpack then
		local tool = buildPickaxe(data.Pickaxe)
		tool.Parent = backpack
		if equip then
			local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
			if humanoid then
				humanoid:EquipTool(tool)
			end
		end
	end
end

---------------------------------------------------------------------
-- VIP-табличка над головой
---------------------------------------------------------------------
local function applyVipTag(player)
	if not Purchases.owns(player, "VIP") then
		return
	end
	local char = player.Character
	local head = char and char:FindFirstChild("Head")
	if not head or head:FindFirstChild("VipTag") then
		return
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "VipTag"
	gui.Size = UDim2.fromOffset(140, 36)
	gui.StudsOffset = Vector3.new(0, 2.4, 0)
	gui.MaxDistance = 80
	gui.LightInfluence = 0
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.GothamBlack
	label.Text = "👑 VIP"
	label.TextScaled = true
	label.TextColor3 = Color3.fromRGB(255, 214, 64)
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 2.5
	stroke.Color = Color3.new(0, 0, 0)
	stroke.Parent = label
	label.Parent = gui
	gui.Parent = head
end

---------------------------------------------------------------------
-- Персонаж
---------------------------------------------------------------------
local function setupCharacter(player, char)
	local humanoid = char:WaitForChild("Humanoid", 10)
	if not humanoid then
		return
	end
	humanoid.WalkSpeed = Config.WalkSpeed
	for _, part in ipairs(char:GetDescendants()) do
		if part:IsA("BasePart") then
			part.CollisionGroup = PLAYER_GROUP
		end
	end
	char.DescendantAdded:Connect(function(part)
		if part:IsA("BasePart") then
			part.CollisionGroup = PLAYER_GROUP
		end
	end)
	task.wait(0.2)
	if Data.get(player) then
		giveTool(player, true)
		applyVipTag(player)
	end
end

---------------------------------------------------------------------
-- Продажа
---------------------------------------------------------------------
local function sell(player, viaPad)
	local data = Data.get(player)
	if not data then
		return
	end
	local count = Economy.inventoryCount(data.Inv)
	if count == 0 then
		if not viaPad then
			toast(player, "NothingToSell")
		end
		return
	end
	if not viaPad and not Purchases.owns(player, "SellAnywhere") and not nearPad(player, "Sell") then
		toast(player, "GoToSell")
		return
	end
	local value = math.floor(Economy.inventoryValue(data.Inv) * Economy.cashMultiplier(data.Rebirths, passesOf(player)))
	data.Cash = data.Cash + value
	data.TotalEarned = data.TotalEarned + value
	data.Inv = {}
	fx(player, "Sold", value, count)
	markDirty(player)
end

---------------------------------------------------------------------
-- Копание
---------------------------------------------------------------------
local function onMine(player, block)
	local data = Data.get(player)
	local s = sessions[player]
	if not data or not s then
		return
	end
	local folder = Mine.folder()
	if typeof(block) ~= "Instance" or not block:IsA("BasePart") or block.Parent ~= folder then
		return
	end
	local passes = passesOf(player)
	local now = os.clock()
	local cooldown = Economy.swingCooldown(data.Pickaxe, passes, potionActive(data, "Speed"))
	if now - s.lastSwing < cooldown * 0.8 then
		return
	end
	s.lastSwing = now

	local root = rootPart(player)
	if not root or (root.Position - block.Position).Magnitude > Config.Reach + 8 then
		return
	end

	local depth = block:GetAttribute("D") or 0
	local layer, layerIndex = Config.LayerForDepth(depth)
	local pick = Config.Pickaxes[data.Pickaxe]
	if pick.Power < layer.MinPower then
		toast(player, "NeedPickaxe", Config.PickaxeForPower(layer.MinPower))
		return
	end

	local hp = (block:GetAttribute("Hp") or 1) - pick.Power
	if hp > 0 then
		block:SetAttribute("Hp", hp)
		return
	end

	local oreId = block:GetAttribute("Ore") or layer.Common.Id
	if not block:GetAttribute("Rare") then
		local luck = Economy.luck(passes, potionActive(data, "Luck"))
		if luck > 1 and math.random() < Config.BaseRareChance * (luck - 1) then
			oreId = layer.Rare.Id
		end
	end

	local info = Mine.breakBlock(block)
	if not info then
		return
	end
	data.TotalMined = data.TotalMined + 1

	local count = Economy.inventoryCount(data.Inv)
	if count < Economy.capacity(data.Backpack, passes) then
		data.Inv[oreId] = (data.Inv[oreId] or 0) + 1
		fx(player, "Ore", oreId, info.Position)
	else
		toast(player, "BackpackFull")
	end

	local meters = depth + 1
	if meters > data.BestDepth then
		data.BestDepth = meters
	end

	if not data.Layers[layer.Id] then
		data.Layers[layer.Id] = true
		local reward = layer.Reward * (1 + data.Rebirths)
		data.Cash = data.Cash + reward
		fx(player, "Layer", layerIndex, reward)
	end

	if depth >= Config.MaxDepth - 1 and data.CoreClaims < data.Rebirths + 1 then
		data.CoreClaims = data.Rebirths + 1
		local reward = Config.CoreBottomReward * (1 + data.Rebirths)
		data.Cash = data.Cash + reward
		fx(player, "Core", reward)
	end

	markDirty(player)
end

---------------------------------------------------------------------
-- Действия игрока (кнопки интерфейса)
---------------------------------------------------------------------
local Actions = {}

local function cooldownOk(player, name, seconds)
	local s = sessions[player]
	local now = os.clock()
	if s.actions[name] and now - s.actions[name] < seconds then
		return false
	end
	s.actions[name] = now
	return true
end

local function validIndex(value, list)
	return type(value) == "number" and value == math.floor(value) and value >= 1 and value <= #list
end

function Actions.Ready(player)
	pushState(player)
end

function Actions.Sell(player)
	sell(player, false)
end

function Actions.BuyPickaxe(player, index)
	local data = Data.get(player)
	if not validIndex(index, Config.Pickaxes) or index <= data.Pickaxe then
		return
	end
	local price = Config.Pickaxes[index].Price
	if data.Cash < price then
		toast(player, "NotEnough")
		return
	end
	data.Cash = data.Cash - price
	data.Pickaxe = index
	giveTool(player, true)
	fx(player, "Bought", "Pickaxe", index)
	markDirty(player)
end

function Actions.BuyBackpack(player, index)
	local data = Data.get(player)
	if not validIndex(index, Config.Backpacks) or index <= data.Backpack then
		return
	end
	local price = Config.Backpacks[index].Price
	if data.Cash < price then
		toast(player, "NotEnough")
		return
	end
	data.Cash = data.Cash - price
	data.Backpack = index
	fx(player, "Bought", "Backpack", index)
	markDirty(player)
end

function Actions.Rebirth(player)
	local data = Data.get(player)
	if not cooldownOk(player, "Rebirth", 2) then
		return
	end
	local cost = Economy.rebirthCost(data.Rebirths)
	if data.Cash < cost then
		toast(player, "RebirthNotEnough", Locale.short(cost))
		return
	end
	data.Cash = 0
	data.Pickaxe = 1
	data.Backpack = 1
	data.Inv = {}
	data.Rebirths = data.Rebirths + 1
	giveTool(player, true)
	teleport(player, surfaceCFrame())
	fx(player, "Rebirth", data.Rebirths, Economy.rebirthMultiplier(data.Rebirths))
	markDirty(player)
	task.spawn(Data.save, player)
end

function Actions.Surface(player)
	if not cooldownOk(player, "Surface", 1.5) then
		return
	end
	teleport(player, surfaceCFrame())
end

function Actions.Elevator(player, index)
	local data = Data.get(player)
	if not validIndex(index, Config.Layers) or not cooldownOk(player, "Elevator", 2) then
		return
	end
	local layer = Config.Layers[index]
	if not data.Layers[layer.Id] then
		toast(player, "LayerLocked")
		return
	end
	if Config.Pickaxes[data.Pickaxe].Power < layer.MinPower then
		toast(player, "LayerTooHard", Config.PickaxeForPower(layer.MinPower))
		return
	end
	local cf = Mine.prepareChamber(layer.From + 1)
	teleport(player, cf)
	fx(player, "Teleport", index)
end

local function applyPotion(data, name)
	local current = data.Potions[name] or 0
	data.Potions[name] = math.max(os.time(), current) + Config.PotionSeconds
end

function Actions.ClaimDaily(player)
	local data = Data.get(player)
	if not cooldownOk(player, "Daily", 1) then
		return
	end
	local canClaim, nextIn = dailyStatus(data)
	if not canClaim then
		toast(player, "DailyWait", math.floor(nextIn))
		return
	end
	local now = os.time()
	if data.Daily.Last > 0 and now - data.Daily.Last > Config.DailyStreakHours * 3600 then
		data.Daily.Streak = 0
	end
	data.Daily.Streak = data.Daily.Streak + 1
	data.Daily.Last = now
	local day = ((data.Daily.Streak - 1) % #Config.Daily) + 1
	local reward = Economy.dailyReward(day, data.Rebirths, data.Pickaxe)
	data.Cash = data.Cash + reward.Cash
	if reward.Potion then
		applyPotion(data, reward.Potion)
	end
	fx(player, "Daily", day, reward.Cash, reward.Potion)
	markDirty(player)
end

function Actions.Redeem(player, code)
	local data = Data.get(player)
	if type(code) ~= "string" or #code > 40 or not cooldownOk(player, "Redeem", 1) then
		return
	end
	code = string.upper((code:gsub("%s", "")))
	local entry = Config.Codes[code]
	if not entry then
		toast(player, "CodeBad")
		return
	end
	if data.Codes[code] then
		toast(player, "CodeUsed")
		return
	end
	data.Codes[code] = true
	if entry.Cash then
		data.Cash = data.Cash + entry.Cash
	end
	if entry.Potion then
		applyPotion(data, entry.Potion)
	end
	fx(player, "Code", entry.Cash or 0, entry.Potion)
	markDirty(player)
end

function Actions.SetLang(player, lang)
	local data = Data.get(player)
	if lang ~= "ru" and lang ~= "en" then
		return
	end
	data.Lang = lang
	markDirty(player)
end

function Actions.SetAuto(player, on)
	local data = Data.get(player)
	if type(on) ~= "boolean" then
		return
	end
	data.AutoMine = on and Purchases.owns(player, "AutoMine")
	markDirty(player)
end

function Actions.IntroSeen(player)
	local data = Data.get(player)
	data.SeenIntro = true
end

---------------------------------------------------------------------
-- Покупки за Robux (вызывается из PurchaseService)
---------------------------------------------------------------------
local function deepTeleport(player)
	local data = Data.get(player)
	local power = Config.Pickaxes[data.Pickaxe].Power
	local maxDepth = 0
	for _, layer in ipairs(Config.Layers) do
		if layer.MinPower <= power then
			maxDepth = layer.To - 3
		end
	end
	local target = math.min(data.BestDepth - 1, maxDepth)
	if target < 2 then
		teleport(player, surfaceCFrame())
		return
	end
	teleport(player, Mine.prepareChamber(target))
end

function PlayerService.grantProduct(player, product)
	local data = Data.get(player)
	if not data then
		return false
	end
	if product.Cash then
		data.Cash = data.Cash + Economy.cashPackAmount(product.Cash, data.Rebirths)
	end
	if product.Potion then
		applyPotion(data, product.Potion)
	end
	if product.Key == "DeepTeleport" then
		deepTeleport(player)
	end
	fx(player, "Thanks", product.Key)
	markDirty(player)
	return true
end

function PlayerService.onPassBought(player, key)
	if key == "VIP" then
		applyVipTag(player)
	end
	fx(player, "Thanks", key)
	markDirty(player)
end

---------------------------------------------------------------------
-- Подключение игроков
---------------------------------------------------------------------
local function onPlayerAdded(player)
	sessions[player] = { lastSwing = 0, toasts = {}, actions = {}, dirty = false, padTouch = 0 }

	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local depth = Instance.new("IntValue")
	depth.Name = "Depth"
	depth.Parent = stats
	local cash = Instance.new("StringValue")
	cash.Name = "Cash"
	cash.Value = "$0"
	cash.Parent = stats
	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Rebirths"
	rebirths.Parent = stats
	stats.Parent = player

	local data = Data.load(player)
	if not data then
		return
	end
	if data.Lang ~= "ru" and data.Lang ~= "en" then
		local locale = string.lower(player.LocaleId or "")
		data.Lang = string.sub(locale, 1, 2) == "ru" and "ru" or "en"
	end
	data.Layers.Dirt = true
	Purchases.load(player)

	player.CharacterAdded:Connect(function(char)
		setupCharacter(player, char)
	end)
	if player.Character then
		task.spawn(setupCharacter, player, player.Character)
	end
	pushState(player)
end

local function onPlayerRemoving(player)
	Data.release(player)
	sessions[player] = nil
end

function PlayerService.surfaceAll()
	for _, player in ipairs(Players:GetPlayers()) do
		local root = rootPart(player)
		if root and root.Position.Y < Config.SurfaceY - 2 then
			teleport(player, surfaceCFrame())
		end
	end
end

local function collectPads()
	pads = {}
	local map = workspace:FindFirstChild("Map")
	if not map then
		return
	end
	for _, item in ipairs(map:GetDescendants()) do
		if item:IsA("StringValue") and item.Name == "PadKind" and item.Parent:IsA("BasePart") then
			table.insert(pads, { Kind = item.Value, Part = item.Parent })
		end
	end
	-- автопродажа: встал в красный круг — руда продана
	for _, pad in ipairs(pads) do
		if pad.Kind == "Sell" then
			pad.Part.CanTouch = true
			pad.Part.Touched:Connect(function(hit)
				local player = Players:GetPlayerFromCharacter(hit.Parent)
				local s = player and sessions[player]
				if not s then
					return
				end
				local now = os.clock()
				if now - s.padTouch < 1.2 then
					return
				end
				s.padTouch = now
				sell(player, true)
			end)
		end
	end
end

function PlayerService.init()
	pcall(function()
		PhysicsService:RegisterCollisionGroup(PLAYER_GROUP)
	end)
	pcall(function()
		PhysicsService:CollisionGroupSetCollidable(PLAYER_GROUP, PLAYER_GROUP, false)
	end)

	collectPads()

	Remotes.Mine.OnServerEvent:Connect(onMine)
	Remotes.Action.OnServerEvent:Connect(function(player, name, ...)
		if type(name) ~= "string" then
			return
		end
		local handler = Actions[name]
		local s = sessions[player]
		if not handler or not s or not Data.get(player) then
			return
		end
		-- ограничение частоты запросов
		local now = os.clock()
		s.windowStart = s.windowStart or now
		s.windowCount = (s.windowCount or 0) + 1
		if now - s.windowStart > 1 then
			s.windowStart = now
			s.windowCount = 1
		end
		if s.windowCount > 25 then
			return
		end
		handler(player, ...)
	end)

	Players.PlayerAdded:Connect(onPlayerAdded)
	Players.PlayerRemoving:Connect(onPlayerRemoving)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(onPlayerAdded, player)
	end

	-- отправка изменений клиентам (не чаще ~7 раз в секунду)
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc = acc + dt
		if acc < 0.15 then
			return
		end
		acc = 0
		for player, s in pairs(sessions) do
			if s.dirty then
				pushState(player)
			end
		end
	end)

	-- раз в 10 секунд обновляем таймеры зелий / награды
	task.spawn(function()
		while true do
			task.wait(10)
			for player in pairs(sessions) do
				markDirty(player)
			end
		end
	end)
end

return PlayerService
