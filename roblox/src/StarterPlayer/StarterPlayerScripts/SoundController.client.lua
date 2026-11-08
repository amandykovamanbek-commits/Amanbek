-- SoundController: звуки эффектов и фоновая музыка (только у игрока).
-- Другие скрипты зовут звук через ReplicatedStorage.PlaySfx:Fire("Coin").

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local event = ReplicatedStorage:WaitForChild("PlaySfx", 10)
if not event then
	event = Instance.new("BindableEvent")
	event.Name = "PlaySfx"
	event.Parent = ReplicatedStorage
end

local folder = Instance.new("Folder")
folder.Name = "GameSounds"
folder.Parent = SoundService

local sounds = {}
for key, def in pairs(Config.Sounds) do
	local id = def.id ~= "" and ("rbxassetid://" .. def.id) or def.fallback
	if id ~= "" then
		local s = Instance.new("Sound")
		s.Name = key
		s.SoundId = id
		s.Volume = def.volume or 0.6
		-- запасной звук звучит иначе за счёт тона; свой звук играет как есть
		s.PlaybackSpeed = def.id ~= "" and 1 or (def.pitch or 1)
		s.Parent = folder
		sounds[key] = s
	end
end

local lastPlayed = {}
event.Event:Connect(function(key)
	local s = sounds[key]
	if not s then
		return
	end
	local now = os.clock()
	if lastPlayed[key] and now - lastPlayed[key] < 0.05 then
		return
	end
	lastPlayed[key] = now
	SoundService:PlayLocalSound(s)
end)

-- музыка по кругу
local music = sounds.Music
if music then
	music.Looped = true
	music:Play()
end
