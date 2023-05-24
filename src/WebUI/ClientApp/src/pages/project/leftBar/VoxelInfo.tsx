import { Collapse } from '@/components/Collapse';

export const VoxelInfo = (): React.ReactElement => {
	return (
		<Collapse
			className="border-b border-gray-300 p-1"
			title={<span className="font-semibold">Voxel Info</span>}
		>
			<div className="mt-2 mr-1">
				<div className="flex">
					<span className="grow">Voxel value</span>
					<span>47</span>
				</div>

				<div className="grid text-end grid-cols-4 mt-2">
					<span></span>
					<span className="font-bold">x</span>
					<span className="font-bold">x</span>
					<span className="font-bold">z</span>
					<span className="text-start">Voxel:</span>
					<span>151</span>
					<span>147</span>
					<span>128</span>
					<span className="text-start">RAS:</span>
					<span>-23.35</span>
					<span>0.00</span>
					<span>12.97</span>
				</div>
			</div>
		</Collapse>
	);
};
