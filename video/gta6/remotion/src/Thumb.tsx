import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from './lib/theme';
import {Rooftops} from './lib/Sets';
import {Spotlight, Siren, Vignette, MoneyRain} from './lib/FX';
import {Chars, Pos} from './lib/Frame';
import {Hero} from './lib/Cast';
import {Heli} from './lib/Props';
import {Star} from './lib/UI';

/** YouTube thumbnail 1920x1080 (exported at 1280x720) */
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{transform: 'scale(1.05)'}}>
      <Rooftops offset={0} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 75% 40%, rgba(255,60,90,0.35) 0%, rgba(0,0,0,0) 55%)'}} />
    <Spotlight x0={1500} y0={60} sweep={0} />
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      <Heli x={1560} y={70} f={3} s={1.1} />
    </svg>
    <MoneyRain n={28} start={-60} speed={0.6} />
    <Chars>
      <Pos x={1360} y={2350} s={3.9}>
        <Hero rim="#FFFBE6" rimDx={10} rimDy={-12} armL={[150, 85]} armR={[150, 85]} face={{eyes: 'round', mouth: 'bigO', browY: -10, brow: -14}} still noBlink />
      </Pos>
    </Chars>
    <Siren o={0.5} />
    {/* stars */}
    <div style={{position: 'absolute', left: 70, top: 60, display: 'flex', gap: 10, padding: '14px 22px', borderRadius: 30, background: 'rgba(5,6,14,0.7)'}}>
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} on={1} size={92} flash="#FF4D5E" />)}
    </div>
    {/* title */}
    <div style={{position: 'absolute', left: 70, top: 250, fontFamily: FONT, fontWeight: 900, lineHeight: 0.95, textTransform: 'uppercase'}}>
      <div style={{fontSize: 210, color: C.gold, WebkitTextStroke: '10px #0B0A0F', paintOrder: 'stroke fill', textShadow: '0 10px 0 #0B0A0F, 0 0 60px rgba(255,190,70,0.5)'}}>ГТА 6</div>
      <div style={{fontSize: 118, color: '#FFF', WebkitTextStroke: '8px #0B0A0F', paintOrder: 'stroke fill', textShadow: '0 8px 0 #0B0A0F', marginTop: 10}}>СТАЛА</div>
      <div style={{fontSize: 118, color: '#FFF', WebkitTextStroke: '8px #0B0A0F', paintOrder: 'stroke fill', textShadow: '0 8px 0 #0B0A0F'}}>РЕАЛЬНОСТЬЮ</div>
    </div>
    <div style={{position: 'absolute', left: 80, bottom: 70, fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#FFF', background: C.red, padding: '10px 30px', borderRadius: 16, transform: 'rotate(-3deg)', boxShadow: '0 10px 0 #0B0A0F'}}>
      РАНЬШЕ ВСЕХ
    </div>
    <div style={{position: 'absolute', right: 70, bottom: 60, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: C.green, background: 'rgba(5,6,14,0.8)', padding: '8px 26px', borderRadius: 40, border: '4px solid rgba(91,227,138,0.6)'}}>
      $1 048 000
    </div>
    <Vignette s={0.6} />
  </AbsoluteFill>
);
