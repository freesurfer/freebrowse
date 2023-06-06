import { MainRouter } from '@/MainRouter';
import '@/index.css';
import { OpenProjectDialog } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<OpenProjectDialog>
			<MainRouter />
		</OpenProjectDialog>
	</React.StrictMode>
);
