import { useState } from 'react';
import ReactSlider from 'react-slider';

export const Slider = ({
	className,
	label,
	defaultValue,
	unit,
	onChange,
}: {
	className?: string;
	label: string;
	defaultValue: number;
	unit?: string | undefined;
	onChange?: (value: number) => void;
}): React.ReactElement => {
	const [value, setValue] = useState<number>(defaultValue);

	return (
		<div className={className}>
			<div className="flex items-center">
				<label className="grow">{label}</label>
				<input
					type="number"
					value={value}
					onChange={(event) => {
						setValue(Number(event.target.value));
						onChange?.(value);
					}}
					className="w-12 h-5 text-center flex justify-center items-center p-1 text-sm border rounded"
				></input>
				{unit !== undefined ? <span className="ml-1">{unit}</span> : <></>}
			</div>
			<ReactSlider
				className="flex-grow h-7"
				thumbClassName="bg-white border-[1.8px] border-gray-400 w-4 h-4 cursor-pointer rounded-full flex items-center justify-center"
				trackClassName="mt-1 rounded h-2 bg-gray-400"
				value={value}
				onChange={(value) => {
					setValue(value);
					onChange?.(value);
				}}
			/>
		</div>
	);
};
