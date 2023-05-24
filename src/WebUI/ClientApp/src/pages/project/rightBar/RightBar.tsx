import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import { ProjectContext } from '@/pages/project/ProjectPage';
import { useContext } from 'react';
import Select from 'react-select';

const options = [
	{ value: 'grayscale', label: 'Grayscale' },
	{ value: 'lookupTable', label: 'Lookup Table' },
];

export const RightBar = (): React.ReactElement => {
	const { selectedFile } = useContext(ProjectContext);

	return (
		<div className="w-[16rem] grow-0 bg-gray-100 border border-gray-500">
			<Collapse
				className="border-b border-gray-300 pl-1 pt-1 pr-4"
				title={
					<span className="font-semibold">
						{selectedFile ?? 'No file selected'}
					</span>
				}
			>
				<>
					<Slider
						className="mt-1"
						label="Opacity"
						defaultValue={100}
						unit="%"
					></Slider>
					<div className="flex items-center mb-4">
						<span className="grow mr-2">Color Map:</span>
						<Select
							options={options}
							classNames={{
								indicatorSeparator: () => 'hidden',
								singleValue: () => 'text-xs',
								menu: () => 'text-xs',
							}}
							value={options[0]}
						/>
					</div>
					<span>Contrast & Brightness</span>
					<Slider className="mt-1" label="Minimum" defaultValue={25}></Slider>
					<Slider className="mt-1" label="Maximum" defaultValue={75}></Slider>
				</>
			</Collapse>
		</div>
	);
};
