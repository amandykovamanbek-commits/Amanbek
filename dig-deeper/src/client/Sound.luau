-- Звуки интерфейса и копания (Id звуков — в Config.Sounds).

local SoundService = game:GetService("SoundService")
local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Sound = {}

local templates = {}
local lastPlayed = {}

function Sound.play(name, volume, pitch)
	local id = Config.Sounds[name]
	if not id or id == "" then
		return
	end
	-- не играем один и тот же звук чаще 25 раз в секунду
	local now = os.clock()
	if lastPlayed[name] and now - lastPlayed[name] < 0.04 then
		return
	end
	lastPlayed[name] = now
	local template = templates[name]
	if not template then
		template = Instance.new("Sound")
		template.Name = "Sfx_" .. name
		template.SoundId = id
		templates[name] = template
	end
	local s = template:Clone()
	s.Volume = volume or 0.5
	s.PlaybackSpeed = pitch or 1
	s.Parent = SoundService
	s:Play()
	Debris:AddItem(s, 4)
end

function Sound.startMusic()
	local id = Config.Sounds.Music
	if not id or id == "" then
		return
	end
	local music = Instance.new("Sound")
	music.Name = "Music"
	music.SoundId = id
	music.Looped = true
	music.Volume = 0.25
	music.Parent = SoundService
	music:Play()
end

return Sound
