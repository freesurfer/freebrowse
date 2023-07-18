import type { ReactElement } from 'react';

export const MainView = ({
	setCanvas,
}: {
	setCanvas: (ref: HTMLCanvasElement | null) => void;
}): ReactElement => {
	return (
		<div className="relative grow overflow-hidden">
			<canvas className="" ref={(canvas) => setCanvas(canvas)} />
		</div>
	);
};
