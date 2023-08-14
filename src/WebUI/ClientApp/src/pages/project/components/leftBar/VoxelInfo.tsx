import { Collapse } from '@/components/Collapse';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { observer } from 'mobx-react-lite';
import { Fragment, type ReactElement } from 'react';

export const VoxelInfo = observer(
	({
		projectState,
	}: {
		projectState: ProjectState | undefined;
	}): ReactElement => {
		return (
			<Collapse
				className="border-b border-gray py-2 text-xs"
				title={<span className="text-xs font-semibold">Voxel Info</span>}
			>
				<>
					<div className="my-2 mr-4 pl-1">
						<div className="mt-2 grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-2 text-end text-xs">
							<span></span>
							<span className="font-bold">x</span>
							<span className="font-bold">y</span>
							<span className="font-bold">z</span>
							<span className="font-bold">Val</span>
							<span className="text-start">RAS:</span>
							<span>
								{projectState?.location?.mm[0] !== undefined
									? projectState.location.mm[0].toFixed(2)
									: '-'}
							</span>
							<span>
								{projectState?.location?.mm[1] !== undefined
									? projectState.location.mm[1].toFixed(2)
									: '-'}
							</span>
							<span>
								{projectState?.location?.mm[2] !== undefined
									? projectState.location.mm[2].toFixed(2)
									: '-'}
							</span>
							<span>-</span>
							{projectState?.location?.values.map((value, index) => (
								<Fragment key={index}>
									<span className="overflow-hidden text-ellipsis text-start">
										{value?.name !== undefined ? value.name.split('.')[0] : '-'}
										:
									</span>
									<span>
										{value?.vox[0] !== undefined ? value.vox[0] : '-'}
									</span>
									<span>
										{value?.vox[1] !== undefined ? value.vox[1] : '-'}
									</span>
									<span>
										{value?.vox[2] !== undefined ? value.vox[2] : '-'}
									</span>
									<span>
										{value?.rawValue !== undefined
											? Math.round(value.rawValue)
											: '-'}
									</span>
								</Fragment>
							))}
						</div>
					</div>
					<div className="my-2 mr-4 pl-1">
						{projectState?.location?.values
							.filter((value) => value.label !== undefined)
							.map((value, index) => (
								<div key={index} className="mt-2">
									<div>{value?.name}:</div>
									<div className="mt-1 rounded bg-gray-200 p-0.5 text-center">
										{value?.label}
									</div>
								</div>
							))}
					</div>
				</>
			</Collapse>
		);
	}
);
