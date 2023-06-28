import { useApiOverlay } from '@/hooks/useApiOverlay';
import { useApiProject } from '@/hooks/useApiProject';
import { useApiSurface } from '@/hooks/useApiSurface';
import { useApiVolume } from '@/hooks/useApiVolume';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import type { Dispatch } from 'react';
import { useEffect, useState } from 'react';

/**
 * custom hook to handle all the communication to the backend
 * LISTENS the projectState changes and PUSHES all updates to the backend
 * - fetch data when site has been loaded
 * - update backend state when the project state has changed
 */
export const useApi = (
	projectId: string | undefined,
	setProjectState: Dispatch<React.SetStateAction<ProjectState | undefined>>,
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
					for (const overlayFile of cloudSurface.overlayFiles) {
						if (overlayFile instanceof CloudOverlayFile) {
							const lastSurfaceFile = lastUpload?.files.cloudSurfaces.find(
								(surface) => surface === cloudSurface
							);
							if (
								lastSurfaceFile?.overlayFiles.find(
									(overlay) => overlay === overlayFile
								) !== undefined
							)
								continue;
							await apiOverlay.edit(overlayFile);
							continue;
						}

						if (lastUpload === undefined) {
							await apiOverlay.create(cloudSurface.id, overlayFile);
							continue;
						}

						if (
							lastUpload.files.cloudSurfaces.find(
								(lastSurfaceFile) => lastSurfaceFile === cloudSurface
							) !== undefined
						)
							continue;

						const lastCloudSurface = lastUpload.files.cloudSurfaces.find(
							(lastSurfaceFile) => lastSurfaceFile.name === cloudSurface.name
						);
						if (lastCloudSurface === undefined) continue;

						if (
							lastCloudSurface.overlayFiles.find(
								(lastOverlayFile) => lastOverlayFile.name === overlayFile.name
							) !== undefined
						)
							continue;

						const response = await apiOverlay.create(
							cloudSurface.id,
							overlayFile
						);
						setProjectState((projectState) =>
							projectState?.fromFiles(
								projectState.files.fromUploadedOverlays(
									cloudSurface.id,
									response
								)
							)
						);
					}
				}

				if (lastUpload === undefined) return;
				for (const lastCloudSurface of lastUpload.files.cloudSurfaces) {
					for (const lastOverlayFile of lastCloudSurface.overlayFiles) {
						if (!(lastOverlayFile instanceof CloudOverlayFile)) continue;
						if (
							projectState.files.cloudSurfaces.find(
								(surfaceFile) => surfaceFile === lastCloudSurface
							) !== undefined
						)
							continue;

						const cloudSurface = projectState.files.cloudSurfaces.find(
							(surfaceFile) => surfaceFile.name === lastCloudSurface.name
						);
						if (cloudSurface === undefined) {
							for (const overlayFileToDelete of lastCloudSurface.overlayFiles) {
								if (!(overlayFileToDelete instanceof CloudOverlayFile))
									continue;
								await apiOverlay.remove(overlayFileToDelete.id);
							}
							continue;
						}
						const overlayFile = cloudSurface.overlayFiles.find(
							(overlayFile) => overlayFile.name === lastOverlayFile.name
						);
						if (overlayFile !== undefined) continue;
						await apiOverlay.remove(lastOverlayFile.id);
					}
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
		setProjectState,
	]);

	return { initialState };
};
