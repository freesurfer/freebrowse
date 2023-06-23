import type {
	CreateVolumeResponseDto,
	CreateSurfaceResponseDto,
	GetProjectDto,
	GetProjectVolumeDto,
	GetProjectSurfaceDto,
} from '@/generated/web-api-client';
import { CloudFile } from '@/pages/project/models/file/CloudFile';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import {
	FileType,
	type ProjectFile,
} from '@/pages/project/models/file/ProjectFile';
import type { SurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/VolumeFile';

/**
 * mutable instance keeps the state of the project files
 * there are two kinds of files.
 * - the once loaded already
 * - the once the user opened from the drive, which need to get uploaded
 */
export class ProjectFiles {
	public readonly localSurfaces: readonly LocalSurfaceFile[];
	public readonly localVolumes: readonly LocalVolumeFile[];
	public readonly cloudSurfaces: readonly CloudSurfaceFile[];
	public readonly cloudVolumes: readonly CloudVolumeFile[];

	public readonly surfaces: readonly SurfaceFile[];
	public readonly volumes: readonly VolumeFile[];
	public readonly all: readonly ProjectFile[];

	/**
	 * the project files instance can be created
	 * - empty
	 * - from another project files instance
	 * - from a given backendState state
	 */
	constructor(
		initState?:
			| { backendState: GetProjectDto }
			| {
					localSurfaces: readonly LocalSurfaceFile[];
					localVolumes: readonly LocalVolumeFile[];
					cloudSurfaces: readonly CloudSurfaceFile[];
					cloudVolumes: readonly CloudVolumeFile[];
					surfaces: readonly SurfaceFile[];
					volumes: readonly VolumeFile[];
					all: readonly ProjectFile[];
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
			this.cloudVolumes = ProjectFiles.cloudFileFromVolumeDto(
				initState.backendState.volumes
			);
			this.cloudSurfaces = ProjectFiles.cloudFileFromSurfaceDto(
				initState.backendState.surfaces
			);
			this.surfaces = [...this.cloudSurfaces, ...this.localSurfaces];
			this.volumes = [...this.cloudVolumes, ...this.localVolumes];
			this.all = [...this.surfaces, ...this.volumes];
			return;
		}

		// new class from given file set
		this.localSurfaces = initState.localSurfaces;
		this.localVolumes = initState.localVolumes;
		this.cloudSurfaces = initState.cloudSurfaces;
		this.cloudVolumes = initState.cloudVolumes;
		this.surfaces = initState.surfaces;
		this.volumes = initState.volumes;
		this.all = initState.all;
	}

	/**
	 * immutable instance recreation for volumes
	 * for adapted file metadata like
	 * - order
	 * - isActive
	 * - isChecked
	 * - opacity
	 * - ...
	 */
	public fromAdaptedVolumes(newVolumes: VolumeFile[]): ProjectFiles {
		const localVolumes = newVolumes.filter(
			(volume): volume is LocalVolumeFile => volume instanceof LocalVolumeFile
		);
		const cloudVolumes = newVolumes.filter(
			(volume): volume is CloudVolumeFile => volume instanceof CloudVolumeFile
		);
		const volumes = [...localVolumes, ...cloudVolumes];

		return new ProjectFiles({
			localVolumes,
			localSurfaces: this.localSurfaces,
			cloudVolumes,
			cloudSurfaces: this.cloudSurfaces,
			surfaces: this.surfaces,
			volumes,
			all: [...this.surfaces, ...volumes],
		});
	}

	/**
	 * when the user clicks on a volume, we want to highlight only that one volume as active and deactivate all the others
	 */
	public fromOneVolumeActivated(volume: VolumeFile): ProjectFiles {
		const localVolumes = this.localVolumes.map((file) =>
			file.from({ isActive: file === volume })
		);
		const localSurfaces = this.localSurfaces.map((file) =>
			file.from({ isActive: false })
		);
		const cloudVolumes = this.cloudVolumes.map((file) =>
			file.from({ isActive: file === volume })
		);
		const cloudSurfaces = this.cloudSurfaces.map((file) =>
			file.from({ isActive: false })
		);
		const surfaces = [...cloudSurfaces, ...localSurfaces];
		const volumes = [...cloudVolumes, ...localVolumes];
		const all = [...surfaces, ...volumes];

		return new ProjectFiles({
			localVolumes,
			localSurfaces,
			cloudVolumes,
			cloudSurfaces,
			surfaces,
			volumes,
			all,
		});
	}

	/**
	 * immutable instance recreation for surfaces
	 * for adapted file metadata like
	 * - order
	 * - isActive
	 * - isChecked
	 * - opacity
	 * - ...
	 */
	public fromAdaptedSurfaces(newSurfaces: SurfaceFile[]): ProjectFiles {
		const localSurfaces = newSurfaces.filter(
			(surface): surface is LocalSurfaceFile =>
				surface instanceof LocalSurfaceFile
		);
		const cloudSurfaces = newSurfaces.filter(
			(surface): surface is CloudSurfaceFile =>
				surface instanceof CloudSurfaceFile
		);

		const surfaces = [...cloudSurfaces, ...localSurfaces];
		const all = [...surfaces, ...this.volumes];

		return new ProjectFiles({
			localVolumes: this.localVolumes,
			localSurfaces,
			cloudVolumes: this.cloudVolumes,
			cloudSurfaces,
			surfaces,
			volumes: this.volumes,
			all,
		});
	}

	/**
	 * when the user clicks on a surface, we want to highlight only that one surface as active and deactivate all the others
	 */
	public fromOneSurfaceActivated(surface: SurfaceFile): ProjectFiles {
		const localVolumes = this.localVolumes.map((file) =>
			file.from({ isActive: false })
		);
		const localSurfaces = this.localSurfaces.map((file) =>
			file.from({ isActive: file === surface })
		);
		const cloudVolumes = this.cloudVolumes.map((file) =>
			file.from({ isActive: false })
		);
		const cloudSurfaces = this.cloudSurfaces.map((file) =>
			file.from({ isActive: file === surface })
		);

		const surfaces = [...cloudSurfaces, ...localSurfaces];
		const volumes = [...cloudVolumes, ...localVolumes];
		const all = [...surfaces, ...volumes];

		return new ProjectFiles({
			localVolumes,
			localSurfaces,
			cloudVolumes,
			cloudSurfaces,
			volumes,
			surfaces,
			all,
		});
	}

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
				switch (CloudFile.typeFromFileExtension(newFile.name)) {
					case FileType.VOLUME:
						return new LocalVolumeFile(newFile);
					case FileType.SURFACE:
						return new LocalSurfaceFile(newFile);
				}
				return undefined;
			})
			.filter(
				(file): file is LocalSurfaceFile | LocalVolumeFile => file !== undefined
			);

		const newVolumes = newFiles.filter(
			(newFile): newFile is LocalVolumeFile =>
				newFile instanceof LocalVolumeFile
		);
		const localVolumes = [...this.localVolumes, ...newVolumes];

		const newSurfaces = newFiles.filter(
			(newFile): newFile is LocalSurfaceFile =>
				newFile instanceof LocalSurfaceFile
		);
		const localSurfaces = [...this.localSurfaces, ...newSurfaces];

		const volumes = [...localVolumes, ...this.cloudVolumes];
		const surfaces = [...localSurfaces, ...this.cloudSurfaces];

		return new ProjectFiles({
			cloudVolumes: this.cloudVolumes,
			cloudSurfaces: this.cloudSurfaces,
			localVolumes,
			localSurfaces,
			volumes,
			surfaces,
			all: [...volumes, ...surfaces],
		});
	}

	public fromDeletedFile(fileNameToDelete: string): ProjectFiles {
		const cloudSurfaces = [
			...this.cloudSurfaces.filter((file) => file.name !== fileNameToDelete),
		];
		const cloudVolumes = [
			...this.cloudVolumes.filter((file) => file.name !== fileNameToDelete),
		];
		const localSurfaces = [
			...this.localSurfaces.filter((file) => file.name !== fileNameToDelete),
		];
		const localVolumes = [
			...this.localVolumes.filter((file) => file.name !== fileNameToDelete),
		];

		const surfaces = [...cloudSurfaces, ...localSurfaces];
		const volumes = [...cloudVolumes, ...localVolumes];
		const all = [...surfaces, ...volumes];

		return new ProjectFiles({
			cloudSurfaces,
			cloudVolumes,
			localSurfaces,
			localVolumes,
			surfaces,
			volumes,
			all,
		});
	}

	public fromUploadedSurfaces(
		uploadResponses: CreateSurfaceResponseDto[]
	): ProjectFiles {
		const cloudSurfaces = [
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
					localFile.size,
					localFile.isActive,
					localFile.isChecked,
					localFile.order,
					localFile.opacity
				);
			}),
		];

		const localSurfaces = [
			...this.localSurfaces.filter(
				(localSurface) =>
					!uploadResponses
						.map((uploadResponse) => uploadResponse.fileName)
						.includes(localSurface.name)
			),
		];

		const surfaces = [...cloudSurfaces, ...localSurfaces];

		return new ProjectFiles({
			cloudSurfaces,
			cloudVolumes: this.cloudVolumes,
			localSurfaces,
			localVolumes: this.localVolumes,
			surfaces,
			volumes: this.volumes,
			all: [...surfaces, ...this.volumes],
		});
	}

	/**
	 * removes the local files and adding the uploaded once instead to the file state
	 */
	public fromUploadedVolumes(
		uploadResponses: CreateVolumeResponseDto[]
	): ProjectFiles {
		const cloudVolumes = [
			...this.cloudVolumes,
			...uploadResponses.map((uploadResponse) => {
				if (uploadResponse.id === undefined)
					throw new Error('there needs to be a id for each cloud file');
				if (uploadResponse.fileName === undefined)
					throw new Error('there needs to be a name for each cloud file');
				if (uploadResponse.fileSize === undefined)
					throw new Error('there needs to be a fileSize for each cloud file');
				if (uploadResponse.order === undefined)
					throw new Error('there needs to be a order for each cloud file');
				if (uploadResponse.opacity === undefined)
					throw new Error('there needs to be a opacity for each cloud file');

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
					uploadResponse.fileSize,
					localFile.isActive,
					localFile.isChecked,
					uploadResponse.order,
					uploadResponse.opacity,
					uploadResponse.contrastMin,
					uploadResponse.contrastMax
				);
			}),
		];

		const localVolumes = [
			...this.localVolumes.filter(
				(localVolume) =>
					!uploadResponses
						.map((uploadResponse) => uploadResponse.fileName)
						.includes(localVolume.name)
			),
		];

		const volumes = [...cloudVolumes, ...localVolumes];

		return new ProjectFiles({
			cloudSurfaces: this.cloudSurfaces,
			cloudVolumes,
			localSurfaces: this.localSurfaces,
			localVolumes,
			surfaces: this.surfaces,
			volumes,
			all: [...this.surfaces, ...volumes],
		});
	}

	/**
	 * method to add a new local file as overlay to the given surface
	 */
	public fromAddedLocalSurfaceOverlay(
		surface: SurfaceFile,
		file: File
	): ProjectFiles {
		const isLocal = surface instanceof LocalSurfaceFile;
		const localSurfaces = isLocal
			? this.localSurfaces.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddedOverlay(file)
						: localSurface
			  )
			: this.localSurfaces;

		const isCloud = surface instanceof CloudSurfaceFile;
		const cloudSurfaces = isCloud
			? this.cloudSurfaces.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddedOverlay(file)
						: localSurface
			  )
			: this.cloudSurfaces;

		const surfaces = [...localSurfaces, ...cloudSurfaces];

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			localVolumes: this.localVolumes,
			cloudVolumes: this.cloudVolumes,
			surfaces,
			volumes: this.volumes,
			all: [...surfaces, ...this.volumes],
		});
	}

	private static cloudFileFromVolumeDto(
		fileModel: GetProjectVolumeDto[] | undefined
	): CloudVolumeFile[] {
		if (fileModel === undefined) return [];

		return fileModel.map<CloudVolumeFile>((fileDto) => {
			if (fileDto === undefined)
				throw new Error('undefined array entry is not allowed');

			if (fileDto?.id === undefined) throw new Error('no file without file id');

			if (fileDto?.fileName === undefined)
				throw new Error('no file without file name');

			if (fileDto?.fileSize === undefined)
				throw new Error('no file without file size');

			return new CloudVolumeFile(
				fileDto.id,
				fileDto.fileName,
				fileDto.fileSize,
				false,
				fileDto.visible,
				fileDto.order,
				fileDto.opacity ?? 100,
				fileDto.contrastMin ?? 0,
				fileDto.contrastMax ?? 100
			);
		});
	}

	private static cloudFileFromSurfaceDto(
		fileModel: GetProjectSurfaceDto[] | undefined
	): CloudSurfaceFile[] {
		if (fileModel === undefined) return [];
		return fileModel.map<CloudSurfaceFile>((fileDto) => {
			if (fileDto === undefined)
				throw new Error('undefined array entry is not allowed');

			if (fileDto?.id === undefined) throw new Error('no file without file id');

			if (fileDto?.fileName === undefined)
				throw new Error('no file without file name');

			if (fileDto?.fileSize === undefined)
				throw new Error('no file without file size');

			return new CloudSurfaceFile(
				fileDto.id,
				fileDto.fileName,
				fileDto.fileSize,
				false,
				fileDto.visible,
				fileDto.order,
				fileDto.opacity ?? 100
			);
		});
	}
}
