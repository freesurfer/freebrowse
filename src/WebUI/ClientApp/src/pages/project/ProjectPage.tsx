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
	const [niivue, setNiivue] = useState<Niivue | undefined>();
	const hooveredView = useRef(0);

	useEffect(() => {
		setNiivue(
			new Niivue({
				show3Dcrosshair: false,
				onLocationChange: (location) => setLocation(location),
				dragAndDropEnabled: false,
				dragMode: 3,
			})
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
			setNiivue(undefined);
		};
	}, [projectId]);

	useEffect(() => {
		const loadData = async (): Promise<void> => {
			if (niivue === undefined) return;
			if (projectState === undefined) return;
			niivue.setSliceType(niivue.sliceTypeMultiplanar);

			niivue.setHighResolutionCapable(false);
			niivue.opts.isOrientCube = false;

			await niivue.loadVolumes(
				projectState.files.cloudVolumes.map((file) => {
					return {
						url: file.url,
						name: file.name,
					};
				})
			);

			await niivue.loadMeshes(
				projectState.files.cloudSurfaces.map((file) => {
					return {
						url: file.url,
						name: file.name,
					};
				})
			);

			niivue.setMeshThicknessOn2D(0.5);
			niivue.updateGLVolume();
			niivue.createOnLocationChange();
		};
		void loadData();
	}, [projectState, niivue]);

	useEffect(() => {
		if (niivue === undefined) return;

		const handleKeyDown = (event: KeyboardEvent): void => {
			switch (event.key) {
				case 'Control':
					niivue.opts.dragMode = niivue.dragModes.none;
					break;
				case 'ArrowUp':
					moveSlices(1);
					break;
				case 'ArrowDown':
					moveSlices(-1);
					break;
				default:
					break;
			}
		};

		const handleKeyUp = (event: KeyboardEvent): void => {
			if (event.key === 'Control') {
				niivue.opts.dragMode = niivue.dragModes.pan;
			}
		};

		const handleMouseMove = (event: MouseEvent): void => {
			const rect = niivue.canvas.getBoundingClientRect();
			const x = (event.clientX - rect.left) * niivue.uiData.dpr;
			const y = (event.clientY - rect.top) * niivue.uiData.dpr;
			for (let i = 0; i < niivue.screenSlices.length; i++) {
				const axCorSag = niivue.screenSlices[i].axCorSag;
				if (axCorSag > 3) continue;
				const texFrac = niivue.screenXY2TextureFrac(x, y, i);
				if (
					texFrac[0] === undefined ||
					texFrac[0] < 0 ||
					axCorSag === hooveredView
				)
					continue;
				hooveredView.current = axCorSag;
			}
			if (
				niivue.opts.dragMode === niivue.dragModes.none &&
				(niivue.uiData.mouseButtonCenterDown as boolean)
			) {
				moveSlices(event.movementY);
			}
		};

		function moveSlices(sliceValue: number): void {
			if (niivue === undefined) return;
			if (hooveredView.current === 2) {
				niivue.moveCrosshairInVox(sliceValue, 0, 0);
			} else if (hooveredView.current === 1) {
				niivue.moveCrosshairInVox(0, sliceValue, 0);
			} else {
				niivue.moveCrosshairInVox(0, 0, sliceValue);
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
		document.addEventListener('mousemove', handleMouseMove);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('mousemove', handleMouseMove);
		};
	}, [niivue]);

	return (
		<ProjectContext.Provider
			value={{
				projectState,
				setProjectState,
				niivue,
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
