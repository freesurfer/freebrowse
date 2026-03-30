import { useState, useCallback, useEffect } from "react";
import { useFreeBrowseStore } from "@/store";
import { Niivue, NVImage } from "@niivue/niivue";
import { base64ToBytes } from "@/lib/niivue-helpers";

type SegModelInfo = {
  name: string;
  path: string;
};

export type SegState = {
  enabled: boolean;
  loading: boolean;
  uploading: boolean;
  progress: number;
  modelsLoaded: boolean;
  models: SegModelInfo[];
  selectedModel: string | null;
  error: string | null;
  previousLogits: string | null;
  clickMode: "positive" | "negative";
  sessionId: string | null;
};

// --- Pure helpers (no React state) ---

async function fetchModels(): Promise<SegModelInfo[]> {
  const response = await fetch("/available_seg_models");
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }
  return response.json();
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function deleteSession(sessionId: string): Promise<void> {
  try {
    await fetch(`/session/${sessionId}`, { method: "DELETE" });
  } catch {
    // Best-effort cleanup; ignore network errors
  }
}

function getVolumeDims(volume: NVImage): [number, number, number] {
  if (!volume.hdr?.dims) {
    throw new Error("volume.hdr.dims is not available.");
  }
  return [volume.hdr.dims[1], volume.hdr.dims[2], volume.hdr.dims[3]];
}

function encodeFloat32ArrayToBase64(arr: Float32Array): string {
  const bytes = new Uint8Array(arr.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getVolumeAffine(volume: NVImage): number[] {
  if (!volume.hdr?.affine) {
    throw new Error("Volume missing affine matrix");
  }
  return (volume.hdr.affine as number[][]).flat();
}

function collectClicksFromDrawBitmap(
  drawBitmap: Uint8Array | null,
): { positive: number[]; negative: number[] } {
  const positive: number[] = [];
  const negative: number[] = [];

  if (drawBitmap) {
    for (let i = 0; i < drawBitmap.length; i++) {
      if (drawBitmap[i] === 2) positive.push(i);
      else if (drawBitmap[i] === 1) negative.push(i);
    }
  }
  return { positive, negative };
}

function buildInferenceRequest(params: {
  sessionId: string;
  modelName: string;
  positiveClicks: number[];
  negativeClicks: number[];
  previousLogits: string | null;
  dims: [number, number, number];
}): Record<string, unknown> {
  return {
    session_id: params.sessionId,
    model_name: params.modelName,
    positive_clicks: params.positiveClicks,
    negative_clicks: params.negativeClicks,
    previous_logits: params.previousLogits,
    niivue_dims: params.dims,
  };
}


async function loadMaskAsNVImage(maskBytes: Uint8Array): Promise<NVImage> {
  const maskBlob = new Blob([maskBytes], { type: "application/gzip" });
  const maskFile = new File([maskBlob], "segmentation_mask.nii.gz");

  return await NVImage.loadFromFile({
    file: maskFile,
    colormap: "sky_blue",
    opacity: 0.5,
  });
}

// #5BA3C9 — lighter than navy, darker than sky blue
const SKY_BLUE_CMAP = {
  R: [0, 91, 91],
  G: [0, 163, 163],
  B: [0, 201, 201],
  A: [0, 64, 128],
  I: [0, 128, 255],
};

function displayMaskOverlay(nv: Niivue, maskImage: NVImage): void {
  nv.addColormap("sky_blue", SKY_BLUE_CMAP);
  if (nv.volumes.length > 1) {
    nv.removeVolume(nv.volumes[1]);
  }
  nv.addVolume(maskImage);
  nv.updateGLVolume();
}

// --- Hook ---

export function useSegmentation(
  nvRef: React.RefObject<Niivue | null>,
  updateImageDetails: () => void,
) {
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);

  const [segState, setSegState] = useState<SegState>({
    enabled: false,
    loading: false,
    uploading: false,
    progress: 0,
    modelsLoaded: false,
    models: [],
    selectedModel: null,
    error: null,
    previousLogits: null,
    clickMode: "positive",
    sessionId: null,
  });

  const [voxelPromptText, setVoxelPromptText] = useState("");

  const serverlessMode = import.meta.env.VITE_SERVERLESS === "true";

  const uploadVolumeToBackend = useCallback(
    async (volume: NVImage) => {
      if (serverlessMode) return;
      if (!volume.hdr?.dims || !volume.img) return;

      setSegState((prev) => ({ ...prev, uploading: true, error: null }));

      try {
        // Free the old session's volume tensor (50-200MB) on the backend
        // before creating a new one, so memory doesn't accumulate.
        if (segState.sessionId) {
          deleteSession(segState.sessionId);
        }
        const sessionId = generateSessionId();
        const float32Data = new Float32Array(volume.img);
        const volumeDataBase64 = encodeFloat32ArrayToBase64(float32Data);
        const affine = getVolumeAffine(volume);
        const dims = getVolumeDims(volume);

        const response = await fetch("/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            volume_data: volumeDataBase64,
            affine,
            niivue_dims: dims,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `Volume upload failed: ${response.statusText}`,
          );
        }

        setSegState((prev) => ({
          ...prev,
          uploading: false,
          sessionId,
          previousLogits: null,
          error: null,
        }));
      } catch (err) {
        console.error("Volume upload failed:", err);
        setSegState((prev) => ({
          ...prev,
          uploading: false,
          error: (err as Error).message,
        }));
      }
    },
    [serverlessMode, segState.sessionId],
  );

  const loadServerVolume = useCallback(
    async (volumeUrl: string) => {
      if (serverlessMode) return;

      setSegState((prev) => ({ ...prev, uploading: true, error: null }));

      try {
        if (segState.sessionId) {
          deleteSession(segState.sessionId);
        }
        const sessionId = generateSessionId();
        const volumePath = volumeUrl.replace(/^data\//, "");

        const response = await fetch("/session/from_path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            volume_path: volumePath,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `Volume load failed: ${response.statusText}`,
          );
        }

        setSegState((prev) => ({
          ...prev,
          uploading: false,
          sessionId,
          previousLogits: null,
          error: null,
        }));
      } catch (err) {
        console.error("Server volume load failed:", err);
        setSegState((prev) => ({
          ...prev,
          uploading: false,
          error: (err as Error).message,
        }));
      }
    },
    [serverlessMode, segState.sessionId],
  );

  const initSegModel = useCallback(async () => {
    setSegState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const models = await fetchModels();
      const firstModel = models[0]?.name ?? null;

      setSegState((prev) => ({
        ...prev,
        loading: false,
        modelsLoaded: true,
        models,
        selectedModel: firstModel,
      }));
    } catch (err) {
      setSegState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }, []);

  async function runInference(options: {
    endpoint: string;
    extraFields?: Record<string, unknown>;
    storeLogits?: boolean;
    onSuccess?: () => void;
    modelName?: string;
  }): Promise<void> {
    const nv = nvRef.current;
    if (!nv || nv.volumes.length === 0) return;

    const modelName = options.modelName ?? segState.selectedModel;
    if (!modelName) {
      setSegState((prev) => ({ ...prev, error: "No model selected" }));
      return;
    }

    setSegState((prev) => ({
      ...prev,
      loading: true,
      progress: 10,
      error: null,
    }));

    const volume = nv.volumes[0];
    if (!volume.hdr?.dims || !volume.img) {
      setSegState((prev) => ({
        ...prev,
        loading: false,
        error: "Volume data not available",
      }));
      return;
    }

    const dims = getVolumeDims(volume);

    try {
      if (segState.uploading) {
        setSegState((prev) => ({
          ...prev,
          loading: false,
          error: "Volume is still uploading. Please wait.",
        }));
        return;
      }

      if (!segState.sessionId) {
        setSegState((prev) => ({
          ...prev,
          loading: false,
          error: "No volume uploaded. Load a volume first.",
        }));
        return;
      }

      const sessionId = segState.sessionId;

      setSegState((prev) => ({ ...prev, progress: 40 }));

      const clicks = collectClicksFromDrawBitmap(nv.drawBitmap);

      const requestBody = buildInferenceRequest({
        sessionId,
        modelName,
        positiveClicks: clicks.positive,
        negativeClicks: clicks.negative,
        previousLogits: segState.previousLogits,
        dims,
      });

      if (options.extraFields) {
        Object.assign(requestBody, options.extraFields);
      }

      const response = await fetch(options.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Inference failed: ${response.statusText}`,
        );
      }

      const result = await response.json();
      const maskBytes = base64ToBytes(result.mask_nifti);
      const maskImage = await loadMaskAsNVImage(maskBytes);
      displayMaskOverlay(nv, maskImage);

      setSegState((prev) => ({
        ...prev,
        loading: false,
        progress: 100,
        previousLogits: options.storeLogits
          ? result.logits || null
          : prev.previousLogits,
      }));

      options.onSuccess?.();
      updateImageDetails();
    } catch (err) {
      console.error("Inference failed:", err);
      setSegState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }

  async function runSegmentation(): Promise<void> {
    await runInference({
      endpoint: "/scribbleprompt3d_inference",
      storeLogits: true,
    });
  }

  async function sendVoxelPrompt(): Promise<void> {
    if (!voxelPromptText.trim()) return;
    await runInference({
      endpoint: "/voxelprompt",
      extraFields: { text: voxelPromptText },
      onSuccess: () => setVoxelPromptText(""),
      modelName: "voxelprompt",
    });
  }

  // handleClickModeChange only fires on button clicks, so without this
  // the default "positive" mode would keep the drawing layer's pen value (1=red).
  useEffect(() => {
    if (nvRef.current && segState.modelsLoaded) {
      const penValue = segState.clickMode === "positive" ? 2 : 1;
      nvRef.current.setPenValue(penValue, drawingOptions.penFill);
    }
  }, [nvRef, segState.clickMode, segState.modelsLoaded, drawingOptions.penFill]);

  function handleClickModeChange(mode: "positive" | "negative") {
    setSegState((prev) => ({ ...prev, clickMode: mode }));
  }

  function handleResetSession() {
    setSegState((prev) => ({
      ...prev,
      previousLogits: null,
    }));
    if (nvRef.current) {
      nvRef.current.createEmptyDrawing();
    }
  }

  return {
    segState,
    setSegState,
    voxelPromptText,
    setVoxelPromptText,
    uploadVolumeToBackend,
    loadServerVolume,
    initSegModel,
    runSegmentation,
    sendVoxelPrompt,
    handleClickModeChange,
    handleResetSession,
  };
}
