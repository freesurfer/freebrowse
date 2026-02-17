import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import type { Niivue } from "@niivue/niivue";

export function useLocation(nvRef: React.RefObject<Niivue | null>) {
  const setLocationData = useFreeBrowseStore((s) => s.setLocationData);

  const handleLocationChange = useCallback(
    (locationObject: any) => {
      if (locationObject && nvRef.current && nvRef.current.volumes.length > 0) {
        const voxelData = nvRef.current.volumes.map((volume, index) => {
          const voxel = volume.mm2vox(locationObject.mm);
          const i = Math.round(voxel[0]);
          const j = Math.round(voxel[1]);
          const k = Math.round(voxel[2]);
          const value = volume.getValue(i, j, k, volume.frame4D);

          return {
            name: volume.name || `Volume ${index + 1}`,
            voxel: [i, j, k] as [number, number, number],
            value: value,
          };
        });

        setLocationData({
          mm: locationObject.mm,
          voxels: voxelData,
        });
      }
    },
    [nvRef, setLocationData],
  );

  return { handleLocationChange };
}
