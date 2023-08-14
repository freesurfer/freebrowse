import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import { BrushValueSettings } from '@/pages/project/components/rightBar/BrushValueSettings';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { observer } from 'mobx-react-lite';
import { type ReactElement } from 'react';

export const BrushSettings = observer(
	({
		projectState,
	}: {
		projectState: ProjectState | undefined;
	}): ReactElement => {
		return (
			<Collapse
				className="border-b border-gray py-2 pr-3 text-xs"
				title={<span className="text-xs font-semibold">Brush Settings</span>}
			>
				<>
					<Slider
						className="mt-2"
						label="Brush Size:"
						value={projectState?.brushSize ?? 1}
						unit=""
						min={1}
						max={10}
						onChange={(value) => projectState?.setBrushSize(value)}
						onEnd={(value) => projectState?.setBrushSize(value)}
					></Slider>
					<BrushValueSettings projectState={projectState} />
				</>
			</Collapse>
		);
	}
);
