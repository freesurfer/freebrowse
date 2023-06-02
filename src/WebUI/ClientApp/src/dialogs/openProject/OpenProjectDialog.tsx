// TODO remove

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Tabs } from '@/components/Tabs';
import { useProjectDialogState } from '@/dialogs/openProject/hooks/useProjectDialogState';
import { MyComputerDialogTab } from '@/dialogs/openProject/tabs/my-computer/MyComputerDialogTab';
import * as WebApi from '@/generated/web-api-client';
import type { ProjectDto } from '@/generated/web-api-client';
import { getApiUrl } from '@/utils';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createContext, useState } from 'react';
import Modal from 'react-modal';

export type ResolveCreateProjectDialogResult =
	| {
			projectId: number;
	  }
	| 'canceled';

export interface IOpenProjectDialog {
	/**
	 * open the modal dialog
	 */
	readonly createProject: () => Promise<ResolveCreateProjectDialogResult>;
	readonly editProject: (project: ProjectDto | undefined) => Promise<void>;
}

export const OpenProjectDialogContext = createContext<IOpenProjectDialog>({
	createProject: async () => {
		throw new Error('not initialized yet');
	},
	editProject: async () => {
		throw new Error('not initialized yet');
	},
});

const customStyles = {
	overlay: {
		zIndex: 1,
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
		padding: '0px',
		maxHeight: '100vh',
		maxWidth: '100vw',
	},
};

/**
 * Make sure to bind modal to your appElement
 * https://reactcommunity.org/react-modal/accessibility/
 */
const bindModalToRoot = (): void => {
	const rootElement = document.getElementById('root');
	if (rootElement !== null) Modal.setAppElement(rootElement);
};
bindModalToRoot();

export const OpenProjectDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const {
		context,
		isOpen,
		projectFiles,
		setProjectFiles,
		projectName,
		setProjectName,
		projectDto,
		resolve,
		reject,
	} = useProjectDialogState();

	const onOpenClick = async (): Promise<void> => {
		if (
			projectFiles === undefined ||
			resolve === undefined ||
			reject === undefined
		) {
			console.error('modal state is not correct');
			return;
		}

		const createProjectInBackend = async (): Promise<void> => {
			const client = new WebApi.ProjectsClient(getApiUrl());

			try {
				const createProjectResponse = await client.create(
					new WebApi.CreateProjectCommand({
						name: projectName,
						volumes: await projectFiles.getLocalVolumesToUpload(),
						surfaces: await projectFiles.getLocalSurfacesToUpload(),
					})
				);

				if (createProjectResponse.id === undefined)
					throw new Error('no project id received from backend');

				resolve({ projectId: createProjectResponse.id });
			} catch (error) {
				console.error('something went wrong', error);
				reject('UNKNOWN_ERROR');
			}
		};

		const updateProjectInBackend = async (): Promise<void> => {
			// TODO implement edit command
			// const client = new WebApi.ProjectsClient(getApiUrl());
		};

		if (projectDto === undefined) {
			await createProjectInBackend();
			return;
		}

		await updateProjectInBackend();
	};

	return (
		<>
			<OpenProjectDialogContext.Provider value={context}>
				{children}
			</OpenProjectDialogContext.Provider>
			<Modal
				isOpen={isOpen}
				style={customStyles}
				contentLabel="Load volumes & surfaces"
			>
				{projectFiles !== undefined &&
				setProjectFiles !== undefined &&
				setProjectName !== undefined &&
				resolve !== undefined &&
				reject !== undefined ? (
					<>
						<div className="flex gap-4 items-center m-4">
							<ArrowUpTrayIcon className="text-gray-500 h-8 w-8 shrink-0"></ArrowUpTrayIcon>
							<h1 className="text-xl text-gray-500 font-bold mr-12">
								Load volumes & surfaces
							</h1>
						</div>
						<button
							onClick={() => resolve('canceled')}
							className="text-gray-600 absolute right-0 top-0 p-2"
						>
							<XMarkIcon className="h-6 w-6 shrink-0"></XMarkIcon>
						</button>

						<Tabs
							tabs={[
								{
									title: 'My computer',
									content: (
										<MyComputerDialogTab
											projectFiles={projectFiles}
											setProjectFiles={setProjectFiles}
											projectName={projectName}
											setProjectName={setProjectName}
											projectDto={projectDto}
										></MyComputerDialogTab>
									),
								},
								{
									title: 'Cloud',
									content: <></>,
								},
							]}
						/>

						<div className="flex justify-end m-2">
							<button
								className="m-2 bg-gray-200 text-gray-500 text-sm font-semibold px-5 py-3 rounded-md"
								onClick={() => resolve('canceled')}
							>
								Cancel
							</button>
							<button
								className="m-2 bg-gray-500 text-white text-sm font-semibold px-5 py-3 rounded-md"
								onClick={() => {
									void onOpenClick();
								}}
							>
								{projectDto === undefined ? 'Open' : 'Update'}
							</button>
						</div>
					</>
				) : (
					<span>wrong state</span>
				)}
			</Modal>
		</>
	);
};
