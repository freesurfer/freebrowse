import type { ReactElement } from 'react';

export const NameIcon = ({
	userName,
	size,
}: {
	userName: string;
	size: 'small' | 'big';
}): ReactElement => {
	return (
		<div
			className={`flex items-center justify-center rounded-full border border-font bg-red text-white ${
				size === 'small' ? 'h-4 w-4' : 'h-6 w-6'
			}`}
		>
			{userName.at(0)?.toUpperCase()}
		</div>
	);
};
