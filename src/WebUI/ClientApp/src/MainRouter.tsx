import { LandingPage } from '@/pages/landing/LandingPage';
import { ProjectPage } from '@/pages/project/ProjectPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

export const MainRouter = (): React.ReactElement => {
	return (
		<div className="flex h-full flex-col">
			<BrowserRouter>
				<QueryParamProvider adapter={ReactRouter6Adapter}>
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
				</QueryParamProvider>
			</BrowserRouter>
		</div>
	);
};
