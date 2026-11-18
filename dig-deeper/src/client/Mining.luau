-- Копание: зажми левую кнопку мыши / палец на блоке, или кнопку «Копать» на телефоне.
-- Показывает рамку вокруг блока и полоску прочности, проигрывает удар киркой.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)
local Sound = require(script.Parent.Sound)
local Effects = require(script.Parent.Effects)
local HUD = require(script.Parent.HUD)

local Mining = {}

local player = Players.LocalPlayer
local mouse = player:GetMouse()
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local holding = false
local digHeld = false
local lastSwing = 0
local lastWeakToast = 0
local blocked = false -- во время катсцен и открытых окон

local selection, hpGui, hpName, hpBar, hpFill, hpHint

local function blocksFolder()
	local mine = workspace:FindFirstChild("Mine")
	return mine and mine:FindFirstChild("Blocks")
end

local function isBlock(part)
	local folder = blocksFolder()
	return part ~= nil and folder ~= nil and part.Parent == folder
end

local function rootPart()
	local char = player.Character
	return char and char:FindFirstChild("HumanoidRootPart")
end

local function ensureTool()
	local char = player.Character
	local humanoid = char and char:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return nil
	end
	local tool = char:FindFirstChild("Pickaxe")
	if tool then
		return tool
	end
	local backpack = player:FindFirstChild("Backpack")
	tool = backpack and backpack:FindFirstChild("Pickaxe")
	if tool then
		humanoid:EquipTool(tool)
	end
	return tool
end

local function canMine(block)
	local st = State.data
	if not st then
		return false, nil
	end
	local layer = Config.LayerForDepth(block:GetAttribute("D") or 0)
	return Config.Pickaxes[st.Pickaxe].Power >= layer.MinPower, layer
end

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Include
local overlapParams = OverlapParams.new()
overlapParams.FilterType = Enum.RaycastFilterType.Include

-- Ближайший блок для кнопки «Копать» и авто-копания: сначала под ногами
local function nearestBlock(root)
	local folder = blocksFolder()
	if not folder then
		return nil
	end
	rayParams.FilterDescendantsInstances = { folder }
	local hit = workspace:Raycast(root.Position, Vector3.new(0, -9, 0), rayParams)
	if hit and isBlock(hit.Instance) and canMine(hit.Instance) then
		return hit.Instance
	end
	overlapParams.FilterDescendantsInstances = { folder }
	local best, bestScore = nil, math.huge
	for _, part in ipairs(workspace:GetPartBoundsInRadius(root.Position, Config.Reach * 0.55, overlapParams)) do
		if isBlock(part) and canMine(part) then
			local d = (part.Position - root.Position).Magnitude
			if part.Position.Y > root.Position.Y + 1 then
				d = d + 8 -- над головой — в последнюю очередь
			end
			if d < bestScore then
				best, bestScore = part, d
			end
		end
	end
	return best
end

local function swing(block)
	local st = State.data
	if not st then
		return
	end
	local now = os.clock()
	if now - lastSwing < st.Cooldown then
		return
	end
	local ok, layer = canMine(block)
	if not ok then
		if now - lastWeakToast > 2 then
			lastWeakToast = now
			local need = Config.Pickaxes[Config.PickaxeForPower(layer.MinPower)]
			HUD.toast(State.t("NeedPickaxe", State.name(need.Name)), UIKit.C.Red)
			Sound.play("Error", 0.4, 0.7)
		end
		lastSwing = now
		return
	end
	lastSwing = now
	local tool = ensureTool()
	if tool then
		-- стандартная анимация удара инструментом
		local anim = Instance.new("StringValue")
		anim.Name = "toolanim"
		anim.Value = "Slash"
		anim.Parent = tool
		Debris:AddItem(anim, 0.3)
	end
	Remotes.Mine:FireServer(block)
	Effects.hit(block)
	Sound.play("Swing", 0.28, 0.95 + math.random() * 0.15)
	Sound.play("Hit", 0.35, 0.8 + math.random() * 0.3)
end

local function buildIndicator()
	local playerGui = player:WaitForChild("PlayerGui")
	selection = Instance.new("SelectionBox")
	selection.Name = "BlockSelection"
	selection.LineThickness = 0.08
	selection.Color3 = Color3.fromRGB(255, 220, 80)
	selection.SurfaceColor3 = Color3.fromRGB(255, 220, 80)
	selection.SurfaceTransparency = 0.88
	selection.Parent = playerGui

	hpGui = Instance.new("BillboardGui")
	hpGui.Name = "BlockHp"
	hpGui.Size = UDim2.fromOffset(200, 64)
	hpGui.StudsOffset = Vector3.new(0, Config.BlockSize / 2 + 1.6, 0)
	hpGui.AlwaysOnTop = true
	hpGui.LightInfluence = 0
	hpGui.Enabled = false
	hpGui.Parent = playerGui
	local panel = UIKit.frame({ Color = UIKit.Panel, Transparency = 0.1, Size = UDim2.new(1, 0, 0, 44), Corner = 10, Stroke = 2, Parent = hpGui })
	hpName = UIKit.text({ Text = "", Size = UDim2.new(1, -12, 0, 20), Position = UDim2.new(0.5, 0, 0, 3), AnchorPoint = Vector2.new(0.5, 0), MaxSize = 16, Stroke = 2, Parent = panel })
	hpBar, hpFill = UIKit.bar({ Size = UDim2.new(1, -16, 0, 12), Position = UDim2.new(0.5, 0, 0, 26), AnchorPoint = Vector2.new(0.5, 0), Stroke = 2, Corner = 6, Parent = panel })
	hpHint = UIKit.text({ Text = "", Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0.5, 0, 0, 46), AnchorPoint = Vector2.new(0.5, 0), Color = UIKit.RedText, MaxSize = 15, Stroke = 2, Parent = hpGui })
end

local function showIndicator(block)
	if not block then
		selection.Adornee = nil
		hpGui.Enabled = false
		hpGui.Adornee = nil
		return
	end
	selection.Adornee = block
	hpGui.Adornee = block
	hpGui.Enabled = true
	local ok, layer = canMine(block)
	local name
	if block:GetAttribute("Rare") then
		local ore = Config.Ores[block:GetAttribute("Ore")]
		name = ore and (ore.Emoji .. " " .. State.name(ore.Name)) or State.name(layer.Name)
	else
		name = State.name(layer.Name)
	end
	hpName.Text = name
	local hp = block:GetAttribute("Hp") or 1
	local maxHp = block:GetAttribute("MaxHp") or 1
	hpFill.Size = UDim2.fromScale(math.clamp(hp / maxHp, 0.04, 1), 1)
	local grad = hpFill:FindFirstChildOfClass("UIGradient")
	if grad then
		local pair = ok and UIKit.C.Green or UIKit.C.Red
		grad.Color = ColorSequence.new(pair[1], pair[2])
	end
	if ok then
		hpHint.Text = ""
		selection.Color3 = Color3.fromRGB(255, 220, 80)
	else
		local need = Config.Pickaxes[Config.PickaxeForPower(layer.MinPower)]
		hpHint.Text = State.t("NeedPick", State.name(need.Name))
		selection.Color3 = Color3.fromRGB(255, 80, 70)
	end
end

function Mining.setBlocked(on)
	blocked = on
	if on then
		holding = false
		digHeld = false
	end
end

function Mining.setDigHeld(on)
	digHeld = on
end

function Mining.init()
	buildIndicator()

	UserInputService.InputBegan:Connect(function(input, processed)
		if processed then
			return
		end
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			holding = true
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			holding = false
		end
	end)

	RunService.Heartbeat:Connect(function()
		local root = rootPart()
		if blocked or not root or not State.data then
			showIndicator(nil)
			return
		end
		local reach = Config.Reach
		local target = nil
		local hover = nil
		local mt = mouse.Target
		if isBlock(mt) and (mt.Position - root.Position).Magnitude <= reach then
			hover = mt
			if holding then
				target = mt
			end
		end
		if not target and (digHeld or State.data.AutoMine) then
			target = nearestBlock(root)
		end
		if not UserInputService.MouseEnabled and not target then
			hover = nil
		end
		showIndicator(target or hover)
		if target then
			swing(target)
		end
	end)

	-- если кирку случайно убрали из рук — вернуть
	task.spawn(function()
		while true do
			task.wait(1)
			if not blocked and State.data then
				ensureTool()
			end
		end
	end)
end

return Mining
