import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

export const ToolButton = ({
	title,
	icon,
	isActive = false,
	isExpandable = false,
}: {
	title: string;
	icon: ReactElement;
	isExpandable?: boolean;
	isActive?: boolean;
}): ReactElement => {
	return (
		<>
			<button
				className={`flex h-full w-20 shrink-0 flex-col items-center rounded pb-3 pt-4 ${
					isActive ? 'bg-primary' : ''
				}`}
			>
				<div className="flex items-center">
					{icon}
					{isExpandable ? (
						<ChevronDownIcon className="h-4 w-4 shrink-0 text-white" />
					) : (
						<></>
					)}
				</div>

				<span className="mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white">
					{title}
				</span>
			</button>
		</>
	);
};
