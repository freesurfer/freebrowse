import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import { useEffect, type ReactElement, useCallback, useRef } from 'react';
import { useCollapse } from 'react-collapsed';

export const ToolButtonExpandable = ({
	label,
	icon,
	entries,
}: {
	label: string;
	icon: ReactElement;
	entries: ReactElement;
}): ReactElement => {
	const wrapperRef = useRef<HTMLDivElement>(null);

	const { getCollapseProps, getToggleProps, isExpanded, setExpanded } =
		useCollapse({ defaultExpanded: true });

	const handleMouseDown = useCallback(
		({ target }: MouseEvent) => {
			if (wrapperRef.current === undefined) return;
			if (
				wrapperRef.current === null ||
				(target instanceof HTMLElement && wrapperRef.current.contains(target))
			)
				return;
			setExpanded(false);
			document.removeEventListener('mousedown', handleMouseDown);
		},
		[setExpanded]
	);

	useEffect(() => {
		if (!isExpanded) return;
		document.addEventListener('mousedown', handleMouseDown);

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
		};
	}, [handleMouseDown, isExpanded]);

	return (
		<div className="relative" ref={wrapperRef}>
			<ToolButton
				label={label}
				icon={icon}
				buttonProps={{ getToggleProps, isExpanded }}
			></ToolButton>

			<section
				{...getCollapseProps()}
				className="absolute left-0 z-10 w-auto overflow-hidden rounded-md border bg-white shadow-[0_4px_4px_1px_rgba(0,0,0,0.2)]"
			>
				{entries}
			</section>
		</div>
	);
};
