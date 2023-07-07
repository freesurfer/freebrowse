import { AddFileButton } from '@/components/AddFileButton';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
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
	const surfaceCascadingFiles = [
		...surfaceFile.overlayFiles,
		...surfaceFile.annotationFiles,
	];

	return (
		<div className={`flex flex-col gap-1 ${className ?? ''}`}>
			<div className="flex items-center gap-1">
				<span className="grow">{title}</span>
				<AddFileButton
					acceptedExtensions={['.thickness', '.curv', '.annot', '.mz3']}
					onFileSelected={(file) => {
						if (file.name.endsWith('.annot')) {
							setProjectState((projectState) =>
								projectState?.fromFiles(
									projectState.files.fromAddedLocalSurfaceAnnotation(
										surfaceFile,
										file
									)
								)
							);
							return;
						}

						if (
							file.name.endsWith('.thickness') ||
							file.name.endsWith('.mz3') ||
							file.name.endsWith('.curv')
						) {
							setProjectState((projectState) =>
								projectState?.fromFiles(
									projectState.files.fromAddedLocalSurfaceOverlay(
										surfaceFile,
										file
									)
								)
							);
							return;
						}

						throw new Error(
							`file with unknown extension can not get loaded ${file.name}`
						);
					}}
				></AddFileButton>
			</div>
			{surfaceCascadingFiles?.length === 0 ? (
				<></>
			) : (
				<div className="flex flex-col gap-0.5 rounded bg-gray p-1">
					{surfaceCascadingFiles?.map((cascadingFile) => (
						// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
						<div
							key={cascadingFile.name}
							className={`flex cursor-pointer items-center gap-1 rounded p-0.5 ${
								cascadingFile.isActive ? 'bg-primary' : 'bg-gray'
							}`}
							onClick={() =>
								setProjectState((projectState) => {
									if (cascadingFile.type === FileType.OVERLAY) {
										return projectState?.fromFiles(
											projectState.files.fromIsActiveOverlay(
												surfaceFile,
												cascadingFile
											)
										);
									}
									return projectState?.fromFiles(
										projectState.files.fromIsActiveAnnotation(
											surfaceFile,
											cascadingFile
										)
									);
								})
							}
						>
							<button
								className="rounded border border-primary bg-white p-1 text-primary"
								onClick={(event) => {
									event.stopPropagation();
									if (cascadingFile.type === FileType.OVERLAY) {
										return setProjectState((projectState) =>
											projectState?.fromFiles(
												projectState.files.fromDeletedOverlay(
													surfaceFile,
													cascadingFile
												)
											)
										);
									}
									return setProjectState((projectState) =>
										projectState?.fromFiles(
											projectState.files.fromDeletedAnnotation(
												surfaceFile,
												cascadingFile
											)
										)
									);
								}}
							>
								<TrashIcon className="h-3.5 w-3.5 shrink-0"></TrashIcon>
							</button>
							<span
								className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs ${
									cascadingFile.isActive ? 'text-white' : 'text-font'
								}`}
							>
								{cascadingFile.name}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
