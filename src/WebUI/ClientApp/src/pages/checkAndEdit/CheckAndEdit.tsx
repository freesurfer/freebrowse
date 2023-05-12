import { LeftBar } from '@/pages/checkAndEdit/layout/LeftBar';
import { MainView } from '@/pages/checkAndEdit/layout/MainView';
import { RightBar } from '@/pages/checkAndEdit/layout/RightBar';
import { TopBar } from '@/pages/checkAndEdit/topBar/TopBar';

export const CheckAndEdit = (): React.ReactElement => {
	return (
		<div className="flex flex-col h-full">
			<TopBar></TopBar>
			<div className="flex flex-row h-full">
				<LeftBar></LeftBar>
				<MainView></MainView>
				<RightBar></RightBar>
			</div>
		</div>
	);
};
