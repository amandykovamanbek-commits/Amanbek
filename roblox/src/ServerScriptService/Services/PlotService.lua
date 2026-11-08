-- PlotService: 4 базы, выдача базы игроку, существа на подиумах,
-- накопление $ у каждого подиума и сбор наступлением на зелёную кнопку.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local MapBuilder = require(script.Parent.MapBuilder)
local CreatureFactory = require(script.Parent.CreatureFactory)
local DataService = require(script.Parent.DataService)
local Net = require(script.Parent.Net)

local PlotService = {}

local owners = {} -- owners[plotIndex] = player
local displayed = {} -- displayed[plotIndex] = { models }

local EMPTY_RIM = Color3.fromRGB(200, 200, 210)
local LOCKED = Color3.fromRGB(120, 120, 130)

local function resetPodiums(plot)
	for _, pod in pairs(plot.podiums) do
		pod.base.Color = Color3.new(1, 1, 1)
		pod.base.Transparency = 0
		pod.rim.Color = EMPTY_RIM
		pod.button.Transparency = 0.6
		pod.label.Text = ""
	end
end

function PlotService.assign(player)
	for index = 1, #MapBuilder.plots do
		if not owners[index] then
			owners[index] = player
			local profile = DataService.get(player)
			profile.plotIndex = index
			local plot = MapBuilder.plots[index]
			plot.sign.Label.Text = "База " .. player.DisplayName
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
			resetPodiums(plot)
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

-- Перерисовывает существ игрока на подиумах.
function PlotService.refresh(player)
	local profile = DataService.get(player)
	if not profile or not profile.plotIndex then
		return
	end
	local index = profile.plotIndex
	local plot = MapBuilder.plots[index]
	PlotService.clear(index)
	resetPodiums(plot)
	local maxSlots = DataService.maxSlots(player)
	for slot, pod in pairs(plot.podiums) do
		if slot > maxSlots then
			pod.base.Color = LOCKED
			pod.base.Transparency = 0.5
			pod.button.Transparency = 1
			pod.label.Text = "🔒"
		end
	end
	for slot, id in ipairs(profile.data.creatures) do
		local pod = plot.podiums[slot]
		if pod then
			local model = CreatureFactory.build(id, pod.top)
			model.Parent = plot.model
			table.insert(displayed[index], model)
			pod.rim.Color = Config.Rarities[Config.Creatures[id].rarity].color
			pod.button.Transparency = 0
		end
	end
	PlotService.updateLabels(player)
end

-- Обновляет надписи «$123» над кнопками.
function PlotService.updateLabels(player)
	local profile = DataService.get(player)
	local plot = PlotService.getPlot(player)
	if not profile or not plot then
		return
	end
	for slot, id in ipairs(profile.data.creatures) do
		local pod = plot.podiums[slot]
		if pod and id then
			pod.label.Text = Config.formatMoney(profile.data.pending[slot] or 0)
		end
	end
end

-- Каждую секунду: доход идёт в копилку подиума.
function PlotService.accumulate(player)
	local profile = DataService.get(player)
	if not profile then
		return
	end
	local pending = profile.data.pending
	for slot in ipairs(profile.data.creatures) do
		pending[slot] = (pending[slot] or 0) + DataService.slotIncome(player, slot)
	end
	PlotService.updateLabels(player)
end

-- Забрать деньги с одного подиума.
function PlotService.collect(player, slot)
	local profile = DataService.get(player)
	local amount = math.floor(profile.data.pending[slot] or 0)
	if amount <= 0 then
		return 0
	end
	profile.data.pending[slot] = 0
	DataService.addMoney(player, amount)
	return amount
end

-- Игрок стоит на кнопке у подиума?
function PlotService.checkCollect(player, position)
	local profile = DataService.get(player)
	local plot = PlotService.getPlot(player)
	if not profile or not plot then
		return
	end
	local total = 0
	for slot in ipairs(profile.data.creatures) do
		local pod = plot.podiums[slot]
		if pod then
			local d = pod.button.Position - position
			if math.abs(d.X) < Config.CollectRadius and math.abs(d.Z) < Config.CollectRadius and math.abs(d.Y) < 5 then
				total = total + PlotService.collect(player, slot)
			end
		end
	end
	if total > 0 then
		PlotService.updateLabels(player)
		DataService.sync(player)
		Net.notify(player, "+" .. Config.formatMoney(total), "success")
	end
end

-- Находится ли точка внутри базы игрока.
function PlotService.isInside(player, position)
	local plot = PlotService.getPlot(player)
	if not plot then
		return false
	end
	local rel = plot.cframe:PointToObjectSpace(position)
	return math.abs(rel.X) <= 31 and math.abs(rel.Z) <= 31 and rel.Y < 40 and rel.Y > -6
end

return PlotService
