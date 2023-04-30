import { Link } from 'react-router-dom';

export const NavMenu = () => {
	return (
		<header className="border-b-1 flex-column flex justify-between px-4 align-baseline shadow-xl">
			<div className="flex items-center">
				<Link to="/" className="m-2 text-lg">
					FreeBrowse
				</Link>
			</div>
			<div className="flex items-center">
				<Link to="/" className="m-2">
					Home
				</Link>
				<Link to="/counter" className="m-2">
					Counter
				</Link>
				<Link to="/fetch-data" className="m-2">
					Fetch Data
				</Link>
				<Link to="/mri-viewer" className="m-2">
					MRI Viewer
				</Link>
			</div>
		</header>
	);
};
