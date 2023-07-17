import type { ReactElement } from 'react';

export const Button = ({
	icon,
	readonly = false,
	onClick,
}: {
	icon: (className: string) => ReactElement;
	readonly?: boolean;
	onClick: () => void;
}): ReactElement => {
	return (
		<button
			onClick={
				readonly
					? () => {
							/* do nothing */
					  }
					: onClick
			}
			className={`flex rounded border-[1.5px]  p-0.5  ${
				readonly ? 'border-gray text-gray' : 'border-primary text-primary'
			}`}
		>
			{icon('w-4 h-4 shrink-0')}
		</button>
	);
};
