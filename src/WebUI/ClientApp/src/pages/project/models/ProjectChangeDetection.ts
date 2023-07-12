import type { ProjectState } from '@/pages/project/models/ProjectState';

export class ProjectChangeDetection {
	constructor(
		public readonly previousState: ProjectState | undefined,
		public readonly nextState: ProjectState
	) {}

	get editProject(): boolean {
		return (
			this.previousState === undefined ||
			this.nextState.name !== this.previousState.name ||
			this.nextState.meshThicknessOn2D !== this.previousState.meshThicknessOn2D
		);
	}

	get editVolume(): boolean {
		return (
			this.previousState === undefined ||
			this.nextState.files.cloudVolumes !==
				this.previousState.files.cloudVolumes
		);
	}

	get hasCachePointSetFiles(): boolean {
		return this.nextState.files.cachePointSets.length > 0;
	}
}
