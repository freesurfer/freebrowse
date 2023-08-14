import {
	FileLocation,
	ProjectFileBase,
} from '@/pages/project/models/file/ProjectFile';

/**
 * files stored in the backend
 */
export abstract class CloudFile extends ProjectFileBase {
	public readonly location = FileLocation.CLOUD;

	constructor(
		private _id: number,
		name: string,
		/**
		 * url for niivue to load the image from
		 */
		public url: string
	) {
		super(name);
	}

	get id(): number {
		return this._id;
	}

	/**
	 * should only get used, after the same file has been recreated on the backend
	 */
	protected set id(id: number) {
		this._id = id;
	}
}
