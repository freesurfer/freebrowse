import {
	EditSurfaceCommand,
	EditVolumeCommand,
	ProjectsClient,
	SurfaceClient,
	VolumeClient,
} from '@/generated/web-api-client';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { getApiUrl } from '@/utils';
import { useEffect, useState } from 'react';

/**
 * custom hook to handle all the communication to the backend
 * - fetch data when site has been loaded
 * - update backend state when the project state has changed
 */
export const useApi = (
	projectId: string | undefined,
	projectState: ProjectState | undefined
): { initialState: ProjectState | undefined } => {
	const [lastUpload, setLastUpload] = useState<ProjectState>();
	const [initialState, setInitialState] = useState<ProjectState>();

	useEffect(() => {
		if (projectId === undefined) return;
		if (projectState !== undefined) return;
		if (lastUpload !== undefined && projectState === lastUpload) return;

		const fetchData = async (): Promise<void> => {
			const client = new ProjectsClient(getApiUrl());
			if (projectId === undefined) {
				console.error('no project id given');
				return;
			}

			const backendState = await client.getProject(Number(projectId));
			const initialProjectState = new ProjectState({ backendState }, false);
			setInitialState(initialProjectState);
			setLastUpload(initialProjectState);
		};

		void fetchData();
	}, [projectId, lastUpload, setLastUpload, projectState]);

	useEffect(() => {
		const uploadToBackend = async (): Promise<void> => {
			if (projectState === undefined) return;
			if (!projectState.upload) return;
			if (projectState === lastUpload) return;

			if (
				lastUpload === undefined ||
				projectState.files.cloudVolumes !== lastUpload.files.cloudVolumes
			) {
				const client = new VolumeClient(getApiUrl());
				for (const cloudVolume of projectState.files.cloudVolumes) {
					if (
						lastUpload?.files.cloudVolumes.find(
							(lastVolumeFile) => lastVolumeFile === cloudVolume
						) !== undefined
					)
						continue;

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

			if (
				lastUpload === undefined ||
				projectState.files.surfaces !== lastUpload.files.cloudSurfaces
			) {
				const client = new SurfaceClient(getApiUrl());
				for (const cloudSurface of projectState.files.cloudSurfaces) {
					if (
						lastUpload?.files.cloudSurfaces.find(
							(lastSurfaceFile) => lastSurfaceFile === cloudSurface
						) !== undefined
					)
						continue;

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

		void uploadToBackend();
		setLastUpload(projectState);
	}, [projectState, lastUpload, setLastUpload]);

	return { initialState };
};
