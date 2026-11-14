import { Composition, Folder } from 'remotion';
import { AiKot } from './kot/AiKot';
import { ChtoEsliKot } from './kot/ChtoEsliKot';

export const RemotionRoot: React.FC = () => {
	return (
		<Folder name="Chto-esli">
			<Composition id="KotShortsAI" component={AiKot} durationInFrames={375} fps={30} width={1080} height={1920} />
			<Composition id="KotShorts" component={ChtoEsliKot} durationInFrames={360} fps={30} width={1080} height={1920} />
		</Folder>
	);
};
