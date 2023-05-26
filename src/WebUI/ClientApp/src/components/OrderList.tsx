import { Checkbox } from '@/components/Checkbox';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef } from 'react';

interface IOrderedListEntry {
	label: string | undefined;
	order?: number | undefined;
}

interface IOrderedListCacheEntry {
	label: string | undefined;
	ref?: HTMLDivElement | null;
	order: number;
	top: number;
}

interface IDragState {
	entry: IOrderedListCacheEntry;
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
class OrderState {
	public dragState: IDragState | undefined = undefined;

	#list: IOrderedListCacheEntry[] = [];

	constructor(
		private readonly updateOrder:
			| ((entries: IOrderedListEntry[]) => void)
			| undefined
	) {}

	updateAndGet(
		entries: (IOrderedListEntry | undefined)[] | undefined
	): IOrderedListCacheEntry[] {
		const entriesWithOrder = entries?.filter(
			(entry) => entry?.order !== undefined
		);
		const entriesWithoutOrder = entries?.filter(
			(entry) => entry?.order === undefined
		);
		const sortedEntriesWithOrder = entriesWithOrder?.sort(
			(a, b) => (a?.order ?? 0) - (b?.order ?? 0)
		);

		let orderCount = -1;

		this.#list = [
			...(sortedEntriesWithOrder ?? []),
			...(entriesWithoutOrder ?? []),
		].map((entry) => {
			orderCount++;
			return {
				label: entry?.label,
				order: orderCount,
				top: orderCount * ROW_HEIGHT,
			};
		});
		return this.#list;
	}

	startDrag(mouseStart: number, entry: IOrderedListCacheEntry): void {
		this.dragState = {
			mouseStart,
			entry,
			topStart: entry.top,
		};
	}

	updateDrag(positionMove: number): void {
		if (this.dragState === undefined) return;

		const ref = this.dragState.entry.ref;
		if (ref === null || ref === undefined) return;

		const moveDistance = positionMove - (this.dragState?.mouseStart ?? 0);

		this.dragState.entry.top = this.#cropToBounds(
			this.dragState.topStart + moveDistance
		);

		ref.style.transition = `none`;
		ref.style.transform = `translateY(${this.dragState.entry.top}px)`;

		this.#recomputeOrder();
	}

	drop(): void {
		this.dragState = undefined;
		this.#recomputeOrder();
		this.updateOrder?.(
			this.#list.map((entry) => ({
				label: entry.label,
				order: entry.order,
			}))
		);
	}

	#cropToBounds(newPosition: number): number {
		if (newPosition < 0) return 0;
		if (newPosition > (this.#list.length - 1) * ROW_HEIGHT)
			return (this.#list.length - 1) * ROW_HEIGHT;
		return newPosition;
	}

	#recomputeOrder(): void {
		let orderCount = -1;
		for (const entry of this.#list.sort(
			(a, b) => a.top - ROW_HEIGHT / 2 - b.top
		)) {
			entry.order = orderCount++;
			if (entry.ref === this.dragState?.entry.ref) continue;
			entry.top = orderCount * ROW_HEIGHT;
			if (entry.ref === undefined || entry.ref === null) continue;
			entry.ref.style.transition = `transform .2s ease-in-out`;
			entry.ref.style.transform = `translateY(${entry.top}px)`;
		}
	}
}

export const OrderList = ({
	entries,
	activeFileName,
	setActiveFileName,
	updateOrder,
}: {
	entries: (IOrderedListEntry | undefined)[] | undefined;
	activeFileName: string | undefined;
	setActiveFileName: (fileName: string | undefined) => void;
	updateOrder?: (entries: IOrderedListEntry[]) => void;
}): React.ReactElement => {
	const state = useRef<OrderState>(new OrderState(updateOrder));

	const handleDrop = useCallback(() => state?.current.drop(), []);
	useEffect(() => {
		window.addEventListener('mouseup', handleDrop);
		return () => window.removeEventListener('mouseup', handleDrop);
	}, [state, handleDrop]);

	return (
		<div
			style={{
				height: `${(entries?.length ?? 0) * ROW_HEIGHT}px`,
				marginBottom: 2,
				position: 'relative',
			}}
			onMouseMove={(event) => state.current.updateDrag(event.pageY)}
		>
			{state.current.updateAndGet(entries)?.map((entry) => {
				if (entry === undefined) return <></>;
				const fileName = entry.label;
				if (fileName === undefined) return <></>;
				const isActive =
					activeFileName !== undefined && activeFileName === fileName;
				return (
					<div
						key={fileName}
						ref={(ref) => {
							entry.ref = ref;
						}}
						style={{
							transform: `translateY(${entry.top}px)`,
						}}
						className={`absolute rounded h-7 mt-0.5 top-0 left-0 right-0 ${
							isActive ? 'bg-gray-500' : ''
						}`}
					>
						<button
							className={`flex text-start items-center w-full`}
							onClick={() => setActiveFileName(fileName)}
						>
							<Checkbox defaultState={true}></Checkbox>
							<span
								className={`grow cursor-default text-ellipsis overflow-hidden ${
									isActive ? 'text-white' : ''
								}`}
							>
								{fileName}
							</span>
							<ArrowsUpDownIcon
								onMouseDown={(event) =>
									state.current.startDrag(event.pageY, entry)
								}
								// onMouseUp={(event) => state.current.drop()}
								onClick={(event) => event.stopPropagation()}
								className={`w-5 shrink-0 text-gray-500 m-1 ${
									isActive ? 'text-white' : ''
								}`}
							></ArrowsUpDownIcon>
						</button>
					</div>
				);
			})}
		</div>
	);
};
