import { FileInfo } from '@/pages/project/components/leftBar/FileInfo';
import { LoadedFiles } from '@/pages/project/components/leftBar/LoadedFiles';
import { VoxelInfo } from '@/pages/project/components/leftBar/VoxelInfo';

export const LeftBar = (): React.ReactElement => {
	return (
		<div className="bg-gray-100 w-[16rem] border border-gray-500 flex flex-col">
			<LoadedFiles></LoadedFiles>
			<FileInfo></FileInfo>
			<VoxelInfo></VoxelInfo>
		</div>
	);
};
