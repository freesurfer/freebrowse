import {
	CreateProjectSurfaceDto,
	CreateProjectVolumeDto,
	CreateSurfaceDto,
	CreateVolumeDto,
} from '@/generated/web-api-client';
import { getApiUrl } from '@/utils';

export enum FileType {
	UNKNOWN,
	VOLUME,
	SURFACE,
}

/**
 * all properties each file has
 * probably mostly about the configuration
 */
export abstract class ProjectFileBase {
	readonly selection?: 'grayscale' | 'lookupTable';
	readonly resampleRAS?: boolean;
	abstract readonly type: FileType;

	constructor(
		public readonly name: string,
		public readonly size: number,
		/**
		 * the meta data and tools for the file are accessible
		 */
		public readonly isActive: boolean,
		/**
		 * the file is shown in the diagram
		 */
		public readonly isChecked: boolean,
		public readonly order: number | undefined,
		public readonly opacity: number
	) {}

	/**
	 * method to compute a readable representation of the file size
	 */
	public sizeReadable(): string {
		return `${Math.floor(this.size / 10000) / 100} MB`;
	}

	public abstract fromIsActive(isActive: boolean): ProjectFileBase;
	public abstract fromIsChecked(isChecked: boolean): ProjectFileBase;
	public abstract fromOrder(order: number): ProjectFileBase;

	public static typeFromFileExtension(fileName: string): FileType {
		if (fileName.endsWith('.mgz')) return FileType.VOLUME;
		if (fileName.endsWith('.nii.gz')) return FileType.VOLUME;

		if (fileName.endsWith('.inflated')) return FileType.SURFACE;
		if (fileName.endsWith('.pial')) return FileType.SURFACE;
		if (fileName.endsWith('.white')) return FileType.SURFACE;
		if (fileName.endsWith('.sphere')) return FileType.SURFACE;

		return FileType.UNKNOWN;
	}
}

/**
 * files added by the user from the hard drive to upload
 */
export abstract class LocalFile extends ProjectFileBase {
	progress = 100;

	/**
	 * factory method to create the correct class instance according to the file extension
	 */
	static fromFile(file: File): LocalVolumeFile | LocalSurfaceFile | undefined {
		switch (CloudFile.typeFromFileExtension(file.name)) {
			case FileType.VOLUME:
				return new LocalVolumeFile(file);
			case FileType.SURFACE:
				return new LocalSurfaceFile(file);
		}
		return undefined;
	}

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

export class LocalVolumeFile extends LocalFile {
	public readonly type = FileType.VOLUME;

	constructor(
		file: File,
		isActive = false,
		isChecked?: boolean,
		order?: number | undefined,
		opacity?: number,
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		super(file, isActive, isChecked, order, opacity);
	}

	async toCreateProjectVolumeDto(): Promise<CreateProjectVolumeDto> {
		return new CreateProjectVolumeDto({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}

	async toCreateVolumeDto(): Promise<CreateVolumeDto> {
		return new CreateVolumeDto({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}

	public override fromIsActive(isActive: boolean): LocalVolumeFile {
		return new LocalVolumeFile(
			this.file,
			isActive,
			this.isChecked,
			this.order,
			this.opacity,
			this.contrastMin,
			this.contrastMax
		);
	}

	public override fromIsChecked(isChecked: boolean): LocalVolumeFile {
		return new LocalVolumeFile(
			this.file,
			this.isActive,
			isChecked,
			this.order,
			this.opacity,
			this.contrastMin,
			this.contrastMax
		);
	}

	public override fromOrder(order: number): LocalVolumeFile {
		return new LocalVolumeFile(
			this.file,
			this.isActive,
			this.isChecked,
			order,
			this.opacity,
			this.contrastMin,
			this.contrastMax
		);
	}
}

export class LocalSurfaceFile extends LocalFile {
	public readonly type = FileType.SURFACE;

	async toCreateProjectSurfaceDto(): Promise<CreateProjectSurfaceDto> {
		return new CreateProjectSurfaceDto({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}

	async toCreateSurfaceDto(): Promise<CreateSurfaceDto> {
		return new CreateSurfaceDto({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}

	public override fromIsActive(isActive: boolean): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			isActive,
			this.isChecked,
			this.order,
			this.opacity
		);
	}

	public override fromIsChecked(isChecked: boolean): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			isChecked,
			this.order,
			this.opacity
		);
	}

	public override fromOrder(order: number): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			this.isChecked,
			order,
			this.opacity
		);
	}
}

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

export class CloudVolumeFile extends CloudFile {
	public readonly type = FileType.VOLUME;

	constructor(
		id: number,
		name: string,
		size: number,
		isActive = false,
		isChecked = true,
		order: number | undefined,
		opacity: number,
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		if (id === undefined) throw new Error('no id for cloud volume file');
		super(
			id,
			name,
			size,
			`${getApiUrl()}/api/Volume?Id=${String(id)}`,
			isActive,
			isChecked,
			order,
			opacity
		);
	}

	public override fromIsActive(isActive: boolean): CloudVolumeFile {
		return new CloudVolumeFile(
			this.id,
			this.name,
			this.size,
			isActive,
			this.isChecked,
			this.order,
			this.opacity,
			this.contrastMin,
			this.contrastMax
		);
	}

	public override fromIsChecked(isChecked: boolean): CloudVolumeFile {
		return new CloudVolumeFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			isChecked,
			this.order,
			this.opacity,
			this.contrastMin,
			this.contrastMax
		);
	}

	public override fromOrder(order: number): CloudVolumeFile {
		return new CloudVolumeFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			this.isChecked,
			order,
			this.opacity,
			this.contrastMin,
			this.contrastMax
		);
	}
}

export class CloudSurfaceFile extends CloudFile {
	public readonly type = FileType.SURFACE;

	constructor(
		id: number,
		name: string,
		size: number,
		isActive = false,
		isChecked = true,
		order: number | undefined,
		opacity: number
	) {
		if (id === undefined) throw new Error('no id for cloud surface file');
		super(
			id,
			name,
			size,
			`${getApiUrl()}/api/Surface?Id=${String(id)}`,
			isActive,
			isChecked,
			order,
			opacity
		);
	}

	public override fromIsActive(isActive: boolean): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			isActive,
			this.isChecked,
			this.order,
			this.opacity
		);
	}

	public override fromIsChecked(isChecked: boolean): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			isChecked,
			this.order,
			this.opacity
		);
	}

	public override fromOrder(order: number): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			this.isChecked,
			order,
			this.opacity
		);
	}
}

export type ProjectSurfaceFile = CloudSurfaceFile | LocalSurfaceFile;
export type ProjectVolumeFile = CloudVolumeFile | LocalVolumeFile;
export type ProjectFile = ProjectSurfaceFile | ProjectVolumeFile;
