import type {
	SurfaceDto,
	VolumeDto,
	ProjectDto,
} from '@/generated/web-api-client';
import { VolumeDto2, SurfaceDto2 } from '@/generated/web-api-client';
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

	constructor(
		public readonly name: string,
		public readonly type: FileType,
		private readonly size: number
	) {}

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
export class LocalFile extends ProjectFileBase {
	progress = 100;

	constructor(protected readonly file: File) {
		super(file.name, CloudFile.typeFromFileExtension(file.name), file.size);
	}

	public async getBase64(): Promise<string> {
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

/**
 * files stored in the backend
 */
export class CloudFile extends ProjectFileBase {
	public readonly url: string;

	private constructor(
		fileDto: SurfaceDto | VolumeDto,
		fileType: FileType,
		size: number | undefined
	) {
		if (fileDto.fileName === undefined)
			throw new Error('a cloud file instance need to have a fileName');
		if (fileDto.id === undefined)
			throw new Error('a cloud file instance need to have a id');
		if (CloudFile.typeFromFileExtension(fileDto.fileName) !== fileType)
			throw new Error('the file type does not match the file name extension');

		// TODO bere - add size from backend
		super(fileDto.fileName, fileType, size ?? 0);

		this.url = `${getApiUrl()}/api/Volume?Id=${String(fileDto.id)}`;
	}

	public static fromVolume(volumeDto: VolumeDto): CloudFile {
		return new CloudFile(volumeDto, FileType.VOLUME, volumeDto.fileSize);
	}

	public static fromSurface(surfaceDto: SurfaceDto): CloudFile {
		return new CloudFile(surfaceDto, FileType.SURFACE, surfaceDto.fileSize);
	}
}

export type ProjectFile = CloudFile | LocalFile;

/**
 * mutable instance keeps the state of the project files
 * there are two kinds of files.
 * - the once loaded already
 * - the once the user opened from the drive, which need to get uploaded
 */
export class ProjectFiles {
	private readonly cloudFiles: readonly CloudFile[] = [];

	private readonly localFiles: readonly LocalFile[] = [];

	/**
	 * the project files instance can be created
	 * - empty
	 * - from another project files instance
	 * - from a given projectDto state
	 */
	constructor(
		initState?:
			| { projectDto: ProjectDto }
			| { cloudFiles: readonly CloudFile[]; localFiles: readonly LocalFile[] }
			| undefined
	) {
		if (initState === undefined) return;

		if ('projectDto' in initState) {
			this.cloudFiles = [
				...ProjectFiles.cloudFileFromVolumeDto(initState.projectDto.volumes),
				...ProjectFiles.cloudFileFromSurfaceDto(initState.projectDto.surfaces),
			];
			return;
		}

		// create new instance of class for state management
		this.localFiles = initState.localFiles;
		this.cloudFiles = initState.cloudFiles;
	}

	public get files(): readonly ProjectFile[] {
		return [...this.cloudFiles, ...this.localFiles];
	}

	public get surfaces(): readonly ProjectFile[] {
		return this.files.filter((file) => file.type === FileType.SURFACE);
	}

	public get volumes(): readonly ProjectFile[] {
		return this.files.filter((file) => file.type === FileType.VOLUME);
	}

	/**
	 * for drop zone
	 * add list of added local files to the localFile list
	 */
	public fromAddedLocalFiles(files: File[]): ProjectFiles {
		const newFiles = files
			.map((newFile) => {
				// remove duplicates
				if (this.files.find((file) => file.name === newFile.name) !== undefined)
					return undefined;
				return new LocalFile(newFile);
			})
			.filter((file): file is LocalFile => file !== undefined);

		return new ProjectFiles({
			cloudFiles: [...this.cloudFiles],
			localFiles: [...this.localFiles, ...newFiles],
		});
	}

	public fromDeletedFile(fileNameToDelete: string): ProjectFiles {
		return new ProjectFiles({
			cloudFiles: [
				...this.cloudFiles.filter((file) => file.name !== fileNameToDelete),
			],
			localFiles: [
				...this.localFiles.filter((file) => file.name !== fileNameToDelete),
			],
		});
	}

	public async getLocalVolumesToUpload(): Promise<VolumeDto2[]> {
		return await Promise.all(
			this.localFiles
				.filter((file) => file.type === FileType.VOLUME)
				.map(
					async (file) =>
						new VolumeDto2({
							base64: await file.getBase64(),
							fileName: file.name,
						})
				)
		);
	}

	public async getLocalSurfacesToUpload(): Promise<SurfaceDto2[]> {
		return await Promise.all(
			this.localFiles
				.filter((file) => file.type === FileType.SURFACE)
				.map(
					async (file) =>
						new SurfaceDto2({
							base64: await file.getBase64(),
							fileName: file.name,
						})
				)
		);
	}

	private static cloudFileFromVolumeDto(
		fileModel: VolumeDto[] | undefined
	): CloudFile[] {
		if (fileModel === undefined) return [];

		return fileModel
			.map<CloudFile | undefined>((fileDto) => {
				if (fileDto?.fileName === undefined) return undefined;
				return CloudFile.fromVolume(fileDto);
			})
			.filter<CloudFile>(
				(cloudFile): cloudFile is CloudFile => cloudFile !== undefined
			);
	}

	private static cloudFileFromSurfaceDto(
		fileModel: SurfaceDto[] | undefined
	): CloudFile[] {
		if (fileModel === undefined) return [];
		return fileModel
			.map<CloudFile | undefined>((fileDto) => {
				if (fileDto?.fileName === undefined) return undefined;
				return CloudFile.fromSurface(fileDto);
			})
			.filter<CloudFile>(
				(cloudFile): cloudFile is CloudFile => cloudFile !== undefined
			);
	}
}
