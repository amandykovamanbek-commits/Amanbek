import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ManDefs} from './Stickman';
import {FONT} from './theme';

/** Character layer: one full-frame svg with defs */
export const Chars: React.FC<{children: React.ReactNode; blur?: number}> = ({children, blur}) => (
  <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <ManDefs />
      {children}
    </svg>
  </AbsoluteFill>
);

/** Place a character at (x, ground y) with scale */
export const Pos: React.FC<{x: number; y: number; s?: number; flip?: boolean; children: React.ReactNode}> = ({x, y, s = 1, flip, children}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>{children}</g>
);

/** A TV/monitor frame filling most of the screen, rendering children inside a "game" screen */
export const Screen: React.FC<{children: React.ReactNode; scan?: boolean; label?: string}> = ({children, scan = true, label}) => (
  <AbsoluteFill style={{background: '#06060E', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'relative', width: 1600, height: 900, borderRadius: 26, overflow: 'hidden', border: '22px solid #101018', boxShadow: '0 0 120px rgba(90,140,255,0.35)'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: 'scale(0.8333)', transformOrigin: '0 0'}}>{children}</div>
      {scan && (
        <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)'}} />
      )}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)'}} />
      {label && (
        <div style={{position: 'absolute', left: 28, bottom: 22, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#F6EEE3', background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 8}}>{label}</div>
      )}
    </div>
  </AbsoluteFill>
);
