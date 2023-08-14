import type { ProjectState } from '@/pages/project/models/ProjectState';
import { useState, createContext } from 'react';

export interface IProjectSettingsDialog {
	openSettings: (projectState: ProjectState) => Promise<'closed'>;
}

export interface IModalHandle {
	projectState: ProjectState | undefined;
	close: (() => void) | undefined;
}

export const ProjectSettingsDialogContext =
	createContext<IProjectSettingsDialog>({
		openSettings: async () => {
			throw new Error('not initialized yet');
		},
	});

export const useProjectSettingsDialogState = (): {
	context: IProjectSettingsDialog;
	isOpen: boolean;
} & IModalHandle => {
	const [state, setState] = useState<IModalHandle | undefined>(undefined);

	const openSettings = async (
		projectState: ProjectState
	): Promise<'closed'> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		const promise = new Promise<'closed'>((resolve) => {
			setState({
				close: () => resolve('closed'),
				projectState,
			});
		});

		// close modal dialog on any result
		promise.finally(() => setState(undefined));

		return await promise;
	};

	return {
		context: { openSettings },
		isOpen: state !== undefined,
		projectState: state?.projectState,
		close: state?.close,
	};
};
