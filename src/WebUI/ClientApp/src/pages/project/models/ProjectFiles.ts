import type {
	CreateVolumeResponseDto,
	CreateSurfaceResponseDto,
	CreateOverlayResponseDto,
	CreateAnnotationResponseDto,
} from '@/generated/web-api-client';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { LocalPointSetFile } from '@/pages/project/models/file/LocalPointSetFile';
import { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import {
	FileType,
	ProjectFileBase,
	type ProjectFile,
} from '@/pages/project/models/file/ProjectFile';
import type { AnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import type { OverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import {
	hexToRgb,
	type PointSetFile,
} from '@/pages/project/models/file/type/PointSetFile';
import type { SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';

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
	public readonly localPointSets: readonly LocalPointSetFile[];
	public readonly cachePointSets: readonly CachePointSetFile[];
	public readonly cloudPointSets: readonly CloudPointSetFile[];

	public readonly surfaces: readonly SurfaceFile[];
	public readonly volumes: readonly VolumeFile[];
	public readonly pointSets: readonly PointSetFile[];

	public readonly all: readonly ProjectFile[];

	/**
	 * the project files instance can be created
	 * - empty
	 * - from another project files instance
	 * - from a given backendState state
	 */
	constructor(
		initState?:
			| {
					projectFiles: ProjectFiles;
					localSurfaces?: readonly LocalSurfaceFile[];
					localVolumes?: readonly LocalVolumeFile[];
					cloudSurfaces?: readonly CloudSurfaceFile[];
					cloudVolumes?: readonly CloudVolumeFile[];
					localPointSets?: readonly LocalPointSetFile[];
					cachePointSets?: readonly CachePointSetFile[];
					cloudPointSets?: readonly CloudPointSetFile[];
			  }
			| undefined
	) {
		if (initState === undefined) {
			// new empty class
			this.localSurfaces = [];
			this.localVolumes = [];
			this.cloudSurfaces = [];
			this.cloudVolumes = [];
			this.localPointSets = [];
			this.cachePointSets = [];
			this.cloudPointSets = [];
			this.surfaces = [];
			this.volumes = [];
			this.pointSets = [];
			this.all = [];
			return;
		}

		// new class from given file set
		this.localSurfaces =
			initState.localSurfaces ?? initState.projectFiles.localSurfaces;
		this.localVolumes =
			initState.localVolumes ?? initState.projectFiles.localVolumes;
		this.cloudSurfaces =
			initState.cloudSurfaces ?? initState.projectFiles.cloudSurfaces;
		this.cloudVolumes =
			initState.cloudVolumes ?? initState.projectFiles.cloudVolumes;
		this.localPointSets =
			initState.localPointSets ?? initState.projectFiles.localPointSets;
		this.cachePointSets =
			initState.cachePointSets ?? initState.projectFiles.cachePointSets;
		this.cloudPointSets =
			initState.cloudPointSets ?? initState.projectFiles.cloudPointSets;

		if (
			initState.localSurfaces !== undefined ||
			initState.cloudSurfaces !== undefined
		) {
			this.surfaces = [...this.localSurfaces, ...this.cloudSurfaces];
		} else {
			this.surfaces = initState.projectFiles.surfaces;
		}

		if (
			initState.localVolumes !== undefined ||
			initState.cloudVolumes !== undefined
		) {
			this.volumes = [...this.localVolumes, ...this.cloudVolumes];
		} else {
			this.volumes = initState.projectFiles.volumes;
		}

		if (
			initState.cachePointSets !== undefined ||
			initState.cloudPointSets !== undefined
		) {
			this.pointSets = [
				...this.localPointSets,
				...this.cachePointSets,
				...this.cloudPointSets,
			];
		} else {
			this.pointSets = initState.projectFiles.pointSets;
		}

		if (
			initState.localSurfaces !== undefined ||
			initState.cloudSurfaces !== undefined ||
			initState.localVolumes !== undefined ||
			initState.cloudVolumes !== undefined ||
			initState.cachePointSets !== undefined
		) {
			this.all = [...this.surfaces, ...this.volumes, ...this.pointSets];
		} else {
			this.all = initState.projectFiles.all;
		}
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

		return new ProjectFiles({
			localVolumes,
			cloudVolumes,
			projectFiles: this,
		});
	}

	/**
	 * when the user clicks on a volume, we want to highlight only that one volume as active and deactivate all the others
	 */
	public fromOneVolumeActivated(volume: VolumeFile): ProjectFiles {
		const localVolumes = this.localVolumes.map((file) =>
			file.from({ isActive: file === volume })
		);

		const localSurfaces =
			this.localSurfaces.find((file) => file.isActive) !== undefined
				? this.localSurfaces.map((file) => file.from({ isActive: false }))
				: undefined;

		const cloudVolumes = this.cloudVolumes.map((file) =>
			file.from({ isActive: file === volume })
		);

		const cloudSurfaces =
			this.cloudSurfaces.find((file) => file.isActive) !== undefined
				? this.cloudSurfaces.map((file) => file.from({ isActive: false }))
				: undefined;

		return new ProjectFiles({
			localVolumes,
			localSurfaces,
			cloudVolumes,
			cloudSurfaces,
			projectFiles: this,
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

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			projectFiles: this,
		});
	}

	/**
	 * immutable instance recreation for point sets
	 * for adapted file metadata like
	 * - order
	 * - isActive
	 * - isChecked
	 * - opacity
	 * - ...
	 */
	public fromAdaptedPointSets(newPointSet: PointSetFile[]): ProjectFiles {
		const cachePointSets = newPointSet.filter(
			(file): file is CachePointSetFile => file instanceof CachePointSetFile
		);
		const cloudPointSets = newPointSet.filter(
			(file): file is CloudPointSetFile => file instanceof CloudPointSetFile
		);

		return new ProjectFiles({
			cachePointSets,
			cloudPointSets,
			projectFiles: this,
		});
	}

	/**
	 * when the user clicks on a surface, we want to highlight only that one surface as active and deactivate all the others
	 */
	public fromOneSurfaceActivated(surface: SurfaceFile): ProjectFiles {
		const localVolumes =
			this.localVolumes.find((file) => file.isActive) !== undefined
				? this.localVolumes.map((file) => file.from({ isActive: false }))
				: undefined;

		const localSurfaces = this.localSurfaces.map((file) =>
			file.from({ isActive: file === surface })
		);

		const cloudVolumes =
			this.cloudVolumes.find((file) => file.isActive) !== undefined
				? this.cloudVolumes.map((file) => file.from({ isActive: false }))
				: undefined;

		const cloudSurfaces = this.cloudSurfaces.map((file) =>
			file.from({ isActive: file === surface })
		);

		return new ProjectFiles({
			localVolumes,
			localSurfaces,
			cloudVolumes,
			cloudSurfaces,
			projectFiles: this,
		});
	}

	/**
	 * when the user clicks on a surface, we want to highlight only that one surface as active and deactivate all the others
	 */
	public fromOnePointSetActivated(pointSet: PointSetFile): ProjectFiles {
		const localPointSets =
			this.localPointSets.find((file) => file === pointSet || file.isActive) !==
			undefined
				? this.localPointSets.map((file) =>
						file.from({ isActive: file === pointSet })
				  )
				: this.localPointSets;

		const cachePointSets =
			this.cachePointSets.find((file) => file === pointSet || file.isActive) !==
			undefined
				? this.cachePointSets.map((file) =>
						file.from({ isActive: file === pointSet })
				  )
				: this.cachePointSets;

		const cloudPointSets =
			this.cloudPointSets.find((file) => file === pointSet || file.isActive) !==
			undefined
				? this.cloudPointSets.map((file) =>
						file.from({ isActive: file === pointSet })
				  )
				: this.cloudPointSets;

		return new ProjectFiles({
			localPointSets,
			cachePointSets,
			cloudPointSets,
			projectFiles: this,
		});
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
				switch (ProjectFileBase.typeFromFileExtension(newFile.name)) {
					case FileType.VOLUME:
						return new LocalVolumeFile(newFile);
					case FileType.SURFACE:
						return new LocalSurfaceFile(newFile);
					case FileType.POINT_SET:
						return new LocalPointSetFile(newFile);
				}
				return undefined;
			})
			.filter(
				(
					file
				): file is LocalSurfaceFile | LocalVolumeFile | LocalPointSetFile =>
					file !== undefined
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

		const newPointSets = newFiles.filter(
			(newFile): newFile is LocalPointSetFile =>
				newFile instanceof LocalPointSetFile
		);
		const localPointSets = [...this.localPointSets, ...newPointSets];

		return new ProjectFiles({
			localVolumes,
			localSurfaces,
			localPointSets,
			projectFiles: this,
		});
	}

	public fromDeletedFile(name: string): ProjectFiles {
		const cloudSurfaces = [
			...this.cloudSurfaces.filter((file) => file.name !== name),
		];
		const cloudVolumes = [
			...this.cloudVolumes.filter((file) => file.name !== name),
		];
		const localSurfaces = [
			...this.localSurfaces.filter((file) => file.name !== name),
		];
		const localVolumes = [
			...this.localVolumes.filter((file) => file.name !== name),
		];
		const localPointSets = [
			...this.localPointSets.filter((file) => file.name !== name),
		];
		const cloudPointSets = [
			...this.cloudPointSets.filter((file) => file.name !== name),
		];

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			localVolumes,
			cloudVolumes,
			localPointSets,
			cloudPointSets,
			projectFiles: this,
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
					localFile.color
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

		return new ProjectFiles({
			cloudSurfaces,
			localSurfaces,
			projectFiles: this,
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
					uploadResponse.colorMap ?? CloudVolumeFile.DEFAULT_COLOR_MAP,
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

		return new ProjectFiles({
			cloudVolumes,
			localVolumes,
			projectFiles: this,
		});
	}

	public fromUploadedOverlays(
		surfaceId: number,
		createOverlayResponseDto: CreateOverlayResponseDto[]
	): ProjectFiles {
		const cloudSurfaces = this.cloudSurfaces.map((surface) =>
			surface.id === surfaceId
				? surface.from({
						overlayFiles: surface.overlayFiles.map((overlay) => {
							if (!(overlay instanceof LocalOverlayFile)) return overlay;
							const overlayDto = createOverlayResponseDto.find(
								(dto) => dto.fileName === overlay.name
							);
							if (overlayDto === undefined) return overlay;

							if (overlayDto.id === undefined)
								throw new Error('no id for uploaded overlay');
							if (overlayDto.fileName === undefined)
								throw new Error('no fileName  for uploaded overlay');
							if (overlayDto.fileSize === undefined)
								throw new Error('no fileSize for uploaded overlay');

							return new CloudOverlayFile(
								overlayDto.id,
								overlayDto.fileName,
								overlayDto.selected ?? false
							);
						}),
				  })
				: surface
		);

		return new ProjectFiles({
			cloudSurfaces,
			projectFiles: this,
		});
	}

	public fromUploadedAnnotations(
		surfaceId: number,
		createAnnotationResponseDto: CreateAnnotationResponseDto[]
	): ProjectFiles {
		const cloudSurfaces = this.cloudSurfaces.map((surface) =>
			surface.id === surfaceId
				? surface.from({
						annotationFiles: surface.annotationFiles.map((annotation) => {
							if (!(annotation instanceof LocalAnnotationFile))
								return annotation;
							const annotationDto = createAnnotationResponseDto.find(
								(dto) => dto.fileName === annotation.name
							);
							if (annotationDto === undefined) return annotation;

							if (annotationDto.id === undefined)
								throw new Error('no id for uploaded annotation');
							if (annotationDto.fileName === undefined)
								throw new Error('no fileName  for uploaded annotation');
							if (annotationDto.fileSize === undefined)
								throw new Error('no fileSize for uploaded annotation');

							return new CloudAnnotationFile(
								annotationDto.id,
								annotationDto.fileName,
								annotationDto.selected ?? false
							);
						}),
				  })
				: surface
		);

		return new ProjectFiles({
			cloudSurfaces,
			projectFiles: this,
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
						? localSurface.fromAddOverlay(file)
						: localSurface
			  )
			: this.localSurfaces;

		const isCloud = surface instanceof CloudSurfaceFile;
		const cloudSurfaces = isCloud
			? this.cloudSurfaces.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddOverlay(file)
						: localSurface
			  )
			: this.cloudSurfaces;

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			projectFiles: this,
		});
	}

	/**
	 * method to add a new local file as annotation to the given surface
	 */
	public fromAddedLocalSurfaceAnnotation(
		surface: SurfaceFile,
		file: File
	): ProjectFiles {
		const isLocal = surface instanceof LocalSurfaceFile;
		const localSurfaces = isLocal
			? this.localSurfaces.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddAnnotation(file)
						: localSurface
			  )
			: this.localSurfaces;

		const isCloud = surface instanceof CloudSurfaceFile;
		const cloudSurfaces = isCloud
			? this.cloudSurfaces.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddAnnotation(file)
						: localSurface
			  )
			: this.cloudSurfaces;

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			projectFiles: this,
		});
	}

	/**
	 * method to delete a overlay file from a surface
	 */
	public fromDeletedOverlay(
		surfaceFile: SurfaceFile,
		overlayFile: OverlayFile
	): ProjectFiles {
		const localSurfaces = this.localSurfaces.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteOverlay(overlayFile)
		);
		const cloudSurfaces = this.cloudSurfaces.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteOverlay(overlayFile)
		);

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			projectFiles: this,
		});
	}

	/**
	 * method to delete a annotation file from a surface
	 */
	public fromDeletedAnnotation(
		surfaceFile: SurfaceFile,
		annotationFile: AnnotationFile
	): ProjectFiles {
		const localSurfaces = this.localSurfaces.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteAnnotation(annotationFile)
		);
		const cloudSurfaces = this.cloudSurfaces.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteAnnotation(annotationFile)
		);

		return new ProjectFiles({
			localSurfaces,
			cloudSurfaces,
			projectFiles: this,
		});
	}

	public fromIsActiveOverlay(
		surfaceFile: SurfaceFile,
		overlayFile: OverlayFile
	): ProjectFiles {
		const cloudSurfaces = this.cloudSurfaces.map((surface) =>
			surface === surfaceFile
				? surface.from({
						overlayFiles: surface.overlayFiles.map((overlay) => {
							if (overlay !== overlayFile) return overlay.fromIsActive(false);
							if (overlay.isActive) return overlay.fromIsActive(false);
							return overlay.fromIsActive(true);
						}),
						annotationFiles: surface.annotationFiles.map((annotation) =>
							annotation.fromIsActive(false)
						),
				  })
				: surface
		);

		return new ProjectFiles({
			cloudSurfaces,
			projectFiles: this,
		});
	}

	public fromIsActiveAnnotation(
		surfaceFile: SurfaceFile,
		annotationFile: AnnotationFile
	): ProjectFiles {
		const cloudSurfaces = this.cloudSurfaces.map((surface) =>
			surface === surfaceFile
				? surface.from({
						overlayFiles: surface.overlayFiles.map((overlay) =>
							overlay.fromIsActive(false)
						),
						annotationFiles: surface.annotationFiles.map((annotation) => {
							if (annotation !== annotationFile)
								return annotation.fromIsActive(false);
							if (annotation.isActive) return annotation.fromIsActive(false);
							return annotation.fromIsActive(true);
						}),
				  })
				: surface
		);

		return new ProjectFiles({
			cloudSurfaces,
			projectFiles: this,
		});
	}

	public fromNewPointSetFile(name: string, color: string): ProjectFiles {
		return new ProjectFiles({
			cloudPointSets: this.cloudPointSets.map((file) =>
				file.from({ isActive: false })
			),
			cachePointSets: [
				...this.cachePointSets.map((file) => file.from({ isActive: false })),
				new CachePointSetFile(
					name,
					{
						color: hexToRgb(color),
						data_type: 'fs_pointset',
						points: [],
						version: 1,
						vox2ras: 'scanner_ras',
					},
					true,
					true,
					-1
				),
			],
			projectFiles: this,
		});
	}
}
