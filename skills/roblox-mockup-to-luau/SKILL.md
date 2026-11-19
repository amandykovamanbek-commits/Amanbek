---
name: roblox-mockup-to-luau
description: Turn a picture of a game interface (screenshot from another game, Figma export, phone photo of a paper sketch, hand-drawn wireframe) into working Roblox Luau code that the user pastes into Roblox Studio — a client script that builds the GUI in code, a server script that owns rewards/purchases, a shared config module, and a short install guide saying exactly where each script goes. Use this skill whenever the user shows an image of a menu, HUD, shop, inventory, daily-reward window, result screen, dialog or any game UI and wants it in Roblox, even if they only say "сделай так же в роблоксе", "переведи это в Luau", "make this UI in Studio" or "вот набросок, напиши код".
---

# Roblox mockup → Luau

The user gives you a picture of an interface. You hand back scripts they can paste into Roblox Studio and press Play, and the screen looks and behaves like the picture, on a phone first.

The person on the other side is often a young or beginner developer. They copy files into Studio one by one. So the result has to work with zero edits, say plainly where every script goes, and never rely on assets, plugins or packages they don't have.

## Workflow

### 1. Read the image like a spec

Look at the picture carefully before writing code. Write a short inventory (in the user's language) of what you see:

- **Regions**: window/panel, header, tabs, grid, footer buttons, HUD corners.
- **Elements**: each label, button, card, icon, counter, progress bar, timer, with its text exactly as drawn.
- **States**: done / current / locked / owned / disabled / selected. A sketch often shows them with hatching, a red outline, a checkmark, greyed text.
- **Annotations**: handwritten notes and arrows on a sketch are requirements, not decoration ("серая, если уже забрал" means a disabled state). Each one must turn into behavior.
- **Data**: numbers, prices, reward amounts, names. Put them into the config, not into the UI code.
- **Style**: approximate colors (pick RGB values from the image), corner roundness, outlines, gradients, the font mood (rounded/cartoon → `Enum.Font.FredokaOne` or `GothamBold`; plain → `Gotham`/`BuilderSans`).

If something is ambiguous, pick the most likely reading, build it, and list it under "Assumptions" in the guide. Ask a question only when a wrong guess would make the whole result useless.

Things in the picture that belong to Roblox itself (the menu and chat buttons in the top-left, thumbstick, jump button, leaderboard) are not yours to build. Leave them out and keep your UI clear of them.

### 2. Decide what is client and what is server

The picture shows only the client. Any time the UI gives the player something (coins, items, rewards, a purchase, a claim), the real decision lives on the server, because exploiters can fire any client code they like. A button press is a *request*; the server checks it, changes the value, and tells the client.

- Client: build the GUI, animate, send requests, render the state the server sends.
- Server: validate (does the player have enough? already claimed? cooldown passed? item exists?), change values, reply. Rate-limit each remote per player.
- Shared config (ModuleScript in ReplicatedStorage): prices, rewards, item lists, colors. Both sides read the same numbers, and the server never trusts numbers sent by the client — the client sends only an id.

Purely visual screens (e.g. a results screen with "Play again"/"Lobby") still need a server side if a button changes game state (teleport, respawn, start a round), and a way for the server to open the screen with real data. Provide a clearly marked test trigger so the user can see it working without the rest of their game.

Keep player values as `leaderstats` IntValues (visible in the player list, beginner-friendly) or Player attributes. Saving between sessions is a separate task: say so in the guide and suggest DataStore/ProfileStore (`roblox-data` skill) rather than half-building it.

### 3. Build the GUI in code

Build every instance with `Instance.new` from a LocalScript. The user can paste text, but they can't paste a `.rbxm`, and a code-built GUI has no hidden properties to get wrong.

Use a small helper so the code stays readable:

```luau
local function make(className: string, props: {[string]: any}, children: {Instance}?): Instance
	local inst = Instance.new(className)
	for key, value in props do
		if key ~= "Parent" then
			(inst :: any)[key] = value
		end
	end
	for _, child in children or {} do
		child.Parent = inst
	end
	if props.Parent then
		inst.Parent = props.Parent -- parent last: faster and avoids half-built frames showing
	end
	return inst
end
```

Layout rules (these are what make it survive a phone screen):

- `ScreenGui` with `ResetOnSpawn = false`, `ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets`, a deliberate `DisplayOrder`, `ZIndexBehavior = Sibling`.
- Windows: `AnchorPoint` 0.5,0.5, `Size` in scale, plus `UISizeConstraint` (min so it is usable, max so it isn't huge on PC) and `UIAspectRatioConstraint` when the picture has a fixed shape.
- Repeated things (cards, tabs, rows, day slots) go in a container with `UIListLayout` or `UIGridLayout` and `UIPadding`, created in a loop from the config. Never hand-position seven identical cards.
- Text: `TextScaled = true` with a `UITextSizeConstraint` (MaxTextSize so titles don't explode on PC, MinTextSize ≥ 10 so it stays readable), or a fixed `TextSize` in a bounded box.
- Styling: `UICorner`, `UIStroke` (use `ApplyStrokeMode = Border` on buttons/frames), `UIGradient` to match the picture.
- Icons: use the emoji or symbol from the picture as text in a `TextLabel` so it works without uploading images. Add a comment showing where to switch to an `ImageLabel` with their own `rbxassetid://`.
- Buttons: `TextButton`/`ImageButton` with `Activated` (works for mouse, touch and gamepad), `AutoButtonColor` or a short press tween, `Selectable = true`.
- Open/close: tween in with `TweenService` (scale via `UIScale` + `GroupTransparency` on a `CanvasGroup`, ~0.2 s). Close on the X button and on gamepad B / keyboard Esc via `ContextActionService` bound only while open. Set `GuiService.SelectedObject` on open when a gamepad is in use, clear it on close.
- A HUD button or test key to open the window, placed clear of the jump button (bottom-right) and the thumbstick (bottom-left).

Do not use deprecated APIs: `wait`/`spawn`/`delay` → `task.*`; `TweenPosition/TweenSize` → `TweenService`; `Draggable`; `BackgroundColor`/`BorderColor` → `*Color3`; `FontSize`.

### 4. Wire the states

Every state from the inventory needs code that renders it from data, in one `render()` / `update()` function, so the UI can be redrawn whenever the server sends new state:

- owned / claimed → disabled look + `Active = false` + different text
- current / selected → outline or highlight from the picture
- locked / not affordable → greyed, and the button explains why
- waiting for the server → busy text or spinner, button disabled, so double taps can't send twice
- timers → computed from a server timestamp (`os.time()` on the server, sent to the client), updated with a loop that stops when the window closes

### 5. Write the files

Write each script as its own file in an output folder, named after the Studio object, with the type in the extension so it is obvious:

```
<Feature>Config.module.luau      -- ReplicatedStorage
<Feature>Server.server.luau      -- ServerScriptService
<Feature>UI.client.luau          -- StarterPlayer > StarterPlayerScripts
README.md                        -- install guide
```

The first lines of every file say where it goes and what type of object to create:

```luau
--[[
	ShopUI — LocalScript
	Место: StarterPlayer > StarterPlayerScripts
	Что делает: строит окно магазина и отправляет запросы на покупку серверу.
]]
```

Create RemoteEvents from the server script into a folder in ReplicatedStorage (`Remotes/<Feature>`), and have the client `WaitForChild` them. Then the user never has to make remotes by hand, and there's nothing to misname.

Write comments in the user's language, short and useful: what a block does and what to change to customize it (prices, colors, texts are in the config).

### 6. The install guide (README.md)

In the user's language, short:

1. **What you get** — one line per file.
2. **How to install** — numbered steps in Studio terms: "In Explorer, right-click ServerScriptService → Insert Object → Script, rename it to `ShopServer`, paste the contents of `ShopServer.server.luau`." Do this for every file. Mention that the ModuleScript name must match exactly.
3. **How to test** — press Play, what to tap, what should happen. Include the test trigger (key, chat command or HUD button) and how to give yourself currency for testing.
4. **How to customize** — which config fields change prices, rewards, colors, texts.
5. **Assumptions** — what you guessed from the picture.
6. **Not included** — e.g. saving data, real Robux purchases (`MarketplaceService`, `ProcessReceipt`) — with a pointer to the right next step.

### 7. Check before handing over

Read your own code once as if you were Studio:

- Every `WaitForChild` name matches what the server creates; every config key the client reads exists.
- No client code changes currency/items; every remote handler on the server validates type and range of each argument and has a per-player cooldown.
- Every element and every annotation from step 1 appears in the UI; texts match the picture.
- The window fits an 844×390 phone screen: nothing sized in raw pixels without a scale-based parent, nothing under the jump button.
- No deprecated API, no `rbxassetid` the user doesn't have, no external modules.
- Luau syntax: `local function`, `:Connect`, `~=`, string concat with `..`, 1-based loops, no `+=` on table fields that may be nil.

## Output summary for the chat

After writing the files, reply briefly in the user's language: the file list, the three most important install steps, and anything you assumed. The detail lives in README.md.
