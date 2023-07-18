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
import {
	type ReactElement,
	type Dispatch,
	useEffect,
	useCallback,
} from 'react';

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

	const adjustCrosshairPosition = useCallback((): void => {
		if (!('data' in pointSetFile) || pointSetFile.data === undefined) return;
		const position =
			pointSetFile.data.points[pointSetFile.selectedWayPoint - 1];
		setProjectState((projectState) =>
			projectState?.from({
				crosshairPosition: position?.coordinates,
			})
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
											projectState?.fromFileUpdate(
												pointSetFile,
												{ selectedWayPoint: value },
												false
											)
										)
									}
									max={pointSetFile.data.points.length}
								/>
								<Button
									icon={(className) => (
										<MagnifyingGlassIcon className={className} />
									)}
									onClick={adjustCrosshairPosition}
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
															(file, index) =>
																index + 1 !== pointSetFile.selectedWayPoint
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
									readonly={pointSetFile.selectedWayPoint <= 1}
									onClick={() =>
										setProjectState((projectState) =>
											projectState?.fromFileUpdate(
												pointSetFile,
												{ selectedWayPoint: pointSetFile.selectedWayPoint - 1 },
												false
											)
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
											projectState?.fromFileUpdate(
												pointSetFile,
												{ selectedWayPoint: pointSetFile.selectedWayPoint + 1 },
												false
											)
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
