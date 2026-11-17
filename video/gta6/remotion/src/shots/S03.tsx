import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, ramp} from '../lib/theme';
import {Bedroom} from '../lib/Sets';
import {Cam, Light, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {FACES, Stickman} from '../lib/Stickman';
import {Star} from '../lib/UI';

const Night: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const dawn = interpolate(f, [0, d], [0, 0.7], clamp);
  const write = Math.sin(f / 3) * 6;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.05} to={1.12} ox="50%" oy="65%">
        <Bedroom dawn={dawn} tv="#2A3C78" />
        <Light x="80%" y="35%" color={`rgba(255,170,110,${0.35 * dawn})`} size="50%" />
        <Chars>
          <rect x={720} y={760} width={480} height={20} fill="#3A2A2A" />
          <rect x={860} y={740} width={120} height={20} rx={3} fill="#EDE6D6" transform="rotate(-4 920 750)" />
          <Pos x={960} y={1010} s={1.0}>
            <Stickman color={C.hero} rim={C.rimWarm} rimDx={9} legs="sit" armL={[30, -60]} armR={[34 + write, -88]} face={{eyes: 'oval', eyeOpen: 0.55, mouth: 'line', ly: 8, brow: 6}} headTilt={6} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: 1200, top: 200, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#EDE7DA', letterSpacing: 4, opacity: ramp(f, 10, 10)}}>
          {String(Math.floor(interpolate(f, [0, d], [3, 7], clamp))).padStart(2, '0')}:{String(Math.floor(interpolate(f, [0, d], [14, 50], clamp) % 60)).padStart(2, '0')}
        </div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const RULES = [
  {n: '1', t: 'ЧТО В ИГРЕ — ТО В ЖИЗНИ', cue: 'Правило первое'},
  {n: '2', t: 'ДЕНЬГИ НАСТОЯЩИЕ', cue: 'Правило второе'},
  {n: '3', t: 'ЗВЁЗДЫ — ТОЖЕ', cue: 'Правило третье'},
  {n: '4', t: 'СОХРАНИТЬСЯ НЕЛЬЗЯ', cue: 'Правило четвёртое'},
  {n: '5', t: '???????????????', cue: 'А пятое'},
];

const Illustration: React.FC<{i: number; f: number; t: number; at: (p: string) => number}> = ({i, f, t, at}) => {
  const k = ramp(f, t, 10, backOut);
  const style: React.CSSProperties = {position: 'absolute', left: 1180, top: 160, width: 640, height: 760, transform: `scale(${k})`, transformOrigin: '50% 50%'};
  if (i === 0)
    return (
      <div style={style}>
        <svg width={640} height={760}>
          <rect x={30} y={150} width={280} height={190} rx={14} fill="#2A3C78" stroke="#101018" strokeWidth={14} />
          <g transform="translate(170 330) scale(0.3)"><Stickman color={C.hero} rim={C.rimCold} armL={[160, 12]} armR={[160, 12]} legs="jump" face={FACES.happy} /></g>
          <text x={350} y={260} fontFamily="Inter" fontWeight={900} fontSize={80} fill={C.gold}>=</text>
          <g transform="translate(520 640) scale(0.62)"><Stickman color={C.hero} rim={C.rimCold} armL={[160, 12]} armR={[160, 12]} legs="jump" face={FACES.scream} /></g>
        </svg>
      </div>
    );
  if (i === 1) {
    const b = ramp(f, t + 10, 12);
    return (
      <div style={style}>
        <svg width={640} height={760}>
          {[0, 1, 2, 3, 4].map((j) => (
            <g key={j} transform={`translate(${320 + (j - 2) * 60 * b} ${380 - j * 10}) rotate(${(j - 2) * 12 * b})`}>
              <rect x={-150} y={-75} width={300} height={150} rx={10} fill="#5FBF6E" stroke="#1E4D2A" strokeWidth={8} />
              <circle r={40} fill="none" stroke="#1E4D2A" strokeWidth={8} />
              <text x={0} y={18} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={52} fill="#1E4D2A">$</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }
  if (i === 2) {
    const one = at('Одна');
    const five = at('Пять');
    const n = f >= five ? 5 : f >= one ? 1 : 0;
    return (
      <div style={{...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>
        <div style={{display: 'flex', gap: 10}}>{[0, 1, 2, 3, 4].map((j) => <Star key={j} on={j < n ? 1 : 0} size={100} flash={n === 5 ? '#FF4D5E' : undefined} />)}</div>
        <svg width={300} height={340}>
          <g transform="translate(150 330) scale(0.5)">
            <Stickman color={C.hero} rim={C.rimCold} face={n === 5 ? FACES.scream : n === 1 ? FACES.worried : FACES.neutral} armL={n === 5 ? [150, 85] : [10, 6]} armR={n === 5 ? [150, 85] : [10, 6]} />
          </g>
        </svg>
      </div>
    );
  }
  if (i === 3)
    return (
      <div style={style}>
        <svg width={640} height={760}>
          <g transform="translate(320 360)">
            <rect x={-170} y={-170} width={340} height={340} rx={30} fill="#3E5F9A" stroke="#101018" strokeWidth={14} />
            <rect x={-110} y={-170} width={220} height={130} fill="#C9D2E6" />
            <rect x={-120} y={20} width={240} height={150} rx={10} fill="#E9ECF4" />
            <line x1={-220} y1={-220} x2={220} y2={220} stroke={C.red} strokeWidth={34} strokeLinecap="round" opacity={ramp(f, t + 14, 6)} />
          </g>
        </svg>
      </div>
    );
  return (
    <div style={{...style, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 320, color: C.gold, textShadow: '0 0 40px rgba(255,190,70,0.6)'}}>?</div>
  );
};

const Rules: React.FC<{d: number; at: (p: string) => number}> = ({d, at}) => {
  const f = useCurrentFrame();
  const ts = RULES.map((r) => at(r.cue));
  const cur = ts.reduce((a, t, i) => (f >= t ? i : a), -1);
  const strike = at('зачёркнуто');
  const note = at('Под ним');
  return (
    <AbsoluteFill style={{background: '#0D0C1F'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 70% at 30% 50%, rgba(255,220,160,0.12) 0%, rgba(0,0,0,0) 70%)'}} />
      <Cam dur={d} from={1.0} to={1.04} ox="30%" punch={ts.slice(1)} punchK={0.025}>
        <div style={{position: 'absolute', left: 110, top: 90, width: 1000, height: 900, background: '#EFE8D8', borderRadius: 10, boxShadow: '0 30px 80px rgba(0,0,0,0.6)', transform: 'rotate(-1.5deg)', fontFamily: FONT, padding: '50px 60px', boxSizing: 'border-box',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(60,90,160,0.18) 0 2px, rgba(0,0,0,0) 2px 76px)', backgroundPosition: '0 150px'}}>
          <div style={{fontWeight: 900, fontSize: 76, color: '#1C1A24', letterSpacing: 6}}>ПРАВИЛА</div>
          {RULES.map((r, i) => {
            const vis = ramp(f, ts[i], 8);
            const active = i === cur;
            const isFive = i === 4;
            return (
              <div key={i} style={{position: 'relative', marginTop: 34, display: 'flex', gap: 26, alignItems: 'baseline', opacity: vis, transform: `translateX(${(1 - vis) * -30}px)`}}>
                <div style={{fontWeight: 900, fontSize: 64, color: active ? '#B02A3A' : '#5A566A', width: 50}}>{r.n}.</div>
                <div style={{fontWeight: 900, fontSize: 58, color: active ? '#1C1A24' : '#6A6678', background: active ? 'rgba(255,210,64,0.45)' : 'transparent', padding: '0 10px', borderRadius: 6}}>{r.t}</div>
                {isFive && <div style={{position: 'absolute', left: 60, top: 40, height: 10, width: `${86 * ramp(f, strike, 10)}%`, background: '#B02A3A', borderRadius: 5}} />}
              </div>
            );
          })}
          <div style={{marginTop: 30, marginLeft: 76, fontWeight: 800, fontSize: 44, color: '#B02A3A', fontStyle: 'italic', opacity: ramp(f, note, 10), transform: 'rotate(-3deg)'}}>«Узнаешь в конце»</div>
        </div>
      </Cam>
      {RULES.map((r, i) => (i === cur ? <Illustration key={i} i={i} f={f} t={ts[i]} at={at} /> : null))}
      <Vignette s={0.7} />
    </AbsoluteFill>
  );
};

export const S03: SceneDef = {
  id: 'S03',
  shots: [
    {cue: 'До', C: Night, hud: false},
    {cue: 'Правило первое', C: Rules, hud: false},
  ],
};
