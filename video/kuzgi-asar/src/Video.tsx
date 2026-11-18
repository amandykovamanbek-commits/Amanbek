import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import TL from './timeline.json';
import {SCENES} from './scenes';
import {Scene, WIPE} from './ui';

const starts: number[] = [];
let acc = 0;
for (const s of TL.scenes) { starts.push(acc); acc += s.beats * TL.beat; }
export const TOTAL = acc;

const SceneHost: React.FC<{i: number; from: number}> = ({i, from}) => {
  const f = useCurrentFrame();
  const s = TL.scenes[i];
  const def = SCENES[s.id];
  const t = f - (i > 0 ? WIPE : 0);
  const len = s.beats * TL.beat;
  return (
    <Scene theme={def.theme} t={t} len={len} g={f + from} origin={def.origin} first={i === 0} index={i} label={def.label}
      leaves={i === 0 || i === TL.scenes.length - 1 ? 16 : 8}>
      <def.C t={t} p={s.pops} theme={def.theme} len={len} />
    </Scene>
  );
};

export const KuzgiAsar: React.FC = () => (
  <AbsoluteFill style={{background: '#2A1A10'}}>
    {TL.scenes.map((s, i) => {
      const last = i === TL.scenes.length - 1;
      const from = starts[i] - (i > 0 ? WIPE : 0);
      const dur = s.beats * TL.beat + (i > 0 ? WIPE : 0) + (last ? 0 : WIPE);
      return (
        <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
          <SceneHost i={i} from={from} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
