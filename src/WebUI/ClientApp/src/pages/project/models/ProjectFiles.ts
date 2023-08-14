import { type GetProjectDto } from '@/generated/web-api-client';
import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ProjectFilesPointSets } from '@/pages/project/models/ProjectFilesPointSets';
import { ProjectFilesSurfaces } from '@/pages/project/models/ProjectFilesSurfaces';
import { ProjectFilesVolumes } from '@/pages/project/models/ProjectFilesVolumes';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { LocalPointSetFile } from '@/pages/project/models/file/LocalPointSetFile';
import { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import {
	type ProjectFile,
	ProjectFileBase,
	FileType,
} from '@/pages/project/models/file/ProjectFile';
import { type HistoryHandlerEditPoints } from '@/pages/project/models/handlers/HistoryHandlerEditPoints';
import { makeAutoObservable } from 'mobx';

export class ProjectFiles {
	public volumes: ProjectFilesVolumes;
	public surfaces: ProjectFilesSurfaces;
	public pointSets: ProjectFilesPointSets;

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		readonly historyHandler: HistoryHandlerEditPoints,
		readonly projectState: ProjectState,
		backendState?: GetProjectDto
	) {
		makeAutoObservable(this);

		this.volumes = new ProjectFilesVolumes(
			niivueWrapper,
			() => this.niivueUpdateOrder(),
			projectState,
			backendState?.volumes
		);

		this.surfaces = new ProjectFilesSurfaces(
			niivueWrapper,
			() => this.niivueUpdateOrder(),
			backendState?.surfaces
		);

		this.pointSets = new ProjectFilesPointSets(
			niivueWrapper,
			() => this.niivueUpdateOrder(),
			historyHandler,
			backendState?.pointSets
		);
	}

	async initialize(): Promise<void> {
		await this.volumes.initialize();
		await this.surfaces.initialize();
		await this.pointSets.initialize();
	}

	async addLocalFiles(
		files: File[],
		projectId: number | undefined
	): Promise<void> {
		const newFiles = files
			.map((newFile) => {
				const compareName = (file: ProjectFile): boolean =>
					file.name === newFile.name;
				switch (ProjectFileBase.typeFromFileExtension(newFile.name)) {
					case FileType.VOLUME:
						if (this.volumes.all.some(compareName)) return undefined;
						return new LocalVolumeFile(newFile);
					case FileType.SURFACE:
						if (this.surfaces.all.some(compareName)) return undefined;
						return new LocalSurfaceFile(this.niivueWrapper, newFile);
					case FileType.POINT_SET:
						if (this.pointSets.all.some(compareName)) return undefined;
						return new LocalPointSetFile(this.niivueWrapper, newFile);
				}
				return undefined;
			})
			.filter(
				(
					file
				): file is LocalSurfaceFile | LocalVolumeFile | LocalPointSetFile =>
					file !== undefined
			);

		await this.volumes.addLocalFiles(
			newFiles.filter(
				(newFile): newFile is LocalVolumeFile =>
					newFile instanceof LocalVolumeFile
			),
			projectId
		);

		await this.surfaces.addLocalFiles(
			newFiles.filter(
				(newFile): newFile is LocalSurfaceFile =>
					newFile instanceof LocalSurfaceFile
			),
			projectId
		);

		await this.pointSets.addLocalFiles(
			newFiles.filter(
				(newFile): newFile is LocalPointSetFile =>
					newFile instanceof LocalPointSetFile
			),
			projectId
		);
	}

	setActiveOnly(file: ProjectFile): void {
		this.volumes.setActiveOnly(file);
		this.surfaces.setActiveOnly(file);
	}

	niivueUpdateOrder(): void {
		this.volumes.all
			.filter((file) => file.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
			.forEach((file, index) => file.setNiivueOrderIndex(index));

		[
			...(this.pointSets.all
				.filter((file) => file.isChecked)
				.sort((a, b) => (b.order ?? 0) - (a.order ?? 0)) ?? []),
			...(this.surfaces.all
				.filter((file) => file.isChecked)
				.sort((a, b) => (b.order ?? 0) - (a.order ?? 0)) ?? []),
		].forEach((file, index) => {
			file.setNiivueOrderIndex(index);
		});

		this.niivueWrapper.niivue.updateGLVolume();
	}
}
