import { Collapse } from '@/components/Collapse';
import { ProjectContext } from '@/pages/project/ProjectPage';
import { useContext } from 'react';

export const VoxelInfo = (): React.ReactElement => {
	const { location } = useContext(ProjectContext);

	return (
		<Collapse
			className="border-b border-gray-300 p-1"
			title={<span className="font-semibold">Voxel Info</span>}
		>
			<div className="mt-2 mr-1">
				<div className="flex">
					<span className="grow">Voxel value</span>
					<span>
						{Math.round((location?.values[0]?.value ?? NaN) * 1000) / 1000}
					</span>
				</div>

				<div className="grid text-end grid-cols-4 mt-2">
					<span></span>
					<span className="font-bold">x</span>
					<span className="font-bold">y</span>
					<span className="font-bold">z</span>
					<span className="text-start">Voxel:</span>
					<span>{Math.round(location?.mm[0] ?? NaN)}</span>
					<span>{Math.round(location?.mm[1] ?? NaN)}</span>
					<span>{Math.round(location?.mm[2] ?? NaN)}</span>
					<span className="text-start">RAS:</span>
					<span>-23.35</span>
					<span>0.00</span>
					<span>12.97</span>
				</div>
			</div>
		</Collapse>
	);
};
