import { Composition, Folder } from 'remotion';
import { AiKot } from './kot/AiKot';
import { ChtoEsliKot } from './kot/ChtoEsliKot';
import { Episode1 } from './ep1/Episode1';
import { TyapLyap } from './tl/TyapLyap';
import { AidaRecap } from './aida/AidaRecap';
import { EarthStop, EARTH_TOTAL } from './earth/EarthStop';
import './ep1/fonts';

export const RemotionRoot: React.FC = () => {
	return (
		<Folder name="Chto-esli">
			<Composition id="EarthStop3D" component={EarthStop} durationInFrames={EARTH_TOTAL} fps={30} width={1920} height={1080} />
			<Composition id="Pilot16x9" component={Episode1} durationInFrames={1020} fps={30} width={1920} height={1080} />
			<Composition id="TyapLyapPilot" component={TyapLyap} durationInFrames={996} fps={30} width={1920} height={1080} />
			<Composition id="AidaRecap1to3" component={AidaRecap} durationInFrames={1020} fps={30} width={1920} height={1080} />
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
