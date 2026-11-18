-- Проверка подключения Rojo: если в Output видно это сообщение — всё работает.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

print(("[Dig Deeper] Rojo подключён! Версия %s"):format(Config.Version))

-- Тестовый блок над точкой спавна
local part = Instance.new("Part")
part.Name = "RojoTestBlock"
part.Size = Vector3.new(6, 6, 6)
part.Position = Vector3.new(0, 15, 0)
part.Anchored = true
part.Color = Color3.fromRGB(255, 170, 0)
part.Parent = workspace
