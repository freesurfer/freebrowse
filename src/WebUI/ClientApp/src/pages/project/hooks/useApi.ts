import { useApiOverlay } from '@/hooks/useApiOverlay';
import { useApiProject } from '@/hooks/useApiProject';
import { useApiSurface } from '@/hooks/useApiSurface';
import { useApiVolume } from '@/hooks/useApiVolume';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { useEffect, useState } from 'react';

/**
 * custom hook to handle all the communication to the backend
 * LISTENS the projectState changes and PUSHES all updates to the backend
 * - fetch data when site has been loaded
 * - update backend state when the project state has changed
 */
export const useApi = (
	projectId: string | undefined,
	projectState: ProjectState | undefined
): { initialState: ProjectState | undefined } => {
	/**
	 * keeps the last updated state to have something to compare to
	 */
	const [lastUpload, setLastUpload] = useState<ProjectState>();

	/**
	 * provides the initial project state according to the project fetch request
	 */
	const [initialState, setInitialState] = useState<ProjectState>();

	const apiProject = useApiProject();
	const apiVolume = useApiVolume();
	const apiSurface = useApiSurface();
	const apiOverlay = useApiOverlay();

	useEffect(() => {
		if (projectId === undefined) return;
		if (projectState !== undefined) return;
		if (lastUpload !== undefined && projectState === lastUpload) return;

		const fetchProject = async (): Promise<void> => {
			try {
				const backendState = await apiProject.get(projectId);
				const initialProjectState = new ProjectState({ backendState }, false);
				setInitialState(initialProjectState);
				setLastUpload(initialProjectState);
			} catch (error) {
				console.error('failed to fetch project', error);
			}
		};

		void fetchProject();
	}, [projectId, lastUpload, setLastUpload, projectState, apiProject]);

	useEffect(() => {
		/**
		 * detect updates in the project state and upload increments to the backend
		 */
		const uploadToBackend = async (): Promise<void> => {
			if (projectState === undefined) return;
			if (!projectState.upload) return;
			if (projectState === lastUpload) return;

			if (
				lastUpload === undefined ||
				projectState.files.cloudVolumes !== lastUpload.files.cloudVolumes
			) {
				await apiVolume.edit(
					projectState.files.cloudVolumes,
					lastUpload?.files.cloudVolumes
				);
			}

			if (
				lastUpload === undefined ||
				projectState.files.surfaces !== lastUpload.files.cloudSurfaces
			) {
				await apiSurface.edit(
					projectState.files.cloudSurfaces,
					lastUpload?.files.cloudSurfaces
				);

				for (const cloudSurface of projectState.files.cloudSurfaces) {
					if (cloudSurface.overlayFile === undefined) continue;
					if (!(cloudSurface.overlayFile instanceof LocalOverlayFile)) continue;
					if (
						lastUpload?.files.cloudSurfaces.find(
							(lastSurfaceFile) => lastSurfaceFile === cloudSurface
						) !== undefined
					)
						continue;
					await apiOverlay.create(cloudSurface.id, cloudSurface.overlayFile);
				}
			}
		};

		void uploadToBackend();
		setLastUpload(projectState);
	}, [
		projectState,
		lastUpload,
		setLastUpload,
		apiSurface,
		apiVolume,
		apiOverlay,
	]);

	return { initialState };
};
