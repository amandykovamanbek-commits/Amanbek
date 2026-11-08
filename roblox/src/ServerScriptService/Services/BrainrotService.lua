-- BrainrotService: спавн существ на островах, захват, переноска, доставка на базу.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local MapBuilder = require(script.Parent.MapBuilder)
local CreatureFactory = require(script.Parent.CreatureFactory)
local DataService = require(script.Parent.DataService)
local PlotService = require(script.Parent.PlotService)
local Net = require(script.Parent.Net)

local BrainrotService = {}

local spawnEntries = {} -- список { island, cframe, model, carriedBy, nextSpawn, divine }
local divineEntry = nil
local rng = Random.new()

local function now()
	return workspace:GetServerTimeNow()
end

local function creaturesOfRarity(rarity)
	local list = {}
	for id, def in pairs(Config.Creatures) do
		if def.rarity == rarity then
			table.insert(list, { id = id, weight = def.weight })
		end
	end
	table.sort(list, function(a, b)
		return a.id < b.id
	end)
	return list
end

function BrainrotService.luckActive()
	return (workspace:GetAttribute("LuckUntil") or 0) > now()
end

local function pickCreature(rarity)
	if rarity < 6 then
		local chance = BrainrotService.luckActive() and Config.LuckBoostChance or Config.LuckChance
		if rng:NextNumber() < chance then
			rarity = rarity + 1
		end
	end
	local list = creaturesOfRarity(rarity)
	local total = 0
	for _, c in ipairs(list) do
		total = total + c.weight
	end
	local roll = rng:NextNumber() * total
	for _, c in ipairs(list) do
		roll = roll - c.weight
		if roll <= 0 then
			return c.id
		end
	end
	return list[#list].id
end

local function getRoot(player)
	local char = player.Character
	if not char then
		return nil
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then
		return nil
	end
	return char:FindFirstChild("HumanoidRootPart")
end

local function spawnAt(entry, id)
	local model = CreatureFactory.build(id, entry.cframe)
	model.Parent = MapBuilder.creatureFolder
	entry.model = model
	entry.id = id
	entry.carriedBy = nil

	local pp = Instance.new("ProximityPrompt")
	pp.Name = "GrabPrompt"
	pp.ActionText = "Схватить"
	pp.ObjectText = Config.Creatures[id].name
	pp.HoldDuration = 0.3
	pp.MaxActivationDistance = 14
	pp.RequiresLineOfSight = false
	pp.KeyboardKeyCode = Enum.KeyCode.E
	pp.Parent = model.PrimaryPart
	pp.Triggered:Connect(function(player)
		BrainrotService.grab(player, entry)
	end)
end

function BrainrotService.grab(player, entry)
	local profile = DataService.get(player)
	if not profile or profile.carrying then
		if profile and profile.carrying then
			Net.notify(player, "Ты уже несёшь существо!", "error")
		end
		return
	end
	if not entry.model or entry.carriedBy then
		return
	end
	local root = getRoot(player)
	if not root then
		return
	end
	if (root.Position - entry.model.PrimaryPart.Position).Magnitude > 20 then
		return
	end

	entry.carriedBy = player
	local model = entry.model
	local prompt = model.PrimaryPart:FindFirstChild("GrabPrompt")
	if prompt then
		prompt.Enabled = false
	end
	CreatureFactory.setAnchored(model, false)
	local _, size = model:GetBoundingBox()
	model:PivotTo(root.CFrame * CFrame.new(0, 2.5 + size.Y / 2, 0))
	local w = Instance.new("WeldConstraint")
	w.Name = "CarryWeld"
	w.Part0 = root
	w.Part1 = model.PrimaryPart
	w.Parent = model.PrimaryPart

	profile.carrying = { id = entry.id, entry = entry }
	DataService.sync(player)

	local def = Config.Creatures[entry.id]
	if def.rarity >= 7 then
		Net.announce(player.DisplayName .. " схватил " .. def.name .. "!", "divine")
	else
		Net.notify(player, "Неси " .. def.name .. " на свою базу!", "info")
	end
end

-- Существо возвращается на своё место на острове.
function BrainrotService.drop(player)
	local profile = DataService.get(player)
	if not profile or not profile.carrying then
		return
	end
	local entry = profile.carrying.entry
	profile.carrying = nil
	if entry.model and entry.model.Parent then
		local weld = entry.model.PrimaryPart:FindFirstChild("CarryWeld")
		if weld then
			weld:Destroy()
		end
		CreatureFactory.setAnchored(entry.model, true)
		entry.model:PivotTo(entry.cframe * CFrame.new(0, (entry.model.PrimaryPart.Size.Y / 2 + 0.9 * CreatureFactory.scaleFor(entry.id)), 0))
		local prompt = entry.model.PrimaryPart:FindFirstChild("GrabPrompt")
		if prompt then
			prompt.Enabled = true
		end
		entry.carriedBy = nil
	else
		entry.model = nil
		entry.carriedBy = nil
		entry.nextSpawn = now() + Config.RespawnMin
	end
	if player.Parent then
		DataService.sync(player)
	end
end

local function deliver(player, profile)
	local entry = profile.carrying.entry
	local id = profile.carrying.id
	if #profile.data.creatures >= DataService.maxSlots(player) then
		if not profile.fullWarnAt or os.clock() - profile.fullWarnAt > 5 then
			profile.fullWarnAt = os.clock()
			Net.notify(player, "База заполнена! Продай существ на рынке.", "error")
		end
		return
	end
	profile.carrying = nil
	if entry.model then
		entry.model:Destroy()
	end
	entry.model = nil
	entry.carriedBy = nil
	if not entry.divine then
		entry.nextSpawn = now() + rng:NextNumber(Config.RespawnMin, Config.RespawnMax)
	end
	table.insert(profile.data.creatures, id)
	PlotService.refresh(player)
	DataService.sync(player)
	local def = Config.Creatures[id]
	Net.notify(player, def.name .. " теперь на базе! +" .. Config.formatMoney(def.income) .. "/сек", "success")
	if def.rarity >= 7 then
		Net.announce(player.DisplayName .. " доставил " .. def.name .. " на базу!", "divine")
	end
end

function BrainrotService.teleportHome(player)
	local plot = PlotService.getPlot(player)
	local char = player.Character
	if plot and char then
		char:PivotTo(plot.spawnCFrame)
		local root = char:FindFirstChild("HumanoidRootPart")
		if root then
			root.AssemblyLinearVelocity = Vector3.zero
		end
	end
end

local function tick()
	local t = now()
	-- обычные острова
	for _, entry in ipairs(spawnEntries) do
		if not entry.divine and not entry.model and t >= (entry.nextSpawn or 0) then
			spawnAt(entry, pickCreature(entry.rarity))
		end
	end
	-- божественный
	local nextDivine = workspace:GetAttribute("DivineNextSpawn") or 0
	if divineEntry and t >= nextDivine then
		workspace:SetAttribute("DivineNextSpawn", t + Config.DivineInterval)
		if not divineEntry.model then
			spawnAt(divineEntry, pickCreature(7))
			Net.announce("Божественный " .. Config.Creatures[divineEntry.id].name .. " появился на Острове 7!", "divine")
		end
	end
	workspace:SetAttribute("DivinePresent", divineEntry ~= nil and divineEntry.model ~= nil)
end

function BrainrotService.init()
	for islandIndex, island in ipairs(MapBuilder.islands) do
		for _, cf in ipairs(island.spawnPoints) do
			local entry = {
				island = islandIndex,
				rarity = island.def.rarity,
				cframe = cf,
				model = nil,
				nextSpawn = 0,
				divine = island.def.rarity >= 7,
			}
			table.insert(spawnEntries, entry)
			if entry.divine then
				divineEntry = entry
			end
		end
	end
	workspace:SetAttribute("DivineNextSpawn", now() + Config.DivineInterval)

	task.spawn(function()
		while true do
			tick()
			task.wait(1)
		end
	end)

	-- доставка и падение в воду
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc = acc + dt
		if acc < 0.2 then
			return
		end
		acc = 0
		for _, player in ipairs(Players:GetPlayers()) do
			local profile = DataService.get(player)
			local root = getRoot(player)
			if profile and root then
				if root.Position.Y < Config.FallDeathY then
					local had = profile.carrying ~= nil
					BrainrotService.drop(player)
					BrainrotService.teleportHome(player)
					Net.notify(player, had and "Упал в воду! Существо вернулось на остров." or "Упал в воду!", "error")
				elseif profile.carrying and PlotService.isInside(player, root.Position) then
					deliver(player, profile)
				end
			end
		end
	end)
end

return BrainrotService
