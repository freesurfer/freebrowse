import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import { deleteFromArray } from '@/pages/project/models/file/ProjectFileHelper';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { AnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import type { OverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import type { ISurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import { type NVMesh } from '@niivue/niivue';
import { makeObservable, action, observable } from 'mobx';

export class LocalSurfaceFile
	extends LocalFile
	implements ISurfaceFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.SURFACE;
	public readonly progress = 100;
	public readonly size: number;
	public niivueOrderIndex: number | undefined;
	public niivueRef: NVMesh | undefined;

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		file: File,
		public isActive = false,
		public isChecked = true,
		public order: number | undefined = undefined,
		public color = '#ffffff',
		public overlayFiles: OverlayFile[] = [],
		public annotationFiles: AnnotationFile[] = []
	) {
		super(file);
		makeObservable(this, {
			setOrder: action,
			setIsActive: action,
			setIsChecked: action,
			setColor: action,
			addLocalOverlay: action,
			addLocalAnnotation: action,
			deleteOverlay: action,
			deleteAnnotation: action,
			order: observable,
			isChecked: observable,
			isActive: observable,
			color: observable,
			overlayFiles: observable,
			annotationFiles: observable,
		});
		this.size = file.size;
	}

	setOrder(order: number): void {
		if (this.order === order) return;
		this.order = order;
	}

	setNiivueOrderIndex(niivueOrderIndex: number): void {
		if (this.niivueOrderIndex === niivueOrderIndex) return;

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
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}

	setColor(color: string): void {
		if (this.color === color) return;
		this.color = color;
	}

	addLocalOverlay(file: File): void {
		if (this.overlayFiles.some((overlayFile) => overlayFile.name === file.name))
			return;
		this.overlayFiles.forEach((file) => file.setIsActive(false));
		this.overlayFiles.push(new LocalOverlayFile(file));
	}

	addLocalAnnotation(file: File): void {
		if (
			this.annotationFiles.some(
				(annotationFile) => annotationFile.name === file.name
			)
		)
			return;
		this.annotationFiles.forEach((file) => file.setIsActive(false));
		this.annotationFiles.push(new LocalAnnotationFile(file));
	}

	deleteOverlay(file: OverlayFile): void {
		deleteFromArray(this.overlayFiles, file);
	}

	deleteAnnotation(file: AnnotationFile): void {
		deleteFromArray(this.annotationFiles, file);
	}

	setActiveFile(file: OverlayFile | AnnotationFile): void {
		if (file.isActive) {
			file.setIsActive(false);
			return;
		}

		[...this.annotationFiles, ...this.overlayFiles].forEach((iterateFile) =>
			iterateFile.setIsActive(false)
		);
		file.setIsActive(true);
	}
}
