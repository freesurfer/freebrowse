import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import {
	type Niivue,
	type NVMeshFromUrlOptions,
	type NVMeshLayer,
	NVMesh,
} from '@niivue/niivue';
import type { Dispatch } from 'react';

/**
 * handles surfaces and point sets, since both are getting treated as meshes
 */
export const niivueHandleMeshesUpdate = async (
	prev: ProjectFiles | undefined,
	next: ProjectFiles,
	niivue: Niivue,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
): Promise<boolean> => {
	if (
		prev !== undefined &&
		prev.surfaces === next.surfaces &&
		prev.pointSets === next.pointSets
	)
		return false;

	let hasChanged = false;

	const initMeshes = async (): Promise<boolean> => {
		if (prev !== undefined) return false;

		const putNiivueRefToFile = (): void => {
			setProjectState((projectState) => {
				if (projectState === undefined) return projectState;
				let tmpProjectState = projectState;
				for (const volume of next.surfaces) {
					if (volume.niivueRef !== undefined) continue;

					const niivueSurface = niivue.meshes.find(
						(niivueSurface) => niivueSurface.name === volume.name
					);
					if (niivueSurface === undefined) continue;
					tmpProjectState = tmpProjectState?.fromFileUpdate(
						volume,
						{ niivueRef: niivueSurface },
						true
					);
				}
				return tmpProjectState;
			});
		};

		const passMeshesToNiivue = async (): Promise<void> => {
			await niivue.loadMeshes(
				next.cloudSurfaces
					.filter((file) => file.isChecked)
					.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
					.map((file): NVMeshFromUrlOptions => {
						const layers = [...file.overlayFiles, ...file.annotationFiles]
							?.filter(
								(file): file is CloudOverlayFile | CloudAnnotationFile =>
									file instanceof CloudOverlayFile ||
									file instanceof CloudAnnotationFile
							)
							.filter((file) => file.isActive)
							.map(
								(file): NVMeshLayer => ({
									name: file.name,
									url: file.url,
									cal_min: 0.5,
									cal_max: 5.5,
									useNegativeCmap: true,
									opacity: 0.7,
								})
							);
						return {
							url: file.url,
							name: file.name,
							rgba255: NiivueWrapper.hexToRGBA(file.color),
							layers,
						};
					})
			);
		};

		try {
			await passMeshesToNiivue();
			putNiivueRefToFile();
		} catch (error) {
			// probably we can just ignore that warning
			console.warn(error);
		}

		// it updates the diagram already, so no need to render the canvas again
		return false;
	};

	const remove = (): boolean => {
		let hasChanged = false;
		for (const niivueSurface of niivue.meshes) {
			if (
				!next.cloudSurfaces.some(
					(cloudSurface) =>
						cloudSurface.isChecked && cloudSurface.name === niivueSurface.name
				) &&
				!next.pointSets.some(
					(file) => file.isChecked && file.niivueRef === niivueSurface
				)
			) {
				// files that are contained in niivue, but not in the project files
				// delete them from niivue
				niivue.setMesh(niivueSurface, -1);
				hasChanged = true;
			}
		}
		return hasChanged;
	};

	const add = async (): Promise<boolean> => {
		let hasChanged = false;

		for (const surface of next.cloudSurfaces) {
			if (!surface.isChecked) continue;
			if (
				niivue.meshes.some(
					(niivueSurface) => niivueSurface.name === surface.name
				)
			)
				continue;

			// files that are contained in the project files, but not in niivue
			// add them to niivue
			if (surface.niivueRef !== undefined) {
				niivue.addMesh(surface.niivueRef);
				hasChanged = true;
				continue;
			}
			const niivueSurface = await niivue.addMeshFromUrl({
				url: surface.url,
				name: surface.name,
				rgba255: NiivueWrapper.hexToRGBA(surface.color),
			});
			setProjectState((projectState) =>
				projectState?.fromFileUpdate(
					surface,
					{ niivueRef: niivueSurface },
					false
				)
			);
		}

		return hasChanged;
	};

	const updatePointSetData = async (): Promise<boolean> => {
		let hasChanged = false;
		for (const pointSet of next.cloudPointSets) {
			if (prev === undefined) continue;
			if (
				prev.cloudPointSets.some(
					(file) =>
						pointSet.id === file.id &&
						pointSet.data === file.data &&
						pointSet.isChecked === file.isChecked
				)
			)
				continue;

			if (
				pointSet.niivueRef !== undefined &&
				niivue.meshes.some((niivueMesh) => niivueMesh === pointSet.niivueRef)
			) {
				niivue.setMesh(pointSet.niivueRef, -1);
			}

			if (
				!pointSet.isChecked ||
				pointSet.data?.points === undefined ||
				pointSet.data.points.length === 0
			)
				continue;

			const niivueSurface = await NVMesh.loadConnectomeFromFreeSurfer(
				pointSet.data,
				niivue.gl,
				pointSet.name,
				'',
				1.0,
				true
			);
			niivue.addMesh(niivueSurface);
			niivueSurface.updateMesh(niivue.gl);
			hasChanged = true;

			setProjectState((projectState) =>
				projectState?.fromFileUpdate(
					pointSet,
					{ niivueRef: niivueSurface },
					false
				)
			);
		}
		return hasChanged;
	};

	const propagateProperties = async (): Promise<boolean> => {
		const updateSurfaceOrder = (niivueSurface: NVMesh, order: number): void => {
			if (niivue.getMeshIndexByID(niivueSurface.id) === order) return;
			niivue.setMesh(niivueSurface, order);
		};

		const updateSurfaceOverlayAndAnnotation = async (
			surfaceFile: SurfaceFile,
			niivueSurface: NVMesh
		): Promise<void> => {
			const getActiveCascadingFile = (
				surfaceFile: SurfaceFile
			): CloudOverlayFile | CloudAnnotationFile | undefined => {
				if (!(surfaceFile instanceof CloudSurfaceFile)) return undefined;
				const activeFile = [
					...surfaceFile.overlayFiles,
					...surfaceFile.annotationFiles,
				].find((file) => file.isActive);
				if (activeFile === undefined) return;
				if (!(activeFile instanceof CloudOverlayFile)) return undefined;
				return activeFile;
			};

			const activeFile = getActiveCascadingFile(surfaceFile);
			if (activeFile === undefined) {
				niivueSurface.layers = [];
				niivueSurface.updateMesh(niivue.gl);
				return;
			}

			// necessary if something wents wrong to clean the state from before
			niivueSurface.layers = [];
			await NVMesh.loadLayer(
				{
					name: activeFile.name,
					url: activeFile.url,
					cal_min: 0.5,
					cal_max: 5.5,
					useNegativeCmap: true,
					opacity: 0.7,
				},
				niivueSurface
			);
			niivueSurface.updateMesh(niivue.gl);
		};

		const updateSurfaceColor = (
			niivueSurface: NVMesh,
			surfaceFile: SurfaceFile
		): void => {
			const newRgba = NiivueWrapper.hexToRGBA(surfaceFile.color);
			if (NiivueWrapper.compareRgba(niivueSurface.rgba255, newRgba)) return;

			const index = niivue.getMeshIndexByID(niivueSurface.id);
			if (index < 0) {
				return;
			}

			niivue.meshes[index]?.setProperty('rgba255', newRgba, niivue.gl);
			// this.niivue.setMeshProperty(
			// 	this.niivue.getMeshIndexByID(niivueSurface.id),
			// 	'rgba255',
			// 	newRgba
			// );
		};

		/**
		 * needed to compute order of visible files only
		 */
		let tmpOrder = 0;
		let hasChanged = false;

		const surfaceFiles = next.surfaces
			.filter((surface) => surface.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

		for (const surfaceFile of surfaceFiles) {
			if (surfaceFile.niivueRef === undefined) {
				console.warn('no niivue surface for given file', surfaceFile.name);
				continue;
			}

			updateSurfaceColor(surfaceFile.niivueRef, surfaceFile);
			updateSurfaceOrder(surfaceFile.niivueRef, tmpOrder++);
			await updateSurfaceOverlayAndAnnotation(
				surfaceFile,
				surfaceFile.niivueRef
			);
			hasChanged = true;
		}

		return hasChanged;
	};

	hasChanged ||= await initMeshes();
	hasChanged ||= remove();
	hasChanged ||= await add();
	hasChanged ||= await updatePointSetData();
	hasChanged ||= await propagateProperties();
	return hasChanged;
};
