import {
	VolumeClient,
	type GetProjectVolumeDto,
	DeleteVolumeCommand,
	CreateVolumesCommand,
	CreateVolumeDto,
	type CreateVolumeResponseDto,
} from '@/generated/web-api-client';
import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { COLOR_MAP_NIIVUE } from '@/pages/project/models/ColorMap';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { deleteFromArray } from '@/pages/project/models/file/ProjectFileHelper';
import { type VolumeFile } from '@/pages/project/models/file/type/VolumeFile';
import { getApiUrl } from '@/utils';
import { makeAutoObservable } from 'mobx';

export class ProjectFilesVolumes {
	local: LocalVolumeFile[] = [];
	cloud: CloudVolumeFile[];

	private readonly client = new VolumeClient(getApiUrl());

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		private readonly niivueUpdateOrder: () => void,
		private readonly projectState: ProjectState,
		backendStateVolumes?: GetProjectVolumeDto[]
	) {
		makeAutoObservable(this);

		this.cloud =
			backendStateVolumes?.map<CloudVolumeFile>(
				(fileDto) =>
					new CloudVolumeFile(
						this.niivueWrapper,
						fileDto,
						this.client,
						() => this.niivueUpdateOrder(),
						projectState
					)
			) ?? [];
	}

	async initialize(): Promise<void> {
		await this.niivueInitialLoad();
	}

	private async niivueInitialLoad(): Promise<void> {
		if (!(this.cloud.length > 0)) return;

		await this.niivueWrapper.niivue.loadVolumes(
			this.cloud
				.filter((file) => file.isChecked)
				.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
				.map((file) => {
					return {
						url: file.url,
						name: file.name,
						opacity: file.opacity / 100,
						colorMap: file.colorMap.niivue ?? COLOR_MAP_NIIVUE.GRAY,
						cal_min: file.contrastMin,
						cal_max: file.contrastMax,
						trustCalMinMax: false,
					};
				})
		);

		this.niivueWrapper.niivue.setSliceType(this.projectState.sliceType);

		this.niivueWrapper.niivue.volumes.forEach((niivueVolume) => {
			const cmap = this.niivueWrapper.niivue.colormapFromKey(
				niivueVolume.colormap
			);

			if (
				cmap.R === undefined ||
				cmap.labels === undefined ||
				cmap.labels.length === 0
			) {
				niivueVolume.colormapLabel = [];
				return;
			}

			niivueVolume.setColormapLabel(cmap);
		});

		this.niivueWrapper.niivue.updateGLVolume();
		this.collectNiivueRef();
	}

	private collectNiivueRef(): void {
		for (const volume of this.cloud) {
			if (volume.niivueRef !== undefined) continue;
			const niivueVolume = this.niivueWrapper.niivue.volumes.find(
				(niivueVolume) => niivueVolume.name === volume.name
			);
			if (niivueVolume === undefined) continue;
			volume.setNiivueRef(niivueVolume);
		}
	}

	get all(): VolumeFile[] {
		return [...this.local, ...this.cloud];
	}

	setActiveOnly(file: ProjectFile): void {
		this.all.forEach((indexFile) =>
			indexFile === file
				? indexFile.setIsActive(true)
				: indexFile.setIsActive(false)
		);
	}

	async addLocalFiles(
		volumes: LocalVolumeFile[],
		projectId: number | undefined
	): Promise<void> {
		if (volumes.length === 0) return;

		this.local.push(...volumes);
		if (projectId === undefined) return;

		const responses = await this.apiPost(volumes, projectId);
		for (const volume of volumes) this.delete(volume);
		for (const response of responses) await this.addCloudFile(response);
	}

	async apiPost(
		volumes: LocalVolumeFile[],
		projectId: number
	): Promise<CreateVolumeResponseDto[]> {
		return await this.client.create(
			new CreateVolumesCommand({
				projectId,
				volumes: await Promise.all(
					volumes.map(
						async (addedVolumeFile) =>
							new CreateVolumeDto({
								base64: await addedVolumeFile.getBase64(),
								fileName: addedVolumeFile.name,
								visible: addedVolumeFile.isChecked,
								order: addedVolumeFile.order,
								colorMap: undefined,
								opacity: addedVolumeFile.opacity,
								contrastMin: addedVolumeFile.contrastMin,
								contrastMax: addedVolumeFile.contrastMax,
							})
					)
				),
			})
		);
	}

	private async addCloudFile(response: CreateVolumeResponseDto): Promise<void> {
		const cloudVolume = new CloudVolumeFile(
			this.niivueWrapper,
			response,
			this.client,
			() => this.niivueUpdateOrder(),
			this.projectState
		);
		this.cloud.push(cloudVolume);
		await cloudVolume.niivueAddNew();
	}

	public delete(file: ProjectFile): void {
		if (file instanceof LocalVolumeFile)
			return deleteFromArray(this.local, file);
		if (file instanceof CloudVolumeFile) {
			file.niivueRef !== undefined &&
				this.niivueWrapper.niivue.setVolume(file.niivueRef, -1);
			void this.client.delete(new DeleteVolumeCommand({ id: file.id }));
			deleteFromArray(this.cloud, file);
		}
	}
}
