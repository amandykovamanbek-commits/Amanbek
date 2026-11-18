-- Мир: надписи на табличках (на языке игрока), подписи над кругами
-- «встань в круг», открытие окон при входе в круг, вращающиеся кристаллы и монеты.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)

local World = {}

local player = Players.LocalPlayer
local signs = {} -- { part, key, gui }
local pads = {} -- { part, kind, gui, inside }
local spinners = {} -- { part, base, speed, bob }
local container = nil
local onPad = nil

local SIGN_COLORS = {
	Title = Color3.fromRGB(255, 220, 70),
	Sub = Color3.fromRGB(255, 255, 255),
	Mine = Color3.fromRGB(255, 220, 70),
}

local function t(key, ...)
	return State.t(key, ...)
end

local function map()
	return workspace:FindFirstChild("Map")
end

local function buildSign(entry)
	if entry.gui then
		entry.gui:Destroy()
	end
	local part = entry.part
	local gui = Instance.new("SurfaceGui")
	gui.Name = "Sign_" .. entry.key
	gui.Adornee = part
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 24
	gui.LightInfluence = 0
	gui.Brightness = 1.2
	gui.ZOffset = 1
	gui.Parent = container
	UIKit.text({
		Text = t("Sign_" .. entry.key),
		Size = UDim2.fromScale(0.94, 0.86),
		Position = UDim2.fromScale(0.5, 0.5),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Color = SIGN_COLORS[entry.key] or UIKit.White,
		Stroke = 6,
		Parent = gui,
	})
	entry.gui = gui
end

local function buildPadLabel(entry)
	if entry.gui then
		entry.gui:Destroy()
	end
	local cfg = Config.Pads[entry.kind]
	local gui = Instance.new("BillboardGui")
	gui.Name = "Pad_" .. entry.kind
	gui.Adornee = entry.part
	gui.Size = UDim2.fromOffset(260, 120)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 8, 0)
	gui.LightInfluence = 0
	gui.MaxDistance = 140
	gui.Parent = container
	UIKit.text({ Name = "Icon", Text = cfg and cfg.Icon or "⭐", Size = UDim2.fromOffset(56, 56), Position = UDim2.new(0.5, 0, 0, 0), AnchorPoint = Vector2.new(0.5, 0), Stroke = 0, Parent = gui })
	UIKit.text({ Name = "Title", Text = t("Pad_" .. entry.kind), Size = UDim2.new(1, 0, 0, 36), Position = UDim2.new(0.5, 0, 0, 56), AnchorPoint = Vector2.new(0.5, 0), Color = cfg and cfg.Color:Lerp(Color3.new(1, 1, 1), 0.35) or UIKit.White, Stroke = 4, Parent = gui })
	UIKit.text({ Name = "Hint", Text = "⬇ " .. t("StepIn") .. " ⬇", Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0.5, 0, 0, 94), AnchorPoint = Vector2.new(0.5, 0), Weight = "bold", Stroke = 3, Parent = gui })
	entry.gui = gui
end

function World.refreshTexts()
	UIKit.lang = State.lang
	for _, entry in ipairs(signs) do
		buildSign(entry)
	end
	for _, entry in ipairs(pads) do
		buildPadLabel(entry)
	end
end

local function scan()
	local m = map()
	if not m then
		return
	end
	for _, item in ipairs(m:GetDescendants()) do
		if item:IsA("StringValue") and item.Parent:IsA("BasePart") then
			if item.Name == "SignKey" then
				table.insert(signs, { part = item.Parent, key = item.Value })
			elseif item.Name == "PadKind" then
				table.insert(pads, { part = item.Parent, kind = item.Value, inside = false })
			elseif item.Name == "Spin" then
				local speed = tonumber(item.Value) or 1
				table.insert(spinners, { part = item.Parent, base = item.Parent.CFrame, speed = speed, phase = math.random() * 6 })
			end
		end
	end
end

function World.init(padCallback)
	onPad = padCallback
	container = Instance.new("Folder")
	container.Name = "WorldLabels"
	container.Parent = player:WaitForChild("PlayerGui")
	if not map() then
		workspace:WaitForChild("Map", 15)
	end
	scan()
	World.refreshTexts()

	-- круги: открыть окно, когда игрок встал в круг
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		local now = os.clock()
		for _, s in ipairs(spinners) do
			if s.part.Parent then
				local angle = now * s.speed + s.phase
				s.part.CFrame = s.base * CFrame.new(0, math.sin(angle * 1.3) * 0.6, 0) * CFrame.Angles(0, angle, 0)
			end
		end
		acc = acc + dt
		if acc < 0.15 then
			return
		end
		acc = 0
		local char = player.Character
		local rootPart = char and char:FindFirstChild("HumanoidRootPart")
		if not rootPart then
			return
		end
		for _, pad in ipairs(pads) do
			local delta = rootPart.Position - pad.part.Position
			local flat = Vector3.new(delta.X, 0, delta.Z).Magnitude
			local inside = flat <= Config.PadRadius and math.abs(delta.Y) < 8
			if inside and not pad.inside and onPad then
				onPad(pad.kind)
			end
			pad.inside = inside
		end
	end)
end

return World
