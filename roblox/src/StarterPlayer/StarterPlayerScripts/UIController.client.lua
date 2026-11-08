-- UIController: деньги, стамина, таймер божественного, окна станций и донат-магазин.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Request = Remotes:WaitForChild("Request")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local FONT = Enum.Font.FredokaOne
local C = {
	bg = Color3.fromRGB(30, 32, 48),
	panel = Color3.fromRGB(44, 47, 70),
	row = Color3.fromRGB(58, 62, 90),
	green = Color3.fromRGB(70, 200, 100),
	grey = Color3.fromRGB(110, 110, 125),
	gold = Color3.fromRGB(255, 205, 50),
	pink = Color3.fromRGB(255, 90, 200),
	red = Color3.fromRGB(230, 70, 70),
	white = Color3.new(1, 1, 1),
}

---------------------------------------------------------------------
-- помощники
---------------------------------------------------------------------
local function new(className, props, children)
	local inst = Instance.new(className)
	for k, v in pairs(props) do
		if k ~= "Parent" then
			inst[k] = v
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = inst
	end
	inst.Parent = props.Parent
	return inst
end

local function corner(r)
	return new("UICorner", { CornerRadius = UDim.new(0, r or 10) })
end

local function stroke(color, t)
	return new("UIStroke", { Color = color or Color3.new(0, 0, 0), Thickness = t or 2, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

local function label(props)
	props.BackgroundTransparency = props.BackgroundTransparency or 1
	props.Font = props.Font or FONT
	props.TextColor3 = props.TextColor3 or C.white
	props.TextScaled = props.TextScaled ~= false
	return new("TextLabel", props, { new("UIStroke", { Thickness = 1.5, Transparency = 0.3 }) })
end

local function button(props, onClick)
	props.Font = FONT
	props.TextScaled = true
	props.TextColor3 = props.TextColor3 or C.white
	props.AutoButtonColor = true
	local b = new("TextButton", props, { corner(8), new("UIPadding", {
		PaddingLeft = UDim.new(0, 6),
		PaddingRight = UDim.new(0, 6),
		PaddingTop = UDim.new(0, 4),
		PaddingBottom = UDim.new(0, 4),
	}) })
	b.MouseButton1Click:Connect(onClick)
	return b
end

---------------------------------------------------------------------
-- экран
---------------------------------------------------------------------
local gui = new("ScreenGui", {
	Name = "GameUI",
	ResetOnSpawn = false,
	IgnoreGuiInset = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	Parent = playerGui,
})

-- деньги сверху
local moneyFrame = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 8),
	Size = UDim2.fromOffset(320, 64),
	BackgroundColor3 = C.bg,
	BackgroundTransparency = 0.15,
}, { corner(14), stroke(C.gold, 2) })
local moneyLabel = label({ Parent = moneyFrame, Size = UDim2.new(1, -16, 0.62, 0), Position = UDim2.fromOffset(8, 2), TextColor3 = C.gold, Text = "$0" })
local incomeLabel = label({ Parent = moneyFrame, Size = UDim2.new(1, -16, 0.36, 0), Position = UDim2.new(0, 8, 0.62, -2), TextColor3 = Color3.fromRGB(140, 255, 140), Text = "+$0/сек" })

-- стамина снизу
local staminaFrame = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -18),
	Size = UDim2.fromOffset(320, 26),
	BackgroundColor3 = C.bg,
	BackgroundTransparency = 0.1,
}, { corner(13), stroke(Color3.new(0, 0, 0), 2) })
local staminaFill = new("Frame", {
	Parent = staminaFrame,
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.fromRGB(90, 200, 255),
}, { corner(13) })
local staminaText = label({ Parent = staminaFrame, Size = UDim2.fromScale(1, 1), Text = "Стамина", ZIndex = 2 })

-- что несу
local carryLabel = label({
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -50),
	Size = UDim2.fromOffset(420, 30),
	Text = "",
	TextColor3 = C.gold,
})

-- таймер божественного справа сверху
local divineLabel = label({
	Parent = gui,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 8),
	Size = UDim2.fromOffset(260, 28),
	TextColor3 = Color3.fromRGB(255, 240, 120),
	TextXAlignment = Enum.TextXAlignment.Right,
	Text = "",
})
local luckLabel = label({
	Parent = gui,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 38),
	Size = UDim2.fromOffset(260, 24),
	TextColor3 = Color3.fromRGB(120, 255, 120),
	TextXAlignment = Enum.TextXAlignment.Right,
	Text = "",
})

-- уведомления
local toastHolder = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 80),
	Size = UDim2.fromOffset(460, 200),
	BackgroundTransparency = 1,
}, { new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Center }) })

local TOAST_COLORS = {
	info = Color3.fromRGB(60, 120, 220),
	success = Color3.fromRGB(50, 170, 80),
	error = Color3.fromRGB(200, 60, 60),
	announce = Color3.fromRGB(150, 90, 220),
	divine = Color3.fromRGB(220, 160, 20),
}

local function toast(text, kind)
	if not text or text == "" then
		return
	end
	local f = new("Frame", {
		Parent = toastHolder,
		Size = UDim2.fromOffset(440, 36),
		BackgroundColor3 = TOAST_COLORS[kind] or TOAST_COLORS.info,
		BackgroundTransparency = 0.1,
	}, { corner(10) })
	label({ Parent = f, Size = UDim2.new(1, -16, 1, -6), Position = UDim2.fromOffset(8, 3), Text = text })
	task.delay(kind == "divine" and 6 or 3, function()
		TweenService:Create(f, TweenInfo.new(0.3), { BackgroundTransparency = 1 }):Play()
		task.wait(0.3)
		f:Destroy()
	end)
end

Remotes:WaitForChild("Notify").OnClientEvent:Connect(toast)

---------------------------------------------------------------------
-- окна
---------------------------------------------------------------------
local panel = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.52),
	Size = UDim2.new(0.92, 0, 0.7, 0),
	BackgroundColor3 = C.panel,
	Visible = false,
}, {
	corner(16),
	stroke(Color3.new(0, 0, 0), 3),
	new("UISizeConstraint", { MaxSize = Vector2.new(460, 440) }),
})
local panelTitle = label({ Parent = panel, Size = UDim2.new(1, -70, 0, 40), Position = UDim2.fromOffset(14, 8), Text = "", TextXAlignment = Enum.TextXAlignment.Left })
button({
	Parent = panel,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -10, 0, 10),
	Size = UDim2.fromOffset(36, 36),
	BackgroundColor3 = C.red,
	Text = "X",
}, function()
	panel.Visible = false
end)
local list = new("ScrollingFrame", {
	Parent = panel,
	Position = UDim2.fromOffset(10, 56),
	Size = UDim2.new(1, -20, 1, -66),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 6,
	CanvasSize = UDim2.new(),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, { new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }) })

local currentPanel = nil

local function clearList()
	for _, child in ipairs(list:GetChildren()) do
		if not child:IsA("UIListLayout") then
			child:Destroy()
		end
	end
end

local order = 0
local function row(height, color)
	order = order + 1
	return new("Frame", {
		Parent = list,
		Size = UDim2.new(1, -8, 0, height or 64),
		BackgroundColor3 = color or C.row,
		LayoutOrder = order,
	}, { corner(10) })
end

local function header(text)
	local r = row(30, C.panel)
	label({ Parent = r, Size = UDim2.fromScale(1, 1), Text = text, TextColor3 = C.gold })
end

local function sendRequest(action, arg)
	local ok, result = pcall(function()
		return Request:InvokeServer(action, arg)
	end)
	if ok and type(result) == "table" then
		toast(result.msg, result.ok and "success" or "error")
	end
end

-- строка «текст слева + кнопка справа»
local function itemRow(title, subtitle, buttonText, buttonColor, onClick, titleColor)
	local r = row(64)
	label({ Parent = r, Position = UDim2.fromOffset(10, 4), Size = UDim2.new(0.62, -10, 0, 30), Text = title, TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = titleColor or C.white })
	label({ Parent = r, Position = UDim2.fromOffset(10, 34), Size = UDim2.new(0.62, -10, 0, 24), Text = subtitle, TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = Color3.fromRGB(200, 200, 215) })
	if buttonText then
		button({
			Parent = r,
			AnchorPoint = Vector2.new(1, 0.5),
			Position = UDim2.new(1, -8, 0.5, 0),
			Size = UDim2.new(0.36, -8, 0, 44),
			BackgroundColor3 = buttonColor or C.green,
			Text = buttonText,
		}, onClick or function() end)
	end
	return r
end

local builders = {}

local function upgradePanel(kind)
	local def = Config.Upgrades[kind]
	local level = player:GetAttribute(kind == "Speed" and "SpeedLevel" or "StaminaLevel") or 0
	local wing = player:GetAttribute("Wing") or 1
	local pass = player:GetAttribute("Pass_StaminaBoost") == true
	local function describe(l)
		if kind == "Speed" then
			return "Бег " .. math.floor(Config.walkSpeed(l)) .. " · Полёт " .. math.floor(Config.flySpeed(l))
		end
		return string.format("%.1f сек полёта", Config.maxStamina(l, wing, pass))
	end
	header(def.title .. ": уровень " .. level .. " / " .. def.maxLevel)
	itemRow("Сейчас", describe(level), nil)
	if level >= def.maxLevel then
		itemRow("Максимум!", "Сильнее уже некуда", nil)
	else
		local cost = Config.upgradeCost(kind, level)
		local money = player:GetAttribute("Money") or 0
		itemRow("Уровень " .. (level + 1), describe(level + 1), Config.formatMoney(cost), money >= cost and C.green or C.grey, function()
			sendRequest("BuyUpgrade", kind)
		end)
	end
end

builders.Speed = function()
	panelTitle.Text = "⚡ Скорость"
	upgradePanel("Speed")
end

builders.Stamina = function()
	panelTitle.Text = "💪 Стамина"
	upgradePanel("Stamina")
end

builders.Wings = function()
	panelTitle.Text = "🕊 Крылья"
	local current = player:GetAttribute("Wing") or 1
	local money = player:GetAttribute("Money") or 0
	for i, w in ipairs(Config.Wings) do
		local text, color
		if i == current then
			text, color = "Надеты", C.grey
		elseif i < current then
			text, color = "Куплены", C.grey
		elseif i == current + 1 then
			text, color = Config.formatMoney(w.cost), money >= w.cost and C.green or C.grey
		else
			text, color = "🔒 " .. Config.formatMoney(w.cost), C.grey
		end
		itemRow(w.name, "x" .. w.mult .. " стамина и сила полёта", text, color, function()
			sendRequest("BuyWing", i)
		end, w.color)
	end
end

builders.Market = function()
	panelTitle.Text = "💰 Рынок"
	local ok, creatures = pcall(function()
		return HttpService:JSONDecode(player:GetAttribute("Creatures") or "[]")
	end)
	if not ok then
		creatures = {}
	end
	if #creatures == 0 then
		header("На базе нет существ")
		return
	end
	local total = 0
	for _, id in ipairs(creatures) do
		total = total + Config.sellPrice(id)
	end
	local r = row(50, C.panel)
	button({ Parent = r, Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.red, Text = "Продать всех за " .. Config.formatMoney(total) }, function()
		sendRequest("SellAll")
	end)
	for slot, id in ipairs(creatures) do
		local def = Config.Creatures[id]
		if def then
			local rarity = Config.Rarities[def.rarity]
			itemRow(def.name, rarity.name .. " · " .. Config.formatMoney(def.income) .. "/сек", "Продать " .. Config.formatMoney(Config.sellPrice(id)), C.gold, function()
				sendRequest("Sell", slot)
			end, rarity.color)
		end
	end
end

builders.Donate = function()
	panelTitle.Text = "⭐ Донат-магазин"
	local income = player:GetAttribute("Income") or 0
	header("Деньги")
	for _, key in ipairs(Config.ProductOrder) do
		local def = Config.Products[key]
		if not def.luck then
			itemRow(def.title, "+" .. Config.formatMoney(Config.productAmount(key, income)), "R$ " .. def.price, C.green, function()
				sendRequest("BuyProduct", key)
			end, C.gold)
		end
	end
	header("Бусты")
	for _, key in ipairs(Config.ProductOrder) do
		local def = Config.Products[key]
		if def.luck then
			itemRow(def.title, "Больше редких существ для всех на сервере", "R$ " .. def.price, C.green, function()
				sendRequest("BuyProduct", key)
			end, Color3.fromRGB(120, 255, 120))
		end
	end
	header("Game Pass (навсегда)")
	for _, key in ipairs(Config.GamePassOrder) do
		local def = Config.GamePasses[key]
		local owned = player:GetAttribute("Pass_" .. key) == true
		itemRow(def.title, def.desc, owned and "Куплено" or ("R$ " .. def.price), owned and C.grey or C.pink, function()
			if not owned then
				sendRequest("BuyPass", key)
			end
		end)
	end
end

local function rebuild()
	if not currentPanel or not panel.Visible then
		return
	end
	local y = list.CanvasPosition
	clearList()
	order = 0
	builders[currentPanel]()
	list.CanvasPosition = y
end

local function openPanel(name)
	if not builders[name] then
		return
	end
	currentPanel = name
	panel.Visible = true
	list.CanvasPosition = Vector2.zero
	rebuild()
end

Remotes:WaitForChild("OpenPanel").OnClientEvent:Connect(openPanel)

-- кнопка доната слева
button({
	Parent = gui,
	AnchorPoint = Vector2.new(0, 0.5),
	Position = UDim2.new(0, 10, 0.5, 0),
	Size = UDim2.fromOffset(110, 46),
	BackgroundColor3 = C.pink,
	Text = "⭐ Магазин",
}, function()
	if panel.Visible and currentPanel == "Donate" then
		panel.Visible = false
	else
		openPanel("Donate")
	end
end)

-- обновлять окно при изменении данных
for _, attr in ipairs({ "Money", "SpeedLevel", "StaminaLevel", "Wing", "Creatures", "Income" }) do
	player:GetAttributeChangedSignal(attr):Connect(function()
		if attr == "Money" and currentPanel == "Donate" then
			return
		end
		rebuild()
	end)
end
for key in pairs(Config.GamePasses) do
	player:GetAttributeChangedSignal("Pass_" .. key):Connect(rebuild)
end

---------------------------------------------------------------------
-- обновление HUD
---------------------------------------------------------------------
local function formatTime(sec)
	sec = math.max(0, math.floor(sec))
	return string.format("%d:%02d", math.floor(sec / 60), sec % 60)
end

local acc = 0
RunService.RenderStepped:Connect(function(dt)
	moneyLabel.Text = Config.formatMoney(player:GetAttribute("Money") or 0)
	local pending = player:GetAttribute("Pending") or 0
	incomeLabel.Text = "+" .. Config.formatMoney(player:GetAttribute("Income") or 0) .. "/сек"
		.. (pending > 0 and ("  ·  на базе " .. Config.formatMoney(pending)) or "")

	local frac = player:GetAttribute("StaminaFrac") or 1
	staminaFill.Size = UDim2.fromScale(math.clamp(frac, 0, 1), 1)
	staminaFill.BackgroundColor3 = frac > 0.3 and Color3.fromRGB(90, 200, 255) or Color3.fromRGB(255, 90, 90)
	staminaText.Text = string.format("Стамина %.1f / %.1f", player:GetAttribute("StaminaValue") or 0, player:GetAttribute("StaminaMax") or 0)

	local carrying = player:GetAttribute("Carrying") or ""
	if carrying ~= "" and Config.Creatures[carrying] then
		carryLabel.Text = "Несёшь: " .. Config.Creatures[carrying].name .. " → лети на базу!"
	else
		carryLabel.Text = ""
	end

	acc = acc + dt
	if acc < 0.25 then
		return
	end
	acc = 0
	local t = workspace:GetServerTimeNow()
	if workspace:GetAttribute("DivinePresent") then
		divineLabel.Text = "✨ Божественный на Острове 7!"
	else
		local nextT = workspace:GetAttribute("DivineNextSpawn") or t
		divineLabel.Text = "✨ Божественный через " .. formatTime(nextT - t)
	end
	local luck = (workspace:GetAttribute("LuckUntil") or 0) - t
	luckLabel.Text = luck > 0 and ("🍀 Удача сервера " .. formatTime(luck)) or ""

	-- закрыть окно станции, если отошёл
	if panel.Visible and currentPanel and currentPanel ~= "Donate" then
		local char = player.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		local map = workspace:FindFirstChild("Map")
		local station = map and map:FindFirstChild(currentPanel)
		local kiosk = station and station:FindFirstChild("Kiosk")
		if root and kiosk and (root.Position - kiosk.Position).Magnitude > 28 then
			panel.Visible = false
		end
	end
end)

-- подсказка при входе
task.delay(3, function()
	toast("Держи ПРОБЕЛ в прыжке, чтобы лететь!", "info")
	task.wait(1)
	toast("Хватай существ на островах и неси на базу", "info")
	task.wait(1)
	toast("Наступи на зелёную кнопку у подиума — заберёшь $", "info")
end)

-- метка «Твоя база», видна издалека (только тебе)
local function markBase()
	local index = player:GetAttribute("PlotIndex")
	if not index then
		return
	end
	local map = workspace:WaitForChild("Map")
	local plot = map:WaitForChild("Plot" .. index)
	local beacon = plot:WaitForChild("Beacon")
	local old = beacon:FindFirstChild("MyBase")
	if old then
		old:Destroy()
	end
	local bb = new("BillboardGui", {
		Name = "MyBase",
		Parent = beacon,
		Adornee = beacon,
		Size = UDim2.fromOffset(170, 44),
		StudsOffset = Vector3.new(0, 18, 0),
		AlwaysOnTop = true,
		MaxDistance = 6000,
		LightInfluence = 0,
	})
	new("Frame", { Parent = bb, Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.green }, { corner(12), stroke(C.white, 2) })
	label({ Parent = bb, Size = UDim2.new(1, -10, 1, -6), Position = UDim2.fromOffset(5, 3), Text = "🏠 ТВОЯ БАЗА", ZIndex = 2 })
end
player:GetAttributeChangedSignal("PlotIndex"):Connect(markBase)
task.spawn(markBase)
