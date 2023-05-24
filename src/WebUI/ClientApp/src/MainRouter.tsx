import { LandingPage } from '@/pages/landing/LandingPage';
import { ProjectPage } from '@/pages/project/ProjectPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export const MainRouter = (): React.ReactElement => {
	return (
		<div className="flex h-full flex-col">
			<BrowserRouter>
				<Routes>
					<Route
						path="/"
						index={true}
						element={<LandingPage></LandingPage>}
					></Route>
					<Route
						path="/project/:projectId"
						element={<ProjectPage></ProjectPage>}
					></Route>
				</Routes>
			</BrowserRouter>
		</div>
	);
};
