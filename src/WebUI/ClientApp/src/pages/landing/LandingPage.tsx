import { LandingDescription } from '@/pages/landing/components/LandingDescription';
import { LandingTitle } from '@/pages/landing/components/LandingTitle';

export const LandingPage = (): React.ReactElement => (
	<>
		<LandingTitle className="border grow"></LandingTitle>
		<LandingDescription className="border grow"></LandingDescription>
	</>
);
