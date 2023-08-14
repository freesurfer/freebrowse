import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import {
	USER_MODE,
	type ProjectState,
} from '@/pages/project/models/ProjectState';
import { HistoryHandlerEditPoints } from '@/pages/project/models/handlers/HistoryHandlerEditPoints';

export class HistoryHandler {
	readonly editPoints: HistoryHandlerEditPoints;

	constructor(
		private readonly projectState: ProjectState,
		private readonly niivueWrapper: NiivueWrapper
	) {
		this.editPoints = new HistoryHandlerEditPoints(this.projectState);
	}

	undo(): void {
		switch (this.projectState.userMode) {
			case USER_MODE.EDIT_VOXEL:
				this.niivueWrapper.niivue.undoLastVoxelEdit();
				return;
			case USER_MODE.EDIT_POINTS:
				void this.editPoints.undo();
		}
	}

	redo(): void {
		switch (this.projectState.userMode) {
			case USER_MODE.EDIT_VOXEL:
				this.niivueWrapper.niivue.redoLastVoxelEditUndo();
				return;
			case USER_MODE.EDIT_POINTS:
				void this.editPoints.redo();
		}
	}
}
