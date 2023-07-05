import { Tabs } from '@/components/Tabs';
import { useApiProject } from '@/hooks/useApiProject';
import { useApiSurface } from '@/hooks/useApiSurface';
import { useApiVolume } from '@/hooks/useApiVolume';
import { DialogFrame } from '@/pages/project/dialogs/DialogFrame';
import { useProjectDialogState } from '@/pages/project/dialogs/openProject/hooks/useProjectDialogState';
import { MyComputerDialogTab } from '@/pages/project/dialogs/openProject/tabs/my-computer/MyComputerDialogTab';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { createContext, useCallback } from 'react';

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

	const apiProject = useApiProject();
	const apiVolume = useApiVolume();
	const apiSurface = useApiSurface();

	const onOpenClick = useCallback(async (): Promise<void> => {
		if (
			projectFiles === undefined ||
			resolve === undefined ||
			reject === undefined
		) {
			console.error('modal state is not correct');
			return;
		}

		const createProjectInBackend = async (): Promise<void> => {
			try {
				resolve(await apiProject.create(projectName, 0.5, projectFiles));
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

			const deletedSurfaces =
				projectState.files.surfaces?.filter(
					(backendFile) =>
						temporaryProjectFiles.surfaces.find(
							(tmpFile) => tmpFile.name === backendFile.name
						) === undefined
				) ?? [];
			for (const deletedSurface of deletedSurfaces)
				if (deletedSurface instanceof CloudSurfaceFile)
					await apiSurface.remove(deletedSurface);

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
				temporaryProjectFiles = temporaryProjectFiles.fromUploadedSurfaces(
					await apiSurface.create(projectState.id, addedLocalSurfaceFiles)
				);
			}

			const deletedVolumes =
				projectState.files.volumes?.filter(
					(backendFile) =>
						temporaryProjectFiles.volumes.find(
							(tmpFile) => tmpFile.name === backendFile.name
						) === undefined
				) ?? [];
			for (const deletedVolume of deletedVolumes)
				if (deletedVolume instanceof CloudVolumeFile)
					await apiVolume.remove(deletedVolume);

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
				temporaryProjectFiles = temporaryProjectFiles.fromUploadedVolumes(
					await apiVolume.create(projectState.id, addedLocalVolumeFiles)
				);
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
	}, [
		apiVolume,
		apiProject,
		apiSurface,
		projectFiles,
		projectName,
		projectState,
		reject,
		resolve,
		setProjectFiles,
	]);

	return (
		<>
			<OpenProjectDialogContext.Provider value={context}>
				{children}
			</OpenProjectDialogContext.Provider>
			<DialogFrame
				isOpen={isOpen}
				onDone={() => {
					void onOpenClick();
				}}
				onCancel={() => resolve?.('canceled')}
				title="Load volumes & surfaces"
				doneButtonLabel={projectState === undefined ? 'Open' : 'Update'}
				icon={
					<ArrowUpTrayIcon className="h-8 w-8 shrink-0 text-gray-500"></ArrowUpTrayIcon>
				}
			>
				{projectFiles !== undefined &&
				setProjectFiles !== undefined &&
				setProjectName !== undefined &&
				resolve !== undefined &&
				reject !== undefined ? (
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
				) : (
					<></>
				)}
			</DialogFrame>
		</>
	);
};
