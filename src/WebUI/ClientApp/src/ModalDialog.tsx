import { Tabs } from '@/components/Tabs';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createContext, useState } from 'react';
import Modal from 'react-modal';

interface ModalHandle {
	/**
	 * open the modal dialog
	 */
	readonly open: () => void;
}

export const ModalContext = createContext<ModalHandle>({
	open: () => {
		console.warn('not initialized yet');
	},
});

const customStyles = {
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
	},
};

/**
 * Make sure to bind modal to your appElement
 * https://reactcommunity.org/react-modal/accessibility/
 */
const bindModalToRoot = (): void => {
	const rootElement = document.getElementById('root');
	if (rootElement !== null) Modal.setAppElement(rootElement);
};
bindModalToRoot();

export const ModalDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const [modalIsOpen, setIsOpen] = useState(false);

	/**
	 * this callbacks will be accessible from everywhere in the app
	 * using the useContext hook
	 */
	const modalHandle = {
		open: (): void => {
			setIsOpen(true);
		},
	};

	/**
	 * close the modal dialog
	 */
	const closeModal = (): void => {
		setIsOpen(false);
	};

	return (
		<>
			<ModalContext.Provider value={modalHandle}>
				{children}
			</ModalContext.Provider>
			<Modal
				isOpen={modalIsOpen}
				style={customStyles}
				contentLabel="Load volumes & surfaces"
			>
				<div className="flex gap-4 items-center">
					<ArrowUpTrayIcon className="text-gray-600 h-8 w-8 shrink-0"></ArrowUpTrayIcon>
					<h1 className="text-lg text-gray-500 font-bold mr-8">
						Load volumes & surfaces
					</h1>
				</div>
				<button
					onClick={() => closeModal()}
					className="text-gray-600 absolute right-0 top-0 p-2"
				>
					<XMarkIcon className="h-6 w-6 shrink-0"></XMarkIcon>
				</button>

				<Tabs
					className="mt-4"
					tabs={[
						{ title: 'My computer', content: <>Content 1</> },
						{ title: 'Cloud', content: <>TODO</> },
					]}
				/>

				<button onClick={() => closeModal()}>Cancel</button>
				<button onClick={() => alert('open')}>Open</button>
			</Modal>
		</>
	);
};
