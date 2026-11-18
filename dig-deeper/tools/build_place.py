#!/usr/bin/env python3
"""
Сборщик игры «Копай глубже» в один файл Roblox: build/DigDeeper.rbxlx

  python3 tools/build_place.py

Что делает:
  1. Строит 3D-карту острова (трава из «кубиков», шахта, лавки, кольца «встань в круг»,
     доски лидеров, деревья, облака, парящие острова) — как обычные детали Roblox,
     их можно двигать и менять прямо в Studio.
  2. Кладёт все скрипты из src/ в нужные места (как Rojo).
  3. Пишет build/map_preview.json — для картинки-превью (tools/preview).
"""
import json
import math
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "build")

S = 6100.0  # высота поверхности (как Config.SurfaceY)
BS = 6  # размер блока шахты
HALF_PIT = 48  # шахта 16 x 6 = 96 studs
ISLAND = 144  # половина размера острова (остров 288 x 288)

MATERIAL = {
    "Plastic": 256, "SmoothPlastic": 272, "Neon": 288, "Wood": 512, "WoodPlanks": 528,
    "Marble": 784, "Basalt": 788, "Slate": 800, "CrackedLava": 804, "Concrete": 816,
    "Granite": 832, "Brick": 848, "Pebble": 864, "Cobblestone": 880, "Rock": 896,
    "Sandstone": 912, "DiamondPlate": 1056, "Foil": 1072, "Metal": 1088, "Grass": 1280,
    "Sand": 1296, "Fabric": 1312, "Ground": 1360, "Ice": 1536, "Glass": 1568, "ForceField": 1584,
}
SURF = {"Smooth": 0, "Studs": 3, "Inlet": 4}
SHAPE = {"Ball": 0, "Block": 1, "Cylinder": 2}

random.seed(20261118)
PREVIEW = []

# ---------------------------------------------------------------- математика поворотов
I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]


def rx(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [[1, 0, 0], [0, c, -s], [0, s, c]]


def ry(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]


def rz(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]


def mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def apply(m, v):
    return [sum(m[i][k] * v[k] for k in range(3)) for i in range(3)]


def yaw_towards(x, z, tx=0.0, tz=0.0):
    """Угол, чтобы «перед» модели (−Z) смотрел на точку (tx, tz)."""
    dx, dz = tx - x, tz - z
    return math.degrees(math.atan2(-dx, -dz))


FLAT = rz(90)  # цилиндр «лёжа» (ось вверх)

# ---------------------------------------------------------------- объекты Roblox


class Inst:
    counter = 0

    def __init__(self, cls, name, props=None):
        Inst.counter += 1
        self.ref = "RBX%06X" % Inst.counter
        self.cls = cls
        self.name = name
        self.props = props or []
        self.children = []

    def add(self, child):
        self.children.append(child)
        return child


def folder(parent, name, cls="Folder"):
    return parent.add(Inst(cls, name))


def string_value(parent, name, value):
    if getattr(parent, "pv", None) is not None and name in ("SignKey", "Board", "PadKind"):
        PREVIEW[parent.pv][name] = value
    return parent.add(Inst("StringValue", name, [("string", "Value", value)]))


def light(parent, color, rng=16, brightness=1.5):
    return parent.add(Inst("PointLight", "Light", [
        ("float", "Brightness", brightness), ("Color3", "Color", color),
        ("float", "Range", rng), ("bool", "Shadows", False), ("bool", "Enabled", True),
    ]))


def part(parent, name, size, pos, color, mat="Plastic", rot=I3, top="Smooth", bottom="Smooth",
         sides="Smooth", shape=None, transparency=0.0, collide=True, shadow=True, cls="Part",
         reflect=0.0, extra=None):
    props = [
        ("bool", "Anchored", True),
        ("bool", "CanCollide", collide),
        ("bool", "CanQuery", collide or cls == "SpawnLocation"),
        ("bool", "CanTouch", True),
        ("bool", "CastShadow", shadow),
        ("CoordinateFrame", "CFrame", (pos, rot)),
        ("Color3uint8", "Color3uint8", color),
        ("token", "Material", MATERIAL[mat]),
        ("Vector3", "size", size),
        ("float", "Transparency", transparency),
        ("float", "Reflectance", reflect),
        ("token", "TopSurface", SURF[top]),
        ("token", "BottomSurface", SURF[bottom]),
        ("token", "FrontSurface", SURF[sides]),
        ("token", "BackSurface", SURF[sides]),
        ("token", "LeftSurface", SURF[sides]),
        ("token", "RightSurface", SURF[sides]),
    ]
    if shape:
        props.append(("token", "shape", SHAPE[shape]))
    if extra:
        props.extend(extra)
    p = parent.add(Inst(cls, name, props))
    PREVIEW.append({
        "p": [round(v, 3) for v in pos], "s": [round(v, 3) for v in size],
        "r": [round(v, 5) for row in rot for v in row], "c": list(color), "m": mat,
        "t": transparency, "sh": shape or "Block", "st": top == "Studs",
    })
    p.pv = len(PREVIEW) - 1
    return p


class Local:
    """Помогает строить модель в своих координатах и ставить её в мир с поворотом."""

    def __init__(self, parent, x, z, yaw, y=S):
        self.parent = parent
        self.origin = [x, y, z]
        self.R = ry(yaw)

    def part(self, name, size, lpos, color, lrot=I3, **kw):
        w = apply(self.R, lpos)
        pos = [self.origin[0] + w[0], self.origin[1] + w[1], self.origin[2] + w[2]]
        return part(self.parent, name, size, pos, color, rot=mul(self.R, lrot), **kw)


def shade(color, f):
    return tuple(max(0, min(255, int(c * f))) for c in color)


# ---------------------------------------------------------------- КАРТА
workspace = Inst("Workspace", "Workspace")
camera = Inst("Camera", "Camera")
cam_pos = [-150.0, S + 95.0, -205.0]
look = [0.0, S - 10.0, 0.0]


def look_at(eye, target):
    f = [target[i] - eye[i] for i in range(3)]
    n = math.sqrt(sum(v * v for v in f))
    f = [v / n for v in f]
    up = [0, 1, 0]
    r = [f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0]]
    rn = math.sqrt(sum(v * v for v in r))
    r = [v / rn for v in r]
    u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]
    back = [-v for v in f]
    return [[r[0], u[0], back[0]], [r[1], u[1], back[1]], [r[2], u[2], back[2]]]


camera.props = [
    ("CoordinateFrame", "CFrame", (cam_pos, look_at(cam_pos, look))),
    ("CoordinateFrame", "Focus", (look, I3)),
    ("float", "FieldOfView", 70.0),
]
workspace.add(camera)
workspace.props = [("Ref", "CurrentCamera", camera.ref), ("bool", "StreamingEnabled", False)]

game_map = workspace.add(Inst("Model", "Map"))

GREEN_A = (99, 214, 58)
GREEN_B = (86, 196, 48)
DIRT = (139, 92, 52)
WOOD = (122, 78, 42)
DARK_WOOD = (78, 48, 26)
GOLD = (255, 196, 40)
WHITE = (250, 248, 242)

# --- Трава в клетку со «студами» (как в топовых симуляторах)
ground = folder(game_map, "Ground", "Model")
for ix in range(-12, 12):
    for iz in range(-12, 12):
        x0, z0 = ix * 12, iz * 12
        if -HALF_PIT <= x0 < HALF_PIT and -HALF_PIT <= z0 < HALF_PIT:
            continue
        color = GREEN_A if (ix + iz) % 2 == 0 else GREEN_B
        part(ground, "Grass", (12, 1, 12), (x0 + 6, S - 0.5, z0 + 6), color, top="Studs", shadow=True)

# --- Земля под травой и «перевёрнутая пирамида» снизу (парящий остров)
def ring_slabs(parent, name, inner, outer, y_top, thickness, color, mat="Plastic"):
    cy = y_top - thickness / 2
    w = outer * 2
    depth = outer - inner
    part(parent, name, (w, thickness, depth), (0, cy, inner + depth / 2), color, mat, sides="Inlet", bottom="Inlet")
    part(parent, name, (w, thickness, depth), (0, cy, -inner - depth / 2), color, mat, sides="Inlet", bottom="Inlet")
    part(parent, name, (depth, thickness, inner * 2), (inner + depth / 2, cy, 0), color, mat, sides="Inlet", bottom="Inlet")
    part(parent, name, (depth, thickness, inner * 2), (-inner - depth / 2, cy, 0), color, mat, sides="Inlet", bottom="Inlet")


ring_slabs(ground, "Dirt", HALF_PIT, ISLAND, S - 1, 24, DIRT)
y = S - 25
for outer, thick, color in [(130, 24, (118, 78, 44)), (110, 20, (124, 125, 136)), (88, 18, (108, 109, 120)), (68, 16, (96, 97, 108))]:
    ring_slabs(ground, "Underside", 54, outer, y, thick, color)
    y -= thick

# --- Стены шахты по слоям и раскалённое дно
mine = folder(game_map, "MineShaft", "Model")
LAYERS = [
    ("Dirt", 0, 50, (98, 62, 34), "Plastic"),
    ("Stone", 50, 150, (92, 94, 104), "Plastic"),
    ("Caves", 150, 300, (52, 40, 84), "Plastic"),
    ("Lava", 300, 500, (70, 20, 14), "CrackedLava"),
    ("Ruins", 500, 800, (150, 126, 80), "Plastic"),
    ("Core", 800, 1000, (150, 45, 10), "Neon"),
]
for lid, d0, d1, color, mat in LAYERS:
    y_top = S - d0 * BS - (1 if d0 == 0 else 0)
    y_bot = S - d1 * BS
    h = y_top - y_bot
    cy = (y_top + y_bot) / 2
    sides = "Inlet" if mat == "Plastic" else "Smooth"
    part(mine, "Wall_" + lid, (108, h, 6), (0, cy, 51), color, mat, sides=sides, shadow=False)
    part(mine, "Wall_" + lid, (108, h, 6), (0, cy, -51), color, mat, sides=sides, shadow=False)
    part(mine, "Wall_" + lid, (6, h, 96), (51, cy, 0), color, mat, sides=sides, shadow=False)
    part(mine, "Wall_" + lid, (6, h, 96), (-51, cy, 0), color, mat, sides=sides, shadow=False)
core = part(mine, "CoreFloor", (108, 4, 108), (0, S - 1000 * BS - 2, 0), (255, 120, 30), "Neon")
light(core, (255, 150, 60), 60, 3)

# --- Деревянный бортик вокруг шахты + фонари на углах
rim = folder(game_map, "PitRim", "Model")
part(rim, "Rim", (104, 1.2, 4), (0, S + 0.6, 50), DARK_WOOD, "WoodPlanks")
part(rim, "Rim", (104, 1.2, 4), (0, S + 0.6, -50), DARK_WOOD, "WoodPlanks")
part(rim, "Rim", (4, 1.2, 96), (50, S + 0.6, 0), DARK_WOOD, "WoodPlanks")
part(rim, "Rim", (4, 1.2, 96), (-50, S + 0.6, 0), DARK_WOOD, "WoodPlanks")
for sx in (-1, 1):
    for sz in (-1, 1):
        part(rim, "LanternPost", (2, 9, 2), (sx * 52, S + 4.5, sz * 52), WOOD, top="Studs")
        lamp = part(rim, "Lantern", (2.4, 2.4, 2.4), (sx * 52, S + 10.2, sz * 52), (255, 206, 96), "Neon", shadow=False)
        light(lamp, (255, 200, 120), 20, 1.6)

# --- Арка «ШАХТА» над входом (смотрит на спавн)
arch = folder(game_map, "MineArch", "Model")
for sx in (-1, 1):
    part(arch, "Pillar", (6, 36, 6), (sx * 58, S + 18, -56), WOOD, top="Studs", sides="Inlet")
    part(arch, "PillarBase", (8, 3, 8), (sx * 58, S + 1.5, -56), (110, 110, 120), "Plastic", top="Studs")
    torch = part(arch, "Torch", (1.8, 1.8, 1.8), (sx * 58, S + 27, -59.4), (255, 140, 40), "Neon", shadow=False)
    light(torch, (255, 160, 70), 22, 2)
part(arch, "Beam", (128, 6, 7), (0, S + 39, -56), DARK_WOOD, "WoodPlanks", top="Studs")
sign = part(arch, "Sign", (64, 13, 1.4), (0, S + 39, -60.2), (58, 36, 20), "WoodPlanks")
string_value(sign, "SignKey", "Mine")
part(arch, "Frame", (66, 1.2, 1.6), (0, S + 46, -60.4), GOLD, "Plastic")
part(arch, "Frame", (66, 1.2, 1.6), (0, S + 32, -60.4), GOLD, "Plastic")
part(arch, "Frame", (1.2, 15, 1.6), (-33, S + 39, -60.4), GOLD, "Plastic")
part(arch, "Frame", (1.2, 15, 1.6), (33, S + 39, -60.4), GOLD, "Plastic")

# --- Спавн, дорожка с жёлтыми стрелками, фонари
spawn_area = folder(game_map, "SpawnArea", "Model")
part(spawn_area, "SpawnRing", (0.6, 22, 22), (0, S + 0.3, -120), (90, 200, 255), "Neon", rot=FLAT, shape="Cylinder", transparency=0.25, collide=False, shadow=False)
part(spawn_area, "Spawn", (13, 1.4, 13), (0, S + 0.7, -120), WHITE, "Plastic", top="Studs", cls="SpawnLocation",
     extra=[("bool", "Neutral", True), ("int", "Duration", 0), ("bool", "Enabled", True), ("bool", "AllowTeamChangeOnTouch", False)])
for i, zc in enumerate([-106, -94, -82, -70, -58]):
    part(spawn_area, "Path", (12, 0.2, 12), (0, S + 0.1, zc), (255, 214, 140) if i % 2 == 0 else (250, 200, 120), top="Studs")
for zc in (-100, -87, -74, -62):
    part(spawn_area, "Arrow", (1.2, 0.3, 5), (-1.6, S + 0.35, zc), (255, 221, 51), rot=ry(45), shadow=False)
    part(spawn_area, "Arrow", (1.2, 0.3, 5), (1.6, S + 0.35, zc), (255, 221, 51), rot=ry(-45), shadow=False)
for sx in (-1, 1):
    for zc in (-104, -72):
        part(spawn_area, "LampPost", (0.8, 9, 0.8), (sx * 9, S + 4.5, zc), (34, 34, 40), "Metal")
        bulb = part(spawn_area, "Lamp", (1.8, 1.8, 1.8), (sx * 9, S + 9.6, zc), (255, 236, 160), "Neon", shadow=False)
        light(bulb, (255, 225, 160), 16, 1.2)

# --- Большая вывеска «КОПАЙ ГЛУБЖЕ» и доски лидеров (север, видно со спавна)
signs = folder(game_map, "Signs", "Model")
for sx in (-1, 1):
    part(signs, "Post", (5, 58, 5), (sx * 41, S + 29, 130), WOOD, top="Studs", sides="Inlet")
title = part(signs, "TitleBoard", (82, 24, 2), (0, S + 44, 128), (66, 40, 22), "WoodPlanks")
string_value(title, "SignKey", "Title")
for fy in (-12.6, 12.6):
    part(signs, "Frame", (85, 1.6, 2.4), (0, S + 44 + fy, 127.6), GOLD)
for fx in (-41.8, 41.8):
    part(signs, "Frame", (1.6, 26.8, 2.4), (fx, S + 44, 127.6), GOLD)
sub = part(signs, "SubBoard", (68, 7, 1.6), (0, S + 27, 127.6), (40, 40, 58))
string_value(sub, "SignKey", "Sub")

boards = folder(game_map, "Boards", "Model")
for sx, kind in ((-1, "Depth"), (1, "Rebirths")):
    x = sx * 86
    for px in (-14, 14):
        part(boards, "Post", (3, 31, 3), (x + px, S + 15.5, 126), WOOD, top="Studs")
    board = part(boards, "Leaderboard", (32, 25, 1.6), (x, S + 17, 124.5), (28, 28, 40))
    string_value(board, "Board", kind)
    part(boards, "Roof", (36, 2, 5), (x, S + 30.5, 125), (255, 160, 40) if kind == "Depth" else (170, 90, 255), top="Studs")

# --- Лавки и круги «встань в круг»
pads_folder = folder(game_map, "Pads", "Model")
PAD_COLORS = {
    "Sell": (255, 84, 70), "PickShop": (255, 160, 40), "BagShop": (60, 150, 255),
    "Rebirth": (180, 90, 255), "Elevator": (255, 200, 40), "Daily": (80, 220, 70),
}


def pad(local, kind, lz):
    color = PAD_COLORS[kind]
    local.part("PadRing", (0.25, 21, 21), [0, 0.12, lz], WHITE, FLAT, shape="Cylinder", transparency=0.35, collide=False, shadow=False)
    p = local.part("Pad", (0.3, 18, 18), [0, 0.2, lz], color, FLAT, shape="Cylinder", mat="Neon", transparency=0.2, collide=False, shadow=False)
    string_value(p, "PadKind", kind)
    return p


def spinner(local, name, size, lpos, color, speed, mat="Neon", lrot=I3, shape=None):
    p = local.part(name, size, lpos, color, lrot, mat=mat, shape=shape, collide=False, shadow=False)
    string_value(p, "Spin", str(speed))
    return p


def booth(kind, x, z, primary, deco):
    b = folder(game_map, "Booth_" + kind, "Model")
    L = Local(b, x, z, yaw_towards(x, z))
    dark = shade(primary, 0.72)
    L.part("Floor", (26, 1, 20), [0, 0.5, 0], (200, 150, 96), mat="WoodPlanks")
    L.part("BackWall", (26, 13, 1.5), [0, 7.5, 9.25], (245, 238, 225), top="Studs")
    for px in (-12.3, 12.3):
        for pz in (-9.3, 9.3):
            L.part("Post", (1.4, 15, 1.4), [px, 8.5, pz], WHITE)
    L.part("Counter", (22, 4, 3.2), [0, 3, -6], dark, sides="Inlet")
    L.part("CounterTop", (23, 0.7, 4), [0, 5.35, -6], (170, 120, 70), mat="WoodPlanks")
    n = 8
    width = 26 / n
    for i in range(n):
        cx = -13 + width / 2 + i * width
        color = primary if i % 2 == 0 else WHITE
        L.part("Awning", (width, 0.8, 22), [cx, 16.4, 0], color, rx(-11), top="Studs")
        L.part("Valance", (width, 1.8, 0.8), [cx, 13.9, -11.4], WHITE if i % 2 == 0 else primary, rx(-11))
    L.part("SignBack", (18.4, 5.8, 0.8), [0, 19.8, -10.2], WHITE)
    s = L.part("Sign", (17, 4.6, 1), [0, 19.8, -10.7], primary)
    string_value(s, "SignKey", kind)
    pad(L, kind, -19)
    deco(L)
    return L


def deco_sell(L):
    for i, (px, h) in enumerate([(-7, 3), (-5, 2), (-6, 1.2)]):
        for k in range(int(h * 2)):
            L.part("Coin", (0.45, 2.4, 2.4), [px + (i % 2) * 0.3, 5.95 + k * 0.45, -6 + (i - 1) * 0.9], GOLD, FLAT, mat="Metal", shape="Cylinder", collide=False)
    for i, color in enumerate([(64, 128, 255), (240, 40, 74), (40, 225, 115), (176, 98, 240)]):
        L.part("Ore", (1.5, 1.5, 1.5), [2 + i * 2.1, 6.45, -6], color, ry(20 * i), mat="Neon", collide=False, shadow=False)
    L.part("MoneyBag", (4.2, 4.2, 4.2), [8, 3.1, 4], (214, 176, 112), shape="Ball")
    L.part("MoneyBagTie", (1.6, 1.4, 1.6), [8, 5.4, 4], (150, 110, 60))
    spinner(L, "BigCoin", (0.8, 6, 6), [0, 26.5, -10], GOLD, 2, mat="Metal", shape="Cylinder")


def deco_pick(L):
    L.part("AnvilBase", (3, 2.4, 2.2), [7, 2.2, 3], (60, 60, 68), mat="Metal")
    L.part("AnvilTop", (5, 1.3, 2.4), [7, 4.0, 3], (75, 75, 84), mat="Metal")
    for i, color in enumerate([(255, 200, 40), (95, 235, 255), (222, 224, 232)]):
        px = -6 + i * 6
        L.part("Handle", (0.45, 6, 0.45), [px, 8, 8.2], WOOD, rz(25), mat="Wood")
        L.part("Head", (0.7, 0.8, 3.6), [px - 1.2, 10.6, 8.2], color, rz(25), mat="Metal")
    spinner(L, "Gem", (3.6, 3.6, 3.6), [0, 26.5, -10], (95, 235, 255), 1.2, lrot=mul(rx(45), rz(45)))


def deco_bag(L):
    for i, color in enumerate([(214, 50, 44), (47, 134, 255), (255, 178, 30)]):
        px = -6 + i * 6
        L.part("Backpack", (3.2, 3.8, 2), [px, 7.6, -6], color, top="Studs")
        L.part("Pocket", (2.2, 1.4, 0.4), [px, 7, -7.15], shade(color, 0.75))
        L.part("Strap", (0.4, 3.4, 0.3), [px - 0.9, 7.8, -4.9], (50, 40, 30))
        L.part("Strap", (0.4, 3.4, 0.3), [px + 0.9, 7.8, -4.9], (50, 40, 30))
    spinner(L, "SpinBag", (4, 4.6, 2.4), [0, 26.5, -10], (47, 134, 255), 1.4, mat="Plastic")


booth("Sell", -110, -4, PAD_COLORS["Sell"], deco_sell)
booth("PickShop", -84, 84, PAD_COLORS["PickShop"], deco_pick)
booth("BagShop", 84, 84, PAD_COLORS["BagShop"], deco_bag)

# --- Алтарь перерождения
reb = folder(game_map, "RebirthAltar", "Model")
L = Local(reb, 110, -4, yaw_towards(110, -4))
L.part("Base", (2, 28, 28), [0, 1, 0], (96, 76, 128), FLAT, shape="Cylinder", top="Studs")
L.part("Glow", (0.5, 23, 23), [0, 2.2, 0], (190, 110, 255), FLAT, mat="Neon", shape="Cylinder", transparency=0.45, collide=False)
for px in (-9.5, 9.5):
    for pz in (-9.5, 9.5):
        L.part("Pillar", (2.6, 16, 2.6), [px, 10, pz], (128, 108, 170), sides="Inlet")
        L.part("PillarCap", (3.2, 1.4, 3.2), [px, 18.7, pz], (190, 110, 255), mat="Neon")
crystal = spinner(L, "Crystal", (6, 6, 6), [0, 13, 0], (190, 100, 255), 0.8, lrot=mul(rx(45), rz(35)))
light(crystal, (200, 120, 255), 34, 2.2)
L.part("SignBack", (17.4, 5.8, 0.8), [0, 8, 13.6], WHITE)
s = L.part("Sign", (16, 4.6, 1), [0, 8, 13.1], (150, 70, 230))
string_value(s, "SignKey", "Rebirth")
pad(L, "Rebirth", -22)

# --- Сундук ежедневных наград
daily = folder(game_map, "DailyChest", "Model")
L = Local(daily, -86, -94, yaw_towards(-86, -94))
L.part("Platform", (1, 24, 24), [0, 0.5, 0], (196, 150, 98), FLAT, mat="WoodPlanks", shape="Cylinder")
L.part("Chest", (11, 6.5, 7.5), [0, 4.25, 0], (150, 92, 45), mat="WoodPlanks")
L.part("Lid", (11.4, 3, 7.9), [0, 8.9, 0], (172, 106, 52), mat="WoodPlanks", top="Studs")
for bx in (-3.8, 3.8):
    L.part("Band", (0.8, 9.8, 8.2), [bx, 5.9, 0], GOLD, mat="Metal")
lock = L.part("Lock", (1.8, 2.2, 0.6), [0, 7.3, -4.1], (255, 220, 60), mat="Neon", shadow=False)
light(lock, (255, 220, 120), 18, 1.4)
for _ in range(9):
    a = random.uniform(0, math.tau)
    r = random.uniform(6.5, 9.5)
    L.part("Coin", (0.35, 1.8, 1.8), [math.cos(a) * r, 1.2, math.sin(a) * r], GOLD, FLAT, mat="Metal", shape="Cylinder", collide=False)
L.part("SignPost", (1.2, 14, 1.2), [0, 7, 6.2], WOOD)
s = L.part("Sign", (15, 4.6, 1), [0, 15.5, 5.6], (60, 180, 60))
string_value(s, "SignKey", "Daily")
spinner(L, "Gift", (4, 4, 4), [0, 21, 0], (80, 220, 70), 1.5, mat="Neon")
pad(L, "Daily", -18)

# --- Башня лифта
elev = folder(game_map, "ElevatorTower", "Model")
L = Local(elev, 86, -94, yaw_towards(86, -94))
L.part("Base", (18, 1.2, 18), [0, 0.6, 0], (90, 95, 105), mat="DiamondPlate")
for px in (-8, 8):
    for pz in (-8, 8):
        L.part("Pillar", (2, 44, 2), [px, 22, pz], (255, 196, 40), mat="Metal")
for hy in (12, 24, 36):
    for pz in (-8, 8):
        L.part("Bar", (18, 1, 1), [0, hy, pz], (40, 40, 46), mat="Metal")
    for px in (-8, 8):
        L.part("Bar", (1, 1, 18), [px, hy, 0], (40, 40, 46), mat="Metal")
L.part("Cap", (20, 2, 20), [0, 45, 0], (255, 196, 40), top="Studs")
L.part("Cabin", (13, 1, 13), [0, 1.6, 0], (255, 150, 40), mat="Neon", transparency=0.3, collide=False)
L.part("SignBack", (17.4, 5.8, 0.8), [0, 40.5, -9.4], WHITE)
s = L.part("Sign", (16, 4.6, 1), [0, 40.5, -9.9], (40, 40, 46))
string_value(s, "SignKey", "Elevator")
bulb = L.part("Beacon", (2.4, 2.4, 2.4), [0, 47.4, 0], (255, 80, 60), mat="Neon", shadow=False)
light(bulb, (255, 120, 80), 26, 2)
pad(L, "Elevator", -19)

# --- Природа: деревья, кусты, цветы, камни
nature = folder(game_map, "Nature", "Model")
BLOCKED = [  # (x, z, радиус) — места, где не ставим декор
    (0, 0, 68), (0, -120, 18), (0, -88, 14), (0, -66, 12), (-110, -4, 26), (-84, 84, 26), (84, 84, 26),
    (110, -4, 28), (-86, -94, 24), (86, -94, 24), (0, 128, 46), (-86, 124, 22), (86, 124, 22),
    (34, -100, 14), (63, 0, 46), (-66, 66, 9), (66, 66, 9), (-64, -30, 9), (-60, -60, 10), (60, -60, 10),
]


def free(x, z, pad_r=0):
    for bx, bz, r in BLOCKED:
        if (x - bx) ** 2 + (z - bz) ** 2 < (r + pad_r) ** 2:
            return False
    return abs(x) < ISLAND - 7 and abs(z) < ISLAND - 7


TREE_STYLES = [((76, 184, 56), (104, 208, 72)), ((76, 184, 56), (104, 208, 72)), ((92, 196, 64), (130, 222, 90)),
               ((255, 150, 200), (255, 190, 222)), ((255, 150, 52), (255, 196, 96))]


def tree(parent, x, z, scale=1.0, y0=S):
    leaves, top = random.choice(TREE_STYLES)
    T = Local(parent, x, z, random.uniform(0, 90), y0)
    sc = scale
    T.part("Trunk", (3.6 * sc, 13 * sc, 3.6 * sc), [0, 6.5 * sc, 0], (112, 72, 40), top="Studs", sides="Inlet")
    T.part("Leaves", (14 * sc, 9 * sc, 14 * sc), [0, 16 * sc, 0], leaves, top="Studs")
    T.part("LeavesTop", (8.5 * sc, 5 * sc, 8.5 * sc), [0, 23 * sc, 0], top, top="Studs")
    for _ in range(2):
        ox, oz = random.choice([(7, 2), (-7, -1), (1, 7), (-2, -7)])
        T.part("LeavesSide", (5.5 * sc, 5.5 * sc, 5.5 * sc), [ox * sc, 14 * sc, oz * sc], top, top="Studs")


placed = []
attempts = 0
while len(placed) < 18 and attempts < 6000:
    attempts += 1
    a = random.uniform(0, math.tau)
    r = random.uniform(96, 136)
    x, z = math.cos(a) * r, math.sin(a) * r
    if not free(x, z, 6):
        continue
    if any((x - px) ** 2 + (z - pz) ** 2 < 22 ** 2 for px, pz in placed):
        continue
    placed.append((x, z))
    tree(nature, x, z, random.uniform(0.85, 1.2))

for _ in range(16):
    for _ in range(200):
        x, z = random.uniform(-136, 136), random.uniform(-136, 136)
        if free(x, z, 4):
            break
    B = Local(nature, x, z, random.uniform(0, 90))
    B.part("Bush", (6, 4, 6), [0, 2, 0], (64, 168, 52), top="Studs")
    B.part("BushTop", (4, 3, 4), [0.6, 5, -0.4], (92, 196, 66), top="Studs")

FLOWER_COLORS = [(255, 90, 90), (255, 220, 60), (255, 255, 255), (200, 120, 255), (90, 170, 255), (255, 150, 200)]
for _ in range(55):
    for _ in range(200):
        x, z = random.uniform(-138, 138), random.uniform(-138, 138)
        if free(x, z, 1):
            break
    part(nature, "Stem", (0.4, 1.6, 0.4), (x, S + 0.8, z), (60, 150, 50), collide=False, shadow=False)
    part(nature, "Flower", (1.4, 1.2, 1.4), (x, S + 2.0, z), random.choice(FLOWER_COLORS), rot=ry(random.uniform(0, 90)), collide=False, shadow=False)

for _ in range(10):
    for _ in range(200):
        x, z = random.uniform(-134, 134), random.uniform(-134, 134)
        if free(x, z, 3):
            break
    sz = random.uniform(3, 6.5)
    part(nature, "Rock", (sz, sz * 0.75, sz * 0.9), (x, S + sz * 0.3, z), random.choice([(132, 134, 145), (118, 120, 130), (150, 152, 160)]),
         rot=ry(random.uniform(0, 90)), top="Studs")


# --- Гигантская золотая кирка-памятник у дорожки
statue = folder(game_map, "PickaxeStatue", "Model")
part(statue, "Rock", (10, 3.5, 10), (34, S + 1.75, -100), (124, 126, 138), top="Studs", rot=ry(12))
part(statue, "Rock", (6, 2.4, 6), (30, S + 3.5, -97), (138, 140, 152), top="Studs", rot=ry(40))
tilt = mul(ry(25), rz(-20))
hpos = apply(tilt, [0, 14, 0])
part(statue, "GiantHandle", (2.4, 30, 2.4), (34 + hpos[0], S + 1 + hpos[1], -100 + hpos[2]), (122, 78, 42), "Wood", rot=tilt)
top_ = apply(tilt, [0, 28.5, 0])
part(statue, "GiantHead", (3.2, 3.6, 19), (34 + top_[0], S + 1 + top_[1], -100 + top_[2]), (255, 200, 40), "Metal", rot=tilt)
for side in (-1, 1):
    tip = apply(tilt, [0, 27.6, side * 10.6])
    part(statue, "GiantTip", (2.8, 2.8, 4.4), (34 + tip[0], S + 1 + tip[1], -100 + tip[2]), (255, 214, 70), "Metal", rot=mul(tilt, rx(-side * 26)))
for k in range(7):
    a = k / 7 * math.tau
    part(statue, "Coin", (0.35, 1.8, 1.8), (34 + math.cos(a) * 7.5, S + 0.25, -100 + math.sin(a) * 7.5), GOLD, "Metal", rot=FLAT, shape="Cylinder", collide=False)

# --- Рельсы и вагонетка с рудой вдоль шахты
rails = folder(game_map, "MineCart", "Model")
for rx_ in (61, 65):
    part(rails, "Rail", (0.6, 0.6, 84), (rx_, S + 0.5, 0), (90, 92, 100), "Metal")
for zc in range(-40, 41, 5):
    part(rails, "Sleeper", (7, 0.4, 1.4), (63, S + 0.2, zc), (110, 70, 38), "WoodPlanks")
part(rails, "CartBody", (5, 3, 6), (63, S + 3, 8), (70, 72, 80), "Metal", top="Studs")
part(rails, "CartRim", (5.4, 0.6, 6.4), (63, S + 4.6, 8), (50, 52, 60), "Metal")
for wz in (6, 10):
    for wx in (60.6, 65.4):
        part(rails, "Wheel", (0.6, 2, 2), (wx, S + 1.4, wz), (30, 30, 34), "Metal", shape="Cylinder")
for i, color in enumerate([(64, 128, 255), (240, 40, 74), (40, 225, 115), (255, 204, 64), (176, 98, 240)]):
    part(rails, "Ore", (1.6, 1.6, 1.6), (61.8 + (i % 3) * 1.2, S + 5.3 + (i // 3) * 0.6, 6.4 + i * 0.8), color, "Neon", rot=ry(i * 23), collide=False, shadow=False)

# --- Кристаллы у шахты (светятся)
crystals = folder(game_map, "Crystals", "Model")
for cx, cz, color in [(-66, 66, (176, 98, 240)), (66, 66, (64, 128, 255)), (-64, -30, (40, 225, 115))]:
    part(crystals, "Base", (6, 1.4, 6), (cx, S + 0.7, cz), (110, 112, 124), top="Studs", rot=ry(20))
    for k, (ox, oz, h, tilt_) in enumerate([(0, 0, 9, 0), (1.8, 1.2, 6, 18), (-1.6, 1.4, 5, -20), (0.4, -1.8, 6.5, 14)]):
        r_ = mul(ry(k * 40), rz(tilt_))
        part(crystals, "Crystal", (1.8, h, 1.8), (cx + ox, S + 1.4 + h / 2 - 0.5, cz + oz), color, "Neon", rot=r_, shadow=False)
    glow = part(crystals, "Glow", (0.4, 0.4, 0.4), (cx, S + 5, cz), color, "Neon", transparency=1, collide=False, shadow=False)
    light(glow, color, 16, 1.4)

# --- Забор по краю острова + невидимые стены
fence = folder(game_map, "Fence", "Model")
EDGE = ISLAND - 3
posts = [i * 12 - 138 for i in range(24)]
for side in range(4):
    for i, t in enumerate(posts):
        if side == 0:
            x, z = t, EDGE
        elif side == 1:
            x, z = t, -EDGE
        elif side == 2:
            x, z = EDGE, t
        else:
            x, z = -EDGE, t
        part(fence, "FencePost", (1.6, 5, 1.6), (x, S + 2.5, z), WHITE, top="Studs")
        if i < len(posts) - 1:
            mid = t + 6
            for ry_ in (2.0, 3.9):
                if side < 2:
                    part(fence, "Rail", (10.4, 0.7, 0.7), (mid, S + ry_, z), WHITE)
                else:
                    part(fence, "Rail", (0.7, 0.7, 10.4), (x, S + ry_, mid), WHITE)
for x, z, sx, sz in [(0, ISLAND, 2 * ISLAND, 2), (0, -ISLAND, 2 * ISLAND, 2), (ISLAND, 0, 2, 2 * ISLAND), (-ISLAND, 0, 2, 2 * ISLAND)]:
    part(fence, "InvisibleWall", (sx, 60, sz), (x, S + 30, z), WHITE, transparency=1, shadow=False)

# --- Небо: облака и парящие острова
sky = folder(game_map, "SkyDecor", "Model")
for i in range(16):
    a = (i / 16) * math.tau + random.uniform(-0.15, 0.15)
    r = random.uniform(310, 520)
    cx, cz, cy = math.cos(a) * r, math.sin(a) * r, S + random.uniform(-110, 50)
    for _ in range(random.randint(3, 6)):
        part(sky, "Cloud", (random.uniform(18, 46), random.uniform(8, 14), random.uniform(14, 30)),
             (cx + random.uniform(-22, 22), cy + random.uniform(-4, 6), cz + random.uniform(-14, 14)),
             (255, 255, 255), "SmoothPlastic", transparency=0.08, collide=False, shadow=False)

for a_deg, dist, dy in [(35, 270, 6), (150, 300, -34), (265, 262, 24), (318, 360, -60)]:
    a = math.radians(a_deg)
    ix_, iz_ = math.cos(a) * dist, math.sin(a) * dist
    top_y = S + dy
    part(sky, "IsleGrass", (34, 3, 34), (ix_, top_y - 1.5, iz_), GREEN_A, top="Studs")
    part(sky, "IsleDirt", (30, 9, 30), (ix_, top_y - 7.5, iz_), DIRT, sides="Inlet")
    part(sky, "IsleStone", (20, 9, 20), (ix_, top_y - 16.5, iz_), (124, 125, 136), sides="Inlet")
    part(sky, "IsleTip", (10, 9, 10), (ix_, top_y - 25.5, iz_), (108, 109, 120), sides="Inlet")
    gem = part(sky, "IsleCrystal", (3, 6, 3), (ix_ + 9, top_y + 3, iz_ - 8), random.choice([(64, 128, 255), (176, 98, 240), (40, 225, 115)]), "Neon",
               rot=mul(ry(30), rz(12)), shadow=False)
    tree(sky, ix_ - 4, iz_ + 4, 0.8, top_y)

# ---------------------------------------------------------------- СЕРВИСЫ И СКРИПТЫ
lighting = Inst("Lighting", "Lighting", [
    ("string", "TimeOfDay", "14:18:00"),
    ("float", "Brightness", 2.6),
    ("Color3", "Ambient", (105, 105, 118)),
    ("Color3", "OutdoorAmbient", (150, 152, 165)),
    ("bool", "GlobalShadows", True),
    ("token", "Technology", 3),
    ("float", "EnvironmentDiffuseScale", 1.0),
    ("float", "EnvironmentSpecularScale", 0.6),
    ("float", "GeographicLatitude", 28.0),
    ("float", "ExposureCompensation", 0.1),
])


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def script_item(path):
    base = os.path.basename(path)
    if base.endswith(".server.luau"):
        cls, name = "Script", base[: -len(".server.luau")]
    elif base.endswith(".client.luau"):
        cls, name = "LocalScript", base[: -len(".client.luau")]
    else:
        cls, name = "ModuleScript", base[: -len(".luau")]
    props = [("ProtectedString", "Source", read(path))]
    if cls == "Script":
        props.append(("token", "RunContext", 0))
    if cls in ("Script", "LocalScript"):
        props.append(("bool", "Disabled", False))
    return Inst(cls, name, props)


def script_folder(name, directory):
    f = Inst("Folder", name)
    for file in sorted(os.listdir(directory)):
        if file.endswith(".luau"):
            f.add(script_item(os.path.join(directory, file)))
    return f


replicated = Inst("ReplicatedStorage", "ReplicatedStorage")
replicated.add(script_folder("Shared", os.path.join(SRC, "shared")))
server_scripts = Inst("ServerScriptService", "ServerScriptService")
server_scripts.add(script_folder("Server", os.path.join(SRC, "server")))
starter_player = Inst("StarterPlayer", "StarterPlayer", [
    ("float", "CameraMaxZoomDistance", 90.0),
    ("float", "CharacterWalkSpeed", 20.0),
])
player_scripts = starter_player.add(Inst("StarterPlayerScripts", "StarterPlayerScripts"))
player_scripts.add(script_folder("Client", os.path.join(SRC, "client")))
starter_gui = Inst("StarterGui", "StarterGui")

# ---------------------------------------------------------------- XML
def esc(text):
    return (str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def num(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    s = "%.6f" % v
    s = s.rstrip("0").rstrip(".")
    return s if s not in ("", "-0") else "0"


def prop_xml(kind, name, value):
    if kind == "string":
        return '<string name="%s">%s</string>' % (name, esc(value))
    if kind == "bool":
        return '<bool name="%s">%s</bool>' % (name, "true" if value else "false")
    if kind in ("float", "int", "token"):
        return '<%s name="%s">%s</%s>' % (kind, name, num(value), kind)
    if kind == "Vector3":
        return '<Vector3 name="%s"><X>%s</X><Y>%s</Y><Z>%s</Z></Vector3>' % (name, num(value[0]), num(value[1]), num(value[2]))
    if kind == "CoordinateFrame":
        pos, rot = value
        r = "".join("<R%d%d>%s</R%d%d>" % (i, j, num(rot[i][j]), i, j) for i in range(3) for j in range(3))
        return '<CoordinateFrame name="%s"><X>%s</X><Y>%s</Y><Z>%s</Z>%s</CoordinateFrame>' % (name, num(pos[0]), num(pos[1]), num(pos[2]), r)
    if kind == "Color3uint8":
        r, g, b = value
        return '<Color3uint8 name="%s">%d</Color3uint8>' % (name, 0xFF000000 | (r << 16) | (g << 8) | b)
    if kind == "Color3":
        r, g, b = value
        return '<Color3 name="%s"><R>%s</R><G>%s</G><B>%s</B></Color3>' % (name, num(r / 255), num(g / 255), num(b / 255))
    if kind == "Ref":
        return '<Ref name="%s">%s</Ref>' % (name, value)
    if kind == "ProtectedString":
        safe = value.replace("]]>", "]]]]><![CDATA[>")
        return '<ProtectedString name="%s"><![CDATA[%s]]></ProtectedString>' % (name, safe)
    raise ValueError(kind)


def item_xml(inst, out, depth=0):
    pad_ = "  " * depth
    out.append('%s<Item class="%s" referent="%s">' % (pad_, inst.cls, inst.ref))
    out.append("%s  <Properties>" % pad_)
    out.append("%s    %s" % (pad_, prop_xml("string", "Name", inst.name)))
    for kind, name, value in inst.props:
        out.append("%s    %s" % (pad_, prop_xml(kind, name, value)))
    out.append("%s  </Properties>" % pad_)
    for child in inst.children:
        item_xml(child, out, depth + 1)
    out.append("%s</Item>" % pad_)


def build():
    os.makedirs(OUT, exist_ok=True)
    out = [
        '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">',
        '  <Meta name="ExplicitAutoJoints">true</Meta>',
        "  <External>null</External>",
        "  <External>nil</External>",
    ]
    for service in (workspace, lighting, replicated, server_scripts, starter_player, starter_gui):
        item_xml(service, out, 1)
    out.append("</roblox>")
    place = os.path.join(OUT, "DigDeeper.rbxlx")
    with open(place, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    with open(os.path.join(OUT, "map_preview.json"), "w", encoding="utf-8") as f:
        json.dump({"surfaceY": S, "parts": PREVIEW}, f, separators=(",", ":"))
    # отдельная модель карты — для тех, кто работает через Rojo
    model = [out[0], "  <External>null</External>", "  <External>nil</External>"]
    item_xml(game_map, model, 1)
    model.append("</roblox>")
    with open(os.path.join(OUT, "Map.rbxmx"), "w", encoding="utf-8") as f:
        f.write("\n".join(model) + "\n")
    print("Готово: %s  (%d деталей карты, %.1f МБ)" % (place, len(PREVIEW), os.path.getsize(place) / 1e6))


if __name__ == "__main__":
    build()
