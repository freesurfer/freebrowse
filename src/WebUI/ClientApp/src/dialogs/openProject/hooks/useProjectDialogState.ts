import type {
	IOpenProjectDialog,
	ResolveCreateProjectDialogResult,
} from '@/dialogs/openProject/OpenProjectDialog';
import { ProjectFiles } from '@/dialogs/openProject/models/ProjectFiles';
import type { ProjectDto } from '@/generated/web-api-client';
import { useState } from 'react';

interface IModalHandle {
	/**
	 * temporary state of the file configuration
	 */
	projectFiles: ProjectFiles | undefined;
	projectName: string | undefined;
	/**
	 * project data received by the backend, if existing
	 */
	projectDto: ProjectDto | undefined;
	resolve:
		| ((closeReason: ResolveCreateProjectDialogResult) => void)
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

	const createProject = async (): Promise<ResolveCreateProjectDialogResult> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		const promise = new Promise<ResolveCreateProjectDialogResult>(
			(resolve, reject) => {
				setState({
					resolve,
					reject,
					projectDto: undefined,
					projectName: 'Subject_1',
					projectFiles: new ProjectFiles(),
				});
			}
		);

		// close modal dialog on any result
		promise.finally(() => setState(undefined));
		return await promise;
	};

	const editProject = async (
		projectDto: ProjectDto | undefined
	): Promise<void> => {
		if (state !== undefined) throw new Error('dialog is opened already');

		if (projectDto === undefined)
			throw new Error('no project given - create new project instead?');

		const promise = new Promise<void>((resolve, reject) => {
			setState({
				resolve: () => resolve(),
				reject,
				projectDto,
				projectName: projectDto.name,
				projectFiles: new ProjectFiles({ projectDto }),
			});
		});

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
		projectDto: state?.projectDto,
		resolve: state?.resolve,
		reject: state?.reject,
	};
};
