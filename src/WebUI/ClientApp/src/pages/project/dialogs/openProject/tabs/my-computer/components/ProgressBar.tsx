import type { ReactElement } from 'react';

export const ProgressBar = ({
	progress,
	className,
}: {
	progress: number;
	className?: string;
}): ReactElement => {
	return (
		<div className={`h-0.5 bg-gray-200 ${className ?? ''}`}>
			<div
				style={{ width: `${progress}%` }}
				className={`h-full bg-gray-500`}
			></div>
		</div>
	);
};
