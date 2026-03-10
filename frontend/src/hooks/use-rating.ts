import { useState, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { Niivue, NVImage } from "@niivue/niivue";

export type RatingState = {
  name: string;
  seed: string;
  sessionId: string | null;
  currentIndex: number;
  totalVolumes: number;
  currentPath: string;
  selectedRating: number | null;
  loading: boolean;
  done: boolean;
  error: string | null;
};

// --- Pure helpers ---

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function decodeNiftiToNVImage(niftiBase64: string): Promise<NVImage> {
  const niftiBytes = decodeBase64ToBytes(niftiBase64);
  const blob = new Blob([niftiBytes], { type: "application/gzip" });
  const file = new File([blob], "rating_volume.nii.gz");
  return await NVImage.loadFromFile({ file });
}

async function fetchAndDecodeVolume(
  sessionId: string,
  index: number,
): Promise<{ nvimage: NVImage; path: string }> {
  const url = `/rating/volume?session_id=${sessionId}&index=${index}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load volume");
  }
  const data = await response.json();
  const nvimage = await decodeNiftiToNVImage(data.volume_nifti);
  return { nvimage, path: data.path };
}

// --- Hook ---

const PREFETCH_AHEAD = 5;

export function useRating(nvRef: React.RefObject<Niivue | null>) {
  const showUploader = useFreeBrowseStore((s) => s.showUploader);
  const setShowUploader = useFreeBrowseStore((s) => s.setShowUploader);

  const preloadedRatingVolumeRef = useRef<
    Map<number, { nvimage: NVImage; path: string }>
  >(new Map());

  const [ratingState, setRatingState] = useState<RatingState>({
    name: "",
    seed: "",
    sessionId: null,
    currentIndex: 0,
    totalVolumes: 0,
    currentPath: "",
    selectedRating: null,
    loading: false,
    done: false,
    error: null,
  });

  function showNVImageInViewer(nvimage: NVImage): void {
    const nv = nvRef.current;
    if (!nv) return;
    if (showUploader) setShowUploader(false);
    while (nv.volumes.length > 0) {
      nv.removeVolumeByIndex(0);
    }
    nv.addVolume(nvimage);
    nv.updateGLVolume();
  }

  function prefetchVolumes(
    sessionId: string,
    currentIndex: number,
    totalVolumes: number,
  ): void {
    const preloadedVolumes = preloadedRatingVolumeRef.current;
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const idx = currentIndex + i;

      if (idx >= totalVolumes) break;
      if (preloadedVolumes.has(idx)) continue;

      fetchAndDecodeVolume(sessionId, idx)
        .then((result) => {
          preloadedRatingVolumeRef.current.set(idx, result);
        })
        .catch(() => {});
    }
  }

  async function loadRatingVolume(
    sessionId: string,
    index: number,
    totalVolumes: number,
  ): Promise<void> {
    setRatingState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const prefetchedVolumes = preloadedRatingVolumeRef.current;
      let nvimage: NVImage;
      let path: string;

      const prefetchedVolume = prefetchedVolumes.get(index);
      if (prefetchedVolume) {
        nvimage = prefetchedVolume.nvimage;
        path = prefetchedVolume.path;
        prefetchedVolumes.delete(index);
      } else {
        const result = await fetchAndDecodeVolume(sessionId, index);
        nvimage = result.nvimage;
        path = result.path;
      }

      showNVImageInViewer(nvimage);

      setRatingState((prev) => ({
        ...prev,
        currentPath: path,
        currentIndex: index,
        selectedRating: null,
        loading: false,
      }));

      prefetchVolumes(sessionId, index, totalVolumes);
    } catch (err) {
      setRatingState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function initRatingSession(): Promise<void> {
    if (!ratingState.name.trim() || !ratingState.seed.trim()) {
      setRatingState((prev) => ({
        ...prev,
        error: "Name and seed are required",
      }));
      return;
    }

    const seedNum = parseInt(ratingState.seed, 10);
    if (isNaN(seedNum)) {
      setRatingState((prev) => ({
        ...prev,
        error: "Seed must be a number",
      }));
      return;
    }

    preloadedRatingVolumeRef.current.clear();
    setRatingState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/rating/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ratingState.name.trim(), seed: seedNum }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to initialize session");
      }

      const data = await response.json();
      const done = data.current_index >= data.total_volumes;

      setRatingState((prev) => ({
        ...prev,
        sessionId: data.session_id,
        currentIndex: data.current_index,
        totalVolumes: data.total_volumes,
        loading: false,
        done,
      }));

      if (!done) {
        await loadRatingVolume(
          data.session_id,
          data.current_index,
          data.total_volumes,
        );
      }
    } catch (err) {
      setRatingState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function submitRating(rating: number): Promise<void> {
    if (!ratingState.sessionId) return;

    setRatingState((prev) => ({ ...prev, selectedRating: rating }));

    try {
      const response = await fetch("/rating/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: ratingState.sessionId,
          rating,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit rating");
      }
    } catch (err) {
      setRatingState((prev) => ({
        ...prev,
        error: (err as Error).message,
      }));
    }
  }

  async function advanceToNextVolume(): Promise<void> {
    if (!ratingState.sessionId) return;

    setRatingState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/rating/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: ratingState.sessionId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to advance");
      }

      const data = await response.json();

      if (data.done) {
        setRatingState((prev) => ({
          ...prev,
          done: true,
          loading: false,
          currentIndex: data.current_index,
        }));
        return;
      }

      await loadRatingVolume(
        ratingState.sessionId,
        data.current_index,
        data.total_volumes,
      );
    } catch (err) {
      setRatingState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  function handleEndSession() {
    setRatingState({
      name: ratingState.name,
      seed: ratingState.seed,
      sessionId: null,
      currentIndex: 0,
      totalVolumes: 0,
      currentPath: "",
      selectedRating: null,
      loading: false,
      done: false,
      error: null,
    });
  }

  return {
    ratingState,
    setRatingState,
    initRatingSession,
    submitRating,
    advanceToNextVolume,
    handleEndSession,
  };
}
