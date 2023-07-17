import {
	FileLocation,
	ProjectFileBase,
} from '@/pages/project/models/file/ProjectFile';

/**
 * files only cached in the memory, in general because they have not been uploaded yet
 */
export abstract class CachedFile<T_DATA> extends ProjectFileBase {
	public readonly location = FileLocation.CACHED;

	constructor(
		name: string,
		/**
		 * the data wrapper is used to manage the temporary and usable data in the memory
		 * and to guide the developer to only use the defined ways to construct it and use it immutable
		 */
		public readonly data: T_DATA
	) {
		super(name);
	}

	getBase64(): string {
		return btoa(JSON.stringify(this.data));
	}
}
