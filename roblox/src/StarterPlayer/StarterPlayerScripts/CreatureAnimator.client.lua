-- CreatureAnimator: существа рядом с игроком подпрыгивают и покачиваются.
-- Анимация только на клиенте: сервер не нагружается.

local RunService = game:GetService("RunService")

local tracked = setmetatable({}, { __mode = "k" })
local models = {}
local rng = Random.new()

local function gather()
	local list = {}
	local creatures = workspace:FindFirstChild("Creatures")
	if creatures then
		for _, m in ipairs(creatures:GetChildren()) do
			if m:IsA("Model") then
				table.insert(list, m)
			end
		end
	end
	local map = workspace:FindFirstChild("Map")
	if map then
		for i = 1, 4 do
			local plot = map:FindFirstChild("Plot" .. i)
			if plot then
				for _, m in ipairs(plot:GetChildren()) do
					if m:IsA("Model") and m:GetAttribute("CreatureId") then
						table.insert(list, m)
					end
				end
			end
		end
	end
	models = list
end

task.spawn(function()
	while true do
		gather()
		task.wait(1)
	end
end)

local acc = 0
RunService.RenderStepped:Connect(function(dt)
	acc = acc + dt
	if acc < 1 / 30 then
		return
	end
	acc = 0
	local cam = workspace.CurrentCamera
	if not cam then
		return
	end
	local camPos = cam.CFrame.Position
	local t = os.clock()
	for _, model in ipairs(models) do
		local body = model.PrimaryPart
		if body and body.Parent and body.Anchored then
			local info = tracked[model]
			local current = model:GetPivot()
			if not info then
				info = { base = current, phase = rng:NextNumber(0, math.pi * 2) }
				tracked[model] = info
			elseif info.last and (current.Position - info.last.Position).Magnitude > 0.05 then
				-- сервер переставил модель — берём новую точку
				info.base = current
			end
			if (info.base.Position - camPos).Magnitude < 150 then
				local hop = math.abs(math.sin(t * 2.2 + info.phase)) * 0.6
				local cf = info.base * CFrame.new(0, hop, 0) * CFrame.Angles(0, math.sin(t * 0.9 + info.phase) * 0.3, 0)
				model:PivotTo(cf)
				info.last = cf
			end
		end
	end
end)
