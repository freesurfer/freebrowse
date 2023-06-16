export const MainView = ({
	setCanvas,
}: {
	setCanvas: (ref: HTMLCanvasElement | null) => void;
}): React.ReactElement => {
	return (
		<div className="relative grow overflow-hidden">
			<canvas className="" ref={(canvas) => setCanvas(canvas)} />
		</div>
	);
};
