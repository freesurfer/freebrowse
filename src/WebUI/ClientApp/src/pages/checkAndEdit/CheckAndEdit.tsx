import { LeftBar } from '@/pages/checkAndEdit/layout/LeftBar';
import { MainView } from '@/pages/checkAndEdit/layout/MainView';
import { RightBar } from '@/pages/checkAndEdit/layout/RightBar';
import { TopBar } from '@/pages/checkAndEdit/topBar/TopBar';
import { useState } from 'react';
import Modal from 'react-modal';

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

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
// Modal.setAppElement('#yourAppElement');

export const CheckAndEdit = (): React.ReactElement => {
	let subtitle: HTMLHeadingElement | null;
	const [modalIsOpen, setIsOpen] = useState(false);

	/*
	const openModal = (): void => {
		setIsOpen(true);
	};
	*/

	const afterOpenModal = (): void => {
		if (subtitle === null) return;
		// references are now sync'd and can be accessed.
		subtitle.style.color = '#f00';
	};

	const closeModal = (): void => {
		setIsOpen(false);
	};

	return (
		<div className="flex flex-col h-full">
			<TopBar></TopBar>
			<div className="flex flex-row h-full">
				<LeftBar></LeftBar>
				<MainView></MainView>
				<RightBar></RightBar>
			</div>
			<Modal
				isOpen={modalIsOpen}
				onAfterOpen={afterOpenModal}
				onRequestClose={closeModal}
				style={customStyles}
				contentLabel="Example Modal"
			>
				<h2
					ref={(_subtitle) => {
						subtitle = _subtitle;
						return subtitle;
					}}
				>
					Hello
				</h2>
				<button onClick={closeModal}>close</button>
				<div>I am a modal</div>
				<form>
					<input />
					<button>tab navigation</button>
					<button>stays</button>
					<button>inside</button>
					<button>the modal</button>
				</form>
			</Modal>
		</div>
	);
};
