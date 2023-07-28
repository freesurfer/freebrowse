import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

export const LandingDescription = ({
	className,
}: {
	className?: string;
}): ReactElement => (
	<div className={`${className ?? ''} flex flex-row bg-gray-100`}>
		<div className="flex w-full grow items-center justify-center">
			<AdjustmentsHorizontalIcon className="mx-8 w-64 object-cover text-gray-400" />
		</div>
		<div className="flex w-full grow flex-col items-center">
			<div className="flex h-full w-full grow flex-col justify-center">
				<span className="text-l font-bold text-font">
					FreeBrowse is a browser based version of FreeSurfer&apos;s Freeview
				</span>
				<p className="text-l mr-8 mt-2 text-gray-500">
					This is an early proof-of-concept prototype. It is under development
					and will change in the upcoming weeks and months. Please send feedback
					(bugs, feature requests and anything else) to pwighton@mgh.harvard.edu
				</p>
			</div>
		</div>
	</div>
);
