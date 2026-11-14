import React from 'react';
import { easeBack, easeIO, easeOut, lerp, prog } from './camera';

// Персонажи нарисованы в «локальных» координатах (герой стоит в x=400, кот сидит в x=960, y=420),
// а в мир переносятся через transform группы в Scene.tsx.

type HeroState = {
	lookX: number;
	lookY: number;
	es: number;
	mouth: 'flat' | 'o' | 'nervous';
	sweat: number;
	sweat2: number;
	phoneUp: number;
	headTurn: number;
	tremble: boolean;
	blink: number;
};

const heroState = (t: number): HeroState => {
	const lift = easeIO(prog(t, 3.4, 3.9));
	const st: HeroState = {
		lookX: lerp(0, 0.85, lift),
		lookY: lerp(0.7, -0.35, lift),
		es: 1 + 0.28 * easeBack(prog(t, 4.3, 4.6)),
		mouth: 'flat',
		sweat: prog(t, 4.6, 4.9),
		sweat2: 0,
		phoneUp: 1 - lift * 0.6,
		headTurn: lerp(0, 8, lift),
		tremble: false,
		blink: 0,
	};
	if (t > 6.9) {
		st.mouth = 'o';
		st.es += 0.12 * easeBack(prog(t, 6.9, 7.2));
	}
	if (t > 9.9) {
		st.es = 1.5;
	}
	if (t >= 10.9) {
		const k = easeIO(prog(t, 10.9, 11.2));
		st.lookX = lerp(0.85, 0, k);
		st.lookY = lerp(-0.35, 0, k);
		st.headTurn = lerp(8, 0, k);
		st.mouth = 'nervous';
		st.es = 1.45;
		st.sweat2 = prog(t, 11.1, 11.4);
		st.tremble = true;
	}
	for (const b of [1.6, 5.6, 8.9]) {
		if (t > b && t < b + 0.14) st.blink = 1 - Math.abs((t - b) / 0.07 - 1);
	}
	return st;
};

const SweatDrop: React.FC<{ k: number; x: number; y: number; s: number }> = ({ k, x, y, s }) =>
	k <= 0 ? null : (
		<g opacity={k} transform={`translate(${x} ${y - (1 - k) * 10}) scale(${s})`}>
			<path d="M0,-14 Q11,4 0,10 Q-11,4 0,-14 Z" fill="#7fd8ff" />
			<ellipse cx={-2} cy={2} rx={2.5} ry={3.5} fill="#e6f9ff" />
		</g>
	);

export const Hero: React.FC<{ t: number }> = ({ t }) => {
	const s = heroState(t);
	const hx = 400;
	const breathe = Math.sin(t * 2.1) * 2;
	const ty = breathe * 0.5;
	const trem = s.tremble ? Math.sin(t * 60) * 1.6 : 0;

	// телефон: в руках → падает на пол в 8.2 с
	const drop = prog(t, 8.2, 8.75);
	let phY = lerp(480, 430, s.phoneUp);
	let phX = hx - 20;
	let phR = 0;
	if (drop > 0) {
		phY = lerp(phY, 640, drop * drop);
		phX += drop * 70;
		phR = drop * 230;
	}
	const handUp = Math.min(1, drop * 3);

	const hy = 300 + breathe * 0.4;
	const headX = hx + s.headTurn + trem;
	const fx = headX + s.lookX * 10;
	const fy = hy - 4 + s.lookY * 6;
	const blink = 1 - s.blink * 0.92;
	const mx = headX + s.lookX * 8;
	const my = hy + 34 + s.lookY * 3;

	return (
		<g>
			<defs>
				<linearGradient id="hoodie" x1="0" x2="1" y1="0" y2="0">
					<stop offset="0" stopColor="#2fc4b2" />
					<stop offset="0.6" stopColor="#1fa391" />
					<stop offset="1" stopColor="#147a6d" />
				</linearGradient>
				<radialGradient id="headShade" cx="0.32" cy="0.28" r="0.75">
					<stop offset="0" stopColor="#34343c" />
					<stop offset="0.3" stopColor="#0e0e12" />
					<stop offset="1" stopColor="#000" />
				</radialGradient>
				<radialGradient id="rim" gradientUnits="userSpaceOnUse" cx={headX + 70} cy={hy - 20} r={80}>
					<stop offset="0.35" stopColor="rgba(255,140,170,.32)" />
					<stop offset="1" stopColor="rgba(255,140,170,0)" />
				</radialGradient>
				<radialGradient id="phoneGlow" gradientUnits="userSpaceOnUse" cx={headX} cy={hy + 70} r={90}>
					<stop offset="0" stopColor="rgba(140,220,255,.35)" />
					<stop offset="1" stopColor="rgba(140,220,255,0)" />
				</radialGradient>
			</defs>
			{/* ноги и кроссовки */}
			{[-1, 1].map((sx) => (
				<g key={sx}>
					<path
						d={`M${hx + sx * 24},500 L${hx + sx * 34},530 L${hx + sx * 38},600`}
						stroke="#26304f"
						strokeWidth={32}
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
					/>
					<ellipse cx={hx + sx * 42} cy={612} rx={26} ry={13} fill="#f4f4f4" />
					<rect x={hx + sx * 42 - 22} y={612} width={44} height={5} fill="#e0473f" />
				</g>
			))}
			{/* худи */}
			<path
				d={`M${hx - 58},${385 + ty} Q${hx},${365 + ty} ${hx + 58},${385 + ty} L${hx + 66},505 Q${hx},515 ${hx - 66},505 Z`}
				fill="url(#hoodie)"
			/>
			<ellipse cx={hx} cy={378 + ty} rx={46} ry={14} fill="#137366" />
			<rect x={hx - 36} y={462} width={72} height={32} rx={10} fill="rgba(0,0,0,.15)" />
			<path
				d={`M${hx - 10},${385 + ty} L${hx - 12},${420 + ty} M${hx + 10},${385 + ty} L${hx + 12},${420 + ty}`}
				stroke="#f2f2f2"
				strokeWidth={3}
			/>
			{/* фирменная деталь: жёлтая молния */}
			<path
				d={`M${hx + 30},${405 + ty} L${hx + 20},${425 + ty} L${hx + 28},${425 + ty} L${hx + 22},${442 + ty} L${hx + 38},${418 + ty} L${hx + 30},${418 + ty} Z`}
				fill="#ffd23f"
			/>
			{/* руки */}
			{[-1, 1].map((sx) => {
				const hxh = drop > 0 ? hx + sx * 55 : hx + sx * 22;
				const hyh = drop > 0 ? 400 - handUp * 20 : phY + 30;
				return (
					<g key={sx}>
						<path
							d={`M${hx + sx * 52},${398 + ty} Q${hx + sx * 70},${hyh - 10} ${hxh},${hyh}`}
							stroke="#1fa391"
							strokeWidth={26}
							strokeLinecap="round"
							fill="none"
						/>
						<circle cx={hxh} cy={hyh} r={14} fill="#0b0b0b" />
					</g>
				);
			})}
			{/* телефон */}
			<g transform={`translate(${phX + 20} ${phY + 30}) rotate(${phR})`}>
				<rect x={-20} y={-30} width={40} height={62} rx={7} fill="#15151d" />
				<rect x={-16} y={-25} width={32} height={52} rx={4} fill="#9fe8ff" />
			</g>
			{/* голова */}
			<rect x={headX - 10} y={hy + 50} width={20} height={25} fill="#0b0b0b" />
			<circle cx={headX} cy={hy} r={64} fill="url(#headShade)" />
			<circle cx={headX} cy={hy} r={64} fill="url(#rim)" />
			{s.phoneUp > 0.5 && drop === 0 ? <circle cx={headX} cy={hy} r={64} fill="url(#phoneGlow)" /> : null}
			{/* глаза */}
			{[-1, 1].map((sx) => {
				const x = fx + sx * 22;
				const rx = 16 * s.es;
				const ry = 21 * s.es * blink;
				const pr = s.es > 1.4 ? 6 : 8.5;
				const px = x + s.lookX * (rx - pr - 3);
				const py = fy + s.lookY * (ry - pr - 3);
				return (
					<g key={sx}>
						<ellipse cx={x} cy={fy} rx={rx} ry={Math.max(0.5, ry)} fill="#fff" />
						{blink > 0.3 ? (
							<>
								<ellipse cx={px} cy={py} rx={pr} ry={pr * blink} fill="#000" />
								<circle cx={px - 3} cy={py - 3} r={2.6} fill="#fff" />
							</>
						) : null}
					</g>
				);
			})}
			{/* рот */}
			{s.mouth === 'flat' ? (
				<line x1={mx - 8} y1={my} x2={mx + 8} y2={my} stroke="#fff" strokeWidth={3} />
			) : s.mouth === 'o' ? (
				<>
					<ellipse cx={mx} cy={my + 2} rx={9} ry={12} fill="#ff5d73" />
					<ellipse cx={mx} cy={my + 6} rx={6} ry={5} fill="#b8213b" />
				</>
			) : (
				<>
					<rect x={mx - 20} y={my - 4} width={40} height={14} rx={5} fill="#fff" />
					<path
						d={`M${mx - 20},${my + 3} L${mx + 20},${my + 3} M${mx - 12},${my - 4} L${mx - 12},${my + 10} M${mx - 4},${my - 4} L${mx - 4},${my + 10} M${mx + 4},${my - 4} L${mx + 4},${my + 10} M${mx + 12},${my - 4} L${mx + 12},${my + 10}`}
						stroke="#000"
						strokeWidth={2}
					/>
				</>
			)}
			<SweatDrop k={s.sweat} x={headX - 52} y={hy - 40 + (t % 1.2) * 4} s={1.2} />
			<SweatDrop k={s.sweat2} x={headX + 56} y={hy - 34} s={1} />
		</g>
	);
};

const catState = (t: number) => {
	const look = -easeIO(prog(t, 3.0, 3.5));
	let mode: 'sly' | 'shock' | 'narrow' = 'sly';
	let lid = 0.45;
	if (t >= 9.9 && t < 10.5) {
		mode = 'shock';
		lid = 0;
	} else if (t >= 10.5) {
		mode = 'narrow';
		lid = lerp(0, 0.62, easeOut(prog(t, 10.5, 10.8)));
	} else if (t < 3.0) {
		lid = 0.35;
	}
	return { look, mode, lid };
};

export const Cat: React.FC<{ t: number }> = ({ t }) => {
	const s = catState(t);
	const cx = 960;
	const by = 420;
	const breathe = Math.sin(t * 2.4) * 1.5;
	const sway = Math.sin(t * 2.2) * 18 + (s.mode === 'shock' ? -30 : 0);
	const hx = cx + s.look * 10;
	const hy = by - 108 + breathe * 0.5 + (s.mode === 'shock' ? -6 : 0);
	const ex = s.look * 6;
	return (
		<g>
			<defs>
				<radialGradient id="catBody" cx="0.35" cy="0.2" r="0.8">
					<stop offset="0" stopColor="#ffa54d" />
					<stop offset="1" stopColor="#d8661a" />
				</radialGradient>
				<radialGradient id="catHead" cx="0.35" cy="0.3" r="0.75">
					<stop offset="0" stopColor="#ffad5c" />
					<stop offset="1" stopColor="#dc6c1c" />
				</radialGradient>
			</defs>
			<ellipse cx={cx} cy={by + 2} rx={62} ry={8} fill="rgba(0,0,0,.35)" />
			{/* хвост */}
			<path
				d={`M${cx + 40},${by - 12} C${cx + 95},${by - 10} ${cx + 90 + sway * 0.3},${by - 80} ${cx + 70 + sway},${by - 115}`}
				stroke="#e0781f"
				strokeWidth={15}
				strokeLinecap="round"
				fill="none"
			/>
			<circle cx={cx + 70 + sway} cy={by - 115} r={7.5} fill="#fff1dc" />
			{/* тело */}
			<ellipse cx={cx} cy={by - 42 + breathe * 0.3} rx={52} ry={46 + breathe * 0.3} fill="url(#catBody)" />
			<ellipse cx={cx - 4 + s.look * 4} cy={by - 35} rx={26} ry={30} fill="#fff1dc" />
			<ellipse cx={cx - 22} cy={by - 6} rx={15} ry={9} fill="#fff1dc" />
			<ellipse cx={cx + 16} cy={by - 6} rx={15} ry={9} fill="#fff1dc" />
			{/* уши */}
			{[-1, 1].map((sx) => (
				<g key={sx}>
					<path d={`M${hx + sx * 34},${hy - 8} L${hx + sx * 30},${hy - 58} L${hx + sx * 6},${hy - 32} Z`} fill="#e8781f" />
					<path d={`M${hx + sx * 28},${hy - 16} L${hx + sx * 27},${hy - 46} L${hx + sx * 12},${hy - 30} Z`} fill="#ff9eb5" />
				</g>
			))}
			{/* голова */}
			<ellipse cx={hx} cy={hy} rx={42} ry={37} fill="url(#catHead)" />
			{[-10, 0, 10].map((dx) => (
				<line key={dx} x1={hx + dx} y1={hy - 36} x2={hx + dx * 1.2} y2={hy - 24} stroke="#c4561a" strokeWidth={4} />
			))}
			<ellipse cx={hx + s.look * 3} cy={hy + 14} rx={20} ry={13} fill="#fff1dc" />
			{/* глаза */}
			{[-1, 1].map((sx) => {
				const x = hx + sx * 16 + ex;
				const y = hy - 4;
				const big = s.mode === 'shock' ? 1.35 : 1;
				const lidY = y - 14 + 25 * s.lid;
				return (
					<g key={sx}>
						<ellipse cx={x} cy={y} rx={10 * big} ry={11 * big} fill="#c6f26b" />
						{s.mode === 'shock' ? (
							<circle cx={x + s.look * 2} cy={y} r={5} fill="#111" />
						) : (
							<ellipse cx={x + s.look * 3} cy={y} rx={2.5} ry={8} fill="#111" />
						)}
						<circle cx={x - 3} cy={y - 4} r={2.2} fill="#fff" />
						{s.lid > 0 ? (
							<>
								<rect x={x - 13} y={y - 14} width={26} height={25 * s.lid} fill="#e8781f" />
								<line x1={x - 11} y1={lidY} x2={x + 11} y2={lidY - sx * 2} stroke="#7a2f08" strokeWidth={2.5} />
							</>
						) : null}
					</g>
				);
			})}
			{/* нос, рот, усы */}
			<ellipse cx={hx + ex} cy={hy + 8} rx={4.5} ry={3.2} fill="#ff6f91" />
			{s.mode === 'shock' ? (
				<ellipse cx={hx + ex} cy={hy + 18} rx={5} ry={6} fill="#5a240a" />
			) : (
				<path
					d={`M${hx + ex - 8},${hy + 13} Q${hx + ex - 4},${hy + 18} ${hx + ex},${hy + 12} Q${hx + ex + 4},${hy + 18} ${hx + ex + 8},${hy + 13}`}
					stroke="#5a240a"
					strokeWidth={2.2}
					fill="none"
				/>
			)}
			{[-1, 1].flatMap((sx) =>
				[-2, 5].map((dy) => (
					<line
						key={`${sx}${dy}`}
						x1={hx + sx * 20 + ex}
						y1={hy + 12 + dy}
						x2={hx + sx * 52 + ex}
						y2={hy + 8 + dy * 2}
						stroke="rgba(255,255,255,.85)"
						strokeWidth={1.6}
					/>
				)),
			)}
		</g>
	);
};
