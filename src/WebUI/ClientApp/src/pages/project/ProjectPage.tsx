import { ProjectsClient } from '@/generated/web-api-client';
import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { MainView } from '@/pages/project/components/MainView';
import { LeftBar } from '@/pages/project/components/leftBar/LeftBar';
import { RightBar } from '@/pages/project/components/rightBar/RightBar';
import { TopBar } from '@/pages/project/components/topBar/TopBar';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { getApiUrl } from '@/utils';
import type { LocationData } from '@niivue/niivue';
import { createContext, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useParams } from 'react-router-dom';

interface IProjectContext {
	niivueWrapper: RefObject<NiivueWrapper | undefined> | undefined;
	projectState: ProjectState | undefined;
	setProjectState: (projectState: ProjectState) => void;
	location: LocationData | undefined;
}

export const ProjectContext = createContext<IProjectContext>({
	niivueWrapper: undefined,
	projectState: undefined,
	setProjectState: (projectState: ProjectState): void => {
		throw new Error('method not initialized yet');
	},
	location: undefined,
});

export const ProjectPage = (): React.ReactElement => {
	const { projectId } = useParams();
	const [projectState, setProjectState] = useState<ProjectState | undefined>();

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>();
	const [location, setLocation] = useState<LocationData | undefined>();

	// we should use a reference here, since the Niivue library is not immutable
	// this could lead to confusions, if the state of the library changes, without rerendering is getting triggered
	const niivueWrapper = useRef<NiivueWrapper | undefined>();

	useEffect(() => {
		if (projectId === undefined) return;
		if (canvas === undefined || canvas === null) return;

		niivueWrapper.current = new NiivueWrapper(canvas, (location) =>
			setLocation(location)
		);

		const fetchData = async (): Promise<void> => {
			const client = new ProjectsClient(getApiUrl());
			if (projectId === undefined) {
				console.error('no project id given');
				return;
			}

			const backendState = await client.getProject(Number(projectId));
			setProjectState(new ProjectState({ backendState }));
		};
		void fetchData();
		return () => {
			niivueWrapper.current = undefined;
		};
	}, [projectId, canvas]);

	useEffect(() => {
		if (
			projectState === undefined ||
			niivueWrapper === undefined ||
			niivueWrapper.current === undefined ||
			niivueWrapper.current === null
		)
			return;
		niivueWrapper.current.loadDataAsync(projectState.files);
	}, [projectState, niivueWrapper]);

	useEffect(() => {
		const niivueWrapperInstance = niivueWrapper.current;
		if (niivueWrapperInstance === undefined) return;

		document.addEventListener('keydown', niivueWrapperInstance.handleKeyDown);
		document.addEventListener('keyup', niivueWrapperInstance.handleKeyUp);
		document.addEventListener(
			'mousemove',
			niivueWrapperInstance.handleMouseMove
		);

		return () => {
			document.removeEventListener(
				'keydown',
				niivueWrapperInstance.handleKeyDown
			);
			document.removeEventListener('keyup', niivueWrapperInstance.handleKeyUp);
			document.removeEventListener(
				'mousemove',
				niivueWrapperInstance.handleMouseMove
			);
		};
	}, [niivueWrapper]);

	return (
		<ProjectContext.Provider
			value={{
				projectState,
				setProjectState,
				niivueWrapper,
				location,
			}}
		>
			<div className="flex flex-col h-full">
				<TopBar></TopBar>
				<div className="flex flex-row h-full">
					<LeftBar></LeftBar>
					<MainView
						setCanvas={(newCanvas) => {
							setCanvas(newCanvas);
						}}
					></MainView>
					<RightBar></RightBar>
				</div>
			</div>
		</ProjectContext.Provider>
	);
};
