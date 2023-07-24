import {
	type INiivueCache,
	NiivueWrapper,
} from '@/pages/project/NiivueWrapper';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
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

/**
 * handles surfaces and point sets, since both are getting treated as meshes
 */
export const niivueHandleMeshesUpdate = async (
	prev: ProjectFiles | undefined,
	next: ProjectFiles,
	niivue: Niivue,
	cache: INiivueCache
): Promise<boolean> => {
	if (
		prev !== undefined &&
		prev.surfaces === next.surfaces &&
		prev.pointSets === next.pointSets
	)
		return false;

	const initMeshes = async (): Promise<boolean> => {
		if (prev !== undefined) return false;

		const putNiivueRefToFile = (): void => {
			for (const surface of [...next.surfaces.cloud, ...next.surfaces.local]) {
				if (cache.surfaces.has(surface.name)) continue;

				const niivueSurface = niivue.meshes.find(
					(niivueSurface) => niivueSurface.name === surface.name
				);
				if (niivueSurface === undefined) continue;
				cache.surfaces.set(surface.name, niivueSurface);
			}
		};

		const passMeshesToNiivue = async (): Promise<void> => {
			await niivue.loadMeshes(
				next.surfaces.cloud
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
		for (const niivueMesh of niivue.meshes) {
			if (
				!next.surfaces.cloud.some(
					(cloudSurface) =>
						cloudSurface.isChecked &&
						cache.surfaces.get(cloudSurface.name) === niivueMesh
				) &&
				![
					...next.pointSets.cache,
					...next.pointSets.local,
					...next.pointSets.cloud,
				].some(
					(file) =>
						file.isChecked && cache.pointSets.get(file.name) === niivueMesh
				)
			) {
				// files that are contained in niivue, but not in the project files
				// delete them from niivue
				niivue.setMesh(niivueMesh, -1);
				hasChanged = true;
			}
		}
		return hasChanged;
	};

	const add = async (): Promise<boolean> => {
		let hasChanged = false;

		for (const surface of next.surfaces.cloud) {
			if (!surface.isChecked) continue;
			if (
				niivue.meshes.some(
					(niivueSurface) => niivueSurface.name === surface.name
				)
			)
				continue;

			// files that are contained in the project files, but not in niivue
			// add them to niivue
			const niivueMesh = cache.surfaces.get(surface.name);
			if (niivueMesh !== undefined) {
				niivue.addMesh(niivueMesh);
				hasChanged = true;
				continue;
			}
			const niivueSurface = await niivue.addMeshFromUrl({
				url: surface.url,
				name: surface.name,
				rgba255: NiivueWrapper.hexToRGBA(surface.color),
			});
			cache.surfaces.set(surface.name, niivueSurface);
		}

		return hasChanged;
	};

	const updatePointSetData = async (): Promise<boolean> => {
		let hasChanged = false;
		for (const pointSet of next.pointSets.cloud) {
			if (prev === undefined) continue;
			if (
				prev.pointSets.cloud.some(
					(file) =>
						pointSet.id === file.id &&
						pointSet.data === file.data &&
						pointSet.isChecked === file.isChecked
				)
			)
				continue;

			const niivuePointSet = cache.pointSets.get(pointSet.name);
			if (
				niivuePointSet !== undefined &&
				niivue.meshes.some((niivueMesh) => niivueMesh === niivuePointSet)
			) {
				niivue.setMesh(niivuePointSet, -1);
			}

			if (
				!pointSet.isChecked ||
				pointSet.data?.points === undefined ||
				pointSet.data.points.length === 0
			)
				continue;

			const niivueMesh = await NVMesh.loadConnectomeFromFreeSurfer(
				pointSet.data,
				niivue.gl,
				pointSet.name,
				'',
				1.0,
				true
			);
			niivue.addMesh(niivueMesh);
			niivueMesh.updateMesh(niivue.gl);
			hasChanged = true;

			cache.pointSets.set(pointSet.name, niivueMesh);
		}
		return hasChanged;
	};

	const propagateProperties = async (): Promise<boolean> => {
		const updateSurfaceOrder = (
			niivueSurface: NVMesh,
			order: number
		): boolean => {
			if (niivue.getMeshIndexByID(niivueSurface.id) === order) return false;
			niivue.setMesh(niivueSurface, order);
			// setMesh calls the render method already
			return false;
		};

		const updateSurfaceOverlayAndAnnotation = async (
			surfaceFile: SurfaceFile,
			niivueSurface: NVMesh
		): Promise<boolean> => {
			if (
				[...(prev?.surfaces.cloud ?? []), ...(prev?.surfaces.local ?? [])].some(
					(file) => file === surfaceFile
				)
			)
				return false;

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
				return true;
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
			return true;
		};

		const updateSurfaceColor = (
			niivueSurface: NVMesh,
			surfaceFile: SurfaceFile
		): boolean => {
			const newRgba = NiivueWrapper.hexToRGBA(surfaceFile.color);
			if (NiivueWrapper.compareRgba(niivueSurface.rgba255, newRgba))
				return false;

			const index = niivue.getMeshIndexByID(niivueSurface.id);
			if (index < 0) {
				return false;
			}

			niivue.meshes[index]?.setProperty('rgba255', newRgba, niivue.gl);
			// this.niivue.setMeshProperty(
			// 	this.niivue.getMeshIndexByID(niivueSurface.id),
			// 	'rgba255',
			// 	newRgba
			// );
			return true;
		};

		/**
		 * needed to compute order of visible files only
		 */
		let tmpOrder = 0;
		let hasChanged = false;

		const surfaceFiles = [...next.surfaces.cloud, ...next.surfaces.local]
			.filter((surface) => surface.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

		for (const surfaceFile of surfaceFiles) {
			const niivueSurface = cache.surfaces.get(surfaceFile.name);
			if (niivueSurface === undefined) {
				console.warn('no niivue surface for given file', surfaceFile.name);
				continue;
			}

			const renderForColor = updateSurfaceColor(niivueSurface, surfaceFile);
			const renderForOrder = updateSurfaceOrder(niivueSurface, tmpOrder++);
			const renderForOverlayAndAnnotation =
				await updateSurfaceOverlayAndAnnotation(surfaceFile, niivueSurface);

			hasChanged =
				hasChanged ||
				renderForColor ||
				renderForOrder ||
				renderForOverlayAndAnnotation;
		}

		return hasChanged;
	};

	const cleanCache = (): void => {
		for (const key of cache.surfaces.keys()) {
			if (
				![...next.surfaces.cloud, ...next.surfaces.local].some(
					(file) => file.name === key
				)
			)
				cache.surfaces.delete(key);
		}

		for (const key of cache.pointSets.keys()) {
			if (
				![
					...next.pointSets.cache,
					...next.pointSets.cloud,
					...next.pointSets.local,
				].some((file) => file.name === key)
			)
				cache.surfaces.delete(key);
		}
	};

	const renderForInit = await initMeshes();
	const renderForRemove = remove();
	const renderForAdd = await add();
	const renderForPointSet = await updatePointSetData();
	const renderForProperties = await propagateProperties();
	cleanCache();

	return (
		renderForInit ||
		renderForRemove ||
		renderForAdd ||
		renderForPointSet ||
		renderForProperties
	);
};
