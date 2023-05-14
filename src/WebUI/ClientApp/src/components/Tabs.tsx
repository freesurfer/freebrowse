export const Tabs = ({
	className,
	tabs,
}: {
	className: string;
	tabs: {
		title: string;
		content: React.ReactElement;
	}[];
}): React.ReactElement => {
	return (
		<div className={className}>
			<div>
				{tabs.map((tab) => (
					<span key={tab.title}>{tab.title}</span>
				))}
			</div>
			<div>{tabs.map((tab) => tab.content)}</div>
		</div>
	);
};
