-- Главный экран (HUD): деньги, рюкзак, сила кирки, глубина, цель,
-- кнопки слева/справа, зелья, всплывающие сообщения, кнопка «Копать» на телефоне.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))
local Locale = require(Shared:WaitForChild("Locale"))
local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)

local HUD = {}

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local gui, root
local refs = {}
local handlers = {} -- колбэки кнопок (ставит Main)
local shownCash = 0
local cashValue = nil
local toastHolder = nil

local function t(key, ...)
	return State.t(key, ...)
end

function HUD.on(name, fn)
	handlers[name] = fn
end

local function fire(name, ...)
	if handlers[name] then
		handlers[name](...)
	end
end

local function currencyRow(order, icon, color)
	local row = UIKit.frame({ Name = "Row" .. order, Transparency = 1, Size = UDim2.fromOffset(330, 46), LayoutOrder = order, Parent = refs.currency })
	UIKit.text({ Name = "Icon", Text = icon, Size = UDim2.fromOffset(44, 44), Position = UDim2.fromOffset(0, 1), Stroke = 0, Parent = row })
	local value = UIKit.text({ Name = "Value", Text = "0", Size = UDim2.new(1, -54, 1, 0), Position = UDim2.fromOffset(52, 0), Color = color, XAlign = Enum.TextXAlignment.Left, Stroke = 3.5, MaxSize = 40, Parent = row })
	return row, value
end

local function build()
	if gui then
		gui:Destroy()
	end
	refs = {}
	UIKit.lang = State.lang
	gui, root = UIKit.screen("HudGui", 5)

	-- Внизу слева: рюкзак, сила, деньги (как в топовых симуляторах)
	refs.currency = UIKit.frame({ Name = "Currency", Transparency = 1, Size = UDim2.fromOffset(330, 150), Position = UDim2.new(0, 22, 1, -14), AnchorPoint = Vector2.new(0, 1), Parent = root })
	UIKit.list(refs.currency, Enum.FillDirection.Vertical, 2, Enum.HorizontalAlignment.Left, Enum.VerticalAlignment.Bottom)
	refs.bagRow, refs.bagValue = currencyRow(1, "🎒", UIKit.BagColor)
	refs.powerRow, refs.powerValue = currencyRow(2, "⛏", UIKit.White)
	refs.cashRow, refs.cashValue = currencyRow(3, "💰", UIKit.Cash)
	refs.full = UIKit.frame({ Name = "Full", Color = UIKit.White, Size = UDim2.fromOffset(112, 30), Position = UDim2.new(0, 190, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Corner = 12, Stroke = 3, Gradient = UIKit.C.Red, Visible = false, Parent = refs.bagRow })
	UIKit.text({ Text = t("Full"), Size = UDim2.new(1, -8, 1, -6), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 18, Stroke = 2, Parent = refs.full })

	-- Слева: магазин, ребёрт, рюкзак
	local left = UIKit.frame({ Name = "Left", Transparency = 1, Size = UDim2.fromOffset(100, 340), Position = UDim2.new(0, 22, 0.5, -30), AnchorPoint = Vector2.new(0, 0.5), Parent = root })
	UIKit.list(left, Enum.FillDirection.Vertical, 14)
	refs.shopBtn = UIKit.iconButton({ Name = "Shop", Icon = "🛒", Text = t("Shop"), LayoutOrder = 1, OnClick = function() fire("Shop") end, Parent = left })
	refs.rebirthBtn = UIKit.iconButton({ Name = "Rebirth", Icon = "🔄", Text = t("Rebirth"), LayoutOrder = 2, OnClick = function() fire("Rebirth") end, Parent = left })
	refs.bagBtn = UIKit.iconButton({ Name = "Bag", Icon = "🎒", Text = t("Bag"), LayoutOrder = 3, OnClick = function() fire("Sell") end, Parent = left })

	-- Справа: премиум, награды, лифт, наверх
	local right = UIKit.frame({ Name = "Right", Transparency = 1, Size = UDim2.fromOffset(100, 460), Position = UDim2.new(1, -22, 0.5, 20), AnchorPoint = Vector2.new(1, 0.5), Parent = root })
	UIKit.list(right, Enum.FillDirection.Vertical, 12)
	refs.premiumBtn = UIKit.iconButton({ Name = "Premium", Icon = "💎", Text = t("Premium"), Colors = UIKit.C.Purple, LayoutOrder = 1, OnClick = function() fire("Premium") end, Parent = right })
	refs.rewardsBtn = UIKit.iconButton({ Name = "Rewards", Icon = "🎁", Text = t("Rewards"), LayoutOrder = 2, OnClick = function() fire("Daily") end, Parent = right })
	refs.elevatorBtn = UIKit.iconButton({ Name = "Elevator", Icon = "🛗", Text = t("Elevator"), LayoutOrder = 3, OnClick = function() fire("Elevator") end, Parent = right })
	refs.surfaceBtn = UIKit.iconButton({ Name = "Surface", Icon = "⬆", Text = t("Surface"), LayoutOrder = 4, OnClick = function() Remotes.Action:FireServer("Surface") end, Parent = right })

	-- Сверху по центру: глубина и прогресс слоя
	local depth = UIKit.frame({ Name = "Depth", Transparency = 1, Size = UDim2.fromOffset(560, 80), Position = UDim2.new(0.5, 0, 0, 6), AnchorPoint = Vector2.new(0.5, 0), Parent = root })
	refs.depthLabel = UIKit.text({ Text = "", Size = UDim2.new(1, 0, 0, 40), MaxSize = 32, Stroke = 3.5, Parent = depth })
	refs.depthBar = UIKit.bar({ Size = UDim2.fromOffset(400, 24), Position = UDim2.new(0.5, 0, 0, 46), AnchorPoint = Vector2.new(0.5, 0), Colors = { Color3.fromRGB(230, 230, 240), Color3.fromRGB(150, 150, 170) }, TextMax = 15, Parent = depth })

	-- Сверху справа: цель
	local goal = UIKit.frame({ Name = "Goal", Color = UIKit.Panel, Transparency = 0.12, Size = UDim2.fromOffset(300, 98), Position = UDim2.new(1, -18, 0, 6), AnchorPoint = Vector2.new(1, 0), Corner = 16, Stroke = 3, Parent = root })
	UIKit.text({ Text = t("Goal"), Size = UDim2.new(1, -24, 0, 26), Position = UDim2.fromOffset(12, 8), Color = UIKit.Yellow, XAlign = Enum.TextXAlignment.Left, MaxSize = 22, Parent = goal })
	refs.goalText = UIKit.text({ Text = "", Size = UDim2.new(1, -24, 0, 24), Position = UDim2.fromOffset(12, 36), XAlign = Enum.TextXAlignment.Left, Weight = "bold", MaxSize = 18, Stroke = 2, Parent = goal })
	refs.goalBar = UIKit.bar({ Size = UDim2.new(1, -24, 0, 20), Position = UDim2.fromOffset(12, 68), TextMax = 13, Stroke = 2, Parent = goal })
	refs.goal = goal

	-- Зелья (под целью)
	refs.potions = UIKit.frame({ Name = "Potions", Transparency = 1, Size = UDim2.fromOffset(300, 80), Position = UDim2.new(1, -18, 0, 112), AnchorPoint = Vector2.new(1, 0), Parent = root })
	UIKit.list(refs.potions, Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Right)
	refs.luckChip = UIKit.frame({ Name = "Luck", Color = Color3.fromRGB(31, 92, 58), Transparency = 0.05, Size = UDim2.fromOffset(190, 32), Corner = 12, Stroke = 3, Visible = false, LayoutOrder = 1, Parent = refs.potions })
	refs.luckText = UIKit.text({ Text = "", Size = UDim2.new(1, -12, 1, -6), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 18, Stroke = 2, Parent = refs.luckChip })
	refs.speedChip = UIKit.frame({ Name = "Speed", Color = Color3.fromRGB(110, 84, 16), Transparency = 0.05, Size = UDim2.fromOffset(190, 32), Corner = 12, Stroke = 3, Visible = false, LayoutOrder = 2, Parent = refs.potions })
	refs.speedText = UIKit.text({ Text = "", Size = UDim2.new(1, -12, 1, -6), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 18, Stroke = 2, Parent = refs.speedChip })

	-- Внизу справа (над прыжком): авто-копание и язык
	local toggles = UIKit.frame({ Name = "Toggles", Transparency = 1, Size = UDim2.fromOffset(200, 110), Position = UDim2.new(1, -22, 1, -170), AnchorPoint = Vector2.new(1, 1), Parent = root })
	UIKit.list(toggles, Enum.FillDirection.Vertical, 8, Enum.HorizontalAlignment.Right, Enum.VerticalAlignment.Bottom)
	refs.autoBtn = UIKit.button({ Name = "Auto", Text = t("AutoOff"), Colors = UIKit.C.Gray, Size = UDim2.fromOffset(190, 44), MaxSize = 20, LayoutOrder = 1, OnClick = function()
		local st = State.data
		if st then
			Remotes.Action:FireServer("SetAuto", not st.AutoMine)
		end
	end, Parent = toggles })
	refs.autoBtn.Visible = false
	refs.langBtn = UIKit.button({ Name = "Lang", Text = t("Lang"), Colors = UIKit.C.Dark, Size = UDim2.fromOffset(120, 44), MaxSize = 20, LayoutOrder = 2, OnClick = function()
		Remotes.Action:FireServer("SetLang", State.lang == "ru" and "en" or "ru")
	end, Parent = toggles })

	-- Телефон: большая кнопка «Копать» рядом с прыжком
	refs.digBtn = UIKit.button({ Name = "Dig", Text = "⛏\n" .. t("Dig"), Colors = UIKit.C.Orange, Size = UDim2.fromOffset(118, 118), Position = UDim2.new(1, -200, 1, -30), AnchorPoint = Vector2.new(1, 1), Corner = 59, StrokeThickness = 4, MaxSize = 26, Parent = root })
	refs.digBtn.Visible = UserInputService.TouchEnabled
	refs.digBtn.MouseButton1Down:Connect(function()
		fire("DigHold", true)
	end)
	refs.digBtn.MouseButton1Up:Connect(function()
		fire("DigHold", false)
	end)
	refs.digBtn.MouseLeave:Connect(function()
		fire("DigHold", false)
	end)

	-- Предупреждение об обновлении шахты
	refs.resetBanner = UIKit.frame({ Name = "ResetBanner", Color = UIKit.White, Size = UDim2.fromOffset(520, 46), Position = UDim2.new(0.5, 0, 0, 96), AnchorPoint = Vector2.new(0.5, 0), Corner = 14, Stroke = 3, Gradient = UIKit.C.Red, Visible = false, Parent = root })
	refs.resetText = UIKit.text({ Text = "", Size = UDim2.new(1, -16, 1, -8), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 24, Parent = refs.resetBanner })

	-- Всплывающие сообщения
	toastHolder = UIKit.frame({ Name = "Toasts", Transparency = 1, Size = UDim2.fromOffset(640, 200), Position = UDim2.new(0.5, 0, 1, -24), AnchorPoint = Vector2.new(0.5, 1), Parent = root })
	UIKit.list(toastHolder, Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Center, Enum.VerticalAlignment.Bottom)

	shownCash = State.data and State.data.Cash or 0
	if State.data then
		HUD.update(State.data)
	end
end

function HUD.init()
	cashValue = Instance.new("NumberValue")
	cashValue.Changed:Connect(function(v)
		shownCash = v
		if refs.cashValue then
			refs.cashValue.Text = "$" .. Locale.short(v)
		end
	end)
	build()
	RunService.Heartbeat:Connect(function()
		HUD.tick()
	end)
end

function HUD.rebuild()
	build()
end

function HUD.setVisible(on)
	if gui then
		gui.Enabled = on
	end
end

function HUD.cashTarget()
	return UDim2.new(0, 120, 1, -40)
end

-- Цель игрока: что делать дальше
local function goalFor(st)
	if st.InvCount >= st.Capacity then
		return t(st.Passes.SellAnywhere and "GoalSellAnywhere" or "GoalSell"), 1, t("Full")
	end
	local nextPick = Config.Pickaxes[st.Pickaxe + 1]
	if nextPick and st.Cash >= nextPick.Price then
		return t("GoalBuyPick", State.name(nextPick.Name)), 1, "$" .. Locale.short(st.Cash) .. " / $" .. Locale.short(nextPick.Price)
	end
	local power = Config.Pickaxes[st.Pickaxe].Power
	for _, layer in ipairs(Config.Layers) do
		if not st.Layers[layer.Id] and layer.MinPower <= power then
			local frac = layer.From > 0 and st.BestDepth / layer.From or 0
			return t("GoalDigTo", State.name(layer.Name)), frac, Locale.short(st.BestDepth) .. " / " .. Locale.short(layer.From) .. " m"
		end
	end
	if nextPick then
		return t("GoalSavePick", State.name(nextPick.Name)), st.Cash / nextPick.Price, "$" .. Locale.short(st.Cash) .. " / $" .. Locale.short(nextPick.Price)
	end
	local cost = Economy.rebirthCost(st.Rebirths)
	if st.Cash >= cost then
		return t("GoalRebirthReady", tostring(Economy.rebirthMultiplier(st.Rebirths + 1))), 1, "$" .. Locale.short(st.Cash) .. " / $" .. Locale.short(cost)
	end
	return t("GoalRebirth"), st.Cash / cost, "$" .. Locale.short(st.Cash) .. " / $" .. Locale.short(cost)
end

function HUD.update(st)
	if not refs.bagValue then
		return
	end
	refs.bagValue.Text = tostring(st.InvCount) .. " / " .. tostring(st.Capacity)
	local full = st.InvCount >= st.Capacity
	refs.bagValue.TextColor3 = full and UIKit.RedText or UIKit.BagColor
	if full and not refs.full.Visible then
		refs.full.Visible = true
		UIKit.pop(refs.full, 0.5)
	elseif not full then
		refs.full.Visible = false
	end
	refs.powerValue.Text = tostring(Config.Pickaxes[st.Pickaxe].Power)
	if math.abs(st.Cash - shownCash) > 0 then
		UIKit.tween(cashValue, 0.45, { Value = st.Cash })
	end
	refs.rewardsBtn.Dot.Visible = st.Daily and st.Daily.CanClaim or false
	local goalText, goalFrac, goalLabel = goalFor(st)
	refs.goalText.Text = goalText
	UIKit.setBar(refs.goalBar, goalFrac, goalLabel)
	refs.autoBtn.Visible = st.Passes.AutoMine == true
	UIKit.setButton(refs.autoBtn, t(st.AutoMine and "AutoOn" or "AutoOff"), st.AutoMine and UIKit.C.Green or UIKit.C.Gray)
	local rebirthReady = st.Cash >= Economy.rebirthCost(st.Rebirths)
	refs.rebirthBtn.Dot.Visible = rebirthReady
end

-- Каждый кадр: глубина под ногами, таймеры зелий
local lastLayerIndex = nil
function HUD.tick()
	local st = State.data
	if not st or not refs.depthLabel then
		return
	end
	local char = player.Character
	local rootPart = char and char:FindFirstChild("HumanoidRootPart")
	if rootPart then
		local y = rootPart.Position.Y - 3
		if y >= Config.SurfaceY - 1 then
			refs.depthLabel.Text = t("OnSurface")
			UIKit.setBar(refs.depthBar, 0, "🏆 " .. Locale.short(st.BestDepth) .. " m")
			lastLayerIndex = 0
		else
			local depth = Economy.depthAtY(y)
			local layer, index, frac, left = Economy.layerProgress(depth)
			refs.depthLabel.Text = t("DepthFmt", tostring(depth), State.name(layer.Name))
			local nextLayer = Config.Layers[index + 1]
			if nextLayer then
				UIKit.setBar(refs.depthBar, frac, t("NextLayer", State.name(nextLayer.Name), tostring(left)))
			else
				UIKit.setBar(refs.depthBar, frac, t("Bottom"))
			end
			if lastLayerIndex ~= index then
				lastLayerIndex = index
				local fill = refs.depthBar:FindFirstChild("Fill")
				local grad = fill and fill:FindFirstChildOfClass("UIGradient")
				if grad then
					grad.Color = ColorSequence.new(layer.Color:Lerp(Color3.new(1, 1, 1), 0.45), layer.Color)
				end
			end
		end
	end
	local luck = State.potionLeft("Luck")
	refs.luckChip.Visible = luck > 0
	if luck > 0 then
		refs.luckText.Text = t("PotionLuck", Locale.timer(luck))
	end
	local speed = State.potionLeft("Speed")
	refs.speedChip.Visible = speed > 0
	if speed > 0 then
		refs.speedText.Text = t("PotionSpeed", Locale.timer(speed))
	end
end

-- Всплывающее сообщение внизу экрана
function HUD.toast(text, colors)
	if not toastHolder then
		return
	end
	local count = 0
	for _, child in ipairs(toastHolder:GetChildren()) do
		if child:IsA("Frame") then
			count = count + 1
			if count >= 3 then
				child:Destroy()
			end
		end
	end
	local chip = UIKit.frame({ Name = "Toast", Color = UIKit.White, Size = UDim2.fromOffset(560, 46), Corner = 14, Stroke = 3, LayoutOrder = math.floor(os.clock() * 100), Parent = toastHolder })
	UIKit.gradient(chip, colors or { Color3.fromRGB(52, 54, 72), Color3.fromRGB(30, 30, 42) }, 90)
	local label = UIKit.text({ Text = text, Size = UDim2.new(1, -20, 1, -10), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 24, Parent = chip })
	UIKit.pop(chip, 0.6, 0.3)
	task.delay(2.6, function()
		if chip.Parent then
			UIKit.tween(chip, 0.3, { BackgroundTransparency = 1 })
			UIKit.tween(label, 0.3, { TextTransparency = 1 })
			Debris:AddItem(chip, 0.35)
		end
	end)
end

function HUD.resetBanner(seconds)
	if not refs.resetBanner then
		return
	end
	refs.resetBanner.Visible = true
	UIKit.pop(refs.resetBanner, 0.7)
	task.spawn(function()
		for s = seconds, 1, -1 do
			if not refs.resetText then
				return
			end
			refs.resetText.Text = t("ResetWarn", tostring(s))
			task.wait(1)
		end
		if refs.resetBanner then
			refs.resetBanner.Visible = false
		end
	end)
end

function HUD.bumpBag()
	if refs.bagRow then
		UIKit.pop(refs.bagRow, 0.85, 0.2)
	end
end

return HUD
