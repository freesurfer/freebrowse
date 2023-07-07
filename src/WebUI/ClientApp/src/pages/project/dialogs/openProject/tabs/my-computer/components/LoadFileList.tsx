import { ProgressBar } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/ProgressBar';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { XMarkIcon } from '@heroicons/react/24/outline';

/*
const options = [
	{ value: 'grayscale', label: 'Grayscale' },
	{ value: 'lookupTable', label: 'Lookup Table' },
];
*/

export const LoadFileList = ({
	className,
	projectFiles,
	setProjectFiles,
}: {
	className?: string;
	projectFiles: ProjectFiles;
	setProjectFiles: (projectFiles: ProjectFiles) => void;
}): React.ReactElement => {
	return (
		<div className={className}>
			{projectFiles.all.map((file) => {
				if (file === undefined) return <></>;
				return (
					<div key={file.name} className="flex gap-3 border-b pb-3 pt-3">
						<div>
							<div className="flex justify-between text-xs text-gray-500">
								<span>{file.name}</span>
								<span>{`${Math.floor(file.size / 10000) / 100} MB`}</span>
							</div>
							<ProgressBar className="mt-1 w-60" progress={100}></ProgressBar>
						</div>
						<button
							onClick={() =>
								setProjectFiles(projectFiles.fromDeletedFile(file.name))
							}
						>
							<XMarkIcon className="w-6 text-gray-600"></XMarkIcon>
						</button>

						{/* file.selection !== undefined ? (
							<>
								<Select
									className="w-40 min-w-[10rem]"
									options={options}
									classNames={{
										indicatorSeparator: () => 'hidden',
										singleValue: () => 'text-xs',
										menu: () => 'text-xs',
									}}
									value={options.find(
										(option) => option.value === file.selection
									)}
								/>
								<div className="flex items-center gap-1 text-xs text-gray-500">
									<Checkbox></Checkbox>
									<span className="whitespace-nowrap">Resample to RAS</span>
								</div>
							</>
						) : (
							<></>
						)
						*/}
					</div>
				);
			})}
		</div>
	);
};
