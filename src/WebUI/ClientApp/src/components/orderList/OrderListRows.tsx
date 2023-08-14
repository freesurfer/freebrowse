import { OrderListEntry } from '@/components/orderList/OrderListEntry';
import { type OrderRow } from '@/components/orderList/OrderListState';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import { observer } from 'mobx-react-lite';
import { type ReactElement } from 'react';

export const OrderListRows = observer(
	<T_FILE_TYPE extends ProjectFile>({
		rows,
		startDrag,
		hideFileExtension,
	}: {
		rows: OrderRow<T_FILE_TYPE>[];
		startDrag: (mouseStart: number, entry: OrderRow<T_FILE_TYPE>) => void;
		hideFileExtension?: boolean;
	}): ReactElement[] => {
		return rows.map((row) => (
			<OrderListEntry
				key={`${row.projectFile.name}${
					row.projectFile instanceof CloudFile ? row.projectFile.id : ''
				}`}
				row={row}
				startDrag={(mouseStart, entry) => startDrag(mouseStart, entry)}
				hideFileExtension={hideFileExtension}
			></OrderListEntry>
		));
	}
);
