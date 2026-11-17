import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HudEv, SceneDef} from '../lib/shot';
import {S00} from './S00';
import {S01} from './S01';
import {S02} from './S02';
import {S03} from './S03';
import {S04} from './S04';
import {S05} from './S05';
import {S06} from './S06';
import {S07} from './S07';
import {S08} from './S08';
import {S09} from './S09';
import {S10} from './S10';

const Placeholder = (id: string): SceneDef => ({
  id,
  shots: [{cue: '', C: () => <AbsoluteFill style={{background: '#111', color: '#888', fontSize: 80, alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter'}}>{id}</AbsoluteFill>, hud: false}],
});

export const SCENES: SceneDef[] = [S00, S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
void Placeholder;

export const HUD_EVENTS: HudEv[] = [
  {id: 'S00', cue: 'Пять', show: true, money: 1048000, stars: 5, flash: true, offset: -60},
  {id: 'S00', cue: 'А перед', show: false},
  {id: 'S01', cue: 'Три', money: 0, stars: 0, flash: false},
  {id: 'S04', cue: 'По дороге', show: true, money: 0, stars: 0},
  {id: 'S04', cue: 'Снимаешь', money: 5, offset: 10},
  {id: 'S04', cue: 'Ты берёшь', money: 55, offset: 12},
  {id: 'S05', cue: 'К обеду', money: 1200, offset: 6},
  {id: 'S05', cue: 'К пятнице', money: 48000, offset: 6},
  {id: 'S06', cue: 'денежный дождь', money: 1048000},
  {id: 'S06', cue: 'первая звезда', stars: 1},
  {id: 'S06', cue: 'Две звезды', stars: 2},
  {id: 'S06', cue: 'Три', stars: 3},
  {id: 'S07', cue: 'Четыре звезды', stars: 4},
  {id: 'S07', cue: 'Пять звёзд', stars: 5, flash: true},
  {id: 'S08', cue: 'И возвращаешь', money: 0, offset: 10},
  {id: 'S08', cue: 'Звёзды гаснут', stars: 4, flash: false},
  {id: 'S08', cue: 'Звёзды гаснут', stars: 3, offset: 12},
  {id: 'S08', cue: 'Звёзды гаснут', stars: 2, offset: 24},
  {id: 'S08', cue: 'Звёзды гаснут', stars: 1, offset: 36},
  {id: 'S08', cue: 'Звёзды гаснут', stars: 0, offset: 48},
  {id: 'S09', cue: 'И интерфейс', show: false, offset: 20},
];
