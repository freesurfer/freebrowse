import { AddFileButton } from '@/components/AddFileButton';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { SurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { Dispatch, ReactElement } from 'react';

/**
 * component for choosing a file to upload and choose from the already uploaded files
 */
export const FileSelection = ({
	title,
	className,
	setProjectState,
	surfaceFile,
}: {
	title: string;
	className?: string;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
	surfaceFile: SurfaceFile;
}): ReactElement => {
	return (
		<div className={`flex flex-col gap-1 ${className ?? ''}`}>
			<div className="flex items-center gap-1">
				<span className="grow">{title}</span>
				<AddFileButton
					acceptedExtensions={['.thickness', '.curv']}
					onFileSelected={(file) =>
						setProjectState((projectState) =>
							projectState?.fromFiles(
								projectState.files.fromAddedLocalSurfaceOverlay(
									surfaceFile,
									file
								)
							)
						)
					}
				></AddFileButton>
			</div>
			{surfaceFile.overlayFiles?.length === 0 ? (
				<></>
			) : (
				<div className="flex flex-col gap-0.5 rounded bg-gray p-1">
					{surfaceFile.overlayFiles?.map((overlayFile) => (
						// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
						<div
							key={overlayFile.name}
							className={`flex cursor-pointer items-center gap-1 rounded p-0.5 ${
								overlayFile.isActive ? 'bg-primary' : 'bg-gray'
							}`}
							onClick={() =>
								setProjectState((projectState) =>
									projectState?.fromFiles(
										projectState.files.fromSelectOverlay(
											surfaceFile,
											overlayFile
										)
									)
								)
							}
						>
							<button
								className="rounded border border-primary bg-white p-1 text-primary"
								onClick={(event) => {
									event.stopPropagation();
									setProjectState((projectState) =>
										projectState?.fromFiles(
											projectState.files.fromDeletedOverlay(
												surfaceFile,
												overlayFile
											)
										)
									);
								}}
							>
								<TrashIcon className="h-3.5 w-3.5 shrink-0"></TrashIcon>
							</button>
							<span
								className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs ${
									overlayFile.isActive ? 'text-white' : 'text-font'
								}`}
							>
								{overlayFile.name}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
