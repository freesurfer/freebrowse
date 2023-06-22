import type { ReactElement } from 'react';

export const Select = (): ReactElement => {
	return (
		<select className="h-[1.9em] max-w-[8.5em] grow-[999] rounded-[0.25rem] border">
			<option value="1">Test 1</option>
			<option value="2">Test 2</option>
		</select>
	);
};
