export const MainView = ({
	setCanvas,
}: {
	setCanvas: (ref: HTMLCanvasElement | null) => void;
}): React.ReactElement => {
	return (
		<div className="border-2 border-gray-500 relative grow">
			<canvas className="absolute" ref={(canvas) => setCanvas(canvas)} />
		</div>
	);
};
