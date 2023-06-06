import { Checkbox } from '@/components/Checkbox';
import { ProgressBar } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/ProgressBar';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

const options = [
	{ value: 'grayscale', label: 'Grayscale' },
	{ value: 'lookupTable', label: 'Lookup Table' },
];

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
					<div key={file.name} className="flex gap-3 pb-3 pt-3 border-b">
						<div>
							<div className="flex justify-between text-xs text-gray-500">
								<span>{file.name}</span>
								<span>{file.sizeReadable()}</span>
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
						{file.selection !== undefined ? (
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
								<div className="flex items-center text-xs text-gray-500 gap-1">
									<Checkbox></Checkbox>
									<span className="whitespace-nowrap">Resample to RAS</span>
								</div>
							</>
						) : (
							<></>
						)}
					</div>
				);
			})}
		</div>
	);
};
