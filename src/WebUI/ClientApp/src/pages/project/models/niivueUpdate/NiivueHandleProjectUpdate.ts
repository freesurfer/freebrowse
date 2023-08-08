import type { INiivueCache } from '@/pages/project/NiivueWrapper';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';
import { niivueHandleMeshesUpdate } from '@/pages/project/models/niivueUpdate/NiivueHandleMeshesUpdate';
import { niivueHandleVolumeUpdate } from '@/pages/project/models/niivueUpdate/NiivueHandleVolumeUpdate';
import type { Niivue } from '@niivue/niivue';

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
	cache: INiivueCache,
	updateMinMax: (
		update: { volume: VolumeFile; min: number; max: number }[]
	) => void
): Promise<void> => {
	const propagateProjectProperties = (): boolean => {
		let hasChanged = false;

		if (
			prev?.crosshairPosition === undefined ||
			prev?.crosshairPosition !== next.crosshairPosition
		) {
			const newPosition = niivue.mm2frac([
				next.crosshairPosition?.x ?? 0,
				next.crosshairPosition?.y ?? 0,
				next.crosshairPosition?.z ?? 0,
			]);

			if (
				newPosition[0] !== niivue.scene.crosshairPos[0] ||
				newPosition[1] !== niivue.scene.crosshairPos[1] ||
				newPosition[2] !== niivue.scene.crosshairPos[2]
			) {
				niivue.scene.crosshairPos = newPosition;
				//	niivue.createOnLocationChange();
				hasChanged = true;
			}
		}

		if (
			prev === undefined ||
			prev?.meshThicknessOn2D !== next.meshThicknessOn2D
		) {
			// otherwise we only need to update the options
			// niivue.setMeshThicknessOn2D(projectState.meshThicknessOn2D ?? 0.5);
			niivue.opts.meshThicknessOn2D = next.meshThicknessOn2D ?? 0.5;
			hasChanged = true;
		}

		if (prev === undefined || prev?.sliceType !== next.sliceType) {
			// otherwise we only need to update the options
			// niivue.setMeshThicknessOn2D(projectState.meshThicknessOn2D ?? 0.5);
			niivue.setSliceType(next?.sliceType ?? niivue.sliceTypeMultiplanar);
			hasChanged = true;
		}

		return hasChanged;
	};

	const renderForVolumes = await niivueHandleVolumeUpdate(
		prev?.files,
		next.files,
		niivue,
		cache,
		updateMinMax
	);

	const renderForMeshes = await niivueHandleMeshesUpdate(
		prev?.files,
		next.files,
		niivue,
		cache
	);

	const renderForProperties = propagateProjectProperties();

	if (renderForMeshes || renderForVolumes || renderForProperties) {
		niivue.updateGLVolume();
	}
};
