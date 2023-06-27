import type { VolumeFile } from '@/pages/project/models/ProjectFile';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ViewSettings } from '@/pages/project/models/ViewSettings';
import { Niivue } from '@niivue/niivue';
import type { LocationData, NVImage, NVMesh } from '@niivue/niivue';

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

	constructor(
		canvasRef: HTMLCanvasElement,
		private readonly setLocation: (
			value: React.SetStateAction<LocationData | undefined>
		) => void
	) {
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

		if (!files.isRemovedOrAdded(this.niivue.volumes, this.niivue.meshes)) {
			this.updateFileProperties(files);
			return;
		}

		try {
			/*
			 * clearing the volumes and meshes is needed here,
			 * otherwise on load volumes the meshes are getting drawn
			 * what leads to showing the 3d view only
			 */
			this.niivue.volumes = [];
			this.niivue.meshes = [];

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
					.map((file) => {
						return {
							url: file.url,
							name: file.name,
							opacity: file.opacity / 100,
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
			this.updateVolumeOpacity(niivueVolume, volumeFile);
			this.updateVolumeContrast(niivueVolume, volumeFile);
		}

		const surfaceFiles = files.surfaces
			.filter((surface) => surface.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
		tmpOrder = 0;
		for (const surfaceFile of surfaceFiles) {
			const niivueMesh = this.niivue.meshes.find(
				(niivueMesh) => surfaceFile.name === niivueMesh.name
			);

			if (niivueMesh === undefined) {
				console.warn('no niivue volume for given file', surfaceFile.name);
				continue;
			}

			this.updateSurfaceOrder(niivueMesh, tmpOrder++);
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

	private updateVolumeOpacity(
		niivueVolume: NVImage,
		volumeFile: VolumeFile
	): void {
		if (niivueVolume.opacity === volumeFile.opacity / 100) return;
		this.niivue.setOpacity(
			this.niivue.getVolumeIndexByID(niivueVolume.id),
			volumeFile.opacity / 100
		);
	}

	private updateVolumeContrast(
		niivueVolume: NVImage,
		volumeFile: VolumeFile
	): void {
		if (
			niivueVolume.cal_min === volumeFile.contrastMin &&
			niivueVolume.cal_max === volumeFile.contrastMax
		)
			return;

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
