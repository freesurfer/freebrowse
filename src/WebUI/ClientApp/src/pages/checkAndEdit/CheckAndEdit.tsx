import { LeftBar } from '@/pages/checkAndEdit/layout/LeftBar';
import { MainView } from '@/pages/checkAndEdit/layout/MainView';
import { RightBar } from '@/pages/checkAndEdit/layout/RightBar';
import { TopBar } from '@/pages/checkAndEdit/topBar/TopBar';
import { Niivue } from '@niivue/niivue';
import { useRef } from 'react';

export const CheckAndEdit = (): React.ReactElement => {
	const niivue = useRef<Niivue>(new Niivue());

	return (
		<div className="flex flex-col h-full">
			<TopBar></TopBar>
			<div className="flex flex-row h-full">
				<LeftBar niivue={niivue.current}></LeftBar>
				<MainView niivue={niivue.current}></MainView>
				<RightBar></RightBar>
			</div>
		</div>
	);
};
