import { Tabs } from '@/components/Tabs';
import { useProjectDialogState } from '@/dialogs/openProject/hooks/useProjectDialogState';
import {
	CloudSurfaceFile,
	CloudVolumeFile,
	LocalSurfaceFile,
	LocalVolumeFile,
} from '@/dialogs/openProject/models/ProjectFile';
import { MyComputerDialogTab } from '@/dialogs/openProject/tabs/my-computer/MyComputerDialogTab';
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
import type { ProjectDto } from '@/generated/web-api-client';
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
	readonly createProject: () => Promise<ResolveCreateProjectDialogResult>;
	readonly editProject: (project: ProjectDto | undefined) => Promise<void>;
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
		projectDto,
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

				resolve({ projectId: createProjectResponse.id });
			} catch (error) {
				console.error('something went wrong', error);
				reject('UNKNOWN_ERROR');
			}
		};

		const updateProjectInBackend = async (): Promise<void> => {
			if (projectDto?.id === undefined) {
				console.error('update not possible without existing project');
				return;
			}

			const surfaceClient = new SurfaceClient(getApiUrl());
			const volumeClient = new VolumeClient(getApiUrl());

			const deletedSurfaces =
				projectDto.surfaces?.filter(
					(backendFile) =>
						projectFiles.surfaceFiles.find(
							(tmpFile) => tmpFile.name === backendFile.fileName
						) === undefined
				) ?? [];
			for (const deletedSurface of deletedSurfaces) {
				await surfaceClient.delete(
					new DeleteSurfaceCommand({ id: deletedSurface.id })
				);
			}

			const addedSurfaces = projectFiles.surfaceFiles.filter(
				(tmpFile) =>
					projectDto.surfaces?.find(
						(backendFile) => backendFile.fileName === tmpFile.name
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
				await surfaceClient.create(
					new CreateSurfacesCommand({
						projectId: projectDto.id,
						surfaces: await Promise.all(
							addedLocalSurfaceFiles.map(
								async (addedSurfaceFile) =>
									await addedSurfaceFile.toSurfaceDto3()
							)
						),
					})
				);
			}

			const deletedVolumes =
				projectDto.volumes?.filter(
					(backendFile) =>
						projectFiles.volumeFiles.find(
							(tmpFile) => tmpFile.name === backendFile.fileName
						) === undefined
				) ?? [];
			for (const deletedVolume of deletedVolumes) {
				await volumeClient.delete(
					new DeleteVolumeCommand({ id: deletedVolume.id })
				);
			}

			const addedVolumes = projectFiles.volumeFiles.filter(
				(tmpFile) =>
					projectDto.volumes?.find(
						(backendFile) => backendFile.fileName === tmpFile.name
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
				await volumeClient.create(
					new CreateVolumesCommand({
						projectId: projectDto.id,
						volumes: await Promise.all(
							addedLocalVolumeFiles.map(
								async (addedVolumeFile) => await addedVolumeFile.toVolumeDto3()
							)
						),
					})
				);
			}

			resolve({ projectId: projectDto.id });
		};

		if (projectDto === undefined) {
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
						<div className="flex gap-4 items-center m-4">
							<ArrowUpTrayIcon className="text-gray-500 h-8 w-8 shrink-0"></ArrowUpTrayIcon>
							<h1 className="text-xl text-gray-500 font-bold mr-12">
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
											projectDto={projectDto}
										></MyComputerDialogTab>
									),
								},
								{
									title: 'Cloud',
									content: <></>,
								},
							]}
						/>

						<div className="flex justify-end m-2">
							<button
								className="m-2 bg-gray-200 text-gray-500 text-sm font-semibold px-5 py-3 rounded-md"
								onClick={() => resolve('canceled')}
							>
								Cancel
							</button>
							<button
								className="m-2 bg-gray-500 text-white text-sm font-semibold px-5 py-3 rounded-md"
								onClick={() => {
									void onOpenClick();
								}}
							>
								{projectDto === undefined ? 'Open' : 'Update'}
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
