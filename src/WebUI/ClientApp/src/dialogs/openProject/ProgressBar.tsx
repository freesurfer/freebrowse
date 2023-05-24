export const ProgressBar = ({
	progress,
	className,
}: {
	progress: number;
	className?: string;
}): React.ReactElement => {
	return (
		<div className={`bg-gray-200 h-0.5 ${className ?? ''}`}>
			<div
				style={{ width: `${progress}%` }}
				className={`bg-gray-500 h-full`}
			></div>
		</div>
	);
};
