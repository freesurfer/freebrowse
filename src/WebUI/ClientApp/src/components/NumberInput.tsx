import { type ReactElement, useEffect, useState } from 'react';

export const NumberInput = ({
	value,
	onChange,
	onEnter,
	max,
}: {
	value: number;
	onChange: (value: number) => void;
	onEnter: (value: number) => void;
	max: number;
}): ReactElement => {
	const [tmpValue, setTmpValue] = useState<number>(value);
	useEffect(() => {
		setTmpValue(value);
	}, [value]);

	return (
		<input
			className="flex rounded border-[1.5px] border-gray-300 px-2 text-center text-xs"
			type="number"
			value={tmpValue}
			onChange={(event) =>
				setTmpValue(
					parseInt(event.target.value) > max
						? max
						: parseInt(event.target.value)
				)
			}
			onBlurCapture={() => onChange(tmpValue)}
			onKeyDown={(event) => event.code === 'Enter' && onEnter(tmpValue)}
			min={1}
			max={max}
		></input>
	);
};
