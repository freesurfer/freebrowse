import {
	FileLocation,
	ProjectFileBase,
} from '@/pages/project/models/file/ProjectFile';
import { convertFileToBase64 } from '@/pages/project/models/file/ProjectFileHelper';

/**
 * files added by the user from the hard drive to upload
 */
export abstract class LocalFile extends ProjectFileBase {
	public readonly location = FileLocation.LOCAL;
	public readonly uniqueName: string;

	constructor(protected readonly file: File) {
		super(file.name);
		this.uniqueName = `local${this.name}`;
	}

	async getBase64(): Promise<string> {
		return await convertFileToBase64(this.file);
	}
}
