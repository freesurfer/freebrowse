import {
	USER_MODE,
	type ProjectState,
} from '@/pages/project/models/ProjectState';
import type { Niivue } from '@niivue/niivue';

export class NiivueEventHandlers {
	private readonly niivue: Niivue | undefined;
	private hooveredView: number;
	private projectState: ProjectState | undefined;

	constructor(
		niivueInstance: Niivue | undefined,
		projectStateCallback: () => ProjectState | undefined
	) {
		this.niivue = niivueInstance;
		this.hooveredView = 0;
		this.projectState = projectStateCallback();
	}

	updateProjectState(newProjectState: ProjectState | undefined): void {
		this.projectState = newProjectState;
	}

	public handleKeyDown = (event: KeyboardEvent): void => {
		if (this.niivue === undefined) return;

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
			case 'z':
				if (event.ctrlKey) {
					if (this.projectState?.userMode === USER_MODE.EDIT_VOXEL) {
						this.niivue.undoLastVoxelEdit();
					}
				}
				break;
			case 'y':
				if (event.ctrlKey) {
					if (this.projectState?.userMode === USER_MODE.EDIT_VOXEL) {
						this.niivue.redoLastVoxelEditUndo();
					}
				}
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
		if (this.niivue === undefined || this.niivue.canvas === undefined) return;
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
}
