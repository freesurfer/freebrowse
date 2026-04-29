import { useState, useRef, useEffect } from "react";
import { useFreeBrowseStore } from "@/store";
import { Niivue, NVImage } from "@niivue/niivue";
import {
  base64NiftiToNVImage,
  resetNiivueSceneGeometry,
} from "@/lib/niivue-helpers";
import {
  percentileFromSortedIntensities,
  sortedFiniteIntensities,
} from "@/lib/intensity-percentiles";
import { ensureGLContext } from "@/lib/gl-context";

export type MM5QaMetadata = {
  dataset: string;
  modality: string;
  task: string;
  sample: string;
  labelIndex: number;
  labelName: string;
  voxelSpacing?: number[];
};

export type MM5QaRating =
  | "very_easy"
  | "easy"
  | "hard"
  | "very_hard"
  | "incorrect"
  | "low_quality"
  | "not_present"
  | "not_applicable";

export type MM5QaState = {
  name: string;
  seed: string;
  sessionId: string | null;
  currentIndex: number;
  selectedRating: MM5QaRating | null;
  loading: boolean;
  error: string | null;
  metadata: MM5QaMetadata | null;
  contrastMinPercentile: number;
  contrastMaxPercentile: number;
  contrastMinIntensity: number;
  contrastMaxIntensity: number;
  globalMinIntensity: number;
  globalMaxIntensity: number;
  blinded: boolean;
  segVisible: boolean;
  samplingStrategy: "hierarchical" | "random";
};

// --- Pure helpers ---

type MM5QaSample = {
  volImage: NVImage;
  segImage: NVImage;
  metadata: MM5QaMetadata | null;
};
type NVImageWithIntensityData = NVImage & {
  img?: ArrayLike<number>;
  cal_min?: number;
  cal_max?: number;
  global_min?: number;
  global_max?: number;
  robust_min?: number;
  robust_max?: number;
};

type ContrastState = {
  minIntensity: number;
  maxIntensity: number;
};

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
        dataset: data.metadata.dataset ?? "",
        modality: data.metadata.modality ?? "",
        task: data.metadata.task ?? "",
        sample: data.metadata.sample ?? "",
        labelIndex: data.metadata.label_index ?? 0,
        labelName: data.metadata.label_name ?? "",
        voxelSpacing: data.metadata.voxel_spacing,
      }
    : null;

  return { volImage, segImage, metadata };
}

// --- Hook ---

const PREFETCH_AHEAD = 5;
const DEFAULT_CONTRAST_MIN_PERCENTILE = 2;
const DEFAULT_CONTRAST_MAX_PERCENTILE = 98;

export function useMM5Qa(nvRef: React.RefObject<Niivue | null>) {
  const setShowUploader = useFreeBrowseStore((s) => s.setShowUploader);

  const preloadedRef = useRef<Map<number, MM5QaSample>>(new Map());
  const pendingRatingRef = useRef<Promise<void> | null>(null);
  const sortedIntensityCacheRef = useRef<WeakMap<NVImage, Float32Array>>(
    new WeakMap(),
  );

  const [mm5QaState, setMM5QaState] = useState<MM5QaState>({
    name: "",
    seed: "",
    sessionId: null,
    currentIndex: 0,
    selectedRating: null,
    loading: false,
    error: null,
    metadata: null,
    contrastMinPercentile: DEFAULT_CONTRAST_MIN_PERCENTILE,
    contrastMaxPercentile: DEFAULT_CONTRAST_MAX_PERCENTILE,
    contrastMinIntensity: 0,
    contrastMaxIntensity: 100,
    globalMinIntensity: 0,
    globalMaxIntensity: 100,
    blinded: false,
    segVisible: true,
    samplingStrategy: "random",
  });

  // Refs to avoid stale closures in async functions
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inflightPrefetchRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    sessionIdRef.current = mm5QaState.sessionId;
  }, [mm5QaState.sessionId]);

  function getSortedIntensities(volume: NVImage): Float32Array | null {
    const cachedValues = sortedIntensityCacheRef.current.get(volume);
    if (cachedValues) return cachedValues;

    const values = (volume as NVImageWithIntensityData).img;
    if (!values) return null;

    const sortedValues = sortedFiniteIntensities(values);
    sortedIntensityCacheRef.current.set(volume, sortedValues);
    return sortedValues;
  }

  function getVolumeIntensityAtPercentile(
    volume: NVImage,
    percentile: number,
    fallback: number,
  ): number {
    const sortedValues = getSortedIntensities(volume);
    if (!sortedValues) return fallback;

    const intensity = percentileFromSortedIntensities(sortedValues, percentile);
    return Number.isFinite(intensity) ? intensity : fallback;
  }

  function getFiniteNumber(value: number | undefined, fallback: number): number {
    const isFiniteNumber = typeof value === "number" && Number.isFinite(value);
    return isFiniteNumber ? value : fallback;
  }

  function applyDefaultContrast(volume: NVImage): ContrastState {
    const image = volume as NVImageWithIntensityData;
    const minIntensity = getFiniteNumber(
      image.cal_min,
      getVolumeIntensityAtPercentile(volume, DEFAULT_CONTRAST_MIN_PERCENTILE, 0),
    );
    const maxIntensity = getFiniteNumber(
      image.cal_max,
      getVolumeIntensityAtPercentile(
        volume,
        DEFAULT_CONTRAST_MAX_PERCENTILE,
        100,
      ),
    );

    image.cal_min = minIntensity;
    image.cal_max = maxIntensity;
    image.robust_min = minIntensity;
    image.robust_max = maxIntensity;
    return { minIntensity, maxIntensity };
  }

  function centerCrosshairOnSegmentation(): void {
    const nv = nvRef.current;
    if (!nv) return;
    const seg = nv.volumes[1];
    if (!seg?.img || !seg?.hdr?.dims) return;

    const nx = seg.hdr.dims[1];
    const ny = seg.hdr.dims[2];
    const nz = seg.hdr.dims[3];
    const data = seg.img;
    let sumX = 0, sumY = 0, sumZ = 0, count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] <= 0) continue;
      const z = Math.floor(i / (nx * ny));
      const rem = i % (nx * ny);
      const y = Math.floor(rem / nx);
      const x = rem % nx;
      sumX += x;
      sumY += y;
      sumZ += z;
      count++;
    }
    if (count === 0) return;

    nv.scene.crosshairPos = [
      sumX / (count * nx),
      sumY / (count * ny),
      sumZ / (count * nz),
    ];
  }

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
    resetNiivueSceneGeometry(nv);
    centerCrosshairOnSegmentation();

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

      const contrast = applyDefaultContrast(sample.volImage);
      const volImage = sample.volImage as NVImageWithIntensityData;
      await showSampleInViewer(sample.volImage, sample.segImage);

      setMM5QaState((prev) => ({
        ...prev,
        currentIndex: index,
        metadata: sample.metadata,
        selectedRating: null,
        loading: false,
        contrastMinPercentile: DEFAULT_CONTRAST_MIN_PERCENTILE,
        contrastMaxPercentile: DEFAULT_CONTRAST_MAX_PERCENTILE,
        contrastMinIntensity: contrast.minIntensity,
        contrastMaxIntensity: contrast.maxIntensity,
        globalMinIntensity: volImage.global_min ?? 0,
        globalMaxIntensity: volImage.global_max ?? 100,
        segVisible: true,
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
    sortedIntensityCacheRef.current = new WeakMap();
    setMM5QaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/mm5-qa/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mm5QaState.name.trim(),
          seed: seedNum,
          sampling_strategy: mm5QaState.samplingStrategy,
        }),
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

  async function submitRating(rating: MM5QaRating): Promise<void> {
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

  function resetView(): void {
    const nv = nvRef.current;
    if (!nv) return;
    resetNiivueSceneGeometry(nv);
    centerCrosshairOnSegmentation();
    nv.updateGLVolume();
    nv.drawScene();
  }

  function toggleSegOverlay(): void {
    const nv = nvRef.current;
    if (!nv || nv.volumes.length < 2) return;
    const seg = nv.volumes[1];
    const newOpacity = seg.opacity > 0 ? 0 : 0.5;
    nv.setOpacity(1, newOpacity);
    nv.drawScene();
    setMM5QaState((prev) => ({ ...prev, segVisible: newOpacity > 0 }));
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

  function handleContrastMinChange(percentile: number): void {
    const vol = nvRef.current?.volumes[0] as NVImage | undefined;
    if (!vol) return;

    const intensity = getVolumeIntensityAtPercentile(
      vol,
      percentile,
      mm5QaState.contrastMinIntensity,
    );
    (vol as NVImageWithIntensityData).cal_min = intensity;
    nvRef.current?.updateGLVolume();
    setMM5QaState((prev) => ({
      ...prev,
      contrastMinPercentile: percentile,
      contrastMinIntensity: intensity,
    }));
  }

  function handleContrastMaxChange(percentile: number): void {
    const vol = nvRef.current?.volumes[0] as NVImage | undefined;
    if (!vol) return;

    const intensity = getVolumeIntensityAtPercentile(
      vol,
      percentile,
      mm5QaState.contrastMaxIntensity,
    );
    (vol as NVImageWithIntensityData).cal_max = intensity;
    nvRef.current?.updateGLVolume();
    setMM5QaState((prev) => ({
      ...prev,
      contrastMaxPercentile: percentile,
      contrastMaxIntensity: intensity,
    }));
  }

  function handleEndSession() {
    abortRef.current = null;
    inflightPrefetchRef.current.clear();
    preloadedRef.current.clear();
    sortedIntensityCacheRef.current = new WeakMap();
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
      contrastMinPercentile: DEFAULT_CONTRAST_MIN_PERCENTILE,
      contrastMaxPercentile: DEFAULT_CONTRAST_MAX_PERCENTILE,
      contrastMinIntensity: 0,
      contrastMaxIntensity: 100,
      globalMinIntensity: 0,
      globalMaxIntensity: 100,
      blinded: false,
      segVisible: true,
      samplingStrategy: "random",
    }));
  }

  return {
    mm5QaState,
    setMM5QaState,
    initSession,
    submitRating,
    advanceToNextSample,
    resetView,
    toggleSegOverlay,
    handleEndSession,
    handleContrastMinChange,
    handleContrastMaxChange,
  };
}
