import { Route, Routes } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { NavMenu } from './components/NavMenu';

export const App = () => {
	return (
		<>
			<NavMenu />
			<Routes>
				{AppRoutes.map((route, index) => {
					const { element, ...rest } = route;
					return <Route key={index} {...rest} element={element} />;
				})}
			</Routes>
		</>
	);
};
