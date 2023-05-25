import { Collapse } from '@/components/Collapse';

export const FileInfo = (): React.ReactElement => {
	return (
		<Collapse
			className="border-b border-gray-300 p-1"
			title={<span className="font-semibold">File Info</span>}
			initialState={false}
		>
			<>TODO</>
		</Collapse>
	);
};
