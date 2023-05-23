import { Tabs } from '@/components/Tabs';
import { MyComputerDialogTab } from '@/dialogs/load/MyComputerDialogTab';
import * as WebApi from '@/generated/web-api-client';
import { getApiUrl } from '@/utils';
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
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface LoadDialogHandle {
	/**
	 * open the modal dialog
	 */
	readonly createProject: () => Promise<'success' | 'canceled'>;
	readonly editProject: () => Promise<void>;
}

export const LoadDialogContext = createContext<LoadDialogHandle>({
	createProject: async () => {
		throw new Error('not initialized yet');
	},
	editProject: async () => {
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
				resolve: (closeReason: 'success' | 'canceled') => void;
				reject: (error: LOAD_DIALOG_ERROR) => void;
				isNewProject: boolean;
		  }
		| undefined
	>(undefined);

	const [files, updateFiles] = useState<Record<string, FileLoadMetadata>>({});

	const [projectName, setProjectName] = useState<string>(
		'Subject_Walter_White'
	);

	/**
	 * this callbacks will be accessible from everywhere in the app
	 * using the useContext hook
	 */
	const modalContextValue: LoadDialogHandle = {
		createProject: async (): Promise<'success' | 'canceled'> => {
			if (modalHandle !== undefined)
				throw new Error(LOAD_DIALOG_ERROR.DIALOG_OPENED_ALREADY);

			const promise = new Promise<'success' | 'canceled'>((resolve, reject) => {
				setModalHandle({ resolve, reject, isNewProject: true });
			});

			// close modal dialog on any result
			promise.finally(() => setModalHandle(undefined));
			return await promise;
		},
		editProject: async (): Promise<void> => {
			if (modalHandle !== undefined)
				throw new Error(LOAD_DIALOG_ERROR.DIALOG_OPENED_ALREADY);

			const promise = new Promise<void>((resolve, reject) => {
				setModalHandle({
					resolve: () => resolve(),
					reject,
					isNewProject: false,
				});
			});

			// close modal dialog on any result
			promise.finally(() => setModalHandle(undefined));
			return await promise;
		},
	};

	const getBase64 = async (file: File | undefined): Promise<string> => {
		return await new Promise<string>((resolve, reject) => {
			if (file === undefined) throw new Error('no file given');
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				if (reader.result === null) {
					reject(new Error('result is null'));
					return;
				}
				if (reader.result instanceof ArrayBuffer) {
					reject(
						new Error('result is an ArrayBuffer instead of expected string')
					);
					return;
				}
				resolve(reader.result);
			};
			reader.onerror = (error) => {
				reject(error);
			};
		});
	};

	const onOpenClick = async (): Promise<void> => {
		const client = new WebApi.ProjectsClient(getApiUrl());

		const fileNames = Object.keys(files);
		const volumeFileNames = fileNames.filter((fileName) => {
			if (fileName.endsWith('.mgz')) return true;
			if (fileName.endsWith('.nii.gz')) return true;
			return false;
		});
		const surfaceFileNames = fileNames.filter((fileName) => {
			if (fileName.endsWith('.inflated')) return true;
			if (fileName.endsWith('.pial')) return true;
			if (fileName.endsWith('.white')) return true;
			if (fileName.endsWith('.sphere')) return true;
			return false;
		});

		const volumes = await Promise.all(
			volumeFileNames.map(async (fileName) => {
				return new WebApi.VolumeDto2({
					base64: await getBase64(files[fileName]?.file),
					fileName,
				});
			})
		);

		const surfaces = await Promise.all(
			surfaceFileNames.map(async (fileName) => {
				return new WebApi.SurfaceDto2({
					base64: await getBase64(files[fileName]?.file),
					fileName,
				});
			})
		);

		try {
			await client.create(
				new WebApi.CreateProjectCommand({
					name: projectName,
					volumes,
					surfaces,
				})
			);
			modalHandle?.resolve('success');
		} catch (error) {
			console.error('something went wrong', error);
			modalHandle?.reject(LOAD_DIALOG_ERROR.UNKNOWN_ERROR);
		}
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
					onClick={() => modalHandle?.resolve('canceled')}
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
									projectName={projectName}
									setProjectName={setProjectName}
									isNewProject={modalHandle?.isNewProject ?? false}
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
						onClick={() => modalHandle?.resolve('canceled')}
					>
						Cancel
					</button>
					<button
						className="m-2 bg-gray-500 text-white text-sm font-semibold px-5 py-3 rounded-md"
						onClick={() => {
							void onOpenClick();
						}}
					>
						Open
					</button>
				</div>
			</Modal>
		</>
	);
};
