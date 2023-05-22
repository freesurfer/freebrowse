import { DropZone } from '@/dialogs/load/DropZone';
import { LoadFileList } from '@/dialogs/load/LoadFileList';

export const MyComputerDialogTab = (): React.ReactElement => {
	return (
		<>
			<div className="flex flex-col">
				<span className="text-xs text-gray-500">Project Name:</span>
				<input
					className="w-64 mt-1 border rounded border-gray-400 text-gray-500 px-3 py-2"
					type="text"
					value="Subject_Walter_White"
					onChange={(projectName) =>
						console.log('new project name:', projectName.target.value)
					}
				></input>
			</div>
			<DropZone className="mt-4 w-[34em]"></DropZone>
			<LoadFileList className="mt-3"></LoadFileList>
		</>
	);
};
