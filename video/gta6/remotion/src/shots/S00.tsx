import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, ramp, rnd} from '../lib/theme';
import {Rooftops, Street, Void} from '../lib/Sets';
import {Cam, Siren, Spotlight, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {FACES} from '../lib/Stickman';
import {Crowd, Hero, Lera} from '../lib/Cast';
import {Heli} from '../lib/Props';
import {Menu} from '../lib/UI';

/** Hero on a rooftop under a helicopter spotlight (also reused for the callback in S07) */
export const RoofStandoff: React.FC<{d: number; frozen?: number; punch?: number[]}> = ({d, frozen, punch = []}) => {
  const live = useCurrentFrame();
  const f = frozen ?? live;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.1} oy="45%" punch={punch}>
        <Rooftops offset={0} />
        <Spotlight x0={1450} y0={110} sweep={60} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <Heli x={1450 + Math.sin(f / 30) * 30} y={110} f={f} s={1.15} />
        </svg>
        <Chars>
          <rect x={-20} y={1000} width={1960} height={100} fill="#06061A" />
          <rect x={-20} y={996} width={1960} height={5} fill="#2A2850" />
          <rect x={1560} y={900} width={8} height={100} fill="#06061A" />
          <path d="M 1530 900 L 1600 900 M 1540 920 L 1590 920" stroke="#06061A" strokeWidth={6} />
          <Pos x={960} y={1000} s={0.95}>
            <Hero rim="#FFFBE6" rimDx={0} rimDy={-10} armL={[150, 85]} armR={[25, -110]} hold="gamepad" face={FACES.scared} headTilt={-4} />
          </Pos>
        </Chars>
        <Siren o={0.55} />
      </Cam>
      <Vignette s={0.95} />
    </AbsoluteFill>
  );
};

const Below: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.12} to={1.02} ox="50%" oy="60%">
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.66)'}} />
        <Siren o={0.6} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 14% 38% at 50% 62%, rgba(255,240,255,0.32) 0%, rgba(0,0,0,0) 100%)'}} />
        <Chars>
          <Crowd n={6} x0={160} x1={860} y={1000} s={0.9} seed={201} face="angry" f={f} jitter={5} arms={(i) => (i % 2 ? [[150, 20], [10, 6]] : [[60, -40], [60, -40]])} />
          <Crowd n={6} x0={1060} x1={1760} y={1000} s={0.9} seed={211} face="angry" f={f} jitter={5} arms={(i) => (i % 2 ? [[10, 6], [150, 20]] : [[60, -40], [60, -40]])} />
          <Pos x={960} y={990} s={0.98}>
            <Lera face={{...FACES.scared, ly: -8}} headTilt={-6} />
          </Pos>
        </Chars>
      </Cam>
      <Vignette s={0.95} />
    </AbsoluteFill>
  );
};

const Button: React.FC<{d: number}> = () => (
  <AbsoluteFill>
    <Void tint="#0A0712" glow="rgba(255,77,94,0.2)" />
    <AbsoluteFill style={{transform: 'translateY(-60px)'}}>
      <Menu title="" items={['НАЧАТЬ ЗАНОВО']} active={0} danger={[0]} bg={0} />
    </AbsoluteFill>
    <Vignette />
  </AbsoluteFill>
);

/** VHS rewind back to "3 days ago" */
const Rewind: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const go = at('Давай');
  const speed = interpolate(f, [go - 4, d], [0.2, 1], clamp);
  const fr = Math.max(0, 200 - f * 6 * speed);
  const band = (f * 37) % 1200 - 60;
  const days = f < go ? 0 : Math.min(3, Math.floor((f - go) / 6) + 1);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `saturate(${1 - speed * 0.7}) contrast(1.15) hue-rotate(${speed * 20}deg)`, transform: `translateX(${Math.sin(f * 1.7) * 6 * speed}px)`}}>
        <RoofStandoff d={d} frozen={fr} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, rgba(0,0,0,0) 2px 5px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: band, height: 60, background: 'rgba(255,255,255,0.18)', filter: 'blur(3px)', opacity: speed}} />
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.25 + speed * 0.4}}>
        {Array.from({length: 40}).map((_, i) => (
          <rect key={i} x={rnd(i + f) * 1920} y={rnd(i * 3 + f) * 1080} width={40 + rnd(i * 7) * 200} height={2} fill="#FFF" />
        ))}
      </svg>
      <div style={{position: 'absolute', left: 70, top: 60, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 64, color: '#F4F4F4', textShadow: '3px 0 0 rgba(255,0,80,0.6), -3px 0 0 rgba(0,200,255,0.6)'}}>◀◀ ПЕРЕМОТКА</div>
      {days > 0 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 200, color: '#F4F4F4', textShadow: '6px 0 0 rgba(255,0,80,0.6), -6px 0 0 rgba(0,200,255,0.6)', transform: `scale(${ramp(f, go, 6, backOut)})`}}>−{days} {days === 1 ? 'ДЕНЬ' : 'ДНЯ'}</div>
        </AbsoluteFill>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

export const S00: SceneDef = {
  id: 'S00',
  shots: [
    {cue: 'Пять', C: (p) => <RoofStandoff d={p.d} punch={[p.at('Над')]} />},
    {cue: 'Внизу', C: Below},
    {cue: 'А перед', C: Button, hud: false},
    {cue: 'Ещё три', C: Rewind, hud: false},
  ],
};
