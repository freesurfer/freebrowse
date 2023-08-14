import {
	SurfaceClient,
	type GetProjectSurfaceDto,
	DeleteSurfaceCommand,
	CreateSurfaceDto,
	CreateSurfacesCommand,
	OverlayClient,
	AnnotationClient,
	type CreateSurfaceResponseDto,
} from '@/generated/web-api-client';
import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { deleteFromArray } from '@/pages/project/models/file/ProjectFileHelper';
import { type SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import { getApiUrl } from '@/utils';
import { type NVMeshFromUrlOptions, type NVMeshLayer } from '@niivue/niivue';
import { makeAutoObservable } from 'mobx';

export class ProjectFilesSurfaces {
	local: LocalSurfaceFile[] = [];
	cloud: CloudSurfaceFile[];

	private readonly surfaceClient = new SurfaceClient(getApiUrl());
	private readonly overlayClient = new OverlayClient(getApiUrl());
	private readonly annotationClient = new AnnotationClient(getApiUrl());

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		private readonly niivueUpdateOrder: () => void,
		backendStateSurfaces?: GetProjectSurfaceDto[]
	) {
		makeAutoObservable(this);

		this.cloud =
			backendStateSurfaces?.map<CloudSurfaceFile>(
				(fileDto) =>
					new CloudSurfaceFile(
						niivueWrapper,
						fileDto,
						this.surfaceClient,
						this.overlayClient,
						this.annotationClient,
						() => this.niivueUpdateOrder()
					)
			) ?? [];
	}

	async initialize(): Promise<void> {
		await this.niivueInitialLoad();
	}

	private async niivueInitialLoad(): Promise<void> {
		if (!(this.cloud.length > 0)) return;

		await this.niivueWrapper.niivue.loadMeshes(
			this.cloud
				.filter((file) => file.isChecked)
				.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
				.map((file): NVMeshFromUrlOptions => {
					const layers = [...file.overlayFiles, ...file.annotationFiles]
						?.filter(
							(file): file is CloudOverlayFile | CloudAnnotationFile =>
								file instanceof CloudOverlayFile ||
								file instanceof CloudAnnotationFile
						)
						.filter((file) => file.isActive)
						.map(
							(file): NVMeshLayer => ({
								name: file.name,
								url: file.url,
								cal_min: 0.5,
								cal_max: 5.5,
								useNegativeCmap: true,
								opacity: 0.7,
							})
						);
					return {
						url: file.url,
						name: file.name,
						rgba255: NiivueWrapper.hexToRGBA(file.color),
						layers,
					};
				})
		);

		this.collectNiivueRef();
	}

	private collectNiivueRef(): void {
		for (const surface of this.cloud) {
			if (surface.niivueRef !== undefined) continue;
			const niivueSurface = this.niivueWrapper.niivue.meshes.find(
				(niivueVolume) => niivueVolume.name === surface.name
			);
			if (niivueSurface === undefined) continue;
			surface.setNiivueRef(niivueSurface);
		}
	}

	get all(): SurfaceFile[] {
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
		surfaces: LocalSurfaceFile[],
		projectId: number | undefined
	): Promise<void> {
		if (surfaces.length === 0) return;

		this.local.push(...surfaces);
		if (projectId === undefined) return;

		const responses = await this.apiPost(surfaces, projectId);
		for (const surface of surfaces) this.delete(surface);
		for (const response of responses) await this.addCloudFile(response);
	}

	async apiPost(
		surfaces: LocalSurfaceFile[],
		projectId: number
	): Promise<CreateSurfaceResponseDto[]> {
		return await this.surfaceClient.create(
			new CreateSurfacesCommand({
				projectId,
				surfaces: await Promise.all(
					surfaces.map(
						async (addedSurfaceFile) =>
							new CreateSurfaceDto({
								base64: await addedSurfaceFile.getBase64(),
								fileName: addedSurfaceFile.name,
								visible: addedSurfaceFile.isChecked,
								order: addedSurfaceFile.order,
								color: addedSurfaceFile.color,
							})
					)
				),
			})
		);
	}

	private async addCloudFile(
		response: CreateSurfaceResponseDto
	): Promise<void> {
		const cloudSurface = new CloudSurfaceFile(
			this.niivueWrapper,
			response,
			this.surfaceClient,
			this.overlayClient,
			this.annotationClient,
			() => this.niivueUpdateOrder()
		);
		this.cloud.push(cloudSurface);
		void cloudSurface.niivueAddNew();
	}

	public delete(file: ProjectFile): void {
		if (file instanceof LocalSurfaceFile)
			return deleteFromArray(this.local, file);
		if (file instanceof CloudSurfaceFile) {
			file.niivueRef !== undefined &&
				this.niivueWrapper.niivue.setMesh(file.niivueRef, -1);
			void this.surfaceClient.delete(new DeleteSurfaceCommand({ id: file.id }));
			deleteFromArray(this.cloud, file);
		}
	}
}
