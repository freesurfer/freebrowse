import {
	EditSurfaceCommand,
	EditVolumeCommand,
	ProjectsClient,
	SurfaceClient,
	VolumeClient,
} from '@/generated/web-api-client';
import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { MainView } from '@/pages/project/components/MainView';
import { LeftBar } from '@/pages/project/components/leftBar/LeftBar';
import { RightBar } from '@/pages/project/components/rightBar/RightBar';
import { TopBar } from '@/pages/project/components/topBar/TopBar';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { getApiUrl } from '@/utils';
import type { LocationData } from '@niivue/niivue';
import { createContext, useEffect, useReducer, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useParams } from 'react-router-dom';

interface IProjectContext {
	niivueWrapper: RefObject<NiivueWrapper | undefined> | undefined;
	location: LocationData | undefined;
}

export const ProjectContext = createContext<IProjectContext>({
	niivueWrapper: undefined,
	location: undefined,
});

const projectStateReducer = (
	currentState: ProjectState | undefined,
	newState: (currentState: ProjectState | undefined) => ProjectState | undefined
): ProjectState | undefined => {
	const newProjectState = newState(currentState);

	if (currentState === undefined) return newProjectState;
	if (newProjectState === undefined) return undefined;

	const uploadToBackend = async (
		stateToUpload: ProjectState
	): Promise<void> => {
		if (
			newProjectState.files.cloudVolumes !== currentState.files.cloudVolumes
		) {
			const client = new VolumeClient(getApiUrl());
			for (const cloudVolume of stateToUpload.files.cloudVolumes) {
				await client.edit(
					new EditVolumeCommand({
						id: cloudVolume.id,
						order: cloudVolume.order,
						contrastMin: cloudVolume.contrastMin,
						contrastMax: cloudVolume.contrastMax,
						opacity: cloudVolume.opacity,
						visible: cloudVolume.isChecked,
					})
				);
			}
		}

		if (newProjectState.files.surfaces !== currentState.files.cloudSurfaces) {
			const client = new SurfaceClient(getApiUrl());
			for (const cloudSurface of stateToUpload.files.cloudSurfaces) {
				await client.edit(
					new EditSurfaceCommand({
						id: cloudSurface.id,
						order: cloudSurface.order,
						opacity: cloudSurface.opacity,
						visible: cloudSurface.isChecked,
					})
				);
			}
		}
	};

	void uploadToBackend(newProjectState);

	return newProjectState;
};

export const ProjectPage = (): React.ReactElement => {
	const { projectId } = useParams();

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>();
	const [location, setLocation] = useState<LocationData | undefined>();
	const [projectState, setProjectState] = useReducer(
		projectStateReducer,
		undefined
	);

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
			setProjectState(() => new ProjectState({ backendState }));
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
				niivueWrapper,
				location,
			}}
		>
			<div className="flex h-full flex-col">
				<TopBar></TopBar>
				<div className="border-5 flex h-full flex-row border-red">
					<LeftBar
						projectState={projectState}
						setProjectState={setProjectState}
					></LeftBar>
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
