import type { GetProjectDto } from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/ProjectFile';
import type { ProjectFile } from '@/pages/project/models/ProjectFile';
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
			| { projectState: ProjectState; projectFiles: ProjectFiles },
		public readonly upload: boolean
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

	fromFiles(projectFiles: ProjectFiles, upload = true): ProjectState {
		return new ProjectState({ projectState: this, projectFiles }, upload);
	}

	/**
	 * to update a property of a file
	 * @param file file to update the property on
	 * @param options property value to update
	 * @param upload flag, if the change should get pushed to the backend
	 * @returns new instance of the project state
	 */
	fromFileUpdate<T_FILE_TYPE extends ProjectFile>(
		file: T_FILE_TYPE,
		options: Parameters<T_FILE_TYPE['from']>[0],
		upload: boolean
	): ProjectState {
		if (file.type === FileType.VOLUME)
			return new ProjectState(
				{
					projectState: this,
					projectFiles: this.files.fromAdaptedVolumes(
						this.files.volumes.map((tmpVolume) =>
							tmpVolume === file ? tmpVolume.from(options) : tmpVolume
						)
					),
				},
				upload
			);

		if (file.type === FileType.SURFACE)
			return new ProjectState(
				{
					projectState: this,
					projectFiles: this.files.fromAdaptedSurfaces(
						this.files.surfaces.map((tmpSurface) =>
							tmpSurface === file ? tmpSurface.from(options) : tmpSurface
						)
					),
				},
				upload
			);

		throw new Error('file type unknown');
	}
}
