import { ColorMap } from '@/pages/project/models/ColorMap';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import type { ProjectFile } from '@/pages/project/models/file/ProjectFile';
import type { PointSetFile } from '@/pages/project/models/file/type/PointSetFile';
import type { SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';

/**
 * The mode the user is interacting with the UI right now
 */
export enum USER_MODE {
	NAVIGATE,
	EDIT_VOXEL,
	EDIT_POINTS,
}

export interface ICrosshairPosition {
	x: number;
	y: number;
	z: number;
}

export interface IUser {
	name: string;
}

/**
 * class to uncouple backend dto from data used from ui
 * - keep the expected backend data state without fetching it again
 * - keep the ui state of the project in one place
 */
export class ProjectState {
	/**
	 * project id defined by the backend
	 */
	public readonly id: number;
	/**
	 * given name of the project
	 */
	public readonly name: string | undefined;
	/**
	 * the mode the user is interacting with the UI right now
	 */
	public readonly userMode: USER_MODE;
	/**
	 * thickness of the mesh on the 2d plane
	 */
	public readonly meshThicknessOn2D: number | undefined;
	/**
	 * user information
	 */
	public readonly user: IUser = { name: 'Anonymus User' };
	/**
	 * all files related to the project
	 */
	public readonly files: ProjectFiles;

	/**
	 * the 3D point which is marked in the niivue canvas
	 */
	public readonly crosshairPosition: ICrosshairPosition | undefined = undefined;

	constructor(
		args:
			| {
					id: number;
					name: string;
					meshThicknessOn2D?: number;
					files: ProjectFiles;
			  }
			| {
					projectState: ProjectState;
					userMode?: USER_MODE;
					meshThicknessOn2D?: number;
					files?: ProjectFiles;
					crosshairPosition?: ICrosshairPosition;
					user?: IUser;
			  },
		public readonly upload: boolean
	) {
		if ('id' in args) {
			this.id = args.id;
			this.name = args.name;
			this.userMode = USER_MODE.NAVIGATE;
			this.meshThicknessOn2D = args.meshThicknessOn2D ?? 0;
			this.files = args.files;
			return;
		}

		this.id = args.projectState.id;
		this.name = args.projectState.name;

		this.userMode = args.userMode ?? args.projectState.userMode;
		this.crosshairPosition =
			args.crosshairPosition ?? args.projectState.crosshairPosition;
		this.meshThicknessOn2D =
			args.meshThicknessOn2D ?? args.projectState.meshThicknessOn2D;
		this.user = args.user ?? args.projectState.user;
		this.files = args.files ?? args.projectState.files;
	}

	from(
		options: {
			userMode?: USER_MODE;
			meshThicknessOn2D?: number;
			files?: ProjectFiles;
			crosshairPosition?: ICrosshairPosition;
			user?: IUser;
		},
		upload = true
	): ProjectState {
		return new ProjectState(
			{
				projectState: this,
				userMode: options.userMode ?? this.userMode,
				meshThicknessOn2D: options.meshThicknessOn2D ?? this.meshThicknessOn2D,
				files: options.files ?? this.files,
				crosshairPosition: options.crosshairPosition ?? this.crosshairPosition,
				user: options.user ?? this.user,
			},
			upload
		);
	}

	fromFiles(files: ProjectFiles, upload = true): ProjectState {
		return new ProjectState({ projectState: this, files }, upload);
	}

	fromQuery(
		volumes: (string | null)[],
		volumeOpacity: (string | null)[],
		volumeOrder: (string | null)[],
		volumeSelected: (string | null)[],
		volumeVisible: (string | null)[],
		volumeContrastMin: (string | null)[],
		volumeContrastMax: (string | null)[],
		volumeColormap: (string | null)[],
		surfaces: (string | null)[],
		surfaceOpacity: (string | null)[],
		surfaceOrder: (string | null)[],
		surfaceVisible: (string | null)[],
		surfaceSelected: (string | null)[],
		pointSets: (string | null)[],
		pointSetOpacity: (string | null)[],
		pointSetOrder: (string | null)[],
		pointSetVisible: (string | null)[],
		pointSetSelected: (string | null)[],
		upload = true
	): ProjectState {
		const volumeFiles: VolumeFile[] = this.files.volumes.map((volume) => {
			const index = volumes.indexOf(volume.name);
			if (index !== -1) {
				return volume.from({
					order: Number(volumeOrder[index]),
					isActive: volumeSelected[index] === 'true',
					isChecked: volumeVisible[index] === 'true',
					opacity: Number(volumeOpacity[index]),
					colorMap: ColorMap.fromBackend(volumeColormap[index]) ?? undefined,
					contrastMin: Number(volumeContrastMin[index]),
					contrastMax: Number(volumeContrastMax[index]),
				});
			}

			return volume.from({ isChecked: false });
		});

		const surfaceFiles: SurfaceFile[] = this.files.surfaces.map((surface) => {
			const index = surfaces.indexOf(surface.name);
			if (index !== -1) {
				return surface.from({
					order: Number(surfaceOrder[index]),
					isActive: surfaceSelected[index] === 'true',
					isChecked: surfaceVisible[index] === 'true',
					opacity: Number(surfaceOpacity[index]),
				});
			}

			return surface.from({ isChecked: false });
		});

		const pointSetFiles: PointSetFile[] = this.files.pointSets.map(
			(pointSet) => {
				const index = pointSets.indexOf(pointSet.name);
				if (index !== -1) {
					return pointSet.from({
						order: Number(pointSetOrder[index]),
						isActive: pointSetSelected[index] === 'true',
						isChecked: pointSetVisible[index] === 'true',
						opacity: Number(pointSetOpacity[index]),
					});
				}

				return pointSet.from({ isChecked: false });
			}
		);

		const files = this.files
			.fromAdaptedVolumes(volumeFiles)
			.fromAdaptedSurfaces(surfaceFiles)
			.fromAdaptedPointSets(pointSetFiles);

		return this.fromFiles(files, upload);
	}

	/**
	 * to update a property of a file
	 * @param file file to update the property on
	 * @param options property value to update
	 * @param upload flag, if the change should get pushed to the backend
	 * @returns new instance of the project state
	 */
	fromFileUpdate<T_FILE_TYPE extends ProjectFile>(
		file: T_FILE_TYPE,
		options: Parameters<T_FILE_TYPE['from']>[0],
		upload: boolean
	): ProjectState {
		if (file instanceof CloudVolumeFile || file instanceof LocalVolumeFile)
			return new ProjectState(
				{
					projectState: this,
					files: this.files.fromAdaptedVolumes(
						this.files.volumes.map((tmpVolume) =>
							tmpVolume.name === file.name &&
							tmpVolume.location === file.location
								? tmpVolume.from(options as Parameters<VolumeFile['from']>[0])
								: tmpVolume
						)
					),
				},
				upload
			);

		if (file instanceof CloudSurfaceFile || file instanceof LocalSurfaceFile)
			return new ProjectState(
				{
					projectState: this,
					files: this.files.fromAdaptedSurfaces(
						this.files.surfaces.map((tmpSurface) =>
							tmpSurface.name === file.name &&
							tmpSurface.location === file.location
								? tmpSurface.from(options as Parameters<SurfaceFile['from']>[0])
								: tmpSurface
						)
					),
				},
				upload
			);

		if (file instanceof CloudPointSetFile || file instanceof CachePointSetFile)
			return new ProjectState(
				{
					projectState: this,
					files: this.files.fromAdaptedPointSets(
						this.files.pointSets.map((tmpPointSet) =>
							tmpPointSet.name === file.name &&
							tmpPointSet.location === file.location
								? tmpPointSet.from(
										options as Parameters<PointSetFile['from']>[0]
								  )
								: tmpPointSet
						)
					),
				},
				upload
			);

		throw new Error('file type unknown');
	}
}
