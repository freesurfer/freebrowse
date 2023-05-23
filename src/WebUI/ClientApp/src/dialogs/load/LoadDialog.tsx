import { Tabs } from '@/components/Tabs';
import { MyComputerDialogTab } from '@/dialogs/load/MyComputerDialogTab';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createContext, useState } from 'react';
import Modal from 'react-modal';

export interface FileLoadMetadata {
	file: File;
	progress: number;
	selection?: 'grayscale' | 'lookupTable';
	resampleRAS?: boolean;
}

export enum LOAD_DIALOG_ERROR {
	DIALOG_OPENED_ALREADY = 'DIALOG_OPENED_ALREADY',
	CLOSED_BY_USER = 'CLOSED_BY_USER',
}

interface LoadDialogHandle {
	/**
	 * open the modal dialog
	 */
	readonly createProject: () => Promise<FileLoadMetadata[]>;
}

export const LoadDialogContext = createContext<LoadDialogHandle>({
	createProject: async () => {
		throw new Error('not initialized yet');
	},
});

const customStyles = {
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

export const LoadDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const [modalHandle, setModalHandle] = useState<
		| {
				resolve: (files: FileLoadMetadata[]) => void;
				reject: (error: LOAD_DIALOG_ERROR) => void;
		  }
		| undefined
	>(undefined);

	const [files, updateFiles] = useState<FileLoadMetadata[]>([]);

	/**
	 * this callbacks will be accessible from everywhere in the app
	 * using the useContext hook
	 */
	const modalContextValue: LoadDialogHandle = {
		createProject: async (): Promise<FileLoadMetadata[]> => {
			if (modalHandle !== undefined)
				throw new Error(LOAD_DIALOG_ERROR.DIALOG_OPENED_ALREADY);

			const promise = new Promise<FileLoadMetadata[]>((resolve, reject) => {
				setModalHandle({ resolve, reject });
			});

			// close modal dialog on any result
			promise.finally(() => setModalHandle(undefined));
			return await promise;
		},
	};

	return (
		<>
			<LoadDialogContext.Provider value={modalContextValue}>
				{children}
			</LoadDialogContext.Provider>
			<Modal
				isOpen={modalHandle !== undefined}
				style={customStyles}
				contentLabel="Load volumes & surfaces"
			>
				<div className="flex gap-4 items-center m-4">
					<ArrowUpTrayIcon className="text-gray-500 h-8 w-8 shrink-0"></ArrowUpTrayIcon>
					<h1 className="text-xl text-gray-500 font-bold mr-12">
						Load volumes & surfaces
					</h1>
				</div>
				<button
					onClick={() => modalHandle?.reject(LOAD_DIALOG_ERROR.CLOSED_BY_USER)}
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
									updateFiles={(files) => updateFiles(files)}
									files={files}
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
						onClick={() =>
							modalHandle?.reject(LOAD_DIALOG_ERROR.CLOSED_BY_USER)
						}
					>
						Cancel
					</button>
					<button
						className="m-2 bg-gray-500 text-white text-sm font-semibold px-5 py-3 rounded-md"
						onClick={() => {
							modalHandle?.resolve(files);
						}}
					>
						Open
					</button>
				</div>
			</Modal>
		</>
	);
};
