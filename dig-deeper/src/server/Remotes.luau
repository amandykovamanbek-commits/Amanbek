-- Создаёт каналы связи сервер <-> клиент в ReplicatedStorage.Remotes
--   Mine   (клиент -> сервер): удар по блоку
--   Action (клиент -> сервер): покупки, продажа, лифт, награды, коды, язык…
--   State  (сервер -> клиент): полное состояние игрока
--   Fx     (сервер -> клиент): события для эффектов и катсцен

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = {}

local folder = ReplicatedStorage:FindFirstChild("Remotes")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "Remotes"
end

for _, name in ipairs({ "Mine", "Action", "State", "Fx" }) do
	local remote = folder:FindFirstChild(name)
	if not remote then
		remote = Instance.new("RemoteEvent")
		remote.Name = name
		remote.Parent = folder
	end
	Remotes[name] = remote
end

folder.Parent = ReplicatedStorage

return Remotes
