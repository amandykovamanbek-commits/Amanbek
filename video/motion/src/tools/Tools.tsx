// «Без этого твой Claude — пустой: 10 инструментов» — 1920x1080, 60 fps
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { BG, clamp, lerp, ex, ei, eio, pr, Grain, Vig } from './kit';
import { SC, DUR, C, Backdrop, Rail, Subs } from './common';
import { FPS } from './timeline';
import { Hook, Explain } from './scenesA';
import { T1, T2, T3 } from './scenesB';
import { T4, T5, T6, Mid } from './scenesC';
import { T7, T8, T9, T10 } from './scenesD';
import { Bonus, Top, End } from './scenesE';

export const TOOLS_DUR = DUR;
const COMPS: Record<string, React.FC<{ t: number }>> = { h: Hook, ex: Explain, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, mid: Mid, t7: T7, t8: T8, t9: T9, t10: T10, bn: Bonus, top: Top, en: End };
const TR = .85; // zoom-through transition, starts at the cut

export const Tools: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = Math.max(0, SC.findIndex((x) => t >= x.start && t < x.end)), s = SC[i];
  const k = i ? pr(t, s.start, TR) : 1, e = eio(k);
  const Prev = i ? COMPS[SC[i - 1].id] : null, Cur = COMPS[s.id];
  const open = ex(pr(t, 0, .9));
  const sweep = lerp(-40, 140, e);
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
    <Backdrop t={t} />
    {Prev && k < .7 && <AbsoluteFill style={{ transform: `scale(${lerp(1, 1.1, e)})`, filter: `blur(${e * 24}px)`, opacity: 1 - eio(clamp(k * 1.6)) }}><Prev t={t} /></AbsoluteFill>}
    <AbsoluteFill style={k < 1 ? { transform: `scale(${lerp(.92, 1, e)})`, filter: e < .98 ? `blur(${(1 - e) * 18}px)` : undefined, opacity: clamp((k - .2) * 2.4) } : undefined}><Cur t={t} /></AbsoluteFill>
    {i > 0 && k < 1 && <AbsoluteFill style={{ background: `linear-gradient(100deg, transparent ${sweep - 22}%, rgba(255,200,160,.16) ${sweep}%, transparent ${sweep + 22}%)`, mixBlendMode: 'screen', pointerEvents: 'none' }} />}
    <Rail t={t} />
    <Subs t={t} />
    <Vig />
    <Grain f={f} />
    <AbsoluteFill style={{ background: '#000', opacity: 1 - open, pointerEvents: 'none' }} />
    <Audio src={staticFile('tools/voice.wav')} />
    <Audio src={staticFile('tools/sfx.wav')} volume={.5} />
  </AbsoluteFill>;
};
