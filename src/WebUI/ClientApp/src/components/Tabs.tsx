import { useState } from 'react';
import type { ReactElement } from 'react';

export const Tabs = ({
	tabs,
}: {
	tabs: {
		title: string;
		content: ReactElement;
	}[];
}): ReactElement => {
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
								? 'border-b-2 border-gray-400 font-semibold text-gray-500'
								: 'border-b border-gray-300 text-gray-400'
						} px-6 py-3 text-start text-sm`}
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
