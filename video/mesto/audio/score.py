"""Original score for «Твоё место за столом», written against the picture in absolute seconds.
Writes score.mid (main score) and tv.mid (muffled festive tune heard inside dad's video)."""
import mido, sys, os
from mido import MidiFile, MidiTrack, Message, MetaMessage

PPQ = 960  # with tempo 60 bpm: 960 ticks = 1 second
NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def n(s):
    s = s.strip(); p = NAMES[s[0]]; i = 1
    while i < len(s) and s[i] in '#b': p += 1 if s[i] == '#' else -1; i += 1
    return p + 12 * (int(s[i:]) + 1)

class Score:
    def __init__(self): self.ev = []
    def prog(self, ch, p, t=0.0): self.ev.append((t, 0, Message('program_change', channel=ch, program=p)))
    def cc(self, ch, c, v, t): self.ev.append((t, 1, Message('control_change', channel=ch, control=c, value=int(max(0, min(127, v))))))
    def note(self, ch, t, dur, pitch, vel=80):
        if isinstance(pitch, str): pitch = n(pitch)
        self.ev.append((t, 3, Message('note_on', channel=ch, note=pitch, velocity=int(max(1, min(127, vel))))))
        self.ev.append((t + dur, 2, Message('note_off', channel=ch, note=pitch, velocity=0)))
    def chord(self, ch, t, dur, pitches, vel=70):
        for p in pitches.split(): self.note(ch, t, dur, p, vel)
    def ramp(self, ch, c, t0, t1, v0, v1, steps=None):
        steps = steps or max(2, int((t1 - t0) * 20))
        for i in range(steps + 1):
            u = i / steps; self.cc(ch, c, v0 + (v1 - v0) * u, t0 + (t1 - t0) * u)
    def save(self, path):
        mf = MidiFile(ticks_per_beat=PPQ); tr = MidiTrack(); mf.tracks.append(tr)
        tr.append(MetaMessage('set_tempo', tempo=mido.bpm2tempo(60), time=0))
        last = 0
        for t, pri, m in sorted(self.ev, key=lambda e: (e[0], e[1])):
            tick = int(round(t * PPQ)); m = m.copy(time=max(0, tick - last)); last = max(last, tick); tr.append(m)
        tr.append(MetaMessage('end_of_track', time=PPQ)); mf.save(path)

S = Score()
PIANO, STR, SLOW, LOW, CEL, HARP, CHOIR, HORN, BELL, DR, TIMP, BRASS, VLN, PIZZ = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
for ch, p in [(PIANO, 0), (STR, 48), (SLOW, 49), (LOW, 42), (CEL, 8), (HARP, 46), (CHOIR, 52), (HORN, 60), (BELL, 14), (TIMP, 47), (BRASS, 61), (VLN, 40), (PIZZ, 45)]:
    S.prog(ch, p)
for ch in range(16):
    if ch == DR: continue
    S.cc(ch, 7, 100, 0); S.cc(ch, 11, 0 if ch in (STR, SLOW, LOW, CHOIR, HORN, BRASS, VLN) else 110, 0)
    S.cc(ch, 91, 95, 0); S.cc(ch, 93, 10, 0)
S.cc(PIANO, 91, 110, 0); S.cc(PIANO, 11, 118, 0)
for ch, pan in [(STR, 50), (SLOW, 72), (LOW, 58), (CEL, 84), (HARP, 40), (CHOIR, 64), (HORN, 74), (BELL, 64), (TIMP, 64), (BRASS, 58), (VLN, 44), (PIZZ, 70)]:
    S.cc(ch, 10, pan, 0)

# ---------- A: city -> laptop -> typing (0-12.6): a barely-there string pad ----------
S.chord(LOW, 0.3, 4.9, 'A2', 60); S.chord(STR, 0.3, 4.9, 'E3 A3 C4 E4', 55)
S.chord(LOW, 5.1, 4.0, 'F2', 58); S.chord(STR, 5.1, 4.0, 'A3 C4 E4', 52)
S.chord(LOW, 9.1, 3.6, 'D2', 55); S.chord(STR, 9.1, 3.6, 'F3 A3 E4', 50)
S.ramp(STR, 11, 0.3, 3.5, 0, 48); S.ramp(STR, 11, 3.5, 9.0, 48, 40); S.ramp(STR, 11, 9.0, 12.7, 40, 0)
S.ramp(LOW, 11, 0.3, 3.5, 0, 45); S.ramp(LOW, 11, 9.0, 12.7, 45, 0)
# (13-17: silence)

# ---------- E/F: 31 December, quiet piano theme -> flashback warms (17.4-25.0, hard cut) ----------
b = 0.8
def bar_lh(t, notes, vel=46):
    for i, p in enumerate(notes.split()): S.note(PIANO, t + i * b, 3 * b - i * b + 0.3, p, vel - i * 4)
S.cc(PIANO, 64, 127, 17.3)
S.note(PIANO, 17.4, 2.35, 'E5', 62); bar_lh(17.4, 'A2 E3 C4')
S.cc(PIANO, 64, 0, 19.78); S.cc(PIANO, 64, 127, 19.82)
S.note(PIANO, 19.8, 0.78, 'D5', 60); S.note(PIANO, 20.6, 0.78, 'C5', 58); S.note(PIANO, 21.4, 0.78, 'B4', 56); bar_lh(19.8, 'G2 D3 B3', 50)
S.cc(PIANO, 64, 0, 22.18); S.cc(PIANO, 64, 127, 22.22)
S.note(PIANO, 22.2, 1.58, 'C5', 62); S.note(PIANO, 23.8, 0.78, 'A4', 56); bar_lh(22.2, 'F2 C3 A3', 50)
S.note(PIANO, 24.6, 0.4, 'G4', 58); S.chord(PIANO, 24.6, 0.4, 'E2 C4', 48)
for i, p in enumerate(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6']): S.note(HARP, 19.85 + i * 0.05, 1.6, p, 50 + i * 3)
for t, p in [(20.0, 'D6'), (20.8, 'C6'), (21.6, 'B5'), (22.4, 'C6'), (24.0, 'A5')]: S.note(CEL, t, 0.7, p, 52)
S.chord(SLOW, 19.9, 2.4, 'G3 B3 D4', 60); S.chord(SLOW, 22.2, 2.8, 'F3 A3 C4', 62)
S.ramp(SLOW, 11, 19.9, 21.0, 0, 70); S.ramp(SLOW, 11, 21.0, 24.95, 70, 80); S.cc(SLOW, 11, 0, 25.0)
S.cc(PIANO, 64, 0, 25.0)

# ---------- J: music returns as Aiko places the drawing (36.0-40.0) ----------
S.chord(SLOW, 36.0, 2.4, 'A3 C4 E4', 64); S.chord(LOW, 36.0, 2.4, 'A2', 60)
S.chord(SLOW, 38.4, 1.8, 'F3 A3 C4', 66); S.chord(LOW, 38.4, 1.8, 'F2', 60)
S.ramp(SLOW, 11, 36.0, 38.5, 0, 72); S.ramp(SLOW, 11, 38.5, 39.9, 72, 60); S.ramp(SLOW, 11, 39.9, 40.3, 60, 0)
S.ramp(LOW, 11, 36.0, 38.5, 0, 60); S.ramp(LOW, 11, 39.9, 40.3, 60, 0)
S.cc(PIANO, 64, 127, 36.5)
for t, p, v in [(36.6, 'F4', 54), (37.4, 'A4', 56), (38.2, 'C5', 60), (39.0, 'B4', 58)]: S.note(PIANO, t, 0.9, p, v)
for t, p in [(36.6, 'F2'), (37.4, 'C3'), (38.2, 'A3'), (39.0, 'E2')]: S.note(PIANO, t, 1.2, p, 42)
S.cc(PIANO, 64, 0, 40.0)
# ---------- K: one piano note on the tear ----------
S.cc(PIANO, 64, 127, 40.5); S.note(PIANO, 40.55, 3.4, 'A5', 66); S.note(PIANO, 40.55, 3.4, 'A4', 30); S.cc(PIANO, 64, 0, 44.0)
S.chord(LOW, 41.6, 2.6, 'A2', 50); S.ramp(LOW, 11, 41.6, 43.5, 0, 34); S.ramp(LOW, 11, 43.5, 44.4, 34, 0)

# ---------- L: station flashback (44-48) ----------
S.chord(SLOW, 44.0, 2.4, 'F3 A3 C4', 60); S.chord(SLOW, 46.4, 1.6, 'E3 G#3 B3', 58)
S.ramp(SLOW, 11, 44.0, 45.0, 0, 64); S.ramp(SLOW, 11, 46.8, 47.95, 64, 0)
S.cc(PIANO, 64, 127, 44.35)
for t, p, v in [(44.4, 'A4', 58), (45.2, 'B4', 56), (46.0, 'C5', 60), (46.8, 'A4', 54)]: S.note(PIANO, t, 0.9 if t < 46.8 else 1.1, p, v)
for t, p in [(44.4, 'F2'), (45.2, 'C3'), (46.0, 'A3'), (46.8, 'E2'), (47.2, 'B2')]: S.note(PIANO, t, 0.9, p, 40)
for i, p in enumerate(['A4', 'C5', 'E5', 'A5']): S.note(HARP, 44.45 + i * 0.12, 1.2, p, 44)
S.cc(PIANO, 64, 0, 47.95)

# ---------- M: 23:08 — tension (48-53) ----------
S.prog(SLOW, 44, 47.99)  # tremolo strings
S.chord(SLOW, 48.0, 5.0, 'A2 E3 A3', 70); S.chord(SLOW, 50.6, 2.4, 'Bb3', 60)
S.ramp(SLOW, 11, 48.0, 52.95, 12, 112); S.cc(SLOW, 11, 0, 53.0)
S.chord(LOW, 48.0, 5.0, 'A2', 70); S.ramp(LOW, 11, 48.0, 52.95, 0, 100); S.cc(LOW, 11, 0, 53.0)
for t, p in [(51.0, 'E5'), (51.8, 'F5'), (52.4, 'G5'), (52.75, 'A5')]: S.note(VLN, t, 0.8 if t < 52.7 else 0.24, p, 70)
S.ramp(VLN, 11, 51.0, 52.98, 40, 115); S.cc(VLN, 11, 0, 53.0)
t = 51.4
while t < 52.97:
    k = (t - 51.4) / 1.6; S.note(TIMP, t, 0.06, 'A2', int(30 + 80 * k)); t += 0.055

# ---------- N: the run (53.0-64.0) — 128 bpm ----------
q = 60 / 128; bar = 4 * q; T0 = 53.0
S.prog(SLOW, 48, 52.99)
chords = ['Am', 'F', 'C', 'G', 'Am', 'F']
OST = {'Am': 'A3 E4 A4 E4 C5 E4 A4 E4', 'F': 'F3 C4 F4 C4 A4 C4 F4 C4', 'C': 'C4 G4 C5 G4 E5 G4 C5 G4', 'G': 'G3 D4 G4 D4 B4 D4 G4 D4', 'E': 'E3 B3 E4 B3 G#4 B3 E4 B3'}
ROOT = {'Am': 'A1', 'F': 'F1', 'C': 'C2', 'G': 'G1', 'E': 'E1'}
PAD = {'Am': 'A3 C4 E4', 'F': 'F3 A3 C4', 'C': 'C4 E4 G4', 'G': 'G3 B3 D4', 'E': 'E3 G#3 B3'}
S.cc(STR, 11, 96, 53.0); S.cc(LOW, 11, 105, 53.0); S.prog(LOW, 43, 52.99)
for i, c in enumerate(chords):
    tb = T0 + i * bar
    for j, p in enumerate(OST[c].split()):
        tt = tb + j * q / 2
        if tt >= 64.0: break
        S.note(PIANO, tt, q / 2 * 0.95, p, 92 if j % 2 == 0 else 74)
    for j in range(4):
        tt = tb + j * q
        if tt >= 64.0: break
        S.note(LOW, tt, q * 0.6, ROOT[c], 100 if j == 0 else 84)
    if i >= 1: S.chord(STR, tb, min(bar, 64.0 - tb) * 0.98, PAD[c], 80 + i * 4)
# drums
for i in range(6):
    tb = T0 + i * bar
    for j in range(4):
        tt = tb + j * q
        if tt >= 64.0: continue
        if j in (0, 2): S.note(DR, tt, 0.1, 36, 112 if j == 0 else 96)
        if i >= 1 and j in (1, 3): S.note(DR, tt, 0.1, 38, 92 + i * 4)
        if i >= 2:
            for h in range(2):
                if tt + h * q / 2 < 64.0: S.note(DR, tt + h * q / 2, 0.05, 42, 60 + 20 * (h == 0))
    if i in (1, 3, 5) and tb + 3 * q < 63.9:
        for k, tom in enumerate([50, 48, 47, 45]): S.note(DR, tb + 3 * q + k * q / 4, 0.1, tom, 90 + k * 6)
    if i in (2, 4): S.note(DR, tb, 0.8, 49, 110)
S.note(DR, 53.0, 1.2, 49, 120); S.note(DR, 53.0, 0.2, 36, 127)
for tt in [53.0, 55.34, 56.75, 60.5]: S.note(TIMP, tt, 0.6, 'A2' if tt != 56.75 else 'C3', 125)
S.note(DR, 55.34, 1.0, 49, 127); S.note(DR, 55.34, 0.2, 36, 127)
# theme on violins over the run
S.prog(VLN, 48, 55.9); S.cc(VLN, 11, 104, 56.0)
mel = [(56.75, 'E5', 2), (57.69, 'D5', 1), (58.16, 'C5', 1), (58.625, 'B4', 2), (59.56, 'C5', 1), (60.03, 'A4', 1), (60.5, 'E5', 2), (61.44, 'F5', 1), (61.91, 'G5', 1), (62.375, 'A5', 3), (63.78, 'B5', 0.45)]
for tt, p, beats in mel: S.note(VLN, tt, beats * q * 0.98, p, 100)
for tt, p, beats in mel: S.note(HORN, tt, beats * q * 0.98, p[:-1] + str(int(p[-1]) - 1), 92)
S.ramp(HORN, 11, 56.5, 60.5, 60, 100)
# brass + choir swell for the taxi
for i, c in enumerate(['Am', 'F']):
    tb = T0 + (4 + i) * bar
    S.chord(BRASS, tb, min(bar, 64.0 - tb) * 0.98, PAD[c], 96); S.chord(CHOIR, tb, min(bar, 64.0 - tb) * 0.98, PAD[c], 90)
S.ramp(BRASS, 11, 60.5, 63.9, 50, 118); S.ramp(CHOIR, 11, 60.5, 63.9, 50, 115)
tt = 63.3
while tt < 63.98: S.note(DR, tt, 0.04, 38, int(70 + 55 * (tt - 63.3) / 0.68)); tt += 0.0586
for ch in (STR, LOW, BRASS, CHOIR, HORN, VLN): S.cc(ch, 11, 0, 64.0)

# ---------- Q: the reunion (71.1-75) and R: the family (75-78) ----------
for ch in (STR, SLOW, LOW, CHOIR, HORN, VLN, BRASS): S.cc(ch, 11, 0, 70.9)
S.prog(LOW, 42, 70.9); S.prog(VLN, 40, 70.9)
H = [(71.15, 'C', 'C2', 'C3 G3 C4 E4 G4'), (72.7, 'G', 'G1', 'B2 D3 G3 B3 D4'), (73.4, 'Am', 'A1', 'A2 E3 A3 C4 E4'), (74.1, 'G/B', 'B1', 'B2 D3 G3 B3 D4'),
     (75.0, 'C', 'C2', 'C3 G3 C4 E4 G4'), (76.0, 'F', 'F1', 'A2 C3 F3 A3 C4'), (77.0, 'C', 'C2', 'C3 G3 C4 E4 G4')]
for i, (tt, name, root, pad) in enumerate(H):
    end = H[i + 1][0] if i + 1 < len(H) else 78.8
    S.chord(STR, tt, end - tt, pad, 92); S.chord(LOW, tt, end - tt, root, 96)
    S.chord(CHOIR, tt, end - tt, ' '.join(pad.split()[2:]), 84)
    # piano arpeggio
    ps = pad.split()[1:] + [pad.split()[-1]]
    k, step = 0, 0.18
    a = tt
    while a < end - 0.05:
        S.note(PIANO, a, 0.5, ps[k % len(ps)], 64 if k % 4 == 0 else 52); a += step; k += 1
S.cc(PIANO, 64, 127, 71.1); S.cc(PIANO, 64, 0, 78.6)
S.ramp(STR, 11, 71.1, 71.8, 30, 112); S.ramp(STR, 11, 75.0, 78.6, 112, 0)
S.ramp(LOW, 11, 71.1, 71.8, 30, 105); S.ramp(LOW, 11, 75.0, 78.6, 105, 0)
S.ramp(CHOIR, 11, 71.3, 72.4, 0, 100); S.ramp(CHOIR, 11, 74.8, 78.2, 100, 0)
mel = [(71.3, 'E5', 1.38), (72.7, 'D5', 0.68), (73.4, 'C5', 0.68), (74.1, 'B4', 0.88), (75.0, 'C5', 1.45), (76.5, 'A4', 0.5), (77.0, 'G4', 1.5)]
S.cc(VLN, 11, 100, 71.25); S.ramp(VLN, 11, 76.0, 78.4, 100, 0)
for tt, p, d in mel: S.note(VLN, tt, d, p, 104); S.note(HORN, tt, d, p[:-1] + str(int(p[-1]) - 1), 96)
S.ramp(HORN, 11, 71.2, 71.8, 0, 104); S.ramp(HORN, 11, 75.0, 77.8, 104, 0)
t = 70.75
while t < 71.14: S.note(TIMP, t, 0.05, 'C3', int(40 + 70 * (t - 70.75) / 0.4)); t += 0.05
S.note(TIMP, 71.15, 1.0, 'C3', 127); S.note(DR, 71.15, 2.0, 49, 118); S.note(DR, 71.15, 2.0, 57, 100)
for tt in [71.6, 72.35, 73.1, 73.85, 74.6]: S.note(BELL, tt, 2.5, 'E4', 118); S.note(BELL, tt, 2.5, 'E5', 70)
for tt, p in [(71.6, 'G6'), (72.1, 'E6'), (72.5, 'C7'), (72.75, 'G6'), (73.2, 'E6'), (73.7, 'C7'), (74.1, 'D6'), (74.5, 'G6'), (74.9, 'E6')]: S.note(CEL, tt, 0.6, p, 70)
for i, p in enumerate(['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6']): S.note(HARP, 71.15 + i * 0.05, 2.0, p, 70)

# ---------- S: one piano note, then silence ----------
S.cc(PIANO, 64, 127, 78.35); S.note(PIANO, 78.45, 6.0, 'A4', 58); S.note(PIANO, 78.45, 6.0, 'A3', 34); S.cc(PIANO, 64, 0, 86.0)
S.save(os.path.join(os.path.dirname(__file__), 'score.mid'))

# ---------- the festive tune playing on the family's TV (inside dad's video) ----------
V = Score(); V.prog(0, 10); V.prog(1, 0); V.cc(0, 91, 60, 0); V.cc(1, 91, 60, 0)
beat = 0.42; t0 = 29.6
tune = 'C5 E5 G5 E5 F5 D5 B4 G4 A4 C5 E5 C5 D5 B4 G4 G4 C5 E5 G5 C6 B5 G5 F5 D5 E5 C5 A4 F4 G4 B4 C5 C5'.split()
bass = 'C3 G3 C3 G3 F2 C3 G2 D3 A2 E3 A2 E3 G2 D3 G2 D3'.split()
for i, p in enumerate(tune):
    V.note(0, t0 + i * beat, beat * 0.9, p, 70)
    if i % 2 == 0: V.note(1, t0 + i * beat, beat * 1.8, bass[(i // 2) % len(bass)], 40)
V.save(os.path.join(os.path.dirname(__file__), 'tv.mid'))
print('ok')
