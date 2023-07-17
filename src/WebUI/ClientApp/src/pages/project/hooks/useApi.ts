import { useApiAnnotation } from '@/hooks/useApiAnnotation';
import { useApiOverlay } from '@/hooks/useApiOverlay';
import { useApiPointSet } from '@/hooks/useApiPointSet';
import { useApiProject } from '@/hooks/useApiProject';
import { useApiSurface } from '@/hooks/useApiSurface';
import { useApiVolume } from '@/hooks/useApiVolume';
import { useQueueDebounced } from '@/pages/project/hooks/api/useQueueDebounced';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import type { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { Dispatch } from 'react';
import { useCallback, useEffect, useState } from 'react';

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
	 * provides the initial project state according to the project fetch request
	 */
	const [initialState, setInitialState] = useState<ProjectState>();

	/**
	 * reload project on changed projectId
	 */
	const [currentProjectId, setCurrentProjectId] = useState<
		string | undefined
	>();

	const apiProject = useApiProject();
	const apiVolume = useApiVolume();
	const apiSurface = useApiSurface();
	const apiPointSet = useApiPointSet();
	const apiOverlay = useApiOverlay();
	const apiAnnotation = useApiAnnotation();

	useEffect(() => {
		if (projectId === undefined) return;
		if (projectState !== undefined && projectId === currentProjectId) return;

		const fetchProject = async (): Promise<void> => {
			try {
				const initialProjectState = await apiProject.get(
					projectId,
					apiPointSet
				);
				setCurrentProjectId(projectId);
				setInitialState(initialProjectState);
			} catch (error) {
				console.error('failed to fetch project', error);
			}
		};

		void fetchProject();
	}, [
		projectId,
		projectState,
		apiProject,
		apiPointSet,
		setCurrentProjectId,
		currentProjectId,
	]);

	useQueueDebounced(
		projectState,
		true,
		useCallback(
			async (previousState, nextState) => {
				if (
					previousState === undefined ||
					nextState.name !== previousState.name ||
					nextState.meshThicknessOn2D !== previousState.meshThicknessOn2D
				) {
					await apiProject.edit(
						nextState.id.toString(),
						nextState.name,
						nextState.meshThicknessOn2D
					);
				}

				if (
					previousState === undefined ||
					nextState.files.cloudVolumes !== previousState.files.cloudVolumes
				) {
					await apiVolume.edit(
						nextState.files.cloudVolumes,
						previousState?.files.cloudVolumes
					);
				}

				await handleCloudSurface(
					nextState.files.cloudSurfaces,
					previousState?.files.cloudSurfaces,
					apiSurface,
					apiOverlay,
					apiAnnotation,
					setProjectState
				);

				// handle new point sets
				if (nextState.files.cachePointSets.length > 0) {
					const projectResponse = await apiPointSet.create(
						nextState.id,
						nextState.files.cachePointSets
					);

					const cloudFiles = await Promise.all(
						projectResponse.map(
							async (dto) =>
								await apiPointSet.get(
									dto,
									nextState.files.cachePointSets.find(
										(file) => file.name === dto.fileName
									)
								)
						)
					);

					setProjectState((projectState) => {
						if (projectState === undefined) return undefined;
						return new ProjectState(
							{
								projectState,
								files: new ProjectFiles({
									projectFiles: projectState.files,
									cachePointSets: [],
									cloudPointSets: [
										...projectState.files.cloudPointSets,
										...cloudFiles,
									],
								}),
							},
							false
						);
					});
				}

				// update point set
				if (
					previousState !== undefined &&
					previousState.files.cloudPointSets !== nextState.files.cloudPointSets
				) {
					for (const cloudPointSetFile of nextState.files.cloudPointSets) {
						if (
							!previousState.files.cloudPointSets.some(
								(file) => file.id === cloudPointSetFile.id
							)
						)
							continue;

						if (
							previousState.files.cloudPointSets.some(
								(file) =>
									file.id === cloudPointSetFile.id &&
									file.data === cloudPointSetFile.data &&
									file.isChecked === cloudPointSetFile.isChecked &&
									file.order === cloudPointSetFile.order
							)
						)
							continue;

						await apiPointSet.edit(cloudPointSetFile);
					}
				}

				if (
					previousState !== undefined &&
					previousState.files.cloudPointSets !== nextState.files.cloudPointSets
				) {
					for (const file of previousState.files.cloudPointSets.filter(
						(prevFile) =>
							!nextState.files.cloudPointSets.some(
								(nextFile) => nextFile.id === prevFile.id
							)
					)) {
						await apiPointSet.remove(file);
					}
				}
			},
			[
				apiProject,
				apiSurface,
				apiVolume,
				apiPointSet,
				apiOverlay,
				apiAnnotation,
				setProjectState,
			]
		)
	);

	return { initialState };
};
