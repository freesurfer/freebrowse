import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { type ReactElement, useEffect } from 'react';
import { useCollapse } from 'react-collapsed';

export const Collapse = ({
	className,
	title,
	titleBarElement,
	children,
	initialState = true,
}: {
	className?: string;
	title: ReactElement;
	titleBarElement?: ReactElement;
	children: ReactElement;
	initialState?: boolean;
}): ReactElement => {
	const { getCollapseProps, getToggleProps, isExpanded, setExpanded } =
		useCollapse({ defaultExpanded: initialState });

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => setExpanded(initialState), []);

	return (
		<div className={className}>
			<div className="flex">
				<button {...getToggleProps()} className="flex w-full items-center">
					<ChevronUpIcon
						className={`mx-1 w-4 transition-transform ${
							isExpanded ? 'rotate-180' : ''
						}`}
					></ChevronUpIcon>
					<div className="flex grow items-center text-start">{title}</div>
				</button>
				{titleBarElement}
			</div>
			<section {...getCollapseProps()}>
				<div className="ml-5">{children}</div>
			</section>
		</div>
	);
};
