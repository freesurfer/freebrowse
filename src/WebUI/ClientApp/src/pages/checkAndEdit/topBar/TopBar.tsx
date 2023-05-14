import { FieldSet } from '@/pages/checkAndEdit/topBar/components/FieldSet';
import { ToolButton } from '@/pages/checkAndEdit/topBar/components/ToolButton';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	ArrowsPointingOutIcon,
	BookmarkSquareIcon,
	CursorArrowRaysIcon,
	DocumentIcon,
	DocumentPlusIcon,
	PencilIcon,
	PencilSquareIcon,
	TableCellsIcon,
} from '@heroicons/react/24/outline';

export const TopBar = (): React.ReactElement => {
	return (
		<div className="px-2 pb-1 border border-gray-500 bg-gray-100 flex gap-4 items-baseline">
			<FieldSet legend="Projects">
				<ToolButton title="New">
					<DocumentPlusIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
				<ToolButton title="Open">
					<DocumentIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
			</FieldSet>
			<FieldSet legend="Modes">
				<ToolButton title="Navigate" active={true}>
					<ArrowsPointingOutIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
				<ToolButton title="Edit Voxel">
					<PencilIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
				<ToolButton title="Edit Points">
					<PencilSquareIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
			</FieldSet>
			<FieldSet legend="Create">
				<ToolButton title="Point Set">
					<CursorArrowRaysIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
			</FieldSet>
			<FieldSet legend="Views">
				<ToolButton title="Equal Split">
					<TableCellsIcon className="h-6 w-6 text-gray-500 shrink-0" />
				</ToolButton>
			</FieldSet>
			<ToolButton title="Undo">
				<ArrowUturnLeftIcon className="h-6 w-6 text-gray-500 shrink-0" />
			</ToolButton>
			<ToolButton title="Redo">
				<ArrowUturnRightIcon className="h-6 w-6 text-gray-500 shrink-0" />
			</ToolButton>
			<ToolButton title="Save">
				<BookmarkSquareIcon className="h-6 w-6 text-gray-500 shrink-0" />
			</ToolButton>
		</div>
	);
};
