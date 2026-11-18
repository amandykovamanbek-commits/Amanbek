-- Копай глубже / Dig to the Core — запуск клиента: связывает интерфейс,
-- копание, эффекты, катсцены и сообщения сервера.

local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Locale = require(Shared:WaitForChild("Locale"))

local UIKit = require(script.Parent.UIKit)
local State = require(script.Parent.State)
local Sound = require(script.Parent.Sound)
local Effects = require(script.Parent.Effects)
local HUD = require(script.Parent.HUD)
local Windows = require(script.Parent.Windows)
local Mining = require(script.Parent.Mining)
local Cutscenes = require(script.Parent.Cutscenes)
local Ambience = require(script.Parent.Ambience)
local World = require(script.Parent.World)

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

-- свой интерфейс вместо стандартного рюкзака (кирка всегда в руках)
task.spawn(function()
	for _ = 1, 10 do
		local ok = pcall(function()
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false)
		end)
		if ok then
			break
		end
		task.wait(0.5)
	end
end)

local function t(key, ...)
	return State.t(key, ...)
end

Ambience.init()
Effects.init()
HUD.init()

Windows.init(function(open)
	Mining.setBlocked(open or Cutscenes.isActive())
end)

Cutscenes.init(function(active)
	if active then
		Windows.close()
	end
	HUD.setVisible(not active)
	Mining.setBlocked(active or Windows.isOpen())
end)

Mining.init()

World.init(function(kind)
	if Cutscenes.isActive() then
		return
	end
	if kind == "PickShop" then
		Windows.open("Shop", "picks")
	elseif kind == "BagShop" then
		Windows.open("Shop", "bags")
	elseif kind == "Rebirth" then
		Windows.open("Rebirth")
	elseif kind == "Elevator" then
		Windows.open("Elevator")
	elseif kind == "Daily" then
		Windows.open("Daily")
	end
end)

HUD.on("Shop", function()
	Windows.toggle("Shop", "picks")
end)
HUD.on("Rebirth", function()
	Windows.toggle("Rebirth")
end)
HUD.on("Sell", function()
	Windows.toggle("Sell")
end)
HUD.on("Premium", function()
	Windows.toggle("Premium")
end)
HUD.on("Daily", function()
	Windows.toggle("Daily")
end)
HUD.on("Elevator", function()
	Windows.toggle("Elevator")
end)
HUD.on("DigHold", function(on)
	Mining.setDigHeld(on)
end)

-- Состояние от сервера
local firstState = true
State.onChange(function(st, langChanged)
	UIKit.lang = State.lang
	if langChanged then
		HUD.rebuild()
		World.refreshTexts()
		Windows.relocalize()
	end
	HUD.update(st)
	Windows.refresh(st)
end)

Remotes.State.OnClientEvent:Connect(function(st)
	State.set(st)
	if firstState then
		firstState = false
		World.refreshTexts()
		if not st.SeenIntro then
			Cutscenes.intro()
		else
			HUD.toast(t("Welcome"), UIKit.C.Blue)
		end
		if st.Offline then
			task.delay(4, function()
				HUD.toast(t("SavesOff"))
			end)
		end
	end
end)

-- Названия кирок в сообщениях передаются номером — переводим здесь
local INDEX_ARGS = { NeedPickaxe = true, LayerTooHard = true }

local Fx = {}

function Fx.Break(pos, color)
	Effects.breakBlock(pos, color)
end

function Fx.Ore(oreId, pos)
	Effects.orePopup(oreId, pos)
	HUD.bumpBag()
end

function Fx.Toast(key, ...)
	local args = { ... }
	if INDEX_ARGS[key] and args[1] then
		local pick = Config.Pickaxes[args[1]]
		args[1] = pick and State.name(pick.Name) or "?"
	elseif key == "DailyWait" and args[1] then
		args[1] = Locale.duration(State.lang, args[1])
	end
	local colors = nil
	if key == "BackpackFull" or key == "NeedPickaxe" or key == "NotEnough" or key == "CodeBad" or key == "LayerTooHard" then
		colors = UIKit.C.Red
		Sound.play("Error", 0.4, 0.8)
	end
	HUD.toast(t(key, table.unpack(args)), colors)
end

function Fx.Sold(value, count)
	Sound.play("Coin", 0.6, 1)
	Effects.coinBurst(math.clamp(math.floor((count or 5) / 3), 4, 14), HUD.cashTarget())
	Effects.floatText("+$" .. Locale.short(value), UIKit.Cash, UDim2.new(0, 220, 1, -150), 46)
	HUD.toast(t("Sold", Locale.short(value)), UIKit.C.Green)
end

function Fx.Layer(index, reward)
	Cutscenes.layer(index, reward)
end

function Fx.Core(reward)
	Cutscenes.core(reward)
end

function Fx.Rebirth(count, multiplier)
	Windows.close()
	Cutscenes.rebirth(count, multiplier)
end

function Fx.Bought(kind, index)
	local list = kind == "Pickaxe" and Config.Pickaxes or Config.Backpacks
	local item = list[index]
	Sound.play("Reward", 0.6, 1.2)
	Effects.confetti(40, 1.8)
	HUD.toast(t("Bought", item and State.name(item.Name) or "?"), UIKit.C.Gold)
end

function Fx.Daily(day, cash, potion)
	Sound.play("Reward", 0.6, 1)
	if cash and cash > 0 then
		Effects.coinBurst(10, HUD.cashTarget())
		Effects.floatText("+$" .. Locale.short(cash), UIKit.Cash, UDim2.new(0, 220, 1, -150), 46)
	end
	Effects.confetti(50, 2)
	HUD.toast(t("DailyClaimed", tostring(day)), UIKit.C.Green)
end

function Fx.Code(cash)
	Sound.play("Reward", 0.6, 1.1)
	Effects.confetti(50, 2)
	if cash and cash > 0 then
		Effects.coinBurst(8, HUD.cashTarget())
	end
	HUD.toast(t("CodeOk"), UIKit.C.Green)
end

function Fx.Teleport(index)
	local layer = Config.Layers[index]
	Effects.flash(layer and layer.Color or UIKit.White, 0.6, 0.1)
	if layer then
		HUD.toast(t("Teleported", State.name(layer.Name)), UIKit.C.Gold)
	end
end

function Fx.Thanks()
	Sound.play("Reward", 0.7, 1)
	Effects.confetti(110, 2.8)
	HUD.toast(t("Thanks"), UIKit.C.Pink)
end

function Fx.ResetWarn(seconds)
	HUD.resetBanner(seconds or 30)
	Cutscenes.resetWarn()
end

function Fx.Resetting()
	Windows.close()
	Cutscenes.resetting()
end

function Fx.ResetDone()
	Cutscenes.resetDone()
	HUD.toast(t("ResetDone"), UIKit.C.Blue)
end

Remotes.Fx.OnClientEvent:Connect(function(kind, ...)
	local handler = Fx[kind]
	if handler then
		local ok, err = pcall(handler, ...)
		if not ok then
			warn("[Копай глубже] Эффект " .. tostring(kind) .. ": " .. tostring(err))
		end
	end
end)

Sound.startMusic()
Remotes.Action:FireServer("Ready")
