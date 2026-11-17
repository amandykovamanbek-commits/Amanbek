import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Brag } from './Brag';
import TL from './timeline.json';

const Root: React.FC = () => (
  React.createElement(Composition, { id: 'Brag', component: Brag, durationInFrames: TL.duration, fps: TL.fps, width: 1920, height: 1080 })
);

registerRoot(Root);
