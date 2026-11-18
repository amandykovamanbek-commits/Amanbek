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
  {e: '🌳', t: 'Қоршаған ортамен таныстыру', c: '#2E5B3A'},
  {e: '🗣️', t: 'Сөйлеуді дамыту', c: '#EE6A1F'},
  {e: '🔢', t: 'Математика негіздері', c: '#B3361D'},
  {e: '🎵', t: 'Музыка', c: '#D9962B'},
];
export const Sala: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҰЙЫМДАСТЫРЫЛҒАН ІС-ӘРЕКЕТ" title="Білім беру саласы" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 400, display: 'flex', gap: 36}}>
      {SALA.map((s, i) => (
        <div
          key={i}
          style={{
            ...popIn(t, p[i]),
            flex: 1,
            height: 400,
            background: theme.card,
            borderRadius: 40,
            boxShadow: '0 20px 50px rgba(120,70,20,0.16)',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderBottom: `14px solid ${s.c}`,
          }}
        >
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 34,
              background: s.c + '22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(${Math.sin((t - p[i]) / 14) * 6}deg)`,
            }}
          >
            <Emoji c={s.e} size={78} />
          </div>
          <div style={{fontSize: 44, fontWeight: 800, color: theme.cardFg, lineHeight: 1.12}}>{s.t}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== 3. МАҚСАТЫ =============== */
const MAQSAT: [string, boolean][] = [
  ['Балалардың', false], ['күз', true], ['мезгілі', true], ['мен', false], ['оның', false], ['сыйлары', false], ['туралы', false],
  ['білімін', false], ['бекіту;', false], ['«асар»', true], ['дәстүрі', true], ['арқылы', false], ['бірлікке', true], ['және', false],
  ['табиғатқа', true], ['қамқорлықпен', true], ['қарауға', false], ['тәрбиелеу.', false],
];
export const Maqsat: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="НЕГЕ ҰЙЫМДАСТЫРАМЫЗ?" title="Мақсаты" />
    <div style={{position: 'absolute', right: 120, top: 120, ...popIn(t, p[0])}}>
      <div
        style={{
          width: 230,
          height: 230,
          borderRadius: '50%',
          background: theme.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          transform: `rotate(${Math.sin(t / 20) * 8}deg)`,
        }}
      >
        <Emoji c="🎯" size={130} />
      </div>
    </div>
    <div style={{position: 'absolute', left: 96, right: 200, top: 410, fontSize: 64, fontWeight: 800, lineHeight: 1.28, color: theme.fg}}>
      {MAQSAT.map(([w, hi], i) => {
        const at = p[1] + i * 2.2;
        return (
          <span key={i} style={{display: 'inline-block', marginRight: 20, ...rise(t, at, 30)}}>
            {hi ? (
              <span style={{color: '#2A1A10', background: theme.accent, padding: '0 12px', borderRadius: 12, boxDecorationBreak: 'clone'}}>{w}</span>
            ) : (
              w
            )}
          </span>
        );
      })}
    </div>
  </AbsoluteFill>
);

/* =============== 4. МІНДЕТТЕРІ =============== */
const MINDET = [
  {h: 'Білімділік', e: '📚', c: '#EE6A1F', t: 'Көкөністер мен жемістерді ажыратуды, «сатып алу – сату» ойынында санауды үйрету.'},
  {h: 'Дамытушылық', e: '🧠', c: '#2E5B3A', t: 'Сөздік қорын, байланыстырып сөйлеуді, өзара қарым-қатынас дағдыларын дамыту.'},
  {h: 'Тәрбиелік', e: '💛', c: '#B3361D', t: 'Табиғатқа, еңбекке құрметпен қарауға, бір-біріне көмектесуге тәрбиелеу.'},
];
export const Mindet: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҮШ БАҒЫТ" title="Міндеттері" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 340, display: 'flex', gap: 40}}>
      {MINDET.map((m, i) => (
        <div
          key={i}
          style={{
            ...rise(t, p[i], 120),
            flex: 1,
            height: 560,
            background: theme.card,
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(120,70,20,0.16)',
          }}
        >
          <div style={{background: m.c, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 20}}>
            <span style={{color: '#FFF8EE', fontSize: 30, fontWeight: 900, opacity: 0.6}}>0{i + 1}</span>
            <span style={{color: '#FFF8EE', fontSize: 50, fontWeight: 900, flex: 1}}>{m.h}</span>
            <Emoji c={m.e} size={56} style={{transform: `scale(${0.6 + 0.4 * sp(t, p[i] + 8, 8, 200)})`}} />
          </div>
          <div style={{padding: '36px 40px', fontSize: 44, fontWeight: 600, lineHeight: 1.3, color: theme.cardFg}}>{m.t}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== 5. ҚҰРАЛ-ЖАБДЫҚТАР =============== */
const QURAL = [
  ['🏪', 'Жәрменке дүңгіршектері'],
  ['🥕', 'Көкөністер'],
  ['🍎', 'Жемістер'],
  ['🧺', 'Себеттер'],
  ['🪙', 'Ойыншық ақша'],
  ['🍂', 'Күзгі жапырақтар'],
  ['🐦', 'Құстарға жемсауыт'],
  ['🌱', 'Көшеттер'],
];
export const Qural: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="НЕ ДАЙЫНДАДЫҚ?" title="Құрал-жабдықтар" />
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 330,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 30,
      }}
    >
      {QURAL.map(([e, l], i) => (
        <div
          key={i}
          style={{
            ...popIn(t, p[i]),
            height: 280,
            background: theme.card,
            borderRadius: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            boxShadow: '0 18px 40px rgba(90,30,0,0.25)',
          }}
        >
          <Emoji c={e} size={96} style={{transform: `translateY(${Math.sin((t + i * 9) / 12) * 6}px)`}} />
          <div style={{fontSize: 36, fontWeight: 800, color: theme.cardFg, textAlign: 'center', padding: '0 16px', lineHeight: 1.1}}>{l}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

/* =============== ҰІӘ progress bar =============== */
const STAGES = ['Мотивациялық-қозғаушы', 'Ұйымдастырушылық-ізденіс', 'Рефлексиялық-түзетушілік'];
const Progress: React.FC<{theme: Theme; t: number; active: number}> = ({theme, t, active}) => {
  const fill = interpolate(lin(t, 4, 22), [0, 1], [Math.max(0, active - 1) / 2, active / 2]);
  return (
    <div style={{position: 'absolute', left: 96, right: 96, top: 300, height: 90}}>
      <div style={{position: 'absolute', left: 30, right: 30, top: 28, height: 8, borderRadius: 4, background: theme.muted + '55'}} />
      <div style={{position: 'absolute', left: 30, top: 28, height: 8, borderRadius: 4, background: theme.accent, width: `calc(${fill * 100}% - ${fill * 60}px)`}} />
      {STAGES.map((s, i) => {
        const on = i <= active;
        const cur = i === active;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(${i * 50}% - ${i * 30}px)`,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: i === 0 ? 'flex-start' : i === 1 ? 'center' : 'flex-end',
              transform: i === 1 ? 'translateX(-50%)' : i === 2 ? 'translateX(-100%)' : undefined,
              marginLeft: i === 1 ? 30 : i === 2 ? 60 : 0,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: on ? theme.accent : theme.bg,
                border: `6px solid ${on ? theme.accent : theme.muted + '88'}`,
                color: on ? '#2A1A10' : theme.muted,
                fontWeight: 900,
                fontSize: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${cur ? 0.8 + 0.3 * sp(t, 10, 8, 200) : 1})`,
              }}
            >
              {['I', 'II', 'III'][i]}
            </div>
            <div style={{marginTop: 10, fontSize: 24, fontWeight: 700, color: cur ? theme.fg : theme.muted, whiteSpace: 'nowrap'}}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

/* =============== 6. I кезең =============== */
export const Stage1: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҰІӘ БАРЫСЫ · I КЕЗЕҢ" title="Мотивациялық-қозғаушы" />
    <Progress theme={theme} t={t} active={0} />
    <div style={{position: 'absolute', left: 96, top: 520, display: 'flex', gap: 44, alignItems: 'flex-start'}}>
      <div style={{...popIn(t, p[0]), textAlign: 'center'}}>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #F7C94B, #E9951E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${Math.sin(t / 16) * 6}deg)`,
          }}
        >
          <Emoji c="👸" size={120} />
        </div>
        <div style={{marginTop: 14, fontSize: 34, fontWeight: 800, color: theme.accent}}>Алтын Күз</div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
        <div
          style={{
            ...rise(t, p[1], 40),
            background: theme.card,
            borderRadius: '40px 40px 40px 8px',
            padding: '34px 46px',
            fontSize: 48,
            fontWeight: 700,
            color: theme.cardFg,
            maxWidth: 1240,
            lineHeight: 1.25,
          }}
        >
          «Сәлеметсіздер ме, балалар! Күзгі асар жәрменкесіне қош келдіңіздер!»
        </div>
        <div style={{...rise(t, p[2], 40), display: 'flex', gap: 22, alignItems: 'center'}}>
          <div style={{background: theme.accent2, color: '#FFF8EE', borderRadius: 999, padding: '14px 32px', fontSize: 36, fontWeight: 800}}>
            🤝&nbsp; Шаттық шеңбері
          </div>
          <div style={{fontSize: 40, fontWeight: 700, color: theme.fg}}>
            <span style={{color: theme.accent}}>«Асар»</span> — бәріміз бірлесіп көмектесу
          </div>
        </div>
      </div>
    </div>
  </AbsoluteFill>
);

/* =============== 7. II кезең =============== */
const STEPS = [
  {e: '🎪', h: 'Жәрменкенің ашылуы', t: '«Алтын күз» әні, күзгі би'},
  {e: '🛒', h: '«Жәрменке» рөлдік ойыны', t: 'Сатушы мен сатып алушы, ойыншық ақшамен санау'},
  {e: '🌱', h: '«Табиғатқа қамқорлық» акциясы', t: 'Құстарға жемсауыт ілу, көшет отырғызу, жапырақ жинау'},
  {e: '🧺', h: '«Көкөніс пе, жеміс пе?»', t: 'Дидактикалық ойын: себетке сұрыптау'},
];
export const Stage2: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="ҰІӘ БАРЫСЫ · II КЕЗЕҢ" title="Ұйымдастырушылық-ізденіс" />
    <Progress theme={theme} t={t} active={1} />
    <div style={{position: 'absolute', left: 96, right: 96, top: 470, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30}}>
      {STEPS.map((s, i) => {
        const active = t >= p[i] && (i === 3 || t < p[i + 1]);
        return (
          <div
            key={i}
            style={{
              ...rise(t, p[i], 70),
              background: active ? theme.accent : theme.card,
              borderRadius: 34,
              padding: '26px 34px',
              display: 'flex',
              gap: 28,
              alignItems: 'center',
              boxShadow: '0 18px 44px rgba(120,70,20,0.15)',
              height: 220,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                flexShrink: 0,
                borderRadius: 30,
                background: active ? '#FFF3E0' : theme.bg2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Emoji c={s.e} size={72} />
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: -12,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: theme.accent2,
                  color: '#FFF8EE',
                  fontWeight: 900,
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </div>
            </div>
            <div>
              <div style={{fontSize: 40, fontWeight: 900, color: active ? '#FFF8EE' : theme.cardFg, lineHeight: 1.1}}>{s.h}</div>
              <div style={{fontSize: 32, fontWeight: 600, color: active ? '#FFF3E0' : '#6B4E36', marginTop: 10, lineHeight: 1.25}}>{s.t}</div>
            </div>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

/* =============== 8. III кезең =============== */
export const Stage3: React.FC<SceneProps> = ({t, p, theme}) => {
  const tick = sp(t, p[3], 9, 200);
  return (
    <AbsoluteFill>
      <Header theme={theme} t={t} kicker="ҰІӘ БАРЫСЫ · III КЕЗЕҢ" title="Рефлексиялық-түзетушілік" />
      <Progress theme={theme} t={t} active={2} />
      <div style={{position: 'absolute', left: 96, top: 500, display: 'flex', flexDirection: 'column', gap: 26}}>
        {['Бүгін не үйрендік?', 'Табиғатқа қалай көмектестік?'].map((q, i) => (
          <div
            key={i}
            style={{
              ...rise(t, p[i], 50),
              background: theme.card,
              color: theme.cardFg,
              borderRadius: '36px 36px 36px 8px',
              padding: '24px 40px',
              fontSize: 50,
              fontWeight: 800,
              alignSelf: 'flex-start',
            }}
          >
            💬 {q}
          </div>
        ))}
        <div style={{...rise(t, p[4], 40), fontSize: 42, fontWeight: 700, color: theme.fg, marginTop: 8}}>
          🍎 Алтын Күз балаларға <span style={{color: theme.accent}}>алма сыйлайды</span>
        </div>
      </div>
      <div style={{position: 'absolute', right: 110, top: 520, ...popIn(t, p[2])}}>
        <div style={{background: theme.bg2, borderRadius: 40, padding: '30px 36px', textAlign: 'center'}}>
          <div style={{fontSize: 28, fontWeight: 800, color: theme.muted, letterSpacing: 2, marginBottom: 18}}>КӨҢІЛ-КҮЙ</div>
          <div style={{display: 'flex', gap: 22}}>
            {['😊', '🙂', '😐'].map((e, i) => (
              <div
                key={i}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 30,
                  background: i === 0 ? theme.accent : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: i === 0 ? `scale(${1 + 0.15 * tick})` : undefined,
                  position: 'relative',
                }}
              >
                <Emoji c={e} size={76} />
                {i === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -14,
                      top: -14,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#FFF3E0',
                      color: '#2E5B3A',
                      fontSize: 32,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: `scale(${tick})`,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =============== 9. ҚОРЫТЫНДЫ =============== */
const NATIJE = [
  {h: 'Біледі', c: '#EE6A1F', t: 'күздің белгілерін, көкөністер мен жемістерді, «асар» дәстүрінің мәнін'},
  {h: 'Игереді', c: '#2E5B3A', t: '«сатып алу – сату» ойынында санауды, бірлесіп әрекет етуді'},
  {h: 'Меңгереді', c: '#B3361D', t: 'табиғатқа қамқорлық жасау дағдыларын'},
];
export const Natije: React.FC<SceneProps> = ({t, p, theme}) => (
  <AbsoluteFill>
    <Header theme={theme} t={t} kicker="КҮТІЛЕТІН НӘТИЖЕ" title="Қорытынды" />
    <div style={{position: 'absolute', left: 96, right: 96, top: 350, display: 'flex', flexDirection: 'column', gap: 30}}>
      {NATIJE.map((n, i) => {
        const chk = sp(t, p[i] + 6, 9, 220);
        return (
          <div
            key={i}
            style={{
              ...rise(t, p[i], 60),
              background: theme.card,
              borderRadius: 34,
              padding: '28px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: 34,
              boxShadow: '0 18px 44px rgba(120,70,20,0.14)',
              height: 168,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                background: n.c,
                color: '#FFF8EE',
                fontSize: 48,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: `scale(${chk}) rotate(${(1 - chk) * -90}deg)`,
              }}
            >
              ✓
            </div>
            <div style={{fontSize: 54, fontWeight: 900, color: n.c, width: 330, flexShrink: 0}}>{n.h}</div>
            <div style={{fontSize: 42, fontWeight: 600, color: theme.cardFg, lineHeight: 1.25}}>{n.t}</div>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

/* =============== 10. OUTRO =============== */
export const Outro: React.FC<SceneProps> = ({t, p, theme}) => {
  const words = ['Бірлік', 'бар', 'жерде', '—', 'тірлік', 'бар!'];
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: FONT}}>
      <div style={{...popIn(t, p[0] - 6)}}>
        <Ornament color={theme.accent} size={200} progress={lin(t, p[0] - 6, p[0] + 20)} />
      </div>
      <div style={{fontSize: 140, fontWeight: 900, color: theme.fg, letterSpacing: -4, lineHeight: 1.05, marginTop: 20, maxWidth: 1600}}>
        {words.map((w, i) => {
          const at = p[0] + i * 4;
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
        <div style={{background: theme.accent2, color: '#FFF8EE', fontSize: 54, fontWeight: 900, padding: '20px 54px', borderRadius: 999}}>
          Табиғатты бірге аялайық! <Emoji c="🍂" size={54} />
        </div>
      </div>
      <div style={{...rise(t, p[2], 30), marginTop: 40, fontSize: 32, fontWeight: 700, color: theme.muted, letterSpacing: 2}}>
        «КҮЗГІ АСАР» ЖӘРМЕНКЕСІ · МЕКТЕПАЛДЫ ДАЯРЛЫҚ ТОБЫ
      </div>
      <div style={{position: 'absolute', bottom: 70, opacity: lin(t, p[2], p[2] + 12)}}>
        <OrnamentStrip color={theme.accent} f={t} at={p[2]} n={9} size={44} />
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
  stage1: {C: Stage1, theme: THEMES.dark, label: 'ҰІӘ барысы', origin: [100, 50]},
  stage2: {C: Stage2, theme: THEMES.cream, label: 'ҰІӘ барысы', origin: [0, 50]},
  stage3: {C: Stage3, theme: THEMES.green, label: 'ҰІӘ барысы', origin: [50, 100]},
  natije: {C: Natije, theme: THEMES.cream, label: 'Қорытынды', origin: [100, 0]},
  outro: {C: Outro, theme: THEMES.dark, label: '', origin: [50, 50]},
};
