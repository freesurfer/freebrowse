import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { Niivue } from '@niivue/niivue';
import type { LocationData } from '@niivue/niivue';

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
	});

	private hooveredView = 0;

	private readonly loadDataQueue: ProjectFiles[] = [];
	private loadDataInProgress = false;

	public readonly id = Math.random();

	constructor(
		canvasRef: HTMLCanvasElement,
		private readonly setLocation: (
			value: React.SetStateAction<LocationData | undefined>
		) => void
	) {
		void this.niivue.attachToCanvas(canvasRef);
	}

	public loadDataAsync(files: ProjectFiles | undefined): void {
		if (files === undefined) return;

		this.loadDataQueue.push(files);

		void this.executeLoadDataQueue();
	}

	private async executeLoadDataQueue(): Promise<void> {
		if (this.loadDataInProgress) return;
		this.loadDataInProgress = true;

		const files = this.loadDataQueue.shift();
		if (files !== undefined) {
			await this.executeLoadDataChunk(files);
			this.loadDataInProgress = false;
			await this.executeLoadDataQueue();
			return;
		}

		this.loadDataInProgress = false;
	}

	private async executeLoadDataChunk(files: ProjectFiles): Promise<void> {
		if (!files.isRemovedOrAdded(this.niivue.volumes, this.niivue.meshes)) {
			// needed to compute order of visible files only
			let tmpOrder = this.niivue.volumes.length;
			/* we need to reverse the order here twice, to change the lowest index first */
			const volumeFiles = files.volumes
				.filter((volume) => volume.isChecked)
				.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
			for (const volumeFile of volumeFiles) {
				tmpOrder = tmpOrder - 1;

				const niivueVolume = this.niivue.volumes.find(
					(niivueVolume) => volumeFile.name === niivueVolume.name
				);
				if (niivueVolume === undefined) {
					console.error('no volume in niivue - can not happen');
					return;
				}

				const invertedOrder = volumeFiles.length - tmpOrder;
				if (this.niivue.getVolumeIndexByID(niivueVolume.id) === invertedOrder)
					continue;

				this.niivue.setVolume(niivueVolume, invertedOrder);
			}

			tmpOrder = this.niivue.meshes.length;
			/* we need to reverse the order here twice, to change the lowest index first */
			const surfaceFiles = files.surfaces
				.filter((surface) => surface.isChecked)
				.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
			for (const surfaceFile of surfaceFiles) {
				tmpOrder = tmpOrder - 1;

				const niivueMesh = this.niivue.meshes.find(
					(niivueMesh) => surfaceFile.name === niivueMesh.name
				);
				if (niivueMesh === undefined) {
					console.error('no surface in niivue - can not happen');
					return;
				}

				const invertedOrder = surfaceFiles.length - tmpOrder;
				if (this.niivue.getMeshIndexByID(niivueMesh.id) === invertedOrder) {
					continue;
				}

				this.niivue.setMesh(niivueMesh, invertedOrder);
			}

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
