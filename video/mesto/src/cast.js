// The cast: outfits and faces for every character.
import { Character } from './character.js';
import * as T from './tex.js';

const tc = {}; const once = (k, f) => (tc[k] ||= f());
const hoodie = () => once('hoodie', () => T.fleece(0x8b8f97, 3));
const deer = () => once('deer', () => T.deerSweater());
const card = () => once('card', () => T.cardigan());
const plaid = () => once('plaid', () => T.plaid());
const denim = () => once('denim', () => T.denim());
const puffer = () => once('puffer', () => T.quilted(0x8a3224));

const ARMAN_FACE = { eyeU: 0.33, eyeR: 0.22, iris: 0x5b3519, brow: 0x16100c, browW: 0.05, stubble: 0.75, mouthW: 0.21, nose: 0.165, lip: 0x7a3e34 };
export function arman(outfit = 'hoodie', seed = 11) {
  const top = outfit === 'jacket'
    ? { kind: 'jacket', map: puffer().map, bump: puffer().bump, bumpScale: 3, rough: 0.55, hem: 0.16 }
    : { kind: 'hoodie', map: hoodie().map, bump: hoodie().bump, bumpScale: 0.6, hem: 0.14, cuff: { color: 0x7d8189 } };
  return new Character({
    name: 'arman', seed, h: 1.78, head: [0.108, 0.126, 0.116], skin: 0xdcaa86,
    shoulderW: 0.2, chestR: outfit === 'jacket' ? 0.182 : 0.168, waistR: outfit === 'jacket' ? 0.17 : 0.15, hipR: 0.158,
    armR: outfit === 'jacket' ? [0.062, 0.054, 0.046] : [0.05, 0.042, 0.035],
    top, pants: { map: denim().map, rough: 0.9 }, shoes: { color: 0xe8e6e1, rough: 0.6 },
    hair: { style: 'short', color: 0x15100c, vol: 0.075, topVol: 0.07 }, face: ARMAN_FACE,
  });
}
export function teenArman() {
  return new Character({
    name: 'teen', seed: 21, h: 1.72, head: [0.106, 0.124, 0.114], skin: 0xe2b08c,
    shoulderW: 0.185, chestR: 0.17, waistR: 0.16, hipR: 0.152, armR: [0.058, 0.05, 0.042], legR: [0.072, 0.056, 0.044],
    top: { kind: 'jacket', map: once('teenJ', () => T.quilted(0x3c5a3a)).map, bump: once('teenJ', () => T.quilted(0x3c5a3a)).bump, bumpScale: 3, rough: 0.6, hem: 0.16 },
    pants: { color: 0x26262c }, shoes: { color: 0x3a2a20, boot: true },
    hair: { style: 'short', color: 0x15100c, line: 'hat' }, hat: { color: 0x2e4a8a, band: 0x24396b, pom: 0xe8e2d6, knit: true },
    scarf: { color: 0xa83a2a }, mittens: { color: 0x2a2a2a },
    face: { ...ARMAN_FACE, stubble: 0, browW: 0.046, eyeR: 0.245 },
  });
}
export function aiko(variant = 'home', seed = 31) {
  if (variant === 'toddler') return new Character({
    name: 'aiko3', seed: 33, h: 0.92, kid: true, head: [0.1, 0.104, 0.1], skin: 0xefc6a4,
    shoulderW: 0.1, chestR: 0.12, waistR: 0.125, hipR: 0.12, depth: 0.85, armR: [0.045, 0.042, 0.038], legR: [0.055, 0.05, 0.045], neckR: 0.035, neckLen: 0.02,
    top: { kind: 'snowsuit', map: once('pinkQ', () => T.quilted(0xe57ba6)).map, bump: once('pinkQ', () => T.quilted(0xe57ba6)).bump, bumpScale: 3, rough: 0.6, hem: 0.2 },
    pants: { map: once('pinkQ', () => T.quilted(0xe57ba6)).map, rough: 0.6 }, shoes: { color: 0xd65a8a, boot: true },
    hair: { style: 'kid', color: 0x2a1a10, line: 'hat' }, hat: { color: 0xf3eee6, band: 0xe0d6c8, pom: 0xe57ba6, knit: true },
    mittens: { color: 0xf3eee6 },
    face: { eyeR: 0.33, iris: 0x5a3418, blush: 1, browW: 0.03, mouthW: 0.17, nose: 0.13, eyeU: 0.35, eyeV: 0.06, mouthV: -0.42 },
  });
  const autumn = variant === 'autumn';
  return new Character({
    name: 'aiko', seed, h: autumn ? 1.12 : 1.18, kid: true, head: [0.104, 0.11, 0.104], skin: 0xefc6a4,
    shoulderW: 0.112, chestR: autumn ? 0.13 : 0.118, waistR: autumn ? 0.13 : 0.11, hipR: autumn ? 0.13 : 0.112, depth: 0.78,
    armR: autumn ? [0.042, 0.038, 0.034] : [0.033, 0.029, 0.025], legR: [0.046, 0.036, 0.029], neckR: 0.032, neckLen: 0.03,
    top: autumn ? { kind: 'coat', color: 0xe3a52a, rough: 0.7, coatLen: 0.2, flare: 1.3, hem: 0.1 }
      : { kind: 'sweater', map: deer().map, bump: deer().bump, bumpScale: 1.5, hem: 0.2, cuff: { color: 0x9a1c22 } },
    pants: { color: autumn ? 0x7a2a2a : 0x3a3550, rough: 0.9 }, shoes: autumn ? { color: 0x6a3a1e, boot: true } : { color: 0xf1ede6, rough: 0.95 },
    hair: { style: 'kid', color: 0x24160e, tie: 0xd8243a, line: autumn ? 'hat' : 'kid' },
    hat: autumn ? { color: 0xc8303a, band: 0xa82830, pom: 0xf3eee6, knit: true } : null,
    mittens: autumn ? { color: 0xc8303a } : null,
    face: { eyeR: 0.31, iris: 0x5a3418, blush: 0.9, browW: 0.032, mouthW: 0.18, nose: 0.13, eyeU: 0.35, eyeV: 0.07, mouthV: -0.43, freckles: 0.4 },
  });
}
export function mom(variant = 'home') {
  const coat = variant === 'coat';
  return new Character({
    name: 'mom', seed: 41, h: 1.62, head: [0.102, 0.119, 0.11], skin: 0xe0ae8c,
    shoulderW: 0.172, chestR: 0.158, waistR: 0.142, hipR: 0.17, bust: 0.18, armR: [0.045, 0.037, 0.031], legR: [0.07, 0.052, 0.038],
    top: coat ? { kind: 'coat', color: 0xbfa27e, rough: 0.85, coatLen: 0.5, flare: 1.18, hem: 0.1 }
      : { kind: 'cardigan', map: card().map, bump: card().bump, bumpScale: 1.5, coatLen: 0.22, flare: 1.08, hem: 0.1 },
    pants: { color: 0x3a3438 }, shoes: { color: 0x5a3a2a },
    scarf: coat ? { color: 0x8a2a3a } : null,
    hair: { style: 'bun', color: 0x3a281c, grey: 0.35 },
    face: { eyeR: 0.235, iris: 0x5a3418, lashes: true, lip: 0x9a4a48, blush: 0.35, wrinkles: 0.45, browW: 0.034, mouthW: 0.2, nose: 0.15 },
  });
}
export function dad() {
  return new Character({
    name: 'dad', seed: 51, h: 1.76, head: [0.114, 0.13, 0.12], skin: 0xd6a280,
    shoulderW: 0.205, chestR: 0.178, waistR: 0.172, hipR: 0.168, belly: 0.3, armR: [0.054, 0.045, 0.037],
    top: { kind: 'shirt', map: plaid().map, rough: 0.85, hem: 0.14 },
    pants: { color: 0x3b3b42 }, shoes: { color: 0x4a3a30 },
    hair: { style: 'receding', color: 0x5f574e, grey: 0.7, vol: 0.05, topVol: 0.02 },
    face: { eyeR: 0.215, iris: 0x4e3a26, mustache: 0x4f4740, wrinkles: 0.75, brow: 0x4a423a, browW: 0.05, mouthW: 0.21, nose: 0.18, stubble: 0.25 },
  });
}
export function grandma() {
  return new Character({
    name: 'grandma', seed: 61, h: 1.54, head: [0.101, 0.115, 0.107], skin: 0xdcae90,
    shoulderW: 0.165, chestR: 0.16, waistR: 0.155, hipR: 0.175, bust: 0.15, armR: [0.045, 0.038, 0.032],
    top: { kind: 'cardigan', map: once('gmk', () => T.knit(0x6a3f6e, { seed: 8 })).map, bump: once('gmk', () => T.knit(0x6a3f6e, { seed: 8 })).bump, coatLen: 0.4, flare: 1.15, hem: 0.1 },
    pants: { color: 0x2f2a36 }, shoes: { color: 0x3a2a24 },
    hair: { style: 'bun', color: 0xcfcac2, grey: 0 },
    face: { eyeR: 0.22, iris: 0x4e3a26, lashes: true, glasses: true, wrinkles: 1, blush: 0.4, brow: 0x9a948c, browW: 0.03, lip: 0x8a4a48, mouthW: 0.19 },
  });
}
export function uncle() {
  return new Character({
    name: 'uncle', seed: 71, h: 1.8, head: [0.114, 0.13, 0.12], skin: 0xd8a684,
    shoulderW: 0.21, chestR: 0.18, waistR: 0.172, hipR: 0.165, belly: 0.15, armR: [0.055, 0.046, 0.038],
    top: { kind: 'sweater', map: once('unk', () => T.knit(0x2f5242, { seed: 12 })).map, bump: once('unk', () => T.knit(0x2f5242, { seed: 12 })).bump },
    pants: { color: 0x2a2a30 }, shoes: { color: 0x2a2420 },
    hair: { style: 'short', color: 0x2a2018, vol: 0.05 },
    face: { eyeR: 0.21, iris: 0x4e3a26, browW: 0.05, mouthW: 0.21, nose: 0.17, wrinkles: 0.3, stubble: 1 },
  });
}
