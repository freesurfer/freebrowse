import { NavMenu } from './NavMenu';

export const Layout = ({ children }: { children: React.ReactElement }) => {
	return (
		<>
			Test
			<NavMenu />
			{children}
		</>
	);
};
