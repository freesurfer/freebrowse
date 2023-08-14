import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import type { ReactElement } from 'react';

export const TextInputRow = ({
	className = '',
	label,
	onChange,
	readonly = false,
	value,
}: {
	className?: string;
	label: string;
	onChange: (value: string) => void;
	readonly?: boolean;
	value?: string;
}): ReactElement => {
	return (
		<div className={`flex flex-col ${className}`}>
			<span className="text-xs text-gray-500">{label}</span>
			<input
				className="mt-1 w-64 rounded border border-gray-400 px-3 py-2 text-gray-500"
				type="text"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				readOnly={readonly}
				{...EventHandler.onKeyGate()}
			></input>
		</div>
	);
};
