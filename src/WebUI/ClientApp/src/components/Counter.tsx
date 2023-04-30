import { useState } from 'react';

export const Counter = () => {
	const [currentCount, setCurrentCount] = useState(0);

	function incrementCounter() {
		setCurrentCount(currentCount + 1);
	}

	return (
		<div className="px-6 py-4">
			<h1 className="mb-1 text-xl font-medium">Counter</h1>

			<p>This is a simple example of a React component.</p>

			<p className="mt-4">
				Current count: <strong>{currentCount}</strong>
			</p>

			<button
				className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
				onClick={incrementCounter}
			>
				Increment
			</button>
		</div>
	);
};
