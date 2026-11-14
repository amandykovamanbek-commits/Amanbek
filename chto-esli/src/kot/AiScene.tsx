import React from 'react';
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, easeIO, H, lerp, prog, W } from './camera';

// 2.5D-сцена из ИИ-иллюстраций: фон и кот на подоконнике — дальний слой,
// герой — ближний слой, частицы — передний. Камера двигается, слои смещаются с разной скоростью.

type Cam = [number, number, number];
export const AI_SHOTS: [number, number, Cam, Cam][] = [
	[0.0, 2.8, [540, 1000, 1.0], [540, 985, 1.06]], // общий план + заголовок
	[2.8, 3.5, [540, 985, 1.06], [700, 900, 1.35]], // наезд на кота
	[3.5, 6.6, [700, 900, 1.35], [690, 905, 1.42]],
	[6.6, 7.3, [690, 905, 1.42], [540, 1040, 1.28]], // отъезд: оба в кадре
	[7.3, 9.9, [540, 1040, 1.28], [540, 1035, 1.34]],
	[9.9, 10.9, [770, 640, 2.15], [770, 630, 2.3]], // склейка: кот крупно
	[10.9, 12.6, [400, 1120, 1.85], [400, 1110, 2.05]], // склейка: герой крупно
];
export const AI_CUTS = [9.9, 10.9];

const camAt = (t: number): Cam => {
	for (const [a, b, f, to] of AI_SHOTS) {
		if (t >= a && t < b) {
			const k = easeIO(prog(t, a, b));
			return [lerp(f[0], to[0], k), lerp(f[1], to[1], k), lerp(f[2], to[2], k)];
		}
	}
	return AI_SHOTS[AI_SHOTS.length - 1][3];
};

const shakeAt = (t: number): [number, number] => {
	let a = 0;
	for (const s of [6.6, 9.9]) if (t >= s && t < s + 0.45) a = Math.max(a, 20 * (1 - (t - s) / 0.45));
	return [Math.sin(t * 97) * a, Math.cos(t * 83) * a * 0.7];
};

const layer = (t: number, depth: number): React.CSSProperties => {
	const [cx, cy, zoom] = camAt(t);
	const [sx, sy] = shakeAt(t);
	const z = 1 + (zoom - 1) * depth;
	const lx = W / 2 + (cx - W / 2) * depth;
	const ly = H / 2 + (cy - H / 2) * depth;
	return {
		position: 'absolute',
		left: 0,
		top: 0,
		width: W,
		height: H,
		transformOrigin: '0 0',
		translate: `${W / 2 - lx * z + sx * depth}px ${H / 2 - ly * z + sy * depth}px`,
		scale: z,
	};
};

// Персонаж-вырезка: якорь — середина нижнего края. Лёгкое «дыхание» и «пружинка» при смене эмоции.
const Sprite: React.FC<{
	src: string;
	x: number;
	bottom: number;
	height: number;
	t: number;
	changedAt: number;
	breathe?: number;
	tilt?: number;
}> = ({ src, x, bottom, height, t, changedAt, breathe = 0.012, tilt = 0 }) => {
	const since = t - changedAt;
	const pk = prog(since, 0, 0.35);
	const popK = since > 0 && since < 0.35 ? 1 + 0.1 * Math.sin(pk * Math.PI) * (1 - pk * 0.5) : 1;
	const sy = (1 + Math.sin(t * 2.4) * breathe) * popK;
	const sxs = (1 - Math.sin(t * 2.4) * breathe * 0.5) * (2 - popK);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: bottom - height,
				height,
				translate: '-50% 0',
				transformOrigin: '50% 100%',
				scale: `${sxs} ${sy}`,
				rotate: `${tilt}deg`,
				filter: 'drop-shadow(0 18px 18px rgba(20,0,40,.45))',
			}}
		>
			<Img src={staticFile(src)} style={{ height: '100%', display: 'block' }} />
		</div>
	);
};

const pick = (t: number, list: [number, string][]): [string, number] => {
	let cur = list[0];
	for (const it of list) if (t >= it[0]) cur = it;
	return [cur[1], cur[0]];
};

const Particles: React.FC<{ t: number }> = ({ t }) => (
	<svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
		{Array.from({ length: 40 }, (_, i) => {
			const x = ((random(`px${i}`) * 1240 + t * (14 + random(`pvx${i}`) * 26)) % 1240) - 80;
			const y = ((random(`py${i}`) * 2080 - t * (10 + random(`pvy${i}`) * 18) + 2080) % 2080) - 80;
			const r = 2 + random(`pr${i}`) * 4;
			return <circle key={i} cx={x} cy={y} r={r} fill="#ffe2b8" opacity={0.18 + 0.3 * Math.abs(Math.sin(t * 1.3 + i))} />;
		})}
	</svg>
);

// Аниме-«линии концентрации» на шоковых моментах
const SpeedLines: React.FC<{ k: number }> = ({ k }) =>
	k <= 0 ? null : (
		<svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: k }}>
			{Array.from({ length: 64 }, (_, i) => {
				const a = (i / 64) * Math.PI * 2 + random(`sl${i}`) * 0.05;
				const r0 = 560 + random(`slr${i}`) * 260;
				const w = 4 + random(`slw${i}`) * 10;
				const cx = W / 2;
				const cy = H / 2;
				const x0 = cx + Math.cos(a) * r0;
				const y0 = cy + Math.sin(a) * r0 * 1.6;
				const x1 = cx + Math.cos(a) * 1600;
				const y1 = cy + Math.sin(a) * 2600;
				const nx = -Math.sin(a) * w;
				const ny = Math.cos(a) * w;
				return <path key={i} d={`M${x0},${y0} L${x1 + nx},${y1 + ny} L${x1 - nx},${y1 - ny} Z`} fill="#fff" opacity={0.75} />;
			})}
		</svg>
	);

export const AiScene: React.FC<{ catOverlay?: React.ReactNode }> = ({ catOverlay }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const t = frame / fps;

	const [heroSrc, heroAt] = pick(t, [
		[0, 'ai/hero_phone.png'],
		[6.6, 'ai/hero_shock.png'],
		[10.9, 'ai/hero_nervous.png'],
	]);
	const [catSrc, catAt] = pick(t, [
		[0, 'ai/cat_sly.png'],
		[9.9, 'ai/cat_shock.png'],
	]);
	const flash = AI_CUTS.reduce((acc, c) => (t >= c && t < c + 0.12 ? 0.55 * (1 - (t - c) / 0.12) : acc), 0);
	const lines = Math.max(
		t >= 6.6 && t < 7.3 ? 1 - prog(t, 6.9, 7.3) : 0,
		t >= 9.9 && t < 10.9 ? 1 - prog(t, 10.5, 10.9) : 0,
	);
	const nervousShake = t >= 10.9 ? Math.sin(t * 55) * 1.2 : 0;

	return (
		<AbsoluteFill style={{ backgroundColor: '#1a1030', overflow: 'hidden' }}>
			{/* дальний слой: комната + кот на подоконнике + его мысли */}
			<div style={layer(t, 0.8)}>
				<Img src={staticFile('ai/bg_room.png')} style={{ position: 'absolute', left: -40, top: -70, width: W + 80, height: H + 140 }} />
				<Sprite src={catSrc} x={770} bottom={818} height={350} t={t} changedAt={catAt} breathe={0.015} />
				{catOverlay}
			</div>
			{/* ближний слой: герой */}
			<div style={layer(t, 1)}>
				<Sprite src={heroSrc} x={400} bottom={1800} height={880} t={t} changedAt={heroAt} breathe={0.01} tilt={nervousShake} />
			</div>
			{/* передний план: пылинки и свет */}
			<div style={layer(t, 1.3)}>
				<Particles t={t} />
			</div>
			<AbsoluteFill
				style={{
					mixBlendMode: 'screen',
					background: 'radial-gradient(circle at 70% 30%, rgba(255,150,90,.18), rgba(0,0,0,0) 55%)',
				}}
			/>
			<SpeedLines k={clamp(lines, 0, 1) * 0.55} />
			<AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(10,0,30,.6) 100%)' }} />
			{flash > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} /> : null}
		</AbsoluteFill>
	);
};
