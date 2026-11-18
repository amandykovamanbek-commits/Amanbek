-- Шахта из блоков 16 x 16 x 1000.
-- Блоки создаются «лениво»: существуют только видимые блоки (открытая поверхность
-- шахты). Когда блок ломают — появляются его соседи. Поэтому шахта огромная,
-- а деталей в игре мало и сервер не тормозит.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Remotes = require(script.Parent.Remotes)

local MineService = {}

local BS = Config.BlockSize
local W = Config.MineWidth
local TOP = Config.SurfaceY
local HALF = W * BS / 2
local ORIGIN = -HALF + BS / 2 -- центр блока с индексом 0

local blocks = {} -- [key] = Part
local mined = {} -- [key] = true
local folder = nil
local deepest = 0

MineService.NextResetAt = 0

local function key(x, d, z)
	return x .. "," .. d .. "," .. z
end

local function inBounds(x, d, z)
	return x >= 0 and x < W and z >= 0 and z < W and d >= 0 and d < Config.MaxDepth
end

function MineService.blockCenter(x, d, z)
	return Vector3.new(ORIGIN + x * BS, TOP - BS / 2 - d * BS, ORIGIN + z * BS)
end

-- Небольшая «шумовая» вариация цвета, чтобы стены не были одноцветными
local function shade(color, x, d, z)
	local n = math.sin(x * 12.9898 + d * 78.233 + z * 37.719) * 43758.5453
	n = n - math.floor(n)
	local f = 0.9 + n * 0.16
	return Color3.new(math.min(1, color.R * f), math.min(1, color.G * f), math.min(1, color.B * f))
end

local SIDE_SURFACES = { "FrontSurface", "BackSurface", "LeftSurface", "RightSurface" }

local function spawnBlock(x, d, z)
	if not inBounds(x, d, z) then
		return nil
	end
	local k = key(x, d, z)
	if mined[k] then
		return nil
	end
	if blocks[k] then
		return blocks[k]
	end
	local layer = Config.LayerForDepth(d)
	local rare = math.random() < Config.BaseRareChance
	local ore = rare and layer.Rare or layer.Common

	local part = Instance.new("Part")
	part.Name = "Block"
	part.Anchored = true
	part.Size = Vector3.new(BS, BS, BS)
	part.Position = MineService.blockCenter(x, d, z)
	part.CastShadow = d < 4
	if rare then
		part.Color = ore.Color
		part.Material = ore.Glow and Enum.Material.Neon or Enum.Material.SmoothPlastic
		part.Reflectance = ore.Glow and 0 or 0.15
		part.TopSurface = Enum.SurfaceType.Smooth
		part.BottomSurface = Enum.SurfaceType.Smooth
	else
		part.Color = shade(layer.Color, x, d, z)
		part.Material = layer.Material
		if layer.Studs then
			part.TopSurface = Enum.SurfaceType.Studs
			part.BottomSurface = Enum.SurfaceType.Inlet
			for _, side in ipairs(SIDE_SURFACES) do
				part[side] = Enum.SurfaceType.Inlet
			end
		else
			part.TopSurface = Enum.SurfaceType.Smooth
			part.BottomSurface = Enum.SurfaceType.Smooth
		end
	end
	part:SetAttribute("X", x)
	part:SetAttribute("D", d)
	part:SetAttribute("Z", z)
	part:SetAttribute("Hp", layer.Hp)
	part:SetAttribute("MaxHp", layer.Hp)
	part:SetAttribute("Ore", ore.Id)
	part:SetAttribute("Rare", rare)
	part.Parent = folder
	blocks[k] = part
	return part
end

local function revealNeighbors(x, d, z)
	spawnBlock(x + 1, d, z)
	spawnBlock(x - 1, d, z)
	spawnBlock(x, d, z + 1)
	spawnBlock(x, d, z - 1)
	spawnBlock(x, d + 1, z)
	spawnBlock(x, d - 1, z)
end

local function generateTop()
	for x = 0, W - 1 do
		for z = 0, W - 1 do
			spawnBlock(x, 0, z)
		end
	end
end

function MineService.folder()
	return folder
end

function MineService.deepest()
	return deepest
end

-- Ломает блок (после проверок на сервере). Возвращает информацию о блоке.
function MineService.breakBlock(part)
	if not part or part.Parent ~= folder then
		return nil
	end
	local x, d, z = part:GetAttribute("X"), part:GetAttribute("D"), part:GetAttribute("Z")
	local k = key(x, d, z)
	if blocks[k] ~= part then
		return nil
	end
	blocks[k] = nil
	mined[k] = true
	local pos, color = part.Position, part.Color
	part:Destroy()
	revealNeighbors(x, d, z)
	if d > deepest then
		deepest = d
	end
	Remotes.Fx:FireAllClients("Break", pos, color)
	return { X = x, D = d, Z = z, Position = pos, Color = color }
end

-- Вырезает пустую ячейку без награды (для лифта)
local function carve(x, d, z)
	if not inBounds(x, d, z) then
		return
	end
	local k = key(x, d, z)
	if mined[k] then
		return
	end
	local part = blocks[k]
	if part then
		blocks[k] = nil
		part:Destroy()
	end
	mined[k] = true
	revealNeighbors(x, d, z)
end

-- Готовит комнату для лифта на глубине d и возвращает CFrame, куда ставить игрока
function MineService.prepareChamber(d)
	d = math.clamp(math.floor(d), 1, Config.MaxDepth - 2)
	local cx, cz = Config.ElevatorColumn.X, Config.ElevatorColumn.Z
	for dx = -1, 1 do
		for dz = -1, 1 do
			carve(cx + dx, d, cz + dz)
		end
	end
	carve(cx, d - 1, cz)
	spawnBlock(cx, d + 1, cz) -- пол
	local floorTop = TOP - (d + 1) * BS
	local pos = MineService.blockCenter(cx, d, cz)
	return CFrame.new(pos.X, floorTop + 3.2, pos.Z)
end

-- Полное обновление шахты (все блоки создаются заново)
function MineService.reset()
	if folder then
		folder:ClearAllChildren()
	end
	blocks = {}
	mined = {}
	deepest = 0
	generateTop()
end

-- Если в файле игры нет карты (например, при запуске через Rojo без карты) —
-- строим простой остров, чтобы игра всё равно работала.
local function ensureFallbackMap()
	if workspace:FindFirstChild("Map") then
		return
	end
	warn("[Копай глубже] Карта Map не найдена — строю простой запасной остров")
	local map = Instance.new("Model")
	map.Name = "Map"
	local function slab(name, size, pos, color)
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.Size = size
		p.Position = pos
		p.Color = color
		p.TopSurface = Enum.SurfaceType.Studs
		p.Parent = map
		return p
	end
	local green = Color3.fromRGB(98, 214, 58)
	local y = TOP - 1
	slab("Ground", Vector3.new(400, 2, 152), Vector3.new(0, y, 124), green)
	slab("Ground", Vector3.new(400, 2, 152), Vector3.new(0, y, -124), green)
	slab("Ground", Vector3.new(152, 2, 96), Vector3.new(-124, y, 0), green)
	slab("Ground", Vector3.new(152, 2, 96), Vector3.new(124, y, 0), green)
	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "Spawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(12, 1, 12)
	spawn.Position = Config.SpawnPosition - Vector3.new(0, 3.5, 0)
	spawn.Duration = 0
	spawn.Parent = map
	local pads = Instance.new("Folder")
	pads.Name = "Pads"
	pads.Parent = map
	local pad = Instance.new("Part")
	pad.Name = "Pad"
	pad.Anchored = true
	pad.CanCollide = false
	pad.Shape = Enum.PartType.Cylinder
	pad.Size = Vector3.new(0.4, Config.PadRadius * 2, Config.PadRadius * 2)
	pad.CFrame = CFrame.new(-70, TOP + 0.2, -60) * CFrame.Angles(0, 0, math.rad(90))
	pad.Color = Config.Pads.Sell.Color
	pad.Material = Enum.Material.Neon
	pad.Transparency = 0.3
	local kind = Instance.new("StringValue")
	kind.Name = "PadKind"
	kind.Value = "Sell"
	kind.Parent = pad
	pad.Parent = pads
	map.Parent = workspace
end

function MineService.init()
	ensureFallbackMap()
	local container = workspace:FindFirstChild("Mine")
	if not container then
		container = Instance.new("Folder")
		container.Name = "Mine"
		container.Parent = workspace
	end
	folder = container:FindFirstChild("Blocks")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "Blocks"
		folder.Parent = container
	end
	generateTop()
end

return MineService
