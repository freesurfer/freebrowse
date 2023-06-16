import { useRef, useCallback, useEffect } from 'react';

const normalizeValue = (value: number): number => {
	if (value > 100) return 100;
	if (value < 0) return 0;
	return Math.round(value);
};

export const Slider = ({
	className,
	label,
	defaultValue,
	unit,
	onChange,
	onEnd,
}: {
	className?: string;
	label: string;
	defaultValue: number;
	unit?: string | undefined;
	onChange?: (value: number) => void;
	onEnd?: (value: number) => void;
}): React.ReactElement => {
	const state = useRef<{
		/**
		 * the temporary value
		 * not each increment is getting pushed to the parent
		 */
		value: number;
		/**
		 * keeps dragging state
		 * is undefined while no drag is in progress
		 */
		startState: { position: number; value: number } | undefined;
		/**
		 * reference to the manual input element above the slider
		 */
		inputRef: HTMLInputElement | null;
		/**
		 * reference to the whole part of the slider bar in the background
		 */
		rangeRef: HTMLDivElement | null;
		/**
		 * reference to the left part of the slider bar in the background
		 */
		progressRef: HTMLDivElement | null;
		/**
		 * knop html reference
		 */
		knopRef: HTMLButtonElement | null;
		/**
		 * to un stress value updates to the callback while dragging
		 */
		isLocked: boolean;
	}>({
		value: normalizeValue(defaultValue),
		startState: undefined,
		inputRef: null,
		rangeRef: null,
		progressRef: null,
		knopRef: null,
		isLocked: false,
	});

	const setValue = useCallback(
		(value: number): void => {
			const previousValue = state.current.value;
			state.current.value = normalizeValue(value);

			if (previousValue === state.current.value) return;

			if (state.current.inputRef !== null)
				state.current.inputRef.value = String(state.current.value);
			if (state.current.progressRef !== null)
				state.current.progressRef.style.width = `${state.current.value}%`;
			if (state.current.knopRef !== null && state.current.rangeRef !== null)
				state.current.knopRef.style.marginLeft = `${state.current.value}%`;

			if (state.current.isLocked) return;
			state.current.isLocked = true;
			onChange?.(state.current.value);
			setTimeout(() => {
				state.current.isLocked = false;
			}, 1000);
		},
		[onChange]
	);

	const onStart = useCallback(
		(position: number): void => {
			state.current.startState = {
				position,
				value: state.current.value,
			};
		},
		[state]
	);

	const onMove = useCallback(
		(event: Event): void => {
			if (
				state.current.rangeRef === null ||
				state.current.startState === undefined ||
				!(event instanceof MouseEvent)
			)
				return;

			setValue(
				((event.pageX - state.current.startState.position) /
					state.current.rangeRef.clientWidth) *
					100 +
					state.current.startState.value
			);
		},
		[setValue]
	);

	const onDrop = useCallback((): void => {
		state.current.startState = undefined;
		onEnd?.(state.current.value);
	}, [onEnd]);

	const jumpTo = useCallback(
		(position: number, startPagePosition: number): void => {
			if (state.current.rangeRef === null) return;
			setValue((position / state.current.rangeRef.clientWidth) * 100);
			onStart(startPagePosition);
		},
		[setValue, onStart]
	);

	useEffect(() => {
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onDrop);

		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onDrop);
		};
	}, [onDrop, onMove]);

	return (
		<div className={className}>
			<div className="flex items-center">
				<label className="grow">{label}</label>
				<input
					ref={(ref) => {
						state.current.inputRef = ref;
					}}
					type="number"
					onChange={(event) => setValue(Number(event.target.value))}
					onBlur={() => onEnd?.(state.current.value)}
					defaultValue={String(state.current.value)}
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
							state.current.rangeRef = ref;
						}}
						className="absolute mt-1 h-2 w-full rounded bg-gray"
					></div>
					<div
						style={{ width: `${state.current.value}%` }}
						ref={(ref) => {
							state.current.progressRef = ref;
						}}
						className="absolute mt-1 h-2 rounded bg-blue-light"
					></div>
					<button
						ref={(ref) => {
							state.current.knopRef = ref;
						}}
						onMouseDown={(event) => {
							event.preventDefault();
							event.stopPropagation();
							onStart(event.pageX);
						}}
						style={{ marginLeft: `${state.current.value}%` }}
						className="absolute -left-2 h-4 w-4 cursor-pointer rounded-full border-2 border-blue-light bg-white"
					></button>
				</div>
			}
		</div>
	);
};
