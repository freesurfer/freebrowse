import { Cog8ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

const ICON_SIZE = 1;

export const Button = ({
	icon,
	title,
	onClick,
}: {
	icon: 'settings' | 'remove';
	title?: string;
	onClick: () => void;
}): ReactElement => {
	const iconStyle = { width: `${ICON_SIZE}rem`, height: `${ICON_SIZE}rem` };

	const iconChooser = (): ReactElement => {
		switch (icon) {
			case 'settings':
				return <Cog8ToothIcon style={iconStyle}></Cog8ToothIcon>;
			case 'remove':
				return <XMarkIcon style={iconStyle}></XMarkIcon>;
		}
	};

	const titleChooser = (): ReactElement => {
		if (title !== undefined)
			return <span className="mx-1 font-semibold">{title}</span>;
		return <></>;
	};

	return (
		<button
			onClick={onClick}
			className="flex rounded-[0.25rem] border border-primary p-0.5 text-primary"
		>
			{iconChooser()}
			{titleChooser()}
		</button>
	);
};
