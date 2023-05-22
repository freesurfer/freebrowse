import { MainRouter } from '@/MainRouter';
import { LoadDialog } from '@/dialogs/load/LoadDialog';
import '@/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<LoadDialog>
			<MainRouter />
		</LoadDialog>
	</React.StrictMode>
);
