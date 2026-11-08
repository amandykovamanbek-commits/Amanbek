-- CreatureFactory: собирает оригинальных существ из блоков.
-- Каждый вид описан списком деталей относительно тела (перед = -Z).

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local CreatureFactory = {}

local B, K, C = Enum.PartType.Ball, Enum.PartType.Block, Enum.PartType.Cylinder
local NEON = Enum.Material.Neon
local GLASS = Enum.Material.Glass
local UP = CFrame.Angles(0, 0, math.rad(90)) -- цилиндр вертикально
local FWD = CFrame.Angles(0, math.rad(90), 0) -- цилиндр вперёд

local function rgb(r, g, b)
	return Color3.fromRGB(r, g, b)
end

local WHITE = rgb(255, 255, 255)
local BLACK = rgb(20, 20, 25)

-- body = { shape, size, color, material?, transparency? }
-- eyes = { x, y, z, size, color? }
-- parts = { { shape, size, pos, color, material?, rot?, transparency? } }
local SPECS = {
	frog_slipper = {
		body = { B, Vector3.new(3, 2.4, 3.4), rgb(110, 200, 80) },
		eyes = { 0.8, 1.2, -0.9, 0.9 },
		parts = {
			{ K, Vector3.new(3.6, 0.8, 4.6), Vector3.new(0, -1.3, 0), rgb(255, 130, 170) },
			{ K, Vector3.new(3.6, 0.3, 1.2), Vector3.new(0, -0.8, -1.4), rgb(255, 255, 255) },
			{ B, Vector3.new(1, 0.6, 1.2), Vector3.new(1.4, -0.9, -1.2), rgb(90, 170, 60) },
			{ B, Vector3.new(1, 0.6, 1.2), Vector3.new(-1.4, -0.9, -1.2), rgb(90, 170, 60) },
		},
	},
	dumpling = {
		body = { B, Vector3.new(3.4, 2.4, 3.2), rgb(245, 225, 185) },
		eyes = { 0.6, 0.4, -1.45, 0.6 },
		parts = {
			{ K, Vector3.new(0.4, 0.8, 0.4), Vector3.new(0, 1.3, 0), rgb(235, 210, 165) },
			{ K, Vector3.new(0.4, 0.6, 0.4), Vector3.new(0.6, 1.2, 0.2), rgb(235, 210, 165) },
			{ K, Vector3.new(0.4, 0.6, 0.4), Vector3.new(-0.6, 1.2, 0.2), rgb(235, 210, 165) },
			{ B, Vector3.new(0.6, 0.4, 0.2), Vector3.new(1.1, -0.1, -1.4), rgb(255, 150, 160) },
			{ B, Vector3.new(0.6, 0.4, 0.2), Vector3.new(-1.1, -0.1, -1.4), rgb(255, 150, 160) },
		},
	},
	cactus_runner = {
		body = { K, Vector3.new(2, 3.6, 2), rgb(60, 170, 80) },
		eyes = { 0.45, 0.9, -1.0, 0.6 },
		parts = {
			{ K, Vector3.new(1.6, 0.7, 0.7), Vector3.new(1.6, 0.3, 0), rgb(60, 170, 80) },
			{ K, Vector3.new(0.7, 1.4, 0.7), Vector3.new(2.1, 1.0, 0), rgb(60, 170, 80) },
			{ K, Vector3.new(1.6, 0.7, 0.7), Vector3.new(-1.6, -0.2, 0), rgb(60, 170, 80) },
			{ K, Vector3.new(0.7, 1.4, 0.7), Vector3.new(-2.1, 0.5, 0), rgb(60, 170, 80) },
			{ B, Vector3.new(1.2, 0.8, 1.2), Vector3.new(0, 2.1, 0), rgb(255, 110, 180) },
			{ K, Vector3.new(0.6, 1.0, 0.8), Vector3.new(0.5, -2.2, -0.2), rgb(150, 100, 60) },
			{ K, Vector3.new(0.6, 1.0, 0.8), Vector3.new(-0.5, -2.2, 0.2), rgb(150, 100, 60) },
		},
	},
	mushroom_hedgehog = {
		body = { B, Vector3.new(3, 2.4, 3.6), rgb(150, 105, 70) },
		eyes = { 0.6, 0.3, -1.6, 0.55 },
		parts = {
			{ B, Vector3.new(4.2, 1.8, 4.2), Vector3.new(0, 1.2, 0.2), rgb(220, 50, 50) },
			{ B, Vector3.new(0.7, 0.4, 0.7), Vector3.new(0.9, 2.0, 0.4), WHITE },
			{ B, Vector3.new(0.6, 0.4, 0.6), Vector3.new(-1.0, 1.9, -0.3), WHITE },
			{ B, Vector3.new(0.5, 0.4, 0.5), Vector3.new(0.1, 2.1, 1.1), WHITE },
			{ B, Vector3.new(0.5, 0.4, 0.5), Vector3.new(0, 0, -1.9), BLACK },
		},
	},
	jelly_teapot = {
		body = { B, Vector3.new(3.4, 3, 3.4), rgb(90, 220, 220), GLASS, 0.3 },
		eyes = { 0.7, 0.4, -1.5, 0.6 },
		parts = {
			{ C, Vector3.new(2.2, 0.6, 0.6), Vector3.new(0, 0, -2.0), rgb(90, 220, 220), GLASS, FWD * CFrame.Angles(0, 0, math.rad(25)), 0.3 },
			{ K, Vector3.new(0.4, 1.6, 0.4), Vector3.new(0, 0.2, 1.9), rgb(70, 190, 200) },
			{ C, Vector3.new(0.4, 1.4, 1.4), Vector3.new(0, 1.6, 0), rgb(70, 190, 200), nil, UP },
			{ K, Vector3.new(0.3, 1.6, 0.3), Vector3.new(0.8, -1.9, 0.4), rgb(160, 255, 255), NEON },
			{ K, Vector3.new(0.3, 1.6, 0.3), Vector3.new(-0.8, -1.9, -0.4), rgb(160, 255, 255), NEON },
			{ K, Vector3.new(0.3, 1.6, 0.3), Vector3.new(0, -1.9, 0.9), rgb(160, 255, 255), NEON },
		},
	},
	banana_crab = {
		body = { K, Vector3.new(4.2, 1.6, 2.4), rgb(250, 220, 60) },
		eyes = { 0.7, 1.2, -0.8, 0.6 },
		parts = {
			{ K, Vector3.new(1.2, 0.8, 2.0), Vector3.new(2.4, 0.3, 0), rgb(240, 200, 40), nil, CFrame.Angles(0, 0, math.rad(30)) },
			{ K, Vector3.new(1.2, 0.8, 2.0), Vector3.new(-2.4, 0.3, 0), rgb(240, 200, 40), nil, CFrame.Angles(0, 0, math.rad(-30)) },
			{ B, Vector3.new(1.4, 1.2, 1.4), Vector3.new(2.4, 0.6, -1.8), rgb(230, 70, 50) },
			{ B, Vector3.new(1.4, 1.2, 1.4), Vector3.new(-2.4, 0.6, -1.8), rgb(230, 70, 50) },
			{ K, Vector3.new(0.3, 1, 0.3), Vector3.new(0.7, 0.9, -0.8), rgb(120, 90, 40) },
			{ K, Vector3.new(0.3, 1, 0.3), Vector3.new(-0.7, 0.9, -0.8), rgb(120, 90, 40) },
			{ K, Vector3.new(3.6, 0.4, 0.3), Vector3.new(0, -1.0, 0.6), rgb(120, 90, 40) },
			{ K, Vector3.new(3.6, 0.4, 0.3), Vector3.new(0, -1.0, -0.4), rgb(120, 90, 40) },
		},
	},
	fire_hamster = {
		body = { B, Vector3.new(3.6, 3.2, 3.6), rgb(240, 140, 50) },
		eyes = { 0.7, 0.4, -1.6, 0.6 },
		fire = true,
		parts = {
			{ B, Vector3.new(1, 1, 0.5), Vector3.new(1.1, 1.5, -0.2), rgb(240, 140, 50) },
			{ B, Vector3.new(1, 1, 0.5), Vector3.new(-1.1, 1.5, -0.2), rgb(240, 140, 50) },
			{ B, Vector3.new(2, 1.6, 0.6), Vector3.new(0, -0.4, -1.5), rgb(255, 225, 190) },
			{ B, Vector3.new(1.4, 1.4, 1.4), Vector3.new(0, 1.9, 0.4), rgb(255, 80, 20), NEON },
			{ B, Vector3.new(0.8, 1.2, 0.8), Vector3.new(0, 2.6, 0.5), rgb(255, 200, 40), NEON },
		},
	},
	cloud_sheep = {
		body = { B, Vector3.new(3.6, 3, 4), WHITE },
		eyes = { 0.45, 0.6, -2.55, 0.5 },
		parts = {
			{ B, Vector3.new(2, 2, 2), Vector3.new(1.2, 1.2, 0.6), WHITE },
			{ B, Vector3.new(2, 2, 2), Vector3.new(-1.2, 1.2, -0.4), WHITE },
			{ B, Vector3.new(2, 2, 2), Vector3.new(0, 1.4, 1.4), WHITE },
			{ B, Vector3.new(1.8, 1.8, 1.4), Vector3.new(0, 0.4, -2.1), rgb(60, 60, 75) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(1, -1.6, -1), rgb(60, 60, 75) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(-1, -1.6, -1), rgb(60, 60, 75) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(1, -1.6, 1), rgb(60, 60, 75) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(-1, -1.6, 1), rgb(60, 60, 75) },
		},
	},
	owl_king = {
		body = { B, Vector3.new(3.4, 4, 3.2), rgb(130, 90, 60) },
		eyes = { 0.75, 0.7, -1.35, 1.0, rgb(255, 210, 40) },
		parts = {
			{ B, Vector3.new(2.4, 2.6, 0.6), Vector3.new(0, -0.6, -1.3), rgb(240, 225, 200) },
			{ K, Vector3.new(0.5, 0.6, 0.5), Vector3.new(0, 0.1, -1.7), rgb(255, 170, 40) },
			{ C, Vector3.new(0.8, 2.2, 2.2), Vector3.new(0, 2.3, 0), rgb(255, 200, 40), Enum.Material.Metal, UP },
			{ K, Vector3.new(0.4, 0.8, 0.4), Vector3.new(0.8, 2.9, 0), rgb(255, 200, 40), Enum.Material.Metal },
			{ K, Vector3.new(0.4, 0.8, 0.4), Vector3.new(-0.8, 2.9, 0), rgb(255, 200, 40), Enum.Material.Metal },
			{ K, Vector3.new(0.4, 0.8, 0.4), Vector3.new(0, 2.9, -0.8), rgb(255, 200, 40), Enum.Material.Metal },
			{ B, Vector3.new(0.4, 0.4, 0.4), Vector3.new(0, 2.4, -1.1), rgb(255, 40, 80), NEON },
			{ K, Vector3.new(0.6, 2.6, 2.2), Vector3.new(1.8, -0.2, 0.2), rgb(110, 75, 50) },
			{ K, Vector3.new(0.6, 2.6, 2.2), Vector3.new(-1.8, -0.2, 0.2), rgb(110, 75, 50) },
		},
	},
	rocket_penguin = {
		body = { B, Vector3.new(3, 4.2, 3), rgb(35, 35, 45) },
		eyes = { 0.6, 1.0, -1.3, 0.55 },
		parts = {
			{ B, Vector3.new(2.2, 3.2, 0.6), Vector3.new(0, -0.3, -1.25), WHITE },
			{ K, Vector3.new(0.6, 0.4, 0.8), Vector3.new(0, 0.6, -1.7), rgb(255, 150, 30) },
			{ C, Vector3.new(3, 1.4, 1.4), Vector3.new(0, 0, 1.9), rgb(180, 180, 195), Enum.Material.Metal, UP },
			{ B, Vector3.new(1.2, 1.4, 1.2), Vector3.new(0, -1.9, 1.9), rgb(255, 120, 30), NEON },
			{ K, Vector3.new(0.4, 1.8, 1.2), Vector3.new(1.7, 0, 0), rgb(35, 35, 45), nil, CFrame.Angles(0, 0, math.rad(-20)) },
			{ K, Vector3.new(0.4, 1.8, 1.2), Vector3.new(-1.7, 0, 0), rgb(35, 35, 45), nil, CFrame.Angles(0, 0, math.rad(20)) },
		},
	},
	crystal_whale = {
		body = { B, Vector3.new(3.4, 2.8, 6), rgb(70, 120, 230) },
		eyes = { 1.3, 0.3, -2.0, 0.5 },
		parts = {
			{ B, Vector3.new(2.8, 1.4, 4.6), Vector3.new(0, -0.8, -0.2), rgb(200, 220, 255) },
			{ K, Vector3.new(3.4, 0.4, 1.4), Vector3.new(0, 0.2, 3.4), rgb(70, 120, 230) },
			{ K, Vector3.new(0.6, 1.6, 0.6), Vector3.new(0, 1.8, -0.6), rgb(140, 255, 255), NEON, CFrame.Angles(0, math.rad(45), math.rad(10)) },
			{ K, Vector3.new(0.5, 1.2, 0.5), Vector3.new(0.6, 1.6, 0.4), rgb(140, 255, 255), NEON, CFrame.Angles(0, math.rad(45), math.rad(-15)) },
			{ K, Vector3.new(0.5, 1.2, 0.5), Vector3.new(-0.6, 1.6, 0.9), rgb(140, 255, 255), NEON, CFrame.Angles(0, math.rad(45), math.rad(15)) },
		},
	},
	shadow_fox = {
		body = { K, Vector3.new(2.4, 2.2, 4), rgb(55, 35, 80) },
		eyes = { 0.55, 0.5, -2.05, 0.5, rgb(200, 90, 255) },
		glowEyes = true,
		parts = {
			{ K, Vector3.new(0.7, 1.2, 0.4), Vector3.new(0.7, 1.6, -1.4), rgb(55, 35, 80) },
			{ K, Vector3.new(0.7, 1.2, 0.4), Vector3.new(-0.7, 1.6, -1.4), rgb(55, 35, 80) },
			{ K, Vector3.new(1.0, 0.8, 0.8), Vector3.new(0, -0.2, -2.3), rgb(40, 25, 60) },
			{ B, Vector3.new(1.6, 1.6, 3.2), Vector3.new(0, 1.0, 3.2), rgb(55, 35, 80), nil, CFrame.Angles(math.rad(-30), 0, 0) },
			{ B, Vector3.new(1, 1, 1.2), Vector3.new(0, 1.9, 4.6), rgb(190, 90, 255), NEON },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(0.8, -1.6, -1.4), rgb(40, 25, 60) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(-0.8, -1.6, -1.4), rgb(40, 25, 60) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(0.8, -1.6, 1.4), rgb(40, 25, 60) },
			{ K, Vector3.new(0.6, 1.2, 0.6), Vector3.new(-0.8, -1.6, 1.4), rgb(40, 25, 60) },
		},
	},
	sun_dragon = {
		body = { B, Vector3.new(3.4, 3.2, 4.4), rgb(255, 200, 60), NEON },
		eyes = { 0.7, 0.8, -1.9, 0.6 },
		divine = true,
		parts = {
			{ B, Vector3.new(2.2, 2, 2.2), Vector3.new(0, 1.4, -2.2), rgb(255, 210, 80), NEON },
			{ K, Vector3.new(0.4, 1.4, 0.4), Vector3.new(0.6, 2.8, -2.0), WHITE, nil, CFrame.Angles(math.rad(-25), 0, 0) },
			{ K, Vector3.new(0.4, 1.4, 0.4), Vector3.new(-0.6, 2.8, -2.0), WHITE, nil, CFrame.Angles(math.rad(-25), 0, 0) },
			{ K, Vector3.new(4, 0.3, 2.4), Vector3.new(3.0, 1.4, 0.4), rgb(255, 150, 40), NEON, CFrame.Angles(0, 0, math.rad(25)) },
			{ K, Vector3.new(4, 0.3, 2.4), Vector3.new(-3.0, 1.4, 0.4), rgb(255, 150, 40), NEON, CFrame.Angles(0, 0, math.rad(-25)) },
			{ B, Vector3.new(1.2, 1.2, 3.4), Vector3.new(0, -0.2, 3.2), rgb(255, 190, 50), NEON, CFrame.Angles(math.rad(20), 0, 0) },
			{ C, Vector3.new(0.3, 3.6, 3.6), Vector3.new(0, 3.6, -2.2), rgb(255, 255, 160), NEON, UP },
		},
	},
}

local function makePart(model, shape, size, cf, color, material, transparency)
	local p = Instance.new("Part")
	p.Shape = shape
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.Transparency = transparency or 0
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = true
	p.CanTouch = false
	p.Massless = true
	p.Parent = model
	return p
end

local function weld(a, b)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = b
end

function CreatureFactory.scaleFor(id)
	local def = Config.Creatures[id]
	if def.rarity >= 7 then
		return 1.9
	end
	return 1 + (def.rarity - 1) * 0.15
end

-- Создаёт модель существа в позиции cframe (низ модели на уровне cframe).
function CreatureFactory.build(id, cframe)
	local spec = SPECS[id]
	local def = Config.Creatures[id]
	local rarity = Config.Rarities[def.rarity]
	local s = CreatureFactory.scaleFor(id)

	local model = Instance.new("Model")
	model.Name = def.name
	model:SetAttribute("CreatureId", id)

	local bodyDef = spec.body
	local bodySize = bodyDef[2] * s
	local origin = cframe * CFrame.new(0, bodySize.Y / 2 + 0.9 * s, 0)
	local body = makePart(model, bodyDef[1], bodySize, origin, bodyDef[3], bodyDef[4], bodyDef[5])
	body.Name = "Body"
	model.PrimaryPart = body

	local e = spec.eyes
	if e then
		local eyeColor = e[5] or WHITE
		for _, side in ipairs({ -1, 1 }) do
			local eyePos = Vector3.new(e[1] * side, e[2], e[3]) * s
			local eye = makePart(model, B, Vector3.new(e[4], e[4], e[4]) * s, origin * CFrame.new(eyePos), eyeColor, spec.glowEyes and NEON or nil)
			weld(body, eye)
			local pupil = makePart(
				model,
				B,
				Vector3.new(e[4], e[4], e[4]) * 0.5 * s,
				origin * CFrame.new(eyePos + Vector3.new(0, 0, -e[4] * 0.38 * s)),
				BLACK
			)
			weld(body, pupil)
		end
	end

	for _, pd in ipairs(spec.parts) do
		local rot = pd[6] or CFrame.new()
		local p = makePart(model, pd[1], pd[2] * s, origin * CFrame.new(pd[3] * s) * rot, pd[4], pd[5], pd[7])
		weld(body, p)
	end

	if spec.fire then
		local fire = Instance.new("Fire")
		fire.Size = 3 * s
		fire.Heat = 4
		fire.Parent = body
	end
	if spec.divine or def.rarity >= 6 then
		local light = Instance.new("PointLight")
		light.Color = rarity.color
		light.Range = 16
		light.Brightness = 2
		light.Parent = body
	end
	if def.rarity >= 5 then
		local sparkles = Instance.new("ParticleEmitter")
		sparkles.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		sparkles.Color = ColorSequence.new(rarity.color)
		sparkles.Rate = spec.divine and 25 or 8
		sparkles.Lifetime = NumberRange.new(1, 2)
		sparkles.Speed = NumberRange.new(1, 3)
		sparkles.SpreadAngle = Vector2.new(180, 180)
		sparkles.Size = NumberSequence.new(0.4)
		sparkles.LightEmission = 1
		sparkles.Parent = body
	end

	-- табличка: имя, редкость, доход
	local gui = Instance.new("BillboardGui")
	gui.Name = "Info"
	gui.Size = UDim2.fromOffset(170, 54)
	gui.StudsOffset = Vector3.new(0, bodySize.Y / 2 + 2.5, 0)
	gui.MaxDistance = 120
	gui.LightInfluence = 0
	gui.Adornee = body
	local function line(text, color, y, h)
		local l = Instance.new("TextLabel")
		l.BackgroundTransparency = 1
		l.Size = UDim2.new(1, 0, h, 0)
		l.Position = UDim2.new(0, 0, y, 0)
		l.Font = Enum.Font.FredokaOne
		l.TextScaled = true
		l.TextColor3 = color
		l.TextStrokeTransparency = 0.2
		l.Text = text
		l.Parent = gui
	end
	line(def.name, WHITE, 0, 0.4)
	line(rarity.name, rarity.color, 0.4, 0.3)
	line(Config.formatMoney(def.income) .. "/сек", rgb(120, 255, 120), 0.7, 0.3)
	gui.Parent = body

	return model
end

-- Переключает модель: закреплена на месте или свободна (для переноски).
function CreatureFactory.setAnchored(model, anchored)
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.Anchored = anchored
		end
	end
end

return CreatureFactory
