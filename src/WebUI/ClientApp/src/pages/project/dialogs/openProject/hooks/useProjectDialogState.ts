import type { IOpenProjectDialog } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { useState } from 'react';

interface IModalHandle {
	/**
	 * project state, when the dialog has been opened
	 */
	projectState: ProjectState | undefined;
	resolve: ((value: ProjectState | 'canceled') => void) | undefined;
	reject: ((error: string) => void) | undefined;
}

export const useProjectDialogState = (): {
	context: IOpenProjectDialog;
	isOpen: boolean;
} & IModalHandle => {
	const [state, setState] = useState<IModalHandle | undefined>(undefined);

	const createProject = async (): Promise<ProjectState | 'canceled'> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		const promise = new Promise<ProjectState | 'canceled'>(
			(resolve, reject) => {
				setState({
					resolve,
					reject,
					projectState: new ProjectState(),
				});
			}
		);

		// close modal dialog on any result
		promise.finally(() => setState(undefined));
		return await promise;
	};

	const editProject = async (
		projectState: ProjectState
	): Promise<ProjectState | 'canceled'> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		if (projectState === undefined)
			throw new Error('no project given - create new project instead?');

		const promise = new Promise<ProjectState | 'canceled'>(
			(resolve, reject) => {
				setState({
					resolve,
					reject,
					projectState,
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
		projectState: state?.projectState,
		resolve: state?.resolve,
		reject: state?.reject,
	};
};
