import {
	SurfaceDto3,
	SurfaceDto2,
	VolumeDto2,
	VolumeDto3,
} from '@/generated/web-api-client';
import type { SurfaceDto, VolumeDto } from '@/generated/web-api-client';
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

	constructor(public readonly name: string, private readonly size: number) {}

	/**
	 * method to compute a readable representation of the file size
	 */
	public sizeReadable(): string {
		return `${Math.floor(this.size / 10000) / 100} MB`;
	}

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

	constructor(protected readonly file: File) {
		super(file.name, file.size);
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

	async toVolumeDto2(): Promise<VolumeDto2> {
		return new VolumeDto2({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}

	async toVolumeDto3(): Promise<VolumeDto3> {
		return new VolumeDto3({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}
}

export class LocalSurfaceFile extends LocalFile {
	public readonly type = FileType.SURFACE;

	async toSurfaceDto2(): Promise<SurfaceDto2> {
		return new SurfaceDto2({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}

	async toSurfaceDto3(): Promise<SurfaceDto3> {
		return new SurfaceDto3({
			base64: await this.getBase64(),
			fileName: this.name,
		});
	}
}

/**
 * files stored in the backend
 */
export abstract class CloudFile extends ProjectFileBase {
	constructor(
		fileDto: SurfaceDto | VolumeDto,
		public readonly id: number,
		/**
		 * url for niivue to load the image from
		 */
		public readonly url: string
	) {
		if (fileDto.fileName === undefined)
			throw new Error('a cloud file instance need to have a fileName');
		if (fileDto.id === undefined)
			throw new Error('a cloud file instance need to have a id');

		super(fileDto.fileName, fileDto.fileSize ?? 0);
	}
}

export class CloudVolumeFile extends CloudFile {
	public readonly type = FileType.VOLUME;

	constructor(volumeDto: VolumeDto) {
		if (volumeDto.id === undefined)
			throw new Error('no id for cloud volume file');

		super(
			volumeDto,
			volumeDto.id,
			`${getApiUrl()}/api/Volume?Id=${String(volumeDto.id)}`
		);
	}
}

export class CloudSurfaceFile extends CloudFile {
	public readonly type = FileType.SURFACE;

	constructor(surfaceDto: SurfaceDto) {
		if (surfaceDto.id === undefined)
			throw new Error('no id for cloud surface file');

		super(
			surfaceDto,
			surfaceDto.id,
			`${getApiUrl()}/api/Surface?Id=${String(surfaceDto.id)}`
		);
	}
}

export type ProjectSurfaceFile = CloudSurfaceFile | LocalSurfaceFile;
export type ProjectVolumeFile = CloudVolumeFile | LocalVolumeFile;
export type ProjectFile = CloudFile | LocalFile;
