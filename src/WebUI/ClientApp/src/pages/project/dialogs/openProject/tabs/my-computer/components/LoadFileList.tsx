import { ProgressBar } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/ProgressBar';
import { type ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import type { ReactElement } from 'react';

export const LoadFileList = observer(
	({
		className,
		projectFiles,
	}: {
		className?: string;
		projectFiles: ProjectFiles | undefined;
	}): ReactElement => {
		return (
			<div className={className}>
				{[
					projectFiles?.volumes,
					projectFiles?.surfaces,
					projectFiles?.pointSets,
				].map((fileAggregation) =>
					fileAggregation?.all.map((file) => {
						if (file === undefined) return <></>;
						return (
							<div
								key={`${file.name}${file instanceof CloudFile ? file.id : ''}`}
								className="flex gap-3 border-b pb-3 pt-3"
							>
								<div>
									<div className="flex justify-between text-xs text-gray-500">
										<span>{file.name}</span>
										<span>
											{'size' in file
												? `${Math.floor(file.size / 10000) / 100} MB`
												: '-'}
										</span>
									</div>
									<ProgressBar
										className="mt-1 w-60"
										progress={100}
									></ProgressBar>
								</div>
								<button
									onClick={() => {
										fileAggregation.delete(file);
									}}
								>
									<XMarkIcon className="w-6 text-gray-600"></XMarkIcon>
								</button>
							</div>
						);
					})
				)}
			</div>
		);
	}
);
