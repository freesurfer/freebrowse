import type { ReactElement } from 'react';

export const ToolButtonEntry = ({
	children,
	className,
	onClick,
}: {
	children: ReactElement | ReactElement[];
	className: string;
	onClick: () => void;
}): ReactElement => {
	return (
		<button
			className={`whitespace-nowrap bg-white p-2 text-xs text-font ${className}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
};
