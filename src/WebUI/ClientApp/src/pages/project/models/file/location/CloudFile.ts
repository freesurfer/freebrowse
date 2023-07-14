import {
	FileLocation,
	ProjectFileBase,
} from '@/pages/project/models/file/ProjectFile';

/**
 * files stored in the backend
 */
export abstract class CloudFile extends ProjectFileBase {
	public readonly location = FileLocation.CLOUD;
	public readonly uniqueName: string;

	constructor(
		public readonly id: number,
		name: string,
		/**
		 * url for niivue to load the image from
		 */
		public readonly url: string
	) {
		super(name);
		this.uniqueName = `cloud${this.id}${this.name}`;
	}
}
