"""Music + SFX + voice mix for the GTA6 'what if' video.

usage: python3 tools/audio.py            -> audio/music.wav, audio/sfx.wav, audio/voice.wav, audio/mix.wav
Everything is placed from remotion/src/timing.json, so it follows the voice timings.
"""
import json, re, wave, subprocess, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = json.loads((ROOT / 'remotion' / 'src' / 'timing.json').read_text())
SR = 48000
DUR = T['total'] + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(7)
norm = lambda w: re.sub(r'[^a-zа-я0-9]', '', w.lower().replace('ё', 'е'))
SC = {s['id']: s for s in T['scenes']}


def cue(sid, phrase, nth=0):
    ws = SC[sid]['words']
    p = [norm(x) for x in phrase.split() if norm(x)]
    k = 0
    for i in range(len(ws) - len(p) + 1):
        if all(ws[i + j]['n'] == p[j] for j in range(len(p))):
            if k == nth: return ws[i]['s']
            k += 1
    raise KeyError(f'{sid}: {phrase}')


def hz(m): return 440 * 2 ** ((m - 69) / 12)


def tt(d): return np.arange(int(d * SR)) / SR


def place(buf, sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0: return
    a, b = max(0, i), min(buf.shape[1], i + len(sig))
    s = sig[a - i:b - i] * g
    buf[0, a:b] += s * np.sqrt(0.5 * (1 - pan))
    buf[1, a:b] += s * np.sqrt(0.5 * (1 + pan))


def lp(x, k):  # one-pole lowpass, k in (0,1]
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += k * (x[i] - acc); y[i] = acc
    return y


def lp_fast(x, cutoff):
    # FFT brickwall-ish lowpass with smooth rolloff
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, n)


# ----------------------------------------------------------------- SFX kit
def seq(parts, L):
    out = np.zeros(int(L * SR))
    for sig, t in parts:
        i = int(t * SR); j = min(len(out), i + len(sig))
        if j > i: out[i:j] += sig[:j - i]
    return out

def env(t, a=0.005, d=0.2): return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def noise(d): return rng.standard_normal(int(d * SR))

K = {}
K['tick'] = lambda: np.sin(2 * np.pi * 3200 * tt(.03)) * np.exp(-tt(.03) * 220) * .35
K['click'] = lambda: noise(.02) * np.exp(-tt(.02) * 400) * .25
K['pop'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(900 - 5000 * t) / SR) * np.exp(-t * 40) * .5)(tt(.1))
K['coin'] = lambda: np.concatenate([np.sin(2 * np.pi * 988 * tt(.08)) * .3 * np.exp(-tt(.08) * 10), np.sin(2 * np.pi * 1319 * tt(.5)) * .34 * np.exp(-tt(.5) * 7)])
K['ding'] = lambda: (lambda t: (np.sin(2 * np.pi * 1568 * t) * .6 + np.sin(2 * np.pi * 2093 * t) * .4) * np.exp(-t * 4) * .32)(tt(1.0))
K['star'] = lambda: (lambda t: (np.sin(2 * np.pi * 880 * t) + .5 * np.sin(2 * np.pi * 1760 * t) + .3 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 3) * .28)(tt(1.2))
K['starOff'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(700 - 300 * t) / SR) * np.exp(-t * 5) * .3)(tt(.6))
K['sparkle'] = lambda: seq([(np.sin(2 * np.pi * (2400 + k * 330) * tt(.35)) * np.exp(-tt(.35) * 14) * .12, k * .05) for k in range(7)], .8)
K['success'] = lambda: seq([((np.sin(2 * np.pi * f * tt(.5)) + .3 * np.sin(4 * np.pi * f * tt(.5))) * np.exp(-tt(.5) * 6) * .18, i * .07) for i, f in enumerate([523, 659, 784, 1047])], .9)
K['error'] = lambda: np.concatenate([np.sign(np.sin(2 * np.pi * 440 * tt(.16))) * .15, np.zeros(int(.04 * SR)), np.sign(np.sin(2 * np.pi * 330 * tt(.3))) * .15 * np.exp(-tt(.3) * 4)])
K['whoosh'] = lambda: (lambda t: lp_fast(noise(.5), 1800) * np.sin(np.pi * t / .5) ** 2 * 1.6)(tt(.5))
K['riser'] = lambda: (lambda t: lp_fast(noise(1.6), 3000) * (t / 1.6) ** 2 * 1.2 + np.sin(2 * np.pi * np.cumsum(200 + 600 * t / 1.6) / SR) * (t / 1.6) ** 2 * .15)(tt(1.6))
K['hit'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(90 - 50 * t) / SR) * np.exp(-t * 3) * .9 + lp_fast(noise(1.2), 900) * np.exp(-t * 6) * .9)(tt(1.2))
K['boom'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(60 - 25 * t) / SR) * np.exp(-t * 2) * 1.0)(tt(1.6))
K['stamp'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(110 - 200 * t) / SR) * np.exp(-t * 14) * .8 + noise(.25) * np.exp(-t * 80) * .3)(tt(.25))
K['thud'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(80 - 60 * t) / SR) * np.exp(-t * 18) * .9)(tt(.3))
K['knock'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(160 - 300 * t) / SR) * np.exp(-t * 30) * .8)(tt(.16))
K['doorbell'] = lambda: np.concatenate([(lambda t: (np.sin(2 * np.pi * 659 * t) + .4 * np.sin(2 * np.pi * 1318 * t)) * np.exp(-t * 2.5) * .35)(tt(.45)), (lambda t: (np.sin(2 * np.pi * 523 * t) + .4 * np.sin(2 * np.pi * 1046 * t)) * np.exp(-t * 2) * .35)(tt(1.2))])
K['creak'] = lambda: (lambda t: np.sign(np.sin(2 * np.pi * np.cumsum(220 + 90 * np.sin(t * 7) + 60 * t) / SR)) * .06 * np.sin(np.pi * t / .9) * (0.6 + 0.4 * np.sin(t * 90)))(tt(.9))
K['paper'] = lambda: lp_fast(noise(.35), 5000) * np.sin(np.pi * tt(.35) / .35) * .5
K['scribble'] = lambda: lp_fast(noise(.6), 4000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * tt(.6)))) * .25
K['glitch'] = lambda: np.sign(np.sin(2 * np.pi * 180 * tt(.3))) * (rng.random(int(.3 * SR)) > .5) * .12 * np.exp(-tt(.3) * 4)
K['boing'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(220 + 500 * t + 60 * np.sin(t * 50)) / SR) * np.exp(-t * 4) * .35)(tt(.6))
K['wah'] = lambda: (lambda t: lp_fast(2 * ((np.cumsum((233 - 40 * t) * (1 + .02 * np.sin(t * 38))) / SR) % 1) - 1, 1200) * .25 * np.minimum(1, t * 30) * np.clip((0.9 - t) * 10, 0, 1))(tt(.9))
K['thunder'] = lambda: (lambda t: lp_fast(noise(2.5), 300) * np.exp(-t * 1.3) * 3.2 + lp_fast(noise(2.5), 2500) * np.exp(-t * 12) * 1.2)(tt(2.5))
K['siren'] = lambda: (lambda t: np.sin(2 * np.pi * np.cumsum(np.where((t * 2.2) % 1 < .5, 700, 950)) / SR) * .12 * np.minimum(1, t * 4) * np.minimum(1, (3 - t) * 2))(tt(3.0))
K['heli'] = lambda: (lambda t: lp_fast(noise(4), 400) * (0.4 + 0.6 * (np.sin(2 * np.pi * 11 * t) > 0)) * 1.4 * np.minimum(1, t) * np.minimum(1, (4 - t)))(tt(4.0))
K['heartbeat'] = lambda: (lambda t: np.sin(2 * np.pi * 55 * t) * (np.exp(-((t % .8) / .05)) + .7 * np.exp(-(((t - .18) % .8) / .05))) * .9)(tt(3.2))
K['steps'] = lambda: seq([(K['thud']() * .4, k * .19) for k in range(11)], 2.4)
K['laugh'] = lambda: seq([((lambda t: lp_fast(noise(.12), 1400) * np.sin(np.pi * t / .12) * .45)(tt(.12)), k * .13 + rng.random() * .03) for k in range(14)], 2.2)
K['cheer'] = lambda: lp_fast(noise(2.2), 2200) * np.sin(np.pi * tt(2.2) / 2.2) * .6
K['typing'] = lambda: seq([(K['click'](), k * .1) for k in range(8)], 1.0)
K['coins'] = lambda: seq([(K['coin']() * .5, k * .07) for k in range(12)], 1.6)
K['bell'] = lambda: (lambda t: (np.sin(2 * np.pi * 523 * t) + .6 * np.sin(2 * np.pi * 1046 * t) + .4 * np.sin(2 * np.pi * 1570 * t)) * np.exp(-t * 1.2) * .35)(tt(3.0))
K['firework'] = lambda: np.concatenate([np.zeros(int(.25 * SR)), noise(.6) * np.exp(-tt(.6) * 8) * .5])
K['drone'] = lambda: (lambda t: (np.sin(2 * np.pi * 55 * t) + .5 * np.sin(2 * np.pi * 58 * t)) * np.minimum(1, t) * np.minimum(1, 3 - t) * .3)(tt(3.0))

# (scene, cue, kind, offset_sec, gain)
EV = [
    ('S01', 'Три', 'tick', 0, 1), ('S01', 'часа', 'tick', .2, 1), ('S01', 'двенадцать', 'tick', .3, 1), ('S01', 'ночи', 'tick', 0, 1),
    ('S01', 'В дверь', 'doorbell', .05, 1), ('S01', 'На пороге', 'creak', -.3, 1), ('S01', 'На ней', 'paper', 0, 1),
    ('S01', 'До выхода', 'hit', 0, .8), ('S01', 'Весь мир', 'whoosh', -.2, .8), ('S01', 'А у тебя', 'sparkle', .2, 1), ('S01', 'шесть', 'ding', 0, .6),
    ('S01', 'Конечно', 'whoosh', .2, .8), ('S01', 'открываешь', 'sparkle', .3, 1),
    ('S02', 'Загрузка', 'riser', -.3, .7), ('S02', 'стоп', 'glitch', 0, 1), ('S02', 'Твой двор', 'glitch', 0, .7), ('S02', 'Твой подъезд', 'glitch', 0, .7),
    ('S02', 'Ты жмёшь', 'click', .5, 1.5), ('S02', 'И подпрыгиваешь', 'boing', 0, 1), ('S02', 'Сам', 'thud', 0, 1),
    ('S02', 'Ты ведёшь', 'drone', 0, 1), ('S02', 'загорается', 'glitch', 0, 1.2), ('S02', 'Ноль', 'coin', 0, .6),
    ('S02', 'пять', 'tick', 0, 1), ('S02', 'пустых', 'tick', 0, 1), ('S02', 'звёзд', 'tick', 0, 1), ('S02', 'розыска', 'tick', 0, 1),
    ('S03', 'До утра', 'scribble', .5, 1), ('S03', 'Правило первое', 'pop', 0, 1), ('S03', 'Правило второе', 'pop', 0, 1), ('S03', 'настоящие', 'coin', 0, .7),
    ('S03', 'Правило третье', 'pop', 0, 1), ('S03', 'Одна', 'star', 0, .6), ('S03', 'Пять', 'siren', 0, .5),
    ('S03', 'Правило четвёртое', 'pop', 0, 1), ('S03', 'Вообще', 'error', 0, .8), ('S03', 'зачёркнуто', 'scribble', 0, 1), ('S03', 'Узнаешь', 'ding', .2, .5),
    ('S04', 'Над ним', 'pop', 0, 1), ('S04', 'Снимаешь', 'coin', .3, 1), ('S04', 'Настоящая', 'sparkle', 0, 1),
    ('S04', 'Это открытый', 'hit', 0, .8), ('S04', 'Над головами', 'pop', .2, 1), ('S04', 'Над уборщицей', 'pop', 0, 1), ('S04', 'Над физруком', 'pop', 0, 1),
    ('S04', 'А над Лерой', 'sparkle', 0, 1.2), ('S04', 'с пятого', 'pop', 0, .6), ('S04', 'ни разу', 'error', 0, .5), ('S04', 'Над ней', 'pop', 0, 1),
    ('S04', 'Ты берёшь', 'coin', .4, 1), ('S04', 'Она улыбается', 'sparkle', 0, 1), ('S04', 'В углу', 'success', 0, 1), ('S04', 'Ты чуть', 'wah', 0, 1),
    ('S05', 'К обеду', 'coins', 0, 1), ('S05', 'К пятнице', 'coins', 0, 1), ('S05', 'Ты закрываешь', 'typing', .2, .8), ('S05', 'быстрее', 'success', 0, .6),
    ('S05', 'и очень', 'drone', 0, .6), ('S05', 'На сорок', 'stamp', 0, .7), ('S05', 'И тут', 'boom', 0, 1), ('S05', 'Тот самый', 'pop', 0, .7),
    ('S05', 'Над ним', 'error', 0, .7), ('S05', 'одну фразу', 'click', 0, 1.5), ('S05', 'Весь класс', 'drone', 0, .5), ('S05', 'А потом', 'laugh', 0, 1.4),
    ('S05', 'Впервые', 'sparkle', 0, 1.2),
    ('S06', 'Коды', 'click', 0, 1.2), ('S06', 'Вводишь', 'typing', .1, 1), ('S06', 'первый', 'success', .2, .8), ('S06', 'денежный', 'coins', 0, 1.2),
    ('S06', 'Все визжат', 'cheer', 0, .8), ('S06', 'первая звезда', 'star', 0, 1), ('S06', 'Код на погоду', 'thunder', .4, 1), ('S06', 'математике', 'thunder', 0, .8),
    ('S06', 'Контрольную отменяют', 'stamp', 0, 1), ('S06', 'Класс носит', 'cheer', 0, 1), ('S06', 'перелетаешь', 'whoosh', -.1, 1.2),
    ('S06', 'Две звезды', 'star', 0, 1), ('S06', 'Три', 'star', 0, 1), ('S06', 'Миллион', 'riser', -.4, .6), ('S06', 'подписчиков', 'ding', 0, .5),
    ('S06', 'ночь', 'ding', 0, .5), ('S06', 'Все кроме', 'drone', 0, .7),
    ('S07', 'Четыре', 'star', 0, 1), ('S07', 'вертолёт', 'heli', -.6, 1), ('S07', 'Во дворах', 'siren', 0, 1), ('S07', 'В новостях', 'hit', 0, .7),
    ('S07', 'Мама узнаёт', 'stamp', .4, .8), ('S07', 'Пять звёзд', 'hit', 0, 1), ('S07', 'Пять звёзд', 'siren', .1, 1),
    ('S07', 'Город ведёт', 'drone', 0, .8), ('S07', 'Ты бежишь', 'steps', 0, 1), ('S07', 'Ты бежишь', 'heli', .2, .7),
    ('S07', 'Её зажала', 'drone', 0, .8), ('S07', 'Ты жмёшь паузу', 'click', .3, 1.5), ('S07', 'Ничего', 'error', 0, 1),
    ('S07', 'Начать заново', 'hit', 0, .6), ('S07', 'Вместе с деньгами', 'stamp', .3, .5), ('S07', 'Вместе с репутацией', 'stamp', .3, .5), ('S07', 'Вместе с той', 'stamp', .4, .5),
    ('S08', 'Палец', 'heartbeat', 0, 1), ('S08', 'Три', 'tick', 0, 1.5), ('S08', 'Две', 'tick', 0, 1.5), ('S08', 'И ты кладёшь', 'thud', .6, 1),
    ('S08', 'Ты пробиваешься', 'steps', 0, .8), ('S08', 'Вытаскиваешь', 'whoosh', 0, .8), ('S08', 'Это всё', 'pop', 0, .6),
    ('S08', 'И возвращаешь', 'coins', 0, .8), ('S08', 'Извиняешься', 'pop', 0, .5),
    ('S08', 'И звёзды гаснут', 'starOff', 0, 1), ('S08', 'И звёзды гаснут', 'starOff', .4, 1), ('S08', 'И звёзды гаснут', 'starOff', .8, 1), ('S08', 'И звёзды гаснут', 'starOff', 1.2, 1), ('S08', 'И звёзды гаснут', 'starOff', 1.6, 1),
    ('S09', 'Полночь', 'bell', 0, 1), ('S09', 'Игра выходит', 'firework', 0, 1), ('S09', 'мира', 'firework', 0, .8), ('S09', 'И интерфейс', 'sparkle', .5, 1), ('S09', 'Ни заданий', 'pop', 0, .6),
    ('S09', 'И это первая', 'success', 0, .7), ('S09', 'А вечером', 'doorbell', 0, .8), ('S09', 'Пятое правило', 'hit', 0, .6), ('S09', 'И ещё одна', 'paper', 0, 1),
    ('S10', 'Так', 'whoosh', -.2, .7), ('S10', 'Напиши', 'pop', .5, .6), ('S10', 'первым', 'pop', 0, .6), ('S10', 'жизнь', 'pop', 0, .6), ('S10', 'Самый безумный', 'sparkle', 0, 1),
]

sfx = np.zeros((2, N))
for sid, c, k, off, g in EV:
    t = cue(sid, c) + off
    sig = K[k]()
    place(sfx, sig, t, g * 0.55, pan=float(rng.uniform(-.25, .25)))
# scene transition whooshes + title + end card
for s in T['scenes'][1:]:
    place(sfx, K['whoosh'](), s['start'] - 0.45, .35)
t0, t1 = SC['S01']['title']
place(sfx, K['riser'](), t0 - 1.4, .4)
place(sfx, K['hit'](), t0 + 0.2, .55)
place(sfx, K['success'](), T['end'][0] + 0.2, .5)

# ----------------------------------------------------------------- music
# segments: (start_t, end_t, bpm, chords(midi roots+quality), style)
def chord(root, q):
    return [root, root + (3 if q == 'm' else 4), root + 7]

P = {
    'mystery': ([(57, 'm'), (53, ''), (52, ''), (57, 'm')], 84, .25),
    'tension': ([(57, 'm'), (57, 'm'), (53, ''), (52, '')], 96, .45),
    'curious': ([(50, 'm'), (55, ''), (48, ''), (57, 'm')], 100, .45),
    'playful': ([(48, ''), (55, ''), (57, 'm'), (53, '')], 112, .7),
    'hype': ([(53, ''), (55, ''), (57, 'm'), (57, 'm')], 120, 1.0),
    'chase': ([(57, 'm'), (58, ''), (57, 'm'), (56, '')], 132, .9),
    'heart': ([(57, 'm'), (53, ''), (48, ''), (55, '')], 76, .3),
    'warm': ([(53, ''), (48, ''), (55, ''), (57, 'm')], 88, .45),
}
seg_spec = [('S01', 'mystery'), ('S02', 'tension'), ('S03', 'curious'), ('S04', 'playful'), ('S05', 'playful'), ('S06', 'hype'), ('S07', 'chase'), ('S08', 'heart'), ('S09', 'warm'), ('S10', 'warm')]
starts = [SC[s]['start'] - 0.5 for s, _ in seg_spec] + [DUR]
music = np.zeros((2, N))
for i, (sid, mood) in enumerate(seg_spec):
    a, b = max(0, starts[i]), starts[i + 1]
    chords, bpm, inten = P[mood]
    beat = 60 / bpm
    bar = beat * 4
    seg = np.zeros((2, int((b - a + 2) * SR)))
    nbars = int((b - a) / bar) + 2
    for bi in range(nbars):
        root, q = chords[bi % len(chords)]
        notes = chord(root, q)
        t_bar = bi * bar
        # pad
        d = bar + 0.6
        t = tt(d)
        e = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.5)
        for j, m in enumerate(notes):
            f = hz(m)
            s = sum(a_ * (np.sin(2 * np.pi * f * h * t) + np.sin(2 * np.pi * f * h * 1.003 * t + j)) / 2 for h, a_ in [(1, 1), (2, .3), (3, .12)])
            place(seg, s * e, t_bar, .05, pan=(j - 1) * .5)
        # bass
        if inten >= .3:
            for k in range(4 if inten < .8 else 8):
                st = t_bar + k * (beat if inten < .8 else beat / 2)
                d2 = beat * .9 if inten < .8 else beat * .45
                t2 = tt(d2)
                s = np.tanh(1.6 * np.sin(2 * np.pi * hz(root - 12) * t2)) * np.exp(-t2 / (d2 * .7)) * np.minimum(1, t2 / .01)
                place(seg, s, st, .09 * min(1, inten + .2))
        # arp / pluck
        if inten >= .4:
            step = beat / 2 if inten < .9 else beat / 4
            for k in range(int(bar / step)):
                m = notes[[0, 1, 2, 1][k % 4]] + 12 + (12 if mood in ('playful', 'warm') and k % 8 >= 4 else 0)
                t3 = tt(.5)
                s = (np.sin(2 * np.pi * hz(m) * t3) + .3 * np.sin(4 * np.pi * hz(m) * t3)) * np.exp(-t3 / .14) * np.minimum(1, t3 / .003)
                place(seg, s, t_bar + k * step, .035 * inten, pan=.35 * (-1) ** k)
        # drums
        if inten >= .7:
            for k in range(4):
                tk = t_bar + k * beat
                t4 = tt(.3)
                kick = np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-t4 / .03)) / SR) * np.exp(-t4 / .12)
                place(seg, kick, tk, .22 * inten)
                hat = noise(.05) * np.exp(-tt(.05) * 90)
                place(seg, lp_fast(hat, 9000) - lp_fast(hat, 5000), tk + beat / 2, .25 * inten)
                if k in (1, 3):
                    sn = lp_fast(noise(.2), 3500) * np.exp(-tt(.2) * 18)
                    place(seg, sn, tk, .22 * inten)
        if mood == 'mystery':
            for k in range(4):
                place(seg, K['tick']() * .5, t_bar + k * beat, .25)
    # crossfade segment edges
    L = int((b - a) * SR) + int(.6 * SR)
    seg = seg[:, :L]
    fade = np.ones(L)
    fi = int(.5 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fi:] = np.linspace(1, 0, fi)
    place(music, seg[0] * fade, a, 1.0, pan=-1)  # left channel copy
    place(music, seg[1] * fade, a, 1.0, pan=1)
# silence music under title riser start? keep. fade out at the very end
tail = int(2.5 * SR)
music[:, -tail:] *= np.linspace(1, 0, tail)

# simple reverb on music
ir_t = tt(1.4)
for ch in range(2):
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .45); ir /= np.sqrt((ir ** 2).sum())
    Lc = N + len(ir) - 1; nf = 1 << (Lc - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(music[ch], nf) * np.fft.rfft(ir, nf), nf)[:N]
    music[ch] = music[ch] + .3 * wet

# ----------------------------------------------------------------- voice
voice = np.zeros(N)
for s in T['scenes']:
    if not s['audio']: continue
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(ROOT / 'audio' / s['audio']), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'])
    v = np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768
    i = int(s['start'] * SR)
    voice[i:i + len(v)] += v[:max(0, N - i)]

# ducking: music down ~9 dB while voice is active
envv = np.abs(voice)
win = int(.05 * SR)
envv = np.convolve(envv, np.ones(win) / win, mode='same')
active = (envv > 0.01).astype(float)
sm = int(.25 * SR)
active = np.convolve(active, np.ones(sm) / sm, mode='same')
duck = 1 - .62 * np.clip(active, 0, 1)
music *= duck


def write(path, x):
    x = np.atleast_2d(x)
    pk = np.abs(x).max() or 1
    pcm = (np.clip(x / max(pk, 1e-9) * .95 if pk > 1 else x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(x.shape[0]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.T.tobytes())


out = ROOT / 'audio'
write(out / 'music.wav', music * .9)
write(out / 'sfx.wav', sfx)
write(out / 'voice.wav', voice)
mix = music * .55 + sfx * .7 + np.vstack([voice, voice]) * 1.0
write(out / 'premix.wav', mix / max(1, np.abs(mix).max() / .98))
print('ok', f'{DUR:.1f}s', 'voice' if voice.any() else 'no voice yet')
