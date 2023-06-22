import { ProjectFileBase } from '@/pages/project/models/file/ProjectFile';

/**
 * files added by the user from the hard drive to upload
 */
export abstract class LocalFile extends ProjectFileBase {
	progress = 100;

	constructor(
		protected readonly file: File,
		isActive = false,
		isChecked = true,
		order: number | undefined = undefined,
		opacity = 100
	) {
		super(file.name, file.size, isActive, isChecked, order, opacity);
	}

	protected async getBase64(): Promise<string> {
		return await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(this.file);
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
				const arr = reader.result.split(',');
				const base64 = arr[arr.length - 1];
				if (base64 === undefined) {
					reject(new Error('not possible'));
					return;
				}

				resolve(base64);
			};
			reader.onerror = (error) => {
				reject(error);
			};
		});
	}
}
