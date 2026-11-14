import { Audio } from '@remotion/media';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { pushCut } from '@remotion/transitions/push-cut';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import gsap from 'gsap';
import React from 'react';
import { AbsoluteFill, Img, random, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from 'remotion';
import { Badge, big, clamp, prog, SpeedLines, Sprite, Vignette } from '../common/kit';
import { Earth3D } from './Earth3D';

// «ЧТО, ЕСЛИ Земля остановится?» — тизер 26.5 с, 16:9.
// 3D: Three.js через @remotion/three. 2D: персонаж-вырезка, плашки. Монтаж: TransitionSeries. SFX: Kenney (CC0).
// Движение по принципам motion-design: вход — замедление (ease-out/back), выход — ускорение, 3 слоя движения
// (основной объект + вторичное движение + фоновая «жизнь»). Кривые плавности — из GSAP (gsap.parseEase), управляются кадром.

const backOut = gsap.parseEase('back.out(1.8)');
const expoOut = gsap.parseEase('expo.out');
const elasticOut = gsap.parseEase('elastic.out(1, 0.45)');
const powerInOut = gsap.parseEase('power2.inOut');
const powerIn = gsap.parseEase('power3.in');
const flyIn = gsap.parseEase('power1.in');

const T = 12; // длительность перехода, кадров
// Длительности сцен подобраны так, чтобы сцены начинались на 0 / 4.2 / 12.3 / 18.0 / 22.0 с
const D = [138, 255, 183, 132, 135];
export const EARTH_TOTAL = D.reduce((a, b) => a + b, 0) - T * (D.length - 1); // 795 кадров

const useT = () => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	return f / fps;
};
const ease = (fn: (k: number) => number, t: number, a: number, b: number) => fn(prog(t, a, b));

const SpaceBg: React.FC = () => (
	<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 30% 40%, #1d1f5e 0%, #0a0b26 55%, #03030c 100%)' }} />
);

// Заголовок: строки выпрыгивают с отскоком (back.out), каскад 120 мс — «драматичный» stagger
const Title: React.FC<{ lines: { text: string; size: number; color: string }[]; at: number; y: number; outAt?: number }> = ({ lines, at, y, outAt }) => {
	const t = useT();
	const out = outAt !== undefined ? 1 - ease(powerIn, t, outAt, outAt + 0.25) : 1;
	return (
		<div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center' }}>
			{lines.map((l, i) => {
				const k = ease(backOut, t, at + i * 0.12, at + i * 0.12 + 0.45);
				return (
					<div
						key={i}
						style={{
							...big(l.size, l.color, Math.round(l.size / 6.5)),
							scale: k * out,
							translate: `0 ${(1 - k) * 40}px`,
							opacity: clamp(k * 2, 0, 1) * out,
						}}
					>
						{l.text}
					</div>
				);
			})}
		</div>
	);
};

const PopBadgeE: React.FC<{ text: string; at: number; x: number; y: number; size?: number; color?: string; rotate?: number }> = ({
	text,
	at,
	x,
	y,
	size = 50,
	color,
	rotate = -2,
}) => {
	const t = useT();
	const k = ease(elasticOut, t, at, at + 0.7);
	return (
		<div style={{ position: 'absolute', left: x, top: y, scale: k, rotate: `${rotate * k}deg`, transformOrigin: 'left center' }}>
			<Badge text={text} size={size} color={color} />
		</div>
	);
};

// ---------- 1. 3D: Земля в космосе + заголовок ----------
const SceneIntro: React.FC = () => {
	const t = useT();
	const dolly = ease(powerInOut, t, 0, 4.4);
	return (
		<AbsoluteFill>
			<SpaceBg />
			<Earth3D rotationY={t * 0.45} camZ={9 - dolly * 4.3} camY={0.4 - dolly * 0.4} twinkle={Math.sin(t * 3)} earthX={0} />
			<Title
				at={0.5}
				y={70}
				lines={[
					{ text: 'Что, если', size: 70, color: '#fff' },
					{ text: 'Земля остановится?', size: 120, color: '#ffd23f' },
				]}
			/>
			<Vignette />
		</AbsoluteFill>
	);
};

// ---------- 2. 2D: герой в комнате, счётчик скорости ----------
const Counter: React.FC<{ at: number }> = ({ at }) => {
	const t = useT();
	const k = ease(expoOut, t, at, at + 2.2);
	const n = Math.round(1670 * k);
	const pop = ease(backOut, t, at - 0.2, at + 0.2);
	return (
		<div style={{ position: 'absolute', left: 90, top: 300, scale: pop, transformOrigin: 'left center' }}>
			<div style={{ ...big(150, '#ffd23f', 24), fontVariantNumeric: 'tabular-nums' }}>{n.toLocaleString('ru-RU')}</div>
			<div style={{ marginTop: 8 }}>
				<Badge text="км/ч на экваторе" size={44} />
			</div>
		</div>
	);
};

// Вращающаяся пунктирная орбита за героем — вторичное движение «ты крутишься вместе с Землёй»
const SpinRing: React.FC<{ t: number; at: number }> = ({ t, at }) => {
	const k = ease(backOut, t, at, at + 0.5);
	return (
		<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: k }}>
			<g transform={`translate(1280 600) rotate(${t * 140}) scale(${k})`}>
				<ellipse rx={420} ry={150} fill="none" stroke="#ffd23f" strokeWidth={10} strokeDasharray="40 30" strokeLinecap="round" />
				<path d="M 400 -50 L 445 0 L 380 20 Z" fill="#ffd23f" />
			</g>
		</svg>
	);
};

const SceneSpeed: React.FC = () => {
	const t = useT();
	const zoom = 1.05 + ease(powerInOut, t, 0, 8.5) * 0.12;
	return (
		<AbsoluteFill style={{ backgroundColor: '#0b0920', overflow: 'hidden' }}>
			<AbsoluteFill style={{ scale: zoom, transformOrigin: '65% 55%' }}>
				<Img src={staticFile('ep1/bg_room.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
			</AbsoluteFill>
			<AbsoluteFill style={{ background: 'rgba(8,4,30,.35)' }} />
			<SpinRing t={t} at={5.4} />
			<div style={{ position: 'absolute', inset: 0, scale: zoom, transformOrigin: '65% 55%' }}>
				<Sprite src={`hero/${t < 5.4 ? 'neutral' : 'shock'}.png`} changedAt={5.4} x={1280} bottom={1050} height={760} t={t} shake={t > 5.4 ? 1 : 0} />
			</div>
			<Counter at={0.8} />
			<PopBadgeE text="…и ты вместе с ней!" at={5.5} x={90} y={640} size={52} color="#1b6fd6" />
			<Vignette />
		</AbsoluteFill>
	);
};

// ---------- 3. 3D: Земля тормозит, 2D: герой улетает на восток ----------
const angleWithBrake = (t: number, w0: number, stopAt: number, brake: number) => {
	// угол = ∫ω(t)dt, где ω падает от w0 до 0 по кривой power2.out за `brake` секунд
	if (t < stopAt) return w0 * t;
	const steps = 60;
	const dt = Math.min(t - stopAt, brake) / steps;
	let a = w0 * stopAt;
	for (let i = 0; i < steps; i++) {
		const k = (i + 0.5) / steps;
		a += w0 * Math.pow(1 - k, 2) * dt;
	}
	return a;
};

const FlyingHero: React.FC<{ t: number; at: number }> = ({ t, at }) => {
	if (t < at) return null;
	const k = ease(flyIn, t, at, at + 1.7); // разгон — мягкий ease-in (уходит из кадра, но видно весь полёт)
	const x = -300 + k * 2600;
	const y = 640 - Math.sin(k * Math.PI) * 220; // дуга — живая траектория
	const rot = k * 540;
	return (
		<>
			{[3, 2, 1].map((i) => (
				<Img
					key={i}
					src={staticFile('hero/scared.png')}
					style={{ position: 'absolute', left: x - i * 90, top: y - 260, height: 520, rotate: `${rot - i * 25}deg`, opacity: 0.12 * (4 - i), filter: 'blur(6px)' }}
				/>
			))}
			<Img src={staticFile('hero/scared.png')} style={{ position: 'absolute', left: x, top: y - 260, height: 520, rotate: `${rot}deg` }} />
		</>
	);
};

const SceneStop: React.FC = () => {
	const t = useT();
	const stopAt = 0.6;
	const shakeAmp = t > stopAt + 0.9 && t < stopAt + 1.6 ? 0.08 * (1 - prog(t, stopAt + 0.9, stopAt + 1.6)) : 0;
	const sh: [number, number] = [Math.sin(t * 90) * shakeAmp, Math.cos(t * 77) * shakeAmp];
	const red = clamp(prog(t, stopAt + 0.9, stopAt + 1.2), 0, 1) * (1 - prog(t, stopAt + 2.6, stopAt + 3.4));
	return (
		<AbsoluteFill>
			<SpaceBg />
			<Earth3D rotationY={angleWithBrake(t, 2.2, stopAt, 1.2)} camZ={4.4 - ease(powerInOut, t, 0, 5.6) * 0.8} shake={sh} twinkle={Math.sin(t * 3)} earthX={0} />
			<AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(200,0,30,${0.5 * red}) 100%)` }} />
			<PopBadgeE text="Стоп!" at={stopAt + 0.9} x={90} y={70} size={72} />
			<SpeedLines k={t > 2.6 && t < 4.4 ? 0.55 * (1 - prog(t, 3.9, 4.4)) : 0} />
			<FlyingHero t={t} at={2.7} />
			<PopBadgeE text="Всё летит на восток →" at={2.8} x={980} y={80} size={54} color="#e38a12" rotate={2} />
			<Vignette />
		</AbsoluteFill>
	);
};

// ---------- 4. 3D: полгода день, полгода ночь ----------
const SceneDayNight: React.FC = () => {
	const t = useT();
	const orbit = ease(powerInOut, t, 0, 4.4);
	return (
		<AbsoluteFill>
			<SpaceBg />
			<Earth3D rotationY={1.3} camZ={4.6} camX={-1.2 + orbit * 2.4} camY={0.3} sunDir={[-6, 0.6, 0.5]} ambient={0.05} twinkle={Math.sin(t * 3)} />
			<PopBadgeE text="День: 6 месяцев" at={0.3} x={90} y={80} size={54} color="#e3a612" />
			<PopBadgeE text="Ночь: 6 месяцев" at={1.7} x={1260} y={840} size={54} color="#22307a" rotate={2} />
			<Vignette />
		</AbsoluteFill>
	);
};

// ---------- 5. Финал ----------
const SceneEnd: React.FC = () => {
	const t = useT();
	return (
		<AbsoluteFill>
			<SpaceBg />
			<Earth3D rotationY={t * 0.3} camZ={5.2} earthX={1.15} earthScale={0.9} twinkle={Math.sin(t * 3)} />
			<div style={{ position: 'absolute', inset: 0, translate: `${(1 - ease(backOut, t, 0.1, 0.6)) * -500}px 0` }}>
				<Sprite src="hero/sly.png" x={430} bottom={1060} height={720} t={t} />
			</div>
			<Title at={0.25} y={170} lines={[{ text: 'Выживет', size: 110, color: '#fff' }, { text: 'ли кто-нибудь?', size: 110, color: '#ffd23f' }]} />
			<div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', scale: ease(elasticOut, t, 1.5, 2.3) }}>
				<Badge text="Подписывайся!" size={64} />
			</div>
			<Vignette />
		</AbsoluteFill>
	);
};

const Sparkles: React.FC = () => {
	// фоновая «жизнь» поверх всего ролика — мерцающие искры (ambient-слой)
	const f = useCurrentFrame();
	return (
		<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
			{Array.from({ length: 18 }, (_, i) => {
				const x = random(`spx${i}`) * 1920;
				const y = random(`spy${i}`) * 1080;
				const a = Math.max(0, Math.sin(f / 9 + i * 1.7));
				return <circle key={i} cx={x} cy={y - (f % 300) * 0.2} r={2 + 3 * a} fill="#fff" opacity={0.35 * a} />;
			})}
		</svg>
	);
};

export const EarthStop: React.FC = () => {
	const { width, height } = useVideoConfig();
	const s = (sec: number) => Math.round(sec * 30);
	return (
		<AbsoluteFill style={{ backgroundColor: '#000' }}>
			<TransitionSeries name="Сцены">
				<TransitionSeries.Sequence name="1. 3D — Земля" durationInFrames={D[0]}>
					<SceneIntro />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={pushCut({ flashColor: '#ffffff', flashOpacity: 0.7 })} timing={linearTiming({ durationInFrames: T })} />
				<TransitionSeries.Sequence name="2. 2D — 1670 км/ч" durationInFrames={D[1]}>
					<SceneSpeed />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: T })} />
				<TransitionSeries.Sequence name="3. 3D+2D — остановка" durationInFrames={D[2]}>
					<SceneStop />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={clockWipe({ width, height })} timing={linearTiming({ durationInFrames: T })} />
				<TransitionSeries.Sequence name="4. 3D — день и ночь" durationInFrames={D[3]}>
					<SceneDayNight />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: T })} />
				<TransitionSeries.Sequence name="5. Финал" durationInFrames={D[4]}>
					<SceneEnd />
				</TransitionSeries.Sequence>
			</TransitionSeries>
			<Sparkles />
			<Track name="Озвучка">
				<Audio name="Хук" src={staticFile('vo3/e1.wav')} from={s(0.6)} />
				<Audio name="1670 км/ч" src={staticFile('vo3/e2.wav')} from={s(4.4)} />
				<Audio name="Остановка" src={staticFile('vo3/e3.wav')} from={s(12.5)} />
				<Audio name="День и ночь" src={staticFile('vo3/e4.wav')} from={s(18.2)} />
				<Audio name="Подписывайся" src={staticFile('vo3/e5.wav')} from={s(22.2)} />
			</Track>
			<Track name="Музыка и атмосфера">
				<Audio name="Музыка" src={staticFile('sfx/music.wav')} volume={0.14} loop />
				<Audio name="Космос — гул (интро)" src={staticFile('sfx2/space_rumble.wav')} durationInFrames={s(4.4)} volume={0.35} />
				<Audio name="Космос — гул (остановка)" src={staticFile('sfx2/space_rumble.wav')} from={s(12.3)} durationInFrames={s(5)} volume={0.35} />
				<Audio name="Космос — гул (день/ночь)" src={staticFile('sfx2/space_rumble.wav')} from={s(18.0)} durationInFrames={s(4)} volume={0.3} />
			</Track>
			<Track name="SFX">
				<Audio name="Силовое поле — заголовок" src={staticFile('sfx2/forcefield.wav')} from={s(0.45)} volume={0.6} />
				<Audio name="Пульс — заголовок" src={staticFile('sfx2/pluck2.wav')} from={s(0.62)} volume={0.7} />
				<Audio name="Переход — вспышка" src={staticFile('sfx2/swoosh_up.wav')} from={s(4.0)} volume={0.8} />
				{Array.from({ length: 14 }, (_, i) => (
					<Audio key={i} name={`Тик счётчика ${i + 1}`} src={staticFile('sfx2/tick.wav')} from={s(5.0 + i * 0.1 + i * i * 0.006)} volume={0.5} />
				))}
				<Audio name="Шок героя" src={staticFile('sfx2/question.wav')} from={s(9.6)} volume={0.7} />
				<Audio name="Переход — слайд" src={staticFile('sfx2/swoosh_down.wav')} from={s(12.1)} volume={0.8} />
				<Audio name="СТОП — удар" src={staticFile('sfx2/lowboom.wav')} from={s(13.7)} volume={1} />
				<Audio name="Хруст" src={staticFile('sfx2/crunch.wav')} from={s(13.75)} volume={0.6} />
				<Audio name="Полёт героя" src={staticFile('sfx2/thruster.wav')} from={s(15.0)} durationInFrames={s(1.8)} volume={0.55} />
				<Audio name="Удар об что-то" src={staticFile('sfx2/punch.wav')} from={s(16.5)} volume={0.6} />
				<Audio name="Переход — часы" src={staticFile('sfx2/glitch.wav')} from={s(17.8)} volume={0.8} />
				<Audio name="Поп — день" src={staticFile('sfx2/pluck.wav')} from={s(18.3)} volume={0.7} />
				<Audio name="Поп — ночь" src={staticFile('sfx2/pluck.wav')} from={s(19.7)} volume={0.7} />
				<Audio name="Переход — шторка" src={staticFile('sfx2/swoosh_up.wav')} from={s(21.8)} volume={0.7} />
				<Audio name="Джингл — финал" src={staticFile('sfx2/jingle_hit03.wav')} from={s(23.4)} volume={0.6} />
				<Audio name="Подтверждение" src={staticFile('sfx2/confirm.wav')} from={s(23.6)} volume={0.6} />
			</Track>
			<Sequence name="Подпись" from={0} layout="none">
				<div style={{ position: 'absolute', right: 26, bottom: 18, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 20, color: 'rgba(255,255,255,.6)' }}>
					SFX: Kenney (CC0)
				</div>
			</Sequence>
		</AbsoluteFill>
	);
};
