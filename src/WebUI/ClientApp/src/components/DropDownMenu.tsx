import {
	useState,
	type ReactElement,
	useEffect,
	useCallback,
	useRef,
} from 'react';

export const DropDownMenu = ({
	className,
	children,
	options,
}: {
	className?: string;
	children: ReactElement;
	options: {
		label: string;
		icon: (className: string) => ReactElement;
		onClick: () => void;
	}[];
}): ReactElement => {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState<boolean>(false);

	const handleMouseDown = useCallback(
		({ target }: MouseEvent): void => {
			if (wrapperRef.current === undefined) return;
			if (
				wrapperRef.current === null ||
				(target instanceof Node && wrapperRef.current.contains(target))
			)
				return;
			setVisible(false);
			document.removeEventListener('mousedown', handleMouseDown);
		},
		[setVisible]
	);

	useEffect(() => {
		if (!visible) return;
		document.addEventListener('mousedown', handleMouseDown);
		return () => document.removeEventListener('mousedown', handleMouseDown);
	}, [handleMouseDown, visible]);

	return (
		<div ref={wrapperRef} className="relative">
			<button
				className={className}
				onClick={() => {
					setVisible((visible) => !visible);
				}}
			>
				{children}
			</button>
			{visible ? (
				<div className="absolute right-0 z-30 flex flex-col overflow-hidden rounded border bg-white text-xs shadow-[0_4px_4px_1px_rgba(0,0,0,0.2)]">
					{options.map((option) => (
						<button
							key={option.label}
							className="flex items-center gap-2 border-b bg-white px-2 py-1 text-font last:border-b-0"
							onClick={() => {
								setVisible(false);
								option.onClick();
							}}
						>
							{option.icon('w-4 h-4')}
							{option.label}
						</button>
					))}
				</div>
			) : (
				<></>
			)}
		</div>
	);
};
