import { useApiAnnotation } from '@/hooks/useApiAnnotation';
import { useApiOverlay } from '@/hooks/useApiOverlay';
import { useApiProject } from '@/hooks/useApiProject';
import { useApiSurface } from '@/hooks/useApiSurface';
import { useApiVolume } from '@/hooks/useApiVolume';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import type { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { Dispatch } from 'react';
import { useEffect, useState } from 'react';

const createOverlays = async (
	cloudSurfaces: readonly CloudSurfaceFile[],
	lastCloudSurfaces: readonly CloudSurfaceFile[] | undefined,
	apiOverlay: ReturnType<typeof useApiOverlay>,
	setProjectState: Dispatch<React.SetStateAction<ProjectState | undefined>>
): Promise<void> => {
	for (const cloudSurface of cloudSurfaces) {
		for (const overlayFile of cloudSurface.overlayFiles) {
			if (overlayFile instanceof CloudOverlayFile) {
				const lastSurfaceFile = lastCloudSurfaces?.find(
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

			if (lastCloudSurfaces === undefined) {
				await apiOverlay.create(cloudSurface.id, overlayFile);
				continue;
			}

			if (
				lastCloudSurfaces.find(
					(lastSurfaceFile) => lastSurfaceFile === cloudSurface
				) !== undefined
			)
				continue;

			const lastCloudSurface = lastCloudSurfaces.find(
				(lastSurfaceFile) => lastSurfaceFile.name === cloudSurface.name
			);
			if (lastCloudSurface === undefined) continue;

			if (
				lastCloudSurface.overlayFiles.find(
					(lastOverlayFile) => lastOverlayFile.name === overlayFile.name
				) !== undefined
			)
				continue;

			const response = await apiOverlay.create(cloudSurface.id, overlayFile);
			setProjectState((projectState) =>
				projectState?.fromFiles(
					projectState.files.fromUploadedOverlays(cloudSurface.id, response)
				)
			);
		}
	}
};

const deleteOverlays = async (
	cloudSurfaces: readonly CloudSurfaceFile[],
	lastCloudSurfaces: readonly CloudSurfaceFile[] | undefined,
	apiOverlay: ReturnType<typeof useApiOverlay>
): Promise<void> => {
	if (lastCloudSurfaces === undefined) return;
	for (const lastCloudSurface of lastCloudSurfaces) {
		for (const lastOverlayFile of lastCloudSurface.overlayFiles) {
			if (!(lastOverlayFile instanceof CloudOverlayFile)) continue;
			if (
				cloudSurfaces.find(
					(surfaceFile) => surfaceFile === lastCloudSurface
				) !== undefined
			)
				continue;

			const cloudSurface = cloudSurfaces.find(
				(surfaceFile) => surfaceFile.name === lastCloudSurface.name
			);
			if (cloudSurface === undefined) {
				for (const overlayFileToDelete of lastCloudSurface.overlayFiles) {
					if (!(overlayFileToDelete instanceof CloudOverlayFile)) continue;
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
};

const createAnnotations = async (
	cloudSurfaces: readonly CloudSurfaceFile[],
	lastCloudSurfaces: readonly CloudSurfaceFile[] | undefined,
	apiAnnotation: ReturnType<typeof useApiAnnotation>,
	setProjectState: Dispatch<React.SetStateAction<ProjectState | undefined>>
): Promise<void> => {
	for (const cloudSurface of cloudSurfaces) {
		for (const annotationFile of cloudSurface.annotationFiles) {
			if (annotationFile instanceof CloudAnnotationFile) {
				const lastSurfaceFile = lastCloudSurfaces?.find(
					(surface) => surface === cloudSurface
				);
				if (
					lastSurfaceFile?.annotationFiles.find(
						(annotation) => annotation === annotationFile
					) !== undefined
				)
					continue;
				await apiAnnotation.edit(annotationFile);
				continue;
			}

			if (lastCloudSurfaces === undefined) {
				await apiAnnotation.create(cloudSurface.id, annotationFile);
				continue;
			}

			if (
				lastCloudSurfaces.find(
					(lastSurfaceFile) => lastSurfaceFile === cloudSurface
				) !== undefined
			)
				continue;

			const lastCloudSurface = lastCloudSurfaces.find(
				(lastSurfaceFile) => lastSurfaceFile.name === cloudSurface.name
			);
			if (lastCloudSurface === undefined) continue;

			if (
				lastCloudSurface.annotationFiles.find(
					(lastAnnotationFile) =>
						lastAnnotationFile.name === annotationFile.name
				) !== undefined
			)
				continue;

			const response = await apiAnnotation.create(
				cloudSurface.id,
				annotationFile
			);
			setProjectState((projectState) =>
				projectState?.fromFiles(
					projectState.files.fromUploadedAnnotations(cloudSurface.id, response)
				)
			);
		}
	}
};

const deleteAnnotations = async (
	cloudSurfaces: readonly CloudSurfaceFile[],
	lastCloudSurfaces: readonly CloudSurfaceFile[] | undefined,
	apiAnnotation: ReturnType<typeof useApiAnnotation>
): Promise<void> => {
	if (lastCloudSurfaces === undefined) return;
	for (const lastCloudSurface of lastCloudSurfaces) {
		for (const lastAnnotationFile of lastCloudSurface.annotationFiles) {
			if (!(lastAnnotationFile instanceof CloudAnnotationFile)) continue;
			if (
				cloudSurfaces.find(
					(surfaceFile) => surfaceFile === lastCloudSurface
				) !== undefined
			)
				continue;

			const cloudSurface = cloudSurfaces.find(
				(surfaceFile) => surfaceFile.name === lastCloudSurface.name
			);
			if (cloudSurface === undefined) {
				for (const annotationFileToDelete of lastCloudSurface.annotationFiles) {
					if (!(annotationFileToDelete instanceof CloudAnnotationFile))
						continue;
					await apiAnnotation.remove(annotationFileToDelete.id);
				}
				continue;
			}
			const annotationFile = cloudSurface.annotationFiles.find(
				(annotationFile) => annotationFile.name === lastAnnotationFile.name
			);
			if (annotationFile !== undefined) continue;
			await apiAnnotation.remove(lastAnnotationFile.id);
		}
	}
};

const handleCloudSurface = async (
	cloudSurfaces: readonly CloudSurfaceFile[],
	lastCloudSurfaces: readonly CloudSurfaceFile[] | undefined,
	apiSurface: ReturnType<typeof useApiSurface>,
	apiOverlay: ReturnType<typeof useApiOverlay>,
	apiAnnotation: ReturnType<typeof useApiAnnotation>,
	setProjectState: Dispatch<React.SetStateAction<ProjectState | undefined>>
): Promise<void> => {
	if (lastCloudSurfaces !== undefined && cloudSurfaces === lastCloudSurfaces)
		return;

	await apiSurface.edit(cloudSurfaces, lastCloudSurfaces);

	await createOverlays(
		cloudSurfaces,
		lastCloudSurfaces,
		apiOverlay,
		setProjectState
	);

	await createAnnotations(
		cloudSurfaces,
		lastCloudSurfaces,
		apiAnnotation,
		setProjectState
	);

	await deleteOverlays(cloudSurfaces, lastCloudSurfaces, apiOverlay);

	await deleteAnnotations(cloudSurfaces, lastCloudSurfaces, apiAnnotation);
};

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
	const apiAnnotation = useApiAnnotation();

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
				projectState.name !== lastUpload.name ||
				projectState.meshThicknessOn2D !== lastUpload.meshThicknessOn2D
			) {
				await apiProject.edit(
					projectState.id.toString(),
					projectState.name,
					projectState.meshThicknessOn2D
				);
			}

			if (
				lastUpload === undefined ||
				projectState.files.cloudVolumes !== lastUpload.files.cloudVolumes
			) {
				await apiVolume.edit(
					projectState.files.cloudVolumes,
					lastUpload?.files.cloudVolumes
				);
			}

			await handleCloudSurface(
				projectState.files.cloudSurfaces,
				lastUpload?.files.cloudSurfaces,
				apiSurface,
				apiOverlay,
				apiAnnotation,
				setProjectState
			);

			if (
				lastUpload === undefined ||
				projectState.name !== lastUpload.name ||
				projectState.meshThicknessOn2D !== lastUpload.meshThicknessOn2D ||
				projectState.files.cloudVolumes !== lastUpload.files.cloudVolumes ||
				projectState.files.cloudSurfaces !== lastUpload.files.cloudSurfaces
			) {
				setLastUpload(projectState);
			}
		};

		void uploadToBackend();
	}, [
		projectState,
		lastUpload,
		setLastUpload,
		apiSurface,
		apiVolume,
		apiOverlay,
		apiAnnotation,
		setProjectState,
		apiProject,
	]);

	return { initialState };
};
