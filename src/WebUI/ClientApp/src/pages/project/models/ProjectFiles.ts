import type {
	CreateVolumeResponseDto,
	CreateSurfaceResponseDto,
	CreateOverlayResponseDto,
	CreateAnnotationResponseDto,
} from '@/generated/web-api-client';
import { ColorMap } from '@/pages/project/models/ColorMap';
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

export interface IVolumes {
	local: readonly LocalVolumeFile[];
	cloud: readonly CloudVolumeFile[];
}

export interface ISurfaces {
	local: readonly LocalSurfaceFile[];
	cloud: readonly CloudSurfaceFile[];
}

export interface IPointSets {
	local: readonly LocalPointSetFile[];
	cache: readonly CachePointSetFile[];
	cloud: readonly CloudPointSetFile[];
}

/**
 * mutable instance keeps the state of the project files
 * there are two kinds of files.
 * - the once loaded already
 * - the once the user opened from the drive, which need to get uploaded
 */
export class ProjectFiles {
	readonly volumes: IVolumes;
	readonly surfaces: ISurfaces;
	readonly pointSets: IPointSets;

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
					volumes?: IVolumes;
					surfaces?: ISurfaces;
					pointSets?: IPointSets;
			  }
			| undefined
	) {
		if (initState === undefined) {
			this.volumes = {
				local: [],
				cloud: [],
			};
			this.surfaces = {
				local: [],
				cloud: [],
			};
			this.pointSets = {
				local: [],
				cache: [],
				cloud: [],
			};
			return;
		}

		this.volumes = initState.volumes ?? initState.projectFiles.volumes;
		this.surfaces = initState.surfaces ?? initState.projectFiles.surfaces;
		this.pointSets = initState.pointSets ?? initState.projectFiles.pointSets;
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
		return new ProjectFiles({
			volumes: {
				local: newVolumes.filter(
					(volume): volume is LocalVolumeFile =>
						volume instanceof LocalVolumeFile
				),
				cloud: newVolumes.filter(
					(volume): volume is CloudVolumeFile =>
						volume instanceof CloudVolumeFile
				),
			},
			projectFiles: this,
		});
	}

	/**
	 * when the user clicks on a volume, we want to highlight only that one volume as active and deactivate all the others
	 */
	public fromOneVolumeActivated(volume: VolumeFile): ProjectFiles {
		const localVolumes = this.volumes.local.map((file) =>
			file.from({ isActive: file === volume })
		);

		const localSurfaces =
			this.surfaces.local.find((file) => file.isActive) !== undefined
				? this.surfaces.local.map((file) => file.from({ isActive: false }))
				: undefined;

		const cloudVolumes = this.volumes.cloud.map((file) =>
			file.from({ isActive: file === volume })
		);

		const cloudSurfaces =
			this.surfaces.cloud.find((file) => file.isActive) !== undefined
				? this.surfaces.cloud.map((file) => file.from({ isActive: false }))
				: undefined;

		return new ProjectFiles({
			volumes: {
				local: localVolumes,
				cloud: cloudVolumes,
			},
			surfaces: {
				local: localSurfaces ?? this.surfaces.local,
				cloud: cloudSurfaces ?? this.surfaces.cloud,
			},
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
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
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
			pointSets: {
				cache: cachePointSets,
				cloud: cloudPointSets,
				local: this.pointSets.local,
			},
			projectFiles: this,
		});
	}

	/**
	 * when the user clicks on a surface, we want to highlight only that one surface as active and deactivate all the others
	 */
	public fromOneSurfaceActivated(surface: SurfaceFile): ProjectFiles {
		const localVolumes =
			this.volumes.local.find((file) => file.isActive) !== undefined
				? this.volumes.local.map((file) => file.from({ isActive: false }))
				: undefined;

		const localSurfaces = this.surfaces.local.map((file) =>
			file.from({ isActive: file === surface })
		);

		const cloudVolumes =
			this.volumes.cloud.find((file) => file.isActive) !== undefined
				? this.volumes.cloud.map((file) => file.from({ isActive: false }))
				: undefined;

		const cloudSurfaces = this.surfaces.cloud.map((file) =>
			file.from({ isActive: file === surface })
		);

		return new ProjectFiles({
			volumes: {
				local: localVolumes ?? this.volumes.local,
				cloud: cloudVolumes ?? this.volumes.cloud,
			},
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
			projectFiles: this,
		});
	}

	/**
	 * when the user clicks on a surface, we want to highlight only that one surface as active and deactivate all the others
	 */
	public fromOnePointSetActivated(pointSet: PointSetFile): ProjectFiles {
		const localPointSets =
			this.pointSets.local.find(
				(file) => file === pointSet || file.isActive
			) !== undefined
				? this.pointSets.local.map((file) =>
						file.from({ isActive: file === pointSet })
				  )
				: this.pointSets.local;

		const cachePointSets =
			this.pointSets.cache.find(
				(file) => file === pointSet || file.isActive
			) !== undefined
				? this.pointSets.cache.map((file) =>
						file.from({ isActive: file === pointSet })
				  )
				: this.pointSets.cache;

		const cloudPointSets =
			this.pointSets.cloud.find(
				(file) => file === pointSet || file.isActive
			) !== undefined
				? this.pointSets.cloud.map((file) =>
						file.from({ isActive: file === pointSet })
				  )
				: this.pointSets.cloud;

		return new ProjectFiles({
			pointSets: {
				cache: cachePointSets,
				cloud: cloudPointSets,
				local: localPointSets,
			},
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
				const compareName = (file: ProjectFile): boolean =>
					file.name === newFile.name;
				switch (ProjectFileBase.typeFromFileExtension(newFile.name)) {
					case FileType.VOLUME:
						if (
							[...this.volumes.cloud, ...this.volumes.local].some(compareName)
						)
							return undefined;
						return new LocalVolumeFile(newFile);
					case FileType.SURFACE:
						if (
							[...this.surfaces.cloud, ...this.surfaces.local].some(compareName)
						)
							return undefined;
						return new LocalSurfaceFile(newFile);
					case FileType.POINT_SET:
						if (
							[
								...this.pointSets.cloud,
								...this.pointSets.local,
								...this.pointSets.cache,
							].some(compareName)
						)
							return undefined;
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
		const localVolumes = [...this.volumes.local, ...newVolumes];

		const newSurfaces = newFiles.filter(
			(newFile): newFile is LocalSurfaceFile =>
				newFile instanceof LocalSurfaceFile
		);
		const localSurfaces = [...this.surfaces.local, ...newSurfaces];

		const newPointSets = newFiles.filter(
			(newFile): newFile is LocalPointSetFile =>
				newFile instanceof LocalPointSetFile
		);
		const localPointSets = [...this.pointSets.local, ...newPointSets];

		return new ProjectFiles({
			volumes: { local: localVolumes, cloud: this.volumes.cloud },
			surfaces: { local: localSurfaces, cloud: this.surfaces.cloud },
			pointSets: {
				local: localPointSets,
				cloud: this.pointSets.cloud,
				cache: this.pointSets.cache,
			},
			projectFiles: this,
		});
	}

	public fromDeletedFile(name: string): ProjectFiles {
		const cloudSurfaces = [
			...this.surfaces.cloud.filter((file) => file.name !== name),
		];
		const cloudVolumes = [
			...this.volumes.cloud.filter((file) => file.name !== name),
		];
		const localSurfaces = [
			...this.surfaces.local.filter((file) => file.name !== name),
		];
		const localVolumes = [
			...this.volumes.local.filter((file) => file.name !== name),
		];
		const localPointSets = [
			...this.pointSets.local.filter((file) => file.name !== name),
		];
		const cloudPointSets = [
			...this.pointSets.cloud.filter((file) => file.name !== name),
		];
		const cachePointSets = [
			...this.pointSets.cache.filter((file) => file.name !== name),
		];

		return new ProjectFiles({
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
			volumes: { local: localVolumes, cloud: cloudVolumes },
			pointSets: {
				local: localPointSets,
				cloud: cloudPointSets,
				cache: cachePointSets,
			},
			projectFiles: this,
		});
	}

	public fromUploadedSurfaces(
		uploadResponses: CreateSurfaceResponseDto[]
	): ProjectFiles {
		const cloudSurfaces = [
			...this.surfaces.cloud,
			...uploadResponses.map((uploadResponse) => {
				if (uploadResponse.id === undefined)
					throw new Error('there needs to be a id for each cloud file');
				if (uploadResponse.fileName === undefined)
					throw new Error('there needs to be a name for each cloud file');

				// workaround as long as we do not receive the size as response
				const localFile = this.surfaces.local.find(
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
			...this.surfaces.local.filter(
				(localSurface) =>
					!uploadResponses
						.map((uploadResponse) => uploadResponse.fileName)
						.includes(localSurface.name)
			),
		];

		return new ProjectFiles({
			surfaces: {
				cloud: cloudSurfaces,
				local: localSurfaces,
			},
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
			...this.volumes.cloud,
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
				const localFile = this.volumes.local.find(
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
					ColorMap.fromBackend(uploadResponse.colorMap) ??
						CloudVolumeFile.DEFAULT_COLOR_MAP,
					false,
					undefined,
					uploadResponse.contrastMin,
					uploadResponse.contrastMax
				);
			}),
		];

		const localVolumes = [
			...this.volumes.local.filter(
				(localVolume) =>
					!uploadResponses
						.map((uploadResponse) => uploadResponse.fileName)
						.includes(localVolume.name)
			),
		];

		return new ProjectFiles({
			volumes: {
				cloud: cloudVolumes,
				local: localVolumes,
			},
			projectFiles: this,
		});
	}

	public fromUploadedOverlays(
		surfaceId: number,
		createOverlayResponseDto: CreateOverlayResponseDto[]
	): ProjectFiles {
		const cloudSurfaces = this.surfaces.cloud.map((surface) =>
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
			surfaces: {
				cloud: cloudSurfaces,
				local: this.surfaces.local,
			},
			projectFiles: this,
		});
	}

	public fromUploadedAnnotations(
		surfaceId: number,
		createAnnotationResponseDto: CreateAnnotationResponseDto[]
	): ProjectFiles {
		const cloudSurfaces = this.surfaces.cloud.map((surface) =>
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
			surfaces: {
				cloud: cloudSurfaces,
				local: this.surfaces.local,
			},
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
			? this.surfaces.local.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddOverlay(file)
						: localSurface
			  )
			: this.surfaces.local;

		const isCloud = surface instanceof CloudSurfaceFile;
		const cloudSurfaces = isCloud
			? this.surfaces.cloud.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddOverlay(file)
						: localSurface
			  )
			: this.surfaces.cloud;

		return new ProjectFiles({
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
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
			? this.surfaces.local.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddAnnotation(file)
						: localSurface
			  )
			: this.surfaces.local;

		const isCloud = surface instanceof CloudSurfaceFile;
		const cloudSurfaces = isCloud
			? this.surfaces.cloud.map((localSurface) =>
					localSurface === surface
						? localSurface.fromAddAnnotation(file)
						: localSurface
			  )
			: this.surfaces.cloud;

		return new ProjectFiles({
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
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
		const localSurfaces = this.surfaces.local.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteOverlay(overlayFile)
		);
		const cloudSurfaces = this.surfaces.cloud.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteOverlay(overlayFile)
		);

		return new ProjectFiles({
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
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
		const localSurfaces = this.surfaces.local.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteAnnotation(annotationFile)
		);
		const cloudSurfaces = this.surfaces.cloud.map((thisSurface) =>
			thisSurface !== surfaceFile
				? thisSurface
				: thisSurface.fromDeleteAnnotation(annotationFile)
		);

		return new ProjectFiles({
			surfaces: { local: localSurfaces, cloud: cloudSurfaces },
			projectFiles: this,
		});
	}

	public fromIsActiveOverlay(
		surfaceFile: SurfaceFile,
		overlayFile: OverlayFile
	): ProjectFiles {
		const cloudSurfaces = this.surfaces.cloud.map((surface) =>
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
			surfaces: {
				cloud: cloudSurfaces,
				local: this.surfaces.local,
			},
			projectFiles: this,
		});
	}

	public fromIsActiveAnnotation(
		surfaceFile: SurfaceFile,
		annotationFile: AnnotationFile
	): ProjectFiles {
		const cloudSurfaces = this.surfaces.cloud.map((surface) =>
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
			surfaces: {
				cloud: cloudSurfaces,
				local: this.surfaces.local,
			},
			projectFiles: this,
		});
	}

	public fromNewPointSetFile(name: string, color: string): ProjectFiles {
		return new ProjectFiles({
			pointSets: {
				cloud: this.pointSets.cloud.map((file) =>
					file.from({ isActive: false })
				),
				cache: [
					...this.pointSets.cache.map((file) => file.from({ isActive: false })),
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
				local: this.pointSets.local,
			},
			projectFiles: this,
		});
	}
}
