import type { ProjectState } from '@/pages/project/models/ProjectState';
import { niivueHandleMeshesUpdate } from '@/pages/project/models/niivueUpdate/NiivueHandleMeshesUpdate';
import { niivueHandleVolumeUpdate } from '@/pages/project/models/niivueUpdate/NiivueHandleVolumeUpdate';
import type { Niivue } from '@niivue/niivue';
import type { Dispatch } from 'react';

/**
 * helper class while state change to propagate only the changed parts to the niivue library
 * we are using our own state change detection here instead of hooks,
 * because we need to know, when it has been executed once, to know, when to render again the niivue canvas state
 * that would not be possible using a lot of react useState hooks to keep the last states
 */
export const niivueHandleProjectUpdate = async (
	prev: ProjectState | undefined,
	next: ProjectState,
	niivue: Niivue,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
): Promise<void> => {
	let hasChanged = false;

	const propagateProjectProperties = (): boolean => {
		if (
			prev !== undefined &&
			prev?.meshThicknessOn2D === next.meshThicknessOn2D
		)
			return false;

		// otherwise we only need to update the options
		// this.niivue.setMeshThicknessOn2D(projectState.meshThicknessOn2D ?? 0.5);
		niivue.opts.meshThicknessOn2D = next.meshThicknessOn2D ?? 0.5;
		return true;
	};

	hasChanged ||= await niivueHandleVolumeUpdate(
		prev?.files,
		next.files,
		niivue,
		setProjectState
	);

	hasChanged ||= await niivueHandleMeshesUpdate(
		prev?.files,
		next.files,
		niivue,
		setProjectState
	);

	hasChanged ||= propagateProjectProperties();

	if (hasChanged) {
		niivue.setSliceType(3);
		niivue.updateGLVolume();
	}
};
