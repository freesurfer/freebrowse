import { ToolButtonExpandable } from '@/pages/project/components/topBar/ToolButtonExpandable';
import type { ReactElement } from 'react';

export interface IToolButtonSelectEntry {
	label: string;
	icon: ReactElement;
}

export const ToolButtonRadio = ({
	label,
	icon,
	entries,
}: {
	label: string;
	icon: ReactElement;
	entries: [IToolButtonSelectEntry, ...IToolButtonSelectEntry[]];
}): ReactElement => {
	return (
		<ToolButtonExpandable
			label={label}
			icon={icon}
			entries={
				<>
					{entries.map(
						(entry): ReactElement => (
							<div key={entry.label}></div>
						)
					)}
				</>
			}
		/>
	);
};
