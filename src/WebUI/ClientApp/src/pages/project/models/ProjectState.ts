import type { GetProjectDto } from '@/generated/web-api-client';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';

/**
 * class to uncouple backend dto from data used from ui
 * - keep the expected backend data state without fetching it again
 * - keep the ui state of the project in one place
 */
export class ProjectState {
	/**
	 * project id defined by the backend
	 */
	public readonly id: number;
	/**
	 * given name of the project
	 */
	public readonly name: string | undefined;
	/**
	 * state of data received on the last fetch
	 */
	public readonly backendState: GetProjectDto;
	/**
	 * all files related to the project
	 */
	public readonly files: ProjectFiles;

	constructor(
		initialState:
			| {
					backendState: GetProjectDto;
			  }
			| { projectState: ProjectState; projectFiles: ProjectFiles }
	) {
		if ('backendState' in initialState) {
			if (initialState.backendState.id === undefined)
				throw new Error('no id given for project');
			this.id = initialState.backendState.id;
			this.name = initialState.backendState.name;
			this.backendState = initialState.backendState;
			this.files = new ProjectFiles({
				backendState: initialState.backendState,
			});
			return;
		}

		if ('projectState' in initialState) {
			this.id = initialState.projectState.id;
			this.name = initialState.projectState.name;
			this.backendState = initialState.projectState.backendState;
			this.files = initialState.projectFiles;
			return;
		}

		throw new Error('initial state is not as expected');
	}

	fromFiles(projectFiles: ProjectFiles): ProjectState {
		return new ProjectState({ projectState: this, projectFiles });
	}
}
