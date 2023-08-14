import { CheckIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

export const Checkbox = ({
	value,
	onChange,
}: {
	value: boolean;
	onChange: (value: boolean) => void;
}): ReactElement => {
	return (
		<label className="m-1 cursor-pointer text-gray">
			<input
				type="checkbox"
				className="hidden"
				checked={value}
				onChange={() => {
					onChange?.(!value);
					return !value;
				}}
			></input>
			<div
				className={`h-4 w-4 rounded border ${
					value ? 'bg-primary' : 'bg-white'
				}`}
			>
				{value ? (
					<CheckIcon className="h-full w-full p-0.5 font-bold text-white"></CheckIcon>
				) : (
					<></>
				)}
			</div>
		</label>
	);
};
