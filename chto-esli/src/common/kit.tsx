import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../ep1/fonts';

// Общий набор графики канала: кадры-сцены с параллаксом, персонажи-вырезки, плашки и заголовки.

export const W = 1920;
export const H = 1080;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeIO = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export const popIn = (frame: number, start: number, len: number) =>
	interpolate(frame, [start, start + len], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.34, 1.7, 0.5, 1),
	});
export const fadeOut = (frame: number, dur: number, len: number) =>
	interpolate(frame, [dur - len, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const big = (size: number, color: string, stroke: number): React.CSSProperties => ({
	fontFamily: FONT,
	fontWeight: 900,
	fontSize: size,
	lineHeight: 1.02,
	color,
	textTransform: 'uppercase',
	WebkitTextStroke: `${stroke}px #000`,
	paintOrder: 'stroke fill',
	textShadow: `0 ${stroke * 0.6}px 0 #000`,
	letterSpacing: -1,
});

export const Badge: React.FC<{ text: string; size?: number; color?: string; style?: React.CSSProperties }> = ({ text, size = 46, color = '#e3262b', style }) => (
	<div
		style={{
			display: 'inline-block',
			padding: '10px 26px 12px',
			background: color,
			border: '6px solid #fff',
			borderRadius: 16,
			boxShadow: '0 8px 0 #000, 0 0 0 4px #000',
			fontFamily: FONT,
			fontWeight: 900,
			fontSize: size,
			color: '#fff',
			textTransform: 'uppercase',
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{text}
	</div>
);

// Плашка, которая выпрыгивает в момент `at` (секунды от начала сцены) и держится до конца сцены
export const PopBadge: React.FC<{ text: string; at: number; x: number; y: number; size?: number; color?: string; rotate?: number }> = ({
	text,
	at,
	x,
	y,
	size,
	color,
	rotate = -2,
}) => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const k = popIn(f, at * fps, 0.3 * fps) * fadeOut(f, durationInFrames, 0.15 * fps);
	return (
		<div style={{ position: 'absolute', left: x, top: y, scale: k, rotate: `${rotate}deg`, transformOrigin: 'left center' }}>
			<Badge text={text} size={size} color={color} />
		</div>
	);
};

export const PopTitle: React.FC<{ lines: { text: string; size: number; color: string }[]; at?: number; x: number; y: number; align?: 'left' | 'center' }> = ({
	lines,
	at = 0,
	x,
	y,
	align = 'left',
}) => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const out = fadeOut(f, durationInFrames, 0.2 * fps);
	return (
		<div style={{ position: 'absolute', left: x, top: y, rotate: '-2deg', textAlign: align, width: align === 'center' ? W - 2 * x : undefined }}>
			{lines.map((l, i) => (
				<div
					key={i}
					style={{
						...big(l.size, l.color, Math.round(l.size / 6.5)),
						scale: popIn(f, (at + i * 0.18) * fps, 0.35 * fps) * out,
						transformOrigin: align === 'center' ? 'center' : 'left center',
					}}
				>
					{l.text}
				</div>
			))}
		</div>
	);
};

// Персонаж-вырезка: якорь — середина нижнего края. Лёгкое дыхание + пружинка при появлении.
export const Sprite: React.FC<{
	src: string;
	x: number;
	bottom: number;
	height: number;
	t: number;
	changedAt?: number;
	flip?: boolean;
	slideFrom?: number;
	slideAt?: number;
	slideDur?: number;
	shake?: number;
}> = ({ src, x, bottom, height, t, changedAt = -10, flip, slideFrom, slideAt = 0, slideDur = 0.5, shake = 0 }) => {
	const since = t - changedAt;
	const pk = prog(since, 0, 0.35);
	const pop = since > 0 && since < 0.35 ? 1 + 0.1 * Math.sin(pk * Math.PI) * (1 - pk * 0.5) : 1;
	const b = Math.sin(t * 2.4 + x) * 0.012;
	const sx = slideFrom === undefined ? x : lerp(slideFrom, x, easeIO(prog(t, slideAt, slideAt + slideDur)));
	const sh = shake ? Math.sin(t * 60) * shake : 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: sx + sh,
				top: bottom - height,
				height,
				translate: '-50% 0',
				transformOrigin: '50% 100%',
				scale: `${(flip ? -1 : 1) * (1 - b * 0.5) * (2 - pop)} ${(1 + b) * pop}`,
				filter: 'drop-shadow(0 16px 14px rgba(0,0,30,.5))',
			}}
		>
			<Img src={staticFile(src)} style={{ height: '100%', display: 'block' }} />
		</div>
	);
};

// Камера сцены: плавный наезд из from в to; depth задаёт параллакс слоя
export type Cam = [number, number, number];
export const camLayer = (t: number, dur: number, from: Cam, to: Cam, depth: number, shake = 0): React.CSSProperties => {
	const k = easeIO(prog(t, 0, dur));
	const cx = lerp(from[0], to[0], k);
	const cy = lerp(from[1], to[1], k);
	const zoom = lerp(from[2], to[2], k);
	const z = 1 + (zoom - 1) * depth;
	const lx = W / 2 + (cx - W / 2) * depth;
	const ly = H / 2 + (cy - H / 2) * depth;
	const sx = shake ? Math.sin(t * 97) * shake : 0;
	const sy = shake ? Math.cos(t * 83) * shake * 0.7 : 0;
	return {
		position: 'absolute',
		left: 0,
		top: 0,
		width: W,
		height: H,
		transformOrigin: '0 0',
		translate: `${W / 2 - lx * z + sx}px ${H / 2 - ly * z + sy}px`,
		scale: z,
	};
};

export const Bg: React.FC<{ src: string; dim?: number }> = ({ src, dim = 0 }) => (
	<>
		<Img src={staticFile(src)} style={{ position: 'absolute', left: -60, top: -34, width: W + 120, height: H + 68 }} />
		{dim ? <div style={{ position: 'absolute', left: -60, top: -34, width: W + 120, height: H + 68, background: `rgba(5,0,20,${dim})` }} /> : null}
	</>
);

export const Vignette: React.FC = () => (
	<AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(5,0,25,.6) 100%)' }} />
);

export const Flash: React.FC = () => {
	const f = useCurrentFrame();
	const o = interpolate(f, [0, 3], [0.5, 0], { extrapolateRight: 'clamp' });
	return <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${o})` }} />;
};

export const SpeedLines: React.FC<{ k: number }> = ({ k }) =>
	k <= 0 ? null : (
		<svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: k }}>
			{Array.from({ length: 72 }, (_, i) => {
				const a = (i / 72) * Math.PI * 2 + random(`sl${i}`) * 0.04;
				const r0 = 420 + random(`slr${i}`) * 220;
				const w = 3 + random(`slw${i}`) * 9;
				const x0 = W / 2 + Math.cos(a) * r0;
				const y0 = H / 2 + Math.sin(a) * r0 * 0.75;
				const x1 = W / 2 + Math.cos(a) * 2200;
				const y1 = H / 2 + Math.sin(a) * 1600;
				const nx = -Math.sin(a) * w;
				const ny = Math.cos(a) * w;
				return <path key={i} d={`M${x0},${y0} L${x1 + nx},${y1 + ny} L${x1 - nx},${y1 - ny} Z`} fill="#fff" opacity={0.8} />;
			})}
		</svg>
	);

// Снежинки — атмосфера казанской зимы
export const Snow: React.FC<{ t: number }> = ({ t }) => (
	<svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
		{Array.from({ length: 70 }, (_, i) => {
			const sp = 40 + random(`sn${i}`) * 70;
			const x = (random(`sx${i}`) * (W + 100) + Math.sin(t * 1.3 + i) * 30) % (W + 100);
			const y = ((random(`sy${i}`) * (H + 100) + t * sp) % (H + 100)) - 50;
			return <circle key={i} cx={x} cy={y} r={2 + random(`sr${i}`) * 4} fill="#fff" opacity={0.55} />;
		})}
	</svg>
);
