import type React from 'react';
import { useState } from 'react';

export const DropDown = ({
	className,
	label,
	value,
	onChange,
	options,
}: {
	className?: string;
	label: string;
	value: string;
	onChange?: (value: string) => void;
	options: string[];
}): React.ReactElement => {
	const [selectedValue, setSelectedValue] = useState(value);

	const updateValue = (newValue: string): void => {
		setSelectedValue(newValue);
		onChange?.(newValue);
	};

	return (
		<div className={className}>
			<div className="flex items-center">
				<label className="grow">{label}</label>
				<select
					value={selectedValue}
					onChange={(event) => updateValue(event.target.value)}
					className="h-5 w-24 rounded border border-gray"
				>
					{options.map((option, index) => (
						<option key={index} value={option}>
							{option}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};
