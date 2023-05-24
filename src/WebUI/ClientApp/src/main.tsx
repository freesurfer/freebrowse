import { MainRouter } from '@/MainRouter';
import { OpenProjectDialog } from '@/dialogs/openProject/OpenProjectDialog';
import '@/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<OpenProjectDialog>
			<MainRouter />
		</OpenProjectDialog>
	</React.StrictMode>
);
