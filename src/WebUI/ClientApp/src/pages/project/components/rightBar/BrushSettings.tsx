import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import { BrushValueSettings } from '@/pages/project/components/rightBar/BrushValueSettings';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { type Dispatch, type ReactElement } from 'react';

export const BrushSettings = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): ReactElement => {
	return (
		<Collapse
			className="border-b border-gray py-2 pr-3 text-xs"
			title={<span className="text-xs font-semibold">Brush Settings</span>}
		>
			<Slider
				className="mt-2"
				label="Brush Size:"
				value={projectState?.brushSize ?? 0}
				unit=""
				min={1}
				max={10}
				onChange={(value) =>
					setProjectState((projectState) => {
						if (projectState === undefined) return undefined;
						return new ProjectState({ projectState, brushSize: value }, false);
					})
				}
				onEnd={(value) =>
					setProjectState((projectState) => {
						if (projectState === undefined) return undefined;
						return new ProjectState({ projectState, brushSize: value }, false);
					})
				}
			></Slider>
			<BrushValueSettings
				projectState={projectState}
				setProjectState={setProjectState}
			/>
		</Collapse>
	);
};
