import type { StateCreator } from "zustand";
import type { LocationData } from "./types";

export interface LocationSlice {
  locationData: LocationData | null;
  setLocationData: (data: LocationData | null) => void;
}

export const createLocationSlice: StateCreator<LocationSlice> = (set) => ({
  locationData: null,
  setLocationData: (locationData) => set({ locationData }),
});
