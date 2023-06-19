import description from '@/pages/landing/assets/description.png';

export const LandingDescription = ({
	className,
}: {
	className?: string;
}): React.ReactElement => (
	<div className={`${className ?? ''} flex flex-row bg-gray-100`}>
		<div className="flex w-full grow items-center justify-center">
			<img
				src={description}
				alt="brain description"
				className="mx-8 w-64 object-cover"
			></img>
		</div>
		<div className="flex w-full grow flex-col items-center">
			<div className="flex h-full w-full grow flex-col justify-center">
				<span className="text-l font-bold text-gray-500">
					Short text describing FreeBrowse
				</span>
				<p className="text-l mr-8 mt-2 text-gray-500">
					Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
					nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
					sed diam voluptua.
				</p>
			</div>
		</div>
	</div>
);
