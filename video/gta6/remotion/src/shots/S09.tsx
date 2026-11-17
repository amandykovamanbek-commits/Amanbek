import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, glowText, ramp} from '../lib/theme';
import {CityNight, Landing, Yard} from '../lib/Sets';
import {Cam, Dissolve, Dust, Light, Sparkle, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {FACES} from '../lib/Stickman';
import {Crowd, Hero, Lera} from '../lib/Cast';
import {Box, Firework} from '../lib/Props';
import {Toast} from '../lib/UI';

const Midnight: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const mid = at('Полночь');
  const t = f >= mid ? '00:00' : '23:59';
  return (
    <AbsoluteFill style={{background: '#06060E'}}>
      <Cam dur={d} from={1.0} to={1.08}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
          <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 48, letterSpacing: 12, opacity: ramp(f, 0, 10)}}>19 НОЯБРЯ</div>
          <div style={{marginTop: 20, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 240, color: f >= mid ? C.gold : '#F4EEE2', textShadow: f >= mid ? glowText : 'none', transform: `scale(${f >= mid ? interpolate(f, [mid, mid + 6], [1.15, 1], clamp) : 1})`}}>{t}</div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Release: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06}>
        <CityNight lit={interpolate(f, [0, 30], [0.3, 0.95], clamp)} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          {[[400, 260, 0, '#FFD240'], [1000, 200, 10, '#FF7AC8'], [1500, 300, 20, '#7AD8FF'], [700, 340, 30, '#9BFF8A'], [1300, 220, 40, '#FFD240']].map(([x, y, s, c], i) => (
            <Firework key={i} x={x as number} y={y as number} f={f % 60} start={s as number} color={c as string} />
          ))}
        </svg>
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 80, fontFamily: FONT}}>
          <div style={{color: C.gold, fontWeight: 900, fontSize: 84, letterSpacing: 6, textShadow: glowText, opacity: ramp(f, 6, 10)}}>ИГРА ВЫШЛА У ВСЕХ</div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Melt: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const quests = at('Ни заданий');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06}>
        <CityNight lit={0.9} />
        <Chars>
          <Crowd n={4} x0={200} x1={1720} y={1060} s={0.75} seed={121} face="happy" />
          <Pos x={960} y={1040} s={1.0}>
            <Hero rim={C.rimWarm} rimDx={8} face={{...FACES.shock, lx: -16, ly: -10}} headTilt={-6} />
          </Pos>
        </Chars>
        {[300, 700, 1260, 1640].map((x, i) => (
          <div key={i} style={{position: 'absolute', left: x, top: 520, transform: `translate(-50%,-50%) rotate(45deg) scale(${1 - ramp(f, quests + i * 4, 8)})`, width: 40, height: 40, background: C.gold, borderRadius: 6, boxShadow: '0 0 18px rgba(255,210,64,0.9)'}} />
        ))}
      </Cam>
      <Dissolve x={56} y={48} w={400} h={170} start={18} />
      <Dissolve x={56} y={48} w={400} h={170} start={34} color={C.green} />
      <Vignette />
    </AbsoluteFill>
  );
};

const Together: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const reward = at('И это первая');
  const lx = interpolate(f, [0, 40], [1500, 1080], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.1} ox="50%" oy="60%">
        <CityNight lit={0.9} blur={3} />
        <Light x="50%" y="70%" color="rgba(255,190,110,0.3)" size="50%" />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <rect x={0} y={880} width={1920} height={200} fill="#0B0A1E" />
          <rect x={0} y={876} width={1920} height={6} fill="#3A2E3A" />
        </svg>
        <Chars>
          <Pos x={840} y={990} s={0.95}>
            <Hero rim={C.rimWarm} rimDx={8} legs="sit" face={f >= reward ? {...FACES.smile, lx: 10} : {...FACES.worried, lx: 10}} />
          </Pos>
          <Pos x={lx} y={990} s={0.92}>
            <Lera rimDx={-8} legs={f < 40 ? 'walk' : 'sit'} dir={-1} phase={f / 26} face={{...FACES.smile, lx: -10}} />
          </Pos>
          {f >= reward && <Sparkle x={960} y={320} s={0.8} />}
        </Chars>
      </Cam>
      <Toast text="НАГРАДА ПОЛУЧЕНА" sub="не из игры" start={reward} dur={Math.max(40, d - reward - 2)} color="#FF9AD5" icon="♥" />
      <Vignette />
    </AbsoluteFill>
  );
};

const BoxAgain: React.FC<{d: number}> = ({d}) => (
  <AbsoluteFill>
    <Cam dur={d} from={1.0} to={1.12} oy="80%">
      <Landing />
      <Light x="48%" y="12%" color="rgba(255,240,180,0.35)" size="45%" />
      <Dust n={30} area={[700, 100, 500, 800]} />
      <Chars>
        <Box x={960} y={900} glow={0.6} />
      </Chars>
    </Cam>
    <Vignette />
  </AbsoluteFill>
);

const RuleFive: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const txt = at('Первый игрок');
  return (
    <AbsoluteFill style={{background: '#0D0C1F'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,210,120,0.18) 0%, rgba(0,0,0,0) 70%)'}} />
      <Cam dur={d} from={1.0} to={1.06}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: 'rotate(-2deg)', background: '#EFE8D8', width: 1200, padding: '60px 70px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', fontFamily: FONT, color: '#1C1A24', textAlign: 'center'}}>
            <div style={{fontWeight: 900, fontSize: 60, color: '#B02A3A', letterSpacing: 6}}>ПРАВИЛО №5</div>
            <div style={{fontWeight: 900, fontSize: 76, marginTop: 30, lineHeight: 1.15, opacity: ramp(f, txt, 10)}}>ПЕРВЫЙ ИГРОК ВЫБИРАЕТ СЛЕДУЮЩЕГО</div>
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Blank: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#8C6440'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0) 44%, #A97E52 44%, #A97E52 56%, rgba(0,0,0,0) 56%)'}} />
      <Cam dur={d} from={1.0} to={1.1}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: 'rotate(-3deg)', background: '#F2EBDD', width: 1100, padding: '60px 70px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', fontFamily: FONT, color: '#1C1A24', textAlign: 'center'}}>
            <div style={{fontWeight: 900, fontSize: 92}}>
              ТОЛЬКО ДЛЯ <span style={{borderBottom: '8px solid #1C1A24', display: 'inline-block', width: 300}}>{Math.floor(f / 12) % 2 ? '' : ' '}</span>
            </div>
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette s={0.9} />
    </AbsoluteFill>
  );
};

export const S09: SceneDef = {
  id: 'S09',
  shots: [
    {cue: 'Девятнадцатое', C: Midnight, hud: false},
    {cue: 'Игра выходит', C: Release},
    {cue: 'И интерфейс', C: Melt},
    {cue: 'Но Лера', C: Together, hud: false},
    {cue: 'А вечером', C: BoxAgain, hud: false},
    {cue: 'Внутри', C: RuleFive, hud: false},
    {cue: 'И ещё одна', C: Blank, hud: false},
  ],
};
