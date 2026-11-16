import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
export const Root: React.FC = () => (
  <Composition id="Brag" component={Video} durationInFrames={420} fps={30} width={1920} height={1080} />
);
