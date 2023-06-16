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
								? 'border-gray-400 text-gray-500 border-b-2 font-semibold'
								: 'border-gray-300 text-gray-400 border-b'
						} px-6 py-3 text-start text-sm`}
						onClick={() => setActiveTab(tab.title)}
						key={tab.title}
					>
						{tab.title}
					</button>
				))}
				<div className="border-gray-300 grow border-b"></div>
			</div>
			<div className="m-8">
				{tabs.find((tab) => tab.title === activeTab)?.content}
			</div>
		</>
	);
};
