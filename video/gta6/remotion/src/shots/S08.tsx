import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, glowText, ramp} from '../lib/theme';
import {Street, Void, Yard} from '../lib/Sets';
import {Cam, Light, Siren, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Crowd, Director, Hero, Lera, Timur} from '../lib/Cast';
import {Bubble, Star} from '../lib/UI';

const Finger: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const two = at('Две');
  const n = f >= two ? '2' : '3';
  const pulse = 0.5 + 0.5 * Math.sin(f / 4);
  return (
    <AbsoluteFill>
      <Void tint="#0A0712" glow="rgba(255,77,94,0.18)" />
      <Cam dur={d} from={1.0} to={1.15}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
          <div style={{padding: '34px 80px', borderRadius: 24, background: `rgba(255,77,94,${0.55 + 0.3 * pulse})`, boxShadow: `0 0 ${40 + 40 * pulse}px rgba(255,77,94,0.7)`, color: '#FFF', fontWeight: 900, fontSize: 76, letterSpacing: 4}}>НАЧАТЬ ЗАНОВО</div>
        </AbsoluteFill>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <g transform={`translate(1010 ${interpolate(f, [0, d], [300, 400], clamp)})`}>
            <rect x={-48} y={-260} width={96} height={240} rx={48} fill={C.head} />
            <ellipse cx={0} cy={-30} rx={52} ry={40} fill={C.head} />
          </g>
        </svg>
        <div style={{position: 'absolute', left: 1500, top: 300, fontFamily: FONT, fontWeight: 900, fontSize: 240, color: C.gold, textShadow: glowText, transform: `scale(${interpolate((f - (f >= two ? two : 0)) % 1000, [0, 6], [1.4, 1], clamp)})`}}>{n}</div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const PutDown: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const bend = interpolate(f, [4, 22], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.05} to={1.15} ox="50%" oy="75%">
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.6)'}} />
        <Siren o={0.4} />
        <Chars>
          <Pos x={960} y={960} s={1.1}>
            <Hero rim={C.rimCold} rimDx={-8} lean={18 * bend} legs={bend > 0.5 ? 'sit' : 'stand'} armL={[10 + 20 * bend, 6]} armR={[10 + 20 * bend, 6]} hold={bend < 0.6 ? 'gamepad' : 'none'} face={{...FACES.determined, ly: 8 * bend}} />
          </Pos>
          {bend >= 0.6 && (
            <g transform="translate(1030 950) scale(1.1)">
              <path d="M -46 -16 Q -50 -22 -38 -22 L 38 -22 Q 50 -22 46 -16 L 52 14 Q 54 26 40 22 L 22 8 L -22 8 L -40 22 Q -54 26 -52 14 Z" fill="#1C1B26" stroke={C.head} strokeWidth={4} />
            </g>
          )}
        </Chars>
      </Cam>
      <Vignette s={0.9} />
    </AbsoluteFill>
  );
};

const PushThrough: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const pull = at('Вытаскиваешь');
  const x = interpolate(f, [0, pull], [200, 900], clamp);
  const lx = interpolate(f, [pull, pull + 20], [960, 700], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05}>
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.58)'}} />
        <Siren o={0.45} />
        <Chars>
          <Crowd n={8} x0={100} x1={1820} y={1010} s={0.9} seed={101} face="angry" f={f} jitter={8} arms={() => [[60, -40], [60, -40]]} />
          {f >= pull - 4 && (
            <Pos x={f >= pull ? lx + 120 : 1000} y={1000} s={0.95}>
              <Lera face={f >= pull + 10 ? FACES.shock : FACES.scared} armL={[70, -10]} armR={[10, 6]} />
            </Pos>
          )}
          <Pos x={f >= pull ? lx - 80 : x} y={1000} s={1.0}>
            <Hero rim={C.rimCold} rimDx={-8} legs={f < pull + 20 ? 'walk' : 'stand'} phase={f / 16} armL={[95, -10]} armR={[95, -10]} face={FACES.determined} lean={8} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: 960, top: 120, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#EDE7DA', letterSpacing: 6, opacity: ramp(f, at('Просто сам'), 8), whiteSpace: 'nowrap'}}>БЕЗ ЧИТОВ. ПРОСТО САМ.</div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Confess: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const say = at('Это всё');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} ox="50%" oy="40%">
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.55)'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 16% 45% at 50% 55%, rgba(255,250,220,0.35) 0%, rgba(0,0,0,0) 100%)'}} />
        <Chars>
          <Pos x={960} y={930} s={1.15}>
            <Hero rim={C.rimWarm} rimDx={8} face={f >= say ? FACES.determined : FACES.worried} armL={[10, 6]} armR={[10, 6]} />
          </Pos>
          <Pos x={1250} y={940} s={0.95}>
            <Lera face={{...FACES.shock, lx: -12}} />
          </Pos>
        </Chars>
        <Chars blur={5}>
          <Crowd n={7} x0={0} x1={1920} y={1350} s={1.35} seed={111} face="dots" />
        </Chars>
        <Bubble x={760} y={360} text="Это всё я. Деньги верну." start={say} w={560} size={48} />
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const PayBack: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const sorryDir = at('Извиняешься');
  const sorryT = at('Даже перед');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05} dx={interpolate(f, [sorryT - 6, sorryT + 10], [0, -260], clamp)}>
        <Yard />
        <Chars>
          <Pos x={700} y={1020} s={1.0}>
            <Hero rim={C.rimDay} rimDx={8} lean={f >= sorryDir ? 14 : 0} armR={f < sorryDir ? [70, -60] : [10, 6]} hold={f < sorryDir ? 'money' : 'none'} face={f >= sorryDir ? {...FACES.sad, eyes: 'closed'} : FACES.neutral} />
          </Pos>
          <Pos x={1100} y={1020} s={1.0}>
            <Director face={f >= sorryDir + 10 ? {...FACES.smile, lx: -10} : {...FACES.worried, lx: -10}} armL={[60, -70]} armR={[10, 6]} />
          </Pos>
          <Pos x={1600} y={1020} s={1.1}>
            <Timur face={f >= sorryT + 12 ? {...FACES.shock, lx: -12} : {...FACES.angry, mouth: 'line', lx: -12}} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: 1080, top: 150, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.green, background: 'rgba(10,10,22,0.8)', padding: '10px 28px', borderRadius: 14, opacity: ramp(f, 4, 8) * (f < sorryDir ? 1 : 0.4), whiteSpace: 'nowrap'}}>ВОЗВРАТ: $1 048 000 → $0</div>
      </Cam>
      <Vignette s={0.5} />
    </AbsoluteFill>
  );
};

const StarsOut: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const off = (i: number) => f >= 6 + (4 - i) * 12;
  return (
    <AbsoluteFill>
      <Void tint="#0B0A1A" glow={`rgba(255,200,70,${0.2 - 0.03 * [0, 1, 2, 3, 4].filter(off).length})`} />
      <Cam dur={d} from={1.05} to={1.0}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{display: 'flex', gap: 24}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{opacity: off(i) ? 0.35 : 1, transform: `scale(${off(i) ? 0.9 : 1})`, transition: 'none'}}>
                <Star on={off(i) ? 0 : 1} size={190} />
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

export const S08: SceneDef = {
  id: 'S08',
  shots: [
    {cue: 'Палец', C: Finger, hud: false},
    {cue: 'И ты кладёшь', C: PutDown},
    {cue: 'Ты пробиваешься', C: PushThrough},
    {cue: 'Встаёшь', C: Confess},
    {cue: 'И возвращаешь', C: PayBack},
    {cue: 'И звёзды гаснут', C: StarsOut, hud: false},
  ],
};
