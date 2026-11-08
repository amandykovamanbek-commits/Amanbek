-- CharacterVisuals: крылья на спине и табличка с именем (золотая для доната).

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)

local CharacterVisuals = {}

local function wingPart(parent, size, color, material)
	local p = Instance.new("Part")
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
	p.Parent = parent
	return p
end

function CharacterVisuals.applyWings(player)
	local char = player.Character
	local profile = DataService.get(player)
	if not char or not profile then
		return
	end
	local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
	if not torso then
		return
	end
	local old = char:FindFirstChild("Wings")
	if old then
		old:Destroy()
	end

	local index = profile.data.wing
	local def = Config.Wings[index] or Config.Wings[1]
	local s = 1 + (index - 1) * 0.12
	local material = index >= 4 and Enum.Material.Neon or Enum.Material.SmoothPlastic
	local vip = DataService.hasPass(player, "VIP")

	local model = Instance.new("Model")
	model.Name = "Wings"
	for _, side in ipairs({ -1, 1 }) do
		local inner = wingPart(model, Vector3.new(3.2, 1.8, 0.2) * s, def.color, material)
		inner.Name = side < 0 and "LeftWing" or "RightWing"
		inner.Transparency = index == 2 and 0.3 or 0
		local weld = Instance.new("Weld")
		weld.Name = side < 0 and "LeftWingWeld" or "RightWingWeld"
		weld.Part0 = torso
		weld.Part1 = inner
		weld.C0 = CFrame.new(side * 0.3, 0.4, 0.65) * CFrame.Angles(0, side * math.rad(-15), side * math.rad(20))
		weld.C1 = CFrame.new(-side * 1.6 * s, 0, 0)
		weld.Parent = inner

		local outer = wingPart(model, Vector3.new(2.2, 1.2, 0.2) * s, def.color:Lerp(Color3.new(1, 1, 1), 0.3), material)
		outer.CFrame = inner.CFrame * CFrame.new(side * 2.4 * s, -0.3 * s, 0) * CFrame.Angles(0, 0, side * math.rad(-15))
		local w2 = Instance.new("Weld")
		w2.Part0 = inner
		w2.Part1 = outer
		w2.C0 = CFrame.new(side * 2.4 * s, -0.3 * s, 0) * CFrame.Angles(0, 0, side * math.rad(-15))
		w2.Parent = outer

		if vip then
			local sparkles = Instance.new("Sparkles")
			sparkles.SparkleColor = Color3.fromRGB(255, 220, 80)
			sparkles.Parent = outer
		end
	end
	model.Parent = char
end

function CharacterVisuals.applyNameTag(player)
	local char = player.Character
	if not char then
		return
	end
	local head = char:FindFirstChild("Head")
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not head or not hum then
		return
	end
	local old = head:FindFirstChild("NameTag")
	if old then
		old:Destroy()
	end
	local gold = DataService.hasPass(player, "GoldName") or DataService.hasPass(player, "VIP")
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None

	local gui = Instance.new("BillboardGui")
	gui.Name = "NameTag"
	gui.Size = UDim2.fromOffset(200, 40)
	gui.StudsOffset = Vector3.new(0, 2.6, 0)
	gui.MaxDistance = 150
	gui.Adornee = head
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.TextStrokeTransparency = 0.3
	label.Text = (DataService.hasPass(player, "VIP") and "[VIP] " or "") .. player.DisplayName
	label.TextColor3 = gold and Color3.fromRGB(255, 205, 50) or Color3.new(1, 1, 1)
	label.Parent = gui
	gui.Parent = head
end

function CharacterVisuals.apply(player)
	CharacterVisuals.applyWings(player)
	CharacterVisuals.applyNameTag(player)
end

return CharacterVisuals
