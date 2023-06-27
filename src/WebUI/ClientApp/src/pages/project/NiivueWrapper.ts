import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import type { SurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/VolumeFile';
import { Niivue } from '@niivue/niivue';
import type {
	LocationData,
	NVImage,
	NVMesh,
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
	private isRunning = false;
	private readonly volumeCache = new Map<string, NVImage>();
	private readonly surfaceCache = new Map<string, NVMesh>();

	constructor(
		canvasRef: HTMLCanvasElement,
		private readonly setLocation: (
			value: React.SetStateAction<LocationData | undefined>
		) => void
	) {
		void this.niivue.attachToCanvas(canvasRef);
	}

	public next(projectState: ProjectState): void {
		this.nextState = projectState;
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

		await this.propagateState(currentState);

		// clear lock
		this.isRunning = false;

		// retrigger method
		await this.propagateNextState();
	}

	/**
	 * propagate the given project state to the niivue library
	 */
	private async propagateState(projectState: ProjectState): Promise<void> {
		const files = projectState.files;

		if (this.volumeCache.size === 0 && this.surfaceCache.size === 0) {
			// if there are no files cached yet, start from scratch
			await this.loadInitialState(files);
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
			return;
		}

		// otherwise we only need to update the options
		this.updateFileProperties(files);
		this.cleanUpCache(files);
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
				});
				this.surfaceCache.set(newSurfaceToCache.name, newSurfaceToCache);
			}
		}
	}

	private async loadInitialState(files: ProjectFiles): Promise<void> {
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
						const layers = file.overlayFiles
							?.filter(
								(overlayFile): overlayFile is CloudOverlayFile =>
									overlayFile instanceof CloudOverlayFile
							)
							.map(
								(overlayFile): NVMeshLayer => ({
									name: overlayFile.name,
									url: overlayFile.url,
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
							layers,
						};
					})
			);

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

	private updateFileProperties(files: ProjectFiles): void {
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
			this.updateVolumeBrightness(niivueVolume, volumeFile);
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

			this.updateSurfaceOrder(niivueSurface, tmpOrder++);
			this.updateSurfaceOverlay(surfaceFile, niivueSurface);
		}
	}

	private updateVolumeOrder(niivueVolume: NVImage, order: number): void {
		if (this.niivue.getVolumeIndexByID(niivueVolume.id) === order) return;
		this.niivue.setVolume(niivueVolume, order);
	}

	private updateSurfaceOrder(niivueSurface: NVMesh, order: number): void {
		if (this.niivue.getMeshIndexByID(niivueSurface.id) === order) return;
		this.niivue.setMesh(niivueSurface, order);
	}

	// BERE todo - implement surface overlay update here
	// eslint-disable-next-line class-methods-use-this
	private updateSurfaceOverlay(
		surfaceFile: SurfaceFile,
		niivueSurface: NVMesh
	): void {
		// TODO bere update overlays
		// niivueSurface.layers[0] = niivue.
	}

	private updateVolumeBrightness(
		niivueVolume: NVImage,
		volumeFile: VolumeFile
	): void {
		if (
			niivueVolume.opacity === volumeFile.opacity &&
			niivueVolume.cal_min === volumeFile.contrastMin &&
			niivueVolume.cal_max === volumeFile.contrastMax
		)
			return;

		niivueVolume.opacity = volumeFile.opacity / 100;
		niivueVolume.cal_min = volumeFile.contrastMin;
		niivueVolume.cal_max = volumeFile.contrastMax;
		this.niivue.updateGLVolume();
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
			(this.niivue.uiData.mouseButtonCenterDown as boolean)
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
}
