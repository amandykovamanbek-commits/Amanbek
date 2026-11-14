import type React from 'react';

// Мир сцены рисуется в координатах 1080×1920 (кадр 9:16).
export const W = 1080;
export const H = 1920;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const easeIO = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeBack = (k: number) => {
	const c1 = 1.9;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

type Cam = [x: number, y: number, zoom: number];

// Планы камеры: [начало, конец, откуда, куда]. Разрыв между отрезками = монтажная склейка.
const SHOTS: [number, number, Cam, Cam][] = [
	[0.0, 2.8, [540, 1000, 1.0], [540, 990, 1.06]], // общий план + заголовок
	[2.8, 3.8, [540, 990, 1.06], [600, 960, 1.16]], // наезд к коту
	[3.8, 6.6, [600, 960, 1.16], [590, 960, 1.2]],
	[6.6, 7.4, [590, 960, 1.2], [520, 990, 1.26]], // к герою
	[7.4, 9.9, [520, 990, 1.26], [520, 985, 1.3]],
	[9.9, 10.9, [770, 820, 1.85], [770, 815, 2.0]], // склейка: крупно кот
	[10.9, 12.1, [330, 1170, 1.75], [330, 1160, 1.95]], // склейка: крупно герой
];

export const camAt = (t: number): Cam => {
	for (const [a, b, f, to] of SHOTS) {
		if (t >= a && t < b) {
			const k = easeIO(prog(t, a, b));
			return [lerp(f[0], to[0], k), lerp(f[1], to[1], k), lerp(f[2], to[2], k)];
		}
	}
	return SHOTS[SHOTS.length - 1][3];
};

export const CUTS = [9.9, 10.9];

export const shakeAt = (t: number): [number, number] => {
	let a = 0;
	for (const s of [8.2, 9.9]) {
		if (t >= s && t < s + 0.5) a = Math.max(a, 22 * (1 - (t - s) / 0.5));
	}
	return [Math.sin(t * 97) * a, Math.cos(t * 83) * a * 0.7];
};

// Параллакс: чем меньше depth, тем медленнее слой реагирует на камеру.
export const layerStyle = (t: number, depth: number): React.CSSProperties => {
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
		overflow: 'visible',
	};
};
