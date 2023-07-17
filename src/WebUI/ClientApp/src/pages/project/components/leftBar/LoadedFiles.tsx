import { Collapse } from '@/components/Collapse';
import { OrderList } from '@/components/OrderList';
import { NewPointSetDialogContext } from '@/pages/project/dialogs/newPointSet/NewPointSetDialog';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
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
	const { open } = useContext(NewPointSetDialogContext);

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

	const openNewPointSetDialog = useCallback(() => {
		const execute = async (): Promise<void> => {
			const defaultFileNameNumbers = projectState?.files.pointSets
				.filter((file) => file.name.startsWith(CachePointSetFile.DEFAULT_NAME))
				.map((file) =>
					Number(
						file.name
							.slice(CachePointSetFile.DEFAULT_NAME.length + 1)
							.split('.')[0]
					)
				)
				.filter((number) => !isNaN(number));

			const smallestMissingNumber = (
				defaultFileNameNumbers: number[]
			): number => {
				let index = 0;
				while (true) {
					if (!defaultFileNameNumbers.includes(index)) return index;
					index++;
				}
			};

			const result = await open(
				smallestMissingNumber(defaultFileNameNumbers ?? [])
			);
			if (result === 'canceled') return;

			setProjectState((projectState) =>
				projectState?.fromFiles(
					projectState.files.fromNewPointSetFile(result.name, result.color)
				)
			);
		};

		void execute();
	}, [setProjectState, projectState, open]);

	if (projectState === undefined) {
		return <></>;
	}

	return (
		<Collapse
			className="border-b border-gray pb-2"
			title={<span className="text-xs font-semibold">Loaded Files</span>}
			titleBarElement={
				<div className="mr-4 flex gap-1">
					<button
						onClick={(event) => {
							event.stopPropagation();
							void loadFiles();
						}}
						className="flex h-6 w-6 grow-0 items-center justify-center rounded-md bg-primary p-2 text-white"
					>
						<ArrowUpTrayIcon className="h-4 w-4 shrink-0"></ArrowUpTrayIcon>
					</button>
					<button
						onClick={(event) => {
							event.stopPropagation();
							void openNewPointSetDialog();
						}}
						className="flex h-6 w-6 grow-0 items-center justify-center rounded-md bg-primary p-2 text-white"
					>
						<PlusIcon className="h-4 w-4 shrink-0"></PlusIcon>
					</button>
				</div>
			}
		>
			<div className="mr-4">
				{projectState.files.volumes.length > 0 ? (
					<Collapse
						className="mt-2"
						title={
							<span className="grow border-b border-gray text-xs">Volumes</span>
						}
					>
						<OrderList
							files={projectState.files.volumes}
							setFiles={(files) => {
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
				) : (
					<></>
				)}
				{projectState.files.surfaces.length > 0 ? (
					<Collapse
						className="mt-2"
						title={
							<span className="grow border-b border-gray text-xs">
								Surfaces
							</span>
						}
					>
						<OrderList
							files={projectState.files.surfaces}
							setFiles={(files) => {
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
				) : (
					<></>
				)}
				{projectState.files.pointSets.length > 0 ? (
					<Collapse
						className="mt-2"
						title={
							<span className="grow border-b border-gray text-xs">
								Point Sets
							</span>
						}
					>
						<OrderList
							files={projectState.files.pointSets}
							setFiles={(files) => {
								setProjectState((projectState) =>
									projectState?.fromFiles(
										projectState.files.fromAdaptedPointSets(files)
									)
								);
							}}
							setFileActive={(file) => {
								setProjectState((projectState) =>
									projectState?.fromFiles(
										projectState.files.fromOnePointSetActivated(file)
									)
								);
							}}
							multiselect={false}
							hideFileExtension={false}
						></OrderList>
					</Collapse>
				) : (
					<></>
				)}
			</div>
		</Collapse>
	);
};
