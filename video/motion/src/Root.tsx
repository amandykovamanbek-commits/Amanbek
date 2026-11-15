import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { FPS } from './timeline';
import { TL } from './tl';
import { Cine, CT } from './cine/Cine';
import { V3, V } from './v3/V3';
import { Ricks, RK } from './ricks/Ricks';
import { Tools, TOOLS_DUR } from './tools/Tools';
import { FPS as TFPS } from './tools/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(TL.duration * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="Cine" component={Cine} durationInFrames={Math.round(CT.duration * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="Ricks" component={Ricks} durationInFrames={Math.round(RK.duration * FPS)} fps={FPS} width={1920} height={1080} />
    <Composition id="Tools" component={Tools} durationInFrames={Math.round(TOOLS_DUR * TFPS)} fps={TFPS} width={1920} height={1080} />
    <Composition id="V3" component={V3} durationInFrames={Math.round(V.duration * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
