-- Атмосфера: красивое дневное небо на поверхности, а под землёй — своё
-- освещение, туман и цвет для каждого слоя + летающая пыль вокруг игрока.

local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))

local Ambience = {}

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local atmosphere, bloom, color, sunrays
local dustEmitter
local currentZone = nil

local SURFACE = {
	Ambient = Color3.fromRGB(105, 105, 118),
	OutdoorAmbient = Color3.fromRGB(150, 152, 165),
	Brightness = 2.6,
	FogColor = Color3.fromRGB(199, 222, 255),
	Density = 0.26,
	Haze = 1.2,
	Tint = Color3.fromRGB(255, 252, 245),
	Saturation = 0.18,
	Bloom = 0.5,
}

local function ensure(className, name)
	local inst = Lighting:FindFirstChild(name)
	if not inst then
		inst = Instance.new(className)
		inst.Name = name
		inst.Parent = Lighting
	end
	return inst
end

local function tween(obj, props, time)
	TweenService:Create(obj, TweenInfo.new(time or 1.2, Enum.EasingStyle.Sine, Enum.EasingDirection.Out), props):Play()
end

local function applySurface(time)
	tween(Lighting, { Ambient = SURFACE.Ambient, OutdoorAmbient = SURFACE.OutdoorAmbient, Brightness = SURFACE.Brightness, ExposureCompensation = 0.1 }, time)
	tween(atmosphere, { Density = SURFACE.Density, Color = SURFACE.FogColor, Haze = SURFACE.Haze, Glare = 0.3 }, time)
	tween(color, { TintColor = SURFACE.Tint, Saturation = SURFACE.Saturation, Contrast = 0.06, Brightness = 0.02 }, time)
	tween(bloom, { Intensity = SURFACE.Bloom, Threshold = 1.2 }, time)
	sunrays.Enabled = true
	if dustEmitter then
		dustEmitter.Enabled = false
	end
end

local function applyLayer(layer, time)
	tween(Lighting, { Ambient = layer.Ambient, OutdoorAmbient = layer.Ambient:Lerp(Color3.new(0, 0, 0), 0.35), Brightness = 0.35, ExposureCompensation = 0.25 }, time)
	tween(atmosphere, { Density = 0.48, Color = layer.Fog, Haze = 2.2, Glare = 0 }, time)
	tween(color, { TintColor = layer.Tint, Saturation = 0.25, Contrast = 0.12, Brightness = 0.03 }, time)
	tween(bloom, { Intensity = 1.1, Threshold = 0.9 }, time)
	sunrays.Enabled = false
	if dustEmitter then
		dustEmitter.Color = ColorSequence.new(layer.Common.Color:Lerp(Color3.new(1, 1, 1), 0.4))
		dustEmitter.Enabled = true
	end
end

-- Пыль летает в объёме вокруг игрока (невидимая коробка следует за ним)
local dustVolume = nil
local function makeDust()
	dustVolume = Instance.new("Part")
	dustVolume.Name = "DustVolume"
	dustVolume.Anchored = true
	dustVolume.CanCollide = false
	dustVolume.CanQuery = false
	dustVolume.CanTouch = false
	dustVolume.Transparency = 1
	dustVolume.Size = Vector3.new(34, 18, 34)
	dustVolume.Parent = workspace
	dustEmitter = Instance.new("ParticleEmitter")
	dustEmitter.Name = "AmbientDust"
	dustEmitter.Enabled = false
	dustEmitter.Rate = 22
	dustEmitter.Lifetime = NumberRange.new(2.5, 4.5)
	dustEmitter.Speed = NumberRange.new(0.3, 1.2)
	dustEmitter.SpreadAngle = Vector2.new(180, 180)
	dustEmitter.LightEmission = 0.6
	dustEmitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.2, 0.18), NumberSequenceKeypoint.new(1, 0) })
	dustEmitter.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.3, 0.3), NumberSequenceKeypoint.new(1, 1) })
	dustEmitter.Shape = Enum.ParticleEmitterShape.Box
	dustEmitter.ShapeStyle = Enum.ParticleEmitterShapeStyle.Volume
	dustEmitter.Parent = dustVolume
	RunService.Heartbeat:Connect(function()
		local char = player.Character
		local rootPart = char and char:FindFirstChild("HumanoidRootPart")
		if rootPart then
			dustVolume.Position = rootPart.Position
		end
	end)
end

function Ambience.init()
	Lighting.ClockTime = 14.3
	Lighting.GeographicLatitude = 28
	Lighting.GlobalShadows = true
	Lighting.EnvironmentDiffuseScale = 1
	Lighting.EnvironmentSpecularScale = 0.6
	pcall(function()
		Lighting.ShadowSoftness = 0.25
	end)

	atmosphere = workspace:FindFirstChildOfClass("Atmosphere") or Lighting:FindFirstChildOfClass("Atmosphere")
	if not atmosphere then
		atmosphere = Instance.new("Atmosphere")
		atmosphere.Parent = Lighting
	end
	atmosphere.Offset = 0.25
	atmosphere.Decay = Color3.fromRGB(106, 112, 125)
	bloom = ensure("BloomEffect", "DigBloom")
	bloom.Size = 28
	color = ensure("ColorCorrectionEffect", "DigColor")
	sunrays = ensure("SunRaysEffect", "DigSunRays")
	sunrays.Intensity = 0.06
	sunrays.Spread = 0.6
	if not Lighting:FindFirstChildOfClass("Sky") then
		local sky = Instance.new("Sky")
		sky.Name = "DigSky"
		sky.SunAngularSize = 14
		sky.Parent = Lighting
	end
	applySurface(0)

	makeDust()

	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc = acc + dt
		if acc < 0.25 then
			return
		end
		acc = 0
		local y = camera.CFrame.Position.Y
		local zone
		if y > Config.SurfaceY - 4 then
			zone = 0
		else
			local _, index = Config.LayerForDepth(Economy.depthAtY(y))
			zone = index
		end
		if zone ~= currentZone then
			currentZone = zone
			if zone == 0 then
				applySurface(1)
			else
				applyLayer(Config.Layers[zone], 1.4)
			end
		end
	end)
end

return Ambience
