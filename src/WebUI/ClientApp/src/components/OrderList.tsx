import { Checkbox } from '@/components/Checkbox';
import {
	FileLocation,
	type ProjectFile,
} from '@/pages/project/models/file/ProjectFile';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

const CLICK_THRESHOLD = 3;

const makeUniqueLabel = (projectFile: ProjectFile): string =>
	`${projectFile.type}${
		projectFile.location === FileLocation.CLOUD
			? projectFile.id
			: projectFile.name
	}`;

interface IRow<T_FILE_TYPE extends ProjectFile> {
	projectFile: T_FILE_TYPE;
	label: string | undefined;
	ref?: HTMLDivElement | null;
	style?: {
		transition: string;
		transform: string;
		zIndex: string;
	};
	order: number;
	top: number;
	isActive: boolean;
	isChecked: boolean;
}

interface IDragState<T_FILE_TYPE extends ProjectFile> {
	entry: IRow<T_FILE_TYPE>;
	mouseStart: number;
	topStart: number;
	isClick: boolean;
}

const ROW_HEIGHT = 26;

/**
 * this class should maintain the view state
 * since we do not want to rerender the view, on each drag/drop update
 *
 * - keeps html references
 * - keeps drag/drop state
 * - update view on source list changes, without loosing order
 */
class OrderState<T_FILE_TYPE extends ProjectFile> {
	public dragState: IDragState<T_FILE_TYPE> | undefined = undefined;

	private rows: IRow<T_FILE_TYPE>[] = [];
	private isControlKeyPressed = false;

	constructor(
		private readonly setFiles: (files: T_FILE_TYPE[]) => void,
		private readonly setRows: (rows: IRow<T_FILE_TYPE>[]) => void,
		private readonly setFileActive: (file: T_FILE_TYPE) => void
	) {}

	updateSource(files: readonly T_FILE_TYPE[]): void {
		const filesWithOrder = files?.filter((file) => file?.order !== undefined);
		const filesWithoutOrder = files?.filter(
			(file) => file?.order === undefined
		);
		const sortedFilesWithOrder = filesWithOrder?.sort(
			(a, b) => (a?.order ?? 0) - (b?.order ?? 0)
		);

		let order = 0;

		this.rows = [
			...(sortedFilesWithOrder ?? []),
			...(filesWithoutOrder ?? []),
		].map((file): IRow<T_FILE_TYPE> => {
			const currentOrder = order;
			order = order + 1;

			const existsAlready = this.rows.find(
				(row) => makeUniqueLabel(row.projectFile) === makeUniqueLabel(file)
			);

			if (existsAlready === undefined) {
				return {
					projectFile: file,
					label: file?.name,
					order: currentOrder,
					top: currentOrder * ROW_HEIGHT,
					isActive: file?.isActive ?? false,
					isChecked: file?.isChecked ?? false,
				};
			}

			existsAlready.order = currentOrder;
			existsAlready.top = currentOrder * ROW_HEIGHT;
			existsAlready.isActive = file?.isActive;
			existsAlready.isChecked = file?.isChecked;
			existsAlready.projectFile = file;

			return existsAlready;
		});
		this.setRows(this.rows);
		this.pushNewOrder();
	}

	private pushNewOrder(): void {
		const newFiles: T_FILE_TYPE[] = [];
		let orderHasChanged = false;
		for (const row of this.rows) {
			if (row.projectFile.order !== row.order) orderHasChanged = true;
			newFiles.push(row.projectFile.from({ order: row.order }) as T_FILE_TYPE);
		}
		if (orderHasChanged) {
			this.setFiles(newFiles);
		}
	}

	startDrag(mouseStart: number, entry: IRow<T_FILE_TYPE>): void {
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
			transition: `none`,
			transform: `translateY(${this.dragState.entry.top}px)`,
			zIndex: entry.style?.zIndex ?? '',
		};
		entry.ref.style.transition = entry.style.transition;
		entry.ref.style.transform = entry.style.transform;

		this.recomputeOrder();
	}

	drop(): void {
		const dragState = this.dragState;
		this.dragState = undefined;

		if (dragState === undefined) return;

		if (dragState.isClick) {
			if (!this.isControlKeyPressed) {
				this.setFileActive(dragState.entry.projectFile);
				return;
			}
			this.setFiles(
				this.rows.map((row) =>
					row.projectFile === dragState.entry.projectFile
						? (row.projectFile.from({
								isActive: !row.projectFile.isActive,
						  }) as T_FILE_TYPE)
						: row.projectFile
				)
			);
			return;
		}

		this.recomputeOrder();
		// run async to not block UI
		setTimeout(() => {
			this.pushNewOrder();
		}, 0);
	}

	handleKeyDown = (key: string): void => {
		const isMac = window.navigator.userAgent.includes('Mac');
		const controlKey = isMac ? 'Meta' : 'Control';
		switch (key) {
			case controlKey:
				this.isControlKeyPressed = true;
				break;
		}
	};

	handleKeyUp = (key: string): void => {
		const isMac = window.navigator.userAgent.includes('Mac');
		const controlKey = isMac ? 'Meta' : 'Control';
		switch (key) {
			case controlKey:
				this.isControlKeyPressed = false;
				break;
		}
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
					transition: entry.style?.transition ?? '',
					transform: entry.style?.transform ?? '',
					zIndex: '1',
				};
				entry.ref.style.zIndex = entry.style.zIndex;
				continue;
			}

			entry.top = entry.order * ROW_HEIGHT;
			entry.style = {
				transition: `transform .2s ease-in-out`,
				transform: `translateY(${entry.top}px)`,
				zIndex: '0',
			};

			if (entry.ref === undefined || entry.ref === null) continue;

			entry.ref.style.transition = entry.style.transition;
			entry.ref.style.transform = entry.style.transform;
			entry.ref.style.zIndex = entry.style.zIndex;
		}
	}
}

export const OrderList = <T_FILE_TYPE extends ProjectFile>({
	files,
	setFiles,
	setFileActive,
	hideFileExtension = false,
}: {
	files: readonly T_FILE_TYPE[];
	setFiles: (files: T_FILE_TYPE[]) => void;
	setFileActive: (file: T_FILE_TYPE) => void;
	hideFileExtension?: boolean;
}): React.ReactElement => {
	const [rows, setRows] = useState<IRow<T_FILE_TYPE>[]>();
	const state = useRef<OrderState<T_FILE_TYPE>>(
		new OrderState(setFiles, setRows, setFileActive)
	);

	useEffect(() => {
		state.current.updateSource(files);
	}, [files]);

	const handleDrop = useCallback(() => state?.current.drop(), []);
	const handleMove = useCallback(
		(event: MouseEvent) => state?.current.updateDrag(event.pageY),
		[]
	);
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => state?.current.handleKeyDown(event.key),
		[]
	);
	const handleKeyUp = useCallback(
		(event: KeyboardEvent) => state?.current.handleKeyUp(event.key),
		[]
	);

	useEffect(() => {
		document.addEventListener('mousemove', handleMove);
		document.addEventListener('mouseup', handleDrop);
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
		return () => {
			document.removeEventListener('mousemove', handleMove);
			document.removeEventListener('mouseup', handleDrop);
		};
	}, [handleDrop, handleMove, handleKeyDown, handleKeyUp]);

	return (
		<div
			style={{
				height: `${(files?.length ?? 0) * ROW_HEIGHT}px`,
				marginBottom: 2,
				position: 'relative',
			}}
		>
			{rows?.map((row) => {
				if (row.label === undefined) return <></>;
				return (
					<div
						key={makeUniqueLabel(row.projectFile)}
						ref={(ref) => {
							row.ref = ref;
						}}
						style={{
							transform: `translateY(${row.top}px)`,
						}}
						className={`absolute left-0 right-0 top-0 mt-0.5 rounded ${
							row.isActive ? 'bg-primary' : 'bg-white'
						}`}
					>
						<div className="flex w-full items-center">
							<Checkbox
								defaultState={row.projectFile.isChecked}
								setValue={(value) =>
									setFiles(
										files.map((file) => {
											if (file !== row.projectFile) return file;
											return file.from({ isChecked: value }) as T_FILE_TYPE;
										})
									)
								}
							></Checkbox>
							<button
								className="flex w-full items-center pl-1 text-start text-xs"
								onMouseDown={(event) =>
									state.current.startDrag(event.pageY, row)
								}
							>
								<span
									className={`grow overflow-hidden text-ellipsis ${
										row.isActive ? 'font-bold text-white' : ''
									}`}
								>
									{hideFileExtension ? row.label.split('.')[0] : row.label}
								</span>
								<ArrowsUpDownIcon
									className={`m-1 w-4 shrink-0 ${
										row.isActive ? 'text-white' : 'text-font'
									}`}
								></ArrowsUpDownIcon>
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
};
