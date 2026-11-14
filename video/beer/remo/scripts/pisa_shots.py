# shots.json for scripts/short_qa.py: shot ranges, crossfade windows, the flash, cuts inside shots and kicks,
# computed from words.json exactly like story.ts (CUT = word onset - 3 frames).
import json, sys
words = json.load(open("src/videos/pisa/words.json", encoding="utf-8"))
W = lambda i: round(words[i]["s"] * 30)
CUT = lambda i: W(i) - 3
B = [0] + [CUT(i) for i in (8, 16, 27, 38, 45, 53, 62, 71, 80, 90, 97, 109, 119, 125, 139, 153, 161, 172)] + [2090]
shots = [{"id": i + 1, "a": B[i], "b": B[i + 1]} for i in range(19)]
XF = {5: 10, 8: 8, 10: 8, 15: 8, 16: 8, 19: 10}
xfade = [[B[k - 1] - v // 2, B[k - 1] + v // 2] for k, v in XF.items()]
cuts = [[W(i) - d, W(i) - d] for i, d in ((6, 6), (25, 5), (61, 5), (69, 5), (78, 7), (89, 5), (101, 5), (116, 6), (150, 5), (167, 5))]
kicks = [[W(i), W(i) + 8] for i in (25, 78, 116, 69, 185, 152)]
json.dump({"shots": shots, "xfade": xfade, "flash": [B[1] - 3, B[1] + 1], "planned": cuts + kicks}, open(sys.argv[1], "w"), indent=1)
print(B)
