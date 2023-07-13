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

export const niivueHandleSurfaceUpdate = async (
	prev: ProjectFiles | undefined,
	next: ProjectFiles,
	niivue: Niivue,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
): Promise<boolean> => {
	if (prev !== undefined && prev.surfaces === next.surfaces) return false;

	let hasChanged = false;

	const putNiivueRefToFile = (): void => {
		for (const surface of next.surfaces) {
			if (surface.niivueRef !== undefined) continue;
			const niivueSurface = niivue.meshes.find(
				(niivueSurface) => niivueSurface.name === surface.name
			);
			if (niivueSurface === undefined) continue;
			setProjectState((projectState) =>
				projectState?.fromFileUpdate(
					surface,
					{ niivueRef: niivueSurface },
					true
				)
			);
		}
	};

	const initSurfaces = async (): Promise<boolean> => {
		if (prev !== undefined) return false;

		const passSurfacesToNiivue = async (): Promise<void> => {
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
			await passSurfacesToNiivue();
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
				next.cloudSurfaces.find(
					(cloudSurface) =>
						cloudSurface.isChecked && cloudSurface.name === niivueSurface.name
				) === undefined
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
		for (const cloudSurface of next.cloudSurfaces) {
			if (!cloudSurface.isChecked) continue;
			if (
				niivue.meshes.find(
					(niivueSurface) => niivueSurface.name === cloudSurface.name
				) !== undefined
			)
				continue;

			// files that are contained in the project files, but not in niivue
			// add them to niivue
			if (cloudSurface.niivueRef !== undefined) {
				niivue.addMesh(cloudSurface.niivueRef);
				hasChanged = true;
				continue;
			}
			const niivueSurface = await niivue.addMeshFromUrl({
				url: cloudSurface.url,
				name: cloudSurface.name,
				rgba255: NiivueWrapper.hexToRGBA(cloudSurface.color),
			});
			setProjectState((projectState) =>
				projectState?.fromFileUpdate(
					cloudSurface,
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

	hasChanged ||= await initSurfaces();
	hasChanged ||= remove();
	hasChanged ||= await add();
	hasChanged ||= await propagateProperties();
	return hasChanged;
};
