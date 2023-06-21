import { useRef, useCallback, useEffect } from 'react';

const normalizeValue = (value: number): number => {
	if (value > 100) return 100;
	if (value < 0) return 0;
	return Math.round(value);
};

export const Slider = ({
	className,
	label,
	value,
	unit,
	onChange,
	onEnd,
}: {
	className?: string;
	label: string;
	value: number;
	unit?: string | undefined;
	onChange?: (value: number) => void;
	onEnd?: (value: number) => void;
}): React.ReactElement => {
	const state = useRef<{
		/**
		 * keeps dragging state
		 * is undefined while no drag is in progress
		 */
		startState: { position: number; value: number } | undefined;
		/**
		 * reference to the whole part of the slider bar in the background
		 */
		width: number | undefined;
	}>({
		startState: undefined,
		width: undefined,
	});

	const onMove = useCallback(
		(event: Event): void => {
			if (
				state.current.width === undefined ||
				state.current.startState === undefined ||
				!(event instanceof MouseEvent)
			)
				return;

			onChange?.(
				normalizeValue(
					((event.pageX - state.current.startState.position) /
						state.current.width) *
						100 +
						state.current.startState.value
				)
			);
		},
		[onChange]
	);

	const onDrop = useCallback((): void => {
		state.current.startState = undefined;
		onEnd?.(normalizeValue(value));
	}, [onEnd, value]);

	const jumpTo = useCallback(
		(position: number, startPagePosition: number): void => {
			if (state.current.width === undefined) return;
			state.current.startState = {
				position: startPagePosition,
				value,
			};
			onChange?.(normalizeValue((position / state.current.width) * 100));
		},
		[onChange, value]
	);

	useEffect(() => {
		document.addEventListener('mouseup', onDrop);
		return () => document.removeEventListener('mouseup', onDrop);
	}, [onDrop]);

	useEffect(() => {
		document.addEventListener('mousemove', onMove);
		return () => document.removeEventListener('mousemove', onMove);
	}, [onMove]);

	return (
		<div className={className}>
			<div className="flex items-center">
				<label className="grow">{label}</label>
				<input
					type="number"
					onChange={(event) =>
						onChange?.(normalizeValue(Number(event.target.value)))
					}
					onBlur={() => {
						onEnd?.(normalizeValue(value));
					}}
					value={String(value)}
					step={1}
					min={0}
					max={100}
					className="flex h-5 w-10 items-center justify-center rounded border border-gray px-1 py-3 text-center text-sm"
				></input>
				{unit !== undefined ? <span className="ml-1">{unit}</span> : <></>}
			</div>
			{
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				<div
					className="relative my-2 h-4 grow"
					onMouseDown={(e) =>
						jumpTo(e.clientX - e.currentTarget.offsetLeft, e.pageX)
					}
				>
					<div
						ref={(ref) => {
							state.current.width = ref?.clientWidth;
						}}
						className="absolute mt-1 h-2 w-full rounded bg-gray"
					></div>
					<div
						style={{ width: `${value}%` }}
						className="absolute mt-1 h-2 rounded bg-blue-light"
					></div>
					<button
						onMouseDown={(event) => {
							event.preventDefault();
							event.stopPropagation();
							state.current.startState = {
								position: event.pageX,
								value,
							};
						}}
						style={{ marginLeft: `${value}%` }}
						className="absolute -left-2 h-4 w-4 cursor-pointer rounded-full border-2 border-blue-light bg-white"
					></button>
				</div>
			}
		</div>
	);
};
