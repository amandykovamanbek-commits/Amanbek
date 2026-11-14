import { Composition, Folder } from 'remotion';
import { AiKot } from './kot/AiKot';
import { ChtoEsliKot } from './kot/ChtoEsliKot';

export const RemotionRoot: React.FC = () => {
	return (
		<Folder name="Chto-esli">
			<Composition
				id="KotShortsStick"
				component={AiKot}
				durationInFrames={375}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{ dir: 'ai2', heroX: 600, catBottom: 795, badge: 'ОН ВСЁ ЗНАЕТ!' }}
			/>
			<Composition
				id="KotShortsAI"
				component={AiKot}
				durationInFrames={375}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{ dir: 'ai', heroX: 400, catBottom: 818, badge: '' }}
			/>
			<Composition id="KotShorts" component={ChtoEsliKot} durationInFrames={360} fps={30} width={1080} height={1920} />
		</Folder>
	);
};
