export const LeftBar = (): React.ReactElement => {
	return (
		<div className="bg-gray-100 w-[8rem] pl-4 border border-gray-500">
			<button>Load files</button>
			<div>Volumes</div>
			<div>Surfaces</div>
			<div>Point Sets</div>
		</div>
	);
};
