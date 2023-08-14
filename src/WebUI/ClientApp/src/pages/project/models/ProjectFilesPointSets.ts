import {
	type GetProjectPointSetDto,
	PointSetClient,
	DeletePointSetCommand,
	CreatePointSetCommand,
	type CreatePointSetResponseDto,
} from '@/generated/web-api-client';
import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import { LocalPointSetFile } from '@/pages/project/models/file/LocalPointSetFile';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { deleteFromArray } from '@/pages/project/models/file/ProjectFileHelper';
import { type PointSetFile } from '@/pages/project/models/file/type/PointSetFile';
import { type HistoryHandlerEditPoints } from '@/pages/project/models/handlers/HistoryHandlerEditPoints';
import { getApiUrl } from '@/utils';
import { makeAutoObservable, runInAction } from 'mobx';

export class ProjectFilesPointSets {
	local: LocalPointSetFile[] = [];
	cache: CachePointSetFile[] = [];
	cloud: CloudPointSetFile[] = [];

	private readonly client = new PointSetClient(getApiUrl());

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		private readonly niivueUpdateOrder: () => void,
		private readonly history: HistoryHandlerEditPoints,
		private readonly backendStatePointSets?: GetProjectPointSetDto[]
	) {
		makeAutoObservable(this);
	}

	async initialize(): Promise<void> {
		if (this.backendStatePointSets === undefined) return;
		const cloudFiles = this.backendStatePointSets.map(
			(dto) =>
				new CloudPointSetFile(
					this.niivueWrapper,
					this.history,
					dto,
					this.client,
					() => this.niivueUpdateOrder()
				)
		);
		for (const cloudFile of cloudFiles) await cloudFile.initialize();
		runInAction(() => this.cloud.push(...cloudFiles));
	}

	get all(): PointSetFile[] {
		return [...this.local, ...this.cache, ...this.cloud];
	}

	setActiveOnly(file: ProjectFile): void {
		this.all.forEach((indexFile) =>
			indexFile === file
				? indexFile.setIsActive(true)
				: indexFile.setIsActive(false)
		);
	}

	async createCachePointSetFile(
		name: string,
		color: string,
		projectId: number | undefined,
		logHistory = true
	): Promise<void> {
		this.all.forEach((file) => file.setIsActive(false));
		const newFile = new CachePointSetFile(this.niivueWrapper, name, color);
		this.cache.push(newFile);

		if (projectId === undefined) return;
		const responses = await this.apiPost([newFile], projectId);
		this.delete(newFile, false);
		const newCloudFiles = await Promise.all(
			responses.map(async (newFile) => await this.addCloudFile(newFile))
		);
		if (logHistory) this.history.addFiles(newCloudFiles);
	}

	async addFilesFromHistory(
		files: CloudPointSetFile[],
		projectId: number | undefined
	): Promise<void> {
		if (projectId === undefined) throw new Error('no given project id');
		for (const file of files) {
			const response = await file.apiPost(projectId);
			file.reuseInstanceForNewBackendFile(response);
			runInAction(() => this.cloud.push(file));
			await file.niivueAddNew();
		}
		this.niivueUpdateOrder();
	}

	async addLocalFiles(
		pointSets: LocalPointSetFile[],
		projectId: number | undefined
	): Promise<void> {
		if (pointSets.length === 0) return;

		this.local.push(...pointSets);
		if (projectId === undefined) return;

		const responses = await this.apiPost(pointSets, projectId);

		// delete local files
		for (const pointSet of pointSets) this.delete(pointSet, false);

		// add cloud files instead
		const newCloudFiles = await Promise.all(
			responses.map(async (response) => await this.addCloudFile(response))
		);

		this.history.addFiles(newCloudFiles);
	}

	async apiPost(
		pointSets: (LocalPointSetFile | CachePointSetFile)[],
		projectId: number
	): Promise<CreatePointSetResponseDto[]> {
		return await Promise.all(
			pointSets.map(async (file) => {
				return await this.client.create(
					new CreatePointSetCommand({
						projectId,
						fileName: file.name,
						base64: await file.getBase64(),
						order: file.order,
						visible: file.isChecked,
					})
				);
			})
		);
	}

	private async addCloudFile(
		response: CreatePointSetResponseDto
	): Promise<CloudPointSetFile> {
		const cloudPointSet = new CloudPointSetFile(
			this.niivueWrapper,
			this.history,
			response,
			this.client,
			() => this.niivueUpdateOrder()
		);
		runInAction(() => this.cloud.push(cloudPointSet));
		await cloudPointSet.initialize();
		await cloudPointSet.niivueAddNew();
		return cloudPointSet;
	}

	public delete(file: ProjectFile, logHistory = true): void {
		if (logHistory) this.history.deleteFile(file);

		if (file instanceof LocalPointSetFile)
			return deleteFromArray(this.local, file);
		if (file instanceof CachePointSetFile)
			return deleteFromArray(this.cache, file);
		if (file instanceof CloudPointSetFile) {
			file.niivueDelete();
			void this.client.delete(new DeletePointSetCommand({ id: file.id }));
			deleteFromArray(this.cloud, file);
		}
	}
}
