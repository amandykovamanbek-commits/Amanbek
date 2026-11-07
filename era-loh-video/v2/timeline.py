#!/usr/bin/env python3
"""Single source of truth for the film: scenes, voice cues, SFX events.
Writes build/data.js (picture + sfx.js events) and build/voices.json (for the mixer).
Usage: python3 timeline.py VOICE_DIR OUT_DIR"""
import json, sys, wave, os
import numpy as np

VD, OUT = sys.argv[1], sys.argv[2]
FPS_ENV = 60

def load(name):
    with wave.open(os.path.join(VD, name + ".wav")) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        sr = w.getframerate()
    return x, sr

def analyse(name):
    x, sr = load(name)
    hop = sr // FPS_ENV
    n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    env = np.clip(rms / (rms.max() + 1e-9), 0, 1) ** 0.6
    voiced = np.where(rms > rms.max() * 0.12)[0]
    on = voiced[0] / FPS_ENV if len(voiced) else 0
    off = (voiced[-1] + 1) / FPS_ENV if len(voiced) else len(x) / sr
    return dict(dur=len(x) / sr, env=[round(float(v), 2) for v in env], on=on, off=off)

def words(text, on, off):
    ws = text.split()
    total = sum(len(w) + 2 for w in ws)
    t, out = on, []
    for w in ws:
        d = (off - on) * (len(w) + 2) / total
        out.append([round(t, 3), w]); t += d
    return out

def chunks(ws, n=2):
    """subtitle chunks of 1–3 words, each shown from its first word's time"""
    out, i = [], 0
    while i < len(ws):
        k = 3 if (i + 3 <= len(ws) and sum(len(w[1]) for w in ws[i:i + 3]) <= 16) else min(n, len(ws) - i)
        out.append([ws[i][0], " ".join(w[1] for w in ws[i:i + k])]); i += k
    return out

SC = [
    dict(kind="street", db=70,  dur=3.6, label="ОБЫЧНЫЙ РАЗГОВОР", cap="Ера стоит в 20 метрах. Не оборачивается.",
         line=dict(who="walker", file="v_who", at=1.55, text="А кто такой Ера вообще?", color="#8FB0D8")),
    dict(kind="street", db=80,  dur=3.0, label="ГРОМКИЙ ОКЛИК", cap="Ера листает ленту."),
    dict(kind="street", db=90,  dur=3.2, label="ГАЗОНОКОСИЛКА", cap="Голуби разлетелись. Ера — нет."),
    dict(kind="street", db=110, dur=4.0, label="РОК-КОНЦЕРТ", cap="Бабушка из окна ругается.",
         line=dict(who="grandma", file="v_grandma", at=1.0, text="Молодой человек, ну потише! Люди спят!", color="#B58CFF")),
    dict(kind="street", db=150, dur=3.4, label="РАЗРЫВ ПЕРЕПОНОК", cap="Прохожие затыкают уши.",
         line=dict(who="walker", file="v_woman", at=1.5, text="Да поняли мы, поняли!", color="#FF8FC8")),
    dict(kind="street", db=180, dur=3.2, label="СТАРТ РАКЕТЫ", cap="Асфальт трескается. Ера дочитывает пост."),
    dict(kind="street", db=200, dur=3.6, label="ПРЕДЕЛ ПРОЙДЕН", cap="Это уже не звук. Это ударная волна.",
         line=dict(who="walker", file="v_agree", at=1.7, text="Полностью согласен!", color="#F5C842")),
    dict(kind="map",   db=220, dur=3.4, label="ИЗВЕРЖЕНИЕ ВУЛКАНА", cap="Весь город узнал, что Ера лох."),
    dict(kind="earth", db=250, dur=3.0, label="КАК КРАКАТАУ, 1883", cap="Слышно на другом конце Земли.", mode=0),
    dict(kind="earth", db=290, dur=3.0, label="ЗА ПРЕДЕЛАМИ ШКАЛЫ", cap="Интернет падает во всём мире.", mode=1),
    dict(kind="earth", db=340, dur=3.2, label="ВЗРЫВ ЗВЕЗДЫ", cap="Гравитация еле держит Землю.", mode=2),
    dict(kind="space", db=0,   dur=10.2, label="ЗВУК НЕ ЛЕТИТ В КОСМОСЕ", cap="В космосе твоё «Ера лох» никто не услышит.",
         line=dict(who="yera", file="v_yera", at=5.3, text="Ты чё орёшь?! Я тебя с первого раза услышал!", color="#7CE0A0")),
]
SHOUT_AT = 0.35
SPACE = dict(shout=0.55, call=3.4, answer=5.05, hit=8.75, part2=9.0)

t = 0.0
voices, events = [], []
for i, s in enumerate(SC):
    s["n"] = i + 1; s["t0"] = round(t, 4)
    lvl = [0, .08, .16, .3, .48, .64, .78, .86, .9, .95, 1, 1][i]
    s["lvl"] = lvl
    hf = f"h{i + 1}" if i < 11 else "h12"
    sh_at = SHOUT_AT if i < 11 else SPACE["shout"]
    a = analyse(hf)
    s["shout"] = dict(at=sh_at, file=hf, dur=a["dur"], on=a["on"], off=a["off"], env=a["env"])
    voices.append(dict(file=hf, t=t + sh_at, gain=0.25 if i == 11 else 1.0))
    if "line" in s:
        L = s["line"]; b = analyse(L["file"])
        L.update(dur=b["dur"], env=b["env"], on=b["on"], off=b["off"])
        L["words"] = words(L["text"], b["on"], b["off"])
        L["subs"] = chunks(L["words"])
        voices.append(dict(file=L["file"], t=t + L["at"], gain=1.0))
    # ---- SFX (sfx.js names) — times are absolute
    T = t
    if i < 11:
        events.append([round(T + sh_at - 0.25, 3), "riser", {"dur": 0.3, "gain": 0.25 + lvl * 0.5}])
        if lvl > 0.4: events.append([round(T + sh_at + 0.02, 3), "impact", {"size": 0.8 + lvl * 1.6, "gain": 0.4 + lvl * 0.6}])
        events.append([round(T + sh_at + 0.05, 3), "whoosh", {"dur": 0.6 + lvl * 0.6, "size": 1 + lvl, "gain": 0.35 + lvl * 0.4, "pan": [-0.6, 0.6]}])
        events.append([round(T + 0.02, 3), "pop", {"pitch": 1.2, "gain": 0.35}])           # header plate pop-in
        for k in range(min(6, 2 + i // 2)):                                                 # dB counter ticks
            events.append([round(T + 0.05 + k * 0.07, 3), "tick", {"gain": 0.5}])
    if s["kind"] == "street" and i > 0:
        events.append([round(T - 0.05, 3), "swish", {"gain": 0.5}])                       # wave wipe
    if i == 2:
        for k in range(6): events.append([round(T + sh_at + 0.1 + k * 0.09, 3), "paper", {"dur": 0.12, "gain": 0.5, "pan": -0.3 + k * 0.12}])
    if i == 3:
        events.append([round(T + 0.8, 3), "click", {"gain": 0.6}]); events.append([round(T + 0.85, 3), "fold", {"gain": 0.4}])  # window opens
    if i == 4:
        events.append([round(T + sh_at + 0.3, 3), "glitch", {"dur": 0.3, "gain": 0.3}])   # ear ringing feel
        events.append([round(T + sh_at + 0.2, 3), "chime", {"freq": 3800, "gain": 0.12}])
    if i in (5, 6):
        events.append([round(T + sh_at + 0.1, 3), "tear", {"dur": 0.6, "gain": 0.8}])
        events.append([round(T + sh_at + 0.12, 3), "thud", {"gain": 0.8}])
    if i == 7:
        events.append([round(T + 0.0, 3), "reverse", {"dur": 0.5, "gain": 0.6}])
        for k in range(10): events.append([round(T + sh_at + 0.4 + k * 0.17, 3), "bubble", {"gain": 0.35, "pan": -0.8 + k * 0.16}])
    if i == 8:
        events.append([round(T + 0.0, 3), "downer", {"dur": 0.7, "gain": 0.6}])
        events.append([round(T + sh_at + 0.1, 3), "drone", {"dur": 2.4, "note": "D", "gain": 0.6}])
    if i == 9:
        events.append([round(T + 0.0, 3), "impact", {"size": 1.4, "gain": 0.7}])
        for k in range(8): events.append([round(T + sh_at + 0.3 + k * 0.18, 3), "glitch", {"dur": 0.1, "gain": 0.35}])
    if i == 10:
        events.append([round(T + 0.0, 3), "impact", {"size": 1.8, "gain": 0.8}])
        events.append([round(T + sh_at + 0.2, 3), "riser", {"dur": 2.2, "gain": 0.7}])
        events.append([round(T + sh_at + 0.1, 3), "heartbeat", {"n": 2, "gain": 0.8}])
    if i == 11:
        events.append([round(T + 0.0, 3), "impact", {"size": 2.2, "gain": 1.0}])            # explosion → hard silence after
        events.append([round(T + 1.2, 3), "drone", {"dur": 7.0, "note": "A", "gain": 0.35}])
        for k in range(4):                                                                   # ringtone
            tt = T + SPACE["call"] + 0.05 + k * 0.42
            events.append([round(tt, 3), "chime", {"freq": 1318, "gain": 0.45}])
            events.append([round(tt + 0.16, 3), "chime", {"freq": 1046, "gain": 0.45}])
        events.append([round(T + SPACE["call"], 3), "whoosh", {"dur": 0.4, "gain": 0.5}])
        events.append([round(T + SPACE["answer"], 3), "click", {"gain": 0.9}])
        events.append([round(T + SPACE["hit"], 3), "impact", {"size": 2.4, "gain": 1.2}])     # payoff: loudest hit
        events.append([round(T + SPACE["part2"], 3), "pop", {"pitch": 0.8, "gain": 0.7}])
    t += s["dur"]
TOTAL = round(t, 4)

data = dict(SC=SC, TOTAL=TOTAL, SPACE=SPACE, EVENTS=sorted(events, key=lambda e: e[0]),
            BED=dict(bpm=112, key="D", mood="tense", db=-15, end=SC[11]["t0"] - 0.05))
os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "data.js"), "w") as f:
    f.write("window.DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
with open(os.path.join(OUT, "voices.json"), "w") as f:
    json.dump(dict(voices=voices, TOTAL=TOTAL), f)
print("TOTAL", TOTAL, "events", len(events))
