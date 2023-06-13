import { Checkbox } from '@/components/Checkbox';
import type { ProjectFile } from '@/pages/project/models/ProjectFile';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef } from 'react';

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
}

const ROW_HEIGHT = 30;

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

	constructor(private readonly setFiles: (files: T_FILE_TYPE[]) => void) {}

	updateSource(files: readonly T_FILE_TYPE[]): void {
		const filesWithOrder = files?.filter((file) => file?.order !== undefined);
		const filesWithoutOrder = files?.filter(
			(file) => file?.order === undefined
		);
		const sortedFilesWithOrder = filesWithOrder?.sort(
			(a, b) => (a?.order ?? 0) - (b?.order ?? 0)
		);

		let orderCount = -1;

		this.rows = [
			...(sortedFilesWithOrder ?? []),
			...(filesWithoutOrder ?? []),
		].map((file): IRow<T_FILE_TYPE> => {
			orderCount++;

			const existsAlready = this.rows.find(
				(row) => row.projectFile.name === file?.name
			);
			if (existsAlready === undefined) {
				return {
					projectFile: file,
					label: file?.name,
					order: orderCount,
					top: orderCount * ROW_HEIGHT,
					isActive: file?.isActive ?? false,
					isChecked: file?.isChecked ?? false,
				};
			}

			existsAlready.order = orderCount;
			existsAlready.top = orderCount * ROW_HEIGHT;
			existsAlready.isActive = file?.isActive;
			existsAlready.isChecked = file?.isChecked;
			existsAlready.projectFile = file;

			return existsAlready;
		});
	}

	getRows(): IRow<T_FILE_TYPE>[] {
		return this.rows;
	}

	startDrag(mouseStart: number, entry: IRow<T_FILE_TYPE>): void {
		console.log('BERE', this.getRows()[0]?.ref);
		this.dragState = {
			mouseStart,
			entry,
			topStart: entry.top,
		};
	}

	updateDrag(positionMove: number): void {
		if (this.dragState === undefined) return;

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
		this.dragState = undefined;
		this.recomputeOrder();

		/* TODO trigger only on change
		const newFiles = this.rows.map(
			(row) => row.projectFile.fromOrder(row.order) as T_FILE_TYPE
		);

		this.setFiles(newFiles);
		*/
	}

	private cropToBounds(newPosition: number): number {
		if (newPosition < 0) return 0;
		if (newPosition > (this.rows.length - 1) * ROW_HEIGHT)
			return (this.rows.length - 1) * ROW_HEIGHT;
		return newPosition;
	}

	private recomputeOrder(): void {
		let orderCount = -1;
		for (const entry of this.rows.sort(
			(a, b) => a.top - ROW_HEIGHT / 2 - b.top
		)) {
			entry.order = orderCount++;
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

			entry.top = orderCount * ROW_HEIGHT;
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
}: {
	files: readonly T_FILE_TYPE[];
	setFiles: (files: T_FILE_TYPE[]) => void;
}): React.ReactElement => {
	const state = useRef<OrderState<T_FILE_TYPE>>(
		new OrderState((files) => setFiles(files))
	);

	useEffect(() => {
		state.current.updateSource(files);
	}, [files]);

	const handleDrop = useCallback(() => state?.current.drop(), []);
	useEffect(() => {
		window.addEventListener('mouseup', handleDrop);
		return () => window.removeEventListener('mouseup', handleDrop);
	}, [handleDrop]);

	return (
		<div
			style={{
				height: `${(files?.length ?? 0) * ROW_HEIGHT}px`,
				marginBottom: 2,
				position: 'relative',
			}}
			onMouseMove={(event) => state.current.updateDrag(event.pageY)}
			onMouseLeave={(event) => handleDrop()}
		>
			{state.current.getRows().map((row) => {
				if (row.label === undefined) return <></>;
				return (
					<div
						key={row.label}
						ref={(ref) => {
							row.ref = ref;
						}}
						style={{
							transform: `translateY(${row.top}px)`,
						}}
						className={`absolute rounded h-7 mt-0.5 top-0 left-0 right-0 ${
							row.isActive ? 'bg-gray-500' : 'bg-gray-100'
						}`}
					>
						<button
							className={`flex text-start items-center w-full`}
							onClick={(event) => {
								setFiles(
									state.current.getRows().map((tmpRow) => {
										if (tmpRow.projectFile === row.projectFile) {
											return tmpRow.projectFile.fromIsActive(
												true
											) as T_FILE_TYPE;
										}
										return tmpRow.projectFile;
									})
								);
								event.stopPropagation();
							}}
							onMouseDown={(event) => state.current.startDrag(event.pageY, row)}
						>
							<Checkbox defaultState={true}></Checkbox>
							<span
								className={`grow cursor-default text-ellipsis overflow-hidden ${
									row.isActive ? 'text-white' : ''
								}`}
							>
								{row.label}
							</span>
							<ArrowsUpDownIcon
								className={`w-5 shrink-0 m-1 ${
									row.isActive ? 'text-white' : 'text-gray-500'
								}`}
							></ArrowsUpDownIcon>
						</button>
					</div>
				);
			})}
		</div>
	);
};
