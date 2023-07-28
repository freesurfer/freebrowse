import { MainRouter } from '@/MainRouter';
import '@/index.css';
import { DownloadFilesDialog } from '@/pages/project/dialogs/downloadFiles/DownloadFilesDialog';
import { NewPointSetDialog } from '@/pages/project/dialogs/newPointSet/NewPointSetDialog';
import { OpenProjectDialog } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactNotifications } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ReactNotifications />
		<OpenProjectDialog>
			<DownloadFilesDialog>
				<NewPointSetDialog>
					<MainRouter />
				</NewPointSetDialog>
			</DownloadFilesDialog>
		</OpenProjectDialog>
	</React.StrictMode>
);
