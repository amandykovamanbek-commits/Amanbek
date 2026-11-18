import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Emoji, Header, lin, Ornament, OrnamentStrip, popIn, rise, sp, Theme, THEMES, FONT} from './ui';

export type SceneProps = {t: number; p: number[]; theme: Theme; len: number};

/* =============== 1. HOOK =============== */
export const Hook: React.FC<SceneProps> = ({t, p, theme}) => {
  const sun = sp(t, p[0], 18, 60);
  const hills = sp(t, p[0] + 4, 16, 70);
  const title = 'Күзгі асар';
  return (
    <AbsoluteFill>
      {/* sun + rays */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 300,
          top: 120 + (1 - sun) * 500,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #F7C94B 0%, #F2B227 55%, #E9951E 100%)',
          boxShadow: '0 0 160px 40px rgba(242,178,39,0.35)',
          opacity: lin(t, 0, 10),
        }}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.18 * sun}}>
        <g transform={`translate(960 420) rotate(${t * 0.25})`}>
          {Array.from({length: 18}).map((_, i) => (
            <rect key={i} x={-14} y={-900} width={28} height={480} rx={14} fill="#F2B227" transform={`rotate(${i * 20})`} />
          ))}
        </g>
      </svg>
      {/* hills */}
      <svg width={1920} height={420} viewBox="0 0 1920 420" style={{position: 'absolute', bottom: -(1 - hills) * 420}}>
        <path d="M0,200 C320,90 620,180 960,130 C1300,80 1600,170 1920,110 L1920,420 L0,420Z" fill="#3F7A4D" />
        <path d="M0,290 C380,200 760,300 1100,250 C1450,200 1700,280 1920,240 L1920,420 L0,420Z" fill="#2E5B3A" />
        <path d="M0,360 C420,320 900,380 1300,350 C1600,330 1800,360 1920,350 L1920,420 L0,420Z" fill="#23472D" />
      </svg>
      {/* title */}
      <div style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center'}}>
        <div style={{fontSize: 200, fontWeight: 900, color: theme.fg, letterSpacing: -6, lineHeight: 1, textShadow: '0 10px 40px rgba(42,26,16,0.45)'}}>
          {title.split('').map((ch, i) => {
            const at = p[1] + i * 2;
            const s = sp(t, at, 11, 170);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'pre',
                  opacity: lin(t, at, at + 4),
                  transform: `translateY(${(1 - s) * -140}px) rotate(${(1 - s) * (i % 2 ? 25 : -25)}deg)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{...rise(t, p[2], 50), fontSize: 104, fontWeight: 800, color: '#FFF8EE', letterSpacing: -2, marginTop: 4, textShadow: '0 6px 0 #B3361D, 0 12px 40px rgba(42,26,16,0.6)'}}>
          жәрменкесі
        </div>
        <div style={{...popIn(t, p[3]), display: 'inline-block', marginTop: 34}}>
          <div
            style={{
              background: theme.accent2,
              color: '#FFF8EE',
              fontSize: 46,
              fontWeight: 800,
              padding: '18px 40px',
              borderRadius: 999,
              boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
            }}
          >
            «Табиғатқа қамқорлық жасаймыз» акциясы
          </div>
        </div>
        <div style={{...rise(t, p[4], 30), marginTop: 28, fontSize: 38, fontWeight: 700, color: '#FFF3E0'}}>
          Мектепалды даярлық тобы &nbsp;·&nbsp; Мерекелік шара
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =============== 2. БІЛІМ БЕРУ САЛАСЫ =============== */
const SALA = [
  {e: '🌳', t: 'Қоршаған орта', c: '#2E5B3A'},
  {e: '🗣️', t: 'Сөйлеуді дамыту', c: '#EE6A1F'},
  {e: '🔢', t: 'Математика', c: '#B3361D'},
  {e: '🎵', t: 'Музыка', c: '#D9962B'},
];
export const Sala: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҰЙЫМДАСТЫРЫЛҒАН ІС-ӘРЕКЕТ" title="Білім беру саласы" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 380, display: 'flex', gap: 36}}>
      {SALA.map((s, i) => (
        <div
          key={i}
          style={{
            ...popIn(t, p[i]),
            flex: 1,
            height: 440,
            background: theme.card,
            borderRadius: 40,
            boxShadow: '0 20px 50px rgba(120,70,20,0.16)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 34,
            borderBottom: `16px solid ${s.c}`,
          }}
        >
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 44,
              background: s.c + '22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(${Math.sin((t - p[i]) / 10) * 6}deg)`,
            }}
          >
            <Emoji c={s.e} size={104} />
          </div>
          <div style={{fontSize: 50, fontWeight: 900, color: theme.cardFg, textAlign: 'center', lineHeight: 1.1}}>{s.t}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== 3. МАҚСАТЫ =============== */
const MAQSAT: [string, boolean][] = [['Табиғатқа', true], ['қамқорлыққа', true], ['және', false], ['бірлікке', true], ['тәрбиелеу', false]];
export const Maqsat: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="НЕГЕ ҰЙЫМДАСТЫРАМЫЗ?" title="Мақсаты" />
    <div style={{position: 'absolute', right: 120, top: 110, ...popIn(t, p[0])}}>
      <div
        style={{
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: theme.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          transform: `rotate(${Math.sin(t / 12) * 8}deg)`,
        }}
      >
        <Emoji c="🎯" size={136} />
      </div>
    </div>
    <div style={{position: 'absolute', left: 96, right: 120, top: 430, fontSize: 112, fontWeight: 900, lineHeight: 1.3, letterSpacing: -2, color: theme.fg}}>
      {MAQSAT.map(([w, hi], i) => {
        const at = p[1] + i * 3;
        return (
          <span key={i} style={{display: 'inline-block', marginRight: 30, ...rise(t, at, 50)}}>
            {hi ? <span style={{color: '#2A1A10', background: theme.accent, padding: '0 18px', borderRadius: 18}}>{w}</span> : w}
          </span>
        );
      })}
    </div>
  </AbsoluteFill>
);

/* =============== 4. МІНДЕТТЕРІ =============== */
const MINDET = [
  {h: 'Үйрету', e: '📚', c: '#EE6A1F', t: 'санауды, ажыратуды'},
  {h: 'Дамыту', e: '🧠', c: '#2E5B3A', t: 'сөйлеуді, ойлауды'},
  {h: 'Тәрбиелеу', e: '💛', c: '#B3361D', t: 'табиғатты аялауды'},
];
export const Mindet: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҮШ БАҒЫТ" title="Міндеттері" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 380, display: 'flex', gap: 40}}>
      {MINDET.map((m, i) => (
        <div
          key={i}
          style={{
            ...rise(t, p[i], 120),
            flex: 1,
            height: 440,
            background: theme.card,
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(120,70,20,0.16)',
          }}
        >
          <div style={{background: m.c, padding: '40px 44px', display: 'flex', alignItems: 'center', gap: 20}}>
            <span style={{color: '#FFF8EE', fontSize: 34, fontWeight: 900, opacity: 0.6}}>0{i + 1}</span>
            <span style={{color: '#FFF8EE', fontSize: 66, fontWeight: 900, flex: 1}}>{m.h}</span>
            <Emoji c={m.e} size={70} style={{transform: `scale(${0.6 + 0.4 * sp(t, p[i] + 6, 8, 200)})`}} />
          </div>
          <div style={{padding: '50px 44px', fontSize: 56, fontWeight: 700, lineHeight: 1.2, color: theme.cardFg}}>{m.t}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== 5. ҚҰРАЛ-ЖАБДЫҚТАР =============== */
const QURAL = [
  ['🧺', 'Себеттер'],
  ['🥕', 'Көкөністер'],
  ['🍎', 'Жемістер'],
  ['🪙', 'Ойыншық ақша'],
  ['🐦', 'Жемсауыт'],
  ['🌱', 'Көшеттер'],
];
export const Qural: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="НЕ ДАЙЫНДАДЫҚ?" title="Құрал-жабдықтар" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 340, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30}}>
      {QURAL.map(([e, l], i) => (
        <div
          key={i}
          style={{
            ...popIn(t, p[i]),
            height: 270,
            background: theme.card,
            borderRadius: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 30,
            boxShadow: '0 18px 40px rgba(90,30,0,0.25)',
          }}
        >
          <Emoji c={e} size={120} style={{transform: `translateY(${Math.sin((t + i * 9) / 8) * 6}px)`}} />
          <div style={{fontSize: 50, fontWeight: 900, color: theme.cardFg, lineHeight: 1.05, maxWidth: 300}}>{l}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== 6. ҰІӘ БАРЫСЫ =============== */
const UIA = [
  {n: 'I', e: '🤝', h: 'Шаттық шеңбері', s: 'Алтын Күз шақырады'},
  {n: 'II', e: '🛒', h: 'Жәрменке ойыны', s: 'көшет отырғызу акциясы'},
  {n: 'III', e: '💬', h: 'Рефлексия', s: 'Бүгін не үйрендік?'},
];
export const Uia: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҰЙЫМДАСТЫРЫЛҒАН ІС-ӘРЕКЕТ" title="ҰІӘ барысы" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 380, display: 'flex', alignItems: 'center', gap: 0}}>
      {UIA.map((u, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div style={{width: 70, display: 'flex', justifyContent: 'center', opacity: lin(t, p[i] - 4, p[i] + 2)}}>
              <svg width="56" height="40" viewBox="0 0 56 40">
                <path d="M4 20 H46 M32 6 L48 20 L32 34" stroke={theme.accent} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <div
            style={{
              ...rise(t, p[i], 90),
              flex: 1,
              height: 460,
              background: theme.card,
              borderRadius: 40,
              padding: '40px 40px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: theme.accent,
                  color: '#2A1A10',
                  fontSize: 40,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {u.n}
              </div>
              <Emoji c={u.e} size={96} style={{transform: `rotate(${Math.sin((t - p[i]) / 9) * 8}deg)`}} />
            </div>
            <div>
              <div style={{fontSize: 58, fontWeight: 900, color: theme.cardFg, lineHeight: 1.05}}>{u.h}</div>
              <div style={{fontSize: 38, fontWeight: 600, color: theme.muted, marginTop: 14}}>{u.s}</div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== 7. ҚОРЫТЫНДЫ =============== */
const NATIJE = [
  {h: 'Біледі', c: '#EE6A1F'},
  {h: 'Игереді', c: '#F2B227'},
  {h: 'Меңгереді', c: '#FFF3E0'},
];
export const Natije: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="КҮТІЛЕТІН НӘТИЖЕ" title="Қорытынды" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 400, display: 'flex', gap: 40}}>
      {NATIJE.map((n, i) => {
        const chk = sp(t, p[i] + 4, 9, 220);
        return (
          <div
            key={i}
            style={{
              ...popIn(t, p[i]),
              flex: 1,
              height: 300,
              borderRadius: 40,
              background: 'rgba(255,255,255,0.08)',
              border: `4px solid ${n.c}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 26,
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: n.c,
                color: '#2A1A10',
                fontSize: 62,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${chk}) rotate(${(1 - chk) * -90}deg)`,
              }}
            >
              ✓
            </div>
            <div style={{fontSize: 66, fontWeight: 900, color: theme.fg}}>{n.h}</div>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

/* =============== 8. OUTRO =============== */
export const Outro: React.FC<SceneProps> = ({t, p, theme}) => {
  const words = ['Бірлік', 'бар', 'жерде', '—', 'тірлік', 'бар!'];
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: FONT}}>
      <div style={{...popIn(t, p[0] - 6)}}>
        <Ornament color={theme.accent} size={180} progress={lin(t, p[0] - 6, p[0] + 16)} />
      </div>
      <div style={{fontSize: 140, fontWeight: 900, color: theme.fg, letterSpacing: -4, lineHeight: 1.05, marginTop: 16, maxWidth: 1600}}>
        {words.map((w, i) => {
          const at = p[0] + i * 3;
          const s = sp(t, at, 11, 170);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: 34,
                opacity: lin(t, at, at + 5),
                transform: `translateY(${(1 - s) * 80}px) scale(${0.7 + 0.3 * s})`,
                color: i >= 4 ? theme.accent : theme.fg,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div style={{...rise(t, p[1], 40), marginTop: 46, display: 'inline-block'}}>
        <div style={{background: theme.accent2, color: '#FFF8EE', fontSize: 58, fontWeight: 900, padding: '20px 56px', borderRadius: 999}}>
          Табиғатты бірге аялайық! <Emoji c="🍂" size={56} />
        </div>
      </div>
      <div style={{...rise(t, p[2], 30), marginTop: 40, fontSize: 32, fontWeight: 700, color: theme.muted, letterSpacing: 2}}>
        «КҮЗГІ АСАР» ЖӘРМЕНКЕСІ · МЕКТЕПАЛДЫ ДАЯРЛЫҚ ТОБЫ
      </div>
    </AbsoluteFill>
  );
};

export const SCENES: Record<string, {C: React.FC<SceneProps>; theme: Theme; label: string; origin: [number, number]}> = {
  hook: {C: Hook, theme: THEMES.dark, label: '', origin: [50, 50]},
  sala: {C: Sala, theme: THEMES.cream, label: 'Білім беру саласы', origin: [100, 0]},
  maqsat: {C: Maqsat, theme: THEMES.green, label: 'Мақсаты', origin: [0, 100]},
  mindet: {C: Mindet, theme: THEMES.cream, label: 'Міндеттері', origin: [100, 100]},
  qural: {C: Qural, theme: THEMES.orange, label: 'Құрал-жабдықтар', origin: [0, 0]},
  uia: {C: Uia, theme: THEMES.dark, label: 'ҰІӘ барысы', origin: [100, 50]},
  natije: {C: Natije, theme: THEMES.green, label: 'Қорытынды', origin: [0, 50]},
  outro: {C: Outro, theme: THEMES.dark, label: '', origin: [50, 100]},
};
