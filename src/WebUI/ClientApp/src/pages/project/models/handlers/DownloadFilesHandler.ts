import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { type CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { convertVolumeToBase64 } from '@/pages/project/models/file/ProjectFileHelper';
import saveAs from 'file-saver';
import { Store } from 'react-notifications-component';

export class DownloadFilesHandler {
	constructor(
		private readonly projectState: ProjectState,
		private readonly niivueWrapper: NiivueWrapper
	) {}

	saveDownloadedAsFile(data: Blob): void {
		saveAs(
			data,
			`${this.projectState.name ?? 'FreeBrowse - Project Files'}.zip`
		);
	}

	async onSaveClick(): Promise<void> {
		const changedVolumes = this.getChangedVolumes();
		if (changedVolumes.length === 0) return;

		changedVolumes.map(async (volume) => {
			if (volume.niivueRef === undefined) return;
			await volume.setBase64(await convertVolumeToBase64(volume.niivueRef));
			volume.setHasChanges(false);
		});

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
	}

	getChangedVolumes(): CloudVolumeFile[] {
		const result = this.projectState.files?.volumes.cloud.filter(
			(volume) => volume.hasChanges && volume.niivueRef !== undefined
		);
		if (result === undefined)
			throw new Error('files not defined - should not happen');
		return result;
	}
}
