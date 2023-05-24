import { Collapse } from '@/components/Collapse';
import { OrderList } from '@/components/OrderList';
import {
	OpenProjectDialogContext,
	LOAD_DIALOG_ERROR,
} from '@/dialogs/openProject/OpenProjectDialog';
import { ProjectContext } from '@/pages/project/ProjectPage';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';

export const LoadedFiles = (): React.ReactElement => {
	const { project, selectedFile, setSelectedFile } = useContext(ProjectContext);
	const { editProject } = useContext(OpenProjectDialogContext);

	const loadFiles = async (): Promise<void> => {
		try {
			await editProject();
		} catch (error) {
			if (error === LOAD_DIALOG_ERROR.DIALOG_OPENED_ALREADY) return;
			console.error('something went wrong opening files', error);
		}
	};

	return (
		<Collapse
			className="border-b border-gray-300 p-1"
			title={<span className="font-semibold">Loaded Files</span>}
			button={
				<button
					onClick={(event) => {
						event.stopPropagation();
						void loadFiles();
					}}
					className="bg-gray-500 text-white grow-0 w-6 h-6 items-center justify-center p-2 rounded-md flex"
				>
					<ArrowUpTrayIcon className="h-4 w-4 shrink-0"></ArrowUpTrayIcon>
				</button>
			}
		>
			<>
				<Collapse
					title={<span className="border-b border-gray-300 grow">Volumes</span>}
				>
					<OrderList
						entries={project?.volumes}
						activeFileName={selectedFile}
						setActiveFileName={setSelectedFile}
					></OrderList>
				</Collapse>
				<Collapse
					title={
						<span className="border-b border-gray-300 grow">Surfaces</span>
					}
				>
					<OrderList
						entries={project?.surfaces}
						activeFileName={selectedFile}
						setActiveFileName={setSelectedFile}
					></OrderList>
				</Collapse>
			</>
		</Collapse>
	);
};
