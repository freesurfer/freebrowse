import EqualSplitView from '@/assets/EqualSplitView.svg';
import Navigate from '@/assets/Navigate.svg';
import SaveAll from '@/assets/SaveAll.svg';
import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	CircleStackIcon,
	DocumentIcon,
} from '@heroicons/react/24/outline';

const ICON_STYLE = 'h-7 w-7 shrink-0 text-white';

export const TopBar = (): React.ReactElement => {
	return (
		<div className="flex items-baseline bg-font px-4">
			<ToolButton
				title="Load Project"
				isExpandable={true}
				icon={<DocumentIcon className={ICON_STYLE} />}
			></ToolButton>
			<ToolButton
				title="Navigate"
				isExpandable={true}
				isActive={true}
				icon={<img src={Navigate} className={ICON_STYLE} alt="Navigate" />}
			></ToolButton>
			{/* <ToolButton
				title="Edit Voxel"
				isExpandable={true}
				isActive={true}
				icon={<PencilIcon className={ICON_STYLE} />}
			></ToolButton> */}
			<ToolButton
				title="Equal Split"
				isExpandable={true}
				icon={
					<img
						src={EqualSplitView}
						className={ICON_STYLE}
						alt="EqualSplitView"
					/>
				}
			></ToolButton>
			<ToolButton
				title="PointSet"
				isExpandable={true}
				icon={<CircleStackIcon className={ICON_STYLE} />}
			></ToolButton>
			<ToolButton
				title="Save All"
				isExpandable={true}
				icon={<img src={SaveAll} className={ICON_STYLE} alt="EqualSplitView" />}
			></ToolButton>
			<ToolButton
				title="Undo"
				icon={<ArrowUturnLeftIcon className={ICON_STYLE} />}
			/>
			<ToolButton
				title="Redo"
				icon={<ArrowUturnRightIcon className={ICON_STYLE} />}
			/>
		</div>
	);
};
