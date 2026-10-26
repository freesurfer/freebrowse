import { useCallback, useEffect } from "react";
import type { NiiVue } from "@niivue/niivue";
import { useFreeBrowseStore } from "@/store";
import {
  requestImagingUploadConfirmation,
  requestSessionDeleteConfirmation,
} from "@/lib/confirmations";
import { gzipUint8Array, uint8ArrayToBase64 } from "@/lib/niivue-helpers";
import type { AiSessionSummary } from "@/store/ai-slice";
import { aiUrl, dataUrl, relativeToDataRoot } from "@/lib/deployment-config";

const SESSION_NAME_RE = /^[A-Za-z0-9_-]+$/;

async function fetchSessionList(): Promise<AiSessionSummary[]> {
  const res = await fetch(aiUrl("session/list"));
  if (!res.ok) throw new Error(`GET /ai/session/list failed: ${res.status}`);
  return res.json();
}

function ensureNiiName(name: string | undefined | null): string {
  if (!name) return "volume.nii.gz";
  if (name.endsWith(".nii.gz") || name.endsWith(".nii")) return name;
  return `${name}.nii.gz`;
}

function stripDataPrefix(url: string): string | null {
  return relativeToDataRoot(url);
}

async function fetchArrayBuffer(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function exportAndUploadDrawing(
  nv: NiiVue,
  sessionName: string,
): Promise<string | null> {
  if (!nv.drawingVolume || nv.volumes.length === 0) return null;
  // saveVolume returns raw bytes only for an empty filename (a `.gz` name
  // downloads instead) — export raw, then gzip to match the old
  // `saveToUint8Array("annotations.nii.gz", drawBitmap)` behavior.
  const raw = await nv.saveVolume({
    filename: "",
    isSaveDrawing: true,
    volumeByIndex: 0,
  });
  if (!(raw instanceof Uint8Array)) return null;
  const bytes = await gzipUint8Array(raw);
  const annotRel = "annotations.nii.gz";
  const targetPath = `ai-sessions/${sessionName}/${annotRel}`;
  const res = await fetch(dataUrl("nii"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: targetPath,
      data: uint8ArrayToBase64(bytes),
    }),
  });
  if (!res.ok)
    throw new Error(
      `annotations upload failed: ${res.status} ${res.statusText}`,
    );
  return annotRel;
}

async function postSetAnnots(
  sessionId: string,
  annotationRelPath: string,
): Promise<void> {
  const res = await fetch(
    aiUrl(`session/${encodeURIComponent(sessionId)}/set_annots`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annotation_path: annotationRelPath }),
    },
  );
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`set_annots failed (${res.status}): ${msg}`);
  }
}

const RESULT_FILENAME = "result.nii.gz";
const AI_RESULT_COLORMAP_NAME = "sky_blue";

const AI_RESULT_COLORMAP = {
  R: [0, 91, 91],
  G: [0, 163, 163],
  B: [0, 201, 201],
  A: [0, 64, 128],
  I: [0, 128, 255],
};

const AI_PROMPT_COLORMAP = {
  R: [0, 0, 255],
  G: [0, 255, 0],
  B: [0, 0, 0],
  A: [0, 255, 255],
  I: [0, 1, 2],
  labels: ["background", "positive", "negative"],
};

export function useAiSession(nvRef: React.RefObject<NiiVue | null>) {
  const aiEnabled = useFreeBrowseStore((s) => s.aiEnabled);
  const setAiSessions = useFreeBrowseStore((s) => s.setAiSessions);
  const setAiActiveSession = useFreeBrowseStore((s) => s.setAiActiveSession);
  const aiActiveSession = useFreeBrowseStore((s) => s.aiActiveSession);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);
  const setShowUploader = useFreeBrowseStore((s) => s.setShowUploader);
  const incrementVolumeVersion = useFreeBrowseStore(
    (s) => s.incrementVolumeVersion,
  );

  const refreshSessions = useCallback(async () => {
    try {
      const sessions = await fetchSessionList();
      setAiSessions(sessions);
    } catch (err) {
      console.error("Failed to refresh AI sessions:", err);
    }
  }, [setAiSessions]);

  useEffect(() => {
    if (aiEnabled) void refreshSessions();
  }, [aiEnabled, refreshSessions]);

  const enterDrawMode = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    const penValue = drawingOptions.penValue === 2 ? 2 : 1;
    // Create the prompt drawing layer (niivue-mono no longer auto-creates it),
    // register + select the prompt colormap (index 1 = positive/green,
    // 2 = negative/red), and set pen defaults. Pen stays disabled until the
    // user picks + Positive / − Negative (the AI tab routes those through
    // use-drawing's handleDrawModeChange, which enables the pen).
    if (!nv.drawingVolume) nv.createEmptyDrawing();
    nv.addColormap("ai_prompt", AI_PROMPT_COLORMAP);
    nv.drawColormap = "ai_prompt";
    nv.drawPenValue = penValue;
    nv.drawOpacity = 1.0;
    nv.drawIsEnabled = false;
    setDrawingOptions((prev) => ({
      ...prev,
      enabled: true,
      mode: "none",
      opacity: 1.0,
      penValue,
    }));
    setActiveTab("aiAnnotation");
  }, [
    nvRef,
    drawingOptions.penValue,
    setDrawingOptions,
    setActiveTab,
  ]);

  const exitDrawModeLocal = useCallback(() => {
    const nv = nvRef.current;
    if (nv) {
      // Disable the pen and destroy the drawing layer (clickToSegment is gone in
      // niivue-mono). closeDrawing -> drawingChanged 'close' -> adapter enabled=false.
      nv.drawIsEnabled = false;
      nv.closeDrawing();
    }
    setDrawingOptions((prev) => ({ ...prev, enabled: false, mode: "none" }));
    setAiActiveSession(null);
    incrementVolumeVersion();
  }, [nvRef, setDrawingOptions, setAiActiveSession, incrementVolumeVersion]);

  const handleNewSession = useCallback(
    async (sessionName: string): Promise<void> => {
      const trimmed = sessionName.trim();
      if (!trimmed) throw new Error("Session name is required");
      if (!SESSION_NAME_RE.test(trimmed))
        throw new Error(
          "Session name may only contain letters, digits, underscores, and hyphens",
        );

      const nv = nvRef.current;
      if (!nv || nv.volumes.length === 0)
        throw new Error("Load a volume before creating a session");

      const volume = nv.volumes[0];
      const backendRelPath =
        typeof volume.url === "string" ? stripDataPrefix(volume.url) : null;
      const needsUpload = !backendRelPath;

      if (needsUpload) {
        const ok = await requestImagingUploadConfirmation();
        if (!ok) throw new Error("Upload cancelled");
      }

      const newRes = await fetch(aiUrl("session/new"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_name: trimmed }),
      });
      if (!newRes.ok) {
        const msg = await newRes.text();
        throw new Error(`Create session failed (${newRes.status}): ${msg}`);
      }
      const { session_id, session_name } = await newRes.json();

      let volumePathForSetVolume: string;
      if (needsUpload) {
        const basename = ensureNiiName(volume.name);
        const targetPath = `ai-sessions/${trimmed}/${basename}`;
        // Export the loaded volume's voxels (raw) and gzip for a .nii.gz upload
        // (was volume.saveToUint8Array(basename)).
        const raw = await nv.saveVolume({ filename: "", volumeByIndex: 0 });
        const uint8Array =
          raw instanceof Uint8Array
            ? await gzipUint8Array(raw)
            : new Uint8Array();
        const base64Data = uint8ArrayToBase64(uint8Array);

        const uploadRes = await fetch(dataUrl("nii"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: targetPath, data: base64Data }),
        });
        if (!uploadRes.ok)
          throw new Error(
            `Volume upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
          );

        volumePathForSetVolume = targetPath;
      } else {
        volumePathForSetVolume = backendRelPath;
      }

      const setVolRes = await fetch(
        aiUrl(`session/${encodeURIComponent(session_id)}/set_volume`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ volume_path: volumePathForSetVolume }),
        },
      );
      if (!setVolRes.ok) {
        const msg = await setVolRes.text();
        throw new Error(`set_volume failed (${setVolRes.status}): ${msg}`);
      }

      setAiActiveSession({ session_id, session_name });
      enterDrawMode();
      await refreshSessions();
    },
    [nvRef, setAiActiveSession, enterDrawMode, refreshSessions],
  );

  const handleLoadSession = useCallback(
    async (sessionId: string): Promise<void> => {
      const nv = nvRef.current;
      if (!nv) throw new Error("Viewer not ready");

      const summary = useFreeBrowseStore
        .getState()
        .aiSessions.find((s) => s.session_id === sessionId);
      if (!summary) throw new Error(`Unknown session: ${sessionId}`);
      if (!summary.volume_path)
        throw new Error("Session has no volume set; cannot load");

      const volumeUrl =
        summary.volume_path_root === "session"
          ? dataUrl(`ai-sessions/${summary.session_name}/${summary.volume_path}`)
          : dataUrl(summary.volume_path);

      // Ensure the niivue canvas is mounted + attached (first-load-in-session path).
      // Same trick use-file-loading.ts:196 uses before addVolumeFromUrl.
      setShowUploader(false);

      // Atomic scene swap — niivue manages the teardown internally.
      await nv.loadVolumes([{ url: volumeUrl }]);
      incrementVolumeVersion();

      if (summary.annotation_path) {
        try {
          const annotUrl = dataUrl(
            `ai-sessions/${summary.session_name}/${summary.annotation_path}`,
          );
          const bytes = await fetchArrayBuffer(annotUrl);
          // Load the annotation mask as the drawing layer. loadDrawing takes a
          // File|string and gunzips by the .gz name; it hard-requires uint8
          // (annotation masks are uint8). (was niftiArray2NVImage + loadDrawing.)
          const file = new File([bytes], summary.annotation_path);
          const ok = await nv.loadDrawing(file);
          if (!ok)
            console.warn(
              "loadDrawing returned false — annotation dimensions may not match the volume",
            );
        } catch (err) {
          console.error("Failed to load existing annotations:", err);
        }
      }

      setAiActiveSession({
        session_id: summary.session_id,
        session_name: summary.session_name,
      });
      enterDrawMode();
    },
    [
      nvRef,
      setShowUploader,
      incrementVolumeVersion,
      setAiActiveSession,
      enterDrawMode,
    ],
  );

  const handleRunSegmentation = useCallback(
    async (mlId: string, labelValue: number): Promise<void> => {
      const nv = nvRef.current;
      const active = useFreeBrowseStore.getState().aiActiveSession;
      if (!nv || !active || nv.volumes.length === 0)
        throw new Error("No active session or volume");

      const annotRel = await exportAndUploadDrawing(nv, active.session_name);
      if (!annotRel) throw new Error("No drawing layer to send as annotations");

      await postSetAnnots(active.session_id, annotRel);

      const inferRes = await fetch(
        aiUrl(
          `session/${encodeURIComponent(active.session_id)}/infer/${encodeURIComponent(mlId)}`,
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label_value: labelValue }),
        },
      );
      if (!inferRes.ok) {
        const msg = await inferRes.text();
        throw new Error(`inference failed (${inferRes.status}): ${msg}`);
      }
      await inferRes.json();

      // Replace any prior result overlay before loading the fresh one.
      const lastIdx = nv.volumes.length - 1;
      if (lastIdx > 0) {
        const last = nv.volumes[lastIdx];
        const lastName = typeof last?.name === "string" ? last.name : "";
        const lastUrl = typeof last?.url === "string" ? last.url : "";
        if (
          lastName === RESULT_FILENAME ||
          lastUrl.includes(`/${RESULT_FILENAME}`)
        ) {
          await nv.removeVolume(lastIdx); // was removeVolumeByIndex
        }
      }

      const resultUrl =
        dataUrl(`ai-sessions/${active.session_name}/${RESULT_FILENAME}`) +
        `?t=${Date.now()}`;
      nv.addColormap(AI_RESULT_COLORMAP_NAME, AI_RESULT_COLORMAP);
      await nv.addVolume({
        url: resultUrl,
        name: RESULT_FILENAME,
        colormap: AI_RESULT_COLORMAP_NAME,
        opacity: 0.5,
      });
      incrementVolumeVersion();
    },
    [nvRef, incrementVolumeVersion],
  );

  const handleExitAndSaveSession = useCallback(async (): Promise<void> => {
    const nv = nvRef.current;
    const active = useFreeBrowseStore.getState().aiActiveSession;
    if (nv && active) {
      try {
        const annotRel = await exportAndUploadDrawing(nv, active.session_name);
        if (annotRel) await postSetAnnots(active.session_id, annotRel);
      } catch (err) {
        console.error("Failed to save annotations on exit:", err);
      }
    }
    exitDrawModeLocal();
  }, [nvRef, exitDrawModeLocal]);

  const handleExitAndDeleteSession = useCallback(async (): Promise<void> => {
    if (!aiActiveSession) return;
    const ok = await requestSessionDeleteConfirmation();
    if (!ok) return;

    const id = aiActiveSession.session_id;
    try {
      const res = await fetch(aiUrl(`session/${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = await res.text();
        console.error(`DELETE session failed (${res.status}): ${msg}`);
      }
    } catch (err) {
      console.error("DELETE session error:", err);
    }

    exitDrawModeLocal();
    await refreshSessions();
  }, [aiActiveSession, exitDrawModeLocal, refreshSessions]);

  return {
    refreshSessions,
    handleNewSession,
    handleLoadSession,
    handleRunSegmentation,
    handleExitAndSaveSession,
    handleExitAndDeleteSession,
  };
}
