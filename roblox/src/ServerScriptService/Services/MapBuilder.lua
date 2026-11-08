-- MapBuilder: строит всю карту из блоков при старте сервера.
-- Яркая стартовая зона с фонтаном, 4 базы с подиумами, торговые палатки,
-- 7 тематических островов, облака, вода и освещение.

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local MapBuilder = {
	plots = {},
	stations = {},
	islands = {},
}

local GY = Config.GroundY
local PLATFORM_HALF = 150
local PLOT_HALF = 32
local PLOT_DIST = 88
local rng = Random.new(7)

local PLOT_COLORS = {
	Color3.fromRGB(255, 85, 110),
	Color3.fromRGB(70, 160, 255),
	Color3.fromRGB(80, 220, 120),
	Color3.fromRGB(255, 190, 40),
}

local function rgb(r, g, b)
	return Color3.fromRGB(r, g, b)
end

---------------------------------------------------------------------
-- помощники
---------------------------------------------------------------------
local function part(props)
	local p = Instance.new(props.Class or "Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for k, v in pairs(props) do
		if k ~= "Parent" and k ~= "Class" then
			p[k] = v
		end
	end
	p.Parent = props.Parent
	return p
end

local function block(parent, size, cf, color, material, extra)
	local props = { Parent = parent, Size = size, CFrame = cf, Color = color, Material = material or Enum.Material.SmoothPlastic }
	if extra then
		for k, v in pairs(extra) do
			props[k] = v
		end
	end
	return part(props)
end

local function ball(parent, size, pos, color, material, extra)
	local props = { Parent = parent, Shape = Enum.PartType.Ball, Size = size, CFrame = CFrame.new(pos), Color = color, Material = material or Enum.Material.SmoothPlastic }
	if extra then
		for k, v in pairs(extra) do
			props[k] = v
		end
	end
	return part(props)
end

-- вертикальный цилиндр: center — центр, height — высота
local function cyl(parent, center, radius, height, color, material, extra)
	local props = {
		Parent = parent,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(height, radius * 2, radius * 2),
		CFrame = CFrame.new(center) * CFrame.Angles(0, 0, math.rad(90)),
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
	}
	if extra then
		for k, v in pairs(extra) do
			props[k] = v
		end
	end
	return part(props)
end

local function deco(props)
	props.CanCollide = false
	props.CanQuery = false
	props.CanTouch = false
	return props
end

local function billboard(adornee, text, color, offsetY, sizeX, sizeY, alwaysOnTop, maxDistance)
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(sizeX or 220, sizeY or 60)
	gui.StudsOffset = Vector3.new(0, offsetY or 4, 0)
	gui.AlwaysOnTop = alwaysOnTop == true
	gui.MaxDistance = maxDistance or (alwaysOnTop and 6000 or 220)
	gui.LightInfluence = 0
	gui.Adornee = adornee
	local label = Instance.new("TextLabel")
	label.Name = "Label"
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.TextColor3 = color or Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0
	label.Text = text
	label.Parent = gui
	gui.Parent = adornee
	return gui
end

local function prompt(parentPart, actionText, objectText, name)
	local pp = Instance.new("ProximityPrompt")
	pp.Name = name or "Prompt"
	pp.ActionText = actionText
	pp.ObjectText = objectText or ""
	pp.HoldDuration = 0
	pp.MaxActivationDistance = 14
	pp.RequiresLineOfSight = false
	pp.KeyboardKeyCode = Enum.KeyCode.E
	pp.Parent = parentPart
	return pp
end

local function light(parentPart, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range or 14
	l.Brightness = brightness or 1.5
	l.Parent = parentPart
	return l
end

---------------------------------------------------------------------
-- растительность и предметы
---------------------------------------------------------------------
local FLOWER_COLORS = { rgb(255, 80, 120), rgb(255, 220, 60), rgb(160, 110, 255), rgb(255, 140, 40), rgb(90, 200, 255), rgb(255, 255, 255) }

local function roundTree(parent, pos, scale, leafColor)
	scale = scale or 1
	leafColor = leafColor or rgb(80, 200, 80)
	block(parent, Vector3.new(1.8, 9, 1.8) * scale, CFrame.new(pos + Vector3.new(0, 4.5 * scale, 0)), rgb(140, 90, 55), Enum.Material.Wood)
	ball(parent, Vector3.new(9, 8, 9) * scale, pos + Vector3.new(0, 10.5 * scale, 0), leafColor, Enum.Material.Grass)
	ball(parent, Vector3.new(6, 6, 6) * scale, pos + Vector3.new(2.5, 12.5, 1) * scale, leafColor:Lerp(Color3.new(1, 1, 1), 0.15), Enum.Material.Grass)
	ball(parent, Vector3.new(5, 5, 5) * scale, pos + Vector3.new(-2.2, 12, -1.5) * scale, leafColor:Lerp(Color3.new(0, 0, 0), 0.1), Enum.Material.Grass)
	-- яблочки
	for i = 1, 3 do
		local a = i * 2.1
		ball(parent, Vector3.new(0.9, 0.9, 0.9) * scale, pos + Vector3.new(math.cos(a) * 4.2, 9.5 + i * 0.6, math.sin(a) * 4.2) * scale, rgb(255, 60, 60), nil, deco({}))
	end
end

local function palm(parent, pos, scale)
	scale = scale or 1
	local top = pos
	for i = 0, 5 do
		local seg = pos + Vector3.new(i * 0.5, i * 2.2 + 1, 0) * scale
		block(parent, Vector3.new(1.6, 2.4, 1.6) * scale, CFrame.new(seg) * CFrame.Angles(0, 0, math.rad(-12)), i % 2 == 0 and rgb(170, 120, 70) or rgb(150, 100, 60), Enum.Material.Wood)
		top = seg
	end
	for i = 1, 6 do
		local a = i / 6 * math.pi * 2
		local dir = Vector3.new(math.cos(a), 0, math.sin(a))
		local leafPos = top + dir * 3.2 * scale + Vector3.new(0, 0.4, 0) * scale
		block(parent, Vector3.new(1.6, 0.3, 6.5) * scale, CFrame.lookAt(leafPos, leafPos + dir) * CFrame.Angles(math.rad(-18), 0, 0), rgb(60, 190, 70), Enum.Material.Grass, deco({}))
	end
	for i = 1, 3 do
		ball(parent, Vector3.new(1.1, 1.1, 1.1) * scale, top + Vector3.new(math.cos(i * 2) * 0.8, -1, math.sin(i * 2) * 0.8) * scale, rgb(120, 80, 40), nil, deco({}))
	end
end

local function pine(parent, pos, scale, color, snow)
	scale = scale or 1
	color = color or rgb(40, 140, 80)
	block(parent, Vector3.new(1.4, 4, 1.4) * scale, CFrame.new(pos + Vector3.new(0, 2, 0) * scale), rgb(110, 75, 50), Enum.Material.Wood)
	for i = 0, 3 do
		local size = (7 - i * 1.5) * scale
		local y = (4 + i * 2.6) * scale
		block(parent, Vector3.new(size, 2.4 * scale, size), CFrame.new(pos + Vector3.new(0, y, 0)) * CFrame.Angles(0, math.rad(45 * i), 0), color, Enum.Material.Grass)
		if snow then
			block(parent, Vector3.new(size * 0.8, 0.5 * scale, size * 0.8), CFrame.new(pos + Vector3.new(0, y + 1.3 * scale, 0)) * CFrame.Angles(0, math.rad(45 * i), 0), rgb(250, 252, 255), Enum.Material.Snow, deco({}))
		end
	end
end

local function lollipopTree(parent, pos, scale, color)
	scale = scale or 1
	cyl(parent, pos + Vector3.new(0, 5 * scale, 0), 0.6 * scale, 10 * scale, rgb(255, 255, 255))
	local center = pos + Vector3.new(0, 11 * scale, 0)
	part({ Parent = parent, Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.4, 8, 8) * scale, CFrame = CFrame.new(center), Color = color })
	part(deco({ Parent = parent, Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.6, 5.5, 5.5) * scale, CFrame = CFrame.new(center), Color = rgb(255, 255, 255) }))
	part(deco({ Parent = parent, Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.8, 3, 3) * scale, CFrame = CFrame.new(center), Color = color }))
end

local function candyCane(parent, pos, scale)
	scale = scale or 1
	for i = 0, 5 do
		block(parent, Vector3.new(1.2, 1.2, 1.2) * scale, CFrame.new(pos + Vector3.new(0, 0.6 + i * 1.2, 0) * scale), i % 2 == 0 and rgb(255, 60, 80) or rgb(255, 255, 255))
	end
	block(parent, Vector3.new(1.2, 1.2, 1.2) * scale, CFrame.new(pos + Vector3.new(1.2, 7.8, 0) * scale), rgb(255, 255, 255))
	block(parent, Vector3.new(1.2, 1.2, 1.2) * scale, CFrame.new(pos + Vector3.new(2.4, 7.2, 0) * scale), rgb(255, 60, 80))
end

local function flower(parent, pos, color)
	block(parent, Vector3.new(0.25, 1.4, 0.25), CFrame.new(pos + Vector3.new(0, 0.7, 0)), rgb(60, 160, 60), nil, deco({}))
	for i = 1, 4 do
		local a = i / 4 * math.pi * 2
		ball(parent, Vector3.new(0.7, 0.4, 0.7), pos + Vector3.new(math.cos(a) * 0.4, 1.5, math.sin(a) * 0.4), color, nil, deco({}))
	end
	ball(parent, Vector3.new(0.5, 0.5, 0.5), pos + Vector3.new(0, 1.6, 0), rgb(255, 230, 80), nil, deco({}))
end

local function bush(parent, pos, color, scale)
	scale = scale or 1
	ball(parent, Vector3.new(4, 3, 4) * scale, pos + Vector3.new(0, 1, 0) * scale, color, Enum.Material.Grass)
	ball(parent, Vector3.new(3, 2.5, 3) * scale, pos + Vector3.new(1.6, 1.2, 0.6) * scale, color:Lerp(Color3.new(1, 1, 1), 0.12), Enum.Material.Grass)
	for i = 1, 3 do
		ball(parent, Vector3.new(0.6, 0.6, 0.6) * scale, pos + Vector3.new(math.cos(i * 2) * 1.8, 2, math.sin(i * 2) * 1.8) * scale, FLOWER_COLORS[(i % #FLOWER_COLORS) + 1], nil, deco({}))
	end
end

local function rock(parent, pos, color, scale)
	scale = scale or 1
	block(parent, Vector3.new(4, 3, 3.4) * scale, CFrame.new(pos + Vector3.new(0, 1.2, 0) * scale) * CFrame.Angles(math.rad(10), math.rad(rng:NextInteger(0, 90)), math.rad(8)), color, Enum.Material.Slate)
	block(parent, Vector3.new(2.4, 2, 2.2) * scale, CFrame.new(pos + Vector3.new(1.8, 0.8, 1) * scale) * CFrame.Angles(0, math.rad(30), math.rad(-12)), color:Lerp(Color3.new(1, 1, 1), 0.1), Enum.Material.Slate)
end

local function mushroom(parent, pos, capColor, glow, scale)
	scale = scale or 1
	cyl(parent, pos + Vector3.new(0, 1.2, 0) * scale, 0.5 * scale, 2.4 * scale, rgb(250, 240, 220), nil, deco({}))
	local cap = ball(parent, Vector3.new(3, 1.6, 3) * scale, pos + Vector3.new(0, 2.6, 0) * scale, capColor, glow and Enum.Material.Neon or nil, deco({}))
	for i = 1, 3 do
		ball(parent, Vector3.new(0.5, 0.3, 0.5) * scale, pos + Vector3.new(math.cos(i * 2.1) * 0.9, 3.25, math.sin(i * 2.1) * 0.9) * scale, rgb(255, 255, 255), nil, deco({}))
	end
	if glow then
		light(cap, capColor, 10, 1)
	end
end

local function crystal(parent, pos, color, scale)
	scale = scale or 1
	local main = block(parent, Vector3.new(2, 8, 2) * scale, CFrame.new(pos + Vector3.new(0, 3.5, 0) * scale) * CFrame.Angles(math.rad(8), math.rad(45), math.rad(6)), color, Enum.Material.Neon, { Transparency = 0.15 })
	block(parent, Vector3.new(1.4, 5, 1.4) * scale, CFrame.new(pos + Vector3.new(1.4, 2.2, 0.6) * scale) * CFrame.Angles(math.rad(-10), math.rad(20), math.rad(-25)), color, Enum.Material.Neon, { Transparency = 0.15 })
	block(parent, Vector3.new(1.2, 4, 1.2) * scale, CFrame.new(pos + Vector3.new(-1.2, 1.8, -0.5) * scale) * CFrame.Angles(math.rad(12), math.rad(60), math.rad(22)), color, Enum.Material.Neon, { Transparency = 0.15 })
	light(main, color, 16, 1.5)
end

local function lamp(parent, pos, color)
	block(parent, Vector3.new(0.6, 8, 0.6), CFrame.new(pos + Vector3.new(0, 4, 0)), rgb(60, 60, 70), Enum.Material.Metal)
	local bulb = ball(parent, Vector3.new(1.8, 1.8, 1.8), pos + Vector3.new(0, 8.6, 0), color, Enum.Material.Neon)
	light(bulb, color, 18, 1.2)
end

local function cloud(parent, pos, scale)
	for i = 1, 5 do
		local off = Vector3.new(rng:NextNumber(-8, 8), rng:NextNumber(-1.5, 1.5), rng:NextNumber(-4, 4)) * scale
		local s = rng:NextNumber(7, 12) * scale
		ball(parent, Vector3.new(s, s * 0.7, s), pos + off, rgb(255, 255, 255), Enum.Material.SmoothPlastic, deco({ CastShadow = false, Transparency = 0.05 }))
	end
end

---------------------------------------------------------------------
-- освещение и вода
---------------------------------------------------------------------
local function buildLighting()
	Lighting.ClockTime = 13.5
	Lighting.Brightness = 3
	Lighting.Ambient = rgb(120, 120, 135)
	Lighting.OutdoorAmbient = rgb(160, 160, 175)
	Lighting.EnvironmentDiffuseScale = 1
	Lighting.EnvironmentSpecularScale = 1
	Lighting.GlobalShadows = true
	Lighting.FogEnd = 100000

	local atmo = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
	atmo.Density = 0.08
	atmo.Offset = 0.1
	atmo.Haze = 0.2
	atmo.Glare = 0.3
	atmo.Color = rgb(210, 235, 255)
	atmo.Decay = rgb(140, 190, 255)
	atmo.Parent = Lighting

	local cc = Instance.new("ColorCorrectionEffect")
	cc.Saturation = 0.3
	cc.Contrast = 0.08
	cc.Brightness = 0.02
	cc.TintColor = rgb(255, 250, 240)
	cc.Parent = Lighting

	local bloom = Instance.new("BloomEffect")
	bloom.Intensity = 0.6
	bloom.Size = 24
	bloom.Threshold = 1.4
	bloom.Parent = Lighting

	local rays = Instance.new("SunRaysEffect")
	rays.Intensity = 0.08
	rays.Spread = 0.7
	rays.Parent = Lighting

	if not Lighting:FindFirstChildOfClass("Sky") then
		local sky = Instance.new("Sky")
		sky.SunAngularSize = 14
		sky.Parent = Lighting
	end
end

local function buildWater(map)
	local tile = 2000
	for ix = -2, 1 do
		for iz = -2, 1 do
			part(deco({
				Parent = map,
				Name = "Water",
				Size = Vector3.new(tile, 4, tile),
				CFrame = CFrame.new(ix * tile + tile / 2, Config.WaterLevel - 2, iz * tile + tile / 2),
				Color = rgb(40, 190, 230),
				Material = Enum.Material.Glass,
				Reflectance = 0.1,
				Transparency = 0.2,
				CastShadow = false,
			}))
			part(deco({
				Parent = map,
				Name = "SeaFloor",
				Size = Vector3.new(tile, 2, tile),
				CFrame = CFrame.new(ix * tile + tile / 2, Config.WaterLevel - 30, iz * tile + tile / 2),
				Color = rgb(20, 90, 160),
				Material = Enum.Material.Sand,
				CastShadow = false,
			}))
		end
	end
end

local function buildClouds(map)
	local folder = Instance.new("Folder")
	folder.Name = "Clouds"
	folder.Parent = map
	for i = 1, 40 do
		local a = rng:NextNumber(0, math.pi * 2)
		local d = rng:NextNumber(200, 3000)
		cloud(folder, Vector3.new(math.cos(a) * d, rng:NextNumber(140, 260), math.sin(a) * d), rng:NextNumber(1.2, 2.4))
	end
end

---------------------------------------------------------------------
-- стартовая зона
---------------------------------------------------------------------

-- тематические украшения для каждой палатки
local function stationDecor(name, model, cf, color)
	local white = rgb(255, 255, 255)
	local gold = rgb(255, 205, 40)
	local function at(x, y, z)
		return (cf * CFrame.new(x, y, z)).Position
	end
	if name == "Speed" then
		-- молния на крыше
		block(model, Vector3.new(1.2, 5, 1.2), cf * CFrame.new(0.8, 18.5, 0) * CFrame.Angles(0, 0, math.rad(-25)), gold, Enum.Material.Neon, deco({}))
		block(model, Vector3.new(3.2, 1.2, 1.2), cf * CFrame.new(0, 16.4, 0), gold, Enum.Material.Neon, deco({}))
		block(model, Vector3.new(1.2, 5, 1.2), cf * CFrame.new(-0.8, 14.3, 0) * CFrame.Angles(0, 0, math.rad(-25)), gold, Enum.Material.Neon, deco({}))
		-- полосатая беговая дорожка
		for i = 0, 7 do
			block(model, Vector3.new(14, 0.2, 1.5), cf * CFrame.new(0, 1.1, -9 - i * 1.5), i % 2 == 0 and gold or rgb(30, 30, 35), nil, deco({}))
		end
		-- кроссовок на прилавке
		block(model, Vector3.new(1.4, 1, 3), cf * CFrame.new(-5.5, 6, -2), rgb(240, 50, 60))
		block(model, Vector3.new(1.5, 0.4, 3.1), cf * CFrame.new(-5.5, 5.5, -2), white)
	elseif name == "Stamina" then
		-- гантели по бокам
		for _, x in ipairs({ -10.5, 10.5 }) do
			cyl(model, at(x, 2.5, -4), 0.4, 3.2, rgb(80, 80, 90), Enum.Material.Metal)
			for _, dy in ipairs({ -1.4, 1.4 }) do
				cyl(model, at(x, 2.5 + dy, -4), 1.4, 0.6, rgb(40, 180, 90), Enum.Material.Metal)
			end
		end
		-- неоновое сердце
		ball(model, Vector3.new(2.6, 2.6, 1), at(-0.9, 18.2, 0), rgb(255, 60, 90), Enum.Material.Neon, deco({}))
		ball(model, Vector3.new(2.6, 2.6, 1), at(0.9, 18.2, 0), rgb(255, 60, 90), Enum.Material.Neon, deco({}))
		block(model, Vector3.new(2.6, 2.6, 1), cf * CFrame.new(0, 17.0, 0) * CFrame.Angles(0, 0, math.rad(45)), rgb(255, 60, 90), Enum.Material.Neon, deco({}))
		block(model, Vector3.new(18, 0.2, 10), cf * CFrame.new(0, 1.1, -12), rgb(60, 200, 110), nil, deco({}))
	elseif name == "Wings" then
		-- огромные крылья на крыше
		for _, sx in ipairs({ -1, 1 }) do
			for k = 0, 3 do
				block(model, Vector3.new(6 - k, 1.2, 0.4), cf * CFrame.new(sx * (4 + k * 2.2), 17 + k * 1.3, 0) * CFrame.Angles(0, 0, math.rad(sx * (20 + k * 8))), k % 2 == 0 and white or rgb(170, 210, 255), k == 3 and Enum.Material.Neon or nil, deco({}))
			end
		end
		-- голубые колонны с перьями
		for _, x in ipairs({ -10.5, 10.5 }) do
			cyl(model, at(x, 4, -6), 1, 7, rgb(120, 180, 255), Enum.Material.Marble)
			block(model, Vector3.new(0.3, 2.4, 1), cf * CFrame.new(x, 8.5, -6) * CFrame.Angles(0, 0, math.rad(15)), white, Enum.Material.Neon, deco({}))
		end
	elseif name == "Market" then
		-- ящики и горы монет
		for i, off in ipairs({ { -10, -5 }, { 10, -5 }, { -10.5, 3 } }) do
			block(model, Vector3.new(3, 3, 3), cf * CFrame.new(off[1], 2.5, off[2]) * CFrame.Angles(0, math.rad(i * 20), 0), rgb(170, 120, 70), Enum.Material.WoodPlanks)
		end
		for i = 0, 5 do
			cyl(model, at(10 + (i % 2) * 0.4, 1.3 + i * 0.35, 3), 1.6 - i * 0.15, 0.35, gold, Enum.Material.Metal)
		end
		-- большая монета-вывеска
		local coin = part({
			Parent = model,
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.8, 5, 5),
			CFrame = cf * CFrame.new(0, 19, 0) * CFrame.Angles(0, math.rad(90), 0),
			Color = gold,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		billboard(coin, "$", rgb(120, 80, 0), 0, 60, 60, false, 200)
	elseif name == "Donate" then
		-- звезда
		for k = 0, 4 do
			block(model, Vector3.new(1.4, 4, 0.8), cf * CFrame.new(0, 19, 0) * CFrame.Angles(0, 0, math.rad(k * 72)) * CFrame.new(0, 1.8, 0), gold, Enum.Material.Neon, deco({}))
		end
		-- подарки
		local gifts = { { -10, -5, rgb(255, 80, 200) }, { 10, -5, rgb(80, 200, 255) }, { 10.5, 3, rgb(255, 205, 40) } }
		for _, g in ipairs(gifts) do
			block(model, Vector3.new(3, 3, 3), cf * CFrame.new(g[1], 2.5, g[2]), g[3])
			block(model, Vector3.new(3.1, 3.1, 0.5), cf * CFrame.new(g[1], 2.5, g[2]), white, nil, deco({}))
			block(model, Vector3.new(0.5, 3.1, 3.1), cf * CFrame.new(g[1], 2.5, g[2]), white, nil, deco({}))
			ball(model, Vector3.new(1.2, 1, 1.2), at(g[1], 4.3, g[2]), white, nil, deco({}))
		end
		local sparkle = Instance.new("Sparkles")
		sparkle.SparkleColor = gold
		sparkle.Parent = model:FindFirstChild("Kiosk")
	end
end

local function buildStation(map, name, title, color, pos, facing)
	local model = Instance.new("Model")
	model.Name = name
	model.Parent = map
	local cf = CFrame.lookAt(pos, pos + facing)
	local white = rgb(255, 255, 255)

	block(model, Vector3.new(20, 1, 16), cf * CFrame.new(0, 0.5, 0), color:Lerp(white, 0.55))
	-- прилавок
	local kiosk = block(model, Vector3.new(14, 4, 3), cf * CFrame.new(0, 3, -2), color)
	kiosk.Name = "Kiosk"
	block(model, Vector3.new(14.6, 0.6, 3.6), cf * CFrame.new(0, 5.3, -2), white)
	-- столбы
	for _, x in ipairs({ -8, 8 }) do
		for _, z in ipairs({ -4, 5 }) do
			block(model, Vector3.new(0.8, 11, 0.8), cf * CFrame.new(x, 6.5, z), white, Enum.Material.Wood)
		end
	end
	-- полосатая крыша
	for i = -4, 4 do
		block(model, Vector3.new(2, 0.6, 12), cf * CFrame.new(i * 2, 12.6, 0.5) * CFrame.Angles(math.rad(-8), 0, 0), i % 2 == 0 and color or white)
	end
	for i = -4, 4 do
		ball(model, Vector3.new(2, 2, 2), (cf * CFrame.new(i * 2, 12.2, -5.6)).Position, i % 2 == 0 and color or white, nil, deco({}))
	end
	-- вывеска
	local sign = block(model, Vector3.new(12, 3, 0.6), cf * CFrame.new(0, 15.2, -5), color, Enum.Material.Neon)
	billboard(sign, title, white, 2.5, 280, 60, false, 260)
	light(sign, color, 24, 2)
	-- украшения на прилавке
	ball(model, Vector3.new(1.6, 1.6, 1.6), (cf * CFrame.new(-4, 6.4, -2)).Position, rgb(255, 230, 80), Enum.Material.Neon, deco({}))
	ball(model, Vector3.new(1.6, 1.6, 1.6), (cf * CFrame.new(4, 6.4, -2)).Position, rgb(120, 230, 255), Enum.Material.Neon, deco({}))

	stationDecor(name, model, cf, color)

	local pp = prompt(kiosk, "Открыть", title, "OpenPrompt")
	MapBuilder.stations[name] = { model = model, kiosk = kiosk, prompt = pp, position = pos }
end

local function buildFountain(map)
	local c = Vector3.new(0, GY, 0)
	cyl(map, c + Vector3.new(0, 1, 0), 12, 2, rgb(240, 240, 250), Enum.Material.Marble)
	cyl(map, c + Vector3.new(0, 1.6, 0), 10.5, 1.4, rgb(70, 210, 255), Enum.Material.Glass, deco({ Transparency = 0.2 }))
	cyl(map, c + Vector3.new(0, 4, 0), 2, 6, rgb(240, 240, 250), Enum.Material.Marble)
	cyl(map, c + Vector3.new(0, 7.2, 0), 5, 0.8, rgb(240, 240, 250), Enum.Material.Marble)
	local top = ball(map, Vector3.new(3, 3, 3), c + Vector3.new(0, 9, 0), rgb(255, 215, 60), Enum.Material.Neon)
	light(top, rgb(255, 230, 120), 30, 2)
	-- струи
	local emitter = Instance.new("ParticleEmitter")
	emitter.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	emitter.Color = ColorSequence.new(rgb(140, 230, 255))
	emitter.Rate = 40
	emitter.Lifetime = NumberRange.new(1.2, 1.8)
	emitter.Speed = NumberRange.new(14, 18)
	emitter.SpreadAngle = Vector2.new(25, 25)
	emitter.Acceleration = Vector3.new(0, -25, 0)
	emitter.Size = NumberSequence.new(0.8)
	emitter.Parent = top
end

local function buildPlot(map, index, center)
	local model = Instance.new("Model")
	model.Name = "Plot" .. index
	model.Parent = map
	local color = PLOT_COLORS[index]
	local dark = color:Lerp(Color3.new(0, 0, 0), 0.25)
	local light2 = color:Lerp(Color3.new(1, 1, 1), 0.55)
	local white = rgb(255, 255, 255)
	-- -Z смотрит в центр карты (там вход)
	local cf = CFrame.lookAt(center, Vector3.new(0, center.Y, 0))

	-- шахматный пол
	local tiles = 4
	local ts = PLOT_HALF * 2 / tiles
	for ix = 0, tiles - 1 do
		for iz = 0, tiles - 1 do
			local x = -PLOT_HALF + ts / 2 + ix * ts
			local z = -PLOT_HALF + ts / 2 + iz * ts
			block(model, Vector3.new(ts, 1, ts), cf * CFrame.new(x, 0.5, z), (ix + iz) % 2 == 0 and light2 or white)
		end
	end

	-- стены: задняя и боковые, перед открыт
	local wallH = 8
	local function wall(size, offset)
		block(model, size, cf * offset, color)
		block(model, Vector3.new(size.X + 0.4, 0.8, size.Z + 0.4), cf * offset * CFrame.new(0, wallH / 2 + 0.4, 0), white)
		block(model, Vector3.new(size.X + 0.2, 0.5, size.Z + 0.2), cf * offset * CFrame.new(0, -wallH / 2 + 1.8, 0), dark, Enum.Material.Neon, deco({}))
	end
	wall(Vector3.new(PLOT_HALF * 2, wallH, 1.2), CFrame.new(0, wallH / 2 + 1, PLOT_HALF))
	wall(Vector3.new(1.2, wallH, PLOT_HALF * 2), CFrame.new(-PLOT_HALF, wallH / 2 + 1, 0))
	wall(Vector3.new(1.2, wallH, PLOT_HALF * 2), CFrame.new(PLOT_HALF, wallH / 2 + 1, 0))
	-- короткие стенки по бокам входа
	wall(Vector3.new(18, wallH, 1.2), CFrame.new(-PLOT_HALF + 9, wallH / 2 + 1, -PLOT_HALF))
	wall(Vector3.new(18, wallH, 1.2), CFrame.new(PLOT_HALF - 9, wallH / 2 + 1, -PLOT_HALF))

	-- арка входа
	for _, x in ipairs({ -14, 14 }) do
		block(model, Vector3.new(2.4, 16, 2.4), cf * CFrame.new(x, 9, -PLOT_HALF), white)
		local orb = ball(model, Vector3.new(3, 3, 3), (cf * CFrame.new(x, 18.5, -PLOT_HALF)).Position, color, Enum.Material.Neon)
		light(orb, color, 20, 2)
	end
	local arch = block(model, Vector3.new(30, 3, 2.4), cf * CFrame.new(0, 16.5, -PLOT_HALF), color)
	local sign = billboard(arch, "Свободная база", white, 3.5, 320, 56, false, 300)
	-- светящаяся завеса на входе (декор)
	block(model, Vector3.new(26, 14, 0.2), cf * CFrame.new(0, 8, -PLOT_HALF), color, Enum.Material.ForceField, deco({ Transparency = 0.5 }))

	-- флаг-маяк в углу
	local pole = block(model, Vector3.new(0.8, 30, 0.8), cf * CFrame.new(PLOT_HALF - 3, 16, PLOT_HALF - 3), white, Enum.Material.Metal)
	pole.Name = "Beacon"
	block(model, Vector3.new(0.3, 5, 8), cf * CFrame.new(PLOT_HALF - 3, 28.5, PLOT_HALF - 7.2), color, Enum.Material.Fabric, deco({}))

	-- подиумы 3 ряда по 5
	local podiums = {}
	local maxPads = Config.BaseSlots + Config.ExtraSlotsPass
	local i = 0
	for _, z in ipairs({ -6, 7, 20 }) do
		for _, x in ipairs({ -22, -11, 0, 11, 22 }) do
			i = i + 1
			if i <= maxPads then
				local base = cyl(model, (cf * CFrame.new(x, 2, z)).Position, 3, 2, white)
				base.Name = "Podium" .. i
				local rim = cyl(model, (cf * CFrame.new(x, 3.05, z)).Position, 3.3, 0.3, rgb(200, 200, 210), Enum.Material.Neon, deco({}))
				local button = block(model, Vector3.new(3, 0.4, 2.2), cf * CFrame.new(x, 1.2, z - 4.6), rgb(60, 220, 90), Enum.Material.Neon, { CanCollide = false })
				button.Name = "Collect" .. i
				local gui = billboard(button, "", rgb(140, 255, 140), 1.6, 110, 26, false, 70)
				podiums[i] = {
					base = base,
					rim = rim,
					button = button,
					label = gui.Label,
					top = cf * CFrame.new(x, 3.2, z),
				}
			end
		end
	end

	MapBuilder.plots[index] = {
		model = model,
		cframe = cf * CFrame.new(0, 1, 0),
		spawnCFrame = cf * CFrame.new(0, 4, -PLOT_HALF + 6) * CFrame.Angles(0, math.pi, 0),
		podiums = podiums,
		sign = sign,
		color = color,
	}
end

local function buildStart(map)
	local y = GY
	-- остров-основа
	cyl(map, Vector3.new(0, y - 6, 0), PLATFORM_HALF * 1.32, 12, rgb(110, 205, 90), Enum.Material.Grass)
	cyl(map, Vector3.new(0, y - 7.4, 0), PLATFORM_HALF * 1.32 + 12, 12, rgb(250, 225, 160), Enum.Material.Sand)
	cyl(map, Vector3.new(0, y - 18, 0), PLATFORM_HALF * 1.2, 14, rgb(150, 125, 100), Enum.Material.Slate)

	-- дорожки-«плюс» и круг вокруг фонтана
	block(map, Vector3.new(130, 0.3, 12), CFrame.new(0, y + 0.15, 0), rgb(255, 235, 200), Enum.Material.Pebble)
	block(map, Vector3.new(12, 0.3, 130), CFrame.new(0, y + 0.15, 0), rgb(255, 235, 200), Enum.Material.Pebble)
	cyl(map, Vector3.new(0, y + 0.2, 0), 20, 0.4, rgb(255, 235, 200), Enum.Material.Pebble)
	-- диагональные дорожки к базам
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			local from = Vector3.new(sx * 15, y + 0.15, sz * 15)
			local to = Vector3.new(sx * (PLOT_DIST - PLOT_HALF * 0.7), y + 0.15, sz * (PLOT_DIST - PLOT_HALF * 0.7))
			local mid = (from + to) / 2
			block(map, Vector3.new(10, 0.3, (to - from).Magnitude), CFrame.lookAt(mid, to), rgb(255, 235, 200), Enum.Material.Pebble)
		end
	end

	buildFountain(map)

	for index, c in ipairs({
		Vector3.new(-PLOT_DIST, y, -PLOT_DIST),
		Vector3.new(PLOT_DIST, y, -PLOT_DIST),
		Vector3.new(PLOT_DIST, y, PLOT_DIST),
		Vector3.new(-PLOT_DIST, y, PLOT_DIST),
	}) do
		buildPlot(map, index, c)
	end

	buildStation(map, "Speed", "⚡ Скорость", rgb(255, 190, 30), Vector3.new(-52, y, 0), Vector3.new(1, 0, 0))
	buildStation(map, "Stamina", "💪 Стамина", rgb(60, 210, 110), Vector3.new(52, y, 0), Vector3.new(-1, 0, 0))
	buildStation(map, "Wings", "🕊 Крылья", rgb(90, 160, 255), Vector3.new(0, y, -52), Vector3.new(0, 0, 1))
	buildStation(map, "Market", "💰 Рынок", rgb(255, 110, 50), Vector3.new(0, y, 52), Vector3.new(0, 0, -1))
	buildStation(map, "Donate", "⭐ Донат-магазин", rgb(255, 80, 200), Vector3.new(57, y, 24), Vector3.new(-57, 0, -24))

	-- клумбы, фонари, деревья
	for i = 1, 8 do
		local a = i / 8 * math.pi * 2 + math.pi / 8
		local p = Vector3.new(math.cos(a) * 26, y, math.sin(a) * 26)
		lamp(map, p, FLOWER_COLORS[(i % #FLOWER_COLORS) + 1])
	end
	for i = 1, 40 do
		local a = rng:NextNumber(0, math.pi * 2)
		local d = rng:NextNumber(22, 40)
		local p = Vector3.new(math.cos(a) * d, y, math.sin(a) * d)
		if math.abs(p.X) > 8 and math.abs(p.Z) > 8 then
			flower(map, p, FLOWER_COLORS[rng:NextInteger(1, #FLOWER_COLORS)])
		end
	end
	for i = 1, 16 do
		local a = i / 16 * math.pi * 2
		local p = Vector3.new(math.cos(a) * 180, y, math.sin(a) * 180)
		if i % 2 == 0 then
			palm(map, p, 1.3)
		else
			roundTree(map, p, 1.3)
		end
	end
	for i = 1, 12 do
		local a = i / 12 * math.pi * 2 + 0.2
		bush(map, Vector3.new(math.cos(a) * 160, y, math.sin(a) * 160), rgb(70, 190, 80), 1.2)
	end
end

---------------------------------------------------------------------
-- острова
---------------------------------------------------------------------
local THEMES = {
	meadow = { ground = rgb(110, 215, 90), cliff = rgb(165, 130, 95), beach = rgb(250, 225, 150) },
	candy = { ground = rgb(255, 170, 215), cliff = rgb(190, 130, 255), beach = rgb(255, 245, 250) },
	tropical = { ground = rgb(120, 220, 100), cliff = rgb(200, 160, 110), beach = rgb(255, 230, 160) },
	volcano = { ground = rgb(95, 70, 70), cliff = rgb(60, 45, 45), beach = rgb(40, 30, 30) },
	ice = { ground = rgb(235, 248, 255), cliff = rgb(140, 200, 245), beach = rgb(200, 230, 255) },
	crystal = { ground = rgb(130, 90, 210), cliff = rgb(70, 50, 120), beach = rgb(180, 150, 240) },
	golden = { ground = rgb(255, 240, 170), cliff = rgb(245, 245, 250), beach = rgb(255, 220, 110) },
}

local function randomSpotOnIsland(center, radius, minFrac, maxFrac)
	local a = rng:NextNumber(0, math.pi * 2)
	local d = rng:NextNumber(minFrac, maxFrac) * radius
	return center + Vector3.new(math.cos(a) * d, 0, math.sin(a) * d)
end

local function decorateIsland(model, theme, center, r)
	local function ring(count, minF, maxF, fn)
		for i = 1, count do
			fn(randomSpotOnIsland(center, r, minF, maxF), i)
		end
	end
	if theme == "meadow" then
		ring(9, 0.7, 0.9, function(p) roundTree(model, p, rng:NextNumber(1, 1.4)) end)
		ring(8, 0.55, 0.85, function(p) bush(model, p, rgb(80, 200, 80)) end)
		ring(40, 0.15, 0.9, function(p, i) flower(model, p, FLOWER_COLORS[(i % #FLOWER_COLORS) + 1]) end)
		ring(5, 0.6, 0.85, function(p) mushroom(model, p, rgb(255, 70, 70), false) end)
		ring(4, 0.75, 0.9, function(p) rock(model, p, rgb(170, 165, 160)) end)
	elseif theme == "candy" then
		local colors = { rgb(255, 80, 150), rgb(110, 220, 255), rgb(255, 210, 60), rgb(150, 255, 150), rgb(200, 120, 255) }
		ring(10, 0.65, 0.9, function(p, i) lollipopTree(model, p, rng:NextNumber(1, 1.5), colors[(i % #colors) + 1]) end)
		ring(8, 0.5, 0.88, function(p) candyCane(model, p, rng:NextNumber(1, 1.6)) end)
		ring(14, 0.2, 0.9, function(p, i)
			ball(model, Vector3.new(2.4, 2, 2.4), p + Vector3.new(0, 0.8, 0), colors[(i % #colors) + 1], Enum.Material.Glass, { Transparency = 0.1 })
		end)
		ring(6, 0.55, 0.85, function(p) mushroom(model, p, rgb(255, 120, 200), true) end)
	elseif theme == "tropical" then
		ring(12, 0.7, 0.95, function(p) palm(model, p, rng:NextNumber(1.1, 1.5)) end)
		ring(8, 0.55, 0.85, function(p) bush(model, p, rgb(50, 190, 90)) end)
		ring(5, 0.75, 0.95, function(p) rock(model, p, rgb(210, 190, 150)) end)
		-- зонтики
		ring(3, 0.5, 0.7, function(p, i)
			cyl(model, p + Vector3.new(0, 3.5, 0), 0.25, 7, rgb(255, 255, 255))
			cyl(model, p + Vector3.new(0, 7.2, 0), 4, 0.5, i % 2 == 0 and rgb(255, 80, 80) or rgb(60, 170, 255), nil, deco({}))
		end)
		-- ракушки и морские звёзды
		ring(14, 0.2, 0.9, function(p, i)
			ball(model, Vector3.new(1.2, 0.5, 1.2), p + Vector3.new(0, 0.25, 0), i % 2 == 0 and rgb(255, 140, 100) or rgb(255, 200, 220), nil, deco({}))
		end)
	elseif theme == "volcano" then
		-- вулкан у края
		local vp = center + Vector3.new(r * 0.55, 0, r * 0.25)
		cyl(model, vp + Vector3.new(0, 4, 0), 16, 8, rgb(70, 50, 50), Enum.Material.Basalt)
		cyl(model, vp + Vector3.new(0, 11, 0), 11, 8, rgb(80, 55, 55), Enum.Material.Basalt)
		cyl(model, vp + Vector3.new(0, 17, 0), 7, 6, rgb(90, 60, 55), Enum.Material.Basalt)
		local crater = cyl(model, vp + Vector3.new(0, 20.2, 0), 5, 0.6, rgb(255, 100, 20), Enum.Material.Neon)
		light(crater, rgb(255, 120, 40), 40, 3)
		local fire = Instance.new("Fire")
		fire.Size = 14
		fire.Heat = 20
		fire.Parent = crater
		local smoke = Instance.new("Smoke")
		smoke.Size = 10
		smoke.RiseVelocity = 8
		smoke.Opacity = 0.15
		smoke.Parent = crater
		ring(7, 0.25, 0.85, function(p)
			local pool = cyl(model, p + Vector3.new(0, 0.1, 0), rng:NextNumber(2.5, 4.5), 0.4, rgb(255, 110, 20), Enum.Material.Neon, deco({}))
			light(pool, rgb(255, 120, 40), 12, 1)
		end)
		ring(8, 0.6, 0.9, function(p) rock(model, p, rgb(50, 40, 40), rng:NextNumber(1, 1.6)) end)
		ring(5, 0.5, 0.85, function(p) crystal(model, p, rgb(255, 60, 40), 0.9) end)
	elseif theme == "ice" then
		ring(10, 0.65, 0.92, function(p) pine(model, p, rng:NextNumber(1.1, 1.5), rgb(40, 130, 90), true) end)
		ring(8, 0.4, 0.88, function(p) crystal(model, p, rgb(150, 230, 255), rng:NextNumber(0.8, 1.3)) end)
		ring(3, 0.4, 0.7, function(p)
			ball(model, Vector3.new(4, 4, 4), p + Vector3.new(0, 2, 0), rgb(255, 255, 255), Enum.Material.Snow)
			ball(model, Vector3.new(3, 3, 3), p + Vector3.new(0, 5, 0), rgb(255, 255, 255), Enum.Material.Snow)
			ball(model, Vector3.new(2.2, 2.2, 2.2), p + Vector3.new(0, 7.2, 0), rgb(255, 255, 255), Enum.Material.Snow)
			block(model, Vector3.new(0.3, 0.3, 1.2), CFrame.new(p + Vector3.new(0, 7.2, -1.4)), rgb(255, 140, 30), nil, deco({}))
			block(model, Vector3.new(2, 0.4, 2), CFrame.new(p + Vector3.new(0, 8.4, 0)), rgb(30, 30, 40), nil, deco({}))
		end)
		ring(6, 0.3, 0.85, function(p) rock(model, p, rgb(170, 215, 245)) end)
	elseif theme == "crystal" then
		local colors = { rgb(90, 240, 255), rgb(255, 90, 220), rgb(170, 110, 255) }
		ring(14, 0.45, 0.92, function(p, i) crystal(model, p, colors[(i % #colors) + 1], rng:NextNumber(1, 1.9)) end)
		ring(10, 0.3, 0.9, function(p, i) mushroom(model, p, colors[(i % #colors) + 1], true, rng:NextNumber(0.8, 1.4)) end)
		ring(6, 0.6, 0.9, function(p) rock(model, p, rgb(80, 60, 130), 1.4) end)
	elseif theme == "golden" then
		-- кольцо колонн и пьедестал в центре
		for i = 1, 10 do
			local a = i / 10 * math.pi * 2
			local p = center + Vector3.new(math.cos(a), 0, math.sin(a)) * (r * 0.62)
			cyl(model, p + Vector3.new(0, 1, 0), 2.6, 2, rgb(255, 255, 255), Enum.Material.Marble)
			cyl(model, p + Vector3.new(0, 9, 0), 1.8, 14, rgb(250, 250, 255), Enum.Material.Marble)
			cyl(model, p + Vector3.new(0, 16.5, 0), 2.6, 1.4, rgb(255, 210, 60), Enum.Material.Metal)
			local orb = ball(model, Vector3.new(2, 2, 2), p + Vector3.new(0, 18.4, 0), rgb(255, 230, 100), Enum.Material.Neon)
			light(orb, rgb(255, 220, 120), 16, 1.5)
		end
		cyl(model, center + Vector3.new(0, 0.6, 0), 14, 1.2, rgb(255, 255, 255), Enum.Material.Marble)
		cyl(model, center + Vector3.new(0, 1.4, 0), 11, 0.5, rgb(255, 210, 60), Enum.Material.Neon, deco({}))
		ring(8, 0.75, 0.95, function(p) cloud(model, p + Vector3.new(0, 2, 0), 0.5) end)
		ring(20, 0.3, 0.9, function(p) flower(model, p, rgb(255, 225, 90)) end)
	end
end

local function buildIsland(map, index, def)
	local model = Instance.new("Model")
	model.Name = "Island" .. index
	model.Parent = map
	local a = math.rad(def.angle)
	local center = Vector3.new(math.cos(a) * def.distance, GY, math.sin(a) * def.distance)
	local rarity = Config.Rarities[def.rarity]
	local theme = THEMES[def.theme] or THEMES.meadow
	local r = def.radius

	-- слои: трава, пляж, скалы
	cyl(model, center - Vector3.new(0, 1.5, 0), r, 3, theme.ground, def.theme == "ice" and Enum.Material.Snow or Enum.Material.Grass)
	cyl(model, center - Vector3.new(0, 2.6, 0), r + 8, 3, theme.beach, Enum.Material.Sand)
	cyl(model, center - Vector3.new(0, 10, 0), r - 3, 14, theme.cliff, Enum.Material.Slate)
	cyl(model, center - Vector3.new(0, 20, 0), r * 0.7, 10, theme.cliff:Lerp(Color3.new(0, 0, 0), 0.15), Enum.Material.Slate)
	-- светящийся край цвета редкости
	cyl(model, center - Vector3.new(0, 1.35, 0), r + 0.6, 2.6, rarity.color, Enum.Material.Neon, deco({}))
	-- холмы по краю
	for h = 1, 3 do
		local ha = a + h * 2.2 + 0.6
		local hp = center + Vector3.new(math.cos(ha), 0, math.sin(ha)) * (r * 0.78)
		ball(model, Vector3.new(r * 0.5, 9, r * 0.5), hp, theme.ground:Lerp(Color3.new(0, 0, 0), 0.06), Enum.Material.Grass)
	end

	decorateIsland(model, def.theme, center, r)

	-- летающие камушки вокруг
	for k = 1, 5 do
		local fa = k / 5 * math.pi * 2 + a
		local fp = center + Vector3.new(math.cos(fa) * (r + 22), rng:NextNumber(18, 34), math.sin(fa) * (r + 22))
		cyl(model, fp, rng:NextNumber(4, 7), 3, theme.ground)
		cyl(model, fp - Vector3.new(0, 3, 0), 3.5, 4, theme.cliff, Enum.Material.Slate)
	end

	local signPart = part(deco({
		Parent = model,
		Name = "SignAnchor",
		Size = Vector3.new(1, 1, 1),
		CFrame = CFrame.new(center + Vector3.new(0, 42, 0)),
		Transparency = 1,
	}))
	billboard(signPart, def.name .. "\n" .. rarity.name, rarity.color, 0, 220, 70, true)

	local spawnPoints = {}
	for k = 1, def.spawns do
		local pos
		if def.spawns == 1 then
			pos = center + Vector3.new(0, 1.2, 0)
		else
			local sa = k / def.spawns * math.pi * 2 + a
			pos = center + Vector3.new(math.cos(sa), 0, math.sin(sa)) * (r * 0.32)
			-- маленький постамент под существом
			cyl(model, pos + Vector3.new(0, 0.3, 0), 3.4, 0.6, rarity.color, Enum.Material.Neon, deco({}))
		end
		spawnPoints[k] = CFrame.lookAt(pos, Vector3.new(0, pos.Y, 0))
	end

	MapBuilder.islands[index] = {
		model = model,
		center = center,
		def = def,
		spawnPoints = spawnPoints,
	}
end

function MapBuilder.build()
	buildLighting()
	local map = Instance.new("Folder")
	map.Name = "Map"
	map.Parent = workspace
	buildWater(map)
	buildClouds(map)
	buildStart(map)
	for index, def in ipairs(Config.Islands) do
		buildIsland(map, index, def)
	end
	local creatures = Instance.new("Folder")
	creatures.Name = "Creatures"
	creatures.Parent = workspace
	MapBuilder.creatureFolder = creatures
	return map
end

return MapBuilder
