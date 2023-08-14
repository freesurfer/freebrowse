import { Collapse } from '@/components/Collapse';
import { OrderList } from '@/components/orderList/OrderList';
import { NewPointSetDialogContext } from '@/pages/project/dialogs/newPointSet/NewPointSetDialog';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import type { ReactElement } from 'react';

export const LoadedFiles = observer(
	({
		projectState,
	}: {
		projectState: ProjectState | undefined;
	}): ReactElement => {
		const { open } = useContext(NewPointSetDialogContext);

		const { editProject } = useContext(OpenProjectDialogContext);

		const loadFiles = useCallback(async (): Promise<void> => {
			try {
				if (projectState === undefined) return;
				await editProject(projectState);
			} catch (error) {
				console.error('something went wrong opening files', error);
			}
		}, [projectState, editProject]);

		const openNewPointSetDialog = useCallback(() => {
			const execute = async (): Promise<void> => {
				const defaultFileNameNumbers = projectState?.files?.pointSets.all
					.filter((file) =>
						file.name.startsWith(CachePointSetFile.DEFAULT_NAME)
					)
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

				await projectState?.files?.pointSets.createCachePointSetFile(
					result.name,
					result.color,
					projectState.id
				);
			};

			void execute();
		}, [projectState?.id, projectState?.files?.pointSets, open]);

		const setActiveOnly = useCallback(
			(file: ProjectFile) => {
				projectState?.files?.setActiveOnly(file);
			},
			[projectState?.files]
		);

		const setActivePointSetOnly = useCallback(
			(file: ProjectFile) => {
				projectState?.files?.pointSets.setActiveOnly(file);
			},
			[projectState?.files?.pointSets]
		);

		if (projectState?.files === undefined) {
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
					{projectState.files.volumes.all.length > 0 ? (
						<Collapse
							className="mt-2"
							title={
								<span className="grow border-b border-gray text-xs">
									Volumes
								</span>
							}
						>
							<OrderList
								setActiveOnly={setActiveOnly}
								files={projectState.files}
								allFiles={projectState.files.volumes.all}
								hideFileExtension={true}
							></OrderList>
						</Collapse>
					) : (
						<></>
					)}
					{projectState.files.surfaces.all.length > 0 ? (
						<Collapse
							className="mt-2"
							title={
								<span className="grow border-b border-gray text-xs">
									Surfaces
								</span>
							}
						>
							<OrderList
								setActiveOnly={setActiveOnly}
								files={projectState.files}
								allFiles={projectState.files.surfaces.all}
								hideFileExtension={false}
							></OrderList>
						</Collapse>
					) : (
						<></>
					)}
					{projectState.files.pointSets.all.length > 0 ? (
						<Collapse
							className="mt-2"
							title={
								<span className="grow border-b border-gray text-xs">
									Point Sets
								</span>
							}
						>
							<OrderList
								setActiveOnly={setActivePointSetOnly}
								files={projectState.files}
								allFiles={projectState.files.pointSets.all}
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
	}
);
