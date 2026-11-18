-- Эффекты: осколки блоков, пыль от ударов, «+1 Сапфир», летящие монеты,
-- конфетти, вспышки, тряска камеры.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Debris = game:GetService("Debris")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)
local Sound = require(script.Parent.Sound)

local Effects = {}

local camera = workspace.CurrentCamera
local fxFolder = nil
local dustPart, dustAttachment, dustEmitter, sparkEmitter
local gui, root

local shakeUntil = 0
local shakePower = 0

local function newFxFolder()
	fxFolder = Instance.new("Folder")
	fxFolder.Name = "LocalFx"
	fxFolder.Parent = workspace
end

local function makeEmitters()
	dustPart = Instance.new("Part")
	dustPart.Name = "FxAnchor"
	dustPart.Anchored = true
	dustPart.CanCollide = false
	dustPart.CanQuery = false
	dustPart.CanTouch = false
	dustPart.Transparency = 1
	dustPart.Size = Vector3.new(0.2, 0.2, 0.2)
	dustPart.Parent = fxFolder
	dustAttachment = Instance.new("Attachment")
	dustAttachment.Parent = dustPart

	dustEmitter = Instance.new("ParticleEmitter")
	dustEmitter.Name = "Dust"
	dustEmitter.Enabled = false
	dustEmitter.Lifetime = NumberRange.new(0.35, 0.7)
	dustEmitter.Speed = NumberRange.new(6, 14)
	dustEmitter.SpreadAngle = Vector2.new(180, 180)
	dustEmitter.Acceleration = Vector3.new(0, -30, 0)
	dustEmitter.Drag = 3
	dustEmitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.55), NumberSequenceKeypoint.new(1, 0) })
	dustEmitter.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 0.6) })
	dustEmitter.Rotation = NumberRange.new(0, 360)
	dustEmitter.RotSpeed = NumberRange.new(-200, 200)
	dustEmitter.Parent = dustAttachment

	sparkEmitter = Instance.new("ParticleEmitter")
	sparkEmitter.Name = "Sparks"
	sparkEmitter.Enabled = false
	sparkEmitter.LightEmission = 1
	sparkEmitter.Lifetime = NumberRange.new(0.4, 0.9)
	sparkEmitter.Speed = NumberRange.new(8, 20)
	sparkEmitter.SpreadAngle = Vector2.new(180, 180)
	sparkEmitter.Acceleration = Vector3.new(0, -12, 0)
	sparkEmitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.6), NumberSequenceKeypoint.new(1, 0) })
	sparkEmitter.Parent = dustAttachment
end

function Effects.init()
	newFxFolder()
	makeEmitters()
	gui, root = UIKit.screen("FxGui", 30)

	-- тряска камеры поверх обычной камеры
	RunService:BindToRenderStep("DigShake", Enum.RenderPriority.Camera.Value + 2, function()
		local now = os.clock()
		if now < shakeUntil then
			local left = (shakeUntil - now)
			local p = shakePower * math.min(1, left * 2)
			local offset = Vector3.new((math.random() - 0.5) * p, (math.random() - 0.5) * p, (math.random() - 0.5) * p * 0.5)
			camera.CFrame = camera.CFrame * CFrame.new(offset)
		end
	end)
end

function Effects.shake(power, duration)
	shakePower = math.max(power, os.clock() < shakeUntil and shakePower or 0)
	shakeUntil = math.max(shakeUntil, os.clock() + duration)
end

-- Пыль при ударе по блоку
function Effects.hit(block)
	if not block or not block.Parent then
		return
	end
	local cam = camera.CFrame.Position
	local toCam = (cam - block.Position)
	local pos = block.Position + (toCam.Magnitude > 0 and toCam.Unit * (Config.BlockSize * 0.5) or Vector3.zero)
	dustPart.Position = pos
	dustEmitter.Color = ColorSequence.new(block.Color)
	dustEmitter:Emit(7)
	-- блок чуть «вздрагивает»
	local original = block.Size
	block.Size = original * 0.94
	task.delay(0.06, function()
		if block.Parent then
			block.Size = original
		end
	end)
end

-- Осколки и искры, когда блок разрушен (видят все игроки)
function Effects.breakBlock(pos, color)
	if not pos then
		return
	end
	local cam = camera.CFrame.Position
	if (cam - pos).Magnitude > 220 then
		return
	end
	dustPart.Position = pos
	dustEmitter.Color = ColorSequence.new(color)
	dustEmitter:Emit(14)
	for _ = 1, 6 do
		local chunk = Instance.new("Part")
		chunk.Anchored = true
		chunk.CanCollide = false
		chunk.CanQuery = false
		chunk.CanTouch = false
		chunk.CastShadow = false
		chunk.Material = Enum.Material.SmoothPlastic
		chunk.Color = color
		local s = 0.7 + math.random() * 0.9
		chunk.Size = Vector3.new(s, s, s)
		chunk.CFrame = CFrame.new(pos + Vector3.new((math.random() - 0.5) * 3, (math.random() - 0.5) * 3, (math.random() - 0.5) * 3))
			* CFrame.Angles(math.random() * 6, math.random() * 6, math.random() * 6)
		chunk.Parent = fxFolder
		local dir = Vector3.new(math.random() - 0.5, math.random() * 0.8 + 0.2, math.random() - 0.5).Unit
		local goal = chunk.CFrame + dir * (4 + math.random() * 4) - Vector3.new(0, 2 + math.random() * 3, 0)
		TweenService:Create(chunk, TweenInfo.new(0.55, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			CFrame = goal * CFrame.Angles(math.random() * 4, math.random() * 4, 0),
			Size = Vector3.new(0.05, 0.05, 0.05),
			Transparency = 0.3,
		}):Play()
		Debris:AddItem(chunk, 0.6)
	end
end

-- «+1 Сапфир» над разбитым блоком
function Effects.orePopup(oreId, pos)
	local ore = Config.Ores[oreId]
	if not ore or not pos then
		return
	end
	local rare = false
	for _, layer in ipairs(Config.Layers) do
		if layer.Rare.Id == oreId then
			rare = true
		end
	end
	local holder = Instance.new("Part")
	holder.Anchored = true
	holder.CanCollide = false
	holder.CanQuery = false
	holder.CanTouch = false
	holder.Transparency = 1
	holder.Size = Vector3.new(0.2, 0.2, 0.2)
	holder.Position = pos + Vector3.new(0, 2, 0)
	holder.Parent = fxFolder
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset(rare and 260 or 200, rare and 64 or 46)
	bb.AlwaysOnTop = true
	bb.LightInfluence = 0
	bb.MaxDistance = 140
	bb.Adornee = holder
	bb.Parent = holder
	local label = UIKit.text({
		Text = "+1 " .. ore.Emoji .. " " .. State.name(ore.Name),
		Color = rare and ore.Color or UIKit.White,
		Stroke = 3,
		Parent = bb,
	})
	if rare then
		sparkEmitter.Color = ColorSequence.new(ore.Color)
		dustPart.Position = pos
		sparkEmitter:Emit(24)
		Sound.play("Coin", 0.55, 1.25)
	end
	local scale = UIKit.new("UIScale", { Scale = 0.4, Parent = label })
	UIKit.tween(scale, 0.25, { Scale = 1 }, Enum.EasingStyle.Back)
	TweenService:Create(holder, TweenInfo.new(1.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Position = holder.Position + Vector3.new(0, 4, 0) }):Play()
	task.delay(0.7, function()
		UIKit.tween(label, 0.4, { TextTransparency = 1 })
		local stroke = label:FindFirstChildOfClass("UIStroke")
		if stroke then
			UIKit.tween(stroke, 0.4, { Transparency = 1 })
		end
	end)
	Debris:AddItem(holder, 1.2)
end

-- Плавающий текст на экране (позиция в «дизайн-пикселях» корня)
function Effects.floatText(text, color, position, size)
	local label = UIKit.text({
		Text = text,
		Color = color or UIKit.Cash,
		Size = UDim2.fromOffset(size and size * 8 or 260, size or 44),
		Position = position or UDim2.fromScale(0.5, 0.45),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Stroke = 3,
		ZIndex = 20,
		Parent = root,
	})
	UIKit.pop(label, 0.3)
	UIKit.tween(label, 1.1, { Position = label.Position - UDim2.fromOffset(0, 70) }, Enum.EasingStyle.Quad)
	task.delay(0.75, function()
		UIKit.tween(label, 0.35, { TextTransparency = 1 })
		local stroke = label:FindFirstChildOfClass("UIStroke")
		if stroke then
			UIKit.tween(stroke, 0.35, { Transparency = 1 })
		end
	end)
	Debris:AddItem(label, 1.2)
end

-- Монеты летят из центра экрана к счётчику денег
function Effects.coinBurst(count, target)
	target = target or UDim2.new(0, 120, 1, -40)
	for i = 1, count do
		local coin = UIKit.text({
			Text = "💰",
			Size = UDim2.fromOffset(46, 46),
			Position = UDim2.new(0.5, math.random(-140, 140), 0.5, math.random(-90, 90)),
			AnchorPoint = Vector2.new(0.5, 0.5),
			Stroke = 0,
			ZIndex = 25,
			Parent = root,
		})
		UIKit.pop(coin, 0.2, 0.25)
		task.delay(0.15 + i * 0.04, function()
			local t = UIKit.tween(coin, 0.55, { Position = target, Size = UDim2.fromOffset(26, 26) }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
			t.Completed:Connect(function()
				coin:Destroy()
				Sound.play("Coin", 0.25, 1 + math.random() * 0.4)
			end)
		end)
	end
end

-- Конфетти по всему экрану
function Effects.confetti(amount, duration)
	amount = amount or 70
	duration = duration or 2.4
	local colors = {
		Color3.fromRGB(255, 77, 77), Color3.fromRGB(255, 159, 28), Color3.fromRGB(255, 225, 77),
		Color3.fromRGB(76, 217, 100), Color3.fromRGB(47, 155, 255), Color3.fromRGB(176, 92, 255),
	}
	for _ = 1, amount do
		local piece = UIKit.frame({
			Color = colors[math.random(1, #colors)],
			Size = UDim2.fromOffset(math.random(10, 18), math.random(16, 26)),
			Position = UDim2.new(math.random(), 0, 0, -40 - math.random(0, 200)),
			ZIndex = 40,
			Parent = root,
		})
		piece.Rotation = math.random(0, 360)
		local time = duration * (0.7 + math.random() * 0.6)
		UIKit.tween(piece, time, {
			Position = UDim2.new(piece.Position.X.Scale + (math.random() - 0.5) * 0.2, 0, 1, 60),
			Rotation = piece.Rotation + math.random(-540, 540),
		}, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		Debris:AddItem(piece, time + 0.1)
	end
end

-- Вспышка цветом на весь экран
function Effects.flash(color, duration, startTransparency)
	local f = UIKit.frame({
		Name = "Flash",
		Color = color or UIKit.White,
		Transparency = startTransparency or 0.1,
		Size = UDim2.fromScale(3, 3),
		Position = UDim2.fromScale(0.5, 0.5),
		AnchorPoint = Vector2.new(0.5, 0.5),
		ZIndex = 50,
		Parent = root,
	})
	UIKit.tween(f, duration or 0.6, { BackgroundTransparency = 1 })
	Debris:AddItem(f, (duration or 0.6) + 0.1)
end

-- Затемнение (для перехода): возвращает функцию, которая убирает затемнение
function Effects.fade(duration)
	local f = UIKit.frame({
		Name = "Fade",
		Color = UIKit.Black,
		Transparency = 1,
		Size = UDim2.fromScale(3, 3),
		Position = UDim2.fromScale(0.5, 0.5),
		AnchorPoint = Vector2.new(0.5, 0.5),
		ZIndex = 60,
		Parent = root,
	})
	UIKit.tween(f, duration or 0.5, { BackgroundTransparency = 0 })
	return function(outTime)
		local t = UIKit.tween(f, outTime or 0.6, { BackgroundTransparency = 1 })
		t.Completed:Connect(function()
			f:Destroy()
		end)
	end
end

function Effects.root()
	return root
end

return Effects
