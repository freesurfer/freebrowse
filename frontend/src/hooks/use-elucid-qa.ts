import { useState, useRef } from "react";
import { Niivue, NVImage } from "@niivue/niivue";
import { base64NiftiToNVImage } from "@/lib/niivue-helpers";
import { ensureGLContext } from "@/lib/gl-context";

export type ElucidQaState = {
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

async function fetchAndDecodeVolume(
  sessionId: string,
  index: number,
): Promise<{ nvimage: NVImage; path: string }> {
  const url = `/elucid-qa/volume?session_id=${sessionId}&index=${index}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load volume");
  }
  const data = await response.json();
  const nvimage = await base64NiftiToNVImage(data.volume_nifti, "elucid_qa_volume.nii.gz");
  return { nvimage, path: data.path };
}

// --- Hook ---

const PREFETCH_AHEAD = 5;

export function useElucidQa(nvRef: React.RefObject<Niivue | null>) {
  const preloadedVolumeRef = useRef<
    Map<number, { nvimage: NVImage; path: string }>
  >(new Map());

  const [elucidQaState, setElucidQaState] = useState<ElucidQaState>({
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

  async function showNVImageInViewer(nvimage: NVImage): Promise<void> {
    const nv = nvRef.current;
    if (!nv) return;
    await ensureGLContext(nv);
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
    const preloadedVolumes = preloadedVolumeRef.current;
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const idx = currentIndex + i;

      if (idx >= totalVolumes) break;
      if (preloadedVolumes.has(idx)) continue;

      fetchAndDecodeVolume(sessionId, idx)
        .then((result) => {
          preloadedVolumeRef.current.set(idx, result);
        })
        .catch(() => {});
    }
  }

  async function loadVolume(
    sessionId: string,
    index: number,
    totalVolumes: number,
  ): Promise<void> {
    setElucidQaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const prefetchedVolumes = preloadedVolumeRef.current;
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

      setElucidQaState((prev) => ({
        ...prev,
        currentPath: path,
        currentIndex: index,
        selectedRating: null,
        loading: false,
      }));

      prefetchVolumes(sessionId, index, totalVolumes);
    } catch (err) {
      setElucidQaState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function initSession(): Promise<void> {
    if (!elucidQaState.name.trim() || !elucidQaState.seed.trim()) {
      setElucidQaState((prev) => ({
        ...prev,
        error: "Name and seed are required",
      }));
      return;
    }

    const seedNum = parseInt(elucidQaState.seed, 10);
    if (isNaN(seedNum)) {
      setElucidQaState((prev) => ({
        ...prev,
        error: "Seed must be a number",
      }));
      return;
    }

    preloadedVolumeRef.current.clear();
    setElucidQaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/elucid-qa/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: elucidQaState.name.trim(), seed: seedNum }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to initialize session");
      }

      const data = await response.json();
      const done = data.current_index >= data.total_volumes;

      setElucidQaState((prev) => ({
        ...prev,
        sessionId: data.session_id,
        currentIndex: data.current_index,
        totalVolumes: data.total_volumes,
        loading: false,
        done,
      }));

      if (!done) {
        await loadVolume(
          data.session_id,
          data.current_index,
          data.total_volumes,
        );
      }
    } catch (err) {
      setElucidQaState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function submitRating(rating: number): Promise<void> {
    if (!elucidQaState.sessionId) return;

    setElucidQaState((prev) => ({ ...prev, selectedRating: rating }));

    try {
      const response = await fetch("/elucid-qa/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: elucidQaState.sessionId,
          rating,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit rating");
      }
    } catch (err) {
      setElucidQaState((prev) => ({
        ...prev,
        error: (err as Error).message,
      }));
    }
  }

  async function advanceToNextVolume(): Promise<void> {
    if (!elucidQaState.sessionId) return;

    setElucidQaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/elucid-qa/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: elucidQaState.sessionId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to advance");
      }

      const data = await response.json();

      if (data.done) {
        setElucidQaState((prev) => ({
          ...prev,
          done: true,
          loading: false,
          currentIndex: data.current_index,
        }));
        return;
      }

      await loadVolume(
        elucidQaState.sessionId,
        data.current_index,
        data.total_volumes,
      );
    } catch (err) {
      setElucidQaState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  function handleEndSession() {
    setElucidQaState({
      name: elucidQaState.name,
      seed: elucidQaState.seed,
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
    elucidQaState,
    setElucidQaState,
    initSession,
    submitRating,
    advanceToNextVolume,
    handleEndSession,
  };
}
