import {
	GetProjectSurfaceDto,
	type SurfaceClient,
	EditSurfaceCommand,
	CreateOverlaysCommand,
	CreateOverlayDto,
	type CreateSurfaceResponseDto,
	CreateAnnotationsCommand,
	CreateAnnotationDto,
	DeleteOverlayCommand,
	DeleteAnnotationCommand,
	type OverlayClient,
	type AnnotationClient,
	type CreateAnnotationResponseDto,
} from '@/generated/web-api-client';
import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import { deleteFromArray } from '@/pages/project/models/file/ProjectFileHelper';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { AnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import type { OverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import type { ISurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import { getApiUrl } from '@/utils';
import { NVMesh } from '@niivue/niivue';
import { makeObservable, action, observable, runInAction } from 'mobx';

const DEBOUNCE_COLOR_TIME = 100;

export class CloudSurfaceFile
	extends CloudFile
	implements ISurfaceFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.SURFACE;
	public readonly progress = 100;

	public readonly size: number;
	public isActive = false;
	public isChecked: boolean;
	public order: number | undefined;
	public niivueOrderIndex: number | undefined;
	public color = '#ffffff';
	public overlayFiles: OverlayFile[] = [];
	public annotationFiles: AnnotationFile[] = [];

	public niivueRef: NVMesh | undefined;

	private debounceTimer: number | undefined;
	private debounceInProgress = false;
	private debounceRequested = false;

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		dto: GetProjectSurfaceDto | CreateSurfaceResponseDto,
		private readonly surfaceClient: SurfaceClient,
		private readonly overlayClient: OverlayClient,
		private readonly annotationClient: AnnotationClient,
		private readonly niivueUpdateOrder: () => void
	) {
		if (dto === undefined)
			throw new Error('undefined array entry is not allowed');
		if (dto?.id === undefined) throw new Error('no file without file id');
		if (dto?.fileName === undefined)
			throw new Error('no file without file name');
		if (dto?.fileSize === undefined)
			throw new Error('no file without file size');

		super(
			dto.id,
			dto.fileName,
			`${getApiUrl()}/api/Surface?Id=${String(dto.id)}`
		);

		makeObservable(this, {
			setOrder: action,
			setColor: action,
			setIsActive: action,
			setIsChecked: action,
			addLocalOverlay: action,
			addLocalAnnotation: action,
			addCloudAnnotation: action,
			deleteOverlay: action,
			deleteAnnotation: action,
			order: observable,
			isChecked: observable,
			isActive: observable,
			color: observable,
			overlayFiles: observable,
			annotationFiles: observable,
		});

		this.size = dto.fileSize;

		this.isChecked = dto.visible ?? true;
		this.order = dto.order ?? 0;
		dto.color !== undefined && this.setColor(dto.color);

		if (dto instanceof GetProjectSurfaceDto) {
			this.overlayFiles =
				dto.overlays?.map(
					(overlayDto) => new CloudOverlayFile(overlayDto, this.overlayClient),
					this.overlayClient
				) ?? [];
			this.annotationFiles =
				dto.annotations?.map(
					(annotationDto) =>
						new CloudAnnotationFile(annotationDto, this.annotationClient)
				) ?? [];
		}
	}

	get activeCascadingFile():
		| CloudOverlayFile
		| CloudAnnotationFile
		| undefined {
		const activeFile = [...this.overlayFiles, ...this.annotationFiles].find(
			(file) => file.isActive
		);
		if (activeFile instanceof CloudOverlayFile) return activeFile;
		if (activeFile instanceof CloudAnnotationFile) return activeFile;
		return undefined;
	}

	private async updateCascadingFile(): Promise<void> {
		if (this.niivueRef === undefined) return;

		const activeFile = this.activeCascadingFile;
		if (activeFile === undefined) {
			this.niivueRef.layers = [];
			this.niivueRef.updateMesh(this.niivueWrapper.niivue.gl);
			return;
		}

		// necessary if something wents wrong to clean the state from before
		this.niivueRef.layers = [];

		await NVMesh.loadLayer(
			{
				name: activeFile.name,
				url: activeFile.url,
				cal_min: 0.5,
				cal_max: 5.5,
				useNegativeCmap: true,
				opacity: 0.7,
			},
			this.niivueRef
		);
		this.niivueRef.updateMesh(this.niivueWrapper.niivue.gl);
	}

	setNiivueRef(niivueRef: NVMesh): void {
		this.niivueRef = niivueRef;
		void this.updateCascadingFile();
	}

	setOrder(order: number): void {
		this.order = order;
		void this.apiPutOptions();
	}

	setNiivueOrderIndex(niivueOrderIndex: number): void {
		this.niivueOrderIndex = niivueOrderIndex;
		this.updateNiivueOrder();
	}

	private updateNiivueOrder(): void {
		if (this.niivueRef === undefined || this.niivueOrderIndex === undefined)
			return;
		this.niivueWrapper.niivue.setMesh(this.niivueRef, this.niivueOrderIndex);
	}

	setIsChecked(isChecked: boolean): void {
		if (this.isChecked === isChecked) return;
		this.isChecked = isChecked;

		if (isChecked && this.niivueRef !== undefined) this.niivueAddFromRef();
		if (isChecked && this.niivueRef === undefined) void this.niivueAddNew();

		if (!isChecked && this.niivueRef !== undefined) this.niivueDelete();

		void this.apiPutOptions();
	}

	private niivueAddFromRef(): void {
		if (this.niivueRef === undefined) return;
		this.niivueWrapper.niivue.meshes.push(this.niivueRef);
		this.niivueWrapper.niivue.setMesh(this.niivueRef, this.niivueOrderIndex);
		this.niivueUpdateOrder();
	}

	async niivueAddNew(): Promise<void> {
		if (!this.isChecked) return;

		const niivueSurface = await this.niivueWrapper.niivue.addMeshFromUrl({
			url: this.url,
			name: this.name,
			rgba255: NiivueWrapper.hexToRGBA(this.color),
		});
		this.setNiivueRef(niivueSurface);
		this.niivueUpdateOrder();
	}

	private niivueDelete(): void {
		if (this.niivueRef === undefined) return;
		this.niivueWrapper.niivue.setMesh(this.niivueRef, -1);
		this.niivueUpdateOrder();
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}

	setColor(color: string, upload = true): void {
		this.color = color;
		this.niivueUpdateColor();
		if (upload) void this.apiPutOptions();
	}

	private niivueUpdateColor(): void {
		if (this.niivueRef === undefined) return;

		if (this.debounceInProgress) {
			this.debounceRequested = true;
			return;
		}
		this.debounceInProgress = true;
		this.debounceTimer = window.setTimeout(() => {
			this.debounceInProgress = false;
			if (this.debounceRequested) this.niivueUpdateColor();
			this.debounceRequested = false;
		}, DEBOUNCE_COLOR_TIME);

		const newRgba = NiivueWrapper.hexToRGBA(this.color);
		if (NiivueWrapper.compareRgba(this.niivueRef.rgba255, newRgba)) return;

		this.niivueWrapper.niivue.setMeshProperty(
			this.niivueWrapper.niivue.getMeshIndexByID(this.niivueRef.id),
			'rgba255',
			newRgba
		);
	}

	private async apiPutOptions(): Promise<void> {
		await this.surfaceClient.edit(
			new EditSurfaceCommand({
				id: this.id,
				order: this.order,
				color: this.color,
				visible: this.isChecked,
			})
		);
	}

	addLocalOverlay(file: File): void {
		if (this.overlayFiles.some((overlayFile) => overlayFile.name === file.name))
			return;
		this.overlayFiles.forEach((file) => file.setIsActive(false));
		const newOverlayFile = new LocalOverlayFile(file);
		this.overlayFiles.push(newOverlayFile);

		void this.apiPostOverlay(newOverlayFile);
	}

	private async apiPostOverlay(overlayFile: LocalOverlayFile): Promise<void> {
		const responses = await this.overlayClient.create(
			new CreateOverlaysCommand({
				surfaceId: this.id,
				overlays: [
					new CreateOverlayDto({
						fileName: overlayFile.name,
						base64: await overlayFile.getBase64(),
						color: undefined,
						opacity: 100,
					}),
				],
			})
		);

		this.deleteOverlay(overlayFile);

		for (const response of responses) {
			runInAction(() =>
				this.overlayFiles.push(
					new CloudOverlayFile(
						Object.assign(response, { selected: overlayFile.isActive }),
						this.overlayClient
					)
				)
			);
		}

		await this.redrawCascadingFiles();
	}

	addLocalAnnotation(file: File): void {
		if (
			this.annotationFiles.some(
				(annotationFile) => annotationFile.name === file.name
			)
		)
			return;
		this.annotationFiles.forEach((file) => file.setIsActive(false));
		const newAnnotationFile = new LocalAnnotationFile(file);
		this.annotationFiles.push(newAnnotationFile);

		void this.apiPostAnnotation(newAnnotationFile);
	}

	private async apiPostAnnotation(
		annotationFile: LocalAnnotationFile
	): Promise<void> {
		const responses = await this.annotationClient.create(
			new CreateAnnotationsCommand({
				surfaceId: this.id,
				annotations: [
					new CreateAnnotationDto({
						fileName: annotationFile.name,
						base64: await annotationFile.getBase64(),
						color: undefined,
						selected: annotationFile.isActive,
					}),
				],
			})
		);

		this.deleteAnnotation(annotationFile);
		this.addCloudAnnotation(responses, annotationFile.isActive);
	}

	addCloudAnnotation(
		responses: CreateAnnotationResponseDto[],
		selected: boolean
	): void {
		for (const response of responses) {
			this.annotationFiles.push(
				new CloudAnnotationFile(
					Object.assign(response, { selected }),
					this.annotationClient
				)
			);
		}
		void this.updateCascadingFile();
	}

	deleteOverlay(overlayFile: OverlayFile): void {
		deleteFromArray(this.overlayFiles, overlayFile);

		void this.redrawCascadingFiles();

		if (overlayFile instanceof CloudOverlayFile)
			void this.apiDeleteOverlay(overlayFile);
	}

	private async apiDeleteOverlay(overlayFile: CloudOverlayFile): Promise<void> {
		await this.overlayClient.delete(
			new DeleteOverlayCommand({ id: overlayFile.id })
		);
	}

	deleteAnnotation(annotationFile: AnnotationFile): void {
		deleteFromArray(this.annotationFiles, annotationFile);

		void this.redrawCascadingFiles();

		if (annotationFile instanceof CloudAnnotationFile)
			void this.apiDeleteAnnotation(annotationFile);
	}

	private async apiDeleteAnnotation(
		annotationFile: CloudAnnotationFile
	): Promise<void> {
		await this.annotationClient.delete(
			new DeleteAnnotationCommand({ id: annotationFile.id })
		);
	}

	private async redrawCascadingFiles(): Promise<void> {
		await this.updateCascadingFile();
		this.niivueWrapper.niivue.updateGLVolume();
	}

	setActiveFile(file: OverlayFile | AnnotationFile): void {
		if (file.isActive) {
			file.setIsActive(false);
			void this.redrawCascadingFiles();
			return;
		}

		[...this.annotationFiles, ...this.overlayFiles].forEach((iterateFile) =>
			iterateFile.setIsActive(false)
		);
		file.setIsActive(true);
		void this.redrawCascadingFiles();
	}
}
