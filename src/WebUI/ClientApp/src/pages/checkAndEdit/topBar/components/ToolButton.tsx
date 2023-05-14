export const ToolButton = ({
	title,
	children,
	active = false,
}: {
	title: string;
	children: React.ReactElement;
	active?: boolean;
}): React.ReactElement => {
	return (
		<>
			<button
				className={`flex flex-col items-center px-3 pt-2 pb-1 min-w-[4rem] rounded ${
					active ? 'bg-white' : ''
				}`}
			>
				{children}
				<span className="text-gray-500 text-xs mt-1 whitespace-nowrap">
					{title}
				</span>
			</button>
		</>
	);
};
