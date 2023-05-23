import type { Niivue } from '@niivue/niivue';
import { useEffect, useRef } from 'react';

export const MainView = ({
	niivue,
}: {
	niivue: Niivue;
}): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const initNiivue = async (): Promise<void> => {
			if (canvas.current === null) return;
			await niivue.attachToCanvas(canvas.current);
		};

		void initNiivue();
	}, [niivue, canvas]);

	return (
		<div className="border-2 border-gray-500 relative grow">
			<canvas className="absolute" ref={canvas} />
		</div>
	);
};
