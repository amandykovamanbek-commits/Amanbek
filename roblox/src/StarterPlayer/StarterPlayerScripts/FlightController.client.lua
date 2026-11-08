-- FlightController: полёт на клиенте.
-- Прыгни и держи ПРОБЕЛ (или кнопку «Лететь») — взмах вверх, тратится стамина.
-- Отпустил — плавно снижаешься (стамина тоже тратится). Стамина 0 — падаешь.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ContextActionService = game:GetService("ContextActionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local player = Players.LocalPlayer

local character, humanoid, root
local flying = false
local holding = false
local exhausted = false
local stamina = 0
local flightTime = 0
local airTime = 0
local velocityConstraint, attachment
local wingWelds = {}
local lastFlap = 0
local sfxEvent = ReplicatedStorage:WaitForChild("PlaySfx", 10)

local function stats()
	local speedLevel = player:GetAttribute("SpeedLevel") or 0
	local staminaLevel = player:GetAttribute("StaminaLevel") or 0
	local wing = player:GetAttribute("Wing") or 1
	local staminaPass = player:GetAttribute("Pass_StaminaBoost") == true
	local carrying = (player:GetAttribute("Carrying") or "") ~= ""
	local maxStamina = Config.maxStamina(staminaLevel, wing, staminaPass)
	local speed = Config.flySpeed(speedLevel)
	if carrying then
		speed = speed * Config.CarrySpeedMult
	end
	return maxStamina, speed, Config.liftSpeed(wing), Config.maxFlightY(wing)
end

local function findWingWelds()
	wingWelds = {}
	local wings = character and character:FindFirstChild("Wings")
	if not wings then
		return
	end
	for _, d in ipairs(wings:GetDescendants()) do
		if d:IsA("Weld") and (d.Name == "LeftWingWeld" or d.Name == "RightWingWeld") then
			table.insert(wingWelds, { weld = d, base = d.C0, side = d.Name == "LeftWingWeld" and -1 or 1 })
		end
	end
end

local function stopFlight()
	flying = false
	if velocityConstraint then
		velocityConstraint:Destroy()
		velocityConstraint = nil
	end
	if attachment then
		attachment:Destroy()
		attachment = nil
	end
	for _, w in ipairs(wingWelds) do
		if w.weld.Parent then
			w.weld.C0 = w.base
		end
	end
end

local function startFlight()
	if flying or not root then
		return
	end
	flying = true
	flightTime = 0
	attachment = Instance.new("Attachment")
	attachment.Name = "FlyAttachment"
	attachment.Parent = root
	velocityConstraint = Instance.new("LinearVelocity")
	velocityConstraint.Name = "FlyVelocity"
	velocityConstraint.Attachment0 = attachment
	velocityConstraint.RelativeTo = Enum.ActuatorRelativeTo.World
	velocityConstraint.VelocityConstraintMode = Enum.VelocityConstraintMode.Vector
	velocityConstraint.MaxForce = math.huge
	velocityConstraint.VectorVelocity = root.AssemblyLinearVelocity
	velocityConstraint.Parent = root
	findWingWelds()
end

local function onCharacter(char)
	stopFlight()
	character = char
	humanoid = char:WaitForChild("Humanoid")
	root = char:WaitForChild("HumanoidRootPart")
	exhausted = false
	stamina = stats()
	char.ChildAdded:Connect(function(child)
		if child.Name == "Wings" then
			task.defer(findWingWelds)
		end
	end)
	humanoid.Died:Connect(stopFlight)
end

player.CharacterAdded:Connect(onCharacter)
if player.Character then
	task.spawn(onCharacter, player.Character)
end

ContextActionService:BindAction("Fly", function(_, state)
	if state == Enum.UserInputState.Begin then
		holding = true
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		holding = false
	end
	return Enum.ContextActionResult.Pass -- обычный прыжок тоже работает
end, true, Enum.KeyCode.Space, Enum.KeyCode.ButtonA)
ContextActionService:SetTitle("Fly", "Лететь")
ContextActionService:SetPosition("Fly", UDim2.new(1, -170, 1, -150))

RunService.RenderStepped:Connect(function(dt)
	if not humanoid or not root or humanoid.Health <= 0 then
		return
	end
	local maxStamina, speed, lift, maxY = stats()
	local airborne = humanoid.FloorMaterial == Enum.Material.Air
	if airborne then
		airTime = airTime + dt
	else
		airTime = 0
	end

	if flying then
		flightTime = flightTime + dt
		stamina = stamina - dt
		if stamina <= 0 then
			stamina = 0
			exhausted = true
			stopFlight()
		elseif not airborne and flightTime > 0.4 then
			stopFlight()
		else
			local vy = holding and lift or -Config.SinkSpeed
			if vy > 0 and root.Position.Y >= maxY then
				vy = 0
			end
			local move = humanoid.MoveDirection
			velocityConstraint.VectorVelocity = Vector3.new(move.X * speed, vy, move.Z * speed)
			-- звук взмаха
			if holding and sfxEvent and os.clock() - lastFlap > 0.35 then
				lastFlap = os.clock()
				sfxEvent:Fire("Flap")
			end
			-- взмахи крыльев
			local amp = holding and 0.7 or 0.25
			local freq = holding and 14 or 5
			for _, w in ipairs(wingWelds) do
				if w.weld.Parent then
					w.weld.C0 = w.base * CFrame.Angles(0, 0, w.side * math.sin(flightTime * freq) * amp)
				end
			end
		end
	else
		if not airborne then
			exhausted = false
			stamina = math.min(maxStamina, stamina + maxStamina / Config.StaminaRegenTime * dt)
		elseif holding and not exhausted and stamina > 0.2 and airTime > 0.15 then
			startFlight()
		end
	end

	stamina = math.min(stamina, maxStamina)
	-- для UI (локальные атрибуты не уходят на сервер)
	player:SetAttribute("StaminaFrac", maxStamina > 0 and stamina / maxStamina or 0)
	player:SetAttribute("StaminaValue", stamina)
	player:SetAttribute("StaminaMax", maxStamina)
	player:SetAttribute("Flying", flying)
end)
