import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NavMenu } from '@/components/NavMenu';
import AppRoutes from '@/AppRoutes';

export const App = () => {
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
