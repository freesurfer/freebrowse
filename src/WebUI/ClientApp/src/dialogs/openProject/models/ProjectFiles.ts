import {
	LocalFile,
	CloudSurfaceFile,
	CloudVolumeFile,
	LocalSurfaceFile,
	LocalVolumeFile,
} from '@/dialogs/openProject/models/ProjectFile';
import type {
	ProjectFile,
	ProjectSurfaceFile,
	ProjectVolumeFile,
} from '@/dialogs/openProject/models/ProjectFile';
import type {
	SurfaceDto,
	VolumeDto,
	ProjectDto,
	VolumeDto2,
	SurfaceDto2,
} from '@/generated/web-api-client';

/**
 * mutable instance keeps the state of the project files
 * there are two kinds of files.
 * - the once loaded already
 * - the once the user opened from the drive, which need to get uploaded
 */
export class ProjectFiles {
	private readonly localSurfaceFiles: readonly LocalSurfaceFile[];
	private readonly localVolumeFiles: readonly LocalVolumeFile[];
	private readonly cloudSurfaceFiles: readonly CloudSurfaceFile[];
	private readonly cloudVolumeFiles: readonly CloudVolumeFile[];

	public readonly surfaceFiles: readonly ProjectSurfaceFile[];
	public readonly volumeFiles: readonly ProjectVolumeFile[];
	public readonly files: readonly ProjectFile[];

	/**
	 * the project files instance can be created
	 * - empty
	 * - from another project files instance
	 * - from a given projectDto state
	 */
	constructor(
		initState?:
			| { projectDto: ProjectDto }
			| {
					localSurfaceFiles: readonly LocalSurfaceFile[];
					localVolumeFiles: readonly LocalVolumeFile[];
					cloudSurfaceFiles: readonly CloudSurfaceFile[];
					cloudVolumeFiles: readonly CloudVolumeFile[];
			  }
			| undefined
	) {
		if (initState === undefined) {
			// new empty class
			this.localSurfaceFiles = [];
			this.localVolumeFiles = [];
			this.cloudSurfaceFiles = [];
			this.cloudVolumeFiles = [];
			this.surfaceFiles = [];
			this.volumeFiles = [];
			this.files = [];
			return;
		}

		if ('projectDto' in initState) {
			// new class from given backend state
			this.localSurfaceFiles = [];
			this.localVolumeFiles = [];
			this.cloudSurfaceFiles = ProjectFiles.cloudFileFromSurfaceDto(
				initState.projectDto.surfaces
			);
			this.cloudVolumeFiles = ProjectFiles.cloudFileFromVolumeDto(
				initState.projectDto.volumes
			);
		} else {
			// new class from given file set
			this.localSurfaceFiles = initState.localSurfaceFiles;
			this.localVolumeFiles = initState.localVolumeFiles;
			this.cloudSurfaceFiles = initState.cloudSurfaceFiles;
			this.cloudVolumeFiles = initState.cloudVolumeFiles;
		}

		this.surfaceFiles = [...this.cloudSurfaceFiles, ...this.localSurfaceFiles];
		this.volumeFiles = [...this.cloudVolumeFiles, ...this.localVolumeFiles];
		this.files = [...this.surfaceFiles, ...this.volumeFiles];
	}

	/**
	 * for drop zone
	 * add list of added local files to the localFile list
	 */
	public fromAddedLocalFiles(files: File[]): ProjectFiles {
		const newFiles = files
			.map((newFile) => {
				// do not add if file name exists already
				if (this.files.find((file) => file.name === newFile.name) !== undefined)
					return undefined;
				return LocalFile.fromFile(newFile);
			})
			.filter(
				(file): file is LocalSurfaceFile | LocalVolumeFile => file !== undefined
			);

		return new ProjectFiles({
			cloudVolumeFiles: [...this.cloudVolumeFiles],
			cloudSurfaceFiles: [...this.cloudSurfaceFiles],
			localVolumeFiles: [
				...this.localVolumeFiles,
				...newFiles.filter(
					(newFile): newFile is LocalVolumeFile =>
						newFile instanceof LocalVolumeFile
				),
			],
			localSurfaceFiles: [
				...this.localSurfaceFiles,
				...newFiles.filter(
					(newFile): newFile is LocalSurfaceFile =>
						newFile instanceof LocalSurfaceFile
				),
			],
		});
	}

	public fromDeletedFile(fileNameToDelete: string): ProjectFiles {
		return new ProjectFiles({
			cloudSurfaceFiles: [
				...this.cloudSurfaceFiles.filter(
					(file) => file.name !== fileNameToDelete
				),
			],
			cloudVolumeFiles: [
				...this.cloudVolumeFiles.filter(
					(file) => file.name !== fileNameToDelete
				),
			],
			localSurfaceFiles: [
				...this.localSurfaceFiles.filter(
					(file) => file.name !== fileNameToDelete
				),
			],
			localVolumeFiles: [
				...this.localVolumeFiles.filter(
					(file) => file.name !== fileNameToDelete
				),
			],
		});
	}

	public async getLocalVolumesToUpload(): Promise<VolumeDto2[]> {
		return await Promise.all(
			this.localVolumeFiles.map(async (file) => await file.toVolumeDto2())
		);
	}

	public async getLocalSurfacesToUpload(): Promise<SurfaceDto2[]> {
		return await Promise.all(
			this.localSurfaceFiles.map(async (file) => await file.toSurfaceDto2())
		);
	}

	private static cloudFileFromVolumeDto(
		fileModel: VolumeDto[] | undefined
	): CloudVolumeFile[] {
		if (fileModel === undefined) return [];

		return fileModel
			.map<CloudVolumeFile | undefined>((fileDto) => {
				if (fileDto?.fileName === undefined) return undefined;
				return new CloudVolumeFile(fileDto);
			})
			.filter<CloudVolumeFile>(
				(cloudFile): cloudFile is CloudVolumeFile => cloudFile !== undefined
			);
	}

	private static cloudFileFromSurfaceDto(
		fileModel: SurfaceDto[] | undefined
	): CloudSurfaceFile[] {
		if (fileModel === undefined) return [];
		return fileModel
			.map<CloudSurfaceFile | undefined>((fileDto) => {
				if (fileDto?.fileName === undefined) return undefined;
				return new CloudSurfaceFile(fileDto);
			})
			.filter<CloudSurfaceFile>(
				(cloudFile): cloudFile is CloudSurfaceFile => cloudFile !== undefined
			);
	}
}
