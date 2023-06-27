import { MainRouter } from '@/MainRouter';
import '@/index.css';
import { OpenProjectDialog } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactNotifications } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ReactNotifications />
		<OpenProjectDialog>
			<MainRouter />
		</OpenProjectDialog>
	</React.StrictMode>
);
