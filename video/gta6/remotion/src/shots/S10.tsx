import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, glowText, ramp} from '../lib/theme';
import {Bedroom, Void} from '../lib/Sets';
import {Cam, Light, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Hero} from '../lib/Cast';

const WhoNext: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Bedroom blur={12} tv="#2A3C78" />
      <AbsoluteFill style={{background: 'rgba(4,4,14,0.4)'}} />
      <Light x="50%" y="70%" color="rgba(255,200,110,0.35)" size="45%" />
      <Cam dur={d} from={1.0} to={1.1} oy="60%">
        <Chars>
          <Pos x={960} y={1900} s={2.6}>
            <Hero rim={C.rimWarm} rimDx={8} armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="box" face={FACES.sly} />
          </Pos>
        </Chars>
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 70, fontFamily: FONT}}>
          <div style={{color: C.gold, fontWeight: 900, fontSize: 100, textShadow: glowText, opacity: ramp(f, 4, 10), transform: `scale(${0.92 + 0.08 * ramp(f, 4, 12, backOut)})`}}>КОМУ ОТПРАВИТЬ?</div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const COMMENTS = [
  'Сразу чит на бессмертие и на Луну 🚀',
  'Я бы просто сдал ЕГЭ на 100 😎',
  'Отправь мне, я не буду открывать раньше. Честно.',
  'Первым делом — вернуть все обеды 🍔',
];

const Comments: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Void glow="rgba(140,91,216,0.22)" />
      <Cam dur={d} from={1.0} to={1.04}>
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 90, fontFamily: FONT}}>
          <div style={{color: '#EDE7DA', fontWeight: 900, fontSize: 64, letterSpacing: 4, opacity: ramp(f, 2, 10)}}>НАПИШИ В КОММЕНТАРИЯХ</div>
          <div style={{color: C.gold, fontWeight: 800, fontSize: 40, marginTop: 8, opacity: ramp(f, 10, 10)}}>что бы ты сделал первым?</div>
          <div style={{marginTop: 50, width: 1200}}>
            {COMMENTS.map((c, i) => (
              <div key={i} style={{display: 'flex', gap: 22, alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 26px', marginTop: 16, opacity: ramp(f, 20 + i * 14, 8), transform: `translateY(${(1 - ramp(f, 20 + i * 14, 10)) * 30}px)`}}>
                <div style={{width: 60, height: 60, borderRadius: 30, background: C.head, border: `5px solid ${[C.hero, C.lera, C.coach, C.timur][i]}`, flexShrink: 0}} />
                <div style={{color: '#F4EEE2', fontWeight: 700, fontSize: 36}}>{c}</div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette s={0.7} />
    </AbsoluteFill>
  );
};

const NextBox: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#8C6440'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0) 44%, #A97E52 44%, #A97E52 56%, rgba(0,0,0,0) 56%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,210,120,0.25) 0%, rgba(0,0,0,0) 70%)'}} />
      <Cam dur={d} from={1.0} to={1.12}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: 'rotate(-3deg)', background: '#F2EBDD', width: 1100, padding: '60px 70px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', fontFamily: FONT, color: '#1C1A24', textAlign: 'center'}}>
            <div style={{fontWeight: 900, fontSize: 96}}>ТОЛЬКО ДЛЯ <span style={{color: '#B02A3A', opacity: ramp(f, 10, 10)}}>ТЕБЯ.</span></div>
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette s={0.9} />
    </AbsoluteFill>
  );
};

export const S10: SceneDef = {
  id: 'S10',
  shots: [
    {cue: 'Так', C: WhoNext, hud: false},
    {cue: 'Напиши', C: Comments, hud: false},
    {cue: 'Самый безумный', C: NextBox, hud: false},
  ],
};
