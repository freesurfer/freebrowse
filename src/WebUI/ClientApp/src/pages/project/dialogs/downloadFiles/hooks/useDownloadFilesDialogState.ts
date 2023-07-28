import type { FileResponse } from '@/generated/web-api-client';
import type { IDownloadFilesDialog } from '@/pages/project/dialogs/downloadFiles/DownloadFilesDialog';
import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import type { NVImage } from '@niivue/niivue';
import { useState } from 'react';

interface IModalHandle {
	resolve: ((value: FileResponse | 'canceled') => void) | undefined;
	reject: ((error: string) => void) | undefined;
	changedVolumes: {
		cloudVolume: CloudVolumeFile;
		niivueVolume: NVImage | undefined;
	}[];
	projectId: number;
}

export const useDownloadFilesDialogState = (): {
	context: IDownloadFilesDialog;
	isOpen: boolean;
} & IModalHandle => {
	const [state, setState] = useState<IModalHandle | undefined>(undefined);

	const download = async (
		projectId: number,
		changedVolumes: {
			cloudVolume: CloudVolumeFile;
			niivueVolume: NVImage | undefined;
		}[]
	): Promise<FileResponse | 'canceled'> => {
		if (state !== undefined) throw new Error('DIALOG_OPENED_ALREADY');

		const promise = new Promise<FileResponse | 'canceled'>(
			(resolve, reject) => {
				setState({
					resolve: (result) => {
						if (result === 'canceled') {
							resolve('canceled');
							return;
						}
						if (result === undefined) return;
						resolve(result);
					},
					reject,
					changedVolumes,
					projectId,
				});
			}
		);

		// close modal dialog on any result
		promise.finally(() => setState(undefined));
		return await promise;
	};

	return {
		isOpen: state !== undefined,
		resolve: state?.resolve,
		reject: state?.reject,
		context: { download },
		changedVolumes: state?.changedVolumes ?? [],
		projectId: state?.projectId ?? 0,
	};
};
