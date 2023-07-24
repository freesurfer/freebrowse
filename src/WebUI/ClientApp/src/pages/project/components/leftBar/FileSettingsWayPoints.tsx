import { Button } from '@/components/Button';
import { NumberInput } from '@/components/NumberInput';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { PointSetFile } from '@/pages/project/models/file/type/PointSetFile';
import {
	MagnifyingGlassIcon,
	TrashIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { type ReactElement, type Dispatch, useEffect } from 'react';

export const FileSettingsWayPoints = ({
	pointSetFile,
	setProjectState,
}: {
	pointSetFile: PointSetFile;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): ReactElement => {
	useEffect(() => {
		if (!('data' in pointSetFile)) return;
		if (pointSetFile.data === undefined) return;
		if (
			pointSetFile.data.points.length > 0 &&
			pointSetFile.data.points.length < pointSetFile.selectedWayPoint
		)
			setProjectState((projectState) =>
				projectState?.fromFileUpdate(
					pointSetFile,
					{ selectedWayPoint: pointSetFile.data.points.length },
					false
				)
			);
	}, [setProjectState, pointSetFile]);

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
								<NumberInput
									value={pointSetFile.selectedWayPoint}
									onChange={(value) =>
										setProjectState((projectState) =>
											projectState
												?.fromFileUpdate(
													pointSetFile,
													{ selectedWayPoint: value },
													false
												)
												.from({
													crosshairPosition:
														pointSetFile.data.points[
															pointSetFile.selectedWayPoint - 1
														]?.coordinates,
												})
										)
									}
									min={1}
									max={pointSetFile.data.points.length}
								/>
								<Button
									icon={(className) => (
										<MagnifyingGlassIcon className={className} />
									)}
									onClick={(): void =>
										setProjectState((projectState) =>
											projectState?.from({
												crosshairPosition:
													pointSetFile.data.points[
														pointSetFile.selectedWayPoint - 1
													]?.coordinates,
											})
										)
									}
								/>
								<Button
									icon={(className) => <TrashIcon className={className} />}
									onClick={() =>
										setProjectState((projectState) => {
											const newPointArray = pointSetFile.data.points.filter(
												(_point, index) =>
													index + 1 !== pointSetFile.selectedWayPoint
											);

											const updatedFileState = projectState?.fromFileUpdate(
												pointSetFile,
												{
													data: {
														...pointSetFile.data,
														points: newPointArray,
													},
												},
												true
											);

											const newActivePoint =
												newPointArray[
													pointSetFile.selectedWayPoint -
														1 -
														(newPointArray.length <
														pointSetFile.selectedWayPoint
															? 1
															: 0)
												];
											if (newActivePoint === undefined) return updatedFileState;
											return updatedFileState?.from({
												crosshairPosition: newActivePoint.coordinates,
											});
										})
									}
								/>
							</div>
							<div className="flex flex-row justify-end gap-1">
								<Button
									icon={(className) => (
										<ChevronLeftIcon className={className} />
									)}
									readonly={pointSetFile.selectedWayPoint <= 1}
									onClick={() =>
										setProjectState((projectState) =>
											projectState
												?.fromFileUpdate(
													pointSetFile,
													{
														selectedWayPoint: pointSetFile.selectedWayPoint - 1,
													},
													false
												)
												.from({
													crosshairPosition:
														pointSetFile.data.points[
															pointSetFile.selectedWayPoint - 1 - 1
														]?.coordinates,
												})
										)
									}
								/>
								<Button
									icon={(className) => (
										<ChevronRightIcon className={className} />
									)}
									readonly={
										pointSetFile.selectedWayPoint >=
										pointSetFile.data.points.length
									}
									onClick={() =>
										setProjectState((projectState) =>
											projectState
												?.fromFileUpdate(
													pointSetFile,
													{
														selectedWayPoint: pointSetFile.selectedWayPoint + 1,
													},
													false
												)
												.from({
													crosshairPosition:
														pointSetFile.data.points[
															pointSetFile.selectedWayPoint - 1 + 1
														]?.coordinates,
												})
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
