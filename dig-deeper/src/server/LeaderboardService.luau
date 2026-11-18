-- Большие доски лидеров на острове: «Топ глубины» и «Топ перерождений».
-- Работают через OrderedDataStore. В Studio без доступа к API показывают
-- игроков, которые сейчас на сервере.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Locale = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Locale"))
local Data = require(script.Parent.DataService)

local LeaderboardService = {}

local REFRESH_SECONDS = 75
local stores = {}
pcall(function()
	stores.Depth = DataStoreService:GetOrderedDataStore("TopDepth_v1")
	stores.Rebirths = DataStoreService:GetOrderedDataStore("TopRebirths_v1")
end)

local posted = {} -- [userId] = { Depth = n, Rebirths = n }
local names = {} -- [userId] = name
local storeWorks = true

local TITLES = {
	Depth = "🏆 ТОП ГЛУБИНЫ · TOP DEPTH",
	Rebirths = "🔄 ТОП РЕБЁРТОВ · TOP REBIRTHS",
}
local FIELD = { Depth = "BestDepth", Rebirths = "Rebirths" }
local MEDALS = { "🥇", "🥈", "🥉" }

local function nameOf(userId)
	if names[userId] then
		return names[userId]
	end
	local player = Players:GetPlayerByUserId(userId)
	if player then
		names[userId] = player.DisplayName
		return names[userId]
	end
	local ok, name = pcall(function()
		return Players:GetNameFromUserIdAsync(userId)
	end)
	names[userId] = ok and name or ("#" .. tostring(userId))
	return names[userId]
end

local function postAll()
	if not storeWorks or not stores.Depth then
		return
	end
	for _, player in ipairs(Players:GetPlayers()) do
		local data = Data.get(player)
		if data then
			local prev = posted[player.UserId] or {}
			for kind, field in pairs(FIELD) do
				local value = data[field] or 0
				if value > 0 and prev[kind] ~= value then
					local ok = pcall(function()
						stores[kind]:SetAsync(tostring(player.UserId), value)
					end)
					if ok then
						prev[kind] = value
					else
						storeWorks = false
					end
				end
			end
			posted[player.UserId] = prev
		end
	end
end

local function fetch(kind)
	if not storeWorks or not stores[kind] then
		return nil
	end
	local ok, pages = pcall(function()
		return stores[kind]:GetSortedAsync(false, 10)
	end)
	if not ok then
		storeWorks = false
		return nil
	end
	local rows = {}
	for _, entry in ipairs(pages:GetCurrentPage()) do
		table.insert(rows, { Name = nameOf(tonumber(entry.key) or 0), Value = entry.value })
	end
	return rows
end

local function fromOnline(kind)
	local rows = {}
	for _, player in ipairs(Players:GetPlayers()) do
		local data = Data.get(player)
		if data then
			table.insert(rows, { Name = player.DisplayName, Value = data[FIELD[kind]] or 0 })
		end
	end
	table.sort(rows, function(a, b)
		return a.Value > b.Value
	end)
	while #rows > 10 do
		table.remove(rows)
	end
	return rows
end

local function label(parent, text, size, pos, color, align, font)
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Size = size
	l.Position = pos
	l.Font = font or Enum.Font.GothamBlack
	l.Text = text
	l.TextScaled = true
	l.TextColor3 = color or Color3.new(1, 1, 1)
	l.TextXAlignment = align or Enum.TextXAlignment.Left
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 3
	stroke.Color = Color3.new(0, 0, 0)
	stroke.Parent = l
	l.Parent = parent
	return l
end

local function render(board, kind, rows)
	local gui = board:FindFirstChild("BoardGui")
	if not gui then
		gui = Instance.new("SurfaceGui")
		gui.Name = "BoardGui"
		gui.Face = Enum.NormalId.Front
		gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
		gui.PixelsPerStud = 22
		gui.LightInfluence = 0
		gui.Parent = board
	end
	gui:ClearAllChildren()

	local bg = Instance.new("Frame")
	bg.Size = UDim2.fromScale(1, 1)
	bg.BackgroundColor3 = Color3.fromRGB(30, 30, 44)
	bg.BorderSizePixel = 0
	local grad = Instance.new("UIGradient")
	grad.Rotation = 90
	grad.Color = ColorSequence.new(Color3.fromRGB(52, 54, 80), Color3.fromRGB(22, 22, 34))
	grad.Parent = bg
	bg.Parent = gui

	local header = Instance.new("Frame")
	header.Size = UDim2.fromScale(1, 0.17)
	header.BackgroundColor3 = kind == "Depth" and Color3.fromRGB(255, 160, 40) or Color3.fromRGB(170, 90, 255)
	header.BorderSizePixel = 0
	header.Parent = bg
	label(header, TITLES[kind], UDim2.fromScale(0.94, 0.8), UDim2.fromScale(0.03, 0.1), nil, Enum.TextXAlignment.Center)

	for i = 1, 10 do
		local row = rows[i]
		local y = 0.19 + (i - 1) * 0.08
		local medal = MEDALS[i] or ("#" .. i)
		local name = row and row.Name or "—"
		local value = ""
		if row then
			value = kind == "Depth" and (Locale.full(row.Value) .. " m") or Locale.full(row.Value)
		end
		local color = i == 1 and Color3.fromRGB(255, 214, 64) or (i == 2 and Color3.fromRGB(220, 226, 240) or (i == 3 and Color3.fromRGB(255, 170, 110) or Color3.new(1, 1, 1)))
		label(bg, medal, UDim2.fromScale(0.12, 0.07), UDim2.fromScale(0.03, y), color, Enum.TextXAlignment.Center)
		label(bg, name, UDim2.fromScale(0.52, 0.065), UDim2.fromScale(0.17, y + 0.003), color)
		label(bg, value, UDim2.fromScale(0.27, 0.065), UDim2.fromScale(0.7, y + 0.003), Color3.fromRGB(184, 255, 61), Enum.TextXAlignment.Right)
	end
end

local function boards()
	local list = {}
	local map = workspace:FindFirstChild("Map")
	if not map then
		return list
	end
	for _, item in ipairs(map:GetDescendants()) do
		if item:IsA("StringValue") and item.Name == "Board" and item.Parent:IsA("BasePart") then
			table.insert(list, { Kind = item.Value, Part = item.Parent })
		end
	end
	return list
end

local function refresh()
	postAll()
	local cache = {}
	for _, board in ipairs(boards()) do
		local kind = board.Kind
		if FIELD[kind] then
			if not cache[kind] then
				cache[kind] = fetch(kind) or fromOnline(kind)
			end
			render(board.Part, kind, cache[kind])
		end
	end
end

function LeaderboardService.init()
	task.spawn(function()
		task.wait(5)
		while true do
			local ok, err = pcall(refresh)
			if not ok then
				warn("[Копай глубже] Доски лидеров: " .. tostring(err))
			end
			task.wait(REFRESH_SECONDS)
		end
	end)
end

return LeaderboardService
