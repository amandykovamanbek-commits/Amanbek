// Test stage: character lineup and face close-ups with expressions.
import * as THREE from 'three';
import * as C from './cast.js';
import { aim, V3 } from './core.js';

export async function build({ W, H }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x30343c);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0xbfd2ff, 0x403830, 0.8));
  const key = new THREE.DirectionalLight(0xffe2c4, 2.4); key.position.set(3, 5, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -1; key.shadow.bias = -0.0005; scene.add(key);
  const rim = new THREE.DirectionalLight(0x9ec0ff, 1.6); rim.position.set(-3, 3, -4); scene.add(rim);
  const cast = { arman: C.arman(), aiko: C.aiko(), mom: C.mom(), dad: C.dad(), grandma: C.grandma(), uncle: C.uncle(), teen: C.teenArman(), tod: C.aiko('toddler'), aikoA: C.aiko('autumn'), armanJ: C.arman('jacket') };
  const order = ['grandma', 'dad', 'mom', 'arman', 'aiko', 'uncle', 'teen', 'tod', 'aikoA', 'armanJ'];
  order.forEach((k, i) => { cast[k].place((i - 4.5) * 0.62, 0, 0, 0); scene.add(cast[k].root); });
  return {
    duration: 20,
    frame(t) {
      const mode = Math.floor(t);
      for (const k of order) { const c = cast[k]; c.reset(); c.stand(); }
      const ex = ['neutral', 'sad', 'joy', 'surprise', 'cry', 'laugh', 'determined', 'touched', 'sleep', 'hope'];
      let target = V3(0, 1, 0), pos = V3(0, 1.1, 7.5), fov = 30;
      if (mode >= 1) {
        const who = ['arman', 'aiko', 'mom', 'dad', 'grandma', 'uncle', 'teen', 'tod', 'aikoA', 'armanJ'][Math.floor((mode - 1) / 1) % 10];
        const c = cast[who];
        c.expr(ex[mode % 10]);
        if (mode === 3) c.setTear('L', 0.7);
        c.root.updateMatrixWorld(true);
        const hp = new THREE.Vector3(); c.j.head.getWorldPosition(hp); hp.y += c.o.head[1] * 0.8;
        target = hp; pos = hp.clone().add(V3(0.25, 0.02, 0.85)); fov = 22;
        c.look(pos, 0.5);
      }
      for (const k of order) cast[k].update(t + 0.5);
      aim(cam, pos, target, fov);
      return { a: { scene, cam, look: { bloom: { strength: 0.3 }, grade: {} } }, label: 'test ' + mode };
    }
  };
}
