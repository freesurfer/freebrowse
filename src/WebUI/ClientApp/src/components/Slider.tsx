import { useCallback, useEffect, useState, createRef, useRef } from 'react';

/**
 * time in milliseconds to un stress the render interval on value updates
 * otherwise it was possible that react was terminating because of too much state updates
 */
const UNBOUNCE_DELAY = 10;

const normalizeValue = (value: number, min: number, max: number): number => {
	if (value > max) return max;
	if (value < min) return min;
	return Math.round(value);
};

/**
 * our slider implementation
 * react-slider is not working, since the thumbs are overlaying the module dialog
 * also this custom plugin supports the difference between status updates for updating the UI only (onChange)
 * and final updates, which should get propagated to the backend (onEnd)
 */
export const Slider = ({
	className,
	label,
	value,
	min = 0,
	max = 100,
	unit,
	onChange,
	onEnd,
}: {
	className?: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	unit?: string | undefined;
	onChange?: (value: number) => void;
	onEnd?: (value: number) => void;
}): React.ReactElement => {
	/**
	 * the data needed for the mouseMove transition to know,
	 * where it has started and that it's in progress right now
	 */
	const [startState, setStartState] = useState<{
		position: number;
		value: number;
	}>();
	/**
	 * reference of the underlying slider to read the maximum range from it
	 */
	const widthRef = createRef<HTMLDivElement>();
	const unStressState = useRef<{
		isLocked: boolean;
		timeout: NodeJS.Timeout | undefined;
		action: (() => void) | undefined;
	}>({ isLocked: false, timeout: undefined, action: undefined });

	const updateValue = useCallback(
		(newValue: number, upload: boolean) => {
			const doIt = (): void => {
				if (!upload) {
					onChange?.(normalizeValue(newValue, min, max));
					return;
				}
				onEnd?.(normalizeValue(newValue, min, max));
			};

			if (unStressState.current.isLocked) {
				unStressState.current.action = doIt;
				return;
			}

			unStressState.current.isLocked = true;
			doIt();

			unStressState.current.timeout = setTimeout(() => {
				unStressState.current.timeout = undefined;
				if (unStressState.current.action !== undefined)
					unStressState.current.action();
				unStressState.current.isLocked = false;
				unStressState.current.action = undefined;
			}, UNBOUNCE_DELAY);
		},
		[onEnd, onChange, min, max]
	);

	/**
	 * on mouse move, when the drag is in progress
	 */
	const onMove = useCallback(
		(event: Event): void => {
			if (
				widthRef.current === null ||
				startState === undefined ||
				!(event instanceof MouseEvent)
			)
				return;

			const range = max - min;
			const width = widthRef.current.clientWidth;
			const positionDiff = event.pageX - startState.position;
			const valueDiff = Math.round((positionDiff / width) * range);

			const relativePosition = startState.value + valueDiff;

			updateValue(relativePosition, false);
		},
		[startState, widthRef, updateValue, min, max]
	);

	/**
	 * when the user drops the thumb, it should update the value if the drag is in progress
	 */
	const onDrop = useCallback(
		(event: Event): void => {
			if (
				widthRef.current === null ||
				startState === undefined ||
				!(event instanceof MouseEvent)
			)
				return;

			setStartState(undefined);

			const range = max - min;
			const width = widthRef.current.clientWidth;
			const positionDiff = event.pageX - startState.position;
			const valueDiff = Math.round((positionDiff / width) * range);

			const relativePosition = startState.value + valueDiff;

			updateValue(relativePosition, true);
		},
		[updateValue, setStartState, startState, widthRef, min, max]
	);

	/**
	 * method to jump to a specific place on the slider,
	 * to enable the user to not only move the thumb,
	 * but also click on other parts of the slider to adapt the value
	 */
	const jumpTo = useCallback(
		(event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
			event.preventDefault();
			event.stopPropagation();

			if (widthRef.current === null || event.currentTarget === null) return;

			const range = max - min;
			const position = event.clientX - event.currentTarget.offsetLeft;
			const newValue = Math.round(
				(position / widthRef.current.clientWidth) * range + min
			);

			updateValue(newValue, true);

			setStartState({
				position: event.pageX,
				value: newValue,
			});
		},
		[widthRef, setStartState, updateValue, min, max]
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
					onChange={(event) => updateValue(Number(event.target.value), false)}
					onBlur={() => updateValue(value, true)}
					value={String(Math.round(value))}
					step={1}
					min={min}
					max={max}
					className="flex h-5 w-10 items-center justify-center rounded border border-gray px-1 py-3 text-center text-sm"
				></input>
				{unit !== undefined ? <span className="ml-1">{unit}</span> : <></>}
			</div>
			{
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				<div className="relative my-2 h-4 grow" onMouseDown={jumpTo}>
					<div
						ref={widthRef}
						className="absolute mt-1 h-2 w-full rounded bg-gray"
					></div>
					<div
						style={{
							width: `${((value - min) / (max - min)) * 100}%`,
						}}
						className="absolute mt-1 h-2 rounded bg-primary"
					></div>
					<button
						onMouseDown={(event) => {
							event.preventDefault();
							event.stopPropagation();
							setStartState({
								position: event.pageX,
								value,
							});
						}}
						style={{
							marginLeft: `${((value - min) / (max - min)) * 100}%`,
						}}
						className="absolute -left-2 h-4 w-4 cursor-pointer rounded-full border-2 border-primary bg-white"
					></button>
				</div>
			}
		</div>
	);
};
