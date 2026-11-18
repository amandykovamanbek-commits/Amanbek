-- Окна: Магазин, Продажа, Премиум, Перерождение, Награды+Коды, Лифт.
-- Стиль как в макете Figma v2: цветная шапка с полосками, красный крестик,
-- карточки с градиентом и бейджами.

local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))
local Locale = require(Shared:WaitForChild("Locale"))
local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)
local HUD = require(script.Parent.HUD)

local Windows = {}

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local gui, root
local current = nil
local blur = nil
local onOpenChanged = nil

local function t(key, ...)
	return State.t(key, ...)
end

local function money(n)
	return "$" .. Locale.short(n)
end

function Windows.init(callback)
	onOpenChanged = callback
	gui, root = UIKit.screen("WindowsGui", 10)
	blur = Lighting:FindFirstChild("UIBlur")
	if not blur then
		blur = Instance.new("BlurEffect")
		blur.Name = "UIBlur"
		blur.Size = 0
		blur.Parent = Lighting
	end
end

function Windows.isOpen()
	return current ~= nil
end

function Windows.close()
	if not current then
		return
	end
	local closing = current
	current = nil
	UIKit.tween(blur, 0.25, { Size = 0 })
	UIKit.tween(closing.overlay, 0.2, { BackgroundTransparency = 1 })
	local scale = closing.win:FindFirstChild("PopScale")
	if scale then
		UIKit.tween(scale, 0.18, { Scale = 0.75 }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
	end
	task.delay(0.19, function()
		closing.overlay:Destroy()
		closing.win:Destroy()
	end)
	if onOpenChanged then
		onOpenChanged(false)
	end
end

-- Основа окна: затемнение, рамка, шапка с полосками, заголовок, крестик
local function makeWindow(title, colors, width, height)
	UIKit.lang = State.lang
	local overlay = Instance.new("TextButton")
	overlay.Name = "Overlay"
	overlay.Text = ""
	overlay.AutoButtonColor = false
	overlay.BackgroundColor3 = UIKit.Black
	overlay.BackgroundTransparency = 1
	overlay.BorderSizePixel = 0
	overlay.Size = UDim2.fromScale(3, 3)
	overlay.Position = UDim2.fromScale(0.5, 0.5)
	overlay.AnchorPoint = Vector2.new(0.5, 0.5)
	overlay.Parent = root
	UIKit.tween(overlay, 0.25, { BackgroundTransparency = 0.5 })
	overlay.Activated:Connect(function()
		Windows.close()
	end)

	local win = UIKit.frame({
		Name = "Window",
		Color = UIKit.Body,
		Size = UDim2.fromOffset(width, height),
		Position = UDim2.new(0.5, 0, 0.5, 16),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Corner = 22,
		Stroke = 5,
		Parent = root,
	})
	win.Active = true

	local head = UIKit.frame({ Name = "Header", Color = UIKit.White, Size = UDim2.new(1, 0, 0, 84), Corner = 22, Clip = true, Parent = win })
	UIKit.gradient(head, colors, 90)
	local square = UIKit.frame({ Name = "Square", Color = UIKit.White, Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 1, -30), Parent = head })
	UIKit.gradient(square, { colors[1]:Lerp(colors[2], 0.64), colors[2] }, 90)
	for i = 0, math.ceil(width / 70) + 2 do
		local stripe = UIKit.frame({ Name = "Stripe", Color = UIKit.White, Transparency = 0.86, Size = UDim2.fromOffset(28, 240), Position = UDim2.fromOffset(i * 70 - 80, -70), Parent = head })
		stripe.Rotation = 35
	end
	UIKit.frame({ Name = "Gloss", Color = UIKit.White, Transparency = 0.86, Size = UDim2.new(1, 0, 0, 30), Parent = head })
	UIKit.frame({ Name = "Line", Color = UIKit.Black, Size = UDim2.new(1, 0, 0, 5), Position = UDim2.new(0, 0, 1, -5), Parent = head })
	local titleLabel = UIKit.text({ Name = "Title", Text = title, Size = UDim2.new(1, -120, 0, 58), Position = UDim2.fromOffset(24, 11), XAlign = Enum.TextXAlignment.Left, MaxSize = 46, Stroke = 4, Parent = head })
	UIKit.button({ Name = "Close", Text = "✕", Colors = UIKit.C.Red, Size = UDim2.fromOffset(56, 56), Position = UDim2.new(1, -16, 0, 12), AnchorPoint = Vector2.new(1, 0), MaxSize = 32, OnClick = function()
		Windows.close()
	end, Parent = head })

	local body = UIKit.frame({ Name = "Body", Transparency = 1, Size = UDim2.new(1, -40, 1, -104), Position = UDim2.fromOffset(20, 94), Parent = win })

	UIKit.pop(win, 0.7, 0.32)
	UIKit.tween(blur, 0.3, { Size = 14 })
	return { overlay = overlay, win = win, body = body, title = titleLabel }
end

local function sectionTitle(parent, text, order)
	return UIKit.text({ Text = text, Size = UDim2.new(1, 0, 0, 28), Color = UIKit.Yellow, XAlign = Enum.TextXAlignment.Left, MaxSize = 22, LayoutOrder = order, Parent = parent })
end

local function hint(parent, text, order, height)
	return UIKit.text({ Text = text, Size = UDim2.new(1, 0, 0, height or 44), Color = UIKit.Muted, XAlign = Enum.TextXAlignment.Left, Weight = "bold", MaxSize = 18, Stroke = 0, Wrapped = true, LayoutOrder = order, Parent = parent })
end

---------------------------------------------------------------------
-- МАГАЗИН
---------------------------------------------------------------------
local function buildShop(tab)
	tab = tab or "picks"
	local w = makeWindow(t("ShopTitle"), UIKit.C.Orange, 860, 640)
	local cards = {}

	local tabs = UIKit.frame({ Name = "Tabs", Transparency = 1, Size = UDim2.new(1, 0, 0, 50), Parent = w.body })
	UIKit.list(tabs, Enum.FillDirection.Horizontal, 10, Enum.HorizontalAlignment.Left)
	local grid = Instance.new("ScrollingFrame")
	grid.Name = "Grid"
	grid.BackgroundTransparency = 1
	grid.BorderSizePixel = 0
	grid.Size = UDim2.new(1, 0, 1, -110)
	grid.Position = UDim2.fromOffset(0, 58)
	grid.ScrollBarThickness = 8
	grid.ScrollBarImageColor3 = UIKit.Yellow
	grid.CanvasSize = UDim2.new()
	grid.AutomaticCanvasSize = Enum.AutomaticSize.Y
	grid.Parent = w.body
	UIKit.new("UIGridLayout", { CellSize = UDim2.fromOffset(182, 240), CellPadding = UDim2.fromOffset(16, 24), SortOrder = Enum.SortOrder.LayoutOrder, Parent = grid })
	UIKit.padding(grid, 6, 18, 6, 10)
	local balance = UIKit.text({ Name = "Balance", Text = "", Size = UDim2.new(0.6, 0, 0, 40), Position = UDim2.new(0, 0, 1, -6), AnchorPoint = Vector2.new(0, 1), Color = UIKit.Cash, XAlign = Enum.TextXAlignment.Left, MaxSize = 32, Stroke = 3, Parent = w.body })

	local function fill(kind)
		for _, child in ipairs(grid:GetChildren()) do
			if child:IsA("Frame") then
				child:Destroy()
			end
		end
		cards = {}
		local list = kind == "picks" and Config.Pickaxes or Config.Backpacks
		for i, item in ipairs(list) do
			local stat
			if kind == "picks" then
				stat = t("Power", tostring(item.Power))
			else
				stat = t("Capacity", tostring(item.Capacity))
			end
			local badge, badgeColors, rainbow = nil, nil, false
			if i == #list then
				badge, rainbow = t("Legend"), true
			end
			local card, button = UIKit.card({
				Name = "Item" .. i,
				Title = State.name(item.Name),
				Icon = item.Icon,
				Stat = stat,
				Top = item.Top,
				Bottom = item.Bottom,
				LayoutOrder = i,
				Badge = badge,
				BadgeColors = badgeColors,
				BadgeRainbow = rainbow,
				OnClick = function()
					local st = State.data
					if not st then
						return
					end
					local owned = kind == "picks" and st.Pickaxe or st.Backpack
					if i > owned then
						Remotes.Action:FireServer(kind == "picks" and "BuyPickaxe" or "BuyBackpack", i)
					end
				end,
				Parent = grid,
			})
			cards[i] = { card = card, button = button, price = item.Price }
		end
		grid.CanvasPosition = Vector2.zero
	end

	local tabButtons = {}
	local function selectTab(kind)
		tab = kind
		w.arg = kind
		for k, b in pairs(tabButtons) do
			UIKit.setButton(b, nil, k == kind and UIKit.C.Orange or UIKit.C.Lock)
		end
		fill(kind)
		if current and current.refresh then
			current.refresh(State.data)
		end
	end
	tabButtons.picks = UIKit.button({ Text = t("TabPicks"), Colors = UIKit.C.Orange, Size = UDim2.fromOffset(200, 48), MaxSize = 22, LayoutOrder = 1, OnClick = function() selectTab("picks") end, Parent = tabs })
	tabButtons.bags = UIKit.button({ Text = t("TabBags"), Colors = UIKit.C.Lock, Size = UDim2.fromOffset(220, 48), MaxSize = 22, LayoutOrder = 2, OnClick = function() selectTab("bags") end, Parent = tabs })

	w.refresh = function(st)
		if not st then
			return
		end
		balance.Text = "💰 " .. money(st.Cash)
		local owned = tab == "picks" and st.Pickaxe or st.Backpack
		local nextBadgeSet = false
		for i, c in pairs(cards) do
			if i < owned then
				UIKit.setButton(c.button, t("Have"), UIKit.C.Gray)
			elseif i == owned then
				UIKit.setButton(c.button, t("Equipped"), UIKit.C.Gold)
			elseif st.Cash >= c.price then
				UIKit.setButton(c.button, money(c.price), UIKit.C.Green)
			else
				UIKit.setButton(c.button, "🔒 " .. money(c.price), UIKit.C.Lock)
			end
			-- бейдж «СЛЕДУЮЩАЯ» на ближайшей покупке
			local existing = c.card:FindFirstChild("NextBadge")
			local shouldHave = (i == owned + 1) and not nextBadgeSet and i ~= #Config.Pickaxes
			if shouldHave then
				nextBadgeSet = true
				if not existing and not c.card:FindFirstChild("Badge") then
					local b = UIKit.badge(c.card, t("Next"), UIKit.C.Blue)
					b.Name = "NextBadge"
				end
			elseif existing then
				existing:Destroy()
			end
		end
	end
	w.arg = tab
	current = w
	selectTab(tab)
	return w
end

---------------------------------------------------------------------
-- ПРОДАЖА
---------------------------------------------------------------------
local function buildSell()
	local w = makeWindow(t("SellTitle"), UIKit.C.Red, 760, 560)
	local top = UIKit.frame({ Name = "Top", Color = UIKit.Panel, Size = UDim2.new(1, 0, 0, 100), Corner = 16, Stroke = 3, Parent = w.body })
	UIKit.text({ Text = t("BagValue"), Size = UDim2.new(0.55, 0, 0, 24), Position = UDim2.fromOffset(18, 12), Color = UIKit.Muted, XAlign = Enum.TextXAlignment.Left, Weight = "bold", MaxSize = 17, Stroke = 0, Parent = top })
	local value = UIKit.text({ Text = "", Size = UDim2.new(0.55, 0, 0, 50), Position = UDim2.fromOffset(18, 38), Color = UIKit.Cash, XAlign = Enum.TextXAlignment.Left, MaxSize = 40, Stroke = 3.5, Parent = top })
	local sellBtn = UIKit.button({ Text = t("SellAll"), Colors = UIKit.C.Green, Size = UDim2.fromOffset(270, 64), Position = UDim2.new(1, -16, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), MaxSize = 28, OnClick = function()
		local st = State.data
		if st and st.Passes.SellAnywhere then
			Remotes.Action:FireServer("Sell")
		else
			HUD.toast(t("GoToSell"))
			local pass = Config.FindPass("SellAnywhere")
			if pass and pass.Id ~= 0 then
				MarketplaceService:PromptGamePassPurchase(player, pass.Id)
			end
		end
	end, Parent = top })

	local list = Instance.new("ScrollingFrame")
	list.Name = "Ores"
	list.BackgroundTransparency = 1
	list.BorderSizePixel = 0
	list.Size = UDim2.new(1, 0, 1, -190)
	list.Position = UDim2.fromOffset(0, 114)
	list.ScrollBarThickness = 8
	list.CanvasSize = UDim2.new()
	list.AutomaticCanvasSize = Enum.AutomaticSize.Y
	list.Parent = w.body
	UIKit.new("UIGridLayout", { CellSize = UDim2.fromOffset(226, 52), CellPadding = UDim2.fromOffset(10, 10), SortOrder = Enum.SortOrder.LayoutOrder, Parent = list })
	UIKit.padding(list, 4)
	local empty = UIKit.text({ Text = t("Empty"), Size = UDim2.new(1, 0, 0, 50), Position = UDim2.fromOffset(0, 170), Color = UIKit.Muted, MaxSize = 28, Visible = false, Parent = w.body })
	hint(w.body, t("SellHint"), 1, 52).Position = UDim2.new(0, 0, 1, -56)

	local signature = nil
	w.refresh = function(st)
		if not st then
			return
		end
		local total = math.floor(Economy.inventoryValue(st.Inv) * st.Mult)
		value.Text = "💰 $" .. Locale.full(total)
		if st.Passes.SellAnywhere then
			UIKit.setButton(sellBtn, t("SellAll"), UIKit.C.Green)
		else
			UIKit.setButton(sellBtn, t("GoSellCircle"), UIKit.C.Lock)
		end
		local parts = {}
		for id, n in pairs(st.Inv) do
			table.insert(parts, id .. n)
		end
		table.sort(parts)
		local sig = table.concat(parts, ",")
		if sig == signature then
			return
		end
		signature = sig
		for _, child in ipairs(list:GetChildren()) do
			if child:IsA("Frame") then
				child:Destroy()
			end
		end
		local order = 0
		for li, layer in ipairs(Config.Layers) do
			for k, ore in ipairs({ layer.Common, layer.Rare }) do
				local n = st.Inv[ore.Id]
				if n and n > 0 then
					order = order + 1
					local chip = UIKit.frame({ Name = ore.Id, Color = Color3.fromRGB(48, 48, 62), Corner = 14, Stroke = 3, LayoutOrder = li * 10 + k, Parent = list })
					UIKit.text({ Text = ore.Emoji, Size = UDim2.fromOffset(34, 34), Position = UDim2.new(0, 10, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Stroke = 0, Parent = chip })
					UIKit.text({ Text = State.name(ore.Name) .. " ×" .. n, Size = UDim2.new(1, -120, 0, 28), Position = UDim2.new(0, 50, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), XAlign = Enum.TextXAlignment.Left, Weight = "bold", MaxSize = 18, Stroke = 2, Parent = chip })
					UIKit.text({ Text = money(ore.Value * n * st.Mult), Size = UDim2.new(0, 70, 0, 26), Position = UDim2.new(1, -10, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), Color = UIKit.Cash, XAlign = Enum.TextXAlignment.Right, MaxSize = 17, Stroke = 2, Parent = chip })
				end
			end
		end
		empty.Visible = order == 0
	end
	current = w
	return w
end

---------------------------------------------------------------------
-- ПРЕМИУМ
---------------------------------------------------------------------
local BADGES = {
	Hit = { "Badge_Hit", UIKit.C.Red, false },
	Best = { "Badge_Best", nil, true },
	Good = { "Badge_Good", UIKit.C.Blue, false },
	Great = { "Badge_Great", UIKit.C.Orange, false },
	Most = { "Badge_Most", nil, true },
}

local function buildPremium()
	local w = makeWindow(t("PremiumTitle"), UIKit.C.Purple, 1060, 680)
	UIKit.list(w.body, Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Left)
	local passButtons = {}

	sectionTitle(w.body, t("PassesHeader"), 1)
	local row1 = UIKit.frame({ Name = "Passes", Transparency = 1, Size = UDim2.new(1, 0, 0, 252), LayoutOrder = 2, Parent = w.body })
	UIKit.list(row1, Enum.FillDirection.Horizontal, 12, Enum.HorizontalAlignment.Left, Enum.VerticalAlignment.Bottom)
	for i, pass in ipairs(Config.GamePasses) do
		local b = pass.Badge and BADGES[pass.Badge]
		local _, button = UIKit.card({
			Name = pass.Key,
			Title = State.name(pass.Name),
			Icon = pass.Icon,
			Stat = State.name(pass.Desc),
			Top = pass.Top,
			Bottom = pass.Bottom,
			Size = UDim2.fromOffset(134, 232),
			LayoutOrder = i,
			ButtonText = "R$ " .. pass.Price,
			Badge = b and t(b[1]) or nil,
			BadgeColors = b and b[2] or nil,
			BadgeRainbow = b and b[3] or false,
			OnClick = function()
				local st = State.data
				if st and st.Passes[pass.Key] then
					return
				end
				if pass.Id == 0 then
					HUD.toast(t("Soon"))
				else
					MarketplaceService:PromptGamePassPurchase(player, pass.Id)
				end
			end,
			Parent = row1,
		})
		passButtons[pass.Key] = { button = button, pass = pass }
	end

	sectionTitle(w.body, t("ProductsHeader"), 3)
	local row2 = UIKit.frame({ Name = "Products", Transparency = 1, Size = UDim2.new(1, 0, 0, 252), LayoutOrder = 4, Parent = w.body })
	UIKit.list(row2, Enum.FillDirection.Horizontal, 12, Enum.HorizontalAlignment.Left, Enum.VerticalAlignment.Bottom)
	for i, product in ipairs(Config.Products) do
		local b = product.Badge and BADGES[product.Badge]
		local stat = State.name(product.Desc)
		if product.Cash then
			stat = "+$" .. Locale.short(Economy.cashPackAmount(product.Cash, State.data and State.data.Rebirths or 0))
		end
		UIKit.card({
			Name = product.Key,
			Title = State.name(product.Name),
			Icon = product.Icon,
			Stat = stat,
			Top = product.Top,
			Bottom = product.Bottom,
			Size = UDim2.fromOffset(152, 232),
			LayoutOrder = i,
			ButtonText = "R$ " .. product.Price,
			ButtonColors = UIKit.C.Blue,
			Badge = b and t(b[1]) or nil,
			BadgeColors = b and b[2] or nil,
			BadgeRainbow = b and b[3] or false,
			OnClick = function()
				if product.Id == 0 then
					HUD.toast(t("Soon"))
				else
					MarketplaceService:PromptProductPurchase(player, product.Id)
				end
			end,
			Parent = row2,
		})
	end

	w.refresh = function(st)
		if not st then
			return
		end
		for key, entry in pairs(passButtons) do
			if st.Passes[key] then
				UIKit.setButton(entry.button, t("Owned"), UIKit.C.Gray)
			else
				UIKit.setButton(entry.button, "R$ " .. entry.pass.Price, UIKit.C.Green)
			end
		end
	end
	current = w
	return w
end

---------------------------------------------------------------------
-- ПЕРЕРОЖДЕНИЕ
---------------------------------------------------------------------
local function buildRebirth()
	local w = makeWindow(t("RebirthTitle"), UIKit.C.Pink, 640, 520)
	UIKit.list(w.body, Enum.FillDirection.Vertical, 14, Enum.HorizontalAlignment.Center)
	hint(w.body, t("RebirthInfo"), 1, 56)
	local row = UIKit.frame({ Name = "Mult", Transparency = 1, Size = UDim2.new(1, 0, 0, 70), LayoutOrder = 2, Parent = w.body })
	UIKit.list(row, Enum.FillDirection.Horizontal, 16, Enum.HorizontalAlignment.Center, Enum.VerticalAlignment.Center)
	local nowChip = UIKit.frame({ Color = UIKit.Panel, Size = UDim2.fromOffset(220, 62), Corner = 16, Stroke = 3, LayoutOrder = 1, Parent = row })
	local nowText = UIKit.text({ Text = "", Size = UDim2.new(1, -16, 1, -12), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 28, Parent = nowChip })
	UIKit.text({ Text = "➜", Size = UDim2.fromOffset(44, 44), Color = UIKit.Yellow, LayoutOrder = 2, Parent = row })
	local afterChip = UIKit.frame({ Color = UIKit.White, Size = UDim2.fromOffset(220, 62), Corner = 16, Stroke = 3, Gradient = UIKit.C.Purple, LayoutOrder = 3, Parent = row })
	local afterText = UIKit.text({ Text = "", Size = UDim2.new(1, -16, 1, -12), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 28, Parent = afterChip })
	local count = UIKit.text({ Text = "", Size = UDim2.new(1, 0, 0, 30), Color = UIKit.Yellow, MaxSize = 24, LayoutOrder = 3, Parent = w.body })
	local bar = UIKit.bar({ Size = UDim2.new(1, -40, 0, 32), Colors = UIKit.C.Gold, TextMax = 18, LayoutOrder = 4, Parent = w.body })
	local button = UIKit.button({ Text = "", Colors = UIKit.C.Purple, Size = UDim2.new(1, -40, 0, 66), MaxSize = 30, LayoutOrder = 5, OnClick = function()
		local st = State.data
		if st and st.Cash >= Economy.rebirthCost(st.Rebirths) then
			Windows.close()
			Remotes.Action:FireServer("Rebirth")
		end
	end, Parent = w.body })

	w.refresh = function(st)
		if not st then
			return
		end
		local cost = Economy.rebirthCost(st.Rebirths)
		nowText.Text = t("Now", tostring(Economy.rebirthMultiplier(st.Rebirths)))
		afterText.Text = t("After", tostring(Economy.rebirthMultiplier(st.Rebirths + 1)))
		count.Text = t("RebirthCount", tostring(st.Rebirths))
		UIKit.setBar(bar, st.Cash / cost, money(st.Cash) .. " / " .. money(cost))
		if st.Cash >= cost then
			UIKit.setButton(button, t("RebirthBtn", Locale.short(cost)), UIKit.C.Purple)
		else
			UIKit.setButton(button, t("RebirthNeed", Locale.short(cost)), UIKit.C.Lock)
		end
	end
	current = w
	return w
end

---------------------------------------------------------------------
-- НАГРАДЫ И КОДЫ
---------------------------------------------------------------------
local function buildDaily()
	local w = makeWindow(t("DailyTitle"), UIKit.C.Lime, 860, 580)
	UIKit.list(w.body, Enum.FillDirection.Vertical, 12, Enum.HorizontalAlignment.Center)
	hint(w.body, t("DailySub"), 1, 50)
	local row = UIKit.frame({ Name = "Days", Transparency = 1, Size = UDim2.new(1, 0, 0, 140), LayoutOrder = 2, Parent = w.body })
	UIKit.list(row, Enum.FillDirection.Horizontal, 10, Enum.HorizontalAlignment.Center, Enum.VerticalAlignment.Center)
	local days = {}
	for i = 1, #Config.Daily do
		local card = UIKit.frame({ Name = "Day" .. i, Color = UIKit.White, Size = UDim2.fromOffset(104, 134), Corner = 16, LayoutOrder = i, Parent = row })
		local grad = UIKit.gradient(card, { Color3.fromRGB(62, 66, 90), Color3.fromRGB(36, 38, 54) }, 90)
		local stroke = UIKit.stroke(card, 3)
		local dayLabel = UIKit.text({ Text = t("Day", tostring(i)), Size = UDim2.new(1, -10, 0, 22), Position = UDim2.new(0.5, 0, 0, 8), AnchorPoint = Vector2.new(0.5, 0), Color = UIKit.Muted, Weight = "bold", MaxSize = 17, Stroke = 2, Parent = card })
		UIKit.text({ Text = Config.Daily[i].Icon, Size = UDim2.fromOffset(52, 52), Position = UDim2.new(0.5, 0, 0, 34), AnchorPoint = Vector2.new(0.5, 0), Stroke = 0, Parent = card })
		local reward = UIKit.text({ Text = "", Size = UDim2.new(1, -10, 0, 26), Position = UDim2.new(0.5, 0, 1, -8), AnchorPoint = Vector2.new(0.5, 1), MaxSize = 18, Stroke = 2, Parent = card })
		days[i] = { card = card, grad = grad, stroke = stroke, day = dayLabel, reward = reward }
	end
	local claim = UIKit.button({ Text = "", Colors = UIKit.C.Green, Size = UDim2.new(1, -60, 0, 62), MaxSize = 28, LayoutOrder = 3, OnClick = function()
		local st = State.data
		if st and st.Daily.CanClaim then
			Remotes.Action:FireServer("ClaimDaily")
		end
	end, Parent = w.body })

	sectionTitle(w.body, t("Codes"), 4)
	local codeRow = UIKit.frame({ Name = "Code", Transparency = 1, Size = UDim2.new(1, 0, 0, 56), LayoutOrder = 5, Parent = w.body })
	local box = Instance.new("TextBox")
	box.Name = "Input"
	box.Size = UDim2.new(1, -150, 1, 0)
	box.BackgroundColor3 = Color3.fromRGB(16, 16, 22)
	box.BorderSizePixel = 0
	box.ClearTextOnFocus = false
	box.Text = ""
	box.PlaceholderText = t("CodePlaceholder")
	box.PlaceholderColor3 = Color3.fromRGB(110, 115, 135)
	box.TextColor3 = UIKit.White
	box.Font = UIKit.font("bold")
	box.TextScaled = true
	box.TextXAlignment = Enum.TextXAlignment.Left
	UIKit.corner(box, 12)
	UIKit.stroke(box, 3)
	UIKit.padding(box, 16, 10)
	UIKit.new("UITextSizeConstraint", { MaxTextSize = 24, Parent = box })
	box.Parent = codeRow
	UIKit.button({ Text = t("Ok"), Colors = UIKit.C.Blue, Size = UDim2.fromOffset(130, 56), Position = UDim2.new(1, 0, 0, 0), AnchorPoint = Vector2.new(1, 0), MaxSize = 26, OnClick = function()
		if #box.Text > 0 then
			Remotes.Action:FireServer("Redeem", box.Text)
			box.Text = ""
		end
	end, Parent = codeRow })

	w.refresh = function(st)
		if not st then
			return
		end
		local daily = st.Daily
		local highlight, claimedUpTo
		if daily.CanClaim then
			highlight = daily.Day
			claimedUpTo = daily.Day - 1
		else
			claimedUpTo = daily.Streak > 0 and ((daily.Streak - 1) % #Config.Daily) + 1 or 0
			highlight = nil
		end
		for i, d in ipairs(days) do
			local reward = Economy.dailyReward(i, st.Rebirths, st.Pickaxe)
			local text = ""
			if reward.Cash > 0 then
				text = "$" .. Locale.short(reward.Cash)
			end
			if reward.Potion then
				text = (text ~= "" and (text .. "+") or "") .. t(reward.Potion)
			end
			d.reward.Text = text
			d.card.BackgroundTransparency = 0
			if i <= claimedUpTo then
				d.day.Text = "✓ " .. t("Day", tostring(i))
				d.grad.Color = ColorSequence.new(Color3.fromRGB(46, 120, 60), Color3.fromRGB(28, 70, 38))
				d.stroke.Color = UIKit.Black
				d.stroke.Thickness = 3
			elseif i == highlight then
				d.day.Text = t("Day", tostring(i))
				d.grad.Color = ColorSequence.new(Color3.fromRGB(255, 214, 90), Color3.fromRGB(230, 140, 20))
				d.stroke.Color = UIKit.White
				d.stroke.Thickness = 4
			else
				d.day.Text = t("Day", tostring(i))
				d.grad.Color = ColorSequence.new(Color3.fromRGB(62, 66, 90), Color3.fromRGB(36, 38, 54))
				d.stroke.Color = UIKit.Black
				d.stroke.Thickness = 3
			end
		end
		if daily.CanClaim then
			UIKit.setButton(claim, t("Claim", tostring(daily.Day)), UIKit.C.Green)
		else
			UIKit.setButton(claim, t("ComeBack", Locale.duration(State.lang, daily.NextIn)), UIKit.C.Lock)
		end
	end
	current = w
	return w
end

---------------------------------------------------------------------
-- ЛИФТ
---------------------------------------------------------------------
local function buildElevator()
	local w = makeWindow(t("ElevatorTitle"), UIKit.C.Gold, 760, 640)
	UIKit.list(w.body, Enum.FillDirection.Vertical, 10, Enum.HorizontalAlignment.Center)
	hint(w.body, t("ElevatorSub"), 1, 30)
	local rows = {}
	for i, layer in ipairs(Config.Layers) do
		local row = UIKit.frame({ Name = layer.Id, Color = UIKit.Panel, Size = UDim2.new(1, 0, 0, 64), Corner = 14, Stroke = 3, LayoutOrder = 1 + i, Parent = w.body })
		local swatch = UIKit.frame({ Color = layer.Color, Size = UDim2.fromOffset(48, 48), Position = UDim2.new(0, 8, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Corner = 10, Stroke = 3, Parent = row })
		UIKit.text({ Text = layer.Emoji, Size = UDim2.fromScale(0.75, 0.75), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), Stroke = 0, Parent = swatch })
		UIKit.text({ Text = State.name(layer.Name), Size = UDim2.new(1, -310, 0, 28), Position = UDim2.fromOffset(68, 6), XAlign = Enum.TextXAlignment.Left, MaxSize = 22, Parent = row })
		UIKit.text({ Text = t("Range", tostring(layer.From), tostring(layer.To)), Size = UDim2.new(1, -310, 0, 22), Position = UDim2.fromOffset(68, 36), XAlign = Enum.TextXAlignment.Left, Color = UIKit.Muted, Weight = "bold", MaxSize = 16, Stroke = 0, Parent = row })
		local button = UIKit.button({ Text = "", Colors = UIKit.C.Green, Size = UDim2.fromOffset(220, 48), Position = UDim2.new(1, -8, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), MaxSize = 20, OnClick = function()
			local st = State.data
			if not st then
				return
			end
			if st.Layers[layer.Id] and Config.Pickaxes[st.Pickaxe].Power >= layer.MinPower then
				Windows.close()
				Remotes.Action:FireServer("Elevator", i)
			end
		end, Parent = row })
		rows[i] = { button = button, layer = layer }
	end
	UIKit.button({ Text = t("SurfaceBtn"), Colors = UIKit.C.Blue, Size = UDim2.new(1, -120, 0, 52), MaxSize = 24, LayoutOrder = 20, OnClick = function()
		Windows.close()
		Remotes.Action:FireServer("Surface")
	end, Parent = w.body })

	w.refresh = function(st)
		if not st then
			return
		end
		local power = Config.Pickaxes[st.Pickaxe].Power
		for _, r in ipairs(rows) do
			if not st.Layers[r.layer.Id] then
				UIKit.setButton(r.button, t("Locked"), UIKit.C.Lock)
			elseif power < r.layer.MinPower then
				local need = Config.Pickaxes[Config.PickaxeForPower(r.layer.MinPower)]
				UIKit.setButton(r.button, t("NeedPick", State.name(need.Name)), UIKit.C.Gray)
			else
				UIKit.setButton(r.button, t("Go"), UIKit.C.Green)
			end
		end
	end
	current = w
	return w
end

local builders = {
	Shop = buildShop,
	Sell = buildSell,
	Premium = buildPremium,
	Rebirth = buildRebirth,
	Daily = buildDaily,
	Elevator = buildElevator,
}

function Windows.open(kind, arg)
	local builder = builders[kind]
	if not builder then
		return
	end
	if current then
		local old = current
		current = nil
		old.overlay:Destroy()
		old.win:Destroy()
	end
	local w = builder(arg)
	w.kind = kind
	w.arg = w.arg or arg
	current = w
	if w.refresh then
		w.refresh(State.data)
	end
	if onOpenChanged then
		onOpenChanged(true)
	end
end

function Windows.toggle(kind, arg)
	if current and current.kind == kind and (arg == nil or current.arg == arg) then
		Windows.close()
	else
		Windows.open(kind, arg)
	end
end

function Windows.refresh(st)
	if current and current.refresh then
		current.refresh(st)
	end
end

function Windows.relocalize()
	if current then
		Windows.open(current.kind, current.arg)
	end
end

return Windows
