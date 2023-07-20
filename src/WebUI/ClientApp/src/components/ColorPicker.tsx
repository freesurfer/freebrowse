import type { ReactElement } from 'react';
import { useState, useCallback, useEffect } from 'react';

const UNBOUNCE_DELAY = 10;

export const ColorPicker = ({
	className,
	label,
	value,
	onChange,
	onEnd,
}: {
	className?: string;
	label: string;
	value: string;
	onChange?: (value: string) => void;
	onEnd?: (value: string) => void;
}): ReactElement => {
	const [isLocked, setIsLocked] = useState(false);
	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
	const [action, setAction] = useState<(() => void) | null>(null);

	const doIt = useCallback(
		(newValue: string, upload: boolean) => {
			if (!upload) {
				onChange?.(newValue);
				return;
			}
			onEnd?.(newValue);
		},
		[onChange, onEnd]
	);

	const updateValue = useCallback(
		(newValue: string, upload: boolean) => {
			if (isLocked) {
				setAction(() => () => doIt(newValue, upload));
				return;
			}

			setIsLocked(true);
			doIt(newValue, upload);

			const newTimeout = setTimeout(() => {
				setTimeoutId(null);
				if (action !== null) action();
				setIsLocked(false);
				setAction(null);
			}, UNBOUNCE_DELAY);
			setTimeoutId(newTimeout);
		},
		[isLocked, doIt, action]
	);

	useEffect(() => {
		return () => {
			if (timeoutId !== null) clearTimeout(timeoutId);
		};
	}, [timeoutId]);

	return (
		<div className={className}>
			<div className="flex items-center">
				<label className="grow">{label}</label>
				<input
					type="text"
					value={value}
					onChange={(event) => updateValue(event.target.value, false)}
					onBlur={(event) => updateValue(event.target.value, true)}
					className="mr-1 flex h-5 w-20 items-center justify-center rounded border border-gray px-1 py-3 text-center  text-sm"
				></input>
				<input
					type="color"
					value={value}
					onChange={(event) => updateValue(event.target.value, false)}
					onBlur={(event) => updateValue(event.target.value, true)}
					className="flex w-10 rounded border"
					style={{
						padding: 0,
						appearance: 'none',
					}}
				/>
			</div>
		</div>
	);
};
