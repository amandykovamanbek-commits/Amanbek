import { Audio } from '@remotion/media';
import React from 'react';
import { AbsoluteFill, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from 'remotion';
import { Bg, Cam, camLayer, Flash, PopBadge, PopTitle, Snow, SpeedLines, Sprite, Vignette, prog, clamp } from '../common/kit';

// Пилот «ЧТО, ЕСЛИ бы ты попал в группировку „Тяп-Ляп“?» — 16:9, ~33 с.
// Исторический контекст: Казань, 1970-е; в 1980 г. суд признал группировку бандой.

const VO: [string, number, number][] = [
	['t1', 0.3, 4.56],
	['t2', 5.04, 5.92],
	['t3', 11.14, 5.14],
	['t4', 16.45, 4.41],
	['t5', 21.04, 5.28],
	['t6', 26.5, 5.87],
];
export const TL_DURATION_S = 33.2;

const H_ = (n: string) => `hero/${n}.png`;
const G_ = (n: string) => `tl/gang_${n}.png`;

// Сцена = фон (глубина 0.85) + персонажи (глубина 1) + наезд камеры
const Shot: React.FC<{
	bg: string;
	from: Cam;
	to: Cam;
	dim?: number;
	snow?: boolean;
	shakeAt?: number;
	render: (t: number) => React.ReactNode;
	overlay?: (t: number) => React.ReactNode;
}> = ({ bg, from, to, dim, snow, shakeAt, render, overlay }) => {
	const f = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const t = f / fps;
	const dur = durationInFrames / fps;
	const sh = shakeAt !== undefined && t >= shakeAt && t < shakeAt + 0.45 ? 16 * (1 - (t - shakeAt) / 0.45) : 0;
	return (
		<AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#0b0920' }}>
			<div style={camLayer(t, dur, from, to, 0.85, sh)}>
				<Bg src={bg} dim={dim} />
			</div>
			<div style={camLayer(t, dur, from, to, 1, sh)}>{render(t)}</div>
			{overlay ? overlay(t) : null}
			{snow ? <Snow t={t} /> : null}
			<Vignette />
			<Flash />
		</AbsoluteFill>
	);
};

// Мигалки милиции
const PoliceLights: React.FC<{ t: number }> = ({ t }) => {
	const red = Math.sin(t * 14) > 0;
	return (
		<AbsoluteFill
			style={{
				mixBlendMode: 'screen',
				background: red
					? 'radial-gradient(circle at 15% 60%, rgba(255,30,40,.45), rgba(0,0,0,0) 55%)'
					: 'radial-gradient(circle at 15% 60%, rgba(40,90,255,.5), rgba(0,0,0,0) 55%)',
			}}
		/>
	);
};

export const TyapLyap: React.FC = () => {
	const { fps } = useVideoConfig();
	const s = (x: number) => Math.round(x * fps);
	const cut = [0, 5.0, 11.05, 16.35, 20.95, 26.4, TL_DURATION_S];
	const len = (i: number) => s(cut[i + 1]) - s(cut[i]);
	return (
		<AbsoluteFill style={{ backgroundColor: '#000' }}>
			<Track name="Сцены">
				<Sequence name="1. Хук — казанский двор" from={s(cut[0])} durationInFrames={len(0)}>
					<Shot
						bg="tl/bg_yard.png"
						snow
						from={[960, 560, 1.0]}
						to={[1000, 580, 1.1]}
						render={(t) => <Sprite src={H_('neutral')} x={1250} bottom={1010} height={640} t={t} />}
						overlay={() => (
							<>
								<PopTitle
									x={80}
									y={70}
									at={0.15}
									lines={[
										{ text: 'Что, если бы ты', size: 62, color: '#fff' },
										{ text: 'попал в банду', size: 112, color: '#ffd23f' },
										{ text: '«Тяп-Ляп»?', size: 132, color: '#ff4a3d' },
									]}
								/>
								<PopBadge text="Казань • 1974" at={1.6} x={90} y={530} size={50} />
							</>
						)}
					/>
				</Sequence>
				<Sequence name="2. Район «Теплоконтроль»" from={s(cut[1])} durationInFrames={len(1)}>
					<Shot
						bg="tl/bg_yard.png"
						snow
						from={[900, 600, 1.25]}
						to={[960, 590, 1.35]}
						render={(t) => (
							<>
								<Sprite src={H_(t < 3.4 ? 'neutral' : 'sly')} changedAt={3.4} x={760} bottom={1010} height={660} t={t} />
								<Sprite src={G_('track')} x={1250} bottom={1010} height={700} t={t} slideFrom={2300} slideAt={2.2} slideDur={0.6} />
							</>
						)}
						overlay={() => (
							<>
								<PopBadge text="Район «Теплоконтроль»" at={0.2} x={80} y={70} size={52} />
								<PopBadge text="«Пойдём в качалку?»" at={3.0} x={1000} y={600} size={48} color="#1b6fd6" rotate={3} />
							</>
						)}
					/>
				</Sequence>
				<Sequence name="3. Законы качалки" from={s(cut[2])} durationInFrames={len(2)}>
					<Shot
						bg="tl/bg_gym.png"
						from={[960, 560, 1.15]}
						to={[960, 600, 1.3]}
						render={(t) => (
							<>
								<Sprite src={G_('coat')} x={1380} bottom={960} height={620} t={t} />
								<Sprite src={G_('cap')} x={480} bottom={1030} height={700} t={t} />
								<Sprite src={G_('track')} x={1580} bottom={1060} height={740} t={t} flip />
								<Sprite src={H_(t < 3.2 ? 'neutral' : 'scared')} changedAt={3.2} x={960} bottom={1050} height={650} t={t} shake={t > 3.2 ? 1.2 : 0} />
							</>
						)}
						overlay={() => (
							<>
								<PopBadge text="1. Старших слушать" at={0.4} x={70} y={70} size={46} color="#2a2a2a" />
								<PopBadge text="2. Своих не сдавать" at={1.6} x={70} y={170} size={46} color="#2a2a2a" />
								<PopBadge text="3. Выйти нельзя" at={3.1} x={70} y={270} size={54} />
							</>
						)}
					/>
				</Sequence>
				<Sequence name="4. «Уважают… и боятся»" from={s(cut[3])} durationInFrames={len(3)}>
					<Shot
						bg="tl/bg_yard.png"
						dim={0.25}
						snow
						from={[960, 580, 1.1]}
						to={[960, 560, 1.22]}
						render={(t) => (
							<>
								<Sprite src={G_('cap')} x={560} bottom={980} height={620} t={t} />
								<Sprite src={G_('coat')} x={1420} bottom={980} height={600} t={t} />
								<Sprite src={H_(t < 2.6 ? 'happy' : 'sly')} changedAt={2.6} x={980} bottom={1040} height={690} t={t} />
							</>
						)}
						overlay={() => (
							<>
								<PopBadge text="Уважают" at={0.9} x={90} y={90} size={60} color="#22a046" />
								<PopBadge text="…и боятся" at={2.7} x={1300} y={110} size={60} rotate={3} />
							</>
						)}
					/>
				</Sequence>
				<Sequence name="5. Милиция на хвосте" from={s(cut[4])} durationInFrames={len(4)}>
					<Shot
						bg="tl/bg_street.png"
						snow
						shakeAt={0}
						from={[960, 560, 1.15]}
						to={[900, 560, 1.3]}
						render={(t) => (
							<>
								<Sprite src={H_(t < 2.4 ? 'scared' : 'run')} changedAt={2.4} x={t < 2.4 ? 1100 : 1100 + (t - 2.4) * 420} bottom={1030} height={650} t={t} shake={t < 2.4 ? 1.5 : 0} />
							</>
						)}
						overlay={(t) => (
							<>
								<PoliceLights t={t} />
								<PopBadge text="«Пробеги» = нападения" at={0.5} x={70} y={70} size={50} />
								<PopBadge text="Милиция на хвосте!" at={2.6} x={70} y={180} size={50} color="#1b4fd6" />
							</>
						)}
					/>
				</Sequence>
				<Sequence name="6. Приговор 1980" from={s(cut[5])} durationInFrames={len(5)}>
					<Shot
						bg="tl/bg_court.png"
						from={[960, 600, 1.05]}
						to={[960, 640, 1.3]}
						shakeAt={1.6}
						render={(t) => <Sprite src={H_('sad')} x={960} bottom={1060} height={660} t={t} />}
						overlay={(t) => (
							<>
								<PopBadge text="1980 • Суд" at={0.2} x={70} y={70} size={56} color="#2a2a2a" />
								<PopBadge text="Двоим лидерам — расстрел" at={1.6} x={70} y={180} size={50} />
								<PopTitle x={60} y={760} at={4.1} align="center" lines={[{ text: 'Стоило оно того?', size: 104, color: '#ffd23f' }]} />
								<SpeedLines k={t > 1.6 && t < 2.2 ? (1 - prog(t, 1.8, 2.2)) * 0.5 : 0} />
								<div
									style={{
										position: 'absolute',
										right: 30,
										bottom: 22,
										fontFamily: 'Montserrat',
										fontWeight: 800,
										fontSize: 22,
										color: 'rgba(255,255,255,.75)',
										opacity: clamp(t - 0.5, 0, 1),
									}}
								>
									По реальным событиям. Персонажи вымышлены.
								</div>
							</>
						)}
					/>
				</Sequence>
			</Track>
			<Track name="Озвучка">
				{VO.map(([n, at]) => (
					<Audio key={n} name={`Рассказчик ${n}`} src={staticFile(`vo2/${n}.wav`)} from={s(at)} />
				))}
			</Track>
			<Track name="Музыка">
				<Audio name="Фон" src={staticFile('sfx/music.wav')} volume={0.18} loop />
			</Track>
			<Track name="Звуки">
				<Audio name="Вжух" src={staticFile('sfx/whoosh.wav')} from={s(0.1)} volume={0.5} />
				<Audio name="Поп — Казань" src={staticFile('sfx/pop.wav')} from={s(1.6)} volume={0.5} />
				<Audio name="Вжух — гопник" src={staticFile('sfx/whoosh.wav')} from={s(cut[1] + 2.2)} volume={0.45} />
				<Audio name="Бум — выйти нельзя" src={staticFile('sfx/boom.wav')} from={s(cut[2] + 3.1)} volume={0.7} />
				<Audio name="Бум — милиция" src={staticFile('sfx/boom.wav')} from={s(cut[4])} volume={0.6} />
				<Audio name="Бум — приговор" src={staticFile('sfx/boom.wav')} from={s(cut[5] + 1.6)} volume={0.9} />
			</Track>
		</AbsoluteFill>
	);
};
