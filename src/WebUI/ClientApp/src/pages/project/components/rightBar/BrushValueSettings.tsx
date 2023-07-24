import { NumberInput } from '@/components/NumberInput';
import lookUpTable from '@/pages/project/colorMaps/LookUpTable.json';
import { COLOR_MAP_BACKEND } from '@/pages/project/models/ColorMap';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { type ReactElement, type Dispatch } from 'react';

export const BrushValueSettings = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): ReactElement => {
	function getColorFromInput(input: number): string {
		// Check if the input matches any element in the "I" array
		const index = lookUpTable.I.indexOf(input);

		if (index !== -1) {
			// Get the corresponding RGB values based on the index
			const r = lookUpTable.R[index] ?? 0;
			const g = lookUpTable.G[index] ?? 0;
			const b = lookUpTable.B[index] ?? 0;

			return rgbToHex(r, g, b);
		}

		return '#000000';
	}

	function rgbToHex(r: number, g: number, b: number): string {
		const hexR = r.toString(16).padStart(2, '0');
		const hexG = g.toString(16).padStart(2, '0');
		const hexB = b.toString(16).padStart(2, '0');

		const hexColor = '#' + hexR + hexG + hexB;

		return hexColor;
	}

	return (
		<div className="pl-1">
			<div className="mt-2 flex flex-row items-baseline justify-between gap-1">
				<span>Brush Value:</span>
				<div className="flex flex-row gap-1">
					<NumberInput
						value={projectState?.brushValue ?? 0}
						onChange={(value) =>
							setProjectState((projectState) => {
								if (projectState === undefined) return undefined;
								return new ProjectState(
									{ projectState, brushValue: value },
									false
								);
							})
						}
						min={0}
						max={Number.MAX_SAFE_INTEGER}
					/>
					{projectState?.files.volumes.cloud.find(
						(file) =>
							file.isActive &&
							file.colorMap.backend === COLOR_MAP_BACKEND.LOOKUP_TABLE
					) !== undefined && (
						<div
							className="flex w-10 rounded border"
							style={{
								backgroundColor: getColorFromInput(
									projectState?.brushValue ?? 0
								),
							}}
						></div>
					)}
				</div>
			</div>
		</div>
	);
};
