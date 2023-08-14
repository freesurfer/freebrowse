import { isValidColor } from '@/pages/project/dialogs/ColorHelper';
import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import { type ReactElement } from 'react';

export const ColorPicker = ({
	className = '',
	grow = false,
	label,
	value,
	onChange,
	onBlur,
}: {
	className?: string;
	grow?: boolean;
	label: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: (value: string) => void;
}): ReactElement => {
	return (
		<div className={`flex flex-row items-center gap-1 ${className}`}>
			<div
				className={`flex flex-row items-baseline gap-1 ${grow ? 'grow' : ''}`}
			>
				<span className={`text-xs ${grow ? 'grow' : ''}`}>{label}</span>
				<input
					className="h-6 w-20 rounded border border-gray-200 px-2 py-0 text-sm"
					type="text"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onBlur={(event) => onBlur?.(event.target.value)}
					{...EventHandler.onKeyGate()}
				></input>
			</div>
			<label className="relative h-6 w-6 before:contents before:w-0 before:whitespace-pre">
				<input
					className="absolute bottom-0 h-0 w-0 overflow-hidden"
					type="color"
					value={isValidColor(value) ? value : '#ffffff'}
					onChange={(event) => onChange(event.target.value)}
					onBlur={(event) => onBlur?.(event.target.value)}
					{...EventHandler.onKeyGate()}
				></input>
				<div
					className="absolute bottom-0 top-0 w-6 cursor-pointer rounded-md border border-gray-200"
					style={{ backgroundColor: `${value}` }}
				></div>
			</label>
		</div>
	);
};
