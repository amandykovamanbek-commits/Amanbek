-- Последнее состояние игрока, присланное сервером, + текущий язык.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Locale = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Locale"))

local State = {
	data = nil,
	lang = "ru",
	receivedAt = 0,
}

local listeners = {}

function State.onChange(fn)
	table.insert(listeners, fn)
end

function State.set(newData)
	local previousLang = State.lang
	State.data = newData
	State.receivedAt = os.clock()
	if newData.Lang == "ru" or newData.Lang == "en" then
		State.lang = newData.Lang
	end
	local langChanged = previousLang ~= State.lang
	for _, fn in ipairs(listeners) do
		local ok, err = pcall(fn, newData, langChanged)
		if not ok then
			warn("[Копай глубже] Ошибка обновления интерфейса: " .. tostring(err))
		end
	end
end

-- Перевод строки
function State.t(key, ...)
	return Locale.get(State.lang, key, ...)
end

-- Имя из таблицы { ru, en }
function State.name(tbl)
	return Locale.name(State.lang, tbl)
end

-- Сколько секунд осталось у зелья с учётом времени с последнего обновления
function State.potionLeft(name)
	local st = State.data
	if not st or not st.Potions then
		return 0
	end
	return math.max(0, (st.Potions[name] or 0) - (os.clock() - State.receivedAt))
end

return State
