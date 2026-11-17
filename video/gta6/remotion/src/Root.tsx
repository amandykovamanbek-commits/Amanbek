import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {TIMING} from './lib/timeline';
export const Root: React.FC = () => (
  <Composition id="GTA6" component={Video} durationInFrames={TIMING.frames} fps={30} width={1920} height={1080} />
);
