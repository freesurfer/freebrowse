import { ToolButtonEntry } from '@/pages/project/components/topBar/ToolButtonEntry';
import type { ReactElement } from 'react';

export interface IToolButtonSelectEntry {
	label: string;
	icon: (className: string) => ReactElement;
	onClick: () => void;
}

export const ToolButtonSelectEntry = ({
	label,
	icon,
	onClick,
}: IToolButtonSelectEntry): ReactElement => {
	return (
		<ToolButtonEntry
			className="flex items-center gap-3 border-b bg-white text-font last:border-b-0"
			onClick={onClick}
		>
			{icon('w-4 h-4')}
			<span className="pr-12">{label}</span>
		</ToolButtonEntry>
	);
};
