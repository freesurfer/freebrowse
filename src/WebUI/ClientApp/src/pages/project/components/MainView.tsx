import { type ProjectState } from '@/pages/project/models/ProjectState';
import { type ReactElement } from 'react';

export const MainView = ({
	projectState,
}: {
	projectState: ProjectState | undefined;
}): ReactElement => {
	if (projectState === undefined) return <></>;

	return (
		<div className="relative grow overflow-hidden">
			<canvas ref={(canvas) => projectState.setCanvas(canvas)} />
		</div>
	);
};
