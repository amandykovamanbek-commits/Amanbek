import type { Shot } from "./types";
import { CH0, CH1, CH2 } from "./ch0_2";
import { CH3, CH4, CH5 } from "./ch3_5";
import { CH6, CH7, CH8, CH9 } from "./ch6_9";
import { CH10, CH11, CH12 } from "./ch10_12";
import { CH13, CH14, CH15 } from "./ch13_15";
export type { Shot } from "./types";
export const SHOTS: Record<number, Shot[]> = { 0: CH0, 1: CH1, 2: CH2, 3: CH3, 4: CH4, 5: CH5, 6: CH6, 7: CH7, 8: CH8, 9: CH9, 10: CH10, 11: CH11, 12: CH12, 13: CH13, 14: CH14, 15: CH15 };
