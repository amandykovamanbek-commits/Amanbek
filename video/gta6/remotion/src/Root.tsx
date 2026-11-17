import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {TIMING} from './lib/timeline';
import {Thumb} from './Thumb';
export const Root: React.FC = () => (
  <>
  <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1920} height={1080} />
  <Composition id="GTA6" component={Video} durationInFrames={TIMING.frames} fps={30} width={1920} height={1080} />
  </>
);
