import { FileInfo } from '@/pages/project/leftBar/FileInfo';
import { VoxelInfo } from '@/pages/project/leftBar/VoxelInfo';
import { LoadedFiles } from '@/pages/project/leftBar/loadedFiles/LoadedFiles';

export const LeftBar = (): React.ReactElement => {
	return (
		<div className="bg-gray-100 w-[16rem] border border-gray-500 flex flex-col">
			<LoadedFiles></LoadedFiles>
			<FileInfo></FileInfo>
			<VoxelInfo></VoxelInfo>
		</div>
	);
};
