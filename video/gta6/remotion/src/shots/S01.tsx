import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, glowText, ramp} from '../lib/theme';
import {Bedroom, CityNight, DoorSet, Landing, Void} from '../lib/Sets';
import {Cam, Dust, Light, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {FACES, Stickman} from '../lib/Stickman';

const Clock: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const colon = Math.floor(f / 15) % 2 === 0;
  return (
    <AbsoluteFill>
      <Bedroom blur={10} tv="#0B0E22" />
      <AbsoluteFill style={{background: 'rgba(4,4,14,0.55)'}} />
      <Cam dur={d} from={1} to={1.12}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 760, height: 330, borderRadius: 40, background: '#0B0A12', border: '8px solid #1C1B26', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.6)'}}>
            <div style={{fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 220, color: '#FF4D5E', textShadow: '0 0 30px rgba(255,77,94,0.8)', letterSpacing: 6}}>
              03<span style={{opacity: colon ? 1 : 0.15}}>:</span>12
            </div>
          </div>
        </AbsoluteFill>
      </Cam>
      <Light x="50%" y="50%" color="rgba(255,60,80,0.25)" size="40%" />
      <Vignette s={0.95} />
    </AbsoluteFill>
  );
};

const Doorbell: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const shake = f < 24 ? Math.sin(f * 3) * 4 * (1 - f / 24) : 0;
  const walkX = interpolate(f, [10, d], [260, 560], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.02} to={1.08} ox="45%" oy="60%" shake={f < 24 ? 2 : 0}>
        <AbsoluteFill style={{transform: `translateX(${shake}px)`}}>
          <DoorSet />
        </AbsoluteFill>
        <Light x="50%" y="82%" color="rgba(255,230,160,0.25)" size="30%" />
        <Chars>
          <Pos x={walkX} y={900} s={0.95}>
            <Stickman color={C.hero} rim={C.rimCold} rimDx={8} legs="walk" phase={f / 26} armL={[8, 10]} armR={[8, 10]} face={{eyeOpen: 0.3, mouth: 'line', lx: 8}} />
          </Pos>
        </Chars>
        {f < 30 && (
          <div style={{position: 'absolute', left: 1140, top: 260, fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#FFE7A8', transform: `rotate(-8deg) scale(${ramp(f, 0, 6, backOut)})`, textShadow: '0 0 20px rgba(255,220,140,0.7)'}}>ДЗЫНЬ!</div>
        )}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Box: React.FC<{x: number; y: number; s?: number; open?: number}> = ({x, y, s = 1, open = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-130} y={-150} width={260} height={150} rx={6} fill="#B98A5A" stroke={C.head} strokeWidth={6} />
    <rect x={-22} y={-150} width={44} height={150} fill="#D9B07E" />
    <g transform={`translate(-130 -150) rotate(${-open * 110})`}>
      <rect x={0} y={-24} width={260} height={28} rx={4} fill="#C99A68" stroke={C.head} strokeWidth={6} />
    </g>
  </g>
);

const Threshold: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1} to={1.1} oy="80%">
        <Landing />
        <Light x="48%" y="12%" color="rgba(255,240,180,0.35)" size="45%" />
        <Dust n={30} area={[700, 100, 500, 800]} />
        <Chars>
          <Box x={960} y={900} s={1} />
          <Pos x={150} y={940} s={1.05}>
            <Stickman color={C.hero} rim={C.rimWarm} rimDx={8} armL={[10, 6]} armR={[60, -40]} face={{eyes: 'round', mouth: 'line', lx: 14, brow: -6}} headTilt={6} />
          </Pos>
        </Chars>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Label: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#8C6440'}} />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 3px, rgba(0,0,0,0) 3px 18px)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0) 44%, #A97E52 44%, #A97E52 56%, rgba(0,0,0,0) 56%)'}} />
      <Cam dur={d} from={1.0} to={1.1}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: 'rotate(-3deg)', background: '#F2EBDD', width: 1100, padding: '60px 70px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', fontFamily: FONT, color: '#1C1A24', textAlign: 'center'}}>
            <div style={{fontWeight: 900, fontSize: 92, opacity: ramp(f, 4, 10)}}>ТОЛЬКО ДЛЯ ТЕБЯ.</div>
            <div style={{fontWeight: 800, fontSize: 58, marginTop: 24, color: '#B02A3A', opacity: ramp(f, 30, 10)}}>НЕ ОТКРЫВАТЬ ДО 19 НОЯБРЯ</div>
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette s={0.9} />
    </AbsoluteFill>
  );
};

const Countdown: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const total = 47 * 3600 + 58 * 60 + 12 - Math.floor(f / 30);
  const hh = String(Math.floor(total / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return (
    <AbsoluteFill>
      <Void glow="rgba(255,160,60,0.16)" />
      <Cam dur={d} from={1} to={1.05}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
          <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 42, letterSpacing: 10, opacity: ramp(f, 0, 10)}}>ДО ВЫХОДА ГТА 6</div>
          <div style={{color: C.gold, fontWeight: 900, fontSize: 210, textShadow: glowText, opacity: ramp(f, 6, 10), transform: `scale(${0.92 + 0.08 * ramp(f, 6, 12, backOut)})`}}>2 ДНЯ</div>
          <div style={{color: '#B9B3C9', fontWeight: 800, fontSize: 64, fontFamily: "'DejaVu Sans Mono', monospace", marginTop: 8, opacity: ramp(f, 14, 10)}}>
            {hh}:{mm}:{ss}
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const World: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} oy="70%">
        <CityNight lit={0.38} blur={1} />
        <Chars>
          {Array.from({length: 9}).map((_, i) => (
            <Pos key={i} x={160 + i * 200} y={1120} s={0.55}>
              <Stickman color={C.crowd[i % 5]} simple hold="phoneUp" armL={[10, 6]} armR={[150, 20]} face={{eyes: 'oval', mouth: 'line', ly: -4}} />
            </Pos>
          ))}
        </Chars>
        {[[420, 380], [980, 300], [1500, 420]].map(([x, y], i) => (
          <div key={i} style={{position: 'absolute', left: x, top: y + Math.sin(f / 12 + i) * 8, transform: 'translate(-50%,-50%)', fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 46, color: C.gold, textShadow: glowText, opacity: ramp(f, i * 6, 10) * 0.9}}>
            47:{String(58 - i).padStart(2, '0')}:{String(59 - (Math.floor(f / 30) % 60)).padStart(2, '0')}
          </div>
        ))}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const DiscCloseup: React.FC<{d: number; at: (p: string) => number}> = ({d, at}) => {
  const f = useCurrentFrame();
  const t1 = at('Без');
  const t2 = at('шесть', 0);
  const spin = f * 1.5;
  const face = f < t1 ? FACES.shock : f < t2 ? FACES.worried : FACES.smirk;
  return (
    <AbsoluteFill>
      <Bedroom blur={14} tv="#0B0E22" />
      <AbsoluteFill style={{background: 'rgba(4,4,14,0.45)'}} />
      <Light x="62%" y="45%" color="rgba(200,180,255,0.3)" size="40%" />
      <Cam dur={d} from={1} to={1.06}>
        <Chars>
          <Pos x={640} y={2640} s={4.1}>
            <Stickman color={C.hero} rim={C.rimCold} rimDx={-7} face={{...face, lx: 10}} />
          </Pos>
          <g transform={`translate(1240 560)`}>
            <circle r={250} fill="#D8DCE8" stroke={C.head} strokeWidth={10} />
            <g transform={`rotate(${spin})`}>
              <circle r={250} fill="url(#discSheen)" opacity={0.55} />
            </g>
            <circle r={70} fill="#ECEFF6" stroke="#9AA0B0" strokeWidth={4} />
            <circle r={26} fill={C.head} />
            <text x={0} y={-120} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={110} fill="#1C1A24" opacity={ramp(f, t2 - 6, 8)}>VI</text>
          </g>
        </Chars>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const OpenBox: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const open = ramp(f, 10, 14, backOut);
  return (
    <AbsoluteFill>
      <Bedroom tv="#0B0E22" />
      <AbsoluteFill style={{background: 'rgba(4,4,14,0.35)'}} />
      <Cam dur={d} from={1.1} to={1.2} ox="50%" oy="70%">
        <Light x="52%" y="72%" color={`rgba(255,210,120,${0.6 * open})`} size="38%" />
        <Chars>
          <Pos x={960} y={1000} s={1.15}>
            <Stickman color={C.hero} rim={C.rimWarm} rimDx={0} rimDy={10} armL={[30, -100]} armR={[30, -100]} face={open > 0.5 ? FACES.smirk : FACES.neutral} />
          </Pos>
          <Box x={960} y={1000} s={0.9} open={open} />
        </Chars>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

export const S01: SceneDef = {
  id: 'S01',
  shots: [
    {cue: 'Три', C: Clock},
    {cue: 'В дверь', C: Doorbell},
    {cue: 'На пороге', C: Threshold},
    {cue: 'На ней', C: Label},
    {cue: 'До выхода', C: Countdown},
    {cue: 'Весь мир', C: World},
    {cue: 'А у тебя', C: DiscCloseup},
    {cue: 'Конечно', C: OpenBox},
  ],
};
