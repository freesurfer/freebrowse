import { useState, useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import { Niivue, NVImage } from "@niivue/niivue";

type SegModelInfo = {
  name: string;
  path: string;
};

export type SegState = {
  enabled: boolean;
  loading: boolean;
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
      if (drawBitmap[i] === 1) positive.push(i);
      else if (drawBitmap[i] === 2) negative.push(i);
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
  volumeDataBase64?: string;
  affine?: number[];
}): Record<string, unknown> {
  const request: Record<string, unknown> = {
    session_id: params.sessionId,
    model_name: params.modelName,
    positive_clicks: params.positiveClicks,
    negative_clicks: params.negativeClicks,
    previous_logits: params.previousLogits,
    niivue_dims: params.dims,
  };

  if (params.volumeDataBase64) {
    request.volume_data = params.volumeDataBase64;
  }

  if (params.affine) {
    request.affine = params.affine;
  }

  return request;
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function loadMaskAsNVImage(maskBytes: Uint8Array): Promise<NVImage> {
  const maskBlob = new Blob([maskBytes], { type: "application/gzip" });
  const maskFile = new File([maskBlob], "segmentation_mask.nii.gz");

  return await NVImage.loadFromFile({
    file: maskFile,
    colormap: "red",
    opacity: 0.5,
  });
}

function displayMaskOverlay(nv: Niivue, maskImage: NVImage): void {
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
      const isFirstCall = segState.sessionId === null;
      const sessionId = isFirstCall
        ? generateSessionId()
        : segState.sessionId!;

      let volumeDataBase64: string | undefined;
      let affine: number[] | undefined;

      if (isFirstCall) {
        const float32Data = new Float32Array(volume.img);
        volumeDataBase64 = encodeFloat32ArrayToBase64(float32Data);
        affine = getVolumeAffine(volume);
      }

      setSegState((prev) => ({ ...prev, progress: 40 }));

      const clicks = collectClicksFromDrawBitmap(nv.drawBitmap);

      const requestBody = buildInferenceRequest({
        sessionId,
        modelName,
        positiveClicks: clicks.positive,
        negativeClicks: clicks.negative,
        previousLogits: segState.previousLogits,
        dims,
        volumeDataBase64,
        affine,
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
      const maskBytes = decodeBase64ToBytes(result.mask_nifti);
      const maskImage = await loadMaskAsNVImage(maskBytes);
      displayMaskOverlay(nv, maskImage);

      setSegState((prev) => ({
        ...prev,
        loading: false,
        progress: 100,
        previousLogits: options.storeLogits
          ? result.logits || null
          : prev.previousLogits,
        sessionId,
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

  function handleClickModeChange(mode: "positive" | "negative") {
    setSegState((prev) => ({ ...prev, clickMode: mode }));
    if (nvRef.current) {
      const penValue = mode === "positive" ? 1 : 2;
      nvRef.current.setPenValue(penValue, drawingOptions.penFill);
    }
  }

  function handleResetSession() {
    setSegState((prev) => ({
      ...prev,
      previousLogits: null,
      sessionId: null,
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
    initSegModel,
    runSegmentation,
    sendVoxelPrompt,
    handleClickModeChange,
    handleResetSession,
  };
}
