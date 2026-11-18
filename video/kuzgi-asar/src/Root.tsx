import React from 'react';
import {Composition} from 'remotion';
import {KuzgiAsar, TOTAL} from './Video';
export const RemotionRoot: React.FC = () => (
  <Composition id="KuzgiAsar" component={KuzgiAsar} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
);
