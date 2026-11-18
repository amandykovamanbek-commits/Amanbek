import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import TL from './timeline.json';

export const FONT = '"Inter Display", "Inter", "Noto Color Emoji", sans-serif';
export const EMOJI = '"Noto Color Emoji"';
export const WIPE = TL.wipe;

export type Theme = {bg: string; bg2: string; fg: string; accent: string; accent2: string; card: string; cardFg: string; muted: string};
export const THEMES: Record<string, Theme> = {
  cream: {bg: '#FFF3E0', bg2: '#FBE3C2', fg: '#2A1A10', accent: '#EE6A1F', accent2: '#2E5B3A', card: '#FFFFFF', cardFg: '#2A1A10', muted: '#8A6A50'},
  green: {bg: '#2E5B3A', bg2: '#27503A', fg: '#FFF3E0', accent: '#F2B227', accent2: '#EE6A1F', card: '#FFF3E0', cardFg: '#2A1A10', muted: '#CFE0C8'},
  orange: {bg: '#EE6A1F', bg2: '#E25A14', fg: '#FFF8EE', accent: '#2A1A10', accent2: '#F2B227', card: '#FFF3E0', cardFg: '#2A1A10', muted: '#FFE1C8'},
  dark: {bg: '#2A1A10', bg2: '#3A2414', fg: '#FFF3E0', accent: '#F2B227', accent2: '#EE6A1F', card: '#3B2718', cardFg: '#FFF3E0', muted: '#C9A98A'},
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const sp = (f: number, at: number, damping = 13, stiffness = 150) =>
  spring({frame: f - at, fps: 30, config: {damping, stiffness, mass: 0.7}});
export const lin = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});

/** Appear: slide up + fade with a springy settle. */
export const rise = (f: number, at: number, dist = 50): React.CSSProperties => {
  const s = sp(f, at);
  return {opacity: lin(f, at, at + 8), transform: `translateY(${(1 - s) * dist}px)`};
};
/** Pop: scale from 0.6 with overshoot. */
export const popIn = (f: number, at: number): React.CSSProperties => {
  const s = sp(f, at, 10, 180);
  return {opacity: lin(f, at, at + 5), transform: `scale(${0.55 + 0.45 * s})`};
};

/* ---------- deterministic random ---------- */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- leaves ---------- */
const LEAF_COLORS = ['#EE6A1F', '#F2B227', '#B3361D', '#D9822B', '#C9A227'];
export const LeafShape: React.FC<{color: string; kind: number}> = ({color, kind}) =>
  kind === 0 ? (
    <svg viewBox="-50 -50 100 100" width="100%" height="100%">
      <path d="M0,-44 C26,-30 34,6 0,44 C-34,6 -26,-30 0,-44Z" fill={color} />
      <path d="M0,-36 L0,46" stroke="rgba(0,0,0,0.22)" strokeWidth="3" strokeLinecap="round" />
      <path d="M0,-6 L14,-18 M0,10 L-15,-2 M0,22 L13,12" stroke="rgba(0,0,0,0.18)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="-50 -50 100 100" width="100%" height="100%">
      <path
        d="M0,-46 L9,-22 L30,-34 L24,-8 L44,-2 L22,10 L28,30 L6,20 L0,44 L-6,20 L-28,30 L-22,10 L-44,-2 L-24,-8 L-30,-34 L-9,-22Z"
        fill={color}
        strokeLinejoin="round"
        stroke={color}
        strokeWidth="6"
      />
      <path d="M0,-30 L0,46 M0,6 L-20,-14 M0,6 L20,-14" stroke="rgba(0,0,0,0.2)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

export const Leaves: React.FC<{g: number; count?: number; opacity?: number}> = ({g, count = 12, opacity = 0.9}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: count}).map((_, i) => {
      const size = 38 + rnd(i + 1) * 46;
      const speed = 1.6 + rnd(i + 2) * 1.8;
      const x0 = rnd(i + 3) * 1920;
      const span = 1080 + 240;
      const y = ((g * speed + rnd(i + 4) * span) % span) - 120;
      const sway = Math.sin(g / (22 + rnd(i + 5) * 18) + i) * (40 + rnd(i + 6) * 60);
      const rot = g * (0.8 + rnd(i + 7) * 1.6) * (i % 2 ? 1 : -1) + rnd(i) * 360;
      const flip = Math.cos(g / (14 + rnd(i + 8) * 10) + i);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x0 + sway,
            top: y,
            width: size,
            height: size,
            opacity,
            transform: `rotate(${rot}deg) scaleX(${0.35 + 0.65 * Math.abs(flip)})`,
          }}
        >
          <LeafShape color={LEAF_COLORS[i % LEAF_COLORS.length]} kind={i % 3 === 0 ? 1 : 0} />
        </div>
      );
    })}
  </AbsoluteFill>
);

/* ---------- Kazakh "qoshqar muiz" ornament ---------- */
export const Ornament: React.FC<{color: string; size: number; progress?: number; style?: React.CSSProperties}> = ({
  color,
  size,
  progress = 1,
  style,
}) => {
  const half = 'M0,60 L0,10 C0,-30 -52,-36 -58,-4 C-62,18 -40,30 -28,16 C-20,6 -28,-6 -36,0';
  const L = 260;
  return (
    <svg viewBox="-80 -50 160 120" width={size} height={size * 0.75} style={style}>
      {[1, -1].map((s) => (
        <path
          key={s}
          d={half}
          transform={`scale(${s},1)`}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={L}
          strokeDashoffset={L * (1 - progress)}
        />
      ))}
    </svg>
  );
};

/** Ornament border strip: repeated motif drawn in. */
export const OrnamentStrip: React.FC<{color: string; f: number; at: number; n?: number; size?: number}> = ({
  color,
  f,
  at,
  n = 5,
  size = 46,
}) => (
  <div style={{display: 'flex', gap: 6}}>
    {Array.from({length: n}).map((_, i) => (
      <Ornament key={i} color={color} size={size} progress={lin(f, at + i * 3, at + i * 3 + 18)} />
    ))}
  </div>
);

/* ---------- Scene frame: circular wipe in, content exit ---------- */
export const Scene: React.FC<{
  theme: Theme;
  t: number; // local time, 0 = bar boundary
  len: number;
  g: number; // global frame
  origin: [number, number];
  first?: boolean;
  index: number;
  label: string;
  leaves?: number;
  children: React.ReactNode;
}> = ({theme, t, len, g, origin, first, index, label, leaves = 9, children}) => {
  const r = first ? 160 : interpolate(t, [-WIPE, 0], [0, 160], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const exit = lin(t, len - 6, len + 8);
  return (
    <AbsoluteFill style={{clipPath: `circle(${r}% at ${origin[0]}% ${origin[1]}%)`, background: theme.bg, fontFamily: FONT}}>
      {/* soft background shapes */}
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          background: theme.bg2,
          right: -380 + Math.sin(g / 90) * 30,
          top: -460 + Math.cos(g / 110) * 30,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: theme.bg2,
          left: -260 + Math.cos(g / 80) * 25,
          bottom: -330,
        }}
      />
      <Leaves g={g} count={leaves} opacity={0.85} />
      <AbsoluteFill style={{opacity: 1 - exit, transform: `translateY(${-40 * exit}px)`}}>{children}</AbsoluteFill>
      {index > 0 && index < TL.scenes.length - 1 && (
        <div
          style={{
            position: 'absolute',
            left: 96,
            right: 96,
            bottom: 44,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: theme.muted,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 1,
            opacity: lin(t, 6, 18),
          }}
        >
          <span>«КҮЗГІ АСАР» ЖӘРМЕНКЕСІ · МАД ТОБЫ</span>
          <span>
            {label} &nbsp;
            <b style={{color: theme.fg}}>{String(index).padStart(2, '0')}</b> / {String(TL.scenes.length - 2).padStart(2, '0')}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Section header: kicker + big title + ornament strip. */
export const Header: React.FC<{theme: Theme; t: number; kicker: string; title: string; at?: number}> = ({
  theme,
  t,
  kicker,
  title,
  at = 0,
}) => (
  <div style={{position: 'absolute', left: 96, top: 84}}>
    <div style={{...rise(t, at + 2, 30), display: 'flex', alignItems: 'center', gap: 18}}>
      <OrnamentStrip color={theme.accent} f={t} at={at + 2} n={3} size={40} />
      <span style={{color: theme.accent, fontSize: 28, fontWeight: 800, letterSpacing: 3}}>{kicker}</span>
    </div>
    <div style={{...rise(t, at + 6, 60), color: theme.fg, fontSize: 92, fontWeight: 900, letterSpacing: -2, marginTop: 6}}>
      {title}
    </div>
  </div>
);

export const Emoji: React.FC<{c: string; size: number; style?: React.CSSProperties}> = ({c, size, style}) => (
  <span style={{fontFamily: EMOJI, fontSize: size, lineHeight: 1, display: 'inline-block', ...style}}>{c}</span>
);
