import { Counter } from '@/components/Counter';
import { FetchData } from '@/components/FetchData';
import { Home } from '@/components/Home';
import { MriViewer } from '@/components/MriViewer';
import { MriViewerDraw } from '@/components/MriViewerDraw';

const AppRoutes = [
	{
		index: true,
		element: <Home />,
	},
	{
		path: '/counter',
		element: <Counter />,
	},
	{
		path: '/fetch-data',
		element: <FetchData />,
	},
	{
		path: '/mri-viewer',
		element: <MriViewer />,
	},
	{
		path: '/mri-viewer-draw',
		element: <MriViewerDraw />,
	},
];

export default AppRoutes;
