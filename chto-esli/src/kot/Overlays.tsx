import React from 'react';
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = '"Liberation Sans", "DejaVu Sans", Arial, sans-serif';

const outlined = (size: number, color: string, stroke: number): React.CSSProperties => ({
	fontFamily: FONT,
	fontWeight: 900,
	fontSize: size,
	lineHeight: 1.05,
	color,
	WebkitTextStroke: `${stroke}px #000`,
	paintOrder: 'stroke fill',
	letterSpacing: -1,
});

const pop = (frame: number, start: number, len: number) =>
	interpolate(frame, [start, start + len], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.34, 1.7, 0.5, 1),
	});

// ---------- Заголовок-хук ----------
const TitleInner: React.FC<{ line1: string; line2: string; badge?: string; style?: React.CSSProperties }> = ({ line1, line2, badge = '', style }) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const out = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div style={{ position: 'absolute', rotate: '-3deg', ...style }}>
			<div style={{ ...outlined(76, '#ffffff', 16), scale: pop(frame, 0, 0.4 * fps) * out, transformOrigin: 'left center' }}>
				{line1}
			</div>
			<div style={{ ...outlined(112, '#ffd23f', 22), scale: pop(frame, 0.25 * fps, 0.4 * fps) * out, transformOrigin: 'left center' }}>
				{line2}
			</div>
			{badge ? (
				<div
					style={{
						display: 'inline-block',
						marginTop: 18,
						padding: '8px 22px',
						background: '#e3262b',
						border: '5px solid #fff',
						borderRadius: 14,
						boxShadow: '0 6px 0 #000',
						...outlined(48, '#ffffff', 0),
						WebkitTextStroke: '0px',
						scale: pop(frame, 0.55 * fps, 0.35 * fps) * out,
						rotate: '2deg',
					}}
				>
					{badge}
				</div>
			) : null}
		</div>
	);
};

export const TitleCard = Interactive.create({
	Component: TitleInner,
	layout: 'none',
	schema: {
		line1: { type: 'string', default: 'ЧТО, ЕСЛИ БЫ ТЫ', description: 'Первая строка' },
		line2: { type: 'string', default: 'СЛЫШАЛ КОТА?!', description: 'Вторая строка' },
		badge: { type: 'string', default: '', description: 'Красная плашка' },
	},
});

// ---------- Пузырь мыслей (в координатах сцены, двигается вместе с котом) ----------
const BubbleInner: React.FC<{
	text: string;
	fontSize: number;
	tailX: number;
	tailY: number;
	style?: React.CSSProperties;
}> = ({ text, fontSize, tailX, tailY, style }) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const k =
		pop(frame, 0, 0.35 * fps) *
		interpolate(frame, [durationInFrames - 0.2 * fps, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// эффект печатной машинки: ~38 символов в секунду
	const shown = Math.max(0, Math.floor(((frame - 0.15 * fps) / fps) * 38));
	return (
		<div style={{ position: 'absolute', ...style }}>
			<div style={{ position: 'absolute', inset: 0, scale: k }}>
				{[0, 1, 2].map((i) => {
					const kk = (i + 1) / 4;
					const r = 20 - i * 6;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: `calc(78% + ${(tailX - 0.78) * kk * 100}%)`,
								top: `calc(100% + ${tailY * kk}px)`,
								width: r * 2,
								height: r * 2,
								marginLeft: -r,
								marginTop: -r,
								borderRadius: '50%',
								background: '#fff',
								border: '5px solid #000',
							}}
						/>
					);
				})}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: '#fff',
						border: '6px solid #000',
						borderRadius: 44,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '0 36px',
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: 700,
						fontSize,
						lineHeight: 1.18,
						color: '#1b1530',
					}}
				>
					{/* невидимая часть текста держит размер, чтобы строки не прыгали при печати */}
					<span>
						{text.slice(0, shown)}
						<span style={{ visibility: 'hidden' }}>{text.slice(shown)}</span>
					</span>
				</div>
			</div>
		</div>
	);
};

export const Bubble = Interactive.create({
	Component: BubbleInner,
	layout: 'none',
	schema: {
		text: { type: 'string', default: '', description: 'Мысль кота' },
		fontSize: { type: 'number', default: 44, min: 20, max: 90, description: 'Размер текста', hiddenFromList: false },
		tailX: { type: 'number', default: 0.78, step: 0.01, description: 'Хвостик: X (доля ширины)', hiddenFromList: false },
		tailY: { type: 'number', default: 80, description: 'Хвостик: длина вниз, px', hiddenFromList: false },
	},
});

// ---------- Субтитры рассказчика ----------
const CaptionInner: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const opacity = interpolate(frame, [0, 0.15 * fps, durationInFrames - 0.15 * fps, durationInFrames], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div style={{ position: 'absolute', left: 80, right: 80, textAlign: 'center', ...outlined(56, '#ffffff', 12), opacity, ...style }}>
			{text}
		</div>
	);
};

export const Caption = Interactive.create({
	Component: CaptionInner,
	layout: 'none',
	schema: {
		text: { type: 'string', default: '', description: 'Текст субтитра' },
	},
});

// ---------- Финальная плашка ----------
const EndInner: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				left: 80,
				right: 80,
				textAlign: 'center',
				...outlined(80, '#ffd23f', 18),
				scale: pop(frame, 0, 0.35 * fps),
				...style,
			}}
		>
			{text}
		</div>
	);
};

export const EndCard = Interactive.create({
	Component: EndInner,
	layout: 'none',
	schema: {
		text: { type: 'string', default: 'ПРОДОЛЖЕНИЕ СЛЕДУЕТ…', description: 'Текст финала' },
	},
});
