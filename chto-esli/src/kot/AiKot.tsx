import { Audio } from '@remotion/media';
import { AbsoluteFill, staticFile, Track, useVideoConfig } from 'remotion';
import { AiScene } from './AiScene';
import { Bubble, Caption, EndCard, TitleCard } from './Overlays';

// «Что, если бы ты слышал мысли кота?!» — версия на ИИ-иллюстрациях (стиль аниме-стикмен), 12.5 с, 9:16.
export const AiKot = () => {
	const { fps } = useVideoConfig();
	return (
		<AbsoluteFill>
			<AiScene
				catOverlay={
					<Track name="Мысли кота">
						<Bubble
							name="Мысль 1"
							from={3.5 * fps}
							durationInFrames={3.1 * fps}
							text="Опять этот лысый великан забыл про мой ужин."
							fontSize={34}
							tailX={0.64}
							tailY={40}
							style={{ left: 330, top: 265, width: 690, height: 170 }}
						/>
						<Bubble
							name="Мысль 2"
							from={6.85 * fps}
							durationInFrames={2.95 * fps}
							text="Ничего. Ночью скину его телефон в унитаз. Снова."
							fontSize={36}
							tailX={1.28}
							tailY={-150}
							style={{ left: 160, top: 470, width: 470, height: 240 }}
						/>
						<Bubble
							name="Мысль 3 — поворот"
							from={9.95 * fps}
							durationInFrames={0.95 * fps}
							text="…Стоп. Ты что, меня СЛЫШИШЬ?!"
							fontSize={24}
							tailX={0.61}
							tailY={70}
							style={{ left: 494, top: 262, width: 460, height: 115 }}
						/>
					</Track>
				}
			/>
			<Track name="Заголовок">
				<TitleCard
					name="Хук"
					from={0.25 * fps}
					durationInFrames={2.6 * fps}
					line1="ЧТО, ЕСЛИ БЫ ТЫ"
					line2={'СЛЫШАЛ\nМЫСЛИ КОТА?!'}
					style={{ left: 80, top: 130, whiteSpace: 'pre-line' }}
				/>
			</Track>
			<Track name="Субтитры">
				<Caption name="Субтитр 1" from={3.4 * fps} durationInFrames={1.8 * fps} text="Однажды ты начинаешь слышать чужие мысли…" style={{ top: 1400 }} />
				<Caption name="Субтитр 2" from={5.2 * fps} durationInFrames={1.4 * fps} text="…мысли своего кота." style={{ top: 1400 }} />
				<Caption name="Субтитр 3" from={7.0 * fps} durationInFrames={2.8 * fps} text="И его планы тебе совсем не нравятся." style={{ top: 1480 }} />
			</Track>
			<Track name="Финал">
				<EndCard name="Продолжение" from={11.6 * fps} durationInFrames={0.9 * fps} text="ПРОДОЛЖЕНИЕ СЛЕДУЕТ…" style={{ top: 1500 }} />
			</Track>
			<Track name="Музыка">
				<Audio name="Лоу-фай фон" src={staticFile('sfx/music.wav')} volume={0.8} />
			</Track>
			<Track name="Звуки">
				<Audio name="Вжух — заголовок" src={staticFile('sfx/whoosh.wav')} from={0.2 * fps} volume={0.6} />
				<Audio name="Вжух — к коту" src={staticFile('sfx/whoosh.wav')} from={2.8 * fps} volume={0.45} />
				<Audio name="Поп — мысль 1" src={staticFile('sfx/pop.wav')} from={3.5 * fps} volume={0.7} />
				<Audio name="Печать 1" src={staticFile('sfx/type.wav')} from={3.65 * fps} volume={0.35} />
				<Audio name="Бум — испуг героя" src={staticFile('sfx/boom.wav')} from={6.6 * fps} volume={0.6} />
				<Audio name="Поп — мысль 2" src={staticFile('sfx/pop.wav')} from={6.85 * fps} volume={0.7} />
				<Audio name="Печать 2" src={staticFile('sfx/type.wav')} from={7.0 * fps} volume={0.35} />
				<Audio name="Бум — поворот" src={staticFile('sfx/boom.wav')} from={9.9 * fps} volume={1} />
				<Audio name="Поп — мысль 3" src={staticFile('sfx/pop.wav')} from={9.95 * fps} volume={0.7} />
				<Audio name="Бум — крупный план" src={staticFile('sfx/boom.wav')} from={10.9 * fps} volume={0.7} />
			</Track>
		</AbsoluteFill>
	);
};
