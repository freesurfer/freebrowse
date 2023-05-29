import { CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export const Checkbox = ({
	defaultState,
}: {
	defaultState?: boolean;
}): React.ReactElement => {
	const [isChecked, setIsChecked] = useState<boolean>(defaultState ?? true);

	return (
		<label className="cursor-pointer text-gray-500 m-1">
			<input
				type="checkbox"
				className="hidden"
				checked={isChecked}
				onChange={() => setIsChecked(!isChecked)}
			></input>
			<div
				className={`w-5 h-5 border rounded-[3px] ${
					isChecked ? 'bg-gray-500' : 'bg-white'
				}`}
			>
				{isChecked ? (
					<CheckIcon className="w-full h-full p-0.5 text-white "></CheckIcon>
				) : (
					<></>
				)}
			</div>
		</label>
	);
};
