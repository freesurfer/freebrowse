import { Link } from 'react-router-dom';

export const NavMenu = () => {
	return (
		<header className="border-b-1 flex-column flex justify-between px-4 align-baseline shadow-xl">
			<div className="flex items-center">
				<Link to="/" className="mx-2 my-4 text-lg">
					FreeBrowse
				</Link>
			</div>
			<div className="flex items-center">
				<Link to="/" className="mx-2 my-4">
					Home
				</Link>
				<Link to="/counter" className="mx-2 my-4">
					Counter
				</Link>
				<Link to="/fetch-data" className="mx-2 my-4">
					Fetch Data
				</Link>
				<Link to="/mri-viewer" className="mx-2 my-4">
					MRI Viewer
				</Link>
			</div>
		</header>
	);
};
