import { type ReactElement, useReducer, useCallback, useEffect } from 'react';

export const NumberInput = ({
	value,
	onChange,
	max,
}: {
	value: number;
	onChange: (value: number) => void;
	max: number;
}): ReactElement => {
	const reducer = useCallback(
		(prevValue: number, newValue: number) => {
			if (newValue > max) newValue = max;
			if (prevValue === newValue) return prevValue;
			if (!isNaN(newValue)) onChange(newValue);
			return newValue;
		},
		[onChange, max]
	);
	const [tmpValue, setTmpValue] = useReducer(reducer, value);
	useEffect(() => {
		setTmpValue(value);
	}, [value]);

	return (
		<input
			className="flex rounded border-[1.5px] border-gray-300 px-2 text-center text-xs"
			type="number"
			value={tmpValue}
			onChange={(event) => setTmpValue(parseInt(event.target.value))}
			onBlurCapture={() => setTmpValue(value)}
			min={1}
			max={max}
		></input>
	);
};
