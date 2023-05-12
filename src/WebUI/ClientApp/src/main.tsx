import { MainRouter } from '@/MainRouter';
import { ModalDialog } from '@/ModalDialog';
import '@/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ModalDialog>
			<MainRouter />
		</ModalDialog>
	</React.StrictMode>
);
