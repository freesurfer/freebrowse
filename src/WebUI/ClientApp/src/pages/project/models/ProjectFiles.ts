import type {
	SurfaceDto,
	VolumeDto,
	ProjectDto,
	VolumeDto2,
	SurfaceDto2,
} from '@/generated/web-api-client';
import {
	LocalFile,
	CloudSurfaceFile,
	CloudVolumeFile,
	LocalSurfaceFile,
	LocalVolumeFile,
} from '@/pages/project/models/ProjectFile';
import type {
	ProjectFile,
	ProjectSurfaceFile,
	ProjectVolumeFile,
} from '@/pages/project/models/ProjectFile';

/**
 * mutable instance keeps the state of the project files
 * there are two kinds of files.
 * - the once loaded already
 * - the once the user opened from the drive, which need to get uploaded
 */
export class ProjectFiles {
	private readonly localSurfaces: readonly LocalSurfaceFile[];
	private readonly localVolumes: readonly LocalVolumeFile[];
	public readonly cloudSurfaces: readonly CloudSurfaceFile[];
	public readonly cloudVolumes: readonly CloudVolumeFile[];

	public readonly surfaces: readonly ProjectSurfaceFile[];
	public readonly volumes: readonly ProjectVolumeFile[];
	public readonly all: readonly ProjectFile[];

	/**
	 * the project files instance can be created
	 * - empty
	 * - from another project files instance
	 * - from a given backendState state
	 */
	constructor(
		initState?:
			| { backendState: ProjectDto }
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
			this.localSurfaces = [];
			this.localVolumes = [];
			this.cloudSurfaces = [];
			this.cloudVolumes = [];
			this.surfaces = [];
			this.volumes = [];
			this.all = [];
			return;
		}

		if ('backendState' in initState) {
			// new class from given backend state
			this.localSurfaces = [];
			this.localVolumes = [];
			this.cloudSurfaces = ProjectFiles.cloudFileFromSurfaceDto(
				initState.backendState.surfaces
			);
			this.cloudVolumes = ProjectFiles.cloudFileFromVolumeDto(
				initState.backendState.volumes
			);
		} else {
			// new class from given file set
			this.localSurfaces = initState.localSurfaceFiles;
			this.localVolumes = initState.localVolumeFiles;
			this.cloudSurfaces = initState.cloudSurfaceFiles;
			this.cloudVolumes = initState.cloudVolumeFiles;
		}

		this.surfaces = [...this.cloudSurfaces, ...this.localSurfaces];
		this.volumes = [...this.cloudVolumes, ...this.localVolumes];
		this.all = [...this.surfaces, ...this.volumes];
	}

	/**
	 * for drop zone
	 * add list of added local files to the localFile list
	 */
	public fromAddedLocalFiles(files: File[]): ProjectFiles {
		const newFiles = files
			.map((newFile) => {
				// do not add if file name exists already
				if (this.all.find((file) => file.name === newFile.name) !== undefined)
					return undefined;
				return LocalFile.fromFile(newFile);
			})
			.filter(
				(file): file is LocalSurfaceFile | LocalVolumeFile => file !== undefined
			);

		return new ProjectFiles({
			cloudVolumeFiles: [...this.cloudVolumes],
			cloudSurfaceFiles: [...this.cloudSurfaces],
			localVolumeFiles: [
				...this.localVolumes,
				...newFiles.filter(
					(newFile): newFile is LocalVolumeFile =>
						newFile instanceof LocalVolumeFile
				),
			],
			localSurfaceFiles: [
				...this.localSurfaces,
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
				...this.cloudSurfaces.filter((file) => file.name !== fileNameToDelete),
			],
			cloudVolumeFiles: [
				...this.cloudVolumes.filter((file) => file.name !== fileNameToDelete),
			],
			localSurfaceFiles: [
				...this.localSurfaces.filter((file) => file.name !== fileNameToDelete),
			],
			localVolumeFiles: [
				...this.localVolumes.filter((file) => file.name !== fileNameToDelete),
			],
		});
	}

	public async getLocalVolumesToUpload(): Promise<VolumeDto2[]> {
		return await Promise.all(
			this.localVolumes.map(async (file) => await file.toVolumeDto2())
		);
	}

	public async getLocalSurfacesToUpload(): Promise<SurfaceDto2[]> {
		return await Promise.all(
			this.localSurfaces.map(async (file) => await file.toSurfaceDto2())
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
