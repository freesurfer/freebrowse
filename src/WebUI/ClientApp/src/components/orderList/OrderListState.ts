import { type ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { type ProjectFilesPointSets } from '@/pages/project/models/ProjectFilesPointSets';
import { type ProjectFilesSurfaces } from '@/pages/project/models/ProjectFilesSurfaces';
import { type ProjectFilesVolumes } from '@/pages/project/models/ProjectFilesVolumes';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import { makeAutoObservable } from 'mobx';

const CLICK_THRESHOLD = 3;
export const ROW_HEIGHT = 26;

export type ArrayElement<ArrayType extends readonly unknown[]> =
	ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export class OrderRow<T_FILE_TYPE extends ProjectFile> {
	ref?: HTMLDivElement | null;
	style?: {
		transform: string;
		zIndex: string;
	};

	constructor(
		public projectFile: T_FILE_TYPE,
		public label: string | undefined,
		public order: number,
		public top: number
	) {
		makeAutoObservable(this, { ref: false });
	}
}

interface IDragState<T_FILE_TYPE extends ProjectFile> {
	entry: OrderRow<T_FILE_TYPE>;
	mouseStart: number;
	topStart: number;
	isClick: boolean;
}

/**
 * this class should maintain the view state
 * since we do not want to rerender the view, on each drag/drop update
 *
 * - keeps html references
 * - keeps drag/drop state
 * - update view on source list changes, without loosing order
 */
export class OrderState<
	T_FILE_TYPE_CONTAINER extends
		| ProjectFilesVolumes['all']
		| ProjectFilesSurfaces['all']
		| ProjectFilesPointSets['all']
> {
	public readonly rows: OrderRow<ArrayElement<T_FILE_TYPE_CONTAINER>>[] = [];

	private dragState:
		| IDragState<ArrayElement<T_FILE_TYPE_CONTAINER>>
		| undefined = undefined;

	private isControlKeyPressed = false;

	constructor(
		private readonly files: ProjectFiles,
		aggregatedFiles: T_FILE_TYPE_CONTAINER,
		private readonly multiselect: boolean,
		private readonly setActiveOnly: (
			file: ArrayElement<T_FILE_TYPE_CONTAINER>
		) => void
	) {
		makeAutoObservable(this);

		// This casts are just quick fixes on mobx introduction
		// there is probably a correct way to deal with the types here
		const filesWithOrder = aggregatedFiles
			.map((file) => (file?.order !== undefined ? file : undefined))
			.filter((file) => file !== undefined);
		const filesWithoutOrder = aggregatedFiles
			.map((file) => (file?.order === undefined ? file : undefined))
			.filter((file) => file !== undefined);
		const sortedFilesWithOrder = filesWithOrder
			?.reverse()
			.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

		[...(sortedFilesWithOrder ?? []), ...(filesWithoutOrder ?? [])].forEach(
			(file, index) => {
				if (file === undefined) return;

				const existsAlready = this.rows.find((row) => row.projectFile === file);

				if (existsAlready === undefined) {
					this.rows.push(
						new OrderRow(
							file as ArrayElement<T_FILE_TYPE_CONTAINER>,
							file?.name,
							index,
							index * ROW_HEIGHT
						)
					);
					return;
				}

				existsAlready.order = index;
				existsAlready.top = index * ROW_HEIGHT;
				existsAlready.projectFile = file as ArrayElement<T_FILE_TYPE_CONTAINER>;
			},
			[]
		);

		this.pushNewOrder();
	}

	private pushNewOrder(): void {
		const orderHasChanged = this.rows.some(
			(row) => row.order !== row.projectFile.order
		);
		if (!orderHasChanged) return;
		this.rows.forEach((row) => row.projectFile.setOrder(row.order));
		this.files.niivueUpdateOrder();
	}

	startDrag(
		mouseStart: number,
		entry: OrderRow<ArrayElement<T_FILE_TYPE_CONTAINER>>
	): void {
		this.dragState = {
			mouseStart,
			entry,
			topStart: entry.top,
			isClick: true,
		};
	}

	updateDrag(positionMove: number): void {
		if (this.dragState === undefined) return;

		if (
			this.dragState.isClick &&
			Math.abs(this.dragState.mouseStart - positionMove) > CLICK_THRESHOLD
		)
			this.dragState.isClick = false;

		const entry = this.dragState.entry;
		if (entry.ref === null || entry.ref === undefined) return;

		const moveDistance = positionMove - (this.dragState?.mouseStart ?? 0);

		this.dragState.entry.top = this.cropToBounds(
			this.dragState.topStart + moveDistance
		);

		entry.style = {
			transform: `translateY(${this.dragState.entry.top}px)`,
			zIndex: entry.style?.zIndex ?? '',
		};
		entry.ref.style.transform = entry.style.transform;

		this.recomputeOrder();
	}

	drop(): void {
		const dragState = this.dragState;
		this.dragState = undefined;

		if (dragState === undefined) return;

		if (dragState.isClick) {
			if (!this.isControlKeyPressed) {
				this.setActiveOnly(dragState.entry.projectFile);
				return;
			}
			if (!this.multiselect && !dragState.entry.projectFile.isActive) {
				this.setActiveOnly(dragState.entry.projectFile);
				return;
			}
			dragState.entry.projectFile.setIsActive(
				!dragState.entry.projectFile.isActive
			);
			return;
		}

		this.recomputeOrder();
		this.pushNewOrder();
	}

	handleKeyDown = (key: string): void => {
		if (key === EventHandler.controlCode) this.isControlKeyPressed = true;
	};

	handleKeyUp = (key: string): void => {
		if (key === EventHandler.controlCode) this.isControlKeyPressed = false;
	};

	private cropToBounds(newPosition: number): number {
		if (newPosition < 0) return 0;
		if (newPosition > (this.rows.length - 1) * ROW_HEIGHT)
			return (this.rows.length - 1) * ROW_HEIGHT;
		return newPosition;
	}

	private recomputeOrder(): void {
		let order = 0;
		for (const entry of this.rows.sort(
			(a, b) => a.top - ROW_HEIGHT / 2 - b.top
		)) {
			entry.order = order;
			order = order + 1;
			if (entry.ref === this.dragState?.entry.ref) {
				if (entry.ref === undefined || entry.ref === null) continue;
				entry.style = {
					transform: entry.style?.transform ?? '',
					zIndex: '1',
				};
				entry.ref.style.zIndex = entry.style.zIndex;
				continue;
			}

			entry.top = entry.order * ROW_HEIGHT;
			entry.style = {
				transform: `translateY(${entry.top}px)`,
				zIndex: '0',
			};

			if (entry.ref === undefined || entry.ref === null) continue;

			entry.ref.style.transform = entry.style.transform;
			entry.ref.style.zIndex = entry.style.zIndex;
		}
	}
}
