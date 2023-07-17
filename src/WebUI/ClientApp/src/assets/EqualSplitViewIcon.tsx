import type { ReactElement } from 'react';

export const EqualSplitViewIcon = ({
	className,
}: {
	className: string;
}): ReactElement => {
	return (
		<div className={className}>
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect
					x="2.5"
					y="2.5"
					width="19"
					height="19"
					rx="4.5"
					stroke="currentColor"
				/>
				<line x1="12" y1="2" x2="12" y2="22" stroke="#ffffff" />
				<line x1="22" y1="12" x2="2" y2="12" stroke="#ffffff" />
			</svg>
		</div>
	);
};
