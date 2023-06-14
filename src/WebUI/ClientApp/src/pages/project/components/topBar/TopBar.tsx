import { FieldSet } from '@/pages/project/components/topBar/FieldSet';
import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
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
		<div className="border-gray-500 flex items-baseline gap-4 border bg-fc px-2 pb-1">
			<FieldSet legend="Projects">
				<ToolButton title="New">
					<DocumentPlusIcon className="text-gray-500 h-6 w-6 shrink-0" />
				</ToolButton>
				<ToolButton title="Open">
					<DocumentIcon className=" text-gray-500 h-6 w-6 shrink-0" />
				</ToolButton>
			</FieldSet>
			<FieldSet legend="Modes">
				<ToolButton title="Navigate" active={true}>
					<ArrowsPointingOutIcon className="text-gray-500 h-6  w-6 shrink-0" />
				</ToolButton>
				<ToolButton title="Edit Voxel">
					<PencilIcon className="text-gray-500 h-6 w-6 shrink-0" />
				</ToolButton>
				<ToolButton title="Edit Points">
					<PencilSquareIcon className="text-gray-500 h-6 w-6 shrink-0" />
				</ToolButton>
			</FieldSet>
			<FieldSet legend="Create">
				<ToolButton title="Point Set">
					<CursorArrowRaysIcon className="h-6 w-6 shrink-0 text-fc" />
				</ToolButton>
			</FieldSet>
			<FieldSet legend="Views">
				<ToolButton title="Equal Split">
					<TableCellsIcon className="text-gray-500 h-6 w-6 shrink-0" />
				</ToolButton>
			</FieldSet>
			<ToolButton title="Undo">
				<ArrowUturnLeftIcon className="text-gray-500 h-6 w-6 shrink-0" />
			</ToolButton>
			<ToolButton title="Redo">
				<ArrowUturnRightIcon className="text-gray-500 h-6 w-6 shrink-0" />
			</ToolButton>
			<ToolButton title="Save">
				<BookmarkSquareIcon className="text-gray-500 h-6 w-6 shrink-0" />
			</ToolButton>
		</div>
	);
};
