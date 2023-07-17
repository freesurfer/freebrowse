import { CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export const Checkbox = ({
	defaultState,
	setValue,
}: {
	defaultState?: boolean;
	setValue?: (value: boolean) => void;
}): React.ReactElement => {
	const [isChecked, setIsChecked] = useState<boolean>(defaultState ?? true);

	return (
		<label className="m-1 cursor-pointer text-gray">
			<input
				type="checkbox"
				className="hidden"
				checked={isChecked}
				onChange={() => {
					setIsChecked((isChecked) => {
						setValue?.(!isChecked);
						return !isChecked;
					});
				}}
			></input>
			<div
				className={`h-4 w-4 rounded border ${
					isChecked ? 'bg-primary' : 'bg-white'
				}`}
			>
				{isChecked ? (
					<CheckIcon className="h-full w-full p-0.5 font-bold text-white"></CheckIcon>
				) : (
					<></>
				)}
			</div>
		</label>
	);
};
