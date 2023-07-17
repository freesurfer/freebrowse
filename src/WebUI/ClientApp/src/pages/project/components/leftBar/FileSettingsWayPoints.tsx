import { Button } from '@/components/Button';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { PointSetFile } from '@/pages/project/models/file/type/PointSetFile';
import {
	MagnifyingGlassIcon,
	TrashIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useState, type ReactElement, type Dispatch, useEffect } from 'react';

export const FileSettingsWayPoints = ({
	pointSetFile,
	setProjectState,
}: {
	pointSetFile: PointSetFile;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): ReactElement => {
	const [selectedWaypoint, setSelectedWaypoint] = useState<number>(1);

	useEffect(() => {
		if (!('data' in pointSetFile)) return;
		if (pointSetFile.data === undefined) return;
		if (pointSetFile.data.points.length < selectedWaypoint)
			setSelectedWaypoint(pointSetFile.data.points.length);
	}, [setSelectedWaypoint, selectedWaypoint, pointSetFile]);

	if (!('data' in pointSetFile && pointSetFile.data !== undefined)) {
		return <></>;
	}

	return (
		<div className="pl-1">
			<div className="mt-2 flex justify-between">
				<span>No. of points:</span>
				<span>{pointSetFile.data.points.length}</span>
			</div>
			<div>
				{pointSetFile.data.points.length > 0 ? (
					<div className="mt-2 flex flex-row items-baseline justify-between gap-1">
						<span>Current point:</span>
						<div className="flex flex-col gap-1 text-font">
							<div className="flex flex-row gap-1">
								<input
									className="flex rounded border-[1.5px] border-gray-300 px-2 text-center text-xs"
									type="number"
									value={selectedWaypoint}
									onChange={(event) =>
										setSelectedWaypoint(parseInt(event.target.value))
									}
									min={1}
									max={pointSetFile.data.points.length}
								></input>
								<Button
									icon={(className) => (
										<MagnifyingGlassIcon className={className} />
									)}
									onClick={() => alert('not implemented')}
								/>
								<Button
									icon={(className) => <TrashIcon className={className} />}
									onClick={() =>
										setProjectState((projectState) =>
											projectState?.fromFileUpdate(
												pointSetFile,
												{
													data: {
														...pointSetFile.data,
														points: pointSetFile.data.points.filter(
															(file, index) => index + 1 !== selectedWaypoint
														),
													},
												},
												true
											)
										)
									}
								/>
							</div>
							<div className="flex flex-row justify-end gap-1">
								<Button
									icon={(className) => (
										<ChevronLeftIcon className={className} />
									)}
									readonly={selectedWaypoint <= 1}
									onClick={() =>
										setSelectedWaypoint(
											(selectedWaypoint) => --selectedWaypoint
										)
									}
								/>
								<Button
									icon={(className) => (
										<ChevronRightIcon className={className} />
									)}
									readonly={selectedWaypoint >= pointSetFile.data.points.length}
									onClick={() =>
										setSelectedWaypoint(
											(selectedWaypoint) => ++selectedWaypoint
										)
									}
								/>
							</div>
						</div>
					</div>
				) : (
					<></>
				)}
			</div>
		</div>
	);
};
