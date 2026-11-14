import { useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import React, { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender, random, staticFile, useVideoConfig } from 'remotion';
import * as THREE from 'three';

// 3D-Земля для роликов канала. Все движения передаются пропсами, вычисленными из useCurrentFrame()
// (правило Remotion: никаких useFrame и самостоятельных анимаций внутри Three.js).

const useEarthTexture = () => {
	const [tex, setTex] = useState<THREE.Texture | null>(null);
	const [handle] = useState(() => delayRender('Загрузка текстуры Земли'));
	useEffect(() => {
		new THREE.TextureLoader().load(
			staticFile('earth/earth.jpg'),
			(t) => {
				t.colorSpace = THREE.SRGBColorSpace;
				t.anisotropy = 8;
				setTex(t);
				continueRender(handle);
			},
			undefined,
			() => continueRender(handle),
		);
	}, [handle]);
	return tex;
};

// Свечение атмосферы: френель-шейдер на чуть большей сфере (рисуется изнанкой, аддитивно)
const atmosphereVertex = `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const atmosphereFragment = `
uniform vec3 uColor;
uniform float uPower;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float f = pow(1.0 - abs(dot(vNormal, vView)), uPower);
  gl_FragColor = vec4(uColor, f * 1.15);
}`;

const Atmosphere: React.FC<{ color: string; scale: number }> = ({ color, scale }) => {
	const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uPower: { value: 2.4 } }), [color]);
	return (
		<mesh scale={scale}>
			<sphereGeometry args={[1, 64, 64]} />
			<shaderMaterial
				vertexShader={atmosphereVertex}
				fragmentShader={atmosphereFragment}
				uniforms={uniforms}
				side={THREE.BackSide}
				blending={THREE.AdditiveBlending}
				transparent
				depthWrite={false}
			/>
		</mesh>
	);
};

const Stars: React.FC<{ twinkle: number }> = ({ twinkle }) => {
	const geo = useMemo(() => {
		const n = 1400;
		const pos = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			const r = 40 + random(`star-r${i}`) * 40;
			const th = random(`star-t${i}`) * Math.PI * 2;
			const ph = Math.acos(2 * random(`star-p${i}`) - 1);
			pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
			pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
			pos[i * 3 + 2] = r * Math.cos(ph);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		return g;
	}, []);
	return (
		<points geometry={geo}>
			<pointsMaterial color="#ffffff" size={0.12} sizeAttenuation transparent opacity={0.7 + 0.25 * twinkle} />
		</points>
	);
};

export type EarthProps = {
	rotationY: number; // поворот Земли вокруг оси, рад
	camZ: number; // удалённость камеры
	camX?: number;
	camY?: number;
	sunDir?: [number, number, number]; // направление на Солнце
	ambient?: number;
	shake?: [number, number];
	twinkle?: number;
	earthX?: number;
	earthScale?: number;
	glowColor?: string;
	showSun?: boolean;
};

const Scene: React.FC<EarthProps & { tex: THREE.Texture | null }> = ({
	tex,
	rotationY,
	camZ,
	camX = 0,
	camY = 0,
	sunDir = [-5, 2, 4],
	ambient = 0.18,
	shake = [0, 0],
	twinkle = 0,
	earthX = 0,
	earthScale = 1,
	glowColor = '#5ec8ff',
	showSun,
}) => {
	return (
		<>
			<PerspectiveCam x={camX + shake[0]} y={camY + shake[1]} z={camZ} />
			<ambientLight intensity={ambient} />
			<directionalLight position={sunDir} intensity={2.6} color="#fff6e8" />
			<Stars twinkle={twinkle} />
			{showSun ? (
				<mesh position={[sunDir[0] * 6, sunDir[1] * 6, sunDir[2] * 6]}>
					<sphereGeometry args={[1.6, 32, 32]} />
					<meshBasicMaterial color="#fff2b0" />
				</mesh>
			) : null}
			<group position={[earthX, 0, 0]} scale={earthScale} rotation={[0, 0, 0.41]}>
				<mesh rotation={[0, rotationY, 0]}>
					<sphereGeometry args={[1, 96, 96]} />
					{tex ? <meshStandardMaterial map={tex} roughness={0.85} metalness={0} /> : <meshStandardMaterial color="#2a6ad6" />}
				</mesh>
				<Atmosphere color={glowColor} scale={1.12} />
			</group>
		</>
	);
};

// Камера управляется пропсами (позиция вычисляется из кадра снаружи)
const PerspectiveCam: React.FC<{ x: number; y: number; z: number }> = ({ x, y, z }) => {
	const { camera } = useThree();
	camera.position.set(x, y, z);
	camera.lookAt(0, 0, 0);
	(camera as THREE.PerspectiveCamera).fov = 40;
	(camera as THREE.PerspectiveCamera).updateProjectionMatrix();
	return null;
};

export const Earth3D: React.FC<EarthProps> = (props) => {
	const { width, height } = useVideoConfig();
	const tex = useEarthTexture();
	return (
		<ThreeCanvas width={width} height={height} gl={{ alpha: true, antialias: true }} style={{ position: 'absolute', inset: 0 }}>
			<Scene {...props} tex={tex} />
		</ThreeCanvas>
	);
};
