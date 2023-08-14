import { Button } from '@/components/Button';
import { ColorPicker } from '@/components/ColorPicker';
import { NumberInput } from '@/components/NumberInput';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import {
	rgbToHex,
	hexToRgb,
	type PointSetFile,
} from '@/pages/project/models/file/type/PointSetFile';
import {
	MagnifyingGlassIcon,
	TrashIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import { type ReactElement, useEffect } from 'react';

export const FileSettingsWayPoints = observer(
	({
		pointSetFile,
		projectState,
	}: {
		pointSetFile: PointSetFile;
		projectState: ProjectState | undefined;
	}): ReactElement => {
		useEffect(() => {
			if (!('data' in pointSetFile)) return;
			if (pointSetFile.data === undefined) return;
			if (
				pointSetFile.data.points.length > 0 &&
				pointSetFile.data.points.length < pointSetFile.selectedWayPoint
			)
				pointSetFile.setSelectedWayPoint(pointSetFile.data.points.length);
		}, [pointSetFile]);

		if (!('data' in pointSetFile) || pointSetFile.data === undefined) {
			return <></>;
		}

		return (
			<div className="pl-1">
				<div className="mt-2 flex justify-between">
					<span>No. of points:</span>
					<span>{pointSetFile.data.points.length}</span>
				</div>
				<ColorPicker
					className="mt-2"
					grow={true}
					label="Color:"
					value={rgbToHex(pointSetFile.data.color)}
					onChange={(value) => {
						if (pointSetFile.data !== undefined) {
							pointSetFile.setData({
								...pointSetFile.data,
								color: hexToRgb(value),
							});
						}
					}}
				/>
				<div>
					{pointSetFile.data.points.length > 0 ? (
						<div className="mt-2 flex flex-row items-baseline justify-between gap-1">
							<span>Current point:</span>
							<div className="flex flex-col gap-1 text-font">
								<div className="flex flex-row gap-1">
									<NumberInput
										value={pointSetFile.selectedWayPoint}
										onChange={(value) => {
											projectState?.setCrosshairPosition(
												pointSetFile.data?.points[
													pointSetFile.selectedWayPoint - 1
												]?.coordinates
											);
											pointSetFile.setSelectedWayPoint(value);
										}}
										min={1}
										max={pointSetFile.data.points.length}
									/>
									<Button
										icon={(className) => (
											<MagnifyingGlassIcon className={className} />
										)}
										onClick={(): void =>
											projectState?.setCrosshairPosition(
												pointSetFile.data?.points[
													pointSetFile.selectedWayPoint - 1
												]?.coordinates
											)
										}
									/>
									<Button
										icon={(className) => <TrashIcon className={className} />}
										onClick={() => {
											if (pointSetFile.data === undefined) return;

											const toRemove = pointSetFile.data.points.at(
												pointSetFile.selectedWayPoint - 1
											);
											if (toRemove === undefined) return;
											pointSetFile.removeWaypoint(toRemove);

											const newActivePoint =
												pointSetFile.data.points[
													pointSetFile.selectedWayPoint - 1
												];
											if (newActivePoint === undefined) return;

											projectState?.setCrosshairPosition(
												newActivePoint.coordinates
											);
										}}
									/>
								</div>
								<div className="flex flex-row justify-end gap-1">
									<Button
										icon={(className) => (
											<ChevronLeftIcon className={className} />
										)}
										readonly={pointSetFile.selectedWayPoint <= 1}
										onClick={() => {
											pointSetFile.setSelectedWayPoint(
												pointSetFile.selectedWayPoint - 1
											);
											projectState?.setCrosshairPosition(
												pointSetFile.data?.points[
													pointSetFile.selectedWayPoint - 1
												]?.coordinates
											);
										}}
									/>
									<Button
										icon={(className) => (
											<ChevronRightIcon className={className} />
										)}
										readonly={
											pointSetFile.selectedWayPoint >=
											pointSetFile.data.points.length
										}
										onClick={() => {
											pointSetFile.setSelectedWayPoint(
												pointSetFile.selectedWayPoint + 1
											);
											projectState?.setCrosshairPosition(
												pointSetFile.data?.points[
													pointSetFile.selectedWayPoint - 1
												]?.coordinates
											);
										}}
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
	}
);
