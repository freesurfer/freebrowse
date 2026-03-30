import { useState, useRef, useEffect } from "react";
import { useFreeBrowseStore } from "@/store";
import { Niivue, NVImage } from "@niivue/niivue";
import { base64NiftiToNVImage } from "@/lib/niivue-helpers";
import { ensureGLContext } from "@/lib/gl-context";

export type MM5QaMetadata = {
  dataset: string;
  modality: string;
  task: string;
  sample: string;
  labelIndex: number;
  labelName: string;
};

export type MM5QaState = {
  name: string;
  seed: string;
  sessionId: string | null;
  currentIndex: number;
  selectedRating: number | null;
  loading: boolean;
  error: string | null;
  metadata: MM5QaMetadata | null;
  contrastMin: number;
  contrastMax: number;
  globalMin: number;
  globalMax: number;
  blinded: boolean;
};

// --- Pure helpers ---

type MM5QaSample = { volImage: NVImage; segImage: NVImage; metadata: MM5QaMetadata | null };

async function fetchAndDecodeSample(
  sessionId: string,
  index: number,
): Promise<MM5QaSample> {
  const url = `/mm5-qa/sample?session_id=${sessionId}&index=${index}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load MM5 QA sample");
  }
  const data = await response.json();

  const volImage = await base64NiftiToNVImage(
    data.volume_nifti,
    "mm5_qa_volume.nii.gz",
  );
  const segImage = await base64NiftiToNVImage(
    data.seg_nifti,
    "mm5_qa_seg.nii.gz",
    { colormap: "red", opacity: 0.5 },
  );

  const metadata: MM5QaMetadata | null = data.metadata
    ? {
        dataset: data.metadata.dataset,
        modality: data.metadata.modality,
        task: data.metadata.task,
        sample: data.metadata.sample,
        labelIndex: data.metadata.label_index,
        labelName: data.metadata.label_name,
      }
    : null;

  return { volImage, segImage, metadata };
}

// --- Hook ---

const PREFETCH_AHEAD = 5;

export function useMM5Qa(nvRef: React.RefObject<Niivue | null>) {
  const setShowUploader = useFreeBrowseStore((s) => s.setShowUploader);

  const preloadedRef = useRef<Map<number, MM5QaSample>>(new Map());
  const pendingRatingRef = useRef<Promise<void> | null>(null);

  const [mm5QaState, setMM5QaState] = useState<MM5QaState>({
    name: "",
    seed: "",
    sessionId: null,
    currentIndex: 0,
    selectedRating: null,
    loading: false,
    error: null,
    metadata: null,
    contrastMin: 0,
    contrastMax: 100,
    globalMin: 0,
    globalMax: 100,
    blinded: false,
  });

  // Refs to avoid stale closures in async functions
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inflightPrefetchRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    sessionIdRef.current = mm5QaState.sessionId;
  }, [mm5QaState.sessionId]);

  async function showSampleInViewer(
    volImage: NVImage,
    segImage: NVImage,
  ): Promise<void> {
    const nv = nvRef.current;
    if (!nv) return;
    await ensureGLContext(nv);

    let removals = 0;
    while (nv.volumes.length > 0 && removals++ < 100) {
      nv.removeVolumeByIndex(0);
    }
    nv.addVolume(volImage);
    nv.addVolume(segImage);
    nv.updateGLVolume();
    nv.drawScene();
  }

  function prefetchSamples(sessionId: string, currentIndex: number): void {
    const cache = preloadedRef.current;
    const inflight = inflightPrefetchRef.current;
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const idx = currentIndex + i;
      if (cache.has(idx) || inflight.has(idx)) continue;
      inflight.add(idx);
      fetchAndDecodeSample(sessionId, idx)
        .then((result) => {
          if (sessionIdRef.current === sessionId) {
            preloadedRef.current.set(idx, result);
          }
        })
        .catch(() => {})
        .finally(() => {
          inflight.delete(idx);
        });
    }
  }

  async function loadSample(
    sessionId: string,
    index: number,
  ): Promise<void> {
    setMM5QaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const cache = preloadedRef.current;
      let sample: MM5QaSample;

      const cached = cache.get(index);
      if (cached) {
        sample = cached;
        cache.delete(index);
      } else {
        sample = await fetchAndDecodeSample(sessionId, index);
      }

      await showSampleInViewer(sample.volImage, sample.segImage);

      setMM5QaState((prev) => ({
        ...prev,
        currentIndex: index,
        metadata: sample.metadata,
        selectedRating: null,
        loading: false,
        contrastMin: sample.volImage.cal_min ?? 0,
        contrastMax: sample.volImage.cal_max ?? 100,
        globalMin: sample.volImage.global_min ?? 0,
        globalMax: sample.volImage.global_max ?? 100,
      }));

      prefetchSamples(sessionId, index);
    } catch (err) {
      setMM5QaState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function initSession(): Promise<void> {
    if (!mm5QaState.name.trim() || !mm5QaState.seed.trim()) {
      setMM5QaState((prev) => ({
        ...prev,
        error: "Name and seed are required",
      }));
      return;
    }

    const seedNum = parseInt(mm5QaState.seed, 10);
    if (isNaN(seedNum)) {
      setMM5QaState((prev) => ({ ...prev, error: "Seed must be a number" }));
      return;
    }

    preloadedRef.current.clear();
    inflightPrefetchRef.current.clear();
    setMM5QaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/mm5-qa/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mm5QaState.name.trim(), seed: seedNum }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to initialize MM5 QA session");
      }

      const data = await response.json();

      setMM5QaState((prev) => ({
        ...prev,
        sessionId: data.session_id,
        currentIndex: data.current_index,
        blinded: data.blinded ?? false,
      }));

      await loadSample(data.session_id, data.current_index);
    } catch (err) {
      setMM5QaState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function submitRating(rating: number): Promise<void> {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    setMM5QaState((prev) => ({ ...prev, selectedRating: rating }));

    const ratingPromise = (async () => {
      try {
        const response = await fetch("/mm5-qa/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            rating,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to submit MM5 QA rating");
        }
        pendingRatingRef.current = null;
      } catch (err) {
        setMM5QaState((prev) => ({
          ...prev,
          error: (err as Error).message,
        }));
      }
    })();

    pendingRatingRef.current = ratingPromise;
  }

  async function advanceToNextSample(): Promise<void> {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    if (pendingRatingRef.current) {
      await pendingRatingRef.current;
    }

    setMM5QaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/mm5-qa/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to advance");
      }

      const data = await response.json();
      await loadSample(sessionId, data.current_index);
    } catch (err) {
      setMM5QaState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  function toggleSegOverlay(): void {
    const nv = nvRef.current;
    if (!nv || nv.volumes.length < 2) return;
    const seg = nv.volumes[1];
    const newOpacity = seg.opacity > 0 ? 0 : 0.5;
    nv.setOpacity(1, newOpacity);
    nv.drawScene();
  }

  // Press spacebar to toggle segmentation overlay
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        toggleSegOverlay();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleContrastMinChange(value: number): void {
    const vol = nvRef.current?.volumes[0];
    if (!vol) return;
    vol.cal_min = value;
    nvRef.current?.updateGLVolume();
    setMM5QaState((prev) => ({ ...prev, contrastMin: value }));
  }

  function handleContrastMaxChange(value: number): void {
    const vol = nvRef.current?.volumes[0];
    if (!vol) return;
    vol.cal_max = value;
    nvRef.current?.updateGLVolume();
    setMM5QaState((prev) => ({ ...prev, contrastMax: value }));
  }

  function handleEndSession() {
    abortRef.current = null;
    inflightPrefetchRef.current.clear();
    preloadedRef.current.clear();
    pendingRatingRef.current = null;

    const nv = nvRef.current;
    if (nv) {
      let removals = 0;
      while (nv.volumes.length > 0 && removals++ < 100) {
        nv.removeVolumeByIndex(0);
      }
    }

    setShowUploader(true);

    setMM5QaState((prev) => ({
      name: prev.name,
      seed: prev.seed,
      sessionId: null,
      currentIndex: 0,
      selectedRating: null,
      loading: false,
      error: null,
      metadata: null,
      contrastMin: 0,
      contrastMax: 100,
      globalMin: 0,
      globalMax: 100,
      blinded: false,
    }));
  }

  return {
    mm5QaState,
    setMM5QaState,
    initSession,
    submitRating,
    advanceToNextSample,
    toggleSegOverlay,
    handleEndSession,
    handleContrastMinChange,
    handleContrastMaxChange,
  };
}
