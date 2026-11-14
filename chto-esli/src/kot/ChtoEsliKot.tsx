import { Audio } from '@remotion/media';
import { AbsoluteFill, staticFile, Track, useVideoConfig } from 'remotion';
import { Bubble, Caption, EndCard, TitleCard } from './Overlays';
import { Scene } from './Scene';

// Серия «Что если»: «Что, если бы ты слышал мысли кота?!» — 12 с, 9:16.
// Тексты, тайминги и звуки — отдельные элементы таймлайна, их можно править в Remotion Studio.
export const ChtoEsliKot = () => {
	const { fps } = useVideoConfig();
	return (
		<AbsoluteFill>
			<Scene
				midOverlay={
					<Track name="Мысли кота">
						<Bubble
							name="Мысль 1"
							from={3.4 * fps}
							durationInFrames={3.3 * fps}
							text="Опять этот лысый великан забыл про мой ужин."
							fontSize={44}
							tailX={0.72}
							tailY={95}
							style={{ left: 150, top: 560, width: 800, height: 190 }}
						/>
						<Bubble
							name="Мысль 2"
							from={6.85 * fps}
							durationInFrames={2.9 * fps}
							text="Ничего. Ночью скину его телефон в унитаз. Снова."
							fontSize={44}
							tailX={0.72}
							tailY={95}
							style={{ left: 150, top: 560, width: 800, height: 190 }}
						/>
						<Bubble
							name="Мысль 3 — поворот"
							from={9.95 * fps}
							durationInFrames={0.95 * fps}
							text="…Стоп. Ты что, меня СЛЫШИШЬ?!"
							fontSize={42}
							tailX={0.55}
							tailY={70}
							style={{ left: 480, top: 590, width: 520, height: 150 }}
						/>
					</Track>
				}
			/>
			<Track name="Заголовок">
				<TitleCard
					name="Хук"
					from={0.25 * fps}
					durationInFrames={2.85 * fps}
					line1="ЧТО, ЕСЛИ БЫ ТЫ"
					line2={'СЛЫШАЛ\nМЫСЛИ КОТА?!'}
					style={{ left: 80, top: 190, whiteSpace: 'pre-line' }}
				/>
			</Track>
			<Track name="Субтитры">
				<Caption name="Субтитр 1" from={3.3 * fps} durationInFrames={2 * fps} text="Однажды ты начинаешь слышать чужие мысли…" style={{ top: 1380 }} />
				<Caption name="Субтитр 2" from={5.3 * fps} durationInFrames={1.4 * fps} text="…мысли своего кота." style={{ top: 1380 }} />
				<Caption name="Субтитр 3" from={7 * fps} durationInFrames={2.7 * fps} text="И его планы тебе совсем не нравятся." style={{ top: 1380 }} />
			</Track>
			<Track name="Финал">
				<EndCard name="Продолжение" from={11.25 * fps} durationInFrames={0.75 * fps} text="ПРОДОЛЖЕНИЕ СЛЕДУЕТ…" style={{ top: 1400 }} />
			</Track>
			<Track name="Музыка">
				<Audio name="Лоу-фай фон" src={staticFile('sfx/music.wav')} volume={0.8} />
			</Track>
			<Track name="Звуки">
				<Audio name="Вжух — заголовок" src={staticFile('sfx/whoosh.wav')} from={0.2 * fps} volume={0.6} />
				<Audio name="Поп — мысль 1" src={staticFile('sfx/pop.wav')} from={3.4 * fps} volume={0.7} />
				<Audio name="Печать 1" src={staticFile('sfx/type.wav')} from={3.55 * fps} volume={0.35} />
				<Audio name="Поп — мысль 2" src={staticFile('sfx/pop.wav')} from={6.85 * fps} volume={0.7} />
				<Audio name="Печать 2" src={staticFile('sfx/type.wav')} from={7 * fps} volume={0.35} />
				<Audio name="Телефон упал" src={staticFile('sfx/clunk.wav')} from={8.7 * fps} volume={0.8} />
				<Audio name="Бум — поворот" src={staticFile('sfx/boom.wav')} from={9.9 * fps} volume={1} />
				<Audio name="Поп — мысль 3" src={staticFile('sfx/pop.wav')} from={9.95 * fps} volume={0.7} />
				<Audio name="Бум — крупный план" src={staticFile('sfx/boom.wav')} from={10.9 * fps} volume={0.7} />
			</Track>
		</AbsoluteFill>
	);
};
