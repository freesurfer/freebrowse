import { Tabs } from '@/components/Tabs';
import {
	CreateSurfacesCommand,
	CreateVolumesCommand,
	DeleteSurfaceCommand,
	DeleteVolumeCommand,
	SurfaceClient,
	VolumeClient,
	CreateProjectCommand,
	ProjectsClient,
} from '@/generated/web-api-client';
import { useProjectDialogState } from '@/pages/project/dialogs/openProject/hooks/useProjectDialogState';
import { MyComputerDialogTab } from '@/pages/project/dialogs/openProject/tabs/my-computer/MyComputerDialogTab';
import {
	CloudSurfaceFile,
	CloudVolumeFile,
	LocalSurfaceFile,
	LocalVolumeFile,
} from '@/pages/project/models/ProjectFile';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { getApiUrl } from '@/utils';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createContext } from 'react';
import Modal from 'react-modal';

export type ResolveCreateProjectDialogResult =
	| {
			projectId: number;
	  }
	| 'canceled';

export interface IOpenProjectDialog {
	/**
	 * open the modal dialog
	 */
	readonly createProject: () => Promise<
		| {
				projectId: number;
		  }
		| 'canceled'
	>;
	readonly editProject: (
		projectState: ProjectState
	) => Promise<ProjectFiles | 'canceled'>;
}

export const OpenProjectDialogContext = createContext<IOpenProjectDialog>({
	createProject: async () => {
		throw new Error('not initialized yet');
	},
	editProject: async () => {
		throw new Error('not initialized yet');
	},
});

const customStyles = {
	overlay: {
		zIndex: 1,
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
		padding: '0px',
		maxHeight: '100vh',
		maxWidth: '100vw',
	},
};

/**
 * Make sure to bind modal to your appElement
 * https://reactcommunity.org/react-modal/accessibility/
 */
const bindModalToRoot = (): void => {
	const rootElement = document.getElementById('root');
	if (rootElement !== null) Modal.setAppElement(rootElement);
};
bindModalToRoot();

export const OpenProjectDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const {
		context,
		isOpen,
		projectFiles,
		setProjectFiles,
		projectName,
		setProjectName,
		projectState,
		resolve,
		reject,
	} = useProjectDialogState();

	const onOpenClick = async (): Promise<void> => {
		if (
			projectFiles === undefined ||
			resolve === undefined ||
			reject === undefined
		) {
			console.error('modal state is not correct');
			return;
		}

		const createProjectInBackend = async (): Promise<void> => {
			const projectClient = new ProjectsClient(getApiUrl());

			try {
				const createProjectResponse = await projectClient.create(
					new CreateProjectCommand({
						name: projectName,
						volumes: await projectFiles.getLocalVolumesToUpload(),
						surfaces: await projectFiles.getLocalSurfacesToUpload(),
					})
				);

				if (createProjectResponse.id === undefined)
					throw new Error('no project id received from backend');

				resolve({
					projectId: createProjectResponse.id,
					projectFiles,
				});
			} catch (error) {
				console.error('something went wrong', error);
				reject('UNKNOWN_ERROR');
			}
		};

		const updateProjectInBackend = async (): Promise<void> => {
			if (projectState === undefined) {
				console.error('update not possible without existing project');
				return;
			}

			let temporaryProjectFiles = projectFiles;
			const surfaceClient = new SurfaceClient(getApiUrl());
			const volumeClient = new VolumeClient(getApiUrl());

			const deletedSurfaces =
				projectState.files.surfaces?.filter(
					(backendFile) =>
						temporaryProjectFiles.surfaces.find(
							(tmpFile) => tmpFile.name === backendFile.name
						) === undefined
				) ?? [];
			for (const deletedSurface of deletedSurfaces) {
				if (deletedSurface instanceof CloudSurfaceFile) {
					await surfaceClient.delete(
						new DeleteSurfaceCommand({ id: deletedSurface.id })
					);
				} else if (deletedSurface instanceof LocalSurfaceFile) {
					continue;
				} else throw new Error('should not happen');
			}

			const addedSurfaces = temporaryProjectFiles.surfaces.filter(
				(tmpFile) =>
					projectState.files.surfaces?.find(
						(backendFile) => backendFile.name === tmpFile.name
					) === undefined
			);

			const addedCloudSurfaceFiles = addedSurfaces.filter(
				(file): file is CloudSurfaceFile => file instanceof CloudSurfaceFile
			);
			for (const addedCloudSurfaceFile of addedCloudSurfaceFiles)
				console.warn(
					'it is not possible to add a file as cloud file directly',
					addedCloudSurfaceFile.name
				);

			const addedLocalSurfaceFiles = addedSurfaces.filter(
				(file): file is LocalSurfaceFile => file instanceof LocalSurfaceFile
			);
			if (addedLocalSurfaceFiles.length > 0) {
				const response = await surfaceClient.create(
					new CreateSurfacesCommand({
						projectId: projectState.id,
						surfaces: await Promise.all(
							addedLocalSurfaceFiles.map(
								async (addedSurfaceFile) =>
									await addedSurfaceFile.toSurfaceDto3()
							)
						),
					})
				);
				temporaryProjectFiles =
					temporaryProjectFiles.fromUploadedSurfaces(response);
			}

			const deletedVolumes =
				projectState.files.volumes?.filter(
					(backendFile) =>
						temporaryProjectFiles.volumes.find(
							(tmpFile) => tmpFile.name === backendFile.name
						) === undefined
				) ?? [];
			for (const deletedVolume of deletedVolumes) {
				if (deletedVolume instanceof CloudVolumeFile) {
					await volumeClient.delete(
						new DeleteVolumeCommand({ id: deletedVolume.id })
					);
				} else if (deletedVolume instanceof LocalVolumeFile) {
					continue;
				} else throw new Error('should not happen');
			}

			const addedVolumes = projectFiles.volumes.filter(
				(tmpFile) =>
					projectState.files.volumes?.find(
						(backendFile) => backendFile.name === tmpFile.name
					) === undefined
			);
			const addedCloudVolumeFiles = addedVolumes.filter(
				(file): file is CloudVolumeFile => file instanceof CloudVolumeFile
			);
			for (const addedCloudVolumeFile of addedCloudVolumeFiles)
				console.warn(
					'it is not possible to add a file as cloud file directly',
					addedCloudVolumeFile.name
				);

			const addedLocalVolumeFiles = addedVolumes.filter(
				(file): file is LocalVolumeFile => file instanceof LocalVolumeFile
			);
			if (addedLocalVolumeFiles.length > 0) {
				const response = await volumeClient.create(
					new CreateVolumesCommand({
						projectId: projectState.id,
						volumes: await Promise.all(
							addedLocalVolumeFiles.map(
								async (addedVolumeFile) => await addedVolumeFile.toVolumeDto3()
							)
						),
					})
				);
				temporaryProjectFiles =
					temporaryProjectFiles.fromUploadedVolumes(response);
			}

			setProjectFiles?.(temporaryProjectFiles);
			resolve({
				projectId: projectState.id,
				projectFiles: temporaryProjectFiles,
			});
		};

		if (projectState === undefined) {
			await createProjectInBackend();
			return;
		}

		await updateProjectInBackend();
	};

	return (
		<>
			<OpenProjectDialogContext.Provider value={context}>
				{children}
			</OpenProjectDialogContext.Provider>
			<Modal
				isOpen={isOpen}
				style={customStyles}
				contentLabel="Load volumes & surfaces"
			>
				{projectFiles !== undefined &&
				setProjectFiles !== undefined &&
				setProjectName !== undefined &&
				resolve !== undefined &&
				reject !== undefined ? (
					<>
						<div className="m-4 flex items-center gap-4">
							<ArrowUpTrayIcon className="text-gray-500 h-8 w-8 shrink-0"></ArrowUpTrayIcon>
							<h1 className="text-gray-500 mr-12 text-xl font-bold">
								Load volumes & surfaces
							</h1>
						</div>
						<button
							onClick={() => resolve('canceled')}
							className="text-gray-600 absolute right-0 top-0 p-2"
						>
							<XMarkIcon className="h-6 w-6 shrink-0"></XMarkIcon>
						</button>

						<Tabs
							tabs={[
								{
									title: 'My computer',
									content: (
										<MyComputerDialogTab
											projectFiles={projectFiles}
											setProjectFiles={setProjectFiles}
											projectName={projectName}
											setProjectName={setProjectName}
											projectState={projectState}
										></MyComputerDialogTab>
									),
								},
								{
									title: 'Cloud',
									content: <></>,
								},
							]}
						/>

						<div className="m-2 flex justify-end">
							<button
								className="bg-gray-200 text-gray-500 m-2 rounded-md px-5 py-3 text-sm font-semibold"
								onClick={() => resolve('canceled')}
							>
								Cancel
							</button>
							<button
								className="bg-gray-500 m-2 rounded-md px-5 py-3 text-sm font-semibold text-white"
								onClick={() => {
									void onOpenClick();
								}}
							>
								{projectState === undefined ? 'Open' : 'Update'}
							</button>
						</div>
					</>
				) : (
					<></>
				)}
			</Modal>
		</>
	);
};
