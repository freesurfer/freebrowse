import { ProjectFileBase } from '@/pages/project/models/file/ProjectFile';

/**
 * files stored in the backend
 */
export abstract class CloudFile extends ProjectFileBase {
	constructor(
		public readonly id: number,
		name: string,
		size: number,
		/**
		 * url for niivue to load the image from
		 */
		public readonly url: string,
		isActive: boolean,
		isChecked: boolean,
		order: number | undefined,
		opacity: number
	) {
		if (name === undefined)
			throw new Error('a cloud file instance need to have a fileName');
		if (size === undefined)
			throw new Error('a cloud file instance need to have a id');

		super(name, size, isActive, isChecked, order, opacity);
	}
}
