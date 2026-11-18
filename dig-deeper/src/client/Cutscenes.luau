-- Катсцены: интро при первом входе, «Новый слой!», перерождение, ядро планеты,
-- обновление шахты. Камера летает по заранее заданным траекториям,
-- сверху и снизу — «кинорамка», большие надписи с анимацией.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Locale = require(Shared:WaitForChild("Locale"))
local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)
local Sound = require(script.Parent.Sound)
local Effects = require(script.Parent.Effects)

local Cutscenes = {}

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local gui, root
local topBar, bottomBar, skipArea
local active = false
local skipRequested = false
local queue = {}
local running = false
local texts = {}
local saved = nil
local onActiveChanged = nil

local function t(key, ...)
	return State.t(key, ...)
end

local function ease(a)
	return TweenService:GetValue(math.clamp(a, 0, 1), Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
end

local function easeIn(a)
	return TweenService:GetValue(math.clamp(a, 0, 1), Enum.EasingStyle.Quad, Enum.EasingDirection.In)
end

local function character()
	local char = player.Character
	return char, char and char:FindFirstChildOfClass("Humanoid"), char and char:FindFirstChild("HumanoidRootPart")
end

function Cutscenes.isActive()
	return active
end

function Cutscenes.init(callback)
	onActiveChanged = callback
	gui, root = UIKit.screen("CutsceneGui", 40)
	topBar = UIKit.frame({ Name = "TopBar", Color = UIKit.Black, Size = UDim2.new(3, 0, 0, 92), Position = UDim2.new(0.5, 0, 0, -400), AnchorPoint = Vector2.new(0.5, 1), ZIndex = 30, Parent = root })
	bottomBar = UIKit.frame({ Name = "BottomBar", Color = UIKit.Black, Size = UDim2.new(3, 0, 0, 92), Position = UDim2.new(0.5, 0, 1, 400), AnchorPoint = Vector2.new(0.5, 0), ZIndex = 30, Parent = root })
	skipArea = Instance.new("TextButton")
	skipArea.Name = "SkipArea"
	skipArea.Text = ""
	skipArea.BackgroundTransparency = 1
	skipArea.Size = UDim2.fromScale(3, 3)
	skipArea.Position = UDim2.fromScale(0.5, 0.5)
	skipArea.AnchorPoint = Vector2.new(0.5, 0.5)
	skipArea.Visible = false
	skipArea.ZIndex = 5
	skipArea.Parent = root
	skipArea.Activated:Connect(function()
		skipRequested = true
	end)
end

local function letterbox(on, time)
	time = time or 0.45
	if on then
		UIKit.tween(topBar, time, { Position = UDim2.new(0.5, 0, 0, 92) })
		UIKit.tween(bottomBar, time, { Position = UDim2.new(0.5, 0, 1, -92) })
	else
		UIKit.tween(topBar, time, { Position = UDim2.new(0.5, 0, 0, -400) })
		UIKit.tween(bottomBar, time, { Position = UDim2.new(0.5, 0, 1, 400) })
	end
end

local function freeze(on)
	local _, humanoid, rootPart = character()
	if on then
		if humanoid then
			saved = { walk = humanoid.WalkSpeed, jump = humanoid.JumpPower, height = humanoid.JumpHeight }
			humanoid.WalkSpeed = 0
			humanoid.JumpPower = 0
			humanoid.JumpHeight = 0
		end
		if rootPart then
			rootPart.Anchored = true
		end
	else
		if humanoid and saved then
			humanoid.WalkSpeed = saved.walk > 0 and saved.walk or Config.WalkSpeed
			humanoid.JumpPower = saved.jump > 0 and saved.jump or 50
			humanoid.JumpHeight = saved.height > 0 and saved.height or 7.2
		end
		if rootPart then
			rootPart.Anchored = false
		end
	end
end

local function clearTexts()
	for _, label in ipairs(texts) do
		if label.Parent then
			label:Destroy()
		end
	end
	texts = {}
end

local function begin(tapToSkip)
	active = true
	skipRequested = false
	if onActiveChanged then
		onActiveChanged(true)
	end
	camera.CameraType = Enum.CameraType.Scriptable
	freeze(true)
	letterbox(true)
	skipArea.Visible = tapToSkip == true
end

local function finish()
	skipArea.Visible = false
	letterbox(false)
	for _, label in ipairs(texts) do
		if label.Parent then
			UIKit.tween(label, 0.3, { TextTransparency = 1 })
			local stroke = label:FindFirstChildOfClass("UIStroke")
			if stroke then
				UIKit.tween(stroke, 0.3, { Transparency = 1 })
			end
		end
	end
	task.delay(0.35, clearTexts)
	freeze(false)
	camera.CameraType = Enum.CameraType.Custom
	local _, humanoid = character()
	if humanoid then
		camera.CameraSubject = humanoid
	end
	active = false
	if onActiveChanged then
		onActiveChanged(false)
	end
end

-- Двигает камеру: fn(alpha 0..1) -> CFrame
local function runCamera(duration, fn)
	local start = os.clock()
	while true do
		local a = (os.clock() - start) / duration
		if a >= 1 or skipRequested then
			camera.CFrame = fn(math.min(a, 1))
			return
		end
		camera.CFrame = fn(a)
		RunService.RenderStepped:Wait()
	end
end

local function waitFor(seconds)
	local start = os.clock()
	while os.clock() - start < seconds and not skipRequested do
		task.wait()
	end
end

-- Большая надпись с «прыжком»
local function bigText(text, color, yScale, height, gradientPair)
	local label = UIKit.text({
		Text = text,
		Color = gradientPair and UIKit.White or (color or UIKit.White),
		Size = UDim2.new(0.92, 0, 0, height),
		Position = UDim2.fromScale(0.5, yScale),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Stroke = math.max(3, math.floor(height / 16)),
		MaxSize = height,
		ZIndex = 20,
		Parent = root,
	})
	if gradientPair then
		UIKit.gradient(label, gradientPair, 90)
	end
	label.Rotation = -7
	UIKit.tween(label, 0.55, { Rotation = 0 }, Enum.EasingStyle.Back)
	UIKit.pop(label, 0.25, 0.5)
	table.insert(texts, label)
	return label
end

-- Искорки-звёздочки вокруг надписи
local function sparkles(count, color)
	for _ = 1, count do
		local s = UIKit.text({
			Text = "✦",
			Color = color or UIKit.Yellow,
			Size = UDim2.fromOffset(34, 34),
			Position = UDim2.new(0.5 + (math.random() - 0.5) * 0.7, 0, 0.42 + (math.random() - 0.5) * 0.35, 0),
			AnchorPoint = Vector2.new(0.5, 0.5),
			Stroke = 2,
			ZIndex = 19,
			Parent = root,
		})
		UIKit.pop(s, 0, 0.4)
		UIKit.tween(s, 1.4, { Rotation = math.random(-180, 180), Position = s.Position - UDim2.fromOffset(0, 40) })
		task.delay(0.9, function()
			UIKit.tween(s, 0.4, { TextTransparency = 1 })
		end)
		Debris:AddItem(s, 1.5)
	end
end

local function enqueue(fn)
	table.insert(queue, fn)
	if running then
		return
	end
	running = true
	task.spawn(function()
		while #queue > 0 do
			local job = table.remove(queue, 1)
			local ok, err = pcall(job)
			if not ok then
				warn("[Копай глубже] Катсцена: " .. tostring(err))
				if active then
					pcall(finish)
				end
			end
			task.wait(0.15)
		end
		running = false
	end)
end

-- Сколько свободного места над точкой (чтобы камера не влезала в блоки)
local function freeAbove(pos, maxHeight)
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local char = player.Character
	params.FilterDescendantsInstances = char and { char } or {}
	local hit = workspace:Raycast(pos, Vector3.new(0, maxHeight, 0), params)
	if hit then
		return math.max(4, hit.Distance - 1.5)
	end
	return maxHeight
end

---------------------------------------------------------------------
-- ИНТРО (первый вход в игру)
---------------------------------------------------------------------
function Cutscenes.intro()
	enqueue(function()
		begin(false)
		local S = Config.SurfaceY
		local center = Vector3.new(0, S, 0)
		local black = UIKit.frame({ Color = UIKit.Black, Size = UDim2.fromScale(3, 3), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), ZIndex = 35, Parent = root })
		UIKit.tween(black, 1.2, { BackgroundTransparency = 1 })
		Debris:AddItem(black, 1.3)

		local skip = UIKit.button({ Text = t("Skip"), Colors = UIKit.C.Gray, Size = UDim2.fromOffset(200, 48), Position = UDim2.new(1, -24, 0, 104), AnchorPoint = Vector2.new(1, 0), MaxSize = 20, ZIndex = 40, OnClick = function()
			skipRequested = true
		end, Parent = root })

		-- Кадр 1: облёт острова, название игры
		task.delay(0.5, function()
			if skipRequested then
				return
			end
			bigText(t("IntroTitle1"), UIKit.White, 0.27, 84)
			Sound.play("Reward", 0.5, 0.8)
			task.wait(0.35)
			if skipRequested then
				return
			end
			bigText(t("IntroTitle2"), nil, 0.43, 150, { Color3.fromRGB(255, 227, 107), Color3.fromRGB(255, 138, 30) })
			Sound.play("Reward", 0.5, 1.1)
			task.wait(0.6)
			if skipRequested then
				return
			end
			bigText(t("IntroTag"), UIKit.White, 0.6, 38)
		end)
		runCamera(4.4, function(a)
			local e = ease(a)
			local ang = math.rad(-160 + 70 * e)
			local r = 250 - 55 * e
			local h = 125 - 30 * e
			local pos = center + Vector3.new(math.sin(ang) * r, h, math.cos(ang) * r)
			return CFrame.lookAt(pos, center + Vector3.new(0, -12, 0))
		end)

		-- Кадр 2: ныряем в шахту + слои мелькают
		if not skipRequested then
			for _, label in ipairs(texts) do
				UIKit.tween(label, 0.3, { TextTransparency = 1 })
				local stroke = label:FindFirstChildOfClass("UIStroke")
				if stroke then
					UIKit.tween(stroke, 0.3, { Transparency = 1 })
				end
			end
			task.spawn(function()
				task.wait(0.5)
				for _, layer in ipairs(Config.Layers) do
					if skipRequested then
						return
					end
					Effects.flash(layer.Color, 0.35, 0.55)
					local chip = bigText(layer.Emoji .. " " .. string.upper(State.name(layer.Name)), nil, 0.5, 70, { layer.Color:Lerp(Color3.new(1, 1, 1), 0.55), layer.Color })
					Sound.play("Hit", 0.4, 0.7 + 0.1 * #texts)
					task.wait(0.33)
					UIKit.tween(chip, 0.15, { TextTransparency = 1 })
					local stroke = chip:FindFirstChildOfClass("UIStroke")
					if stroke then
						UIKit.tween(stroke, 0.15, { Transparency = 1 })
					end
				end
			end)
			local from = CFrame.lookAt(center + Vector3.new(-70, 80, -70), center + Vector3.new(0, -30, 0))
			local to = CFrame.lookAt(center + Vector3.new(0, 3, -1), center + Vector3.new(0, -90, 0.6))
			runCamera(3, function(a)
				return from:Lerp(to, easeIn(a))
			end)
		end

		-- Кадр 3: к игроку, цель игры и кнопка «Играть»
		Effects.flash(UIKit.White, 0.5, 0)
		local _, _, rootPart = character()
		local target = rootPart and rootPart.Position or Config.SpawnPosition
		local look = rootPart and rootPart.CFrame.LookVector or Vector3.new(0, 0, 1)
		local endCF = CFrame.lookAt(target - look * 15 + Vector3.new(0, 6.5, 0), target + Vector3.new(0, 1.5, 0))
		if not skipRequested then
			local startCF = CFrame.lookAt(target + Vector3.new(36, 55, -36), target)
			local goal = bigText(t("IntroGoal"), nil, 0.3, 96, { Color3.fromRGB(255, 240, 150), Color3.fromRGB(255, 120, 30) })
			goal.Name = "Goal"
			sparkles(14)
			local played = false
			local play = UIKit.button({ Text = t("Play"), Colors = UIKit.C.Green, Size = UDim2.fromOffset(320, 92), Position = UDim2.fromScale(0.5, 0.7), AnchorPoint = Vector2.new(0.5, 0.5), MaxSize = 50, StrokeThickness = 4, Corner = 22, ZIndex = 40, OnClick = function()
				played = true
			end, Parent = root })
			UIKit.pop(play, 0.3, 0.5)
			task.spawn(function()
				local scale = play:FindFirstChild("PopScale")
				while play.Parent and scale do
					UIKit.tween(scale, 0.5, { Scale = 1.07 }, Enum.EasingStyle.Sine)
					task.wait(0.5)
					UIKit.tween(scale, 0.5, { Scale = 1 }, Enum.EasingStyle.Sine)
					task.wait(0.5)
				end
			end)
			runCamera(2.6, function(a)
				return startCF:Lerp(endCF, ease(a))
			end)
			local started = os.clock()
			while not played and not skipRequested and os.clock() - started < 12 do
				task.wait()
			end
			play:Destroy()
		end
		camera.CFrame = endCF
		skip:Destroy()
		Remotes.Action:FireServer("IntroSeen")
		finish()
	end)
end

---------------------------------------------------------------------
-- НОВЫЙ СЛОЙ
---------------------------------------------------------------------
function Cutscenes.layer(index, reward)
	enqueue(function()
		local layer = Config.Layers[index]
		local _, _, rootPart = character()
		if not layer or not rootPart then
			return
		end
		begin(true)
		Effects.flash(layer.Color, 0.7, 0.15)
		Effects.shake(0.6, 0.4)
		Sound.play("Reward", 0.6, 1)
		local center = rootPart.Position
		local startCF = camera.CFrame
		local height = freeAbove(center, 26)
		bigText(t("NewLayer"), UIKit.Yellow, 0.27, 66)
		task.delay(0.25, function()
			bigText(layer.Emoji .. " " .. string.upper(State.name(layer.Name)), nil, 0.44, 124, { layer.Color:Lerp(Color3.new(1, 1, 1), 0.6), layer.Color })
			sparkles(12, layer.Color:Lerp(Color3.new(1, 1, 1), 0.4))
			Sound.play("Coin", 0.5, 1.3)
		end)
		task.delay(0.6, function()
			if reward and reward > 0 then
				bigText(t("LayerReward", tostring(layer.From), Locale.short(reward)), UIKit.Cash, 0.62, 40)
			else
				bigText(t("LayerDepth", tostring(layer.From)), UIKit.White, 0.62, 40)
			end
		end)
		runCamera(3.4, function(a)
			local e = ease(a)
			local ang = math.rad(200 * e)
			local top = CFrame.lookAt(center + Vector3.new(math.sin(ang) * 0.6, height, math.cos(ang) * 0.6), center)
			if a < 0.3 then
				return startCF:Lerp(top, ease(a / 0.3))
			end
			return top
		end)
		waitFor(0.4)
		finish()
	end)
end

---------------------------------------------------------------------
-- ПЕРЕРОЖДЕНИЕ
---------------------------------------------------------------------
function Cutscenes.rebirth(count, multiplier)
	enqueue(function()
		begin(true)
		Effects.flash(Color3.fromRGB(190, 110, 255), 0.9, 0)
		Sound.play("Reward", 0.6, 0.7)
		task.wait(0.2)
		local _, _, rootPart = character()
		local center = rootPart and rootPart.Position or Config.SpawnPosition
		bigText(t("RebirthCut", tostring(count)), nil, 0.34, 100, { Color3.fromRGB(255, 190, 255), Color3.fromRGB(150, 70, 255) })
		task.delay(0.4, function()
			bigText(t("RebirthCutSub", tostring(multiplier)), UIKit.Cash, 0.55, 54)
			Effects.confetti(80, 2.6)
			Sound.play("Coin", 0.5, 1.2)
		end)
		runCamera(3.6, function(a)
			local e = ease(a)
			local ang = math.rad(-30 + 300 * e)
			local r = 10 + 26 * e
			local h = 4 + 30 * e
			return CFrame.lookAt(center + Vector3.new(math.sin(ang) * r, h, math.cos(ang) * r), center + Vector3.new(0, 2, 0))
		end)
		waitFor(0.3)
		finish()
	end)
end

---------------------------------------------------------------------
-- ЯДРО ПЛАНЕТЫ (дно шахты)
---------------------------------------------------------------------
function Cutscenes.core(reward)
	enqueue(function()
		local _, _, rootPart = character()
		if not rootPart then
			return
		end
		begin(true)
		Effects.flash(Color3.fromRGB(255, 180, 80), 1, 0)
		Effects.shake(1.2, 1.2)
		Sound.play("Reward", 0.7, 0.6)
		local center = rootPart.Position
		local height = freeAbove(center, 180)
		bigText(t("CoreTitle"), nil, 0.32, 92, { Color3.fromRGB(255, 245, 160), Color3.fromRGB(255, 90, 20) })
		task.delay(0.5, function()
			bigText(t("CoreSub", Locale.short(reward or 0)), UIKit.Cash, 0.52, 40)
			Effects.confetti(120, 3.2)
		end)
		runCamera(4.2, function(a)
			local e = easeIn(a)
			local h = 5 + (height - 5) * e
			local ang = math.rad(90 * a)
			return CFrame.lookAt(center + Vector3.new(math.sin(ang) * 0.5, h, math.cos(ang) * 0.5), center)
		end)
		waitFor(0.6)
		finish()
	end)
end

---------------------------------------------------------------------
-- ОБНОВЛЕНИЕ ШАХТЫ
---------------------------------------------------------------------
function Cutscenes.resetWarn()
	Effects.shake(0.35, 1.5)
end

local unfade = nil
function Cutscenes.resetting()
	Effects.shake(1.6, 1.4)
	unfade = Effects.fade(1.1)
end

function Cutscenes.resetDone()
	if unfade then
		unfade(0.8)
		unfade = nil
	end
	Effects.flash(Color3.fromRGB(255, 240, 200), 0.6, 0.4)
end

return Cutscenes
