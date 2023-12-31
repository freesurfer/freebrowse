import type { ReactElement } from 'react';

export const SaveAllIcon = ({
	className,
}: {
	className: string;
}): ReactElement => {
	return (
		<div className={className}>
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M17.5909 3V14.5909L13.5 12.5455L9.40909 14.5909V3M17.5909 3H18.9545C19.497 3 20.0173 3.2155 20.4009 3.5991C20.7845 3.9827 21 4.50297 21 5.04545V15.9545C21 16.497 20.7845 17.0173 20.4009 17.4009C20.0173 17.7845 19.497 18 18.9545 18H8.04545C7.50297 18 6.9827 17.7845 6.5991 17.4009C6.2155 17.0173 6 16.497 6 15.9545V5.04545C6 4.50297 6.2155 3.9827 6.5991 3.5991C6.9827 3.2155 7.50297 3 8.04545 3H9.40909M17.5909 3H9.40909"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M19 17.9545C19 18.497 18.7845 19.0173 18.4009 19.4009C18.0173 19.7845 17.497 20 16.9545 20H6.04545C5.50297 20 4.9827 19.7845 4.5991 19.4009C4.2155 19.0173 4 18.497 4 17.9545V7.04545C4 6.50297 4.2155 5.9827 4.5991 5.5991C4.9827 5.2155 5.50297 5 6.04545 5"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
};
