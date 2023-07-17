import { ToolButtonExpandable } from '@/pages/project/components/topBar/ToolButtonExpandable';
import {
	ToolButtonRadioEntry,
	type IToolButtonRadioEntry,
} from '@/pages/project/components/topBar/ToolButtonRadioEntry';
import type { ReactElement } from 'react';
import { useCollapse } from 'react-collapsed';

export const ToolButtonRadio = <T_VALUE extends number>({
	entries,
	value,
	onChange,
}: {
	entries: [
		IToolButtonRadioEntry<T_VALUE>,
		...IToolButtonRadioEntry<T_VALUE>[]
	];
	value: T_VALUE;
	onChange: (value: T_VALUE) => void;
}): ReactElement => {
	const activeEntry =
		entries.find((entry) => entry.value === value) ?? entries[0];

	const useCollapseHook = useCollapse();

	return (
		<ToolButtonExpandable
			label={activeEntry.label}
			icon={activeEntry.icon}
			useCollapseHook={useCollapseHook}
			entries={entries.map(
				(entry): ReactElement => (
					<ToolButtonRadioEntry
						key={entry.label}
						{...entry}
						isActive={entry.value === value}
						onClick={(value) => {
							onChange(value);
							/* timeout to debounce the animation a bit
							 * otherwise it would glitch a bit
							 * we should take a look on the project state change detection
							 * we should be able to optimize there to get this faster
							 */
							window.setTimeout(() => {
								useCollapseHook.setExpanded(false);
							}, 250);
						}}
					></ToolButtonRadioEntry>
				)
			)}
		/>
	);
};
