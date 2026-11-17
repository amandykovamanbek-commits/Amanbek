import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, mixHex, rnd} from './theme';

type SetProps = {blur?: number; children?: React.ReactNode};

const Svg: React.FC<{blur?: number; children: React.ReactNode}> = ({blur = 0, children}) => (
  <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">{children}</svg>
  </AbsoluteFill>
);

const Windows: React.FC<{x: number; y: number; cols: number; rows: number; w: number; h: number; gx: number; gy: number; fill: string; lit?: string; litP?: number; seed?: number}> = ({x, y, cols, rows, w, h, gx, gy, fill, lit, litP = 0, seed = 0}) => (
  <g>
    {Array.from({length: rows * cols}).map((_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const on = lit && rnd(i + seed) < litP;
      return <rect key={i} x={x + c * gx} y={y + r * gy} width={w} height={h} fill={on ? lit : fill} />;
    })}
  </g>
);

/** Teen bedroom at night. TV screen rect = TV const. */
export const TV = {x: 790, y: 452, w: 340, h: 200};
export const Bedroom: React.FC<SetProps & {dawn?: number; tv?: string}> = ({blur, dawn = 0, tv = '#1B2A55', children}) => {
  const sky = mixHex('#0E1236', '#E79A6A', dawn);
  const sky2 = mixHex('#1A1F4A', '#F3C27E', dawn);
  return (
    <Svg blur={blur}>
      <defs>
        <linearGradient id="br_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky} /><stop offset="1" stopColor={sky2} /></linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={mixHex('#15163A', '#2A2238', dawn * 0.5)} />
      {/* window */}
      <rect x={1330} y={170} width={400} height={400} fill="url(#br_sky)" />
      {dawn < 0.6 && <circle cx={1640} cy={250} r={34} fill="#F4F1E6" opacity={1 - dawn} />}
      <Windows x={1350} y={430} cols={8} rows={4} w={14} h={18} gx={46} gy={34} fill="#232650" lit="#FFD27A" litP={0.18} seed={3} />
      <rect x={1330} y={170} width={400} height={400} fill="none" stroke="#0B0A1E" strokeWidth={18} />
      <line x1={1530} y1={170} x2={1530} y2={570} stroke="#0B0A1E" strokeWidth={12} />
      <rect x={1290} y={140} width={60} height={480} fill="#3A2440" />
      <rect x={1710} y={140} width={60} height={480} fill="#3A2440" />
      {/* posters */}
      <rect x={210} y={200} width={170} height={230} rx={6} fill="#2B2E5E" />
      <rect x={230} y={222} width={130} height={120} fill="#4C3A78" />
      <rect x={420} y={240} width={150} height={110} rx={6} fill="#3E2B4E" />
      {/* floor */}
      <rect x={0} y={820} width={1920} height={260} fill="#0E0D24" />
      {/* bed */}
      <rect x={90} y={660} width={560} height={170} rx={20} fill="#26285A" />
      <rect x={90} y={630} width={160} height={70} rx={24} fill="#C9C8DC" opacity={0.85} />
      <rect x={250} y={640} width={400} height={60} rx={18} fill="#3E4A8C" />
      {/* desk + tv */}
      <rect x={700} y={680} width={520} height={26} fill="#3A2A2A" />
      <rect x={720} y={706} width={18} height={120} fill="#2A1F22" />
      <rect x={1182} y={706} width={18} height={120} fill="#2A1F22" />
      <rect x={TV.x - 14} y={TV.y - 14} width={TV.w + 28} height={TV.h + 28} rx={10} fill="#0A0A12" />
      <rect x={TV.x} y={TV.y} width={TV.w} height={TV.h} fill={tv} />
      <rect x={950} y={TV.y + TV.h + 14} width={20} height={14} fill="#0A0A12" />
      {/* nightstand + clock */}
      <rect x={660} y={720} width={0} height={0} />
      {children}
    </Svg>
  );
};

/** Inside the flat, front door */
export const DoorSet: React.FC<SetProps & {open?: number; landingLight?: boolean}> = ({blur, open = 0, children}) => (
  <Svg blur={blur}>
    <rect width={1920} height={1080} fill="#17162E" />
    <rect x={0} y={880} width={1920} height={200} fill="#0F0E20" />
    {/* door frame */}
    <rect x={790} y={230} width={340} height={660} fill="#0B0A16" />
    {/* opening shows landing light */}
    <rect x={800} y={240} width={320} height={640} fill="#C9C29A" opacity={open * 0.9} />
    <g transform={`translate(800 240) scale(${1 - open * 0.85} 1)`}>
      <rect width={320} height={640} fill="#4A3428" />
      <rect x={30} y={40} width={260} height={250} rx={6} fill="#56402F" />
      <rect x={30} y={330} width={260} height={270} rx={6} fill="#56402F" />
      <circle cx={160} cy={150} r={9} fill="#D9C08A" />
      <rect x={270} y={330} width={30} height={12} rx={4} fill="#D9C08A" />
    </g>
    {/* light strip under door */}
    <rect x={800} y={878} width={320} height={6} fill="#FFE7A8" opacity={0.85 - open * 0.5} />
    {/* hanger */}
    <rect x={380} y={330} width={240} height={14} rx={6} fill="#2E2A40" />
    <path d="M 430 344 Q 400 470 440 560 L 520 560 Q 540 450 500 344 Z" fill="#2B3B5E" />
    {children}
  </Svg>
);

/** Soviet-style stairwell landing */
export const Landing: React.FC<SetProps> = ({blur, children}) => (
  <Svg blur={blur}>
    <rect width={1920} height={1080} fill="#4E5266" />
    <rect x={0} y={520} width={1920} height={560} fill="#2E4A3F" />
    <rect x={0} y={516} width={1920} height={8} fill="#22362E" />
    <rect x={0} y={880} width={1920} height={200} fill="#2B2733" />
    {/* lamp */}
    <rect x={930} y={0} width={4} height={110} fill="#1A1820" />
    <circle cx={932} cy={124} r={20} fill="#FFF0B8" />
    {/* stairs rail */}
    <path d="M 1350 880 L 1900 420" stroke="#1C1A24" strokeWidth={14} />
    {Array.from({length: 9}).map((_, i) => (
      <line key={i} x1={1380 + i * 60} y1={855 - i * 50} x2={1380 + i * 60} y2={960 - i * 50} stroke="#1C1A24" strokeWidth={6} />
    ))}
    {/* mailboxes */}
    <rect x={220} y={330} width={330} height={170} fill="#5B4A3A" />
    {Array.from({length: 8}).map((_, i) => (
      <rect key={i} x={234 + (i % 4) * 80} y={344 + Math.floor(i / 4) * 80} width={66} height={66} fill="#6E5A47" />
    ))}
    {/* graffiti scribble */}
    <path d="M 640 640 q 30 -40 60 0 t 60 0 t 60 0" stroke="#D45B8A" strokeWidth={8} fill="none" opacity={0.7} />
    <text x={640} y={720} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#5BC7D4" opacity={0.6} transform="rotate(-6 640 720)">ВИТЯ + ?</text>
    {children}
  </Svg>
);

/** Morning street with panel houses and a tree */
export const Street: React.FC<SetProps & {cat?: boolean}> = ({blur, children}) => (
  <Svg blur={blur}>
    <defs>
      <linearGradient id="st_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FA3CC" /><stop offset="1" stopColor="#D6DCE2" /></linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#st_sky)" />
    <circle cx={1560} cy={170} r={90} fill="#FFF3D2" opacity={0.9} />
    {/* panel houses */}
    {[[60, 260, 520, 560], [640, 330, 460, 490], [1180, 230, 640, 590]].map(([x, y, w, h], i) => (
      <g key={i}>
        <rect x={x} y={y} width={w} height={h} fill={['#A6A9B8', '#B3AFA6', '#9EA6B5'][i]} />
        <Windows x={x + 24} y={y + 26} cols={Math.floor((w - 30) / 56)} rows={Math.floor((h - 40) / 58)} w={34} h={36} gx={56} gy={58} fill="#6E7590" lit="#E9D9A6" litP={0.12} seed={i * 40} />
      </g>
    ))}
    <rect x={0} y={820} width={1920} height={60} fill="#7A7886" />
    <rect x={0} y={880} width={1920} height={200} fill="#55545F" />
    <rect x={0} y={815} width={1920} height={8} fill="#8E8C98" />
    {/* tree */}
    <rect x={392} y={420} width={36} height={410} fill="#4A3428" />
    <path d="M 410 520 L 300 420 M 410 600 L 520 470" stroke="#4A3428" strokeWidth={18} strokeLinecap="round" />
    {[[410, 330, 130], [300, 400, 95], [520, 410, 100], [360, 270, 90], [470, 290, 90]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={['#3F6E4A', '#4A7A52', '#365F41', '#4F8156', '#3B6847'][i]} />
    ))}
    {children}
  </Svg>
);

export const SchoolExt: React.FC<SetProps> = ({blur, children}) => (
  <Svg blur={blur}>
    <defs>
      <linearGradient id="se_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#86A8CF" /><stop offset="1" stopColor="#D9DEE4" /></linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#se_sky)" />
    <rect x={160} y={240} width={1600} height={620} fill="#B06A50" />
    <rect x={160} y={240} width={1600} height={24} fill="#8E5340" />
    <Windows x={210} y={300} cols={14} rows={3} w={78} h={100} gx={110} gy={150} fill="#D3DDE8" />
    <rect x={850} y={640} width={220} height={220} fill="#3B2C2A" />
    <rect x={860} y={650} width={95} height={210} fill="#57433C" />
    <rect x={965} y={650} width={95} height={210} fill="#57433C" />
    <rect x={760} y={560} width={400} height={64} rx={8} fill="#1F2B4A" />
    <text x={960} y={606} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={42} fill="#F6EEE3">ШКОЛА №7</text>
    <rect x={0} y={860} width={1920} height={220} fill="#5E5C67" />
    {children}
  </Svg>
);

export const Corridor: React.FC<SetProps & {dim?: number}> = ({blur, dim = 0, children}) => (
  <Svg blur={blur}>
    <rect width={1920} height={1080} fill={mixHex('#8A8476', '#2A2836', dim)} />
    <rect x={0} y={520} width={1920} height={400} fill={mixHex('#2C4F49', '#1A2A2A', dim)} />
    {/* windows with light */}
    {[140, 620, 1100, 1580].map((x, i) => (
      <g key={i}>
        <rect x={x} y={150} width={220} height={300} fill={mixHex('#DCE7F2', '#2A3050', dim)} />
        <line x1={x + 110} y1={150} x2={x + 110} y2={450} stroke="#5A564C" strokeWidth={10} />
        <rect x={x} y={150} width={220} height={300} fill="none" stroke="#5A564C" strokeWidth={12} />
      </g>
    ))}
    {/* lockers */}
    {Array.from({length: 22}).map((_, i) => (
      <rect key={i} x={20 + i * 86} y={560} width={78} height={330} rx={4} fill={mixHex('#3E5F7A', '#26364A', dim)} stroke="#1E2E3E" strokeWidth={4} />
    ))}
    <rect x={0} y={890} width={1920} height={190} fill={mixHex('#5A5560', '#24222C', dim)} />
    {children}
  </Svg>
);

export const Classroom: React.FC<SetProps & {storm?: number; board?: string[]}> = ({blur, storm = 0, board = ['x² + 5x − 14 = 0', 'D = b² − 4ac', '∫ sin x dx = ?'], children}) => (
  <Svg blur={blur}>
    <rect width={1920} height={1080} fill={mixHex('#6E6A62', '#2C2B36', storm)} />
    {/* windows right */}
    {[1440, 1690].map((x, i) => (
      <g key={i}>
        <rect x={x} y={160} width={190} height={420} fill={mixHex('#CFDDEB', '#2B3350', storm)} />
        <rect x={x} y={160} width={190} height={420} fill="none" stroke="#4A463E" strokeWidth={12} />
        <line x1={x} y1={370} x2={x + 190} y2={370} stroke="#4A463E" strokeWidth={8} />
      </g>
    ))}
    {/* board */}
    <rect x={200} y={170} width={1060} height={430} fill="#5A3E2B" />
    <rect x={216} y={186} width={1028} height={398} fill="#1F3D33" />
    {board.map((l, i) => (
      <text key={i} x={260} y={270 + i * 100} fontFamily="'DejaVu Serif', serif" fontSize={54} fill="#D8E4D8" opacity={0.85}>{l}</text>
    ))}
    <rect x={0} y={760} width={1920} height={320} fill={mixHex('#4E4650', '#22202A', storm)} />
    {children}
  </Svg>
);

/** Rows of desks in the foreground (draw after characters for depth) */
export const Desks: React.FC<{y?: number; n?: number; dark?: number}> = ({y = 880, n = 5, dark = 0}) => (
  <svg width={1920} height={1080} style={{position: 'absolute'}}>
    {Array.from({length: n}).map((_, i) => (
      <g key={i}>
        <rect x={60 + i * 380} y={y} width={300} height={26} fill={mixHex('#7A5236', '#2E2420', dark)} />
        <rect x={80 + i * 380} y={y + 26} width={16} height={200} fill="#2A1F1A" />
        <rect x={324 + i * 380} y={y + 26} width={16} height={200} fill="#2A1F1A" />
      </g>
    ))}
  </svg>
);

export const Yard: React.FC<SetProps> = ({blur, children}) => (
  <Svg blur={blur}>
    <defs>
      <linearGradient id="yd_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FA3CC" /><stop offset="1" stopColor="#D9DEE4" /></linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#yd_sky)" />
    <rect x={0} y={200} width={1920} height={560} fill="#B06A50" />
    <Windows x={60} y={260} cols={17} rows={3} w={70} h={90} gx={110} gy={150} fill="#D3DDE8" />
    <rect x={0} y={760} width={1920} height={320} fill="#5E5C67" />
    {/* hoop */}
    <rect x={1640} y={480} width={14} height={300} fill="#2A2A36" />
    <rect x={1580} y={430} width={130} height={90} fill="#E8E4DA" stroke="#2A2A36" strokeWidth={6} />
    {children}
  </Svg>
);

/** Fence in foreground */
export const Fence: React.FC<{y?: number; x0?: number; x1?: number}> = ({y = 600, x0 = 0, x1 = 1920}) => (
  <svg width={1920} height={1080} style={{position: 'absolute'}}>
    <rect x={x0} y={y} width={x1 - x0} height={12} fill="#24232E" />
    <rect x={x0} y={y + 220} width={x1 - x0} height={12} fill="#24232E" />
    {Array.from({length: Math.floor((x1 - x0) / 46)}).map((_, i) => (
      <g key={i}>
        <rect x={x0 + 10 + i * 46} y={y - 40} width={10} height={300} fill="#24232E" />
        <path d={`M ${x0 + 6 + i * 46} ${y - 40} L ${x0 + 15 + i * 46} ${y - 62} L ${x0 + 24 + i * 46} ${y - 40} Z`} fill="#24232E" />
      </g>
    ))}
  </svg>
);

export const Kitchen: React.FC<SetProps & {tv?: string}> = ({blur, children}) => (
  <Svg blur={blur}>
    <rect width={1920} height={1080} fill="#3B2E2A" />
    <rect x={0} y={560} width={1920} height={520} fill="#2E2421" />
    {/* tiles */}
    {Array.from({length: 40}).map((_, i) => (
      <rect key={i} x={(i % 20) * 96} y={560 + Math.floor(i / 20) * 60} width={92} height={56} fill="#463733" />
    ))}
    {/* window */}
    <rect x={1300} y={170} width={360} height={340} fill="#141A3A" />
    <rect x={1300} y={170} width={360} height={340} fill="none" stroke="#5E4A40" strokeWidth={16} />
    {/* fridge */}
    <rect x={120} y={260} width={260} height={640} rx={14} fill="#B9BEC8" />
    <rect x={120} y={500} width={260} height={8} fill="#8E939E" />
    <rect x={340} y={330} width={14} height={120} rx={6} fill="#8E939E" />
    {/* lamp */}
    <rect x={958} y={0} width={4} height={150} fill="#1A1416" />
    <path d="M 900 150 L 1020 150 L 990 110 L 930 110 Z" fill="#C99A4A" />
    <rect x={0} y={880} width={1920} height={200} fill="#231B19" />
    {/* table */}
    <rect x={640} y={720} width={640} height={26} fill="#6E4A33" />
    <rect x={680} y={746} width={18} height={150} fill="#4A3224" />
    <rect x={1222} y={746} width={18} height={150} fill="#4A3224" />
    {children}
  </Svg>
);

/** Night city skyline (deterministic). lit = 0..1 extra windows. */
const CITY = (() => {
  const b: {x: number; y: number; w: number; h: number; far: boolean}[] = [];
  let x = -40;
  let i = 0;
  while (x < 1960) {
    const w = 80 + rnd(i) * 90;
    const h = 260 + rnd(i + 50) * 300;
    b.push({x, y: 900 - h, w, h, far: true});
    x += w + 6;
    i++;
  }
  x = -60;
  while (x < 1980) {
    const w = 120 + rnd(i) * 130;
    const h = 170 + rnd(i + 70) * 360;
    b.push({x, y: 900 - h, w, h, far: false});
    x += w + 14 + rnd(i + 3) * 30;
    i++;
  }
  return b;
})();

export const CityNight: React.FC<SetProps & {lit?: number; moon?: boolean; red?: number}> = ({blur, lit = 0.12, moon = true, red = 0, children}) => (
  <Svg blur={blur}>
    <defs>
      <linearGradient id="cn_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.nightTop} />
        <stop offset="1" stopColor={mixHex('#1A1840', '#4A1A2A', red)} />
      </linearGradient>
      <radialGradient id="cn_moon"><stop offset="0" stopColor="#E9ECFF" stopOpacity={0.5} /><stop offset="1" stopColor="#9FB0FF" stopOpacity={0} /></radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#cn_sky)" />
    {moon && <circle cx={1600} cy={200} r={240} fill="url(#cn_moon)" />}
    {moon && <circle cx={1600} cy={200} r={44} fill="#F4F1E6" />}
    {CITY.map((b, i) => (
      <g key={i}>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.far ? '#15143A' : '#0B0A1E'} />
        {!b.far && (
          <Windows x={b.x + 14} y={b.y + 18} cols={Math.floor((b.w - 20) / 24)} rows={Math.floor((b.h - 30) / 32)} w={11} h={15} gx={24} gy={32} fill="#141331" lit="#FFD27A" litP={lit} seed={i * 97} />
        )}
      </g>
    ))}
    <rect x={0} y={900} width={1920} height={180} fill="#08071A" />
    {children}
  </Svg>
);

/** Rooftops for the chase; offset scrolls the near layer */
export const Rooftops: React.FC<SetProps & {offset?: number}> = ({blur, offset = 0, children}) => {
  const near = Array.from({length: 12}).map((_, i) => ({x: i * 360 - (offset % 360) - 360, h: 300 + rnd(i + Math.floor(offset / 360)) * 120}));
  return (
    <Svg blur={blur}>
      <rect width={1920} height={1080} fill={C.nightTop} />
      <g transform={`translate(${-(offset * 0.25) % 400} 0)`}>
        {Array.from({length: 14}).map((_, i) => (
          <rect key={i} x={i * 200 - 100} y={420 + rnd(i) * 200} width={180} height={700} fill="#15143A" />
        ))}
      </g>
      {near.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={1080 - r.h} width={330} height={r.h} fill="#0B0A1E" />
          <rect x={r.x + 40} y={1080 - r.h - 80} width={6} height={80} fill="#0B0A1E" />
          <path d={`M ${r.x + 20} ${1080 - r.h - 80} L ${r.x + 66} ${1080 - r.h - 80}`} stroke="#0B0A1E" strokeWidth={6} />
        </g>
      ))}
      {children}
    </Svg>
  );
};

export const Void: React.FC<{tint?: string; glow?: string}> = ({tint = '#0D0C26', glow = 'rgba(80,70,160,0.35)'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${glow} 0%, rgba(0,0,0,0) 70%), ${tint}`}} />
);
