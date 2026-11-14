import { Audio } from '@remotion/media';
import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from 'remotion';
import { easeIO, Flash, H, lerp, PopBadge, PopTitle, prog, Snow, Vignette, W } from '../common/kit';

// «Айда!» — пересказ 1–3 серий за ~30 секунд. Иллюстрации — фан-арт в стиле канала (стикмены), не кадры сериала.

const VO: [string, number][] = [
	['a1', 0.3],
	['a2', 3.03],
	['a3', 10.19],
	['a4', 18.13],
	['a5', 24.61],
	['a6', 29.71],
];
export const AIDA_DURATION_S = 34;

// Панель-иллюстрация с «кен-бёрнсом»: плавный наезд/панорама из from в to (cx, cy, zoom)
const Panel: React.FC<{ src: string; from: [number, number, number]; to: [number, number, number]; dim?: number; snow?: boolean; children?: React.ReactNode }> = ({
	src,
	from,
	to,
	dim = 0,
	snow,
	children,
}) => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const t = f / fps;
	const k = easeIO(prog(f, 0, durationInFrames));
	const cx = lerp(from[0], to[0], k);
	const cy = lerp(from[1], to[1], k);
	const z = lerp(from[2], to[2], k);
	return (
		<AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
			<Img
				src={staticFile(src)}
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: W,
					height: H,
					transformOrigin: '0 0',
					translate: `${W / 2 - cx * z}px ${H / 2 - cy * z}px`,
					scale: z,
				}}
			/>
			{dim ? <AbsoluteFill style={{ background: `rgba(5,0,20,${dim})` }} /> : null}
			{snow ? <Snow t={t} /> : null}
			<Vignette />
			{children}
			<Flash />
		</AbsoluteFill>
	);
};

const Credit: React.FC = () => (
	<div style={{ position: 'absolute', right: 28, bottom: 20, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 22, color: 'rgba(255,255,255,.75)' }}>
		Пересказ сериала «Айда!» (START, 2026) • иллюстрации — фан-арт
	</div>
);

export const AidaRecap: React.FC = () => {
	const { fps } = useVideoConfig();
	const s = (x: number) => Math.round(x * fps);
	const cuts: [string, number, number][] = [];
	const add = (name: string, a: number, b: number) => cuts.push([name, a, b]);
	add('title', 0, 2.95);
	add('move', 2.95, 6.6);
	add('boots', 6.6, 10.1);
	add('hospital', 10.1, 18.05);
	add('gym', 18.05, 24.55);
	add('nelli', 24.55, 27.3);
	add('nikonov', 27.3, 29.65);
	add('end', 29.65, AIDA_DURATION_S);
	const seq = (name: string) => {
		const c = cuts.find((x) => x[0] === name)!;
		return { from: s(c[1]), durationInFrames: s(c[2]) - s(c[1]) };
	};
	return (
		<AbsoluteFill style={{ backgroundColor: '#000' }}>
			<Track name="Панели">
				<Sequence name="Заставка" {...seq('title')}>
					<Panel src="aida/p4_gym.png" from={[960, 540, 1.15]} to={[960, 540, 1.25]} dim={0.55}>
						<PopTitle
							x={60}
							y={250}
							align="center"
							lines={[
								{ text: '«Айда!»', size: 190, color: '#ffd23f' },
								{ text: '1–3 серии за 30 секунд', size: 76, color: '#fff' },
							]}
						/>
					</Panel>
				</Sequence>
				<Sequence name="Серия 1 — переезд" {...seq('move')}>
					<Panel src="aida/p1_move.png" from={[700, 560, 1.15]} to={[900, 540, 1.3]} snow>
						<PopBadge text="Серия 1" at={0.1} x={70} y={60} size={54} />
						<PopBadge text="Гриша, 15 лет • из Волгограда" at={0.7} x={70} y={170} size={42} color="#1b4fd6" />
					</Panel>
				</Sequence>
				<Sequence name="Серия 1 — ботинки" {...seq('boots')}>
					<Panel src="aida/p2_boots.png" from={[1100, 560, 1.2]} to={[500, 600, 1.35]} snow>
						<PopBadge text="День первый: −ботинки" at={0.6} x={70} y={60} size={50} />
					</Panel>
				</Sequence>
				<Sequence name="Серия 1 — Захаревич" {...seq('hospital')}>
					<Panel src="aida/p3_hospital.png" from={[600, 560, 1.25]} to={[1250, 500, 1.55]}>
						<PopBadge text="Психбольница" at={0.3} x={70} y={60} size={50} color="#2a2a2a" />
						<PopBadge text="Захаревич — идеолог «Тяп-Ляп»" at={3.6} x={70} y={170} size={46} />
					</Panel>
				</Sequence>
				<Sequence name="Серии 2–3 — посвящение" {...seq('gym')}>
					<Panel src="aida/p4_gym.png" from={[960, 600, 1.1]} to={[960, 520, 1.4]}>
						<PopBadge text="Серии 2–3" at={0.1} x={70} y={60} size={54} />
						<PopBadge text="Кличка: «Хрип»" at={4.0} x={1190} y={80} size={56} color="#e38a12" rotate={3} />
					</Panel>
				</Sequence>
				<Sequence name="Серия 3 — Нелли" {...seq('nelli')}>
					<Panel src="aida/p5_nelli.png" from={[960, 560, 1.15]} to={[1000, 540, 1.3]} snow>
						<PopBadge text="Нелли ❤" at={0.2} x={70} y={60} size={56} color="#d6336c" />
					</Panel>
				</Sequence>
				<Sequence name="Серия 3 — Никонов" {...seq('nikonov')}>
					<Panel src="aida/p6_nikonov.png" from={[800, 540, 1.2]} to={[1150, 420, 1.6]}>
						<PopBadge text="Полковник Никонов" at={0.2} x={70} y={60} size={52} color="#1b4fd6" />
					</Panel>
				</Sequence>
				<Sequence name="Финал" {...seq('end')}>
					<Panel src="aida/p6_nikonov.png" from={[1150, 420, 1.6]} to={[1150, 420, 1.75]} dim={0.6}>
						<PopTitle x={60} y={300} align="center" lines={[{ text: 'Что дальше?', size: 150, color: '#ffd23f' }, { text: 'Смотри следующие серии', size: 70, color: '#fff' }]} />
						<div style={{ position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center' }}>
							<PopBadge text="Подписывайся!" at={1.0} x={W / 2 - 230} y={0} size={56} rotate={0} />
						</div>
					</Panel>
				</Sequence>
			</Track>
			<Credit />
			<Track name="Озвучка">
				{VO.map(([n, at]) => (
					<Audio key={n} name={`Рассказчик ${n}`} src={staticFile(`vo2/${n}.wav`)} from={s(at)} />
				))}
			</Track>
			<Track name="Музыка">
				<Audio name="Фон" src={staticFile('sfx/music.wav')} volume={0.18} loop />
			</Track>
			<Track name="Звуки">
				{cuts.slice(1).map(([name, a]) => (
					<Audio key={name} name={`Вжух — ${name}`} src={staticFile('sfx/whoosh.wav')} from={s(a - 0.1)} volume={0.35} />
				))}
			</Track>
		</AbsoluteFill>
	);
};
