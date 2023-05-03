import AppRoutes from '@/AppRoutes';
import { NavMenu } from '@/components/NavMenu';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export const App = (): React.ReactElement => {
	return (
		<>
			<BrowserRouter>
				<NavMenu />
				<Routes>
					{AppRoutes.map((route, index) => {
						const { element, ...rest } = route;
						return <Route key={index} {...rest} element={element} />;
					})}
				</Routes>
			</BrowserRouter>
		</>
	);
};
