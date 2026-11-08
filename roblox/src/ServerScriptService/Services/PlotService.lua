-- PlotService: 4 базы, выдача базы игроку, отображение существ на слотах.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local MapBuilder = require(script.Parent.MapBuilder)
local CreatureFactory = require(script.Parent.CreatureFactory)
local DataService = require(script.Parent.DataService)

local PlotService = {}

local owners = {} -- owners[plotIndex] = player
local displayed = {} -- displayed[plotIndex] = { models }

function PlotService.assign(player)
	for index = 1, #MapBuilder.plots do
		if not owners[index] then
			owners[index] = player
			local profile = DataService.get(player)
			profile.plotIndex = index
			local plot = MapBuilder.plots[index]
			plot.sign.Label.Text = "База: " .. player.DisplayName
			player:SetAttribute("PlotIndex", index)
			return index
		end
	end
	return nil
end

function PlotService.release(player)
	for index, owner in pairs(owners) do
		if owner == player then
			owners[index] = nil
			PlotService.clear(index)
			local plot = MapBuilder.plots[index]
			plot.sign.Label.Text = "Свободная база"
			for _, pad in pairs(plot.pads) do
				pad.Color = Color3.fromRGB(245, 245, 245)
				pad.Transparency = 0
			end
		end
	end
end

function PlotService.getPlot(player)
	local profile = DataService.get(player)
	if profile and profile.plotIndex then
		return MapBuilder.plots[profile.plotIndex]
	end
	return nil
end

function PlotService.clear(index)
	if displayed[index] then
		for _, m in ipairs(displayed[index]) do
			m:Destroy()
		end
	end
	displayed[index] = {}
end

-- Перерисовывает существ игрока на его базе.
function PlotService.refresh(player)
	local profile = DataService.get(player)
	if not profile or not profile.plotIndex then
		return
	end
	local index = profile.plotIndex
	local plot = MapBuilder.plots[index]
	PlotService.clear(index)
	local maxSlots = DataService.maxSlots(player)
	for slot, pad in pairs(plot.pads) do
		if slot <= maxSlots then
			pad.Transparency = 0
			pad.Color = Color3.fromRGB(245, 245, 245)
		else
			pad.Transparency = 0.6
			pad.Color = Color3.fromRGB(120, 120, 120)
		end
	end
	for slot, id in ipairs(profile.data.creatures) do
		local pad = plot.pads[slot]
		if pad then
			local model = CreatureFactory.build(id, pad.CFrame * CFrame.new(0, 0.2, 0))
			model.Parent = plot.model
			table.insert(displayed[index], model)
			local rarity = Config.Rarities[Config.Creatures[id].rarity]
			pad.Color = rarity.color
		end
	end
end

-- Находится ли точка внутри базы игрока.
function PlotService.isInside(player, position)
	local plot = PlotService.getPlot(player)
	if not plot then
		return false
	end
	local rel = plot.cframe:PointToObjectSpace(position)
	return math.abs(rel.X) <= 29 and math.abs(rel.Z) <= 29 and rel.Y < 40 and rel.Y > -6
end

return PlotService
