import { useState } from 'react';

export const Tabs = ({
	tabs,
}: {
	tabs: {
		title: string;
		content: React.ReactElement;
	}[];
}): React.ReactElement => {
	const [activeTab, setActiveTab] = useState<string | undefined>(
		tabs[0]?.title
	);

	return (
		<>
			<div className="flex">
				{tabs.map((tab) => (
					<button
						className={`${
							activeTab === tab.title
								? 'border-b-2 border-gray-400 text-gray-500 font-semibold'
								: 'border-b border-gray-300 text-gray-400'
						} text-sm px-6 py-3 text-start`}
						onClick={() => setActiveTab(tab.title)}
						key={tab.title}
					>
						{tab.title}
					</button>
				))}
				<div className="grow border-b border-gray-300"></div>
			</div>
			<div className="m-8">
				{tabs.find((tab) => tab.title === activeTab)?.content}
			</div>
		</>
	);
};
