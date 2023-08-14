import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import { type ReactElement } from 'react';

export const NumberInput = ({
	value,
	onChange,
	min,
	max,
}: {
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
}): ReactElement => {
	return (
		<input
			className="flex w-20 rounded border-[1.5px] border-gray-300 px-2 text-center text-xs"
			type="number"
			value={value}
			onChange={(event) =>
				onChange(Math.min(Math.max(parseInt(event.target.value), min), max))
			}
			{...EventHandler.onKeyGate()}
			min={min}
			max={max}
		></input>
	);
};
