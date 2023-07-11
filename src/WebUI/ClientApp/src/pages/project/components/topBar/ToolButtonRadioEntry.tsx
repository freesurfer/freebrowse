import { ToolButtonEntry } from '@/pages/project/components/topBar/ToolButtonEntry';
import type { ReactElement } from 'react';

export interface IToolButtonRadioEntry<T_VALUE extends number> {
	label: string;
	icon: (className: string) => ReactElement;
	value: T_VALUE;
	shortcut: string;
}

export const ToolButtonRadioEntry = <T_VALUE extends number>({
	label,
	icon,
	shortcut,
	value,
	isActive,
	onClick,
}: IToolButtonRadioEntry<T_VALUE> & {
	onClick: (value: T_VALUE) => void;
	isActive: boolean;
}): ReactElement => {
	return (
		<ToolButtonEntry
			className={`flex w-full items-center gap-2 ${
				isActive ? 'bg-primary text-white' : 'text-font'
			}`}
			onClick={() => onClick(value)}
		>
			<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border">
				<span className="h-1 w-1 rounded-full bg-white"></span>
			</span>
			{icon('w-4 h-4')}
			<span className="grow pr-12 text-left">{label}</span>
			<span>{shortcut}</span>
		</ToolButtonEntry>
	);
};
