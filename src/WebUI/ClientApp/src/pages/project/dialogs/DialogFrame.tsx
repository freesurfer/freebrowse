import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';
import Modal from 'react-modal';

/**
 * Make sure to bind modal to your appElement
 * https://reactcommunity.org/react-modal/accessibility/
 */
const bindModalToRoot = (): void => {
	const rootElement = document.getElementById('root');
	if (rootElement !== null) Modal.setAppElement(rootElement);
};
bindModalToRoot();

const dialogStyle = {
	overlay: {
		zIndex: 1,
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
		padding: '0px',
		maxHeight: '100vh',
		maxWidth: '100vw',
	},
};

/**
 * helper for dialogs to keep the same headline and buttons
 */
export const DialogFrame = ({
	children,
	isOpen,
	onDone,
	onCancel,
	title,
	doneButtonLabel,
	icon,
}: {
	children: ReactElement;
	isOpen: boolean;
	onDone: () => void;
	onCancel: () => void;
	title: string;
	doneButtonLabel: string;
	icon: ReactElement;
}): ReactElement => {
	return (
		<Modal isOpen={isOpen} style={dialogStyle} contentLabel={title}>
			<div className="m-4 flex items-center gap-4">
				{icon}
				<h1 className="mr-12 text-xl font-bold text-gray-500">{title}</h1>
			</div>
			<button
				onClick={onCancel}
				className="absolute right-0 top-0 p-2 text-gray-600"
			>
				<XMarkIcon className="h-6 w-6 shrink-0"></XMarkIcon>
			</button>
			{children}
			<div className="m-2 flex justify-end">
				<button
					className="m-2 rounded-md bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500"
					onClick={onCancel}
				>
					Cancel
				</button>
				<button
					className="m-2 rounded-md bg-gray-500 px-5 py-3 text-sm font-semibold text-white"
					onClick={onDone}
				>
					{doneButtonLabel}
				</button>
			</div>
		</Modal>
	);
};
