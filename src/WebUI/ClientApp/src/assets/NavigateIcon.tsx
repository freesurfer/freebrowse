import type { ReactElement } from 'react';

export const NavigateIcon = ({
	className,
}: {
	className: string;
}): ReactElement => {
	return (
		<div className={className}>
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3 12L6 15M3 12L6 9M3 12L11.5 12M12 21L9 18M12 21L15 18M12 21L12 12.5M12 3L9 6M12 3L15 6M12 3L12 11.5M21 12L18 15M21 12L18 9M21 12L12.5 12"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
};
