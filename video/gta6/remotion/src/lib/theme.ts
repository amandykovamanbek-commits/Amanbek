import {Easing, interpolate} from 'remotion';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const C = {
  head: '#0B0A0F',
  face: '#F6EEE3',
  gloss: '#2A292E',
  night: '#0D0C26',
  nightTop: '#07071A',
  ink: '#05050C',
  gold: '#FFD240',
  goldGlow: 'rgba(255,190,70,0.55)',
  green: '#5BE38A',
  red: '#FF4D5E',
  blueLight: '#4DA3FF',
  rimCold: '#A0B8FF',
  rimWarm: '#F6C38E',
  rimDay: '#FFF1D6',
  // characters
  hero: '#D68A1A',
  lera: '#8C5BD8',
  timur: '#C2413A',
  mom: '#3E8E6A',
  director: '#5E6475',
  cleaner: '#2E8C8C',
  coach: '#3C6FD8',
  crowd: ['#3A3F5C', '#4A3F5C', '#3F4C5C', '#5C4A3F', '#3F5C4A'],
};

export const FONT = "'Inter', 'Inter Display', sans-serif";
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.33, 0, 0.2, 1);
export const backOut = Easing.out(Easing.back(1.7));

export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

/** 0→1 over [a, a+d] frames with easing */
export const ramp = (f: number, a: number, d = 10, e = ease) => interpolate(f, [a, a + d], [0, 1], {...clamp, easing: e});
/** fade in at a, fade out at b */
export const inOut = (f: number, a: number, b: number, d = 8) =>
  Math.min(interpolate(f, [a, a + d], [0, 1], clamp), interpolate(f, [b - d, b], [1, 0], clamp));

export const glowText = '0 0 18px rgba(255,190,70,0.55), 0 0 60px rgba(255,150,40,0.35)';
export const glow = (rgba: string) => `0 0 16px ${rgba}, 0 0 48px ${rgba}`;
