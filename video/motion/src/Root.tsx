import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { FPS } from './timeline';
import { TL } from './tl';
import { Cine, CT } from './cine/Cine';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(TL.duration * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="Cine" component={Cine} durationInFrames={Math.round(CT.duration * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
