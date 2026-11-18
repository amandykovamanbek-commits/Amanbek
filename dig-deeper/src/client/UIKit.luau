-- Набор деталей интерфейса в стиле макета Figma v2:
-- яркие градиенты, толстая чёрная обводка, текст с обводкой, кнопки «пружинят».

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Sound = require(script.Parent.Sound)

local UIKit = {}

UIKit.lang = "ru"

-- Пары цветов (верх, низ) для градиентов
UIKit.C = {
	Green = { Color3.fromRGB(140, 242, 94), Color3.fromRGB(63, 194, 43) },
	Gold = { Color3.fromRGB(255, 227, 107), Color3.fromRGB(255, 178, 30) },
	Gray = { Color3.fromRGB(154, 160, 176), Color3.fromRGB(94, 99, 114) },
	Lock = { Color3.fromRGB(107, 112, 128), Color3.fromRGB(69, 74, 88) },
	Blue = { Color3.fromRGB(111, 200, 255), Color3.fromRGB(47, 134, 255) },
	Red = { Color3.fromRGB(255, 106, 94), Color3.fromRGB(217, 55, 44) },
	Orange = { Color3.fromRGB(255, 194, 75), Color3.fromRGB(255, 138, 30) },
	Purple = { Color3.fromRGB(213, 139, 255), Color3.fromRGB(143, 61, 255) },
	Pink = { Color3.fromRGB(255, 122, 217), Color3.fromRGB(176, 77, 255) },
	Teal = { Color3.fromRGB(125, 240, 255), Color3.fromRGB(34, 181, 230) },
	Dark = { Color3.fromRGB(74, 79, 105), Color3.fromRGB(38, 42, 59) },
	Lime = { Color3.fromRGB(184, 255, 107), Color3.fromRGB(77, 192, 42) },
}
UIKit.Body = Color3.fromRGB(38, 38, 51)
UIKit.Panel = Color3.fromRGB(27, 27, 36)
UIKit.Cash = Color3.fromRGB(184, 255, 61)
UIKit.BagColor = Color3.fromRGB(127, 216, 255)
UIKit.Yellow = Color3.fromRGB(255, 216, 74)
UIKit.Muted = Color3.fromRGB(190, 196, 214)
UIKit.White = Color3.new(1, 1, 1)
UIKit.Black = Color3.new(0, 0, 0)
UIKit.RedText = Color3.fromRGB(255, 92, 80)

-- Русский — Gotham Black (есть кириллица), английский — Fredoka One (как в топовых играх)
function UIKit.font(weight)
	if UIKit.lang == "en" then
		return Enum.Font.FredokaOne
	end
	if weight == "bold" then
		return Enum.Font.GothamBold
	end
	return Enum.Font.GothamBlack
end

function UIKit.new(className, props, children)
	local inst = Instance.new(className)
	local parent = nil
	for k, v in pairs(props or {}) do
		if k == "Parent" then
			parent = v
		else
			inst[k] = v
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = inst
	end
	if parent then
		inst.Parent = parent
	end
	return inst
end

function UIKit.tween(obj, time, props, style, direction)
	local t = TweenService:Create(obj, TweenInfo.new(time, style or Enum.EasingStyle.Quad, direction or Enum.EasingDirection.Out), props)
	t:Play()
	return t
end

function UIKit.corner(parent, radius)
	return UIKit.new("UICorner", { CornerRadius = UDim.new(0, radius or 14), Parent = parent })
end

function UIKit.stroke(parent, thickness, color, transparency)
	return UIKit.new("UIStroke", {
		Thickness = thickness or 3,
		Color = color or UIKit.Black,
		Transparency = transparency or 0,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
		LineJoinMode = Enum.LineJoinMode.Round,
		Parent = parent,
	})
end

function UIKit.gradient(parent, pair, rotation)
	return UIKit.new("UIGradient", {
		Color = ColorSequence.new(pair[1], pair[2]),
		Rotation = rotation or 90,
		Parent = parent,
	})
end

function UIKit.rainbow(parent)
	return UIKit.new("UIGradient", {
		Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 77, 77)),
			ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 159, 28)),
			ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 225, 77)),
			ColorSequenceKeypoint.new(0.6, Color3.fromRGB(76, 217, 100)),
			ColorSequenceKeypoint.new(0.8, Color3.fromRGB(47, 155, 255)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(176, 92, 255)),
		}),
		Rotation = 0,
		Parent = parent,
	})
end

function UIKit.padding(parent, all, top, right, bottom)
	return UIKit.new("UIPadding", {
		PaddingLeft = UDim.new(0, all),
		PaddingTop = UDim.new(0, top or all),
		PaddingRight = UDim.new(0, right or all),
		PaddingBottom = UDim.new(0, bottom or top or all),
		Parent = parent,
	})
end

function UIKit.list(parent, direction, gap, hAlign, vAlign)
	return UIKit.new("UIListLayout", {
		FillDirection = direction or Enum.FillDirection.Vertical,
		Padding = UDim.new(0, gap or 8),
		HorizontalAlignment = hAlign or Enum.HorizontalAlignment.Center,
		VerticalAlignment = vAlign or Enum.VerticalAlignment.Top,
		SortOrder = Enum.SortOrder.LayoutOrder,
		Parent = parent,
	})
end

function UIKit.frame(props)
	local f = UIKit.new("Frame", {
		Name = props.Name or "Frame",
		BackgroundColor3 = props.Color or UIKit.Panel,
		BackgroundTransparency = props.Transparency or 0,
		BorderSizePixel = 0,
		Size = props.Size or UDim2.fromScale(1, 1),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
		LayoutOrder = props.LayoutOrder or 0,
		ZIndex = props.ZIndex or 1,
		Visible = props.Visible ~= false,
		ClipsDescendants = props.Clip == true,
	})
	if props.Corner then
		UIKit.corner(f, props.Corner)
	end
	if props.Stroke then
		UIKit.stroke(f, props.Stroke)
	end
	if props.Gradient then
		UIKit.gradient(f, props.Gradient, props.GradientRotation)
	end
	if props.Parent then
		f.Parent = props.Parent
	end
	return f
end

-- Текст с чёрной обводкой (как в макете)
function UIKit.text(props)
	local label = Instance.new("TextLabel")
	label.Name = props.Name or "Text"
	label.BackgroundTransparency = 1
	label.Size = props.Size or UDim2.fromScale(1, 1)
	label.Position = props.Position or UDim2.new()
	label.AnchorPoint = props.AnchorPoint or Vector2.zero
	label.Font = UIKit.font(props.Weight)
	label.Text = props.Text or ""
	label.TextColor3 = props.Color or UIKit.White
	label.TextScaled = props.Scaled ~= false
	label.TextSize = props.TextSize or 24
	label.TextWrapped = props.Wrapped == true
	label.TextXAlignment = props.XAlign or Enum.TextXAlignment.Center
	label.TextYAlignment = props.YAlign or Enum.TextYAlignment.Center
	label.RichText = props.Rich == true
	label.ZIndex = props.ZIndex or 1
	label.LayoutOrder = props.LayoutOrder or 0
	label.TextTransparency = props.TextTransparency or 0
	if props.AutoX then
		label.AutomaticSize = Enum.AutomaticSize.X
	end
	if props.MaxSize then
		UIKit.new("UITextSizeConstraint", { MaxTextSize = props.MaxSize, MinTextSize = props.MinSize or 8, Parent = label })
	end
	local thick = props.Stroke
	if thick == nil then
		thick = 2.5
	end
	if thick > 0 then
		UIKit.new("UIStroke", {
			Name = "TextStroke",
			Thickness = thick,
			Color = UIKit.Black,
			ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual,
			LineJoinMode = Enum.LineJoinMode.Round,
			Parent = label,
		})
	end
	if props.Parent then
		label.Parent = props.Parent
	end
	return label
end

-- «Пружинящая» анимация при наведении и нажатии
function UIKit.bounce(btn)
	local scale = btn:FindFirstChildOfClass("UIScale") or UIKit.new("UIScale", { Parent = btn })
	local hovering = false
	btn.MouseEnter:Connect(function()
		hovering = true
		UIKit.tween(scale, 0.12, { Scale = 1.06 })
	end)
	btn.MouseLeave:Connect(function()
		hovering = false
		UIKit.tween(scale, 0.12, { Scale = 1 })
	end)
	btn.MouseButton1Down:Connect(function()
		UIKit.tween(scale, 0.07, { Scale = 0.92 })
	end)
	btn.MouseButton1Up:Connect(function()
		local target = (hovering and UserInputService.MouseEnabled) and 1.06 or 1
		UIKit.tween(scale, 0.25, { Scale = target }, Enum.EasingStyle.Back)
	end)
	return scale
end

-- Кнопка с градиентом, обводкой и бликом
function UIKit.button(props)
	local btn = Instance.new("TextButton")
	btn.Name = props.Name or "Button"
	btn.AutoButtonColor = false
	btn.Text = ""
	btn.BackgroundColor3 = UIKit.White
	btn.Size = props.Size or UDim2.fromOffset(170, 52)
	btn.Position = props.Position or UDim2.new()
	btn.AnchorPoint = props.AnchorPoint or Vector2.zero
	btn.LayoutOrder = props.LayoutOrder or 0
	btn.ZIndex = props.ZIndex or 1
	local radius = props.Corner or 14
	UIKit.corner(btn, radius)
	local grad = UIKit.gradient(btn, props.Colors or UIKit.C.Green, 90)
	UIKit.stroke(btn, props.StrokeThickness or 3)
	local gloss = UIKit.frame({
		Name = "Gloss",
		Color = UIKit.White,
		Transparency = 0.8,
		Size = UDim2.new(1, -8, 0.42, 0),
		Position = UDim2.fromOffset(4, 3),
		ZIndex = btn.ZIndex,
		Corner = math.max(2, radius - 4),
		Parent = btn,
	})
	gloss.Active = false
	local label = UIKit.text({
		Name = "Label",
		Text = props.Text or "",
		Size = UDim2.new(1, -14, 1, -10),
		Position = UDim2.fromScale(0.5, 0.5),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Color = props.TextColor,
		MaxSize = props.MaxSize or 30,
		ZIndex = btn.ZIndex + 1,
		Parent = btn,
	})
	UIKit.bounce(btn)
	if props.OnClick then
		btn.Activated:Connect(function()
			Sound.play("Click", 0.45)
			props.OnClick()
		end)
	end
	if props.Parent then
		btn.Parent = props.Parent
	end
	return btn, label, grad
end

function UIKit.setButton(btn, text, colors)
	local label = btn:FindFirstChild("Label")
	if label and text then
		label.Text = text
	end
	local grad = btn:FindFirstChildOfClass("UIGradient")
	if grad and colors then
		grad.Color = ColorSequence.new(colors[1], colors[2])
	end
end

-- Квадратная кнопка HUD с иконкой и подписью
function UIKit.iconButton(props)
	local btn = Instance.new("TextButton")
	btn.Name = props.Name or "IconButton"
	btn.AutoButtonColor = false
	btn.Text = ""
	btn.BackgroundColor3 = UIKit.White
	btn.Size = props.Size or UDim2.fromOffset(100, 104)
	btn.LayoutOrder = props.LayoutOrder or 0
	UIKit.corner(btn, 22)
	UIKit.gradient(btn, props.Colors or UIKit.C.Dark, 90)
	UIKit.stroke(btn, 4)
	UIKit.text({
		Name = "Icon",
		Text = props.Icon or "⭐",
		Size = UDim2.new(1, -16, 0.6, 0),
		Position = UDim2.new(0.5, 0, 0, 6),
		AnchorPoint = Vector2.new(0.5, 0),
		Stroke = 0,
		Parent = btn,
	})
	UIKit.text({
		Name = "Label",
		Text = props.Text or "",
		Size = UDim2.new(1, -8, 0.28, 0),
		Position = UDim2.new(0.5, 0, 1, -6),
		AnchorPoint = Vector2.new(0.5, 1),
		Color = UIKit.Yellow,
		MaxSize = 20,
		Parent = btn,
	})
	local dot = UIKit.frame({
		Name = "Dot",
		Color = UIKit.White,
		Size = UDim2.fromOffset(30, 30),
		Position = UDim2.new(1, 8, 0, -8),
		AnchorPoint = Vector2.new(1, 0),
		Corner = 15,
		Stroke = 3,
		Gradient = UIKit.C.Red,
		Visible = false,
		ZIndex = 3,
		Parent = btn,
	})
	UIKit.text({ Text = "!", Size = UDim2.fromScale(0.8, 0.8), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), ZIndex = 4, Parent = dot })
	UIKit.bounce(btn)
	if props.OnClick then
		btn.Activated:Connect(function()
			Sound.play("Click", 0.45)
			props.OnClick()
		end)
	end
	if props.Parent then
		btn.Parent = props.Parent
	end
	return btn
end

-- Цветная плашка-бейдж («ВЫГОДНО», «ЛЕГЕНДА»…)
function UIKit.badge(parent, text, colors, rainbow)
	local b = UIKit.frame({
		Name = "Badge",
		Color = UIKit.White,
		Size = UDim2.new(0.86, 0, 0, 24),
		Position = UDim2.new(0.5, 0, 0, -13),
		AnchorPoint = Vector2.new(0.5, 0),
		Corner = 12,
		Stroke = 3,
		ZIndex = 5,
		Parent = parent,
	})
	if rainbow then
		UIKit.rainbow(b)
	else
		UIKit.gradient(b, colors or UIKit.C.Blue, 90)
	end
	UIKit.text({ Text = text, Size = UDim2.new(1, -10, 1, -4), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 15, Stroke = 2, ZIndex = 6, Parent = b })
	return b
end

-- Карточка товара: градиент, название, иконка в кольце, характеристика, кнопка
function UIKit.card(props)
	local card = UIKit.frame({
		Name = props.Name or "Card",
		Color = UIKit.White,
		Size = props.Size or UDim2.fromOffset(176, 236),
		LayoutOrder = props.LayoutOrder or 0,
		Corner = 18,
		Stroke = 4,
		Parent = props.Parent,
	})
	local grad = UIKit.gradient(card, { props.Top, props.Bottom }, 90)
	UIKit.text({ Name = "Title", Text = props.Title or "", Size = UDim2.new(1, -14, 0, 28), Position = UDim2.new(0.5, 0, 0, 12), AnchorPoint = Vector2.new(0.5, 0), MaxSize = 22, Parent = card })
	local ring = UIKit.frame({
		Name = "Ring",
		Color = UIKit.White,
		Transparency = 0.7,
		Size = UDim2.fromOffset(78, 78),
		Position = UDim2.new(0.5, 0, 0, 44),
		AnchorPoint = Vector2.new(0.5, 0),
		Corner = 39,
		Parent = card,
	})
	UIKit.stroke(ring, 3, UIKit.White, 0.45)
	UIKit.text({ Name = "Icon", Text = props.Icon or "⛏", Size = UDim2.fromScale(0.72, 0.72), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), Stroke = 0, Parent = ring })
	local pill = UIKit.frame({
		Name = "Pill",
		Color = UIKit.Black,
		Transparency = 0.62,
		Size = UDim2.new(1, -36, 0, 26),
		Position = UDim2.new(0.5, 0, 0, 130),
		AnchorPoint = Vector2.new(0.5, 0),
		Corner = 13,
		Parent = card,
	})
	UIKit.text({ Name = "Stat", Text = props.Stat or "", Size = UDim2.new(1, -12, 1, -6), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), Weight = "bold", MaxSize = 16, Stroke = 2, Parent = pill })
	local button, label = UIKit.button({
		Name = "Buy",
		Text = props.ButtonText or "",
		Colors = props.ButtonColors or UIKit.C.Green,
		Size = UDim2.new(1, -20, 0, 46),
		Position = UDim2.new(0.5, 0, 1, -10),
		AnchorPoint = Vector2.new(0.5, 1),
		MaxSize = 24,
		OnClick = props.OnClick,
		Parent = card,
	})
	if props.Badge then
		UIKit.badge(card, props.Badge, props.BadgeColors, props.BadgeRainbow)
	end
	return card, button, label, grad
end

-- Полупрозрачная полоска прогресса
function UIKit.bar(props)
	local bar = UIKit.frame({
		Name = props.Name or "Bar",
		Color = props.Back or Color3.fromRGB(20, 20, 28),
		Size = props.Size or UDim2.fromOffset(300, 22),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
		LayoutOrder = props.LayoutOrder or 0,
		Corner = props.Corner or 11,
		Stroke = props.Stroke or 3,
		Clip = false,
		Parent = props.Parent,
	})
	local fill = UIKit.frame({
		Name = "Fill",
		Color = UIKit.White,
		Size = UDim2.fromScale(0, 1),
		Corner = props.Corner or 11,
		Parent = bar,
	})
	UIKit.gradient(fill, props.Colors or UIKit.C.Green, 90)
	local label = UIKit.text({ Name = "Label", Text = "", Size = UDim2.new(1, -10, 1, -4), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), Weight = "bold", MaxSize = props.TextMax or 15, Stroke = 2, ZIndex = 3, Parent = bar })
	return bar, fill, label
end

function UIKit.setBar(bar, fraction, text)
	local fill = bar:FindFirstChild("Fill")
	if fill then
		fraction = math.clamp(fraction or 0, 0, 1)
		fill.Visible = fraction > 0.001
		UIKit.tween(fill, 0.25, { Size = UDim2.fromScale(math.max(fraction, 0.04), 1) })
	end
	local label = bar:FindFirstChild("Label")
	if label and text then
		label.Text = text
	end
end

function UIKit.pop(obj, from, time)
	local scale = obj:FindFirstChild("PopScale") or UIKit.new("UIScale", { Name = "PopScale", Parent = obj })
	scale.Scale = from or 0.6
	return UIKit.tween(scale, time or 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
end

-- Экран, который масштабируется под любой размер (дизайн рассчитан на 1280x720)
function UIKit.screen(name, displayOrder)
	local player = Players.LocalPlayer
	local gui = UIKit.new("ScreenGui", {
		Name = name,
		ResetOnSpawn = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		DisplayOrder = displayOrder or 1,
		IgnoreGuiInset = false,
	})
	pcall(function()
		gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
	end)
	-- центр корня совпадает с центром экрана, поэтому масштаб не сдвигает интерфейс
	local root = UIKit.frame({ Name = "Root", Transparency = 1, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Parent = gui })
	local scale = UIKit.new("UIScale", { Name = "Fit", Parent = root })
	local function fit()
		local size = gui.AbsoluteSize
		if size.X < 10 or size.Y < 10 then
			return
		end
		local s = math.clamp(math.min(size.X / 1280, size.Y / 720) * 1.08, 0.45, 1.6)
		scale.Scale = s
		root.Size = UDim2.fromScale(1 / s, 1 / s)
	end
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(fit)
	gui.Parent = player:WaitForChild("PlayerGui")
	fit()
	task.defer(fit)
	return gui, root, scale
end

return UIKit
