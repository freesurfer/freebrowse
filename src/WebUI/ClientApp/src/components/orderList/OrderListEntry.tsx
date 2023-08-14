import { Checkbox } from '@/components/Checkbox';
import { type OrderRow } from '@/components/orderList/OrderListState';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import { type ReactElement } from 'react';

export const OrderListEntry = observer(
	<T_FILE_TYPE extends ProjectFile>({
		row,
		startDrag,
		hideFileExtension = false,
	}: {
		row: OrderRow<T_FILE_TYPE>;
		startDrag: (mouseStart: number, entry: OrderRow<T_FILE_TYPE>) => void;
		hideFileExtension?: boolean;
	}): ReactElement => {
		if (row.label === undefined) return <></>;
		return (
			<div
				ref={(ref) => {
					row.ref = ref;
				}}
				style={{
					transform: `translateY(${row.top}px)`,
				}}
				className={`absolute left-0 right-0 top-0 mt-0.5 rounded ${
					row.projectFile.isActive ? 'bg-primary' : 'bg-white'
				}`}
			>
				<div className="flex w-full items-center">
					<Checkbox
						value={row.projectFile.isChecked}
						onChange={(value) => row.projectFile.setIsChecked(value)}
					></Checkbox>
					<button
						className="flex w-full items-center pl-1 text-start text-xs"
						onMouseDown={(event) => startDrag(event.pageY, row)}
					>
						<span
							className={`grow overflow-hidden text-ellipsis ${
								row.projectFile.isActive ? 'font-bold text-white' : ''
							}`}
						>
							{hideFileExtension ? row.label.split('.')[0] : row.label}
						</span>
						<ArrowsUpDownIcon
							className={`m-1 w-4 shrink-0 ${
								row.projectFile.isActive ? 'text-white' : 'text-font'
							}`}
						></ArrowsUpDownIcon>
					</button>
				</div>
			</div>
		);
	}
);
