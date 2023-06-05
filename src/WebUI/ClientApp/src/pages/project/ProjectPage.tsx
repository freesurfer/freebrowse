import { ProjectsClient } from '@/generated/web-api-client';
import { MainView } from '@/pages/project/components/MainView';
import { LeftBar } from '@/pages/project/components/leftBar/LeftBar';
import { RightBar } from '@/pages/project/components/rightBar/RightBar';
import { TopBar } from '@/pages/project/components/topBar/TopBar';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { getApiUrl } from '@/utils';
import type { LocationData } from '@niivue/niivue';
import { Niivue } from '@niivue/niivue';
import { createContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

interface IProjectContext {
	niivue: Niivue | undefined;
	projectState: ProjectState | undefined;
	setProjectState: (projectState: ProjectState) => void;
	/**
	 * file name of selected file
	 */
	selectedFile: string | undefined;
	setSelectedFile: (fileName: string | undefined) => void;
	location: LocationData | undefined;
}

export const ProjectContext = createContext<IProjectContext>({
	niivue: undefined,
	projectState: undefined,
	setProjectState: (projectState: ProjectState): void => {
		throw new Error('method not initialized yet');
	},
	selectedFile: undefined,
	setSelectedFile: (fileName: string | undefined): void => {
		throw new Error('method not initialized yet');
	},
	location: undefined,
});

export const ProjectPage = (): React.ReactElement => {
	const { projectId } = useParams();
	const [projectState, setProjectState] = useState<ProjectState | undefined>();

	const [selectedFile, setSelectedFile] = useState<string | undefined>();
	const [location, setLocation] = useState<LocationData | undefined>();
	const [isCtrlPressed, setIsCtrlPressed] = useState(false);

	useEffect(() => {
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
	}, [projectId]);

	const niivue = useRef<Niivue>(
		new Niivue({
			show3Dcrosshair: false,
			onLocationChange: (location) => setLocation(location),
		})
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Control') {
				setIsCtrlPressed(true);
			}
		};

		const handleKeyUp = (event: KeyboardEvent): void => {
			if (event.key === 'Control') {
				setIsCtrlPressed(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);

		const loadData = async (): Promise<void> => {
			niivue.current.volumes.forEach((volume) => {
				niivue.current.removeVolume(volume);
			});

			if (projectState === undefined) return;

			niivue.current.setHighResolutionCapable(false);
			niivue.current.opts.isOrientCube = false;

			for (const cloudVolumeFile of projectState.files.cloudVolumes) {
				await niivue.current.loadVolumes([
					{
						url: cloudVolumeFile.url,
						name: cloudVolumeFile.name,
					},
				]);
			}

			for (const cloudSurfaceFile of projectState.files.cloudSurfaces) {
				await niivue.current.loadMeshes([
					{
						url: cloudSurfaceFile.url,
						name: cloudSurfaceFile.name,
					},
				]);
			}

			niivue.current.setMeshThicknessOn2D(0);
		};
		void loadData();
	}, [projectState]);

	useEffect(() => {
		if (isCtrlPressed) {
			niivue.current.opts.dragMode = niivue.current.dragModes.pan;
		} else {
			niivue.current.opts.dragMode = niivue.current.dragModes.none;
		}
	}, [isCtrlPressed]);

	return (
		<ProjectContext.Provider
			value={{
				projectState,
				setProjectState,
				niivue: niivue.current,
				selectedFile,
				setSelectedFile,
				location,
			}}
		>
			<div className="flex flex-col h-full">
				<TopBar></TopBar>
				<div className="flex flex-row h-full">
					<LeftBar></LeftBar>
					<MainView></MainView>
					<RightBar></RightBar>
				</div>
			</div>
		</ProjectContext.Provider>
	);
};
