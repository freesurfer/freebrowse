import { OrderListRows } from '@/components/orderList/OrderListRows';
import { OrderState, ROW_HEIGHT } from '@/components/orderList/OrderListState';
import { type ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { type ProjectFilesPointSets } from '@/pages/project/models/ProjectFilesPointSets';
import { type ProjectFilesSurfaces } from '@/pages/project/models/ProjectFilesSurfaces';
import { type ProjectFilesVolumes } from '@/pages/project/models/ProjectFilesVolumes';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo } from 'react';
import type { ReactElement } from 'react';

export const OrderList = observer(
	({
		setActiveOnly,
		files,
		allFiles,
		multiselect = true,
		hideFileExtension = false,
	}: {
		setActiveOnly: (file: ProjectFile) => void;
		files: ProjectFiles;
		allFiles:
			| ProjectFilesVolumes['all']
			| ProjectFilesSurfaces['all']
			| ProjectFilesPointSets['all'];
		multiselect?: boolean;
		hideFileExtension?: boolean;
	}): ReactElement => {
		const state = useMemo(() => {
			return new OrderState(files, allFiles, multiselect, (file) =>
				setActiveOnly(file)
			);
		}, [files, allFiles, setActiveOnly, multiselect]);

		const handleDrop = useCallback(() => state.drop(), [state]);
		const handleMove = useCallback(
			(event: MouseEvent) => state.updateDrag(event.pageY),
			[state]
		);
		const handleKeyDown = useCallback(
			(event: KeyboardEvent) => state.handleKeyDown(event.key),
			[state]
		);
		const handleKeyUp = useCallback(
			(event: KeyboardEvent) => state.handleKeyUp(event.key),
			[state]
		);

		useEffect(() => {
			document.addEventListener('mousemove', handleMove);
			document.addEventListener('mouseup', handleDrop);
			document.addEventListener('keydown', handleKeyDown);
			document.addEventListener('keyup', handleKeyUp);
			return () => {
				document.removeEventListener('mousemove', handleMove);
				document.removeEventListener('mouseup', handleDrop);
				document.removeEventListener('keydown', handleKeyDown);
				document.removeEventListener('keyup', handleKeyUp);
			};
		}, [handleDrop, handleMove, handleKeyDown, handleKeyUp]);

		return (
			<div
				style={{
					height: `${(allFiles.length ?? 0) * ROW_HEIGHT}px`,
					marginBottom: 2,
					position: 'relative',
				}}
			>
				<OrderListRows
					rows={state.rows}
					startDrag={(mouseStart, entry) => state.startDrag(mouseStart, entry)}
					hideFileExtension={hideFileExtension}
				></OrderListRows>
			</div>
		);
	}
);
