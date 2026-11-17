import React from 'react';

export type At = (phrase: string, nth?: number) => number;
export type ShotFC = React.FC<{d: number; at: At}>;
export type Shot = {cue: string; C: ShotFC; hud?: boolean; noFadeIn?: boolean};
export type SceneDef = {id: string; shots: Shot[]};

/** HUD events: at cue → set money/stars/visibility */
export type HudEv = {id: string; cue: string; money?: number; stars?: number; show?: boolean; flash?: boolean; offset?: number};
