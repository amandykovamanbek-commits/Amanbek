"""v2 soundtrack: procedural music/SFX driven by v2/events.json, mixed under vo2_final.wav"""
import numpy as np, json, subprocess, os
base = os.path.dirname(os.path.abspath(__file__)) + '/..'
src = open(base + '/tools/sound.py', encoding='utf8').read().split('sfx = np.zeros')[0]
E = json.load(open(base + '/v2/events.json'))
src = src.replace('DUR = 108.0', 'DUR = %.3f' % E['DUR'])
exec(src)
_full = open(base + '/tools/sound.py', encoding='utf8').read()
exec(_full[_full.index('mtof = lambda'):_full.index('def intensity')])
C = E['cues']; SC = E['scenes']
sfx = np.zeros((N, 2))
for h in E['hits']:
    t, k = h['t'], h['type']
    if k == 'punch': place(sfx, punch(), t - .02, 1.0)
    elif k == 'fall': place(sfx, snowfall_hit(), t, .9)
    elif k == 'stamp': place(sfx, stamp_sfx(), t, .85)
    elif k == 'clash': place(sfx, punch(), t, .9, -.3); place(sfx, punch(), t + .08, .8, .3); place(sfx, thud(.8, 50), t, .8)
    elif k == 'gavel': place(sfx, gavel(), t, 1.0)
for b in SC[1:]: place(sfx, whoosh(), b - .22, .6)
# 2026 room: phone taps, coin flip, time tunnel, idle truck in 1976
for k in range(6): place(sfx, tick(), 1.5 + k * .9, .35)
place(sfx, coin_sfx(), C['flip'], 1.0)
nT = int((C['wake'] - C['turn'] + .3) * SR); tt = np.arange(nT) / SR
sw = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / tt[-1]) ** 2) / SR) * .25 + hp_fast(noise(nT), 800) * (tt / tt[-1]) * .5
sw *= np.minimum(1, tt / .3); place(sfx, sw, C['turn'] - .2, .8); place(sfx, thud(.8, 45), C['wake'], .9)
n0 = int(C['wake'] * SR); n1 = int(SC[2] * SR); tt = np.arange(n1 - n0) / SR
eng = lp_fast((np.sign(np.sin(2 * np.pi * 32 * tt)) * .3 + noise(n1 - n0) * .15), 300) * .22; sfx[n0:n1, 0] += eng; sfx[n0:n1, 1] += eng

tt0 = C['tick'] + .1
while tt0 < C['tick'] + 2.1: place(sfx, tick(), tt0, .6); tt0 += .05 + .1 * ((tt0 - C['tick']) / 2) ** 2
for i in range(10): place(sfx, hp_fast(noise(int(.06 * SR)), 3000) * env(int(.06 * SR), .002, .02) * .4, C['graffiti'] + i * .08, .6)  # spray
for i in range(4): place(sfx, thud(.25, 80), C['jump'] + .2 + i * .55 + .5, .45)
for i in range(4): place(sfx, coin_sfx(), C['has'] + i * .18 + .5, .7, .2)
place(sfx, coin_sfx(), C['c20'], 1.0); place(sfx, paper(), C['rub'], 1.0)
for t in np.arange(C['kitchen'], SC[4], 1.0): place(sfx, clock_tick(), t, .7)
for t in np.arange(SC[4], C['found'], .32): place(sfx, crunch(), t, .55)
def bark():
    n = int(.25 * SR); tt = np.arange(n) / SR; return np.tanh(lp_fast(noise(n), 1200) * 2 + sine(420 * np.exp(-tt * 4), n)) * env(n, .005, .07) * .5
place(sfx, bark(), SC[4] + 2.0, .6, .5); place(sfx, bark(), SC[4] + 2.35, .5, .5)
for t in np.arange(SC[5] + 4.5, SC[5] + 7.5, .3): place(sfx, crunch(), t, .55)
place(sfx, crowd(2.6), C['cheer'] - .2, .9)
for i, t in enumerate(C['rules']): place(sfx, scribble(), t, .9)
place(sfx, paper(), SC[7], 1.0); place(sfx, paper(), C['late'] - .2, 1.1)
for t in np.arange(C['late'], C['late'] + 1.2, .25): place(sfx, clock_tick(), t, .8)
for t in C['names']: place(sfx, thud(.35, 75), t, .55)
place(sfx, crowd(2.4), C['war'] - 1.0, .8)
place(sfx, crowd(4.4), C['mob'] - .2, .7)
for t in np.arange(C['mob'], C['mob'] + 4.2, .38): place(sfx, crunch(), t, .7); place(sfx, thud(.15, 60), t, .3)
for i in range(28): place(sfx, tick(), C['bench'] + i * 1.6 / 28, .5)
place(sfx, coin_sfx(), C['pocket'], .6); place(sfx, coin_sfx(), C['worth'] + .3, .9)
def ding():
    n = int(1.0 * SR); return (sine(1318, n) + sine(1975, n) * .5) * env(n, .002, .3) * .4
place(sfx, ding(), C['cta'] + .6, .9); place(sfx, ding(), C['cta'] + 2.2, .7)
# music by scene intensity
mus = np.zeros((N, 2)); BPM = 88; beat = 60 / BPM
prog = [45, 41, 48, 43]
def inten(t):
    i = max(k for k in range(len(SC)) if SC[k] <= t)
    return [.6, 1, 1.6, 2, .3, 2, 2.4, 3, 2, 1.6, 3, 3, 1.5, 0, 0][i]
place(mus, pad([57, 64, 69], SC[1]) * .7, 0.0, .6)
t = 0.0; i = 0
while t < SC[-2] - .1:
    it = inten(t); bar = int(t / (beat * 4)); m = prog[bar % 4]; pos = i % 4
    if it == .3:  # kitchen: soft piano-like bells only
        if pos == 0: place(mus, bell(m + 24, 1.6), t, .35)
    elif it == 1.5:
        if pos in (0, 2): place(mus, kick(), t, .8)
    else:
        if it >= 1.5: place(mus, kick(), t, .7 if it < 3 else .95)
        if it >= 2: place(mus, hat(), t + beat / 2, .8); place(mus, hat(), t, .3)
        if it >= 3 and pos in (1, 3): place(mus, snare(), t, .8)
        if it >= 1: place(mus, bass_note(m, beat * .95, 1.5 if it >= 3 else .6), t, .5)
    if pos == 0 and bar % 2 == 0 and it != .3: place(mus, pad([m + 24, m + 27, m + 31], beat * 8) * .9, t, .32 if it < 3 else .42)
    t += beat; i += 1
place(mus, pad([57, 58], SC[13] - SC[12]), SC[12], .45)
place(mus, pad([45, 48, 52], SC[-1] - SC[-2] + 1), SC[-2], .65)
for k, m in enumerate([76, 72, 69, 71, 72, 69, 64, 69, 71, 72]): place(mus, bell(m), SC[-2] + .4 + k * .8, .85)
place(mus, pad([45, 48, 52, 57], E['DUR'] - SC[-1]), SC[-1], .55)
mus *= .5 * .85
amb = np.zeros((N, 2)); w = lp_fast(noise(N), 500); tt = np.arange(N) / SR; wm = .5 + .5 * np.sin(tt * .3) * np.sin(tt * .11 + 1)
amb[:, 0] = w * wm * .1; amb[:, 1] = np.roll(w, 2400) * wm * .1
ki = int(SC[4] * SR); kj = int(SC[5] * SR); amb[:int(SC[1] * SR)] *= .15; amb[ki:kj] *= .2  # indoors
vo_wav = base + '/build/vo48.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', base + '/audio/vo3_final.wav', '-ar', str(SR), '-ac', '1', '-f', 'f32le', vo_wav], check=True)
vo = np.fromfile(vo_wav, dtype=np.float32).astype(np.float64); vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
blk = 480; rms = np.sqrt(np.convolve(vo ** 2, np.ones(blk * 8) / (blk * 8), 'same'))
duck = 1 - .55 * np.clip(rms / (rms.max() * .25), 0, 1); duck = np.convolve(duck, np.ones(4800) / 4800, 'same')
mix = np.stack([vo, vo], 1) + mus * duck[:, None] * .85 + sfx * .8 * .85 + amb * duck[:, None]
fade = np.ones(N); fs = int((E['DUR'] - 1.2) * SR); fade[fs:] = np.linspace(1, 0, N - fs); mix *= fade[:, None]
mix /= np.abs(mix).max() * 1.05
mix.astype(np.float32).tofile(base + '/build/mix2.f32')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', base + '/build/mix2.f32', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), base + '/build/mix2.wav'], check=True)
os.remove(base + '/build/mix2.f32'); os.remove(vo_wav); print('ok')
