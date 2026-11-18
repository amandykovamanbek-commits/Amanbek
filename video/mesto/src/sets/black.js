import * as THREE from 'three';
export function build(W, H) { const scene = new THREE.Scene(); scene.background = new THREE.Color(0); return { scene, cam: new THREE.PerspectiveCamera(30, W / H, 0.1, 10) }; }
