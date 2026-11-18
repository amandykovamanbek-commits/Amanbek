// Colour looks
export const G = {
  now: { exposure: 1.0, contrast: 1.08, saturation: 0.82, temp: -0.55, tint: 0.05, lift: [0.015, 0.03, 0.06], gamma: [0.98, 1.0, 1.03], gain: [0.95, 1.0, 1.06], vignette: 0.55, chroma: 0.02 },
  night: { exposure: 1.05, contrast: 1.1, saturation: 0.95, temp: -0.3, lift: [0.01, 0.02, 0.05], gain: [1, 1, 1.03], vignette: 0.5, chroma: 0.025 },
  flash: { exposure: 1.08, contrast: 0.92, saturation: 0.78, temp: 0.9, tint: 0.1, lift: [0.09, 0.055, 0.02], gamma: [1.02, 1.0, 0.94], gain: [1.06, 0.98, 0.8], vignette: 0.75, chroma: 0.035, weave: 1, leak: 0.35, hl: 0.6 },
  video: { exposure: 0.95, contrast: 1.0, saturation: 1.05, temp: 0.45, lift: [0.03, 0.02, 0.01], gain: [1.04, 1.0, 0.92], vignette: 0.25, chroma: 0.01 },
  gold: { exposure: 1.06, contrast: 1.02, saturation: 1.02, temp: 0.65, lift: [0.04, 0.025, 0.0], gamma: [1.02, 1, 0.97], gain: [1.06, 1.0, 0.88], vignette: 0.55, chroma: 0.015, hl: 0.5 },
  warmNight: { exposure: 1.02, contrast: 1.06, saturation: 0.92, temp: 0.0, lift: [0.01, 0.02, 0.05], gain: [1.02, 1.0, 0.98], vignette: 0.6, chroma: 0.02 },
};
export const mixG = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[key] ?? (Array.isArray(b[key]) ? b[key].map(() => key === 'lift' ? 0 : 1) : (key === 'leak' || key === 'weave' || key === 'hl' || key === 'temp' || key === 'tint' ? 0 : 1)), y = b[key] ?? (Array.isArray(a[key]) ? a[key].map(() => key === 'lift' ? 0 : 1) : (key === 'leak' || key === 'weave' || key === 'hl' || key === 'temp' || key === 'tint' ? 0 : 1)); o[key] = Array.isArray(x) ? x.map((v, i) => v + (y[i] - v) * k) : x + (y - x) * k; } return o; };
