import type {
	SurfaceDto,
	VolumeDto,
	ProjectDto,
	VolumeDto2,
	SurfaceDto2,
	CreateVolumeResponseDto,
	CreateSurfaceResponseDto,
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
					localSurfaces: readonly LocalSurfaceFile[];
					localVolumes: readonly LocalVolumeFile[];
					cloudSurfaces: readonly CloudSurfaceFile[];
					cloudVolumes: readonly CloudVolumeFile[];
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
			this.localSurfaces = initState.localSurfaces;
			this.localVolumes = initState.localVolumes;
			this.cloudSurfaces = initState.cloudSurfaces;
			this.cloudVolumes = initState.cloudVolumes;
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
			cloudVolumes: [...this.cloudVolumes],
			cloudSurfaces: [...this.cloudSurfaces],
			localVolumes: [
				...this.localVolumes,
				...newFiles.filter(
					(newFile): newFile is LocalVolumeFile =>
						newFile instanceof LocalVolumeFile
				),
			],
			localSurfaces: [
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
			cloudSurfaces: [
				...this.cloudSurfaces.filter((file) => file.name !== fileNameToDelete),
			],
			cloudVolumes: [
				...this.cloudVolumes.filter((file) => file.name !== fileNameToDelete),
			],
			localSurfaces: [
				...this.localSurfaces.filter((file) => file.name !== fileNameToDelete),
			],
			localVolumes: [
				...this.localVolumes.filter((file) => file.name !== fileNameToDelete),
			],
		});
	}

	public fromUploadedSurfaces(
		uploadResponses: CreateSurfaceResponseDto[]
	): ProjectFiles {
		return new ProjectFiles({
			cloudSurfaces: [
				...this.cloudSurfaces,
				...uploadResponses.map((uploadResponse) => {
					if (uploadResponse.id === undefined)
						throw new Error('there needs to be a id for each cloud file');
					if (uploadResponse.fileName === undefined)
						throw new Error('there needs to be a name for each cloud file');

					// workaround as long as we do not receive the size as response
					const localFile = this.localSurfaces.find(
						(localSurface) => localSurface.name === uploadResponse.fileName
					);

					if (localFile === undefined)
						throw new Error(
							'there should be a local file for each uploaded cloud file'
						);

					return new CloudSurfaceFile(
						uploadResponse.id,
						uploadResponse.fileName,
						localFile.size
					);
				}),
			],
			cloudVolumes: this.cloudVolumes,
			localSurfaces: [
				...this.localSurfaces.filter(
					(localSurface) =>
						!uploadResponses
							.map((uploadResponse) => uploadResponse.fileName)
							.includes(localSurface.name)
				),
			],
			localVolumes: this.localVolumes,
		});
	}

	public fromUploadedVolumes(
		uploadResponses: CreateVolumeResponseDto[]
	): ProjectFiles {
		return new ProjectFiles({
			cloudSurfaces: this.cloudSurfaces,
			cloudVolumes: [
				...this.cloudVolumes,
				...uploadResponses.map((uploadResponse) => {
					if (uploadResponse.id === undefined)
						throw new Error('there needs to be a id for each cloud file');
					if (uploadResponse.fileName === undefined)
						throw new Error('there needs to be a name for each cloud file');

					// workaround as long as we do not receive the size as response
					const localFile = this.localVolumes.find(
						(localVolume) => localVolume.name === uploadResponse.fileName
					);

					if (localFile === undefined)
						throw new Error(
							'there should be a local file for each uploaded cloud file'
						);

					return new CloudVolumeFile(
						uploadResponse.id,
						uploadResponse.fileName,
						localFile.size
					);
				}),
			],
			localSurfaces: this.localSurfaces,
			localVolumes: [
				...this.localVolumes.filter(
					(localVolume) =>
						!uploadResponses
							.map((uploadResponse) => uploadResponse.fileName)
							.includes(localVolume.name)
				),
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
			.map<CloudVolumeFile>((fileDto) => {
				if (fileDto === undefined)
					throw new Error('undefined array entry is not allowed');

				if (fileDto?.id === undefined)
					throw new Error('no file without file id');

				if (fileDto?.fileName === undefined)
					throw new Error('no file without file name');

				if (fileDto?.fileSize === undefined)
					throw new Error('no file without file size');

				return new CloudVolumeFile(
					fileDto.id,
					fileDto.fileName,
					fileDto.fileSize
				);
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
				if (fileDto === undefined)
					throw new Error('undefined array entry is not allowed');

				if (fileDto?.id === undefined)
					throw new Error('no file without file id');

				if (fileDto?.fileName === undefined)
					throw new Error('no file without file name');

				if (fileDto?.fileSize === undefined)
					throw new Error('no file without file size');

				return new CloudSurfaceFile(
					fileDto.id,
					fileDto.fileName,
					fileDto.fileSize
				);
			})
			.filter<CloudSurfaceFile>(
				(cloudFile): cloudFile is CloudSurfaceFile => cloudFile !== undefined
			);
	}
}
