import { OpenProjectDialogContext } from '@/dialogs/openProject/OpenProjectDialog';
import brain from '@/pages/landingPage/assets/brain_fancy.jpg';
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
			<div className="h-full w-full grow flex items-center">
				<div className="flex flex-col p-24 items-start">
					<span className="font-bold text-4xl text-gray-500">Welcome to</span>
					<span className="font-bold text-5xl text-gray-500 mt-3">
						Freebrowse
					</span>
					<button
						onClick={() => {
							void onGetStartedClick();
						}}
						className="font-bold bg-gray-500 text-white px-6 py-4 mt-4 rounded-md hover:bg-gray-600 active:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300"
					>
						Get started
					</button>
				</div>
			</div>
			<div className="flex items-center grow w-full h-full">
				<img
					src={brain}
					alt="brain"
					className="object-cover w-full h-full"
				></img>
			</div>
		</div>
	);
};
