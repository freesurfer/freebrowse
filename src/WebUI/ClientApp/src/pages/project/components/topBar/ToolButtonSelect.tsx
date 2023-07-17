import { ToolButtonExpandable } from '@/pages/project/components/topBar/ToolButtonExpandable';
import {
	type IToolButtonSelectEntry,
	ToolButtonSelectEntry,
} from '@/pages/project/components/topBar/ToolButtonSelectEntry';
import type { ReactElement } from 'react';
import { useCollapse } from 'react-collapsed';

export const ToolButtonSelect = ({
	label,
	icon,
	entries,
}: {
	label: string;
	icon: (className: string) => ReactElement;
	entries: [IToolButtonSelectEntry, ...IToolButtonSelectEntry[]];
}): ReactElement => {
	const useCollapseHook = useCollapse();

	return (
		<ToolButtonExpandable
			label={label}
			icon={icon}
			useCollapseHook={useCollapseHook}
			entries={entries.map(
				(entry): ReactElement => (
					<ToolButtonSelectEntry
						key={entry.label}
						label={entry.label}
						icon={entry.icon}
						onClick={() => {
							entry.onClick();
							useCollapseHook.setExpanded(false);
						}}
					></ToolButtonSelectEntry>
				)
			)}
		/>
	);
};
