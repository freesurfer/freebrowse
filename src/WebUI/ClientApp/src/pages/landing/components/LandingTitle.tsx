import brain from '@/pages/landing/assets/brain_fancy.jpg';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingTitle = ({
	className,
}: {
	className?: string;
}): React.ReactElement => {
	const navigate = useNavigate();
	const { createProject } = useContext(OpenProjectDialogContext);

	const onGetStartedClick = async (): Promise<void> => {
		const result = await createProject();
		if (result === 'canceled') return;
		navigate(`/project/${result.projectId}`);
	};

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
						className="mt-4 rounded-md bg-gray-500 px-6 py-4 font-bold text-white hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-300 active:bg-gray-700"
					>
						Get started
					</button>
				</div>
			</div>
			<div className="flex h-full w-full grow items-center">
				<img
					src={brain}
					alt="brain"
					className="h-full w-full object-cover"
				></img>
			</div>
		</div>
	);
};
