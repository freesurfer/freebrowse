import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useCollapse } from 'react-collapsed';

export const Collapse = ({
	className,
	title,
	button,
	children,
	initialState = true,
}: {
	className?: string;
	title: React.ReactElement;
	button?: React.ReactElement;
	children: React.ReactElement;
	initialState?: boolean;
}): React.ReactElement => {
	const { getCollapseProps, getToggleProps, isExpanded, setExpanded } =
		useCollapse();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => setExpanded(initialState), []);

	return (
		<div className={className}>
			<div className="flex">
				<button {...getToggleProps()} className="w-full flex items-center">
					<ChevronUpIcon
						className={`w-5 mr-1 transition-transform ${
							isExpanded ? 'rotate-180' : ''
						}`}
					></ChevronUpIcon>
					<div className="grow text-start flex items-center">{title}</div>
				</button>
				{button}
			</div>
			<section {...getCollapseProps()} className="ml-6">
				{children}
			</section>
		</div>
	);
};
