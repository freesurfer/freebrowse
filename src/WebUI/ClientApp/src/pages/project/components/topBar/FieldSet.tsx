export const FieldSet = ({
	children,
	legend,
}: {
	children: React.ReactElement | React.ReactElement[];
	legend: string;
}): React.ReactElement => {
	return (
		<>
			<fieldset className="border border-dashed border-gray-400 px-1 pb-1 flex">
				<legend className="text-gray-500 font-bold text-xs mx-1 px-1">
					{legend}
				</legend>
				{children}
			</fieldset>
		</>
	);
};
