import React from 'react';
import {C, rnd} from './theme';
import {ManProps, Stickman} from './Stickman';

type P = Partial<ManProps>;
export const Hero: React.FC<P> = (p) => <Stickman color={C.hero} rim={C.rimCold} {...p} />;
export const Lera: React.FC<P> = (p) => <Stickman color={C.lera} rim="#F2C6FF" hair="pony" hairColor="#FF9AD5" {...p} />;
export const Timur: React.FC<P> = (p) => <Stickman color={C.timur} rim="#FFB3A0" hair="cap" hairColor="#2B2B33" {...p} />;
export const Mom: React.FC<P> = (p) => <Stickman color={C.mom} rim={C.rimWarm} hair="bun" {...p} />;
export const Director: React.FC<P> = (p) => <Stickman color={C.director} rim={C.rimDay} tie {...p} />;
export const Cleaner: React.FC<P> = (p) => <Stickman color={C.cleaner} rim={C.rimDay} hair="scarf" hairColor="#E07A5F" hold="bucket" armR={[14, 0]} {...p} />;
export const Coach: React.FC<P> = (p) => <Stickman color={C.coach} rim={C.rimDay} hair="cap" hairColor="#E8E8F0" {...p} />;
export const Extra: React.FC<P & {i: number}> = ({i, ...p}) => (
  <Stickman color={C.crowd[i % C.crowd.length]} seed={i} simple hair={rnd(i) < 0.3 ? 'pony' : rnd(i) < 0.45 ? 'spiky' : 'none'} {...p} />
);

/** A row/cluster of crowd extras. pos: [x, y, scale] list */
export const Crowd: React.FC<{n: number; x0: number; x1: number; y: number; s?: number; seed?: number; face?: ManProps['face']; arms?: (i: number) => [[number, number], [number, number]]; hold?: ManProps['hold']; jitter?: number; f?: number}> = ({
  n, x0, x1, y, s = 0.6, seed = 0, face = 'neutral', arms, hold, jitter = 0, f = 0,
}) => (
  <g>
    {Array.from({length: n}).map((_, k) => {
      const i = k + seed;
      const x = x0 + ((x1 - x0) * (k + 0.5)) / n + (rnd(i * 3) - 0.5) * 60 + Math.sin(f / 6 + i) * jitter;
      const yy = y + rnd(i * 5) * 40;
      const sc = s * (0.9 + rnd(i * 7) * 0.2);
      const a = arms ? arms(i) : ([[10, 6], [10, 6]] as [[number, number], [number, number]]);
      return (
        <g key={k} transform={`translate(${x} ${yy}) scale(${sc})`}>
          <Extra i={i} face={face} armL={a[0]} armR={a[1]} hold={hold} />
        </g>
      );
    })}
  </g>
);
