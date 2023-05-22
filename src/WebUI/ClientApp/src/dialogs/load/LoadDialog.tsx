import { Tabs } from '@/components/Tabs';
import { MyComputerDialogTab } from '@/dialogs/load/MyComputerDialogTab';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createContext, useState } from 'react';
import Modal from 'react-modal';

interface LoadDialogHandle {
	/**
	 * open the modal dialog
	 */
	readonly open: () => void;
}

export const LoadDialogContext = createContext<LoadDialogHandle>({
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
		padding: '0px',
		maxHeight: '100vh',
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

export const LoadDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const [modalIsOpen, setIsOpen] = useState(true);

	/**
	 * this callbacks will be accessible from everywhere in the app
	 * using the useContext hook
	 */
	const modalHandle = {
		open: (): void => {
			if (modalIsOpen) return;
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
			<LoadDialogContext.Provider value={modalHandle}>
				{children}
			</LoadDialogContext.Provider>
			<Modal
				isOpen={modalIsOpen}
				style={customStyles}
				contentLabel="Load volumes & surfaces"
			>
				<div className="flex gap-4 items-center m-4">
					<ArrowUpTrayIcon className="text-gray-500 h-8 w-8 shrink-0"></ArrowUpTrayIcon>
					<h1 className="text-xl text-gray-500 font-bold mr-12">
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
					tabs={[
						{
							title: 'My computer',
							content: <MyComputerDialogTab></MyComputerDialogTab>,
						},
						{
							title: 'Cloud',
							content: <></>,
						},
					]}
				/>

				<div className="flex justify-end m-2">
					<button
						className="m-2 bg-gray-200 text-gray-500 text-sm font-semibold px-5 py-3 rounded-md"
						onClick={() => closeModal()}
					>
						Cancel
					</button>
					<button
						className="m-2 bg-gray-500 text-white text-sm font-semibold px-5 py-3 rounded-md"
						onClick={() => alert('open')}
					>
						Open
					</button>
				</div>
			</Modal>
		</>
	);
};
