import { Collapse } from '@/components/Collapse';
import { OrderList } from '@/components/OrderList';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import type { SetStateAction } from 'react';

export const LoadedFiles = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: (
		projectState: SetStateAction<ProjectState | undefined>
	) => void;
}): React.ReactElement => {
	const { editProject } = useContext(OpenProjectDialogContext);

	if (projectState === undefined) {
		return <></>;
	}

	const loadFiles = async (): Promise<void> => {
		try {
			let currentProjectState: ProjectState | undefined;
			// to prevent stale projectState
			setProjectState((projectState) => {
				currentProjectState = projectState;
				return projectState;
			});
			if (currentProjectState === undefined) return;
			const projectFiles = await editProject(currentProjectState);
			if (projectFiles === 'canceled') return;
			setProjectState((projectState) => projectState?.fromFiles(projectFiles));
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
						files={projectState.files.volumes}
						setFiles={(files) => {
							/*
							 * it is very important here to use the update representation of the setter
							 * https://stackoverflow.com/questions/56782079/react-hooks-stale-state
							 */
							setProjectState((projectState) =>
								projectState?.fromFiles(
									projectState.files.fromAdaptedVolumes(files)
								)
							);
						}}
					></OrderList>
				</Collapse>
				<Collapse
					title={
						<span className="border-b border-gray-300 grow">Surfaces</span>
					}
				>
					<OrderList
						files={projectState.files.surfaces}
						setFiles={(files) => {
							/*
							 * it is very important here to use the update representation of the setter
							 * https://stackoverflow.com/questions/56782079/react-hooks-stale-state
							 */
							setProjectState((projectState) =>
								projectState?.fromFiles(
									projectState.files.fromAdaptedSurfaces(files)
								)
							);
						}}
					></OrderList>
				</Collapse>
			</>
		</Collapse>
	);
};
