import { useReducer, type ReactElement, useCallback } from 'react';

const isValid = (color: string): boolean => /^#[0-9A-F]{6}$/i.test(color);

export const ColorPickerRow = ({
	className = '',
	label,
	onChange,
}: {
	className?: string;
	label: string;
	onChange: (value: string) => void;
	readonly?: boolean;
}): ReactElement => {
	const colorReducer = useCallback(
		(prevColor: string, newColor: string) => {
			if (isValid(newColor)) onChange(newColor);
			return newColor;
		},
		[onChange]
	);
	const [color, setColor] = useReducer(colorReducer, '#ffffff');

	return (
		<div className={`flex flex-row items-center gap-1 ${className}`}>
			<div className="flex flex-row items-baseline gap-1">
				<span className="text-xs text-gray-500">{label}</span>
				<input
					className="h-6 w-20 rounded border border-gray-400 px-2 py-0 text-sm text-gray-500"
					type="text"
					value={color}
					onChange={(event) => setColor(event.target.value)}
				></input>
			</div>
			<label className="relative h-6 before:contents before:w-0 before:whitespace-pre">
				<input
					className="absolute bottom-0 h-0 w-0 overflow-hidden"
					type="color"
					value={color}
					onChange={(event) => setColor(event.target.value)}
				></input>
				<div
					className="absolute bottom-0 top-0 w-6 cursor-pointer rounded-md border border-gray-400"
					style={{ backgroundColor: `${color}` }}
				></div>
			</label>
		</div>
	);
};
