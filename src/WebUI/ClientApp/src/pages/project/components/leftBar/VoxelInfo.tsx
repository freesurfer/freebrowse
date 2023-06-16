import { Collapse } from '@/components/Collapse';
import { ProjectContext } from '@/pages/project/ProjectPage';
import { useContext, Fragment } from 'react';

export const VoxelInfo = (): React.ReactElement => {
	const { location } = useContext(ProjectContext);

	return (
		<Collapse
			className="border-b border-gray p-1"
			title={<span className="text-xs font-semibold">Voxel Info</span>}
		>
			<div className="mr-4 mt-2">
				<div className="mt-2 grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-2 text-end text-xs">
					<span></span>
					<span className="font-bold">x</span>
					<span className="font-bold">y</span>
					<span className="font-bold">z</span>
					<span className="font-bold">Val</span>
					<span className="text-start">RAS:</span>
					<span>
						{location?.mm[0] !== undefined ? location.mm[0].toFixed(2) : '-'}
					</span>
					<span>
						{location?.mm[1] !== undefined ? location.mm[1].toFixed(2) : '-'}
					</span>
					<span>
						{location?.mm[2] !== undefined ? location.mm[2].toFixed(2) : '-'}
					</span>
					<span>-</span>
					{location?.values.map((value, index) => (
						<Fragment key={index}>
							<span className="overflow-hidden text-ellipsis text-start">
								{value?.name !== undefined ? value.name.split('.')[0] : '-'}:
							</span>
							<span>{value?.vox[0] !== undefined ? value.vox[0] : '-'}</span>
							<span>{value?.vox[1] !== undefined ? value.vox[1] : '-'}</span>
							<span>{value?.vox[2] !== undefined ? value.vox[2] : '-'}</span>
							<span>
								{value?.value !== undefined ? Math.round(value.value) : '-'}
							</span>
						</Fragment>
					))}
				</div>
			</div>
		</Collapse>
	);
};
