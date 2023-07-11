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
			className="flex items-center gap-2 border-b last:border-b-0"
			onClick={onClick}
		>
			{icon('w-5 h-5')}
			<span>{label}</span>
		</ToolButtonEntry>
	);
};
