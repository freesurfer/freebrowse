import { MainView } from '@/pages/project/components/MainView';
import { LeftBar } from '@/pages/project/components/leftBar/LeftBar';
import { RightBar } from '@/pages/project/components/rightBar/RightBar';
import { TopBar } from '@/pages/project/components/topBar/TopBar';
import { useProject } from '@/pages/project/hooks/useProject';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

export const ProjectPage = (): ReactElement => {
	const { projectId } = useParams();

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>();

	const {
		projectState,
		setProjectState,
		location,
		niivueWrapper,
		wayPointUndo,
		wayPointRedo,
	} = useProject(projectId, canvas);

	return (
		<div className="flex h-full flex-col text-font">
			<TopBar
				projectState={projectState}
				setProjectState={setProjectState}
				location={location}
				niivueWrapper={niivueWrapper}
				wayPointUndo={wayPointUndo}
				wayPointRedo={wayPointRedo}
			></TopBar>
			<div className="border-5 flex h-full flex-row border-red">
				<LeftBar
					projectState={projectState}
					setProjectState={setProjectState}
					location={location}
				></LeftBar>
				<MainView setCanvas={setCanvas}></MainView>
				<RightBar
					projectState={projectState}
					setProjectState={setProjectState}
				></RightBar>
			</div>
		</div>
	);
};
