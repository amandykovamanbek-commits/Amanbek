import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, ramp, rnd} from '../lib/theme';
import {CityNight, Kitchen, Rooftops, Street, Void} from '../lib/Sets';
import {Cam, Light, Siren, Spotlight, Vignette} from '../lib/FX';
import {Chars, Pos, Screen} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Crowd, Hero, Lera, Mom} from '../lib/Cast';
import {CCTV, Heli, PoliceCar} from '../lib/Props';
import {Menu, Star} from '../lib/UI';
import {RoofStandoff} from './S00';

const Helicopter: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const hx = interpolate(f, [0, d], [300, 1300], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06}>
        <CityNight lit={0.3} red={0.3} />
        <Spotlight x0={hx} y0={250} sweep={420} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <Heli x={hx} y={180} f={f} s={1.1} />
        </svg>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Sirens: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05} dx={-60}>
        <CityNight lit={0.25} moon={false} red={0.2} blur={2} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <PoliceCar x={520} y={1000} f={f} s={1.2} />
          <PoliceCar x={1400} y={1020} f={f + 3} s={1.35} />
        </svg>
        <Siren />
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const News: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const photo = at('На фото');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05}>
        <Screen scan>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, #1C2A5A, #0E1430)', fontFamily: FONT}}>
            <div style={{position: 'absolute', left: 80, top: 80, background: C.red, color: '#FFF', fontWeight: 900, fontSize: 48, padding: '10px 26px', letterSpacing: 6, opacity: Math.floor(f / 15) % 2 ? 1 : 0.75}}>СРОЧНО</div>
            <div style={{position: 'absolute', left: 80, top: 190, width: 960, color: '#F4EEE2', fontWeight: 900, fontSize: 70, lineHeight: 1.1}}>Неизвестный устроил хаос в школе №7</div>
            <div style={{position: 'absolute', right: 120, top: 150, width: 620, height: 520, background: '#2A2A34', border: '10px solid #F4EEE2', transform: `rotate(3deg) scale(${ramp(f, photo, 10, backOut)})`, overflow: 'hidden', filter: 'grayscale(0.6) contrast(1.1)'}}>
              <svg width={600} height={500}>
                <rect width={600} height={500} fill="#3A3A46" />
                <g transform="translate(300 900) scale(1.55)" style={{filter: 'blur(3px)'}}>
                  <Hero rim={C.rimCold} face={{eyes: 'oval', mouth: 'none'}} />
                </g>
              </svg>
              <div style={{position: 'absolute', left: 18, top: 14, color: C.red, fontWeight: 900, fontSize: 30}}>● REC  КАМЕРА 14</div>
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, background: '#F4EEE2', display: 'flex', alignItems: 'center', overflow: 'hidden'}}>
              <div style={{whiteSpace: 'nowrap', transform: `translateX(${1920 - f * 9}px)`, color: '#0B0A0F', fontWeight: 900, fontSize: 52}}>
                ДЕНЬГИ С НЕБА • ГРОЗА ПО ЗАКАЗУ • ПРЫЖОК ЧЕРЕЗ ЗАБОР • ПОЛИЦИЯ ИЩЕТ ПОДРОСТКА В ОРАНЖЕВОМ ХУДИ •
              </div>
            </div>
          </AbsoluteFill>
        </Screen>
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const MomKnows: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Kitchen blur={8} />
      <AbsoluteFill style={{background: 'rgba(10,20,60,0.35)'}} />
      <Light x="30%" y="50%" color="rgba(110,160,255,0.4)" size="45%" />
      <Cam dur={d} from={1.0} to={1.1}>
        <Chars>
          <Pos x={960} y={2600} s={4}>
            <Mom rim="#9FC0FF" rimDx={-8} face={f > 14 ? {...FACES.angry, mouth: 'line', lx: -8} : {...FACES.shock, lx: -8}} />
          </Pos>
        </Chars>
        {f > 14 && <div style={{position: 'absolute', left: 1350, top: 240, fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.red, transform: `scale(${ramp(f, 14, 6, backOut)})`, textShadow: '0 0 24px rgba(255,77,94,0.6)'}}>!!!</div>}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const FiveStars: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Void tint="#12081A" glow="rgba(255,60,90,0.2)" />
      <Siren />
      <Cam dur={d} from={1.0} to={1.12}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{display: 'flex', gap: 20}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{transform: `scale(${ramp(f, i * 3, 8, backOut)})`}}>
                <Star on={1} size={200} flash={Math.floor(f / 6) % 2 ? '#FF4D5E' : '#4DA3FF'} />
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Hunters: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const cams = at('каждая камера');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06}>
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.62)'}} />
        <Siren o={0.6} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          {f >= cams && [[200, 380], [1720, 360, 1]].map(([x, y, fl], i) => <CCTV key={i} x={x} y={y} f={f} s={1.3} flip={!!fl} />)}
        </svg>
        <Chars>
          <Crowd n={7} x0={160} x1={1760} y={1040} s={0.85} seed={81} face={{...FACES.angry, mouth: 'line'}} f={f} arms={(i) => (i % 2 ? [[10, 6], [95, -5]] : [[10, 6], [10, 6]])} />
        </Chars>
        {Array.from({length: 7}).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: 160 + ((1760 - 160) * (i + 0.5)) / 7, top: 470 + Math.sin(f / 7 + i) * 6, transform: `translate(-50%,-50%) scale(${ramp(f, 4 + i * 3, 8, backOut)})`, fontFamily: FONT, fontWeight: 900, fontSize: 24, color: '#FFF', background: C.red, padding: '6px 12px', borderRadius: 8, boxShadow: '0 0 16px rgba(255,77,94,0.7)'}}>ПОЙМАТЬ</div>
        ))}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const RoofRun: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Rooftops offset={f * 18} />
      <Spotlight x0={1700} y0={-40} sweep={180} o={0.8} />
      <Chars>
        <Pos x={820} y={1080 - 380} s={1.0}>
          <Hero rim={C.rimCold} rimDx={-8} legs="run" phase={f / 11} armL={ARMS.run(f / 11)[0]} armR={ARMS.run(f / 11)[1]} face={FACES.scared} lean={10} />
        </Pos>
        <Heli x={1650} y={120} f={f} s={0.9} />
      </Chars>
      <Siren o={0.4} />
      <Vignette />
    </AbsoluteFill>
  );
};

const LeraTrapped: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const trap = at('Её зажала');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.12} ox="50%" oy="55%">
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.6)'}} />
        <Siren o={0.5} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 18% 40% at 50% 60%, rgba(255,250,220,0.35) 0%, rgba(0,0,0,0) 100%)'}} />
        <Chars>
          <Crowd n={5} x0={200} x1={900} y={1000} s={0.9} seed={91} face="angry" f={f} jitter={f >= trap ? 6 : 2} arms={() => [[60, -40], [60, -40]]} />
          <Crowd n={5} x0={1020} x1={1720} y={1000} s={0.9} seed={97} face="angry" f={f} jitter={f >= trap ? 6 : 2} arms={() => [[60, -40], [60, -40]]} />
          <Pos x={960} y={990} s={0.95}>
            <Lera face={FACES.scared} armL={ARMS.headGrab[0]} armR={ARMS.headGrab[1]} />
          </Pos>
        </Chars>
      </Cam>
      <Vignette s={0.9} />
    </AbsoluteFill>
  );
};

const PauseFail: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const err = at('Ничего');
  return (
    <AbsoluteFill style={{background: '#0A0A16'}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
        <div style={{width: 300, height: 300, borderRadius: 150, border: `14px solid ${f >= err ? C.red : '#F4EEE2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, transform: `scale(${f > 6 && f < 12 ? 0.9 : 1}) translateX(${f >= err && f < err + 14 ? Math.sin(f * 3) * 14 : 0}px)`}}>
          <div style={{width: 44, height: 150, background: f >= err ? C.red : '#F4EEE2', borderRadius: 8}} />
          <div style={{width: 44, height: 150, background: f >= err ? C.red : '#F4EEE2', borderRadius: 8}} />
        </div>
        {f >= err && <div style={{marginTop: 50, color: C.red, fontWeight: 900, fontSize: 80, letterSpacing: 6, textShadow: '0 0 24px rgba(255,77,94,0.6)', opacity: ramp(f, err, 6)}}>ПАУЗА НЕДОСТУПНА</div>}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

const Restart: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const losses = [
    {t: 'Деньги: $1 048 000', cue: 'Вместе с деньгами'},
    {t: 'Репутация в школе', cue: 'Вместе с репутацией'},
    {t: 'Улыбка Леры', cue: 'Вместе с той'},
  ].map((l) => ({...l, f: at(l.cue)}));
  return (
    <AbsoluteFill>
      <Void tint="#0A0712" glow="rgba(255,77,94,0.15)" />
      <AbsoluteFill style={{transform: 'translateY(-150px)'}}>
        <Menu title="МЕНЮ" items={['Продолжить', 'Сохранить игру', 'НАЧАТЬ ЗАНОВО']} active={2} danger={[2]} disabled={[0, 1]} bg={0} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', gap: 40, fontFamily: FONT}}>
        {losses.map((l, i) => (
          <div key={i} style={{position: 'relative', opacity: ramp(f, l.f, 8) * (f > l.f + 30 ? 0.45 : 1), color: '#F4EEE2', fontWeight: 800, fontSize: 38, background: 'rgba(255,255,255,0.06)', padding: '14px 26px', borderRadius: 12}}>
            {l.t}
            <div style={{position: 'absolute', left: 10, right: 10, top: '50%', height: 6, background: C.red, transform: `scaleX(${ramp(f, l.f + 14, 10)})`, transformOrigin: 'left'}} />
          </div>
        ))}
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const S07: SceneDef = {
  id: 'S07',
  shots: [
    {cue: 'Четыре', C: Helicopter},
    {cue: 'Во дворах', C: Sirens},
    {cue: 'В новостях', C: News, hud: false},
    {cue: 'Мама узнаёт', C: MomKnows, hud: false},
    {cue: 'Пять звёзд', C: FiveStars, hud: false},
    {cue: 'Город ведёт', C: Hunters},
    {cue: 'Ты бежишь', C: RoofRun},
    {cue: 'А потом ты видишь', C: LeraTrapped},
    {cue: 'Ты жмёшь паузу', C: PauseFail, hud: false},
    {cue: 'И вот ты здесь', C: (p) => <RoofStandoff d={p.d} punch={[4]} />},
    {cue: 'В меню', C: Restart, hud: false},
  ],
};
