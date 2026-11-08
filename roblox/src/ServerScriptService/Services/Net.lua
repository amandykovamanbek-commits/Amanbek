-- Net: создаёт RemoteEvent/RemoteFunction в ReplicatedStorage.Remotes.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Net = {}

local folder = ReplicatedStorage:FindFirstChild("Remotes")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "Remotes"
	folder.Parent = ReplicatedStorage
end

local function remote(className, name)
	local r = folder:FindFirstChild(name)
	if not r then
		r = Instance.new(className)
		r.Name = name
		r.Parent = folder
	end
	return r
end

Net.Notify = remote("RemoteEvent", "Notify") -- сервер -> клиент: всплывающее сообщение
Net.OpenPanel = remote("RemoteEvent", "OpenPanel") -- сервер -> клиент: открыть окно станции
Net.Request = remote("RemoteFunction", "Request") -- клиент -> сервер: покупки и продажа

function Net.notify(player, text, kind)
	Net.Notify:FireClient(player, text, kind or "info")
end

function Net.announce(text, kind)
	Net.Notify:FireAllClients(text, kind or "announce")
end

return Net
