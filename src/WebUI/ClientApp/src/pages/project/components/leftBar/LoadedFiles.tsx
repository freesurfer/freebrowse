import { Collapse } from '@/components/Collapse';
import { OrderList } from '@/components/OrderList';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useCallback, useContext } from 'react';
import type { Dispatch } from 'react';

export const LoadedFiles = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): React.ReactElement => {
	const { editProject } = useContext(OpenProjectDialogContext);

	const loadFiles = useCallback(async (): Promise<void> => {
		try {
			if (projectState === undefined) return;
			const projectFiles = await editProject(projectState);
			if (projectFiles === 'canceled') return;
			setProjectState((projectState) => projectState?.fromFiles(projectFiles));
		} catch (error) {
			console.error('something went wrong opening files', error);
		}
	}, [projectState, editProject, setProjectState]);

	if (projectState === undefined) {
		return <></>;
	}

	return (
		<Collapse
			className="border-b border-gray pb-2"
			title={<span className="text-xs font-semibold">Loaded Files</span>}
			button={
				<button
					onClick={(event) => {
						event.stopPropagation();
						void loadFiles();
					}}
					className="mr-4 flex h-6 w-6 grow-0 items-center justify-center rounded-md bg-primary p-2 text-white"
				>
					<ArrowUpTrayIcon className="h-4 w-4 shrink-0"></ArrowUpTrayIcon>
				</button>
			}
		>
			<div className="mr-4">
				<Collapse
					className="mt-2"
					title={
						<span className="grow border-b border-gray text-xs">Volumes</span>
					}
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
						setFileActive={(file) => {
							setProjectState((projectState) =>
								projectState?.fromFiles(
									projectState.files.fromOneVolumeActivated(file)
								)
							);
						}}
						hideFileExtension={true}
					></OrderList>
				</Collapse>
				<Collapse
					className="mt-2"
					title={
						<span className="grow border-b border-gray text-xs">Surfaces</span>
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
						setFileActive={(file) => {
							setProjectState((projectState) =>
								projectState?.fromFiles(
									projectState.files.fromOneSurfaceActivated(file)
								)
							);
						}}
						hideFileExtension={false}
					></OrderList>
				</Collapse>
			</div>
		</Collapse>
	);
};
