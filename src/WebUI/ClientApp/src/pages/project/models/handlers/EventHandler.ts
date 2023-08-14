import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import {
	USER_MODE,
	type ProjectState,
	SLICE_TYPE,
} from '@/pages/project/models/ProjectState';

export class EventHandler {
	private hooveredView = 0;
	private static readonly isMac = window.navigator.userAgent.includes('Mac');
	static readonly controlCode = this.isMac ? 'Meta' : 'Control';
	static controlPressed = (
		event: React.KeyboardEvent | KeyboardEvent
	): boolean => (this.isMac ? event.metaKey : event.ctrlKey);

	static onKeyGate = (callbacks?: {
		onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
		onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	}): {
		onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
		onKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	} => ({
		onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
			if (this.controlPressed(event)) {
				return;
			}

			event.stopPropagation();
			callbacks?.onKeyDown?.(event);
		},
		onKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => {
			if (this.controlPressed(event)) {
				return;
			}

			event.stopPropagation();
			callbacks?.onKeyUp?.(event);
		},
	});

	constructor(
		private readonly projectState: ProjectState,
		private readonly niivueWrapper: NiivueWrapper
	) {}

	public handleKeyDown = (event: KeyboardEvent): void => {
		if (this.niivueWrapper.niivue === undefined) return;

		if (EventHandler.controlPressed(event)) {
			event.preventDefault();

			switch (event.key) {
				case EventHandler.controlCode:
					this.niivueWrapper.niivue.opts.dragMode =
						this.niivueWrapper.niivue.dragModes.none;
					break;
				case 'z':
					this.projectState.historyHandler.undo();
					break;
				case 'y':
					this.projectState.historyHandler.redo();
					break;
				default:
					break;
			}
		}

		if (!EventHandler.controlPressed(event))
			switch (event.key) {
				case 'ArrowUp':
					this.moveSlices(1);
					break;
				case 'ArrowDown':
					this.moveSlices(-1);
					break;
				case 'm':
					this.projectState.setUserMode(USER_MODE.NAVIGATE);
					break;
				case 'v':
					this.projectState.setUserMode(USER_MODE.EDIT_VOXEL);
					break;
				case 'p':
					this.projectState.setUserMode(USER_MODE.EDIT_POINTS);
					break;
				case '1':
					this.projectState.setSliceType(SLICE_TYPE.AXIAL);
					break;
				case '2':
					this.projectState.setSliceType(SLICE_TYPE.CORONAL);
					break;
				case '3':
					this.projectState.setSliceType(SLICE_TYPE.SAGITTAL);
					break;
				case '4':
					this.projectState.setSliceType(SLICE_TYPE.RENDER);
					break;
				case '5':
					this.projectState.setSliceType(SLICE_TYPE.MULTIPLANAR);
					break;
				default:
					break;
			}
	};

	public handleKeyUp = (event: KeyboardEvent): void => {
		if (this.niivueWrapper.niivue === undefined) return;

		if (event.key === EventHandler.controlCode) {
			event.preventDefault();
			this.niivueWrapper.niivue.opts.dragMode =
				this.niivueWrapper.niivue.dragModes.pan;
		}
	};

	public handleMouseMove = (event: MouseEvent): void => {
		if (
			this.niivueWrapper.niivue === undefined ||
			this.niivueWrapper.niivue.canvas === undefined
		)
			return;
		const rect = this.niivueWrapper.niivue.canvas.getBoundingClientRect();
		const x =
			(event.clientX - rect.left) * this.niivueWrapper.niivue.uiData.dpr;
		const y = (event.clientY - rect.top) * this.niivueWrapper.niivue.uiData.dpr;

		for (let i = 0; i < this.niivueWrapper.niivue.screenSlices.length; i++) {
			const axCorSag = this.niivueWrapper.niivue.screenSlices[i].axCorSag;
			if (axCorSag > 3) continue;
			const texFrac = this.niivueWrapper.niivue.screenXY2TextureFrac(x, y, i);
			if (
				texFrac[0] === undefined ||
				texFrac[0] < 0 ||
				axCorSag === this.hooveredView
			)
				continue;
			this.hooveredView = axCorSag;
		}

		if (
			this.niivueWrapper.niivue.opts.dragMode ===
				this.niivueWrapper.niivue.dragModes.none &&
			this.niivueWrapper.niivue.uiData.mouseButtonCenterDown
		) {
			this.moveSlices(event.movementY);
		}
	};

	public moveSlices(sliceValue: number): void {
		if (this.niivueWrapper.niivue === undefined) return;

		if (this.hooveredView === 2) {
			this.niivueWrapper.niivue.moveCrosshairInVox(sliceValue, 0, 0);
		} else if (this.hooveredView === 1) {
			this.niivueWrapper.niivue.moveCrosshairInVox(0, sliceValue, 0);
		} else {
			this.niivueWrapper.niivue.moveCrosshairInVox(0, 0, sliceValue);
		}
	}
}
