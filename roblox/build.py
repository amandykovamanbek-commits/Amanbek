#!/usr/bin/env python3
"""Собирает WingsAndBrainrots.rbxlx из папки src/.

Правила (как у Rojo):
  src/<Сервис>/...          -> сервис Roblox (ServerScriptService, ReplicatedStorage, StarterPlayer)
  папка                     -> Folder (кроме StarterPlayerScripts / StarterCharacterScripts)
  *.server.lua              -> Script
  *.client.lua              -> LocalScript
  *.lua                     -> ModuleScript

Запуск:  python3 build.py
"""
import os
import sys
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "WingsAndBrainrots.rbxlx")

SERVICES = {"ServerScriptService", "ReplicatedStorage", "StarterPlayer", "StarterGui", "Workspace", "Lighting"}
NESTED_SERVICES = {"StarterPlayerScripts", "StarterCharacterScripts"}

_ref = 0


def ref():
    global _ref
    _ref += 1
    return "RBX%08d" % _ref


def name_prop(name):
    return '<string name="Name">%s</string>' % escape(name)


def script_item(path, filename):
    if filename.endswith(".server.lua"):
        cls, name = "Script", filename[: -len(".server.lua")]
    elif filename.endswith(".client.lua"):
        cls, name = "LocalScript", filename[: -len(".client.lua")]
    else:
        cls, name = "ModuleScript", filename[: -len(".lua")]
    with open(path, encoding="utf-8") as f:
        source = f.read()
    if "]]>" in source:
        sys.exit("В %s есть ']]>' — это ломает CDATA" % path)
    props = [name_prop(name), '<ProtectedString name="Source"><![CDATA[%s]]></ProtectedString>' % source]
    if cls != "ModuleScript":
        props.append('<bool name="Disabled">false</bool>')
    return '<Item class="%s" referent="%s"><Properties>%s</Properties></Item>' % (cls, ref(), "".join(props))


def dir_item(path, name, cls):
    children = []
    for entry in sorted(os.listdir(path)):
        full = os.path.join(path, entry)
        if os.path.isdir(full):
            child_cls = entry if entry in NESTED_SERVICES else "Folder"
            children.append(dir_item(full, entry, child_cls))
        elif entry.endswith(".lua"):
            children.append(script_item(full, entry))
    extra = ""
    if cls == "Workspace":
        # без стриминга: дальние острова видны сразу
        extra = '<bool name="StreamingEnabled">false</bool>'
    return '<Item class="%s" referent="%s"><Properties>%s%s</Properties>%s</Item>' % (
        cls,
        ref(),
        name_prop(name),
        extra,
        "".join(children),
    )


def main():
    items = []
    present = set()
    for entry in sorted(os.listdir(SRC)):
        full = os.path.join(SRC, entry)
        if os.path.isdir(full) and entry in SERVICES:
            present.add(entry)
            items.append(dir_item(full, entry, entry))
    if "Workspace" not in present:
        items.insert(0, '<Item class="Workspace" referent="%s"><Properties>%s<bool name="StreamingEnabled">false</bool></Properties></Item>' % (ref(), name_prop("Workspace")))
    xml = (
        '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">'
        "<Meta name=\"ExplicitAutoJoints\">true</Meta>"
        + "".join(items)
        + "</roblox>"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(xml)
    print("Собрано:", OUT)


if __name__ == "__main__":
    main()
