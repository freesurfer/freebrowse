import { useDownloadFilesDialogState } from './hooks/useDownloadFilesDialogState';
import type { FileResponse } from '@/generated/web-api-client';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { convertVolumeToBase64 } from '@/pages/project/models/file/ProjectFileHelper';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createContext, useCallback } from 'react';
import Modal from 'react-modal';
import { Store } from 'react-notifications-component';

export interface IDownloadFilesDialog {
	/**
	 * open the modal dialog
	 */
	readonly download: (
		projectState: ProjectState,
		changedVolumes: CloudVolumeFile[]
	) => Promise<FileResponse | 'canceled'>;
}

export const DownloadFilesDialogContext = createContext<IDownloadFilesDialog>({
	download: async (
		projectState: ProjectState,
		changedVolumes: CloudVolumeFile[]
	) => {
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

export const DownloadFilesDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const { isOpen, context, resolve, reject, changedVolumes, projectState } =
		useDownloadFilesDialogState();

	const onDownload = useCallback(
		async (save: boolean) => {
			if (
				resolve === undefined ||
				reject === undefined ||
				projectState === undefined
			) {
				console.error('modal state is not correct');
				return;
			}

			if (save && changedVolumes.length > 0) {
				try {
					for (const volume of changedVolumes) {
						if (volume.niivueRef === undefined) return;
						await volume.setBase64(
							await convertVolumeToBase64(volume.niivueRef)
						);
					}

					Store.addNotification({
						message: 'volume edits saved',
						type: 'success',
						insert: 'top',
						container: 'top-right',
						animationIn: ['animate__animated', 'animate__fadeIn'],
						animationOut: ['animate__animated', 'animate__fadeOut'],
						dismiss: {
							duration: 1500,
							onScreen: true,
						},
					});
				} catch (error) {
					console.error('something went wrong', error);
					reject('UNKNOWN_ERROR');
				}
			}

			try {
				resolve(await projectState.apiGetDownload());
			} catch (error) {
				console.error('something went wrong', error);
				reject('UNKNOWN_ERROR');
			}
		},
		[changedVolumes, projectState, resolve, reject]
	);

	return (
		<>
			<DownloadFilesDialogContext.Provider value={context}>
				{children}
			</DownloadFilesDialogContext.Provider>
			<Modal isOpen={isOpen} style={customStyles} contentLabel="Download files">
				<>
					<div className="m-4 flex items-center gap-4">
						<h1 className="mr-12 text-xl font-bold text-gray-500">
							You have unsaved changes!
						</h1>
					</div>
					<div className="m-4">
						You can save & download including your changes, discard your changes
						and download with latest state, or cancel to continue editing.
					</div>
					<button
						onClick={() => resolve?.('canceled')}
						className="absolute right-0 top-0 p-2 text-gray-600"
					>
						<XMarkIcon className="h-6 w-6 shrink-0"></XMarkIcon>
					</button>

					<div className="m-2 flex justify-end">
						<button
							className="m-2 rounded-md bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500"
							onClick={() => resolve?.('canceled')}
						>
							Cancel
						</button>
						<button
							className="m-2 rounded-md bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500"
							onClick={() => {
								void onDownload(false);
							}}
						>
							Download
						</button>
						<button
							className="m-2 rounded-md bg-gray-500 px-5 py-3 text-sm font-semibold text-white"
							onClick={() => {
								void onDownload(true);
							}}
						>
							Save & Download
						</button>
					</div>
				</>
			</Modal>
		</>
	);
};
