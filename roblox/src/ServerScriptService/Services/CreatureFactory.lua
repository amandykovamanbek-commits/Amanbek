-- CreatureFactory: детальные оригинальные существа-животные из блоков.
-- Перед существа смотрит в -Z, верх = +Y. Все детали приварены к телу (Body).

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local CreatureFactory = {}

local NEON = Enum.Material.Neon
local GLASS = Enum.Material.Glass
local METAL = Enum.Material.Metal
local FABRIC = Enum.Material.Fabric

local function rgb(r, g, b)
	return Color3.fromRGB(r, g, b)
end
local function V(x, y, z)
	return Vector3.new(x, y, z)
end
local function A(x, y, z)
	return CFrame.Angles(math.rad(x or 0), math.rad(y or 0), math.rad(z or 0))
end
local UP = A(0, 0, 90) -- цилиндр вертикально
local FWD = A(0, 90, 0) -- цилиндр вдоль Z

local WHITE = rgb(255, 255, 255)
local BLACK = rgb(25, 22, 30)
local PINK = rgb(255, 150, 170)

---------------------------------------------------------------------
-- описания существ: function(p, eye) ... end
-- p(shape, size, pos, color, material?, rot?, transparency?)
--   shape: "B" шар, "K" блок, "C" цилиндр, "W" клин
-- eye(x, y, z, size, irisColor?)
-- foot = расстояние от центра тела до земли
---------------------------------------------------------------------
local SPECS = {}

SPECS.frog_slipper = {
	foot = 2.0,
	body = { "B", V(3.2, 2.6, 3.4), rgb(110, 210, 80) },
	build = function(p, eye)
		p("B", V(2.4, 1.8, 1.2), V(0, -0.4, -1.3), rgb(220, 250, 160)) -- живот
		p("B", V(1.4, 1.2, 1.4), V(0.9, 1.2, -0.6), rgb(110, 210, 80))
		p("B", V(1.4, 1.2, 1.4), V(-0.9, 1.2, -0.6), rgb(110, 210, 80))
		eye(0.9, 1.5, -1.1, 1.0, rgb(255, 190, 40))
		eye(-0.9, 1.5, -1.1, 1.0, rgb(255, 190, 40))
		p("K", V(1.8, 0.15, 0.2), V(0, 0.15, -1.7), rgb(60, 120, 40)) -- улыбка
		p("B", V(0.5, 0.3, 0.2), V(1.1, 0.4, -1.55), PINK)
		p("B", V(0.5, 0.3, 0.2), V(-1.1, 0.4, -1.55), PINK)
		p("B", V(1.4, 0.9, 2.0), V(1.5, -0.9, 0.4), rgb(95, 190, 70)) -- задние лапы
		p("B", V(1.4, 0.9, 2.0), V(-1.5, -0.9, 0.4), rgb(95, 190, 70))
		p("B", V(0.7, 1.2, 0.7), V(0.9, -0.9, -1.2), rgb(95, 190, 70))
		p("B", V(0.7, 1.2, 0.7), V(-0.9, -0.9, -1.2), rgb(95, 190, 70))
		for i = -1, 1 do
			p("B", V(0.5, 0.6, 0.5), V(0.6 * i, 1.4, 0.8), rgb(80, 170, 60)) -- пятнышки
		end
		-- тапок
		p("K", V(3.8, 0.6, 5.2), V(0, -1.75, 0.1), rgb(255, 120, 170))
		p("K", V(3.9, 0.3, 5.3), V(0, -2.0, 0.1), WHITE)
		p("K", V(3.8, 1.2, 0.4), V(0, -1.1, 2.6), rgb(255, 120, 170))
		for x = -1.5, 1.5, 0.75 do
			p("B", V(0.8, 0.8, 0.8), V(x, -1.3, -2.4), WHITE)
		end
		p("B", V(1.3, 1.3, 1.3), V(0, -0.9, -2.9), rgb(255, 230, 240))
	end,
}

SPECS.dumpling = {
	foot = 1.7,
	body = { "B", V(3.8, 2.6, 3.4), rgb(250, 235, 200) },
	build = function(p, eye)
		for i = -2, 2 do
			p("B", V(0.9, 1.1, 0.9), V(i * 0.6, 1.25, 0.2 + math.abs(i) * 0.1), rgb(245, 225, 185)) -- защипы
		end
		eye(0.7, 0.3, -1.5, 0.75)
		eye(-0.7, 0.3, -1.5, 0.75)
		p("B", V(0.7, 0.4, 0.2), V(1.3, -0.2, -1.4), PINK)
		p("B", V(0.7, 0.4, 0.2), V(-1.3, -0.2, -1.4), PINK)
		p("B", V(0.5, 0.35, 0.2), V(0, -0.35, -1.65), rgb(200, 80, 90)) -- ротик
		p("B", V(0.9, 0.6, 1.1), V(0.9, -1.3, -0.4), rgb(240, 215, 175)) -- ножки
		p("B", V(0.9, 0.6, 1.1), V(-0.9, -1.3, -0.4), rgb(240, 215, 175))
		p("B", V(0.7, 0.7, 0.7), V(1.9, -0.1, 0), rgb(245, 225, 185)) -- ручки
		p("B", V(0.7, 0.7, 0.7), V(-1.9, -0.1, 0), rgb(245, 225, 185))
		-- палочки и пар
		p("C", V(4.5, 0.25, 0.25), V(0.8, 2.3, 0.6), rgb(170, 110, 60), nil, A(0, 20, 70))
		p("C", V(4.5, 0.25, 0.25), V(1.2, 2.3, 0.4), rgb(170, 110, 60), nil, A(0, 30, 75))
		p("B", V(1.2, 1.2, 1.2), V(-0.6, 2.8, 0.3), WHITE, nil, nil, 0.5)
		p("B", V(0.9, 0.9, 0.9), V(-0.9, 3.6, 0.5), WHITE, nil, nil, 0.6)
		-- тарелочка
		p("C", V(0.3, 5, 5), V(0, -1.6, 0), rgb(120, 200, 255), nil, UP)
	end,
}

SPECS.cactus_runner = {
	foot = 3.2,
	body = { "C", V(4.2, 2.4, 2.4), rgb(70, 190, 90), nil, UP },
	build = function(p, eye)
		p("B", V(2.4, 1.4, 2.4), V(0, 2.1, 0), rgb(70, 190, 90))
		for y = -1.2, 1.6, 0.9 do
			for k = 0, 3 do
				local a = math.rad(k * 90 + 45)
				p("K", V(0.12, 0.12, 0.5), V(math.cos(a) * 1.25, y, math.sin(a) * 1.25), rgb(255, 250, 220))
			end
		end
		eye(0.5, 1.1, -1.1, 0.7)
		eye(-0.5, 1.1, -1.1, 0.7)
		-- очки
		p("K", V(2.3, 0.18, 0.15), V(0, 1.15, -1.3), BLACK)
		p("K", V(0.9, 0.6, 0.15), V(0.55, 1.05, -1.32), BLACK, GLASS, nil, 0.2)
		p("K", V(0.9, 0.6, 0.15), V(-0.55, 1.05, -1.32), BLACK, GLASS, nil, 0.2)
		p("K", V(0.8, 0.12, 0.15), V(0, 0.3, -1.25), rgb(30, 100, 40))
		-- руки
		p("C", V(1.4, 0.8, 0.8), V(1.7, 0.2, 0), rgb(70, 190, 90))
		p("C", V(1.6, 0.8, 0.8), V(2.3, 1.0, 0), rgb(70, 190, 90), nil, UP)
		p("B", V(0.8, 0.8, 0.8), V(2.3, 1.8, 0), rgb(70, 190, 90))
		p("C", V(1.4, 0.8, 0.8), V(-1.7, -0.3, 0), rgb(70, 190, 90))
		p("C", V(1.4, 0.8, 0.8), V(-2.3, 0.4, 0), rgb(70, 190, 90), nil, UP)
		p("B", V(0.8, 0.8, 0.8), V(-2.3, 1.1, 0), rgb(70, 190, 90))
		-- цветок
		for k = 0, 4 do
			local a = math.rad(k * 72)
			p("B", V(0.8, 0.4, 0.8), V(math.cos(a) * 0.5, 2.9, math.sin(a) * 0.5), rgb(255, 90, 170))
		end
		p("B", V(0.5, 0.5, 0.5), V(0, 3.0, 0), rgb(255, 220, 60))
		-- кроссовки
		for _, x in ipairs({ -0.6, 0.6 }) do
			p("K", V(0.5, 1.0, 0.5), V(x, -2.5, 0), rgb(70, 190, 90))
			p("K", V(0.9, 0.6, 1.5), V(x, -3.0, -0.3), rgb(240, 50, 60))
			p("K", V(1.0, 0.25, 1.6), V(x, -3.3, -0.3), WHITE)
			p("K", V(0.92, 0.1, 0.3), V(x, -2.75, -0.6), WHITE)
		end
	end,
}

SPECS.mushroom_hedgehog = {
	foot = 1.9,
	body = { "B", V(3.2, 2.6, 3.8), rgb(160, 110, 75) },
	build = function(p, eye)
		p("B", V(2.2, 1.8, 1.6), V(0, -0.2, -1.5), rgb(245, 215, 175)) -- мордочка
		p("B", V(1.0, 0.8, 1.2), V(0, -0.3, -2.4), rgb(245, 215, 175))
		p("B", V(0.5, 0.45, 0.45), V(0, -0.15, -3.0), BLACK) -- нос
		eye(0.55, 0.35, -2.05, 0.55)
		eye(-0.55, 0.35, -2.05, 0.55)
		p("B", V(0.5, 0.3, 0.2), V(0.95, -0.45, -2.05), PINK)
		p("B", V(0.5, 0.3, 0.2), V(-0.95, -0.45, -2.05), PINK)
		-- иголки
		for row = 0, 2 do
			for k = -3, 3 do
				local a = k * 25
				p("W", V(0.4, 1.0, 0.9), V(math.sin(math.rad(a)) * 1.5, 0.6 + row * 0.15, 0.2 + row * 0.7), rgb(110, 70, 45), nil, A(-60 + row * 10, 0, -a))
			end
		end
		-- шляпка-гриб
		p("B", V(4.6, 2.0, 4.6), V(0, 1.6, 0.3), rgb(235, 50, 60))
		p("C", V(0.4, 4.2, 4.2), V(0, 1.0, 0.3), rgb(255, 240, 220), nil, UP)
		for k = 0, 5 do
			local a = math.rad(k * 60 + 15)
			p("B", V(0.7, 0.35, 0.7), V(math.cos(a) * 1.3, 2.4, 0.3 + math.sin(a) * 1.3), WHITE)
		end
		p("B", V(0.8, 0.4, 0.8), V(0, 2.65, 0.3), WHITE)
		-- лапки
		for _, x in ipairs({ -0.9, 0.9 }) do
			p("B", V(0.8, 0.9, 0.9), V(x, -1.3, -0.9), rgb(140, 95, 65))
			p("B", V(0.8, 0.9, 0.9), V(x, -1.3, 1.0), rgb(140, 95, 65))
		end
	end,
}

SPECS.jelly_teapot = {
	foot = 3.4,
	body = { "B", V(3.6, 3.0, 3.6), rgb(90, 225, 230), GLASS, nil, 0.25 },
	build = function(p, eye)
		p("C", V(0.5, 3.4, 3.4), V(0, -1.3, 0), rgb(60, 190, 210), nil, UP)
		p("C", V(0.5, 2.4, 2.4), V(0, 1.55, 0), rgb(60, 190, 210), nil, UP) -- крышка
		p("B", V(0.8, 0.8, 0.8), V(0, 2.1, 0), rgb(255, 210, 80), NEON)
		p("C", V(2.4, 0.7, 0.7), V(0, 0.2, -2.1), rgb(90, 225, 230), GLASS, FWD * A(0, 0, 35), 0.25) -- носик
		p("C", V(0.3, 1.8, 1.8), V(0, 0.1, 2.0), rgb(60, 190, 210), nil, A(0, 90, 0)) -- ручка
		p("C", V(0.3, 1.0, 1.0), V(0, 0.1, 2.0), rgb(90, 225, 230), GLASS, A(0, 90, 0), 0.3)
		eye(0.65, 0.35, -1.6, 0.7)
		eye(-0.65, 0.35, -1.6, 0.7)
		p("B", V(0.6, 0.3, 0.2), V(0, -0.35, -1.7), rgb(255, 120, 160))
		-- щупальца
		for k = 0, 5 do
			local a = math.rad(k * 60)
			local x, z = math.cos(a) * 1.1, math.sin(a) * 1.1
			p("C", V(1.0, 0.45, 0.45), V(x, -1.9, z), rgb(170, 255, 255), NEON, UP * A(0, 0, 0))
			p("C", V(0.9, 0.35, 0.35), V(x * 1.15, -2.7, z * 1.15), rgb(140, 240, 255), NEON, UP)
			p("B", V(0.4, 0.4, 0.4), V(x * 1.25, -3.2, z * 1.25), rgb(255, 160, 230), NEON)
		end
	end,
}

SPECS.banana_crab = {
	foot = 1.9,
	body = { "B", V(4.0, 1.8, 3.0), rgb(240, 80, 60) },
	build = function(p, eye)
		-- банан-панцирь
		p("C", V(1.8, 1.3, 1.3), V(-1.4, 1.3, 0.1), rgb(255, 225, 60), nil, A(0, 0, 25))
		p("C", V(1.8, 1.4, 1.4), V(0, 1.6, 0.1), rgb(255, 230, 70))
		p("C", V(1.8, 1.3, 1.3), V(1.4, 1.3, 0.1), rgb(255, 225, 60), nil, A(0, 0, -25))
		p("K", V(0.35, 0.35, 0.35), V(-2.3, 0.85, 0.1), rgb(110, 80, 40))
		p("K", V(0.35, 0.5, 0.35), V(2.3, 0.9, 0.1), rgb(110, 80, 40))
		-- глаза на стебельках
		p("C", V(1.0, 0.25, 0.25), V(0.6, 1.0, -1.2), rgb(220, 70, 50), nil, UP)
		p("C", V(1.0, 0.25, 0.25), V(-0.6, 1.0, -1.2), rgb(220, 70, 50), nil, UP)
		eye(0.6, 1.6, -1.25, 0.65)
		eye(-0.6, 1.6, -1.25, 0.65)
		p("K", V(1.0, 0.12, 0.2), V(0, -0.1, -1.5), rgb(120, 30, 30))
		-- клешни
		for _, sx in ipairs({ -1, 1 }) do
			p("C", V(1.4, 0.5, 0.5), V(sx * 2.3, 0.0, -0.9), rgb(230, 70, 50), nil, A(0, sx * 40, 0))
			p("B", V(1.4, 1.2, 1.5), V(sx * 2.9, 0.3, -1.8), rgb(250, 90, 70))
			p("W", V(0.5, 0.6, 1.1), V(sx * 2.7, 0.9, -2.6), rgb(250, 90, 70), nil, A(0, 0, 0))
			p("W", V(0.5, 0.6, 1.1), V(sx * 3.1, -0.1, -2.6), rgb(250, 90, 70), nil, A(0, 0, 180))
			for k = 0, 2 do
				p("K", V(1.6, 0.3, 0.3), V(sx * 2.2, -0.9, -0.2 + k * 0.8), rgb(220, 70, 50), nil, A(0, 0, sx * -30))
			end
		end
	end,
}

SPECS.fire_hamster = {
	foot = 1.9,
	body = { "B", V(3.8, 3.4, 3.6), rgb(245, 150, 60) },
	fire = true,
	build = function(p, eye)
		p("B", V(2.6, 2.2, 1.2), V(0, -0.5, -1.4), rgb(255, 235, 200)) -- живот
		p("B", V(1.6, 1.2, 1.2), V(1.2, 0.1, -1.3), rgb(255, 225, 190)) -- щёчки
		p("B", V(1.6, 1.2, 1.2), V(-1.2, 0.1, -1.3), rgb(255, 225, 190))
		eye(0.65, 0.7, -1.55, 0.6)
		eye(-0.65, 0.7, -1.55, 0.6)
		p("B", V(0.4, 0.3, 0.3), V(0, 0.25, -1.95), PINK)
		p("K", V(0.4, 0.4, 0.15), V(0, -0.05, -1.95), WHITE) -- зубки
		-- уши
		for _, sx in ipairs({ -1, 1 }) do
			p("B", V(1.1, 1.1, 0.5), V(sx * 1.2, 1.6, -0.2), rgb(245, 150, 60))
			p("B", V(0.7, 0.7, 0.3), V(sx * 1.2, 1.6, -0.45), PINK)
			p("B", V(0.7, 0.6, 0.7), V(sx * 0.8, -0.5, -1.8), rgb(255, 200, 170)) -- лапки
			p("B", V(1.0, 0.6, 1.3), V(sx * 1.0, -1.6, -0.6), rgb(255, 200, 170))
		end
		p("B", V(0.6, 0.6, 0.6), V(0, -0.8, 1.8), rgb(255, 225, 190)) -- хвостик
		-- огненный хохолок
		p("B", V(1.4, 1.6, 1.4), V(0, 2.0, 0.2), rgb(255, 80, 20), NEON)
		p("B", V(1.0, 1.4, 1.0), V(0.3, 2.7, 0.3), rgb(255, 160, 30), NEON)
		p("B", V(0.6, 1.0, 0.6), V(-0.2, 3.2, 0.3), rgb(255, 230, 80), NEON)
	end,
}

SPECS.cloud_sheep = {
	foot = 2.6,
	body = { "B", V(3.8, 3.0, 4.4), WHITE },
	build = function(p, eye)
		local puffs = { V(1.3, 1.2, 0.8), V(-1.3, 1.2, 0.2), V(0, 1.6, 1.4), V(0, 1.5, -0.6), V(1.5, 0.2, 1.6), V(-1.5, 0.2, 1.4), V(0, 0.4, 2.3) }
		for _, pos in ipairs(puffs) do
			p("B", V(2.2, 2.0, 2.2), pos, WHITE)
		end
		p("B", V(2.0, 2.0, 1.8), V(0, 0.5, -2.3), rgb(70, 70, 90)) -- голова
		p("B", V(1.6, 1.0, 1.0), V(0, 1.5, -2.2), WHITE) -- чёлка
		eye(0.5, 0.65, -3.1, 0.55)
		eye(-0.5, 0.65, -3.1, 0.55)
		p("B", V(0.5, 0.25, 0.2), V(0, -0.1, -3.15), PINK)
		p("B", V(1.2, 0.5, 0.6), V(1.2, 0.8, -2.1), rgb(70, 70, 90), nil, A(0, 0, -25)) -- уши
		p("B", V(1.2, 0.5, 0.6), V(-1.2, 0.8, -2.1), rgb(70, 70, 90), nil, A(0, 0, 25))
		p("B", V(0.8, 0.8, 0.8), V(0, -0.8, -2.5), rgb(255, 210, 50), METAL) -- колокольчик
		for _, x in ipairs({ -1.0, 1.0 }) do
			for _, z in ipairs({ -1.1, 1.2 }) do
				p("C", V(1.4, 0.7, 0.7), V(x, -1.8, z), rgb(70, 70, 90), nil, UP)
			end
		end
		-- маленькая радуга на хвосте
		local rainbow = { rgb(255, 80, 80), rgb(255, 190, 40), rgb(90, 220, 90), rgb(80, 160, 255) }
		for k, c in ipairs(rainbow) do
			p("C", V(0.3, 2.6 - k * 0.45, 2.6 - k * 0.45), V(0, 1.4, 3.0), c, NEON, A(0, 90, 0))
		end
	end,
}

SPECS.owl_king = {
	foot = 2.5,
	body = { "B", V(3.6, 4.2, 3.4), rgb(140, 95, 60) },
	build = function(p, eye)
		p("B", V(2.8, 3.0, 1.0), V(0, -0.6, -1.3), rgb(245, 230, 200)) -- грудка
		for y = -1.4, 0.4, 0.6 do
			p("W", V(0.6, 0.3, 0.3), V(0, y, -1.8), rgb(200, 170, 130), nil, A(0, 0, 180))
		end
		p("B", V(1.6, 1.6, 0.6), V(0.75, 0.9, -1.35), rgb(255, 250, 235)) -- лицевой диск
		p("B", V(1.6, 1.6, 0.6), V(-0.75, 0.9, -1.35), rgb(255, 250, 235))
		eye(0.75, 0.9, -1.55, 1.1, rgb(255, 200, 30))
		eye(-0.75, 0.9, -1.55, 1.1, rgb(255, 200, 30))
		p("W", V(0.5, 0.7, 0.5), V(0, 0.2, -1.85), rgb(255, 160, 40), nil, A(0, 0, 180))
		p("W", V(0.6, 1.0, 0.6), V(1.3, 2.2, -0.3), rgb(120, 80, 50)) -- ушки-перья
		p("W", V(0.6, 1.0, 0.6), V(-1.3, 2.2, -0.3), rgb(120, 80, 50))
		-- крылья
		p("B", V(0.8, 3.0, 2.4), V(1.8, -0.2, 0.2), rgb(115, 75, 45), nil, A(0, 0, 10))
		p("B", V(0.8, 3.0, 2.4), V(-1.8, -0.2, 0.2), rgb(115, 75, 45), nil, A(0, 0, -10))
		-- корона
		p("C", V(0.9, 2.4, 2.4), V(0, 2.4, 0), rgb(255, 205, 40), METAL, UP)
		for k = 0, 5 do
			local a = math.rad(k * 60)
			p("W", V(0.5, 0.9, 0.4), V(math.cos(a) * 1.0, 3.25, math.sin(a) * 1.0), rgb(255, 205, 40), METAL, A(0, -k * 60 + 90, 0))
		end
		p("B", V(0.5, 0.5, 0.5), V(0, 2.4, -1.15), rgb(255, 40, 90), NEON)
		p("B", V(0.4, 0.4, 0.4), V(0.85, 2.4, -0.8), rgb(60, 200, 255), NEON)
		p("B", V(0.4, 0.4, 0.4), V(-0.85, 2.4, -0.8), rgb(80, 255, 120), NEON)
		-- мантия
		p("K", V(3.4, 3.6, 0.3), V(0, -0.4, 1.75), rgb(190, 30, 50), FABRIC)
		p("K", V(3.6, 0.5, 0.5), V(0, 1.4, 1.6), WHITE, FABRIC)
		-- лапки
		p("K", V(0.8, 0.4, 1.0), V(0.7, -2.2, -0.6), rgb(255, 170, 40))
		p("K", V(0.8, 0.4, 1.0), V(-0.7, -2.2, -0.6), rgb(255, 170, 40))
	end,
}

SPECS.rocket_penguin = {
	foot = 2.6,
	body = { "B", V(3.2, 4.4, 3.0), rgb(35, 35, 50) },
	build = function(p, eye)
		p("B", V(2.4, 3.4, 0.9), V(0, -0.4, -1.15), WHITE)
		p("B", V(2.2, 1.6, 0.8), V(0, 1.1, -1.05), WHITE)
		eye(0.55, 1.2, -1.45, 0.55)
		eye(-0.55, 1.2, -1.45, 0.55)
		p("W", V(0.6, 0.5, 0.9), V(0, 0.55, -1.75), rgb(255, 150, 30), nil, A(-90, 0, 0)) -- клюв
		p("B", V(0.5, 0.3, 0.2), V(1.0, 0.6, -1.3), PINK)
		p("B", V(0.5, 0.3, 0.2), V(-1.0, 0.6, -1.3), PINK)
		-- лётные очки
		p("K", V(3.3, 0.35, 3.1), V(0, 1.95, 0), rgb(120, 70, 40), FABRIC)
		p("C", V(0.3, 0.9, 0.9), V(0.5, 2.0, -1.45), rgb(80, 200, 255), GLASS, FWD, 0.2)
		p("C", V(0.3, 0.9, 0.9), V(-0.5, 2.0, -1.45), rgb(80, 200, 255), GLASS, FWD, 0.2)
		-- крылья
		p("B", V(0.6, 2.6, 1.4), V(1.75, -0.2, 0), rgb(35, 35, 50), nil, A(0, 0, 20))
		p("B", V(0.6, 2.6, 1.4), V(-1.75, -0.2, 0), rgb(35, 35, 50), nil, A(0, 0, -20))
		-- лапы
		p("K", V(1.0, 0.4, 1.4), V(0.7, -2.3, -0.5), rgb(255, 150, 30))
		p("K", V(1.0, 0.4, 1.4), V(-0.7, -2.3, -0.5), rgb(255, 150, 30))
		-- реактивный ранец
		p("K", V(2.4, 2.4, 0.8), V(0, 0.2, 1.7), rgb(200, 200, 215), METAL)
		for _, x in ipairs({ -0.7, 0.7 }) do
			p("C", V(3.0, 0.9, 0.9), V(x, 0, 2.3), rgb(230, 60, 60), METAL, UP)
			p("B", V(0.9, 0.9, 0.9), V(x, 1.5, 2.3), rgb(230, 60, 60), METAL)
			p("C", V(0.4, 1.0, 1.0), V(x, -1.6, 2.3), rgb(80, 80, 90), METAL, UP)
			p("B", V(0.8, 1.6, 0.8), V(x, -2.4, 2.3), rgb(255, 140, 30), NEON)
			p("B", V(0.5, 1.0, 0.5), V(x, -3.0, 2.3), rgb(255, 230, 80), NEON)
		end
	end,
}

SPECS.crystal_whale = {
	foot = 2.2,
	body = { "B", V(3.8, 3.0, 6.4), rgb(70, 130, 240) },
	build = function(p, eye)
		p("B", V(3.0, 1.6, 5.2), V(0, -0.8, -0.4), rgb(210, 230, 255)) -- живот
		for z = -2, 1 do
			p("K", V(2.4, 0.08, 0.15), V(0, -1.45, z * 0.8), rgb(170, 200, 245))
		end
		eye(1.45, 0.25, -2.0, 0.6)
		eye(-1.45, 0.25, -2.0, 0.6)
		p("K", V(2.2, 0.12, 0.2), V(0, -0.35, -3.1), rgb(40, 80, 160)) -- улыбка
		p("B", V(0.5, 0.3, 0.2), V(1.4, -0.3, -2.5), PINK)
		p("B", V(0.5, 0.3, 0.2), V(-1.4, -0.3, -2.5), PINK)
		-- плавники и хвост
		p("B", V(2.2, 0.4, 1.2), V(2.0, -0.9, -0.6), rgb(60, 115, 220), nil, A(0, -20, -25))
		p("B", V(2.2, 0.4, 1.2), V(-2.0, -0.9, -0.6), rgb(60, 115, 220), nil, A(0, 20, 25))
		p("B", V(1.6, 1.4, 2.4), V(0, 0.2, 3.6), rgb(70, 130, 240))
		p("B", V(2.4, 0.4, 1.4), V(1.0, 0.6, 4.8), rgb(60, 115, 220), nil, A(0, 25, 15))
		p("B", V(2.4, 0.4, 1.4), V(-1.0, 0.6, 4.8), rgb(60, 115, 220), nil, A(0, -25, -15))
		-- фонтанчик
		p("C", V(1.6, 0.4, 0.4), V(0, 2.2, -1.2), rgb(160, 230, 255), NEON, UP, 0.3)
		p("B", V(1.0, 0.6, 1.0), V(0, 3.1, -1.2), rgb(190, 240, 255), NEON, nil, 0.3)
		-- кристаллы на спине
		local cc = rgb(140, 255, 255)
		p("K", V(0.7, 1.8, 0.7), V(0, 1.9, 0.2), cc, NEON, A(10, 45, 0), 0.1)
		p("K", V(0.5, 1.3, 0.5), V(0.6, 1.6, 0.9), cc, NEON, A(-10, 45, -20), 0.1)
		p("K", V(0.5, 1.3, 0.5), V(-0.6, 1.6, 0.9), cc, NEON, A(-10, 45, 20), 0.1)
		p("K", V(0.4, 1.0, 0.4), V(0, 1.4, 1.8), rgb(255, 140, 240), NEON, A(-20, 45, 0), 0.1)
	end,
}

SPECS.shadow_fox = {
	foot = 2.3,
	body = { "B", V(2.6, 2.4, 4.2), rgb(70, 45, 110) },
	glowEyes = true,
	build = function(p, eye)
		p("B", V(2.4, 2.2, 2.2), V(0, 1.1, -2.2), rgb(70, 45, 110)) -- голова
		p("B", V(1.8, 1.2, 1.2), V(0, 0.5, -2.7), rgb(240, 230, 255)) -- щёки
		p("B", V(0.9, 0.8, 1.4), V(0, 0.6, -3.3), rgb(240, 230, 255)) -- морда
		p("B", V(0.45, 0.4, 0.4), V(0, 0.75, -4.0), BLACK)
		eye(0.55, 1.4, -3.1, 0.55, rgb(210, 90, 255))
		eye(-0.55, 1.4, -3.1, 0.55, rgb(210, 90, 255))
		for _, sx in ipairs({ -1, 1 }) do
			p("W", V(0.9, 1.6, 0.6), V(sx * 0.7, 2.6, -2.0), rgb(70, 45, 110))
			p("W", V(0.5, 1.0, 0.3), V(sx * 0.7, 2.5, -2.25), PINK)
			p("C", V(1.6, 0.7, 0.7), V(sx * 0.8, -1.4, -1.3), rgb(55, 35, 85), nil, UP)
			p("C", V(1.6, 0.7, 0.7), V(sx * 0.8, -1.4, 1.3), rgb(55, 35, 85), nil, UP)
			p("B", V(0.8, 0.5, 1.0), V(sx * 0.8, -2.1, -1.4), rgb(240, 230, 255))
		end
		p("B", V(1.8, 1.6, 1.0), V(0, -0.2, -1.8), rgb(240, 230, 255)) -- грудка
		-- пушистый хвост
		p("B", V(1.8, 1.8, 3.4), V(0, 1.0, 3.0), rgb(80, 50, 125), nil, A(-35, 0, 0))
		p("B", V(1.6, 1.6, 2.0), V(0, 2.4, 4.0), rgb(90, 55, 140), nil, A(-50, 0, 0))
		p("B", V(1.2, 1.2, 1.4), V(0, 3.2, 4.5), rgb(200, 100, 255), NEON)
		-- светящиеся огоньки
		p("B", V(0.5, 0.5, 0.5), V(1.8, 2.4, 0), rgb(200, 100, 255), NEON)
		p("B", V(0.4, 0.4, 0.4), V(-1.8, 2.0, 0.8), rgb(140, 200, 255), NEON)
	end,
}

SPECS.sun_dragon = {
	foot = 2.6,
	body = { "B", V(3.6, 3.2, 4.6), rgb(255, 195, 50) },
	divine = true,
	build = function(p, eye)
		p("B", V(2.6, 2.2, 3.4), V(0, -0.7, -0.4), rgb(255, 240, 180)) -- живот
		p("C", V(1.8, 1.4, 1.4), V(0, 1.6, -2.0), rgb(255, 195, 50), nil, A(0, 0, 60)) -- шея
		p("B", V(2.4, 2.2, 2.6), V(0, 2.6, -2.8), rgb(255, 200, 60)) -- голова
		p("B", V(1.6, 1.2, 1.6), V(0, 2.2, -4.0), rgb(255, 215, 90)) -- морда
		p("B", V(0.3, 0.3, 0.3), V(0.4, 2.5, -4.75), BLACK)
		p("B", V(0.3, 0.3, 0.3), V(-0.4, 2.5, -4.75), BLACK)
		eye(0.7, 3.0, -3.7, 0.65, rgb(255, 80, 40))
		eye(-0.7, 3.0, -3.7, 0.65, rgb(255, 80, 40))
		p("W", V(0.4, 1.4, 0.5), V(0.6, 4.0, -2.4), WHITE, nil, A(-30, 0, 0)) -- рога
		p("W", V(0.4, 1.4, 0.5), V(-0.6, 4.0, -2.4), WHITE, nil, A(-30, 0, 0))
		-- шипы на спине
		for k = 0, 4 do
			p("W", V(0.3, 0.9, 0.9), V(0, 1.8 - k * 0.15, -0.8 + k * 1.0), rgb(255, 120, 40), NEON, A(0, 180, 0))
		end
		-- крылья
		for _, sx in ipairs({ -1, 1 }) do
			p("C", V(3.2, 0.4, 0.4), V(sx * 2.6, 2.2, 0.0), rgb(230, 150, 30), nil, A(0, 0, sx * -25))
			p("K", V(4.2, 0.2, 3.0), V(sx * 3.4, 1.7, 0.9), rgb(255, 130, 40), NEON, A(0, sx * -10, sx * 20), 0.15)
			p("K", V(2.6, 0.2, 2.2), V(sx * 5.2, 2.4, 1.2), rgb(255, 180, 60), NEON, A(0, sx * -20, sx * 35), 0.15)
			p("C", V(1.6, 0.9, 0.9), V(sx * 1.1, -1.6, -1.0), rgb(240, 180, 40), nil, UP)
			p("C", V(1.6, 0.9, 0.9), V(sx * 1.1, -1.6, 1.2), rgb(240, 180, 40), nil, UP)
		end
		-- хвост
		p("B", V(1.4, 1.2, 2.8), V(0, -0.2, 3.2), rgb(255, 195, 50), nil, A(15, 0, 0))
		p("B", V(1.0, 0.9, 2.2), V(0, -0.8, 5.0), rgb(255, 195, 50), nil, A(20, 0, 0))
		p("W", V(0.3, 1.2, 1.2), V(0, -0.6, 6.3), rgb(255, 120, 40), NEON, A(0, 180, 0))
		-- нимб
		p("C", V(0.25, 3.4, 3.4), V(0, 4.9, -2.6), rgb(255, 255, 170), NEON, UP)
	end,
}

---------------------------------------------------------------------
-- Стиль «брейнрот»: многим существам — человеческие ноги в кроссовках
-- и аксессуары. legs = { длина, цвет кожи, цвет кроссовок, расстояние между ног }
---------------------------------------------------------------------
local STYLE = {
	frog_slipper = { legs = { 2.2, rgb(255, 210, 170), rgb(60, 140, 255), 0.8 }, shades = { 0, 1.5, -1.6, 2.6 } },
	dumpling = { legs = { 1.8, rgb(250, 220, 190), rgb(255, 60, 80), 0.9 }, chef = { 0, 1.9, 0.1 } },
	mushroom_hedgehog = { legs = { 1.6, rgb(240, 200, 160), rgb(80, 220, 120), 0.8 } },
	banana_crab = { shades = { 0, 1.6, -1.45, 2.0 }, chain = { 0, 0.1, -1.4 } },
	fire_hamster = { legs = { 2.0, rgb(255, 200, 170), rgb(255, 255, 255), 1.0 }, shades = { 0, 0.75, -1.85, 2.0 } },
	cloud_sheep = { headphones = { 0, 1.0, -2.3, 2.2 } },
	owl_king = { legs = { 2.0, rgb(255, 180, 60), rgb(255, 205, 40), 0.8 }, scepter = { 2.4, 0, -0.6 } },
	rocket_penguin = { chain = { 0, 0.3, -1.6 } },
	crystal_whale = { tinyWings = { 1.8, 1.4, 0.2 } },
	shadow_fox = { scarf = { 0, 0.3, -1.8 } },
	sun_dragon = { chain = { 0, 0.4, -2.2 } },
}

local function addStyle(id, p, s)
	local st = STYLE[id]
	if not st then
		return 0
	end
	local legLen = 0
	local spec = SPECS[id]
	if st.legs then
		legLen = st.legs[1]
		local skin, shoe, gap = st.legs[2], st.legs[3], st.legs[4]
		local top = -spec.foot
		for _, sx in ipairs({ -1, 1 }) do
			local x = sx * gap
			p("C", V(legLen, 0.55, 0.55), V(x, top - legLen / 2, 0), skin, nil, UP)
			p("K", V(0.9, 0.55, 1.6), V(x, top - legLen - 0.05, -0.35), shoe)
			p("K", V(1.0, 0.22, 1.7), V(x, top - legLen - 0.4, -0.35), WHITE)
			p("K", V(0.92, 0.12, 0.35), V(x, top - legLen + 0.15, -0.9), WHITE)
		end
	end
	if st.shades then
		local x, y, z, w = st.shades[1], st.shades[2], st.shades[3], st.shades[4]
		p("K", V(w, 0.18, 0.15), V(x, y + 0.15, z), BLACK)
		p("K", V(w * 0.42, w * 0.25, 0.15), V(x - w * 0.24, y, z - 0.03), BLACK, GLASS, nil, 0.1)
		p("K", V(w * 0.42, w * 0.25, 0.15), V(x + w * 0.24, y, z - 0.03), BLACK, GLASS, nil, 0.1)
	end
	if st.chef then
		local x, y, z = st.chef[1], st.chef[2], st.chef[3]
		p("C", V(1.0, 1.6, 1.6), V(x, y, z), WHITE, nil, UP)
		p("B", V(2.2, 1.4, 2.2), V(x, y + 1.0, z), WHITE)
	end
	if st.chain then
		local x, y, z = st.chain[1], st.chain[2], st.chain[3]
		for k = -2, 2 do
			p("B", V(0.35, 0.35, 0.35), V(x + k * 0.38, y + math.abs(k) * 0.18, z), rgb(255, 210, 40), METAL)
		end
		p("B", V(0.7, 0.7, 0.3), V(x, y - 0.35, z - 0.05), rgb(255, 210, 40), NEON)
	end
	if st.headphones then
		local x, y, z, w = st.headphones[1], st.headphones[2], st.headphones[3], st.headphones[4]
		p("K", V(w, 0.25, 0.4), V(x, y + 0.9, z), rgb(255, 60, 140))
		p("C", V(0.5, 1.0, 1.0), V(x - w / 2, y, z), rgb(255, 60, 140))
		p("C", V(0.5, 1.0, 1.0), V(x + w / 2, y, z), rgb(255, 60, 140))
	end
	if st.scepter then
		local x, y, z = st.scepter[1], st.scepter[2], st.scepter[3]
		p("C", V(4, 0.3, 0.3), V(x, y, z), rgb(255, 205, 40), METAL, UP)
		p("B", V(0.9, 0.9, 0.9), V(x, y + 2.2, z), rgb(80, 220, 255), NEON)
	end
	if st.tinyWings then
		local x, y, z = st.tinyWings[1], st.tinyWings[2], st.tinyWings[3]
		for _, sx in ipairs({ -1, 1 }) do
			p("K", V(2.4, 0.2, 1.4), V(sx * x, y, z), WHITE, NEON, A(0, 0, sx * 30), 0.1)
		end
	end
	if st.scarf then
		local x, y, z = st.scarf[1], st.scarf[2], st.scarf[3]
		p("C", V(0.7, 2.2, 2.2), V(x, y, z), rgb(230, 40, 60), FABRIC, UP)
		p("K", V(0.6, 1.6, 0.25), V(x + 0.6, y - 0.9, z - 0.9), rgb(230, 40, 60), FABRIC)
	end
	return legLen
end

local function makePart(model, shape, size, cf, color, material, transparency)
	local p
	if shape == "W" then
		p = Instance.new("WedgePart")
	else
		p = Instance.new("Part")
		if shape == "B" then
			p.Shape = Enum.PartType.Ball
		elseif shape == "C" then
			p.Shape = Enum.PartType.Cylinder
		else
			p.Shape = Enum.PartType.Block
		end
	end
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.Transparency = transparency or 0
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Anchored = true
	p.CanCollide = false
	p.CanTouch = false
	p.CastShadow = true
	p.Massless = true
	p.Parent = model
	return p
end

local function weld(a, b)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = b
end

function CreatureFactory.scaleFor(id)
	local def = Config.Creatures[id]
	if def.rarity >= 7 then
		return 2.4
	end
	return 1.25 + (def.rarity - 1) * 0.15
end

-- высота центра тела над точкой, где стоит существо
local function legLength(id)
	local st = STYLE[id]
	return st and st.legs and st.legs[1] or 0
end

function CreatureFactory.footOffset(id)
	return (SPECS[id].foot + legLength(id)) * CreatureFactory.scaleFor(id)
end

-- Создаёт модель существа, стоящего на cframe.
function CreatureFactory.build(id, cframe)
	local spec = SPECS[id]
	local def = Config.Creatures[id]
	local rarity = Config.Rarities[def.rarity]
	local s = CreatureFactory.scaleFor(id)

	local model = Instance.new("Model")
	model.Name = def.name
	model:SetAttribute("CreatureId", id)

	local lift = spec.foot + legLength(id)
	local origin = cframe * CFrame.new(0, lift * s, 0)
	local b = spec.body
	-- body = { форма, размер, цвет, материал?, поворот?, прозрачность? }
	local bodyCf = origin
	if b[5] then
		bodyCf = origin * b[5]
	end
	local body = makePart(model, b[1], b[2] * s, bodyCf, b[3], b[4], b[6])
	body.Name = "Body"
	model.PrimaryPart = body

	local function p(shape, size, pos, color, material, rot, transparency)
		local cf = origin * CFrame.new(pos * s)
		if rot then
			cf = cf * rot
		end
		local part = makePart(model, shape, size * s, cf, color, material, transparency)
		weld(body, part)
		return part
	end

	local function eye(x, y, z, size, iris)
		p("B", V(size, size, size * 0.7), V(x, y, z), WHITE)
		p("B", V(size * 0.62, size * 0.62, size * 0.3), V(x, y - size * 0.05, z - size * 0.28), iris or rgb(60, 40, 30), spec.glowEyes and NEON or nil)
		p("B", V(size * 0.34, size * 0.34, size * 0.2), V(x, y - size * 0.05, z - size * 0.38), BLACK)
		p("B", V(size * 0.18, size * 0.18, size * 0.1), V(x + size * 0.12, y + size * 0.14, z - size * 0.45), WHITE, NEON)
	end

	spec.build(p, eye)
	addStyle(id, p, s)

	if spec.fire then
		local fire = Instance.new("Fire")
		fire.Size = 3 * s
		fire.Heat = 5
		fire.Color = rgb(255, 120, 30)
		fire.SecondaryColor = rgb(255, 220, 60)
		fire.Parent = body
	end
	if def.rarity >= 4 then
		local l = Instance.new("PointLight")
		l.Color = rarity.color
		l.Range = spec.divine and 30 or 14
		l.Brightness = spec.divine and 3 or 1.5
		l.Parent = body
	end
	if def.rarity >= 3 then
		local sparkles = Instance.new("ParticleEmitter")
		sparkles.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		sparkles.Color = ColorSequence.new(rarity.color)
		sparkles.Rate = spec.divine and 30 or (def.rarity * 2)
		sparkles.Lifetime = NumberRange.new(1, 2)
		sparkles.Speed = NumberRange.new(1, 3)
		sparkles.SpreadAngle = Vector2.new(180, 180)
		sparkles.Size = NumberSequence.new(0.5)
		sparkles.LightEmission = 1
		sparkles.Parent = body
	end

	-- столб света редкости (как маяк), у редких и выше
	if def.rarity >= 3 then
		local beam = makePart(model, "C", V(60, 1.2 + def.rarity * 0.3, 1.2 + def.rarity * 0.3), origin * CFrame.new(0, 30 - lift * s, 0) * UP, rarity.color, NEON, 0.75)
		beam.CastShadow = false
		beam.Name = "RarityBeam"
		weld(body, beam)
	end

	-- табличка: имя, редкость, доход
	local gui = Instance.new("BillboardGui")
	gui.Name = "Info"
	gui.Size = UDim2.fromOffset(190, 62)
	gui.StudsOffset = Vector3.new(0, lift * s + 2.5, 0)
	gui.MaxDistance = 130
	gui.LightInfluence = 0
	gui.Adornee = body
	local function line(text, color, y, h)
		local l = Instance.new("TextLabel")
		l.BackgroundTransparency = 1
		l.Size = UDim2.new(1, 0, h, 0)
		l.Position = UDim2.new(0, 0, y, 0)
		l.Font = Enum.Font.FredokaOne
		l.TextScaled = true
		l.TextColor3 = color
		l.TextStrokeTransparency = 0
		l.Text = text
		l.Parent = gui
	end
	line(def.name, WHITE, 0, 0.38)
	line(rarity.name, rarity.color, 0.38, 0.3)
	line(Config.formatMoney(def.income) .. "/сек", rgb(120, 255, 120), 0.68, 0.32)
	gui.Parent = body

	return model
end

function CreatureFactory.setAnchored(model, anchored)
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.Anchored = anchored
		end
	end
end

return CreatureFactory
