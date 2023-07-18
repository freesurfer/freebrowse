import { LandingDescription } from '@/pages/landing/components/LandingDescription';
import { LandingTitle } from '@/pages/landing/components/LandingTitle';
import type { ReactElement } from 'react';

export const LandingPage = (): ReactElement => (
	<>
		<LandingTitle className="grow border"></LandingTitle>
		<LandingDescription className="grow border"></LandingDescription>
	</>
);
