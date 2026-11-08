-- UIController: интерфейс в стиле ярких симуляторов.
-- Деньги сверху, меню слева, таймер справа, стамина снизу,
-- окна магазинов с карточками, вкладками и анимациями.

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
local TITLE_FONT = Enum.Font.LuckiestGuy

local function rgb(r, g, b)
	return Color3.fromRGB(r, g, b)
end

local C = {
	white = rgb(255, 255, 255),
	black = rgb(0, 0, 0),
	green = rgb(60, 220, 90),
	greenDark = rgb(30, 160, 60),
	grey = rgb(150, 150, 165),
	greyDark = rgb(95, 95, 110),
	gold = rgb(255, 210, 50),
	goldDark = rgb(240, 150, 20),
	red = rgb(255, 70, 70),
	redDark = rgb(190, 30, 40),
	pink = rgb(255, 90, 200),
	pinkDark = rgb(190, 40, 160),
	blue = rgb(70, 170, 255),
	blueDark = rgb(30, 100, 220),
	panel = rgb(255, 250, 240),
	panelDark = rgb(235, 225, 210),
}

local THEMES = {
	Speed = { title = "⚡ СКОРОСТЬ", a = rgb(255, 210, 50), b = rgb(255, 140, 20) },
	Stamina = { title = "💪 СТАМИНА", a = rgb(90, 230, 120), b = rgb(30, 160, 80) },
	Wings = { title = "🕊 КРЫЛЬЯ", a = rgb(110, 190, 255), b = rgb(50, 110, 240) },
	Market = { title = "💰 РЫНОК", a = rgb(255, 160, 70), b = rgb(240, 90, 40) },
	Donate = { title = "⭐ МАГАЗИН", a = rgb(255, 110, 210), b = rgb(170, 70, 255) },
	Index = { title = "📖 ИНДЕКС", a = rgb(120, 220, 255), b = rgb(90, 120, 255) },
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
	return new("UICorner", { CornerRadius = UDim.new(0, r or 12) })
end

local function stroke(t, color)
	return new("UIStroke", { Color = color or C.black, Thickness = t or 3, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

local function gradient(a, b, rot)
	return new("UIGradient", { Color = ColorSequence.new(a, b), Rotation = rot or 90 })
end

local function label(props)
	props.BackgroundTransparency = props.BackgroundTransparency or 1
	props.Font = props.Font or FONT
	props.TextColor3 = props.TextColor3 or C.white
	if props.TextScaled == nil then
		props.TextScaled = true
	end
	local strokeT = props.StrokeT or 2
	props.StrokeT = nil
	return new("TextLabel", props, { new("UIStroke", { Thickness = strokeT, Color = C.black }) })
end

-- кнопка с градиентом, обводкой и «пружинкой» при нажатии
local function button(props, onClick)
	local a, b = props.ColorA or C.green, props.ColorB or C.greenDark
	props.ColorA, props.ColorB = nil, nil
	props.BackgroundColor3 = C.white
	props.AutoButtonColor = false
	props.Text = ""
	local text = props.Label or ""
	props.Label = nil
	local textSize = props.TextHeight or 0.75
	props.TextHeight = nil
	local btn = new("TextButton", props, { corner(10), stroke(3), gradient(a, b) })
	local scale = new("UIScale", { Parent = btn })
	label({
		Parent = btn,
		Name = "Caption",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromScale(0.9, textSize),
		Text = text,
	})
	btn.MouseEnter:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.1), { Scale = 1.06 }):Play()
	end)
	btn.MouseLeave:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.1), { Scale = 1 }):Play()
	end)
	btn.MouseButton1Down:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.06), { Scale = 0.92 }):Play()
	end)
	btn.MouseButton1Up:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.12, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	end)
	btn.MouseButton1Click:Connect(onClick)
	return btn
end

local function decode(attr)
	local ok, v = pcall(function()
		return HttpService:JSONDecode(player:GetAttribute(attr) or "[]")
	end)
	return ok and v or {}
end

---------------------------------------------------------------------
-- экран
---------------------------------------------------------------------
local gui = new("ScreenGui", {
	Name = "GameUI",
	ResetOnSpawn = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	Parent = playerGui,
})
local uiScale = new("UIScale", { Parent = gui })
local function updateScale()
	local cam = workspace.CurrentCamera
	if cam then
		local v = cam.ViewportSize
		uiScale.Scale = math.clamp(math.min(v.X / 1100, v.Y / 720), 0.55, 1.15)
	end
end
updateScale()
workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(updateScale)

-- деньги сверху
local moneyPill = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 10),
	Size = UDim2.fromOffset(300, 58),
	BackgroundColor3 = C.white,
}, { corner(29), stroke(4), gradient(rgb(110, 230, 110), rgb(40, 170, 70)) })
label({ Parent = moneyPill, Position = UDim2.fromOffset(6, 4), Size = UDim2.fromOffset(50, 50), Text = "💵", StrokeT = 0 })
local moneyLabel = label({ Parent = moneyPill, Position = UDim2.fromOffset(58, 6), Size = UDim2.new(1, -70, 1, -12), Text = "$0", Font = TITLE_FONT, TextXAlignment = Enum.TextXAlignment.Left, StrokeT = 3 })

local chips = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 72),
	Size = UDim2.fromOffset(420, 28),
	BackgroundTransparency = 1,
}, { new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Center, Padding = UDim.new(0, 8) }) })
local function chip(a, b)
	local f = new("Frame", { Parent = chips, Size = UDim2.fromOffset(160, 28), BackgroundColor3 = C.white }, { corner(14), stroke(3), gradient(a, b) })
	return label({ Parent = f, Position = UDim2.fromOffset(8, 3), Size = UDim2.new(1, -16, 1, -6), Text = "" })
end
local incomeLabel = chip(rgb(255, 220, 80), rgb(255, 160, 30))
local pendingLabel = chip(rgb(120, 200, 255), rgb(60, 120, 240))

-- справа: божественный и удача
local divineCard = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 10),
	Size = UDim2.fromOffset(230, 62),
	BackgroundColor3 = C.white,
}, { corner(14), stroke(3), gradient(rgb(255, 230, 110), rgb(255, 140, 60)) })
label({ Parent = divineCard, Position = UDim2.fromOffset(6, 6), Size = UDim2.fromOffset(50, 50), Text = "✨", StrokeT = 0 })
label({ Parent = divineCard, Position = UDim2.fromOffset(58, 6), Size = UDim2.new(1, -64, 0, 22), Text = "БОЖЕСТВЕННЫЙ", Font = TITLE_FONT, TextXAlignment = Enum.TextXAlignment.Left })
local divineLabel = label({ Parent = divineCard, Position = UDim2.fromOffset(58, 30), Size = UDim2.new(1, -64, 0, 24), Text = "", TextXAlignment = Enum.TextXAlignment.Left })

local luckCard = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 80),
	Size = UDim2.fromOffset(230, 40),
	BackgroundColor3 = C.white,
	Visible = false,
}, { corner(12), stroke(3), gradient(rgb(140, 255, 140), rgb(40, 180, 80)) })
local luckLabel = label({ Parent = luckCard, Position = UDim2.fromOffset(8, 5), Size = UDim2.new(1, -16, 1, -10), Text = "" })

-- стамина снизу
local staminaBack = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -16),
	Size = UDim2.fromOffset(380, 34),
	BackgroundColor3 = rgb(40, 40, 60),
}, { corner(17), stroke(4) })
local staminaFill = new("Frame", {
	Parent = staminaBack,
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = C.white,
}, { corner(17), gradient(rgb(120, 230, 255), rgb(40, 140, 255)) })
local staminaGrad = staminaFill:FindFirstChildOfClass("UIGradient")
label({ Parent = staminaBack, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0, 0, 0.5, 0), Size = UDim2.fromOffset(46, 46), Text = "🕊", StrokeT = 0, ZIndex = 3 })
local staminaText = label({ Parent = staminaBack, Position = UDim2.fromOffset(30, 4), Size = UDim2.new(1, -40, 1, -8), Text = "", ZIndex = 2 })

-- что несу
local carryPill = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -60),
	Size = UDim2.fromOffset(420, 36),
	BackgroundColor3 = C.white,
	Visible = false,
}, { corner(18), stroke(3), gradient(rgb(255, 220, 90), rgb(255, 150, 40)) })
local carryLabel = label({ Parent = carryPill, Position = UDim2.fromOffset(10, 5), Size = UDim2.new(1, -20, 1, -10), Text = "" })

---------------------------------------------------------------------
-- уведомления (выезжают сверху)
---------------------------------------------------------------------
local toastHolder = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 108),
	Size = UDim2.fromOffset(480, 260),
	BackgroundTransparency = 1,
}, { new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Center }) })

local TOASTS = {
	info = { rgb(110, 190, 255), rgb(50, 110, 240) },
	success = { rgb(110, 230, 110), rgb(40, 170, 70) },
	error = { rgb(255, 110, 110), rgb(200, 40, 50) },
	announce = { rgb(200, 140, 255), rgb(130, 70, 240) },
	divine = { rgb(255, 230, 110), rgb(255, 140, 40) },
}

local function toast(text, kind)
	if not text or text == "" then
		return
	end
	local colors = TOASTS[kind] or TOASTS.info
	local holder = new("Frame", { Parent = toastHolder, Size = UDim2.fromOffset(460, 40), BackgroundTransparency = 1 })
	local f = new("Frame", {
		Parent = holder,
		Size = UDim2.fromScale(1, 1),
		Position = UDim2.fromOffset(0, -30),
		BackgroundColor3 = C.white,
		BackgroundTransparency = 0,
	}, { corner(14), stroke(3), gradient(colors[1], colors[2]) })
	label({ Parent = f, Position = UDim2.fromOffset(10, 5), Size = UDim2.new(1, -20, 1, -10), Text = text })
	TweenService:Create(f, TweenInfo.new(0.25, Enum.EasingStyle.Back), { Position = UDim2.fromOffset(0, 0) }):Play()
	task.delay(kind == "divine" and 6 or 3, function()
		local tw = TweenService:Create(f, TweenInfo.new(0.25), { Position = UDim2.fromOffset(0, -20), BackgroundTransparency = 1 })
		tw:Play()
		tw.Completed:Wait()
		holder:Destroy()
	end)
end

Remotes:WaitForChild("Notify").OnClientEvent:Connect(toast)

local function sendRequest(action, arg)
	local ok, result = pcall(function()
		return Request:InvokeServer(action, arg)
	end)
	if ok and type(result) == "table" then
		toast(result.msg, result.ok and "success" or "error")
	end
end

---------------------------------------------------------------------
-- окно магазина
---------------------------------------------------------------------
local window = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.53),
	Size = UDim2.fromOffset(640, 470),
	BackgroundColor3 = C.panel,
	Visible = false,
}, { corner(22), stroke(5) })
local windowScale = new("UIScale", { Parent = window })

local header = new("Frame", {
	Parent = window,
	Size = UDim2.new(1, 0, 0, 64),
	BackgroundColor3 = C.white,
}, { corner(22), stroke(0) })
local headerGrad = gradient(C.gold, C.goldDark)
headerGrad.Parent = header
-- нижняя часть шапки без скругления
local headerFill = new("Frame", { Parent = header, Position = UDim2.new(0, 0, 1, -22), Size = UDim2.new(1, 0, 0, 22), BackgroundColor3 = C.white, BorderSizePixel = 0 })
local headerFillGrad = gradient(C.gold, C.goldDark)
headerFillGrad.Parent = headerFill
local titleLabel = label({ Parent = header, Position = UDim2.fromOffset(20, 8), Size = UDim2.new(1, -110, 1, -16), Text = "", Font = TITLE_FONT, TextXAlignment = Enum.TextXAlignment.Left, StrokeT = 3 })

button({
	Parent = window,
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.new(1, -14, 0, 14),
	Size = UDim2.fromOffset(52, 52),
	ColorA = C.red,
	ColorB = C.redDark,
	Label = "X",
	ZIndex = 5,
}, function()
	window.Visible = false
end)

-- вкладки
local tabsBar = new("Frame", {
	Parent = window,
	Position = UDim2.fromOffset(16, 74),
	Size = UDim2.new(1, -32, 0, 40),
	BackgroundTransparency = 1,
}, { new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8) }) })

local content = new("ScrollingFrame", {
	Parent = window,
	Position = UDim2.fromOffset(16, 122),
	Size = UDim2.new(1, -32, 1, -138),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 8,
	ScrollBarImageColor3 = rgb(120, 110, 100),
	CanvasSize = UDim2.new(),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
})

local currentPanel = nil
local currentTab = {}
local rebuildRef = function() end
local order = 0

local function clear()
	for _, child in ipairs(content:GetChildren()) do
		child:Destroy()
	end
	for _, child in ipairs(tabsBar:GetChildren()) do
		if not child:IsA("UIListLayout") then
			child:Destroy()
		end
	end
	order = 0
end

local function useGrid(cellX, cellY)
	new("UIGridLayout", {
		Parent = content,
		CellSize = UDim2.fromOffset(cellX or 142, cellY or 186),
		CellPadding = UDim2.fromOffset(10, 10),
		SortOrder = Enum.SortOrder.LayoutOrder,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
	})
	new("UIPadding", { Parent = content, PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) })
end

local function useList()
	new("UIListLayout", { Parent = content, Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder, HorizontalAlignment = Enum.HorizontalAlignment.Center })
	new("UIPadding", { Parent = content, PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) })
end

local function nextOrder()
	order = order + 1
	return order
end

-- карточка: иконка, название, подпись, кнопка
local function card(opts)
	local f = new("Frame", {
		Parent = content,
		BackgroundColor3 = C.white,
		LayoutOrder = nextOrder(),
	}, { corner(16), stroke(3), gradient(opts.a or rgb(255, 255, 255), opts.b or rgb(220, 220, 230)) })
	label({ Parent = f, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 6), Size = UDim2.new(1, -12, 0, 22), Text = opts.top or "", TextColor3 = opts.topColor or C.white })
	label({ Parent = f, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 28), Size = UDim2.fromOffset(64, 56), Text = opts.icon or "❔", StrokeT = 0 })
	label({ Parent = f, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 86), Size = UDim2.new(1, -12, 0, 24), Text = opts.title or "" })
	label({ Parent = f, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 110), Size = UDim2.new(1, -12, 0, 20), Text = opts.subtitle or "", TextColor3 = opts.subColor or rgb(255, 255, 210) })
	if opts.button then
		button({
			Parent = f,
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -8),
			Size = UDim2.new(1, -16, 0, 40),
			ColorA = opts.button.a,
			ColorB = opts.button.b,
			Label = opts.button.text,
		}, opts.button.onClick or function() end)
	end
	if opts.locked then
		local shade = new("Frame", { Parent = f, Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.black, BackgroundTransparency = 0.55, ZIndex = 3 }, { corner(16) })
		label({ Parent = shade, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.4), Size = UDim2.fromOffset(60, 60), Text = "🔒", StrokeT = 0, ZIndex = 4 })
	end
	return f
end

local function tab(panel, key, text)
	local active = currentTab[panel] == key
	button({
		Parent = tabsBar,
		Size = UDim2.fromOffset(150, 40),
		ColorA = active and C.blue or C.grey,
		ColorB = active and C.blueDark or C.greyDark,
		Label = text,
	}, function()
		currentTab[panel] = key
		rebuildRef()
	end)
end

local GREEN = { C.green, C.greenDark }
local GREY = { C.grey, C.greyDark }
local GOLD = { C.gold, C.goldDark }
local PINK = { C.pink, C.pinkDark }
local function btn(text, colors, onClick)
	return { text = text, a = colors[1], b = colors[2], onClick = onClick }
end

local builders = {}

-- прокачка скорости / стамины: большая карточка «сейчас → потом»
local function upgradePanel(kind, icon)
	useList()
	local def = Config.Upgrades[kind]
	local level = player:GetAttribute(kind == "Speed" and "SpeedLevel" or "StaminaLevel") or 0
	local wing = player:GetAttribute("Wing") or 1
	local pass = player:GetAttribute("Pass_StaminaBoost") == true
	local money = player:GetAttribute("Money") or 0
	local theme = THEMES[kind]
	local function describe(l)
		if kind == "Speed" then
			return string.format("🏃 %d   ✈ %d", math.floor(Config.walkSpeed(l)), math.floor(Config.flySpeed(l)))
		end
		return string.format("%.1f сек полёта", Config.maxStamina(l, wing, pass))
	end

	local big = new("Frame", { Parent = content, Size = UDim2.new(1, -12, 0, 210), BackgroundColor3 = C.white, LayoutOrder = nextOrder() }, {
		corner(18),
		stroke(3),
		gradient(theme.a, theme.b),
	})
	label({ Parent = big, Position = UDim2.fromOffset(16, 12), Size = UDim2.fromOffset(90, 90), Text = icon, StrokeT = 0 })
	label({ Parent = big, Position = UDim2.fromOffset(120, 14), Size = UDim2.new(1, -140, 0, 34), Text = "УРОВЕНЬ " .. level .. " / " .. def.maxLevel, Font = TITLE_FONT, TextXAlignment = Enum.TextXAlignment.Left, StrokeT = 3 })
	local nextText = level >= def.maxLevel and "МАКСИМУМ!" or (describe(level) .. "  ➜  " .. describe(level + 1))
	label({ Parent = big, Position = UDim2.fromOffset(120, 54), Size = UDim2.new(1, -140, 0, 30), Text = nextText, TextXAlignment = Enum.TextXAlignment.Left })
	-- полоска уровня
	local bar = new("Frame", { Parent = big, Position = UDim2.fromOffset(120, 92), Size = UDim2.new(1, -140, 0, 18), BackgroundColor3 = rgb(40, 40, 60) }, { corner(9), stroke(2) })
	new("Frame", { Parent = bar, Size = UDim2.fromScale(level / def.maxLevel, 1), BackgroundColor3 = C.white }, { corner(9), gradient(rgb(255, 255, 160), rgb(255, 200, 40)) })

	if level < def.maxLevel then
		local cost = Config.upgradeCost(kind, level)
		local can = money >= cost
		button({
			Parent = big,
			Position = UDim2.new(0, 16, 1, -80),
			Size = UDim2.new(0.6, -24, 0, 64),
			ColorA = can and C.green or C.grey,
			ColorB = can and C.greenDark or C.greyDark,
			Label = "КУПИТЬ  " .. Config.formatMoney(cost),
		}, function()
			sendRequest("BuyUpgrade", kind)
		end)
		button({
			Parent = big,
			Position = UDim2.new(0.6, 0, 1, -80),
			Size = UDim2.new(0.4, -16, 0, 64),
			ColorA = can and C.gold or C.grey,
			ColorB = can and C.goldDark or C.greyDark,
			Label = "МАКС",
		}, function()
			sendRequest("BuyUpgradeMax", kind)
		end)
	end
	local tip = new("Frame", { Parent = content, Size = UDim2.new(1, -12, 0, 44), BackgroundColor3 = C.panelDark, LayoutOrder = nextOrder() }, { corner(12) })
	label({
		Parent = tip,
		Position = UDim2.fromOffset(12, 6),
		Size = UDim2.new(1, -24, 1, -12),
		Text = kind == "Speed" and "Быстрее бегаешь и летаешь — с существом в руках скорость x" .. Config.CarrySpeedMult
			or "Больше стамины — дальше долетишь. Крылья умножают стамину!",
		TextColor3 = rgb(90, 80, 70),
		StrokeT = 0,
	})
end

builders.Speed = function()
	upgradePanel("Speed", "⚡")
end

builders.Stamina = function()
	upgradePanel("Stamina", "💪")
end

builders.Wings = function()
	useGrid(142, 196)
	local current = player:GetAttribute("Wing") or 1
	local money = player:GetAttribute("Money") or 0
	for i, w in ipairs(Config.Wings) do
		local b
		if i == current then
			b = btn("НАДЕТЫ", GREY)
		elseif i < current then
			b = btn("КУПЛЕНЫ", GREY)
		elseif i == current + 1 then
			b = btn(Config.formatMoney(w.cost), money >= w.cost and GREEN or GREY, function()
				sendRequest("BuyWing", i)
			end)
		else
			b = btn(Config.formatMoney(w.cost), GREY)
		end
		card({
			a = w.color:Lerp(C.white, 0.2),
			b = w.color:Lerp(C.black, 0.25),
			top = "x" .. w.mult,
			topColor = C.gold,
			icon = i >= 6 and "🌟" or (i >= 4 and "🔥" or "🕊"),
			title = w.name,
			subtitle = "стамина и полёт",
			button = b,
			locked = i > current + 1,
		})
	end
end

builders.Market = function()
	local creatures = decode("Creatures")
	if #creatures == 0 then
		useList()
		local f = new("Frame", { Parent = content, Size = UDim2.new(1, -12, 0, 120), BackgroundColor3 = C.panelDark, LayoutOrder = nextOrder() }, { corner(16) })
		label({ Parent = f, Position = UDim2.fromOffset(12, 12), Size = UDim2.new(1, -24, 1, -24), Text = "На базе пока нет существ.\nЛети на остров и принеси первое!", TextColor3 = rgb(90, 80, 70), StrokeT = 0 })
		return
	end
	local total = 0
	for _, id in ipairs(creatures) do
		total = total + Config.sellPrice(id)
	end
	button({
		Parent = tabsBar,
		Size = UDim2.fromOffset(300, 40),
		ColorA = C.red,
		ColorB = C.redDark,
		Label = "ПРОДАТЬ ВСЕХ  " .. Config.formatMoney(total),
	}, function()
		sendRequest("SellAll")
	end)
	useGrid(142, 196)
	for slot, id in ipairs(creatures) do
		local def = Config.Creatures[id]
		if def then
			local rarity = Config.Rarities[def.rarity]
			card({
				a = rarity.color:Lerp(C.white, 0.2),
				b = rarity.color:Lerp(C.black, 0.35),
				top = rarity.name,
				icon = def.icon or "🐾",
				title = def.name,
				subtitle = Config.formatMoney(def.income) .. "/сек",
				button = btn("ПРОДАТЬ " .. Config.formatMoney(Config.sellPrice(id)), GOLD, function()
					sendRequest("Sell", slot)
				end),
			})
		end
	end
end

builders.Index = function()
	local found = {}
	for _, id in ipairs(decode("Discovered")) do
		found[id] = true
	end
	local ids = {}
	for id in pairs(Config.Creatures) do
		table.insert(ids, id)
	end
	table.sort(ids, function(x, y)
		local a, b = Config.Creatures[x], Config.Creatures[y]
		if a.rarity ~= b.rarity then
			return a.rarity < b.rarity
		end
		return a.income < b.income
	end)
	local count = 0
	for _, id in ipairs(ids) do
		if found[id] then
			count = count + 1
		end
	end
	local info = new("Frame", { Parent = tabsBar, Size = UDim2.fromOffset(300, 40), BackgroundColor3 = C.white }, { corner(12), stroke(3), gradient(C.blue, C.blueDark) })
	label({ Parent = info, Position = UDim2.fromOffset(10, 5), Size = UDim2.new(1, -20, 1, -10), Text = "Собрано " .. count .. " / " .. #ids })
	useGrid(142, 150)
	for _, id in ipairs(ids) do
		local def = Config.Creatures[id]
		local rarity = Config.Rarities[def.rarity]
		local known = found[id]
		card({
			a = known and rarity.color:Lerp(C.white, 0.2) or rgb(120, 120, 130),
			b = known and rarity.color:Lerp(C.black, 0.35) or rgb(60, 60, 70),
			top = rarity.name,
			icon = known and (def.icon or "🐾") or "❔",
			title = known and def.name or "???",
			subtitle = known and (Config.formatMoney(def.income) .. "/сек") or "ещё не найден",
		})
	end
end

builders.Donate = function()
	currentTab.Donate = currentTab.Donate or "money"
	tab("Donate", "money", "💵 Деньги")
	tab("Donate", "boost", "🍀 Бусты")
	tab("Donate", "pass", "⭐ Game Pass")
	useGrid(142, 196)
	local t = currentTab.Donate
	local income = player:GetAttribute("Income") or 0
	if t == "money" then
		local icons = { MoneySmall = "💰", MoneyMedium = "💼", MoneyLarge = "🧰", MoneyHuge = "🏦" }
		for _, key in ipairs(Config.ProductOrder) do
			local def = Config.Products[key]
			if not def.luck then
				card({
					a = rgb(130, 240, 130),
					b = rgb(30, 160, 70),
					top = def.title,
					icon = icons[key] or "💵",
					title = "+" .. Config.formatMoney(Config.productAmount(key, income)),
					subtitle = "растёт с доходом",
					button = btn("R$ " .. def.price, PINK, function()
						sendRequest("BuyProduct", key)
					end),
				})
			end
		end
	elseif t == "boost" then
		for _, key in ipairs(Config.ProductOrder) do
			local def = Config.Products[key]
			if def.luck then
				card({
					a = rgb(170, 255, 150),
					b = rgb(40, 170, 90),
					top = "15 минут",
					icon = "🍀",
					title = "Удача сервера",
					subtitle = "x3 шанс редких",
					button = btn("R$ " .. def.price, PINK, function()
						sendRequest("BuyProduct", key)
					end),
				})
			end
		end
	else
		local icons = { GoldName = "👑", DoubleMoney = "💸", ExtraSlots = "🏠", StaminaBoost = "⚡", VIP = "💎" }
		for _, key in ipairs(Config.GamePassOrder) do
			local def = Config.GamePasses[key]
			local owned = player:GetAttribute("Pass_" .. key) == true
			card({
				a = rgb(255, 150, 230),
				b = rgb(150, 70, 240),
				top = owned and "✅ КУПЛЕНО" or "НАВСЕГДА",
				icon = icons[key] or "⭐",
				title = def.title,
				subtitle = def.desc,
				button = owned and btn("КУПЛЕНО", GREY) or btn("R$ " .. def.price, GREEN, function()
					sendRequest("BuyPass", key)
				end),
			})
		end
	end
end

local function rebuild()
	if not currentPanel or not window.Visible then
		return
	end
	local y = content.CanvasPosition
	clear()
	builders[currentPanel]()
	content.CanvasPosition = y
end
rebuildRef = rebuild

local function openPanel(name)
	if not builders[name] then
		return
	end
	local theme = THEMES[name]
	titleLabel.Text = theme.title
	headerGrad.Color = ColorSequence.new(theme.a, theme.b)
	headerFillGrad.Color = ColorSequence.new(theme.a, theme.b)
	local wasOpen = window.Visible and currentPanel == name
	currentPanel = name
	window.Visible = true
	content.CanvasPosition = Vector2.zero
	rebuild()
	if not wasOpen then
		windowScale.Scale = 0.6
		TweenService:Create(windowScale, TweenInfo.new(0.25, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	end
end

Remotes:WaitForChild("OpenPanel").OnClientEvent:Connect(openPanel)

---------------------------------------------------------------------
-- меню слева
---------------------------------------------------------------------
local menu = new("Frame", {
	Parent = gui,
	AnchorPoint = Vector2.new(0, 0.5),
	Position = UDim2.new(0, 12, 0.5, 0),
	Size = UDim2.fromOffset(84, 300),
	BackgroundTransparency = 1,
}, { new("UIListLayout", { Padding = UDim.new(0, 10), VerticalAlignment = Enum.VerticalAlignment.Center }) })

local function menuButton(icon, text, a, b, onClick)
	local holder = new("Frame", { Parent = menu, Size = UDim2.fromOffset(84, 84), BackgroundTransparency = 1 })
	local bt = button({ Parent = holder, Size = UDim2.fromOffset(78, 78), ColorA = a, ColorB = b, Label = icon, TextHeight = 0.6 }, onClick)
	local caption = bt:FindFirstChild("Caption")
	caption.Position = UDim2.fromScale(0.5, 0.42)
	caption:FindFirstChildOfClass("UIStroke").Thickness = 0
	label({ Parent = bt, AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -2), Size = UDim2.new(1, -6, 0, 20), Text = text })
	return bt
end

local function toggle(name)
	if window.Visible and currentPanel == name then
		window.Visible = false
	else
		openPanel(name)
	end
end

menuButton("⭐", "Магазин", C.pink, C.pinkDark, function()
	toggle("Donate")
end)
menuButton("📖", "Индекс", C.blue, C.blueDark, function()
	toggle("Index")
end)
menuButton("🏠", "Домой", C.green, C.greenDark, function()
	sendRequest("GoHome")
end)

-- обновлять окно при изменении данных
for _, attr in ipairs({ "Money", "SpeedLevel", "StaminaLevel", "Wing", "Creatures", "Discovered" }) do
	player:GetAttributeChangedSignal(attr):Connect(function()
		if attr == "Money" and (currentPanel == "Donate" or currentPanel == "Index") then
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

local shownMoney = 0
local acc = 0
RunService.RenderStepped:Connect(function(dt)
	-- плавный счётчик денег
	local money = player:GetAttribute("Money") or 0
	shownMoney = shownMoney + (money - shownMoney) * math.min(1, dt * 10)
	if math.abs(money - shownMoney) < 1 then
		shownMoney = money
	end
	moneyLabel.Text = Config.formatMoney(shownMoney)
	incomeLabel.Text = "+" .. Config.formatMoney(player:GetAttribute("Income") or 0) .. "/сек"
	pendingLabel.Text = "🏠 " .. Config.formatMoney(player:GetAttribute("Pending") or 0)

	local frac = math.clamp(player:GetAttribute("StaminaFrac") or 1, 0, 1)
	staminaFill.Size = UDim2.fromScale(math.max(frac, 0.04), 1)
	if frac > 0.3 then
		staminaGrad.Color = ColorSequence.new(rgb(120, 230, 255), rgb(40, 140, 255))
	else
		staminaGrad.Color = ColorSequence.new(rgb(255, 140, 120), rgb(230, 40, 50))
	end
	staminaText.Text = string.format("СТАМИНА  %.1f / %.1f", player:GetAttribute("StaminaValue") or 0, player:GetAttribute("StaminaMax") or 0)

	local carrying = player:GetAttribute("Carrying") or ""
	if carrying ~= "" and Config.Creatures[carrying] then
		carryPill.Visible = true
		carryLabel.Text = "🐾 " .. Config.Creatures[carrying].name .. "  →  неси на базу!"
	else
		carryPill.Visible = false
	end

	acc = acc + dt
	if acc < 0.25 then
		return
	end
	acc = 0
	local t = workspace:GetServerTimeNow()
	if workspace:GetAttribute("DivinePresent") then
		divineLabel.Text = "на Острове 7!"
	else
		local nextT = workspace:GetAttribute("DivineNextSpawn") or t
		divineLabel.Text = "через " .. formatTime(nextT - t)
	end
	local luck = (workspace:GetAttribute("LuckUntil") or 0) - t
	luckCard.Visible = luck > 0
	if luck > 0 then
		luckLabel.Text = "🍀 Удача  " .. formatTime(luck)
	end

	-- закрыть окно станции, если отошёл
	if window.Visible and currentPanel and THEMES[currentPanel] and currentPanel ~= "Donate" and currentPanel ~= "Index" then
		local char = player.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		local map = workspace:FindFirstChild("Map")
		local station = map and map:FindFirstChild(currentPanel)
		local kiosk = station and station:FindFirstChild("Kiosk")
		if root and kiosk and (root.Position - kiosk.Position).Magnitude > 30 then
			window.Visible = false
		end
	end
end)

---------------------------------------------------------------------
-- метка «Твоя база», видна издалека (только тебе)
---------------------------------------------------------------------
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
		Size = UDim2.fromOffset(180, 46),
		StudsOffset = Vector3.new(0, 18, 0),
		AlwaysOnTop = true,
		MaxDistance = 6000,
		LightInfluence = 0,
	})
	new("Frame", { Parent = bb, Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.white }, { corner(14), stroke(3), gradient(C.green, C.greenDark) })
	label({ Parent = bb, Position = UDim2.fromOffset(6, 4), Size = UDim2.new(1, -12, 1, -8), Text = "🏠 ТВОЯ БАЗА", Font = TITLE_FONT, ZIndex = 2 })
end
player:GetAttributeChangedSignal("PlotIndex"):Connect(markBase)
task.spawn(markBase)

-- подсказки при входе
task.delay(3, function()
	toast("Держи ПРОБЕЛ в прыжке, чтобы лететь!", "info")
	task.wait(1.2)
	toast("Хватай существ на островах и неси на базу", "info")
	task.wait(1.2)
	toast("Наступи на зелёную кнопку у подиума — заберёшь $", "info")
end)
