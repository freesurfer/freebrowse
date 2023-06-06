import type { IOpenProjectDialog } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { useState } from 'react';

interface IModalHandle {
	/**
	 * temporary state of the file configuration
	 */
	projectFiles: ProjectFiles | undefined;
	projectName: string | undefined;
	/**
	 * project state, when the dialog has been opened
	 */
	projectState: ProjectState | undefined;
	resolve:
		| ((
				value:
					| {
							projectId: number;
							projectFiles: ProjectFiles;
					  }
					| 'canceled'
		  ) => void)
		| undefined;
	reject: ((error: string) => void) | undefined;
}

export const useProjectDialogState = (): {
	context: IOpenProjectDialog;
} & IModalHandle & {
		isOpen: boolean;
		setProjectName: ((projectName: string) => void) | undefined;
		setProjectFiles: ((projectFiles: ProjectFiles) => void) | undefined;
	} => {
	const [state, setState] = useState<IModalHandle | undefined>(undefined);

	const createProject = async (): Promise<
		| {
				projectId: number;
		  }
		| 'canceled'
	> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		const promise = new Promise<
			| {
					projectId: number;
			  }
			| 'canceled'
		>((resolve, reject) => {
			setState({
				resolve: (result) => {
					if (result === 'canceled') {
						resolve('canceled');
						return;
					}
					if (result.projectId === undefined) return;
					resolve({ projectId: result.projectId });
				},
				reject,
				projectState: undefined,
				projectName: 'Subject_1',
				projectFiles: new ProjectFiles(),
			});
		});

		// close modal dialog on any result
		promise.finally(() => setState(undefined));
		return await promise;
	};

	const editProject = async (
		projectState: ProjectState
	): Promise<ProjectFiles | 'canceled'> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		if (projectState === undefined)
			throw new Error('no project given - create new project instead?');

		const promise = new Promise<ProjectFiles | 'canceled'>(
			(resolve, reject) => {
				setState({
					resolve: (result) => {
						if (result === 'canceled') {
							resolve('canceled');
							return;
						}
						if (result.projectFiles === undefined) return;
						resolve(result.projectFiles);
					},
					reject,
					projectState,
					projectName: projectState.name,
					projectFiles: projectState.files,
				});
			}
		);

		// close modal dialog on any result
		promise.finally(() => setState(undefined));

		return await promise;
	};

	return {
		context: { createProject, editProject },
		isOpen: state !== undefined,
		projectFiles: state?.projectFiles,
		setProjectFiles: (projectFiles) =>
			state !== undefined && setState({ ...state, projectFiles }),
		projectName: state?.projectName,
		setProjectName: (projectName) =>
			state !== undefined && setState({ ...state, projectName }),
		projectState: state?.projectState,
		resolve: state?.resolve,
		reject: state?.reject,
	};
};
