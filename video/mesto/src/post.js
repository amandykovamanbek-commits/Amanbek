// Post pipeline: scene -> DOF -> bloom -> tonemap+grade (per shot) -> composite (dissolves, grain, fades)
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

const DOF_FS = `
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res;
uniform float focus, aperture, maxBlur, near, far;
varying vec2 vUv;
float linZ(float d){ return (near*far)/(far - d*(far-near)); }
float coc(float z){ return clamp(aperture * abs(z - focus) / max(z, 1e-3), 0., 1.) * maxBlur; }
void main(){
  float z0 = linZ(texture2D(tDepth, vUv).x); float c0 = coc(z0);
  vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.;
  const int N = 48;
  for (int i = 1; i < N; i++) {
    float fi = float(i); float r = sqrt(fi / float(N)) * maxBlur; float a = fi * 2.39996;
    vec2 off = vec2(cos(a), sin(a)) * r / res;
    float zs = linZ(texture2D(tDepth, vUv + off).x); float cs = coc(zs);
    if (zs > z0) cs = min(cs, c0 + 0.5);
    float w = smoothstep(r - 1.5, r + 0.5, cs);
    vec3 s = texture2D(tColor, vUv + off).rgb;
    w *= 1.0 + 1.5 * max(0., dot(s, vec3(0.3, 0.6, 0.1)) - 0.9);
    acc += s * w; wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, 1.);
}`;

const GRADE_FS = `
uniform sampler2D tDiffuse; uniform float exposure, contrast, saturation, temp, tint, vignette, chroma, time, leak, weave, hl;
uniform vec3 lift, gamma, gain, leakColor;
varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
vec3 aces(vec3 c){
  const mat3 I = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
  const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
  c = I * (c / 0.6); c = RRTAndODTFit(c); c = O * c; return clamp(c, 0., 1.);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1./2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = vUv;
  float fr = floor(time * 24.);
  uv += weave * vec2((hash(vec2(fr, 1.)) - .5) * 0.0016, (hash(vec2(fr, 2.)) - .5) * 0.0022);
  vec2 d = uv - .5; float r2 = dot(d, d);
  vec3 col;
  col.r = texture2D(tDiffuse, uv + d * chroma * r2).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - d * chroma * r2).b;
  col *= exposure;
  col *= vec3(1. + temp * 0.10 + tint * 0.02, 1. - tint * 0.04, 1. - temp * 0.12 + tint * 0.02);
  col = aces(col);
  col = toSRGB(col);
  col = gain * (col + lift * (1. - col));
  col = pow(max(col, 0.), 1. / gamma);
  col = clamp((col - 0.42) * contrast + 0.42, 0., 1.);
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, saturation);
  // highlight warmth roll
  col += hl * vec3(0.06, 0.02, -0.04) * smoothstep(0.55, 1.0, l);
  if (leak > 0.) {
    vec2 p1 = vec2(0.92 + 0.08 * sin(time * 0.9), 0.25 + 0.25 * sin(time * 0.6));
    vec2 p2 = vec2(0.05, 0.85 + 0.1 * cos(time * 0.7));
    float a = smoothstep(0.75, 0.0, length((uv - p1) * vec2(1.3, 1.))) + 0.6 * smoothstep(0.6, 0.0, length((uv - p2) * vec2(1.5, 1.)));
    col = 1. - (1. - col) * (1. - leakColor * leak * a);
  }
  float v = smoothstep(0.95, 0.25, length(d * vec2(1.0, 0.62)) * 1.2);
  col *= mix(1., v, vignette);
  gl_FragColor = vec4(col, 1.);
}`;

const COMP_FS = `
uniform sampler2D tA; uniform sampler2D tB; uniform float mixAmt, mode, time, grain, fade, flash, dust, aspect;
uniform vec3 flashColor;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 a = texture2D(tA, vUv).rgb;
  vec3 col = a;
  if (mixAmt > 0.) {
    vec3 b = texture2D(tB, vUv).rgb;
    if (mode < 0.5) col = mix(a, b, mixAmt);
    else { // light-burn dissolve: brighten through white-amber
      float m = mixAmt; float burn = sin(m * 3.14159);
      col = mix(a, b, smoothstep(0.3, 0.7, m));
      col = 1. - (1. - col) * (1. - vec3(1.0, 0.78, 0.5) * burn * 0.85);
    }
  }
  // film grain
  vec2 g = floor(vUv * vec2(1280., 536.));
  float n = hash(g + fract(time * 7.13) * 91.7) + hash(g * 1.7 + fract(time * 3.31) * 13.1) - 1.;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col += n * grain * (0.5 + 0.7 * (1. - l)) * 0.5;
  // dust specks (flashbacks)
  if (dust > 0.) {
    float fr = floor(time * 24.);
    for (int i = 0; i < 6; i++) {
      vec2 p = vec2(hash(vec2(fr, float(i))), hash(vec2(float(i), fr + 3.)));
      float s = 0.0015 + 0.004 * hash(vec2(fr + float(i), 7.));
      float dd = length((vUv - p) * vec2(aspect, 1.));
      col *= 1. - dust * 0.6 * smoothstep(s, s * 0.3, dd) * step(0.5, hash(vec2(fr * 1.3, float(i))));
    }
    float sx = hash(vec2(floor(time * 3.), 11.));
    col *= 1. - dust * 0.25 * smoothstep(0.0012, 0.0, abs(vUv.x - sx)) * step(0.7, hash(vec2(fr, 5.)));
  }
  col = mix(col, flashColor, flash);
  col *= 1. - fade;
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

export class Post {
  constructor(renderer, W, H, msaa = 4) {
    this.r = renderer; this.W = W; this.H = H;
    const opts = { type: THREE.HalfFloatType };
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, { ...opts, depthTexture: new THREE.DepthTexture(W, H), samples: msaa });
    this.dofRT = new THREE.WebGLRenderTarget(W, H, opts);
    this.shotA = new THREE.WebGLRenderTarget(W, H, opts);
    this.shotB = new THREE.WebGLRenderTarget(W, H, opts);
    this.dofMat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: DOF_FS, uniforms: { tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 3 }, aperture: { value: 0.1 }, maxBlur: { value: 10 }, near: { value: 0.1 }, far: { value: 100 } } });
    this.gradeMat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: GRADE_FS, uniforms: {
        tDiffuse: { value: null }, exposure: { value: 1 }, contrast: { value: 1 }, saturation: { value: 1 }, temp: { value: 0 }, tint: { value: 0 },
        vignette: { value: 0.5 }, chroma: { value: 0.02 }, time: { value: 0 }, leak: { value: 0 }, weave: { value: 0 }, hl: { value: 0 },
        lift: { value: new THREE.Vector3() }, gamma: { value: new THREE.Vector3(1, 1, 1) }, gain: { value: new THREE.Vector3(1, 1, 1) }, leakColor: { value: new THREE.Vector3(1, 0.55, 0.2) },
      }
    });
    this.compMat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: COMP_FS, uniforms: { tA: { value: null }, tB: { value: null }, mixAmt: { value: 0 }, mode: { value: 0 }, time: { value: 0 }, grain: { value: 0.04 }, fade: { value: 0 }, flash: { value: 0 }, flashColor: { value: new THREE.Vector3(1, 1, 1) }, dust: { value: 0 }, aspect: { value: W / H } } });
    this.quad = new FullScreenQuad(null);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.5, 0.8);
  }
  // render one shot fully to an LDR target
  renderShot(scene, cam, look, target, time) {
    const r = this.r;
    r.setRenderTarget(this.sceneRT); r.clear(); r.render(scene, cam);
    let src = this.sceneRT;
    if (look.dof) {
      const u = this.dofMat.uniforms;
      u.tColor.value = this.sceneRT.texture; u.tDepth.value = this.sceneRT.depthTexture;
      u.focus.value = look.dof.focus; u.aperture.value = look.dof.aperture ?? 0.1; u.maxBlur.value = (look.dof.maxBlur ?? 12) * this.W / 1920;
      u.near.value = cam.near; u.far.value = cam.far;
      this.quad.material = this.dofMat; r.setRenderTarget(this.dofRT); this.quad.render(r); src = this.dofRT;
    }
    const b = look.bloom || {};
    if ((b.strength ?? 0.6) > 0) {
      this.bloom.strength = b.strength ?? 0.6; this.bloom.radius = b.radius ?? 0.5; this.bloom.threshold = b.threshold ?? 0.8;
      this.bloom.render(r, null, src, 0, false);
    }
    const g = Object.assign({ exposure: 1, contrast: 1, saturation: 1, temp: 0, tint: 0, vignette: 0.45, chroma: 0.015, leak: 0, weave: 0, hl: 0, lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], leakColor: [1, 0.55, 0.2] }, look.grade || {});
    const u = this.gradeMat.uniforms;
    for (const k of ['exposure', 'contrast', 'saturation', 'temp', 'tint', 'vignette', 'chroma', 'leak', 'weave', 'hl']) u[k].value = g[k];
    u.lift.value.fromArray(g.lift); u.gamma.value.fromArray(g.gamma); u.gain.value.fromArray(g.gain); u.leakColor.value.fromArray(g.leakColor);
    u.time.value = time; u.tDiffuse.value = src.texture;
    this.quad.material = this.gradeMat; r.setRenderTarget(target); this.quad.render(r);
  }
  composite(c) {
    const u = this.compMat.uniforms, r = this.r;
    u.tA.value = this.shotA.texture; u.tB.value = this.shotB.texture;
    u.mixAmt.value = c.mix || 0; u.mode.value = c.mode || 0; u.time.value = c.time; u.grain.value = c.grain ?? 0.04;
    u.fade.value = c.fade || 0; u.flash.value = c.flash || 0; u.flashColor.value.fromArray(c.flashColor || [1, 1, 1]); u.dust.value = c.dust || 0;
    this.quad.material = this.compMat; r.setRenderTarget(null); this.quad.render(r);
  }
}
