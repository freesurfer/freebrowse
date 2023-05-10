import { CheckAndEdit } from '@/pages/checkAndEdit/CheckAndEdit';
import { LandingPage } from '@/pages/landingPage/LandingPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const AppRoutes = [
	{
		index: true,
		element: <LandingPage />,
	},
	{
		path: '/check-and-edit',
		element: <CheckAndEdit />,
	},
];

export const MainRouter = (): React.ReactElement => {
	return (
		<div className="flex h-full flex-col">
			<BrowserRouter>
				<Routes>
					{AppRoutes.map((route, index) => {
						const { element, ...rest } = route;
						return <Route key={index} {...rest} element={element} />;
					})}
				</Routes>
			</BrowserRouter>
		</div>
	);
};
