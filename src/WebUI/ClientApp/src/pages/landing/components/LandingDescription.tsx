import description from '@/pages/landingPage/assets/description.png';

export const LandingDescription = ({
	className,
}: {
	className?: string;
}): React.ReactElement => (
	<div className={`${className ?? ''} flex flex-row bg-gray-100`}>
		<div className="flex items-center grow w-full justify-center">
			<img
				src={description}
				alt="brain description"
				className="object-cover w-64 mx-8"
			></img>
		</div>
		<div className="flex flex-col items-center w-full grow">
			<div className="h-full w-full grow flex flex-col justify-center">
				<span className="font-bold text-l text-gray-500">
					Short text describing FreeBrowse
				</span>
				<p className="text-l text-gray-500 mt-2 mr-8">
					Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
					nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
					sed diam voluptua.
				</p>
			</div>
		</div>
	</div>
);
