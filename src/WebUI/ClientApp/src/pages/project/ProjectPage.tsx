import type { ProjectDto } from '@/generated/web-api-client';
import { MainView } from '@/pages/project/components/MainView';
import { LeftBar } from '@/pages/project/components/leftBar/LeftBar';
import { RightBar } from '@/pages/project/components/rightBar/RightBar';
import { TopBar } from '@/pages/project/components/topBar/TopBar';
import { useFetchProject } from '@/pages/project/hooks/useFetchProject';
import type { LocationData } from '@niivue/niivue';
import { Niivue } from '@niivue/niivue';
import { createContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

interface IProjectContext {
	niivue: Niivue | undefined;
	project: ProjectDto | undefined;
	/**
	 * file name of selected file
	 */
	selectedFile: string | undefined;
	setSelectedFile: (fileName: string | undefined) => void;
	location: LocationData | undefined;
}

export const ProjectContext = createContext<IProjectContext>({
	niivue: undefined,
	project: undefined,
	selectedFile: undefined,
	setSelectedFile: (fileName: string | undefined): void => {
		throw new Error('method not initialized yet');
	},
	location: undefined,
});

export const ProjectPage = (): React.ReactElement => {
	const { projectId } = useParams();
	const { project } = useFetchProject(projectId);
	const [selectedFile, setSelectedFile] = useState<string | undefined>();
	const [location, setLocation] = useState<LocationData | undefined>();
	const [isCtrlPressed, setIsCtrlPressed] = useState(false);

	const niivue = useRef<Niivue>(
		new Niivue({
			show3Dcrosshair: true,
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
			niivue.current.setHighResolutionCapable(false);
			niivue.current.opts.isOrientCube = true;

			for (const volume of project?.volumes ?? []) {
				if (volume?.fileName === undefined) continue;
				await niivue.current.loadVolumes([
					{
						url: `https://niivue.github.io/niivue-demo-images/${volume.fileName}`,
						name: volume.fileName,
					},
				]);
			}
			for (const surface of project?.surfaces ?? []) {
				if (surface?.fileName === undefined) continue;
				await niivue.current.loadMeshes([
					{
						url: `https://niivue.github.io/niivue/images/${surface.fileName}`,
						name: surface.fileName,
					},
				]);
			}
			niivue.current.setMeshThicknessOn2D(0);
		};
		void loadData();
	}, [project]);

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
				project,
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
