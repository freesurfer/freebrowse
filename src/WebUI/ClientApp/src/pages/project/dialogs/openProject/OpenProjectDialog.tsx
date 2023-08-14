import { Tabs } from '@/components/Tabs';
import { DialogFrame } from '@/pages/project/dialogs/DialogFrame';
import { useProjectDialogState } from '@/pages/project/dialogs/openProject/hooks/useProjectDialogState';
import { MyComputerDialogTab } from '@/pages/project/dialogs/openProject/tabs/my-computer/MyComputerDialogTab';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { createContext, useCallback } from 'react';
import type { ReactElement } from 'react';

export type ResolveCreateProjectDialogResult =
	| {
			projectId: number;
	  }
	| 'canceled';

export interface IOpenProjectDialog {
	/**
	 * open the modal dialog
	 */
	readonly createProject: () => Promise<ProjectState | 'canceled'>;
	readonly editProject: (
		projectState: ProjectState
	) => Promise<ProjectState | 'canceled'>;
}

export const OpenProjectDialogContext = createContext<IOpenProjectDialog>({
	createProject: async () => {
		throw new Error('not initialized yet');
	},
	editProject: async () => {
		throw new Error('not initialized yet');
	},
});

export const OpenProjectDialog = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const { context, isOpen, projectState, resolve, reject } =
		useProjectDialogState();

	const onOpenClick = useCallback(async (): Promise<void> => {
		if (projectState === undefined) {
			reject?.('can not create/edit project without project instance');
			return;
		}
		try {
			await projectState.apiPost();
			resolve?.(projectState);
		} catch (error) {
			reject?.(error as string);
		}
	}, [projectState, reject, resolve]);

	return (
		<>
			<OpenProjectDialogContext.Provider value={context}>
				{children}
			</OpenProjectDialogContext.Provider>
			<DialogFrame
				isOpen={isOpen}
				onDone={() => {
					void onOpenClick();
				}}
				onCancel={() => resolve?.('canceled')}
				title="Load volumes & surfaces"
				doneButtonLabel={projectState === undefined ? 'Open' : 'Update'}
				icon={
					<ArrowUpTrayIcon className="h-8 w-8 shrink-0 text-gray-500"></ArrowUpTrayIcon>
				}
			>
				{projectState !== undefined ? (
					<Tabs
						tabs={[
							{
								title: 'My computer',
								content: (
									<MyComputerDialogTab
										projectState={projectState}
									></MyComputerDialogTab>
								),
							},
							{
								title: 'Cloud',
								content: <></>,
							},
						]}
					/>
				) : (
					<></>
				)}
			</DialogFrame>
		</>
	);
};
