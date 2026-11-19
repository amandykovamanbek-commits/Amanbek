// Character sheet. Colours, hair shapes and props follow the reference photos the user sent;
// every character is drawn from scratch as vector shapes (no official artwork in the video).
import type { HairSpec } from "./hair";

export type Outfit = {
  top: string; pants: string; sleeve?: string; haori?: string; haoriR?: string;
  uniform?: boolean; kimono?: boolean; suit?: boolean; bareTorso?: boolean; bareArms?: boolean; bareLegs?: boolean;
  skirt?: number; skirtFill?: string; obi?: string; obiCord?: string; collar?: string; wideSleeve?: boolean;
  furSkirt?: boolean; wraps?: boolean; cape?: string; capeW?: number; capeLen?: number;
};
export type CharDef = {
  id: string; name: string; skin: string; eye: string; demonEye?: string; brow?: string; thickBrow?: boolean;
  hair: HairSpec; outfit: Outfit; scale?: number; legLen?: number;
  earrings?: boolean; scar?: boolean; mark?: boolean; muzzle?: string; ribbon?: string; butterfly?: boolean;
  mask?: "fox" | "tengu" | "hyottoko"; hat?: string; headband?: string; scars?: boolean; diseased?: boolean; tattoo?: boolean;
  horn?: boolean; veins?: boolean; alwaysDemon?: boolean; special?: "boar"; blush?: boolean; lashes?: boolean; fangs?: boolean;
  blade?: string; guard?: string; swordLen?: number; jagged?: boolean; dual?: boolean; silEye?: string;
};

const SKIN = "#f7dfcd";
const UNI = "#1d2029";

// Tanjiro: short, slightly messy burgundy spikes, darker roots, red tips; long centre bang.
const H_TANJIRO: HairSpec = { style: "spiky", c1: "#3c0d0d", c2: "#b8352c", mid: 0.3, seed: 2, crown: 26, spikes: 12, sweep: 24, bangs: 7, bangLen: 50, bangW: 12, centerBang: 10, locks: 26, lowSpikes: 34 };
const H_SIB: HairSpec = { style: "spiky", c1: "#2a1612", c2: "#5a2a1a", seed: 4, crown: 16, spikes: 10, sweep: 18, bangs: 6, bangLen: 44, bangW: 12, locks: 16 };

const base = (id: string, name: string, o: Partial<CharDef>): CharDef => ({
  id, name, skin: SKIN, eye: "#6a3a2a",
  hair: { style: "spiky", c1: "#1b1716", c2: "#2b2422", crown: 20, spikes: 10, bangs: 6, bangLen: 44, locks: 20 },
  outfit: { top: UNI, pants: UNI, uniform: true },
  ...o,
});

export const CHARS: Record<string, CharDef> = {
  // --- Tanjiro, several life stages -------------------------------------
  tanjiro_kid: base("tanjiro_kid", "Танджиро", {
    eye: "#b0342e", hair: H_TANJIRO, earrings: true, scar: true, blush: true, scale: 0.94,
    outfit: { top: "#4a5a4c", pants: "#2e332e", haori: "url(#p_check)", kimono: true, obi: "#2e332e", collar: "#d9d2c0", wraps: true },
  }),
  tanjiro_train: base("tanjiro_train", "Танджиро", {
    eye: "#b0342e", hair: H_TANJIRO, earrings: true, scar: true, mask: "fox",
    outfit: { top: "url(#p_cloud)", pants: "#26324a", sleeve: "url(#p_cloud)", kimono: true, obi: "#26324a", wideSleeve: true, wraps: true },
    blade: "#d6dde3",
  }),
  tanjiro: base("tanjiro", "Танджиро", {
    eye: "#b0342e", hair: H_TANJIRO, earrings: true, scar: true,
    outfit: { top: UNI, pants: UNI, haori: "url(#p_check)", uniform: true, wraps: true },
    blade: "#1a1c22", guard: "#3a3a3a",
  }),
  tanjiro_mark: base("tanjiro_mark", "Танджиро", {
    eye: "#b0342e", hair: H_TANJIRO, earrings: true, mark: true,
    outfit: { top: UNI, pants: UNI, haori: "url(#p_check)", uniform: true, wraps: true },
    blade: "#1a1c22", guard: "#3a3a3a",
  }),
  tanjiro_demon: base("tanjiro_demon", "Танджиро", {
    eye: "#b0342e", demonEye: "#ff2a3a", hair: { ...H_TANJIRO, c1: "#1e0505", c2: "#7a1414" }, earrings: true, mark: true, alwaysDemon: true, veins: true, fangs: true, skin: "#ecd6cc",
    outfit: { top: UNI, pants: UNI, haori: "url(#p_check)", uniform: true, wraps: true },
  }),
  // --- family --------------------------------------------------------------
  nezuko: base("nezuko", "Незуко", {
    eye: "#e46ea4", demonEye: "#ff5fae", brow: "#2a1614", lashes: true, blush: true, horn: true, veins: true,
    hair: { style: "straight", c1: "#1a1212", c2: "#e2733c", mid: 0.6, seed: 3, bangs: 9, bangLen: 44, bangW: 9, part: true, locks: 96, lockW: 11, long: 330 },
    ribbon: "#f6a8c2", muzzle: "#9cbf6e",
    outfit: { top: "url(#p_asa)", pants: "#2a2420", haori: "#5b2a20", kimono: true, skirt: 150, skirtFill: "url(#p_asa)", bareLegs: true, obiCord: "#9cbf6e" },
  }),
  nezuko_human: base("nezuko_human", "Незуко", {
    eye: "#e46ea4", brow: "#2a1614", lashes: true, blush: true,
    hair: { style: "straight", c1: "#1a1212", c2: "#6a3220", mid: 0.7, seed: 3, bangs: 9, bangLen: 44, bangW: 9, part: true, locks: 96, lockW: 11, long: 300 },
    ribbon: "#f6a8c2",
    outfit: { top: "url(#p_asa)", pants: "#2a2420", kimono: true, skirt: 290, skirtFill: "url(#p_asa)", wideSleeve: true },
  }),
  mother: base("mother", "Мама", {
    eye: "#5a2a1a", lashes: true,
    hair: { style: "straight", c1: "#1a1212", c2: "#2b1a14", seed: 5, bangs: 6, bangLen: 26, bangW: 11, part: true, locks: 30, bun: true },
    outfit: { top: "#5f6f8a", pants: "#3a3a3a", kimono: true, skirt: 290, skirtFill: "#55637d", obi: "#c7a36a", wideSleeve: true, sleeve: "#5f6f8a" },
  }),
  sib_boy: base("sib_boy", "Брат", {
    scale: 0.62, eye: "#5a2a1a", blush: true, hair: H_SIB,
    outfit: { top: "#6d8a6a", pants: "#4a4a40", kimono: true, obi: "#3a3a30" },
  }),
  sib_girl: base("sib_girl", "Сестра", {
    scale: 0.58, eye: "#5a2a1a", blush: true, lashes: true,
    hair: { style: "straight", c1: "#1e1212", c2: "#3a1a14", seed: 6, bangs: 7, bangLen: 40, bangW: 10, locks: 40, pony: [-34, -40, 70, 30] },
    outfit: { top: "#c98a6a", pants: "#4a3a30", kimono: true, skirt: 290, skirtFill: "#b77a5a", obi: "#7a3a3a" },
  }),
  oldman: base("oldman", "Старик", {
    eye: "#3a2a2a", skin: "#efd2bb", thickBrow: true, brow: "#bdb8ae",
    hair: { style: "spiky", c1: "#c9c4bb", c2: "#a8a39a", seed: 8, crown: 6, spikes: 8, spread: 120, bangs: 0, locks: 6 },
    outfit: { top: "#6a5a48", pants: "#4a4034", kimono: true, obi: "#3a3028" },
  }),
  // --- slayers --------------------------------------------------------------
  giyu: base("giyu", "Гию", {
    eye: "#2f5fa8", brow: "#141414",
    hair: { style: "spiky", c1: "#101116", c2: "#1e2230", seed: 5, crown: 30, spikes: 13, sweep: 30, bangs: 7, bangLen: 54, bangW: 12, centerBang: 6, locks: 40, lowSpikes: 46, pony: [-6, 20, 130, 44] },
    outfit: { top: UNI, pants: UNI, haori: "url(#p_wine)", haoriR: "url(#p_kikko)", uniform: true },
    blade: "#3c8fd8", guard: "#2a2a2a",
  }),
  zenitsu: base("zenitsu", "Зеницу", {
    eye: "#c9952a", brow: "#c98a1a", blush: true,
    hair: { style: "spiky", c1: "#ffd63a", c2: "#f07a1c", mid: 0.42, seed: 7, crown: 22, spikes: 13, sweep: 30, bangs: 7, bangLen: 56, bangW: 13, locks: 34, lowSpikes: 36 },
    outfit: { top: UNI, pants: UNI, haori: "url(#p_tri)", uniform: true, wraps: true },
    blade: "#e9e2c4", guard: "#c9a227",
  }),
  inosuke: base("inosuke", "Иноске", {
    special: "boar", eye: "#5fd3e0",
    outfit: { top: SKIN, pants: "#28304a", bareTorso: true, bareArms: true, furSkirt: true, wraps: true },
    blade: "#9fb6c8", jagged: true, dual: true,
  }),
  urokodaki: base("urokodaki", "Урокодаки", {
    mask: "tengu", skin: "#f0d6c0",
    hair: { style: "spiky", c1: "#f2f0ea", c2: "#cfcac0", seed: 3, crown: 30, spikes: 13, sweep: 26, bangs: 0, locks: 30, lowSpikes: 30 },
    outfit: { top: "url(#p_cloud)", pants: "#2c3e5c", sleeve: "url(#p_cloud)", kimono: true, obi: "#2c3e5c", wideSleeve: true },
  }),
  sabito: base("sabito", "Сабито", {
    eye: "#9a6ac2", mask: "fox",
    hair: { style: "spiky", c1: "#f2ae88", c2: "#e48a6a", seed: 9, crown: 28, spikes: 12, sweep: 26, bangs: 7, bangLen: 52, bangW: 12, locks: 36, lowSpikes: 38 },
    outfit: { top: "#d8d2c2", pants: "#4a5a48", haori: "url(#p_hexa)", kimono: true, obi: "#4a5a48" },
    blade: "#c9d0d6",
  }),
  makomo: base("makomo", "Макомо", {
    eye: "#4a6fb5", mask: "fox", lashes: true, blush: true,
    hair: { style: "straight", c1: "#16141c", c2: "#2a2636", seed: 10, bangs: 8, bangLen: 42, bangW: 10, locks: 60, long: 90 },
    outfit: { top: "url(#p_flower)", pants: "#3a4a6a", sleeve: "url(#p_flower)", kimono: true, obi: "#3a4a6a", wideSleeve: true, skirt: 170, skirtFill: "url(#p_flower)", bareLegs: true },
  }),
  rengoku: base("rengoku", "Ренгоку", {
    eye: "#f2b632", brow: "#c0301a", thickBrow: true,
    hair: { style: "spiky", c1: "#ffd23a", c2: "#e4361e", mid: 0.4, seed: 6, crown: 34, spikes: 13, sweep: 10, flame: true, bangs: 5, bangLen: 48, bangW: 14, locks: 30, lowSpikes: 40 },
    outfit: { top: UNI, pants: UNI, haori: "url(#g_flamehem)", uniform: true },
    blade: "#e8541e", guard: "#e8a21e",
  }),
  kanao: base("kanao", "Канао", {
    eye: "#b48ad8", lashes: true, blush: true, butterfly: true,
    hair: { style: "straight", c1: "#1a1424", c2: "#3a2a4a", seed: 11, bangs: 8, bangLen: 42, bangW: 10, locks: 56, pony: [40, -46, 120, 34] },
    outfit: { top: UNI, pants: UNI, cape: "#f6f2f8", capeW: 84, capeLen: 60, uniform: true, skirt: 140, skirtFill: UNI },
    blade: "#e7a8d0",
  }),
  shinobu: base("shinobu", "Шинобу", {
    eye: "#a37fd0", lashes: true, butterfly: true,
    hair: { style: "straight", c1: "#120f18", c2: "#6b3fa0", mid: 0.5, seed: 12, bangs: 8, bangLen: 40, bangW: 10, locks: 46, bun: true },
    outfit: { top: UNI, pants: UNI, haori: "url(#g_butterfly)", uniform: true },
    blade: "#c9b6ea",
  }),
  muichiro: base("muichiro", "Муичиро", {
    eye: "#46d1c6", brow: "#1a1a1a",
    hair: { style: "straight", c1: "#121318", c2: "#38c3bb", mid: 0.45, seed: 13, bangs: 9, bangLen: 50, bangW: 10, locks: 90, long: 260 },
    outfit: { top: UNI, pants: UNI, uniform: true, wideSleeve: true },
    blade: "#7fe9f0",
  }),
  sanemi: base("sanemi", "Санеми", {
    eye: "#8a2b5a", scars: true,
    hair: { style: "spiky", c1: "#f1f1ee", c2: "#d0d0ca", seed: 8, crown: 34, spikes: 14, sweep: 34, bangs: 6, bangLen: 40, bangW: 13, locks: 20, lowSpikes: 30 },
    outfit: { top: UNI, pants: UNI, haori: "#f2f1ea", uniform: true },
    blade: "#7ac77a",
  }),
  tengen: base("tengen", "Тенген", {
    eye: "#b85bd3", headband: "#e8d27a", scale: 1.1,
    hair: { style: "spiky", c1: "#f4f1ec", c2: "#d8d2c8", seed: 14, crown: 16, spikes: 11, bangs: 6, bangLen: 40, locks: 40 },
    outfit: { top: UNI, pants: UNI, uniform: true, bareArms: true },
    blade: "#cfd6dd",
  }),
  oyakata: base("oyakata", "Глава корпуса", {
    eye: "#c9c7d6", diseased: true,
    hair: { style: "straight", c1: "#16141a", c2: "#24202a", seed: 15, bangs: 7, bangLen: 30, bangW: 11, part: true, locks: 50 },
    outfit: { top: "#2a2a34", pants: "#3a3a48", haori: "#d8d4e6", kimono: true, obi: "#3a3a48" },
  }),
  yoriichi: base("yoriichi", "Мечник прошлого", {
    eye: "#b0342e", earrings: true, mark: true,
    hair: { ...H_TANJIRO, c1: "#330a0a", c2: "#a82a24", seed: 11, crown: 30, lowSpikes: 44, pony: [0, -50, 220, 64] },
    outfit: { top: "#6e1a1a", pants: "#3a1010", haori: "#8a2020", kimono: true, obi: "#3a1010" },
    blade: "#c42a1c", guard: "#2a2a2a",
  }),
  // --- demons ---------------------------------------------------------------
  muzan: base("muzan", "Мудзан", {
    eye: "#e01b2f", alwaysDemon: true, demonEye: "#ff1e30", skin: "#f3e8e0",
    hair: { style: "wavy", c1: "#0d0b0e", c2: "#1d1720", seed: 12, crown: 14, spikes: 13, bangs: 7, bangLen: 40, bangW: 12, locks: 24 },
    hat: "#f2efe8",
    outfit: { top: "#16151b", pants: "#16151b", suit: true },
  }),
  muzan_battle: base("muzan_battle", "Мудзан", {
    eye: "#e01b2f", alwaysDemon: true, demonEye: "#ff1e30", skin: "#efe6e0", fangs: true,
    hair: { style: "wavy", c1: "#0d0b0e", c2: "#3a2a32", seed: 12, crown: 22, spikes: 13, bangs: 7, bangLen: 46, bangW: 12, locks: 60, long: 300 },
    outfit: { top: "#16151b", pants: "#16151b", cape: "#0d0b0e", capeLen: 300, capeW: 120 },
  }),
  tamayo: base("tamayo", "Тамаё", {
    eye: "#b2509e", lashes: true,
    hair: { style: "straight", c1: "#1a1018", c2: "#2a1a28", seed: 16, bangs: 6, bangLen: 30, bangW: 11, part: true, locks: 50, bun: true },
    outfit: { top: "#5a2c6e", pants: "#3a1a48", kimono: true, skirt: 290, skirtFill: "#4e2462", obi: "#d8b4e0", wideSleeve: true, sleeve: "#5a2c6e" },
  }),
  akaza: base("akaza", "Аказа", {
    eye: "#f2d24a", alwaysDemon: true, demonEye: "#f6d43c", skin: "#f1d8cc", tattoo: true, fangs: true,
    hair: { style: "spiky", c1: "#f08a8e", c2: "#e05a6e", seed: 13, crown: 20, spikes: 12, sweep: 30, bangs: 6, bangLen: 42, bangW: 12, locks: 18 },
    outfit: { top: "#f1d8cc", pants: "#f2efe8", bareTorso: true, bareArms: true },
  }),
  rui: base("rui", "Руй", {
    eye: "#e01b2f", alwaysDemon: true, skin: "#f6efe8", scale: 0.76,
    hair: { style: "straight", c1: "#f3f1ee", c2: "#d8d4ce", seed: 17, bangs: 8, bangLen: 48, bangW: 10, locks: 50 },
    outfit: { top: "#f2efe8", pants: "#f2efe8", kimono: true, obi: "#d0ccc4", collar: "#f8f6f2" },
  }),
  father: base("father", "Отец", {
    eye: "#9a4a3a", skin: "#f0dccc", earrings: true, scale: 1.04,
    hair: { ...H_TANJIRO, c1: "#2a1210", c2: "#7a2a22", seed: 21, crown: 18 },
    outfit: { top: "#3a3a40", pants: "#2a2a30", haori: "#5a4a40", kimono: true, obi: "#2a2a30", wraps: true },
  }),
  smith: base("smith", "Кузнец", {
    mask: "hyottoko", scale: 1.12,
    hair: { style: "spiky", c1: "#1a1a1a", c2: "#2a2a2a", seed: 22, crown: 10, spikes: 10, bangs: 0, locks: 10 },
    outfit: { top: "#5a6a8a", pants: "#3a4a6a", kimono: true, obi: "#2a2a3a", wideSleeve: true, sleeve: "#5a6a8a" },
  }),
  koyuki: base("koyuki", "Девушка", {
    eye: "#d06a8a", lashes: true, blush: true, scale: 0.92,
    hair: { style: "straight", c1: "#1a1418", c2: "#3a2a30", seed: 23, bangs: 8, bangLen: 40, bangW: 10, locks: 50, long: 140 },
    outfit: { top: "#e8a0b0", pants: "#4a3a40", kimono: true, skirt: 290, skirtFill: "#d890a2", obi: "#7a4a8a", wideSleeve: true, sleeve: "#e8a0b0" },
  }),
  modern_boy: base("modern_boy", "Мальчик", {
    eye: "#b0342e", hair: { ...H_TANJIRO, seed: 24 }, earrings: true, blush: true,
    outfit: { top: "#1c2030", pants: "#1c2030", uniform: true },
  }),
  modern_girl: base("modern_girl", "Девочка", {
    eye: "#b48ad8", lashes: true, blush: true, butterfly: true,
    hair: { style: "straight", c1: "#1a1424", c2: "#3a2a4a", seed: 25, bangs: 8, bangLen: 42, bangW: 10, locks: 56, pony: [40, -46, 120, 34] },
    outfit: { top: "#f2f2f6", pants: "#2a3050", kimono: false, skirt: 150, skirtFill: "#2a3050", bareLegs: true, collar: "#2a3050" },
  }),
  demon: base("demon", "Демон", { outfit: { top: "#111", pants: "#111" }, silEye: "#ff1e3c" }),
};
