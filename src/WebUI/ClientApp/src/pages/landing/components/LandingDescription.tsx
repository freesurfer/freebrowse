import description from '@/pages/landing/assets/description.png';

export const LandingDescription = ({
	className,
}: {
	className?: string;
}): React.ReactElement => (
	<div className={`${className ?? ''} bg-gray-100 flex flex-row`}>
		<div className="flex w-full grow items-center justify-center">
			<img
				src={description}
				alt="brain description"
				className="mx-8 w-64 object-cover"
			></img>
		</div>
		<div className="flex w-full grow flex-col items-center">
			<div className="flex h-full w-full grow flex-col justify-center">
				<span className="text-l text-gray-500 font-bold">
					Short text describing FreeBrowse
				</span>
				<p className="text-l text-gray-500 mr-8 mt-2">
					Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
					nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
					sed diam voluptua.
				</p>
			</div>
		</div>
	</div>
);
