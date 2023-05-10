import { LandingDescription } from '@/pages/landingPage/components/LandingDescription';
import { LandingTitle } from '@/pages/landingPage/components/LandingTitle';

export const LandingPage = (): React.ReactElement => (
	<>
		<LandingTitle className="border grow"></LandingTitle>
		<LandingDescription className="border grow"></LandingDescription>
	</>
);
