import { ProjectFileBase } from '@/pages/project/models/file/ProjectFile';
import { convertFileToBase64 } from '@/pages/project/models/file/ProjectFileHelper';

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

	async getBase64(): Promise<string> {
		return await convertFileToBase64(this.file);
	}
}
