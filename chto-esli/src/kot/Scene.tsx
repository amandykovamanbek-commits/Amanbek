import React from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cat, Hero } from './Characters';
import { CUTS, H, W, layerStyle } from './camera';

// ---------- дальний слой: вечерний город (мировые координаты) ----------
const BUILDINGS = (() => {
	const out: { x: number; w: number; h: number; r: number; wins: number[] }[] = [];
	let x = -300;
	let i = 0;
	while (x < 1400) {
		const w = 80 + random(`bw${i}`) * 120;
		const h = 160 + random(`bh${i}`) * 380;
		out.push({ x, w, h, r: random(`br${i}`), wins: Array.from({ length: 60 }, (_, k) => random(`win${i}-${k}`)) });
		x += w + 10;
		i++;
	}
	return out;
})();
const STARS = Array.from({ length: 70 }, (_, i) => [-300 + random(`sx${i}`) * 1700, 200 + random(`sy${i}`) * 650]);

const Far: React.FC<{ t: number }> = ({ t }) => {
	const base = 1060;
	return (
		<svg width={W} height={H} style={{ overflow: 'visible', filter: 'blur(2px)' }}>
			<defs>
				<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#191340" />
					<stop offset="0.45" stopColor="#5a2f78" />
					<stop offset="0.8" stopColor="#ff7a59" />
					<stop offset="1" stopColor="#ffc27a" />
				</linearGradient>
				<radialGradient id="moonGlow">
					<stop offset="0" stopColor="rgba(255,240,210,.9)" />
					<stop offset="0.3" stopColor="rgba(255,220,180,.35)" />
					<stop offset="1" stopColor="rgba(255,200,160,0)" />
				</radialGradient>
			</defs>
			<rect x={-600} y={0} width={2300} height={1100} fill="url(#sky)" />
			<rect x={-600} y={-800} width={2300} height={800} fill="#191340" />
			<rect x={-600} y={1100} width={2300} height={1400} fill="#ffc27a" />
			{STARS.map(([x, y], i) => (
				<rect key={i} x={x} y={y} width={3} height={3} fill="#fff" opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i))} />
			))}
			<circle cx={880} cy={620} r={150} fill="url(#moonGlow)" />
			<circle cx={880} cy={620} r={36} fill="#fff4dc" />
			{BUILDINGS.map((b, i) => {
				const top = base - b.h;
				const wins: React.ReactNode[] = [];
				let k = 0;
				for (let yy = top + 22; yy < base - 14; yy += 34) {
					for (let xx = b.x + 12; xx < b.x + b.w - 18; xx += 28) {
						const v = b.wins[k++ % 60];
						if (v > 0.55) {
							wins.push(<rect key={`${xx}-${yy}`} x={xx} y={yy} width={13} height={16} fill={v > 0.85 ? '#ffe59a' : '#ffb86b'} opacity={0.55 + 0.45 * v} />);
						}
					}
				}
				return (
					<g key={i}>
						<rect x={b.x} y={top} width={b.w} height={b.h + 600} fill={b.r > 0.5 ? '#2a1f4d' : '#33275a'} />
						{wins}
					</g>
				);
			})}
		</svg>
	);
};

// ---------- средний слой: стена с окном + кот (локальные координаты, масштаб 1.7) ----------
const MID_TF = 'translate(760 1000) scale(1.7) translate(-960 -420)';
const LIGHT_COLORS = ['#ffd23f', '#ff7aa8', '#7ae7ff', '#a6ff7a'];

const Wall: React.FC<{ t: number }> = ({ t }) => {
	const holed = 'M-800,-900 H2000 V1800 H-800 Z M760,110 V420 H1120 V110 Z';
	const lightY = (x: number) => -40 + 22 * Math.sin(((x - 560) / 760) * Math.PI * 3) ** 2;
	return (
		<g>
			<defs>
				<linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#2c2350" />
					<stop offset="1" stopColor="#4b3a6b" />
				</linearGradient>
				<radialGradient id="lamp" gradientUnits="userSpaceOnUse" cx={660} cy={360} r={420}>
					<stop offset="0" stopColor="rgba(255,190,120,.45)" />
					<stop offset="1" stopColor="rgba(255,190,120,0)" />
				</radialGradient>
				<linearGradient id="curtain" x1="0" x2="1">
					<stop offset="0" stopColor="#c45d8f" />
					<stop offset="0.5" stopColor="#e27fae" />
					<stop offset="1" stopColor="#a8487a" />
				</linearGradient>
				<linearGradient id="sill" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#d9c2a6" />
					<stop offset="1" stopColor="#8e7458" />
				</linearGradient>
			</defs>
			<path d={holed} fill="url(#wall)" fillRule="evenodd" />
			<path d={holed} fill="url(#lamp)" fillRule="evenodd" />
			{/* окно */}
			<rect x={760} y={110} width={360} height={310} fill="none" stroke="#1e1736" strokeWidth={16} />
			<path d="M940,110 V420 M760,260 H1120" stroke="#1e1736" strokeWidth={8} />
			<path d="M780,400 L860,120 L900,120 L820,400 Z" fill="rgba(255,255,255,.06)" />
			{/* шторы */}
			{([
				[730, -1],
				[1150, 1],
			] as const).map(([x, dir]) => (
				<path
					key={x}
					d={`M${x - 45},80 L${x + 45},80 Q${x + 20 * dir + Math.sin(t) * 3},300 ${x + 40},470 L${x - 40},470 Q${x - 20 * dir},300 ${x - 45},80 Z`}
					fill="url(#curtain)"
				/>
			))}
			<rect x={660} y={70} width={580} height={12} fill="#7a5a3a" />
			<rect x={735} y={418} width={410} height={26} rx={6} fill="url(#sill)" />
			{/* часы */}
			<circle cx={688} cy={230} r={30} fill="#f6efe2" stroke="#1b1530" strokeWidth={5} />
			<path d={`M688,230 L688,${212} M688,230 L${700},236`} stroke="#1b1530" strokeWidth={4} strokeLinecap="round" />
			{/* полка с книгами под окном */}
			<rect x={980} y={560} width={210} height={9} fill="#6b4a2e" />
			{['#4fc1e9', '#ff7b54', '#a0d468', '#ffce54', '#ac92ec', '#ed5565'].map((c, i) => {
				const h = 36 + (i % 3) * 8;
				return <rect key={c} x={992 + i * 24} y={560 - h} width={19} height={h} fill={c} />;
			})}
			{/* гирлянда */}
			<path
				d={Array.from({ length: 81 }, (_, i) => {
					const x = 560 + i * 10;
					return `${i === 0 ? 'M' : 'L'}${x},${lightY(x)}`;
				}).join(' ')}
				stroke="#1b1530"
				strokeWidth={2}
				fill="none"
			/>
			{Array.from({ length: 20 }, (_, i) => {
				const x = 570 + i * 40;
				const y = lightY(x) + 4;
				const c = LIGHT_COLORS[i % 4];
				const a = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
				return (
					<g key={i}>
						<circle cx={x} cy={y} r={22} fill={c} opacity={a * 0.28} />
						<ellipse cx={x} cy={y} rx={5} ry={6} fill={c} />
					</g>
				);
			})}
		</g>
	);
};

// ---------- ближний слой: пол, кровать, герой (локальные координаты, масштаб 1.7) ----------
const NEAR_TF = 'translate(330 1500) scale(1.7) translate(-400 -500)';

const Room: React.FC = () => (
	<g>
		<defs>
			<linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stopColor="#3a2a45" />
				<stop offset="1" stopColor="#1d1426" />
			</linearGradient>
			<linearGradient id="mattress" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stopColor="#f2e7ff" />
				<stop offset="1" stopColor="#bfaee0" />
			</linearGradient>
			<linearGradient id="blanket" x1="0" x2="1">
				<stop offset="0" stopColor="#5f74d6" />
				<stop offset="1" stopColor="#3d4fa8" />
			</linearGradient>
		</defs>
		<rect x={-500} y={598} width={2300} height={500} fill="url(#floor)" />
		{Array.from({ length: 6 }, (_, i) => (
			<line key={i} x1={-500} y1={625 + i * 34} x2={1800} y2={625 + i * 34} stroke="rgba(0,0,0,.25)" strokeWidth={2} />
		))}
		<rect x={-500} y={590} width={2300} height={10} fill="#251b33" />
		<ellipse cx={560} cy={690} rx={330} ry={55} fill="#6c5ce7" />
		<ellipse cx={560} cy={690} rx={290} ry={42} fill="#8e7bff" />
		<rect x={70} y={470} width={620} height={140} rx={14} fill="#3d2b26" />
		<rect x={80} y={455} width={600} height={70} rx={20} fill="url(#mattress)" />
		<path d="M470,462 Q560,450 690,470 L700,590 Q600,605 480,592 Q455,520 470,462 Z" fill="url(#blanket)" />
		<path d="M520,480 Q560,530 540,585" stroke="rgba(255,255,255,.15)" strokeWidth={3} fill="none" />
		<rect x={95} y={405} width={150} height={70} rx={30} fill="#fff" />
		<rect x={95} y={445} width={150} height={30} rx={15} fill="rgba(160,140,200,.4)" />
		<rect x={80} y={610} width={600} height={14} fill="rgba(0,0,0,.3)" />
	</g>
);

// ---------- передний план: размытые листья (мировые координаты) ----------
const Fore: React.FC<{ t: number }> = ({ t }) => (
	<svg width={W} height={H} style={{ overflow: 'visible', filter: 'blur(10px)' }}>
		{([
			[-60, 1990, 200, -0.6],
			[90, 2080, 230, -0.2],
			[1150, 2060, 210, 0.5],
		] as const).map(([x, y, r, a]) => (
			<ellipse
				key={x}
				cx={0}
				cy={-r}
				rx={r * 0.32}
				ry={r}
				fill="#123524"
				transform={`translate(${x} ${y}) rotate(${((a + Math.sin(t * 1.3 + x) * 0.03) * 180) / Math.PI})`}
			/>
		))}
	</svg>
);

// ---------- экранные эффекты ----------
const Particles: React.FC<{ t: number }> = ({ t }) => (
	<svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
		{Array.from({ length: 34 }, (_, i) => {
			const x = ((random(`px${i}`) * 1240 + t * (12 + random(`pvx${i}`) * 24)) % 1240) - 80;
			const y = ((random(`py${i}`) * 2080 - t * (8 + random(`pvy${i}`) * 14) + 2080) % 2080) - 80;
			const r = 2.5 + random(`pr${i}`) * 3;
			return <circle key={i} cx={x} cy={y} r={r} fill="#ffe9c4" opacity={0.15 + 0.25 * Math.abs(Math.sin(t + i))} />;
		})}
	</svg>
);

const Grade: React.FC<{ t: number }> = ({ t }) => {
	const flash = CUTS.reduce((acc, c) => (t >= c && t < c + 0.12 ? 0.5 * (1 - (t - c) / 0.12) : acc), 0);
	return (
		<>
			<AbsoluteFill
				style={{
					mixBlendMode: 'soft-light',
					background: 'radial-gradient(circle at 15% 40%, rgba(255,170,90,.55), rgba(80,40,140,.4) 75%)',
				}}
			/>
			<Particles t={t} />
			<AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%)' }} />
			{flash > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} /> : null}
		</>
	);
};

// Сцена: 4 слоя с разной глубиной (2.5D-параллакс). midOverlay — элементы, привязанные к коту (пузыри мыслей).
export const Scene: React.FC<{ midOverlay?: React.ReactNode }> = ({ midOverlay }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{ backgroundColor: '#191340', overflow: 'hidden' }}>
			<div style={layerStyle(t, 0.25)}>
				<Far t={t} />
			</div>
			<div style={layerStyle(t, 0.7)}>
				<svg width={W} height={H} style={{ overflow: 'visible', position: 'absolute' }}>
					<g transform={MID_TF}>
						<Wall t={t} />
						<Cat t={t} />
					</g>
				</svg>
				{midOverlay}
			</div>
			<div style={layerStyle(t, 1)}>
				<svg width={W} height={H} style={{ overflow: 'visible' }}>
					<g transform={NEAR_TF}>
						<Room />
						<Hero t={t} />
					</g>
				</svg>
			</div>
			<div style={layerStyle(t, 1.35)}>
				<Fore t={t} />
			</div>
			<Grade t={t} />
		</AbsoluteFill>
	);
};
