import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import { useEffect, type ReactElement, useCallback, useRef } from 'react';
import type { useCollapse } from 'react-collapsed';

export const ToolButtonExpandable = ({
	label,
	icon,
	entries,
	useCollapseHook,
}: {
	label: string;
	icon: (className: string) => ReactElement;
	entries: ReactElement[];
	/**
	 * create the hook outside of the element to maintain the state there
	 * this is necessary to set the expanded state from there as well
	 */
	useCollapseHook: ReturnType<typeof useCollapse>;
}): ReactElement => {
	const wrapperRef = useRef<HTMLDivElement>(null);

	const { getCollapseProps, getToggleProps, isExpanded, setExpanded } =
		useCollapseHook;

	const handleMouseDown = useCallback(
		({ target }: MouseEvent) => {
			/*
			 * delay the detection a bit
			 * sometimes it seems, that if the collapse animation has not finished
			 * it detects a click on the button as an outside click and will not react on the click
			 */
			window.setTimeout(() => {
				if (wrapperRef.current === undefined) return;
				if (
					wrapperRef.current === null ||
					(target instanceof HTMLElement && wrapperRef.current.contains(target))
				)
					return;
				setExpanded(false);
				document.removeEventListener('mousedown', handleMouseDown);
			}, 150);
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
				className="absolute left-0 z-10 w-auto overflow-hidden rounded border bg-white shadow-[0_4px_4px_1px_rgba(0,0,0,0.2)]"
			>
				{entries}
			</section>
		</div>
	);
};
