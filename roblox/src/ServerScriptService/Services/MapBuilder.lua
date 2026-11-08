-- MapBuilder: строит всю карту из блоков при старте сервера.
-- База в центре, 4 участка, станции прокачки, 7 островов, вода, освещение.

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local MapBuilder = {
	plots = {},
	stations = {},
	islands = {},
}

local PLATFORM_HALF = 110
local PLOT_HALF = 28
local PLOT_COLORS = {
	Color3.fromRGB(230, 80, 80),
	Color3.fromRGB(80, 140, 240),
	Color3.fromRGB(90, 200, 100),
	Color3.fromRGB(240, 200, 70),
}

local function part(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for k, v in pairs(props) do
		if k ~= "Parent" then
			p[k] = v
		end
	end
	p.Parent = props.Parent
	return p
end

local function billboard(adornee, text, color, offsetY, sizeX, sizeY, alwaysOnTop)
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(sizeX or 220, sizeY or 60)
	gui.StudsOffset = Vector3.new(0, offsetY or 4, 0)
	gui.AlwaysOnTop = alwaysOnTop == true
	gui.MaxDistance = alwaysOnTop and 6000 or 200
	gui.LightInfluence = 0
	gui.Adornee = adornee
	local label = Instance.new("TextLabel")
	label.Name = "Label"
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.TextColor3 = color or Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0.2
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
	pp.MaxActivationDistance = 12
	pp.RequiresLineOfSight = false
	pp.KeyboardKeyCode = Enum.KeyCode.E
	pp.Parent = parentPart
	return pp
end

local function cylinder(parent, center, radius, height, color, material)
	return part({
		Parent = parent,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(height, radius * 2, radius * 2),
		CFrame = CFrame.new(center) * CFrame.Angles(0, 0, math.rad(90)),
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
	})
end

local function tree(parent, pos, scale)
	scale = scale or 1
	part({
		Parent = parent,
		Size = Vector3.new(1.6, 9, 1.6) * scale,
		CFrame = CFrame.new(pos + Vector3.new(0, 4.5 * scale, 0)),
		Color = Color3.fromRGB(120, 80, 50),
		Material = Enum.Material.Wood,
	})
	part({
		Parent = parent,
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(8, 8, 8) * scale,
		CFrame = CFrame.new(pos + Vector3.new(0, 10 * scale, 0)),
		Color = Color3.fromRGB(70, 170, 70),
		Material = Enum.Material.Grass,
	})
end

local function buildLighting()
	Lighting.ClockTime = 14
	Lighting.Brightness = 2.5
	Lighting.Ambient = Color3.fromRGB(110, 110, 120)
	Lighting.OutdoorAmbient = Color3.fromRGB(150, 150, 160)
	Lighting.GlobalShadows = true
	Lighting.FogEnd = 100000
	local atmo = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
	atmo.Density = 0.12
	atmo.Haze = 0.5
	atmo.Color = Color3.fromRGB(200, 225, 255)
	atmo.Decay = Color3.fromRGB(120, 170, 230)
	atmo.Parent = Lighting
	if not Lighting:FindFirstChildOfClass("Sky") then
		Instance.new("Sky").Parent = Lighting
	end
end

local function buildWater(map)
	local tile = 2000
	for ix = -2, 1 do
		for iz = -2, 1 do
			part({
				Parent = map,
				Name = "Water",
				Size = Vector3.new(tile, 4, tile),
				CFrame = CFrame.new(ix * tile + tile / 2, Config.WaterLevel - 2, iz * tile + tile / 2),
				Color = Color3.fromRGB(40, 125, 210),
				Material = Enum.Material.Glass,
				Transparency = 0.25,
				CanCollide = false,
				CanQuery = false,
				CanTouch = false,
				CastShadow = false,
			})
		end
	end
end

local function buildStation(map, name, title, color, pos)
	local folder = Instance.new("Model")
	folder.Name = name
	folder.Parent = map
	part({
		Parent = folder,
		Size = Vector3.new(16, 1, 16),
		CFrame = CFrame.new(pos + Vector3.new(0, 0.5, 0)),
		Color = color,
		Material = Enum.Material.SmoothPlastic,
	})
	local kiosk = part({
		Parent = folder,
		Name = "Kiosk",
		Size = Vector3.new(5, 5, 5),
		CFrame = CFrame.new(pos + Vector3.new(0, 3.5, 0)),
		Color = Color3.fromRGB(60, 60, 70),
	})
	part({
		Parent = folder,
		Size = Vector3.new(5.4, 1, 5.4),
		CFrame = CFrame.new(pos + Vector3.new(0, 6.5, 0)),
		Color = color,
		Material = Enum.Material.Neon,
	})
	billboard(kiosk, title, color, 7, 260, 60)
	local pp = prompt(kiosk, "Открыть", title, "OpenPrompt")
	MapBuilder.stations[name] = { model = folder, kiosk = kiosk, prompt = pp, position = pos }
end

local function buildPlot(map, index, center)
	local model = Instance.new("Model")
	model.Name = "Plot" .. index
	model.Parent = map
	local cf = CFrame.lookAt(center, Vector3.new(0, center.Y, 0))
	part({
		Parent = model,
		Name = "Floor",
		Size = Vector3.new(PLOT_HALF * 2, 1, PLOT_HALF * 2),
		CFrame = cf * CFrame.new(0, 0.5, 0),
		Color = PLOT_COLORS[index],
		Material = Enum.Material.SmoothPlastic,
		Transparency = 0.1,
	})
	-- бортики
	for _, side in ipairs({ -1, 1 }) do
		part({
			Parent = model,
			Size = Vector3.new(1, 2, PLOT_HALF * 2),
			CFrame = cf * CFrame.new(side * PLOT_HALF, 1.5, 0),
			Color = PLOT_COLORS[index]:Lerp(Color3.new(0, 0, 0), 0.3),
		})
	end
	part({
		Parent = model,
		Size = Vector3.new(PLOT_HALF * 2, 2, 1),
		CFrame = cf * CFrame.new(0, 1.5, PLOT_HALF),
		Color = PLOT_COLORS[index]:Lerp(Color3.new(0, 0, 0), 0.3),
	})

	local pads = {}
	local maxPads = Config.BaseSlots + Config.ExtraSlotsPass
	local i = 0
	for _, z in ipairs({ -4, 7, 18 }) do
		for _, x in ipairs({ -20, -10, 0, 10, 20 }) do
			i = i + 1
			if i <= maxPads then
				local pad = part({
					Parent = model,
					Name = "Pad" .. i,
					Size = Vector3.new(7, 0.4, 7),
					CFrame = cf * CFrame.new(x, 1.2, z),
					Color = Color3.fromRGB(245, 245, 245),
					Material = Enum.Material.SmoothPlastic,
				})
				pads[i] = pad
			end
		end
	end

	local post = part({
		Parent = model,
		Name = "SignPost",
		Size = Vector3.new(1, 10, 1),
		CFrame = cf * CFrame.new(0, 6, -PLOT_HALF + 2),
		Color = Color3.fromRGB(90, 70, 50),
		Material = Enum.Material.Wood,
	})
	local sign = billboard(post, "Свободная база", Color3.new(1, 1, 1), 6, 260, 50)

	MapBuilder.plots[index] = {
		model = model,
		cframe = cf * CFrame.new(0, 1, 0),
		spawnCFrame = cf * CFrame.new(0, 4, -PLOT_HALF + 6) * CFrame.Angles(0, math.pi, 0),
		pads = pads,
		sign = sign,
		color = PLOT_COLORS[index],
	}
end

local function buildStart(map)
	local y = Config.GroundY
	part({
		Parent = map,
		Name = "StartPlatform",
		Size = Vector3.new(PLATFORM_HALF * 2, 12, PLATFORM_HALF * 2),
		CFrame = CFrame.new(0, y - 6, 0),
		Color = Color3.fromRGB(110, 190, 90),
		Material = Enum.Material.Grass,
	})
	part({
		Parent = map,
		Size = Vector3.new(PLATFORM_HALF * 2 + 6, 14, PLATFORM_HALF * 2 + 6),
		CFrame = CFrame.new(0, y - 9, 0),
		Color = Color3.fromRGB(220, 200, 150),
		Material = Enum.Material.Sand,
	})
	-- дорожки к станциям
	part({
		Parent = map,
		Size = Vector3.new(90, 0.2, 10),
		CFrame = CFrame.new(0, y + 0.1, 0),
		Color = Color3.fromRGB(200, 190, 170),
		Material = Enum.Material.Cobblestone,
	})
	part({
		Parent = map,
		Size = Vector3.new(10, 0.2, 90),
		CFrame = CFrame.new(0, y + 0.1, 0),
		Color = Color3.fromRGB(200, 190, 170),
		Material = Enum.Material.Cobblestone,
	})

	local d = 70
	local corners = {
		Vector3.new(-d, y, -d),
		Vector3.new(d, y, -d),
		Vector3.new(d, y, d),
		Vector3.new(-d, y, d),
	}
	for index, c in ipairs(corners) do
		buildPlot(map, index, c)
	end

	buildStation(map, "Speed", "⚡ Скорость", Color3.fromRGB(255, 200, 40), Vector3.new(-34, y, 0))
	buildStation(map, "Stamina", "💪 Стамина", Color3.fromRGB(60, 220, 120), Vector3.new(34, y, 0))
	buildStation(map, "Wings", "🕊 Крылья", Color3.fromRGB(120, 180, 255), Vector3.new(0, y, -34))
	buildStation(map, "Market", "💰 Рынок (продажа)", Color3.fromRGB(240, 120, 60), Vector3.new(0, y, 34))
	buildStation(map, "Donate", "⭐ Донат-магазин", Color3.fromRGB(255, 90, 200), Vector3.new(0, y, 0))

	for _, pos in ipairs({
		Vector3.new(-100, y, -30),
		Vector3.new(-100, y, 30),
		Vector3.new(100, y, -30),
		Vector3.new(100, y, 30),
		Vector3.new(-30, y, -100),
		Vector3.new(30, y, -100),
		Vector3.new(-30, y, 100),
		Vector3.new(30, y, 100),
	}) do
		tree(map, pos, 1.2)
	end
end

local function buildIsland(map, index, def)
	local model = Instance.new("Model")
	model.Name = "Island" .. index
	model.Parent = map
	local a = math.rad(def.angle)
	local center = Vector3.new(math.cos(a) * def.distance, Config.GroundY, math.sin(a) * def.distance)
	local rarity = Config.Rarities[def.rarity]

	cylinder(model, center - Vector3.new(0, 1, 0), def.radius, 2, Color3.fromRGB(100, 185, 85), Enum.Material.Grass)
	cylinder(model, center - Vector3.new(0, 8, 0), def.radius - 2, 12, Color3.fromRGB(130, 115, 100), Enum.Material.Slate)
	cylinder(model, center - Vector3.new(0, 15, 0), def.radius * 0.6, 6, Color3.fromRGB(110, 95, 85), Enum.Material.Slate)
	-- светящийся край цвета редкости
	cylinder(model, center - Vector3.new(0, 0.9, 0), def.radius + 0.6, 1.6, rarity.color, Enum.Material.Neon)

	for t = 1, 3 do
		local ta = a + t * 2.1
		tree(model, center + Vector3.new(math.cos(ta), 0, math.sin(ta)) * (def.radius * 0.78), 1)
	end

	local signPart = part({
		Parent = model,
		Name = "SignAnchor",
		Size = Vector3.new(1, 1, 1),
		CFrame = CFrame.new(center + Vector3.new(0, 30, 0)),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
	})
	billboard(signPart, "Остров " .. index .. "\n" .. rarity.name, rarity.color, 0, 180, 60, true)

	local spawnPoints = {}
	for k = 1, def.spawns do
		local pos
		if def.spawns == 1 then
			pos = center
		else
			local sa = k / def.spawns * math.pi * 2 + a
			pos = center + Vector3.new(math.cos(sa), 0, math.sin(sa)) * (def.radius * 0.45)
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
