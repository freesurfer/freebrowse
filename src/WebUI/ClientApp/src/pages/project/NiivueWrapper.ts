import lookUpTable from './ColorMaps/LookUpTable.json';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ViewSettings } from '@/pages/project/models/ViewSettings';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { SurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/VolumeFile';
import { Niivue, NVMesh } from '@niivue/niivue';
import type {
	LocationData,
	NVImage,
	NVMeshFromUrlOptions,
	NVMeshLayer,
} from '@niivue/niivue';

/**
 * this class is a wrapper for the niivue library reference
 * to prevent access to a not existing reference (by not catching accesses to undefined or guards everywhere)
 * and to have the logic in a separate place to not overload the project component
 */
export class NiivueWrapper {
	public readonly niivue = new Niivue({
		show3Dcrosshair: false,
		onLocationChange: (location) => this.setLocation(location),
		dragAndDropEnabled: false,
		dragMode: 3,
		meshThicknessOn2D: 0.5,
		isHighResolutionCapable: false,
		isOrientCube: false,
		enableBorderHighlight: true,
		displaySliceInfo: true,
	});

	private hooveredView = 0;
	private nextState: ProjectState | undefined = undefined;
	private viewSettings: ViewSettings | undefined = undefined;
	private isRunning = false;
	private readonly volumeCache = new Map<string, NVImage>();
	private readonly surfaceCache = new Map<string, NVMesh>();

	constructor(
		canvasRef: HTMLCanvasElement,
		private readonly setLocation: (
			value: React.SetStateAction<LocationData | undefined>
		) => void
	) {
		this.niivue.addColormap('LookupTable', lookUpTable);
		void this.niivue.attachToCanvas(canvasRef);
	}

	public next(
		projectState: ProjectState,
		viewSettings: ViewSettings | undefined
	): void {
		this.nextState = projectState;
		this.viewSettings = viewSettings;
		void this.propagateNextState();
	}

	/**
	 * propagate only the next state to the niivue library
	 * wait until it has been done
	 * compute the next state if there has been a new one since then
	 */
	private async propagateNextState(): Promise<void> {
		// stop if running
		if (this.isRunning) return;

		// stop if there is no next step
		if (this.nextState === undefined) return;

		// set lock
		this.isRunning = true;

		// cache compute state
		const currentState = this.nextState;
		this.nextState = undefined;

		const viewSettings = this.viewSettings;
		this.viewSettings = undefined;

		await this.propagateState(currentState, viewSettings);

		// clear lock
		this.isRunning = false;

		// retrigger method
		await this.propagateNextState();
	}

	/**
	 * propagate the given project state to the niivue library
	 */
	private async propagateState(
		projectState: ProjectState,
		viewSettings: ViewSettings | undefined
	): Promise<void> {
		const files = projectState.files;
		if (this.volumeCache.size === 0 && this.surfaceCache.size === 0) {
			// if there are no files cached yet, start from scratch
			await this.loadInitialState(files, viewSettings);
			this.fillReferences(files);
			return;
		}

		if (
			NiivueWrapper.isRemovedOrAdded(
				files,
				this.niivue.volumes,
				this.niivue.meshes
			)
		) {
			// if there are files added or remove
			// we need to remove or add files
			await this.addOrRemoveFiles(files);
			this.niivue.setSliceType(3);
			this.niivue.updateGLVolume();
			return;
		}

		// otherwise we only need to update the options
		// this.niivue.setMeshThicknessOn2D(projectState.meshThicknessOn2D ?? 0.5);
		this.niivue.opts.meshThicknessOn2D = projectState.meshThicknessOn2D ?? 0.5;
		await this.updateFileProperties(files);
		this.cleanUpCache(files);
		this.niivue.updateGLVolume();
	}

	/**
	 * remove all references from cache, which are not contained in the project files state
	 */
	private cleanUpCache(files: ProjectFiles): void {
		for (const cachedVolume of this.volumeCache.values()) {
			if (
				files.cloudVolumes.find(
					(cloudVolume) => cloudVolume.name === cachedVolume.name
				) !== undefined
			)
				continue;
			this.volumeCache.delete(cachedVolume.name);
		}

		for (const cachedSurface of this.surfaceCache.values()) {
			if (
				files.cloudSurfaces.find(
					(cloudSurface) => cloudSurface.name === cachedSurface.name
				) !== undefined
			)
				continue;
			this.surfaceCache.delete(cachedSurface.name);
		}
	}

	private async addOrRemoveFiles(files: ProjectFiles): Promise<void> {
		for (const niivueVolume of this.niivue.volumes) {
			if (
				files.cloudVolumes.find(
					(cloudVolume) =>
						cloudVolume.isChecked && cloudVolume.name === niivueVolume.name
				) === undefined
			) {
				// files that are contained in niivue, but not in the project files
				// delete them from niivue
				this.niivue.setVolume(niivueVolume, -1);
			}
		}

		for (const cloudVolume of files.cloudVolumes) {
			if (!cloudVolume.isChecked) continue;
			if (
				this.niivue.volumes.find(
					(niivueVolume) => niivueVolume.name === cloudVolume.name
				) === undefined
			) {
				// files that are contained in the project files, but not in niivue
				// add them to niivue
				const cachedVolume = this.volumeCache.get(cloudVolume.name);
				if (cachedVolume !== undefined) {
					this.niivue.addVolume(cachedVolume);
					continue;
				}
				const newVolumeToCache = await this.niivue.addVolumeFromUrl({
					url: cloudVolume.url,
					name: cloudVolume.name,
					opacity: cloudVolume.opacity / 100,
					cal_min: cloudVolume.contrastMin,
					cal_max: cloudVolume.contrastMax,
				});
				this.volumeCache.set(newVolumeToCache.name, newVolumeToCache);
			}
		}

		for (const niivueSurface of this.niivue.meshes) {
			if (
				files.cloudSurfaces.find(
					(cloudSurface) =>
						cloudSurface.isChecked && cloudSurface.name === niivueSurface.name
				) === undefined
			) {
				// files that are contained in niivue, but not in the project files
				// delete them from niivue
				this.niivue.setMesh(niivueSurface, -1);
			}
		}

		for (const cloudSurface of files.cloudSurfaces) {
			if (!cloudSurface.isChecked) continue;
			if (
				this.niivue.meshes.find(
					(niivueSurface) => niivueSurface.name === cloudSurface.name
				) === undefined
			) {
				// files that are contained in the project files, but not in niivue
				// add them to niivue
				const cachedSurface = this.surfaceCache.get(cloudSurface.name);
				if (cachedSurface !== undefined) {
					this.niivue.addMesh(cachedSurface);
					continue;
				}
				const newSurfaceToCache = await this.niivue.addMeshFromUrl({
					url: cloudSurface.url,
					name: cloudSurface.name,
					opacity: cloudSurface.opacity / 100,
					rgba255: NiivueWrapper.hexToRGBA(cloudSurface.color),
				});
				this.surfaceCache.set(newSurfaceToCache.name, newSurfaceToCache);
			}
		}
	}

	private async loadInitialState(
		files: ProjectFiles,
		viewSettings: ViewSettings | undefined
	): Promise<void> {
		try {
			await this.niivue.loadVolumes(
				files.cloudVolumes
					.filter((file) => file.isChecked)
					.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
					.map((file) => {
						return {
							url: file.url,
							name: file.name,
							opacity: file.opacity / 100,
							colorMap: file.colorMap ?? 'gray',
							cal_min: file.contrastMin,
							cal_max: file.contrastMax,
						};
					})
			);

			await this.niivue.loadMeshes(
				files.cloudSurfaces
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
							opacity: file.opacity / 100,
							rgba255: NiivueWrapper.hexToRGBA(file.color),
							layers,
						};
					})
			);

			if (viewSettings !== undefined) {
				this.niivue.uiData.pan2Dxyzmm = [
					viewSettings.zoom2dX,
					viewSettings.zoom2dY,
					viewSettings.zoom2dZ,
					viewSettings.zoom2d,
				];
				this.niivue.scene.volScaleMultiplier = viewSettings.zoom3d;
				this.niivue.scene.renderAzimuth = viewSettings.renderAzimuth;
				this.niivue.scene.renderElevation = viewSettings.renderElevation;
				this.navigateToSlice(
					viewSettings.sliceX,
					viewSettings.sliceY,
					viewSettings.sliceZ
				);
			}

			this.niivue.createOnLocationChange();
			this.niivue.updateGLVolume();
		} catch (error) {
			// probably we can just ignore that warning
			console.warn(error);
		}
	}

	/**
	 * compare the niivue state with the ProjectFile state
	 * if files has been added or removed (by names)
	 * the niivue files need only to get updated, if the state has changed
	 */
	static isRemovedOrAdded(
		files: ProjectFiles,
		niivueVolumes: NVImage[],
		niivueSurfaces: NVMesh[]
	): boolean {
		for (const niivueVolume of niivueVolumes) {
			if (
				files.cloudVolumes.find(
					(cloudVolume) =>
						cloudVolume.isChecked && cloudVolume.name === niivueVolume.name
				) === undefined
			)
				return true;
		}

		for (const cloudVolume of files.volumes) {
			if (!cloudVolume.isChecked) continue;
			if (
				niivueVolumes.find(
					(niivueVolume) => niivueVolume.name === cloudVolume.name
				) === undefined
			)
				return true;
		}

		for (const niivueSurface of niivueSurfaces) {
			if (
				files.cloudSurfaces.find(
					(cloudSurface) =>
						cloudSurface.isChecked && cloudSurface.name === niivueSurface.name
				) === undefined
			)
				return true;
		}

		for (const cloudSurface of files.cloudSurfaces) {
			if (!cloudSurface.isChecked) continue;
			if (
				niivueSurfaces.find(
					(niivueSurface) => niivueSurface.name === cloudSurface.name
				) === undefined
			)
				return true;
		}

		return false;
	}

	/**
	 * this method is collecting the references to all added volumes and caches them, if they were loaded already and just got hidden to add them later again
	 */
	private fillReferences(files: ProjectFiles): void {
		for (const volume of files.volumes) {
			if (this.volumeCache.has(volume.name)) continue;
			const niivueVolume = this.niivue.volumes.find(
				(niivueVolume) => niivueVolume.name === volume.name
			);
			if (niivueVolume !== undefined)
				this.volumeCache.set(volume.name, niivueVolume);
		}

		for (const surface of files.surfaces) {
			if (this.surfaceCache.has(surface.name)) continue;
			const niivueSurface = this.niivue.meshes.find(
				(niivueSurface) => niivueSurface.name === surface.name
			);
			if (niivueSurface !== undefined)
				this.surfaceCache.set(surface.name, niivueSurface);
		}
	}

	private async updateFileProperties(files: ProjectFiles): Promise<void> {
		const volumeFiles = files.volumes
			.filter((volume) => volume.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

		/**
		 * needed to compute order of visible files only
		 */
		let tmpOrder = 0;
		for (const volumeFile of volumeFiles) {
			const niivueVolume = this.niivue.volumes.find(
				(niivueVolume) => volumeFile.name === niivueVolume.name
			);

			if (niivueVolume === undefined) {
				console.warn('no niivue volume for given file', volumeFile.name);
				continue;
			}

			this.updateVolumeOrder(niivueVolume, tmpOrder++);
			NiivueWrapper.updateVolumeBrightness(niivueVolume, volumeFile);
			this.updateVolumeColorMap(niivueVolume, volumeFile);
		}

		const surfaceFiles = files.surfaces
			.filter((surface) => surface.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
		tmpOrder = 0;
		for (const surfaceFile of surfaceFiles) {
			const niivueSurface = this.niivue.meshes.find(
				(niivueMesh) => surfaceFile.name === niivueMesh.name
			);

			if (niivueSurface === undefined) {
				console.warn('no niivue volume for given file', surfaceFile.name);
				continue;
			}

			this.updateSurfaceColor(niivueSurface, surfaceFile);
			this.updateSurfaceOrder(niivueSurface, tmpOrder++);
			niivueSurface.opacity = surfaceFile.opacity;
			await this.updateSurfaceOverlayAndAnnotation(surfaceFile, niivueSurface);
		}
	}

	private updateVolumeOrder(niivueVolume: NVImage, order: number): void {
		if (this.niivue.getVolumeIndexByID(niivueVolume.id) === order) return;

		const numberOfLoadedImages = this.niivue.volumes.length;
		if (order > numberOfLoadedImages) {
			return;
		}

		const volIndex = this.niivue.getVolumeIndexByID(niivueVolume.id);
		if (order === 0) {
			this.niivue.volumes.splice(volIndex, 1);
			this.niivue.volumes.unshift(niivueVolume);
			this.niivue.back = this.niivue.volumes[0];
			this.niivue.overlays = this.niivue.volumes.slice(1);
		} else if (order < 0) {
			// -1 to remove a volume
			this.niivue.volumes.splice(
				this.niivue.getVolumeIndexByID(niivueVolume.id),
				1
			);
			// this.volumes = this.overlays
			this.niivue.back = this.niivue.volumes[0];
			if (this.niivue.volumes.length > 1) {
				this.niivue.overlays = this.niivue.volumes.slice(1);
			} else {
				this.niivue.overlays = [];
			}
		} else {
			this.niivue.volumes.splice(volIndex, 1);
			this.niivue.volumes.splice(order, 0, niivueVolume);
			this.niivue.overlays = this.niivue.volumes.slice(1);
			this.niivue.back = this.niivue.volumes[0];
		}
		// this.niivue.setVolume(niivueVolume, order);
	}

	private updateSurfaceOrder(niivueSurface: NVMesh, order: number): void {
		if (this.niivue.getMeshIndexByID(niivueSurface.id) === order) return;
		this.niivue.setMesh(niivueSurface, order);
	}

	private async updateSurfaceOverlayAndAnnotation(
		surfaceFile: SurfaceFile,
		niivueSurface: NVMesh
	): Promise<void> {
		const activeFile = NiivueWrapper.getActiveCascadingFile(surfaceFile);
		if (activeFile === undefined) {
			niivueSurface.layers = [];
			niivueSurface.updateMesh(this.niivue.gl);
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
		niivueSurface.updateMesh(this.niivue.gl);
	}

	private static getActiveCascadingFile(
		surfaceFile: SurfaceFile
	): CloudOverlayFile | CloudAnnotationFile | undefined {
		if (!(surfaceFile instanceof CloudSurfaceFile)) return undefined;
		const activeFile = [
			...surfaceFile.overlayFiles,
			...surfaceFile.annotationFiles,
		].find((file) => file.isActive);
		if (activeFile === undefined) return;
		if (!(activeFile instanceof CloudOverlayFile)) return undefined;
		return activeFile;
	}

	private static updateVolumeBrightness(
		niivueVolume: NVImage,
		volumeFile: VolumeFile
	): void {
		if (
			niivueVolume.opacity === volumeFile.opacity / 100 &&
			niivueVolume.cal_min === volumeFile.contrastMin &&
			niivueVolume.cal_max === volumeFile.contrastMax
		)
			return;

		niivueVolume.opacity = volumeFile.opacity / 100;
		niivueVolume.cal_min = volumeFile.contrastMin;
		niivueVolume.cal_max = volumeFile.contrastMax;
	}

	private updateSurfaceColor(
		niivueSurface: NVMesh,
		surfaceFile: SurfaceFile
	): void {
		const newRgba = NiivueWrapper.hexToRGBA(surfaceFile.color);
		if (NiivueWrapper.compareRgba(niivueSurface.rgba255, newRgba)) return;

		const index = this.niivue.getMeshIndexByID(niivueSurface.id);
		if (index < 0) {
			return;
		}

		this.niivue.meshes[index]?.setProperty('rgba255', newRgba, this.niivue.gl);
		// this.niivue.setMeshProperty(
		// 	this.niivue.getMeshIndexByID(niivueSurface.id),
		// 	'rgba255',
		// 	newRgba
		// );
	}

	static hexToRGBA(hex: string): [number, number, number, number] {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);

		return [r, g, b, 255];
	}

	static compareRgba(
		rgba255: [number, number, number, number],
		rgba: [number, number, number, number]
	): boolean {
		return (
			rgba255[0] === rgba[0] &&
			rgba255[1] === rgba[1] &&
			rgba255[2] === rgba[2] &&
			rgba255[3] === rgba[3]
		);
	}

	private updateVolumeColorMap(
		niivueVolume: NVImage,
		volumeFile: VolumeFile
	): void {
		if (niivueVolume.colorMap === volumeFile.colorMap) return;

		const index = this.niivue.getVolumeIndexByID(niivueVolume.id);
		const volume = this.niivue.volumes[index];
		if (volume !== undefined) {
			volume.colormap = volumeFile.colorMap ?? 'gray';
		}
		// this.niivue.setColorMap(niivueVolume.id, volumeFile.colorMap ?? 'gray');
	}

	public handleKeyDown = (event: KeyboardEvent): void => {
		switch (event.key) {
			case 'Control':
				this.niivue.opts.dragMode = this.niivue.dragModes.none;
				break;
			case 'ArrowUp':
				this.moveSlices(1);
				break;
			case 'ArrowDown':
				this.moveSlices(-1);
				break;
			default:
				break;
		}
	};

	public handleKeyUp = (event: KeyboardEvent): void => {
		if (this.niivue === undefined) return;

		if (event.key === 'Control') {
			this.niivue.opts.dragMode = this.niivue.dragModes.pan;
		}
	};

	public handleMouseMove = (event: MouseEvent): void => {
		if (this.niivue === undefined) return;
		if (this.niivue.canvas === undefined || this.niivue.canvas === null) return;

		const rect = this.niivue.canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) * this.niivue.uiData.dpr;
		const y = (event.clientY - rect.top) * this.niivue.uiData.dpr;
		for (let i = 0; i < this.niivue.screenSlices.length; i++) {
			const axCorSag = this.niivue.screenSlices[i].axCorSag;
			if (axCorSag > 3) continue;
			const texFrac = this.niivue.screenXY2TextureFrac(x, y, i);
			if (
				texFrac[0] === undefined ||
				texFrac[0] < 0 ||
				axCorSag === this.hooveredView
			)
				continue;
			this.hooveredView = axCorSag;
		}
		if (
			this.niivue.opts.dragMode === this.niivue.dragModes.none &&
			this.niivue.uiData.mouseButtonCenterDown
		) {
			this.moveSlices(event.movementY);
		}
	};

	public moveSlices(sliceValue: number): void {
		if (this.niivue === undefined) return;

		if (this.hooveredView === 2) {
			this.niivue.moveCrosshairInVox(sliceValue, 0, 0);
		} else if (this.hooveredView === 1) {
			this.niivue.moveCrosshairInVox(0, sliceValue, 0);
		} else {
			this.niivue.moveCrosshairInVox(0, 0, sliceValue);
		}
	}

	private navigateToSlice(
		x: number | undefined,
		y: number | undefined,
		z: number | undefined
	): void {
		if (this.niivue === undefined) return;

		const calculateDistance = (
			target: number | undefined,
			dimensions: number
		): number => {
			if (target === undefined) return 0;

			const startingPoint = Math.floor(dimensions / 2);

			return target >= startingPoint
				? target - startingPoint
				: (startingPoint - target) * -1;
		};

		const distanceX = calculateDistance(x, this.niivue.vox[0]);
		const distanceY = calculateDistance(y, this.niivue.vox[1]);
		const distanceZ = calculateDistance(z, this.niivue.vox[2]);

		this.niivue.moveCrosshairInVox(distanceX, distanceY, distanceZ);
	}
}
