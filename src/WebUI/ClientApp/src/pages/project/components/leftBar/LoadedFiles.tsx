import { Collapse } from '@/components/Collapse';
import { OrderList } from '@/components/OrderList';
import { ProjectContext } from '@/pages/project/ProjectPage';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';

export const LoadedFiles = (): React.ReactElement => {
	const { projectState, setProjectState, selectedFile, setSelectedFile } =
		useContext(ProjectContext);
	const { editProject } = useContext(OpenProjectDialogContext);

	if (projectState === undefined) {
		return <></>;
	}

	const loadFiles = async (): Promise<void> => {
		try {
			const projectFiles = await editProject(projectState);
			if (projectFiles === 'canceled') return;
			setProjectState(projectState.fromFiles(projectFiles));
		} catch (error) {
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
						entries={projectState.files.volumes.map((entry) => ({
							label: entry.name,
						}))}
						activeFileName={selectedFile}
						setActiveFileName={setSelectedFile}
						updateOrder={(entries) => {
							entries.forEach((entry) => {
								/*
								const innerEntry = projectState.files.volumes.find(
									(findEntry) => entry.label === findEntry.name
								);
								// TODO update order
								// if (innerEntry === undefined) return;
								// innerEntry.order = entry.order;
								*/
							});
						}}
					></OrderList>
				</Collapse>
				<Collapse
					title={
						<span className="border-b border-gray-300 grow">Surfaces</span>
					}
				>
					<OrderList
						entries={projectState.files.surfaces.map((entry) => ({
							label: entry.name,
						}))}
						activeFileName={selectedFile}
						setActiveFileName={setSelectedFile}
						updateOrder={(entries) => {
							entries.forEach((entry) => {
								/*
								const innerEntry = projectState.files.surfaces.find(
									(findEntry) => entry.label === findEntry.name
								);
								// TODO update order
								// if (innerEntry === undefined) return;
								// innerEntry.order = entry.order;
								*/
							});
						}}
					></OrderList>
				</Collapse>
			</>
		</Collapse>
	);
};
