import brain from '@/assets/brain.png';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { useCallback, useContext } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingTitle = ({
	className,
}: {
	className?: string;
}): ReactElement => {
	const navigate = useNavigate();
	const { createProject } = useContext(OpenProjectDialogContext);

	const onGetStartedClick = useCallback(async (): Promise<void> => {
		const result = await createProject();
		if (result === 'canceled') return;
		navigate(`/project/${result.projectId}`);
	}, [createProject, navigate]);

	return (
		<div className={`${className ?? ''} flex flex-row`}>
			<div className="flex h-full w-full grow items-center">
				<div className="flex flex-col items-start p-24">
					<span className="text-4xl font-bold text-gray-500">Welcome to</span>
					<span className="mt-3 text-5xl font-bold text-gray-500">
						Freebrowse
					</span>
					<button
						onClick={() => {
							void onGetStartedClick();
						}}
						className="mt-16 rounded bg-gray-500 px-6 py-4 font-bold text-white hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-300 active:bg-gray-700"
					>
						Get started
					</button>
				</div>
			</div>
			<div className="flex h-full w-full grow items-center">
				<img alt="Brain" src={brain} className="h-full w-full object-cover" />
			</div>
		</div>
	);
};
