import { Audio } from '@remotion/media';
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from './fonts';

// Пилот «ЧТО, ЕСЛИ бы ты слышал мысли кота?» — 16:9, ~34 с, с озвучкой.
// Мир сцены — 1920×1080. Фон и кот на подоконнике — дальний слой (depth 0.8), герой — ближний (1.0).

const W = 1920;
const H = 1080;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeIO = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// ---------- тайминг озвучки (секунды) ----------
export const VO = {
	n1: { at: 0.3, dur: 5.37 },
	n2: { at: 5.85, dur: 6.21 },
	c1: { at: 12.25, dur: 4.42 },
	c2: { at: 16.85, dur: 5.46 },
	n4: { at: 22.45, dur: 2.74 },
	c3: { at: 25.35, dur: 2.71 },
	n5: { at: 28.25, dur: 5.14 },
};
export const EP1_DURATION = 34;

// ---------- камера: [начало, конец, откуда, куда]; разрыв = склейка ----------
type Cam = [number, number, number];
const SHOTS: [number, number, Cam, Cam][] = [
	[0, 5.85, [960, 540, 1.0], [960, 560, 1.08]], // общий план + хук
	[5.85, 10.2, [1060, 600, 1.45], [1030, 590, 1.58]], // знакомство с Артёмом
	[10.2, 12.2, [1000, 440, 2.15], [1000, 430, 2.4]], // «голос в голове»
	[12.2, 16.75, [1310, 330, 1.85], [1300, 335, 2.0]], // кот: мысль 1
	[16.75, 22.35, [1315, 315, 2.15], [1320, 305, 2.45]], // кот: мысль 2 (злодейски)
	[22.35, 25.25, [960, 540, 1.0], [960, 540, 1.0]], // вставка — унитаз
	[25.25, 28.15, [1315, 320, 2.3], [1315, 320, 2.55]], // кот в шоке
	[28.15, 34.1, [1000, 470, 1.85], [1000, 460, 2.05]], // Артём крупно, финал
];
const CUTS = [5.85, 10.2, 12.2, 16.75, 22.35, 25.25, 28.15];

const camAt = (t: number): Cam => {
	for (const [a, b, f, to] of SHOTS) {
		if (t >= a && t < b) {
			const k = easeIO(prog(t, a, b));
			return [lerp(f[0], to[0], k), lerp(f[1], to[1], k), lerp(f[2], to[2], k)];
		}
	}
	return SHOTS[SHOTS.length - 1][3];
};
const shakeAt = (t: number): [number, number] => {
	let a = 0;
	for (const s of [10.6, 25.3]) if (t >= s && t < s + 0.5) a = Math.max(a, 18 * (1 - (t - s) / 0.5));
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
		translate: `${W / 2 - lx * z + sx}px ${H / 2 - ly * z + sy}px`,
		scale: z,
	};
};

const pick = (t: number, list: [number, string][]): [string, number] => {
	let cur = list[0];
	for (const it of list) if (t >= it[0]) cur = it;
	return [cur[1], cur[0]];
};

// Вырезанный персонаж: якорь — середина нижнего края; «дыхание» и пружинка при смене эмоции.
const Sprite: React.FC<{ src: string; x: number; bottom: number; height: number; t: number; changedAt: number; tilt?: number }> = ({
	src,
	x,
	bottom,
	height,
	t,
	changedAt,
	tilt = 0,
}) => {
	const since = t - changedAt;
	const pk = prog(since, 0, 0.35);
	const pop = since > 0 && since < 0.35 ? 1 + 0.1 * Math.sin(pk * Math.PI) * (1 - pk * 0.5) : 1;
	const b = Math.sin(t * 2.4) * 0.012;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: bottom - height,
				height,
				translate: '-50% 0',
				transformOrigin: '50% 100%',
				scale: `${(1 - b * 0.5) * (2 - pop)} ${(1 + b) * pop}`,
				rotate: `${tilt}deg`,
				filter: 'drop-shadow(0 16px 14px rgba(0,0,30,.5))',
			}}
		>
			<Img src={staticFile(src)} style={{ height: '100%', display: 'block' }} />
		</div>
	);
};

const SpeedLines: React.FC<{ k: number; cx?: number; cy?: number }> = ({ k, cx = W / 2, cy = H / 2 }) =>
	k <= 0 ? null : (
		<svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: k }}>
			{Array.from({ length: 72 }, (_, i) => {
				const a = (i / 72) * Math.PI * 2 + random(`sl${i}`) * 0.04;
				const r0 = 380 + random(`slr${i}`) * 220;
				const w = 3 + random(`slw${i}`) * 9;
				const x0 = cx + Math.cos(a) * r0;
				const y0 = cy + Math.sin(a) * r0 * 0.75;
				const x1 = cx + Math.cos(a) * 2200;
				const y1 = cy + Math.sin(a) * 1600;
				const nx = -Math.sin(a) * w;
				const ny = Math.cos(a) * w;
				return <path key={i} d={`M${x0},${y0} L${x1 + nx},${y1 + ny} L${x1 - nx},${y1 - ny} Z`} fill="#fff" opacity={0.8} />;
			})}
		</svg>
	);

// Звуковые волны вокруг головы — «голос в голове»
const VoiceRings: React.FC<{ t: number; at: number }> = ({ t, at }) => {
	if (t < at || t > at + 1.7) return null;
	return (
		<svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
			{[0, 1, 2].map((i) => {
				const k = ((t - at) * 1.4 + i / 3) % 1;
				return (
					<circle key={i} cx={700} cy={430} r={220 + k * 420} fill="none" stroke="#ffd23f" strokeWidth={14 * (1 - k)} opacity={1 - k} />
				);
			})}
		</svg>
	);
};

// ---------- текстовые элементы (стиль превью канала: жирный капс, жёлтый/белый, чёрная обводка) ----------
const big = (size: number, color: string, stroke: number): React.CSSProperties => ({
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
const popIn = (frame: number, start: number, len: number) =>
	interpolate(frame, [start, start + len], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.34, 1.7, 0.5, 1),
	});
const fadeOut = (frame: number, dur: number, len: number) =>
	interpolate(frame, [dur - len, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const Badge: React.FC<{ text: string; size?: number; style?: React.CSSProperties }> = ({ text, size = 46, style }) => (
	<div
		style={{
			display: 'inline-block',
			padding: '10px 26px 12px',
			background: '#e3262b',
			border: '6px solid #fff',
			borderRadius: 16,
			boxShadow: '0 8px 0 #000, 0 0 0 4px #000',
			fontFamily: FONT,
			fontWeight: 900,
			fontSize: size,
			color: '#fff',
			textTransform: 'uppercase',
			...style,
		}}
	>
		{text}
	</div>
);

const HookTitle: React.FC = () => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const out = fadeOut(f, durationInFrames, 0.25 * fps);
	return (
		<AbsoluteFill style={{ padding: '70px 90px' }}>
			<div style={{ rotate: '-2deg', transformOrigin: 'left top' }}>
				<div style={{ ...big(62, '#fff', 13), scale: popIn(f, 0, 0.35 * fps) * out, transformOrigin: 'left center' }}>Что, если бы ты</div>
				<div style={{ ...big(108, '#ffd23f', 20), scale: popIn(f, 0.2 * fps, 0.4 * fps) * out, transformOrigin: 'left center' }}>
					слышал мысли
					<br />
					своего кота?
				</div>
				<div style={{ marginTop: 26, scale: popIn(f, 2.9 * fps, 0.35 * fps) * out, transformOrigin: 'left center', rotate: '2deg' }}>
					<Badge text="Спойлер: лучше не надо" />
				</div>
			</div>
		</AbsoluteFill>
	);
};

const NameTag: React.FC = () => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const k = popIn(f, 0, 0.35 * fps) * fadeOut(f, durationInFrames, 0.2 * fps);
	return (
		<AbsoluteFill>
			<div style={{ position: 'absolute', left: 150, top: 330, scale: k, rotate: '-3deg' }}>
				<div style={big(96, '#fff', 16)}>Артём</div>
				<div style={{ marginTop: 10 }}>
					<Badge text="25 лет • обычный парень" size={38} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Пузырь мыслей кота: текст «печатается» в темпе озвучки
const Thought: React.FC<{ text: string; voiceDur: number; left: number; top: number; width: number; size: number; tailX: number; tailY: number; evil?: boolean }> = ({
	text,
	voiceDur,
	left,
	top,
	width,
	size,
	tailX,
	tailY,
	evil,
}) => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const k = popIn(f, 0, 0.3 * fps) * fadeOut(f, durationInFrames, 0.15 * fps);
	const shown = Math.floor(clamp((f / fps - 0.05) / (voiceDur * 0.92), 0, 1) * text.length);
	return (
		<AbsoluteFill>
			<div style={{ position: 'absolute', left, top, width, scale: k, transformOrigin: `${tailX * 100}% 120%` }}>
				{[0, 1, 2].map((i) => {
					const r = 22 - i * 6;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: `calc(${tailX * 100}% + ${i * 26}px)`,
								top: `calc(100% + ${16 + i * (tailY / 3)}px)`,
								width: r * 2,
								height: r * 2,
								borderRadius: '50%',
								background: '#fff',
								border: '6px solid #000',
							}}
						/>
					);
				})}
				<div
					style={{
						position: 'relative',
						background: evil ? 'linear-gradient(#fff, #ffe3e3)' : '#fff',
						border: '7px solid #000',
						borderRadius: 48,
						padding: '30px 44px',
						boxShadow: '0 10px 0 #000',
						fontFamily: FONT,
						fontWeight: 800,
						fontSize: size,
						lineHeight: 1.15,
						color: '#16112b',
						textAlign: 'center',
					}}
				>
					<span>
						{text.slice(0, shown)}
						<span style={{ visibility: 'hidden' }}>{text.slice(shown)}</span>
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const PhonesLost: React.FC = () => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	return (
		<AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70 }}>
			<div style={{ scale: popIn(f, 0.35 * fps, 0.35 * fps), rotate: '-3deg' }}>
				<Badge text="−3 телефона" size={84} />
			</div>
		</AbsoluteFill>
	);
};

const EndCard: React.FC = () => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	return (
		<AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 90 }}>
			<div style={{ ...big(92, '#ffd23f', 18), scale: popIn(f, 0, 0.35 * fps), textAlign: 'center' }}>Продолжение следует…</div>
			<div style={{ marginTop: 22, scale: popIn(f, 0.5 * fps, 0.35 * fps) }}>
				<Badge text="Подписывайся!" size={52} />
			</div>
		</AbsoluteFill>
	);
};

// ---------- сцена ----------
const Scene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const t = frame / fps;
	const [heroSrc, heroAt] = pick(t, [
		[0, 'ep1/hero_phone.png'],
		[10.6, 'ep1/hero_shock.png'],
		[28.15, 'ep1/hero_nervous.png'],
	]);
	const [catSrc, catAt] = pick(t, [
		[0, 'ep1/cat_sly.png'],
		[25.25, 'ep1/cat_shock.png'],
	]);
	const catShot = (t >= 12.2 && t < 22.35) || (t >= 25.25 && t < 28.15);
	const toilet = t >= 22.35 && t < 25.25;
	const flash = CUTS.reduce((acc, c) => (t >= c && t < c + 0.1 ? 0.45 * (1 - (t - c) / 0.1) : acc), 0);
	const lines = Math.max(t >= 10.5 && t < 11.4 ? 1 - prog(t, 11.0, 11.4) : 0, t >= 25.25 && t < 26.4 ? 1 - prog(t, 25.9, 26.4) : 0);
	const evil = t >= 16.75 && t < 22.35 ? prog(t, 16.75, 17.4) : 0;
	return (
		<AbsoluteFill style={{ backgroundColor: '#0d0b24', overflow: 'hidden' }}>
			<div style={layer(t, 0.8)}>
				<Img src={staticFile('ep1/bg_room.png')} style={{ position: 'absolute', left: -60, top: -34, width: W + 120, height: H + 68 }} />
				<Sprite src={catSrc} x={1250} bottom={548} height={370} t={t} changedAt={catAt} />
			</div>
			<div style={{ ...layer(t, 1), opacity: catShot ? 0 : 1 }}>
				<Sprite src={heroSrc} x={1000} bottom={1045} height={770} t={t} changedAt={heroAt} tilt={t >= 28.15 ? Math.sin(t * 55) * 1.1 : 0} />
			</div>
			{evil > 0 ? (
				<AbsoluteFill style={{ background: `radial-gradient(ellipse at 55% 45%, rgba(0,0,0,0) 35%, rgba(150,0,30,${0.55 * evil}) 100%)` }} />
			) : null}
			<VoiceRings t={t} at={10.55} />
			{toilet ? (
				<AbsoluteFill>
					<Img
						src={staticFile('ep1/toilet.png')}
						style={{ width: '100%', height: '100%', objectFit: 'cover', scale: 1.04 + prog(t, 22.35, 25.25) * 0.1 }}
					/>
				</AbsoluteFill>
			) : null}
			<SpeedLines k={clamp(lines, 0, 1) * 0.6} />
			<AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(5,0,25,.55) 100%)' }} />
			{flash > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} /> : null}
		</AbsoluteFill>
	);
};

export const Episode1: React.FC = () => {
	const { fps } = useVideoConfig();
	const s = (x: number) => Math.round(x * fps);
	return (
		<AbsoluteFill>
			<Scene />
			<Track name="Графика">
				<Sequence name="Хук-заголовок" from={s(0.25)} durationInFrames={s(5.5)}>
					<HookTitle />
				</Sequence>
				<Sequence name="Имя героя" from={s(6.2)} durationInFrames={s(3.8)}>
					<NameTag />
				</Sequence>
				<Sequence name="−3 телефона" from={s(22.35)} durationInFrames={s(2.9)}>
					<PhonesLost />
				</Sequence>
				<Sequence name="Финал" from={s(30.6)} durationInFrames={s(3.4)}>
					<EndCard />
				</Sequence>
			</Track>
			<Track name="Мысли кота">
				<Sequence name="Мысль 1" from={s(VO.c1.at - 0.1)} durationInFrames={s(VO.c1.dur + 0.3)}>
					<Thought text="Опять этот лысый великан забыл про мой ужин." voiceDur={VO.c1.dur} left={150} top={150} width={820} size={58} tailX={0.78} tailY={60} />
				</Sequence>
				<Sequence name="Мысль 2" from={s(VO.c2.at - 0.1)} durationInFrames={s(VO.c2.dur + 0.3)}>
					<Thought text="Ничего… Ночью скину его телефон в унитаз. Снова." voiceDur={VO.c2.dur} left={120} top={140} width={820} size={58} tailX={0.8} tailY={60} evil />
				</Sequence>
				<Sequence name="Мысль 3" from={s(VO.c3.at - 0.05)} durationInFrames={s(VO.c3.dur + 0.3)}>
					<Thought text="Стоп… Ты что, меня СЛЫШИШЬ?!" voiceDur={VO.c3.dur} left={110} top={170} width={760} size={64} tailX={0.82} tailY={60} />
				</Sequence>
			</Track>
			<Track name="Озвучка">
				<Audio name="Рассказчик: хук" src={staticFile('vo/n1.wav')} from={s(VO.n1.at)} />
				<Audio name="Рассказчик: Артём" src={staticFile('vo/n2.wav')} from={s(VO.n2.at)} />
				<Audio name="Кот: ужин" src={staticFile('vo/c1.wav')} from={s(VO.c1.at)} />
				<Audio name="Кот: унитаз" src={staticFile('vo/c2.wav')} from={s(VO.c2.at)} />
				<Audio name="Рассказчик: три телефона" src={staticFile('vo/n4.wav')} from={s(VO.n4.at)} />
				<Audio name="Кот: слышишь?!" src={staticFile('vo/c3.wav')} from={s(VO.c3.at)} />
				<Audio name="Рассказчик: финал" src={staticFile('vo/n5.wav')} from={s(VO.n5.at)} />
			</Track>
			<Track name="Музыка">
				<Audio name="Фон" src={staticFile('sfx/music.wav')} volume={0.22} loop />
			</Track>
			<Track name="Звуки">
				<Audio name="Вжух — заголовок" src={staticFile('sfx/whoosh.wav')} from={s(0.2)} volume={0.5} />
				<Audio name="Поп — плашка" src={staticFile('sfx/pop.wav')} from={s(3.15)} volume={0.6} />
				<Audio name="Поп — имя" src={staticFile('sfx/pop.wav')} from={s(6.2)} volume={0.6} />
				<Audio name="Бум — голос в голове" src={staticFile('sfx/boom.wav')} from={s(10.55)} volume={0.7} />
				<Audio name="Поп — мысль 1" src={staticFile('sfx/pop.wav')} from={s(12.15)} volume={0.5} />
				<Audio name="Поп — мысль 2" src={staticFile('sfx/pop.wav')} from={s(16.75)} volume={0.5} />
				<Audio name="Вжух — унитаз" src={staticFile('sfx/whoosh.wav')} from={s(22.3)} volume={0.5} />
				<Audio name="Бум — шок кота" src={staticFile('sfx/boom.wav')} from={s(25.25)} volume={0.9} />
				<Audio name="Поп — финал" src={staticFile('sfx/pop.wav')} from={s(30.6)} volume={0.6} />
			</Track>
		</AbsoluteFill>
	);
};
