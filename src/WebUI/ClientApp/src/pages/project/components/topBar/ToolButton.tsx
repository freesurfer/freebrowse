import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useCallback, type ReactElement } from 'react';
import type { useCollapse } from 'react-collapsed';

type IButtonProps =
	| {
			getToggleProps: ReturnType<typeof useCollapse>['getToggleProps'];
			isExpanded: boolean;
	  }
	| {
			onClick: () => void;
	  };

export const ToolButton = ({
	label,
	icon,
	buttonProps,
}: {
	label: string;
	icon: ReactElement;
	buttonProps: IButtonProps;
}): ReactElement => {
	const getProps = useCallback((): Partial<
		ReturnType<typeof useCollapse>['getToggleProps']
	> => {
		if ('getToggleProps' in buttonProps) return buttonProps.getToggleProps();
		return buttonProps;
	}, [buttonProps]);

	return (
		<button
			{...getProps()}
			className="flex h-full w-20 shrink-0 flex-col items-center rounded pb-3 pt-4 last-of-type:ml-auto active:bg-primary"
		>
			<div className="flex items-center">
				{icon}
				{'getToggleProps' in buttonProps ? (
					<ChevronDownIcon
						className={`h-4 w-4 shrink-0 text-white transition-transform ${
							buttonProps.isExpanded ? 'rotate-180' : ''
						}`}
					/>
				) : (
					<></>
				)}
			</div>

			<span className="mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white">
				{label}
			</span>
		</button>
	);
};
