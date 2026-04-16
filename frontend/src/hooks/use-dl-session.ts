import { useCallback, useEffect } from "react";
import type { Niivue } from "@niivue/niivue";
import { useFreeBrowseStore } from "@/store";
import {
  requestImagingUploadConfirmation,
  requestSessionDeleteConfirmation,
} from "@/lib/confirmations";
import { uint8ArrayToBase64 } from "@/lib/niivue-helpers";
import type { DlSessionSummary } from "@/store/dl-slice";

const SESSION_NAME_RE = /^[A-Za-z0-9_-]+$/;

async function fetchSessionList(): Promise<DlSessionSummary[]> {
  const res = await fetch("/dl/session/list");
  if (!res.ok) throw new Error(`GET /dl/session/list failed: ${res.status}`);
  return res.json();
}

function ensureNiiName(name: string | undefined | null): string {
  if (!name) return "volume.nii.gz";
  if (name.endsWith(".nii.gz") || name.endsWith(".nii")) return name;
  return `${name}.nii.gz`;
}

function stripDataPrefix(url: string): string | null {
  if (url.startsWith("/data/")) return url.slice("/data/".length);
  if (url.startsWith("data/")) return url.slice("data/".length);
  return null;
}

async function fetchArrayBuffer(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export function useDlSession(nvRef: React.RefObject<Niivue | null>) {
  const dlEnabled = useFreeBrowseStore((s) => s.dlEnabled);
  const setDlSessions = useFreeBrowseStore((s) => s.setDlSessions);
  const setDlActiveSession = useFreeBrowseStore((s) => s.setDlActiveSession);
  const dlActiveSession = useFreeBrowseStore((s) => s.dlActiveSession);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);
  const incrementVolumeVersion = useFreeBrowseStore(
    (s) => s.incrementVolumeVersion,
  );

  const refreshSessions = useCallback(async () => {
    try {
      const sessions = await fetchSessionList();
      setDlSessions(sessions);
    } catch (err) {
      console.error("Failed to refresh DL sessions:", err);
    }
  }, [setDlSessions]);

  useEffect(() => {
    if (dlEnabled) void refreshSessions();
  }, [dlEnabled, refreshSessions]);

  const enterDrawMode = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    nv.setDrawingEnabled(false);
    const penValue = drawingOptions.penValue === 2 ? 2 : 1;
    nv.setPenValue(penValue, drawingOptions.penFill);
    nv.setDrawOpacity(1.0);
    setDrawingOptions((prev) => ({
      ...prev,
      enabled: true,
      mode: "none",
      opacity: 1.0,
      penValue,
    }));
    setActiveTab("dlAnnotation");
  }, [nvRef, drawingOptions.penValue, drawingOptions.penFill, setDrawingOptions, setActiveTab]);

  const exitDrawModeLocal = useCallback(() => {
    const nv = nvRef.current;
    if (nv) {
      nv.setDrawingEnabled(false);
      nv.opts.clickToSegment = false;
      nv.closeDrawing();
    }
    setDrawingOptions((prev) => ({ ...prev, enabled: false, mode: "none" }));
    setDlActiveSession(null);
    incrementVolumeVersion();
  }, [nvRef, setDrawingOptions, setDlActiveSession, incrementVolumeVersion]);

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

      const newRes = await fetch("/dl/session/new", {
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
        const targetPath = `dl-sessions/${trimmed}/${basename}`;
        const uint8Array = await volume.saveToUint8Array(basename);
        const base64Data = uint8ArrayToBase64(uint8Array);

        const uploadRes = await fetch("/data/nii", {
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
        `/dl/session/${encodeURIComponent(session_id)}/set_volume`,
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

      setDlActiveSession({ session_id, session_name });
      enterDrawMode();
      await refreshSessions();
    },
    [nvRef, setDlActiveSession, enterDrawMode, refreshSessions],
  );

  const clearAllVolumes = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    while (nv.volumes.length > 0) {
      nv.removeVolumeByIndex(0);
    }
  }, [nvRef]);

  const handleLoadSession = useCallback(
    async (sessionId: string): Promise<void> => {
      const nv = nvRef.current;
      if (!nv) throw new Error("Viewer not ready");

      const summary = useFreeBrowseStore
        .getState()
        .dlSessions.find((s) => s.session_id === sessionId);
      if (!summary) throw new Error(`Unknown session: ${sessionId}`);
      if (!summary.volume_path)
        throw new Error("Session has no volume set; cannot load");

      nv.closeDrawing();
      clearAllVolumes();

      const volumeUrl =
        summary.volume_path_root === "session"
          ? `/data/dl-sessions/${summary.session_name}/${summary.volume_path}`
          : `/data/${summary.volume_path}`;

      await nv.addVolumeFromUrl({ url: volumeUrl });
      incrementVolumeVersion();

      if (summary.annotation_path) {
        try {
          const annotUrl = `/data/dl-sessions/${summary.session_name}/${summary.annotation_path}`;
          const bytes = await fetchArrayBuffer(annotUrl);
          const nvimage = await nv.niftiArray2NVImage(bytes);
          const ok = nv.loadDrawing(nvimage);
          if (!ok)
            console.warn(
              "loadDrawing returned false \u2014 annotation dimensions may not match the volume",
            );
        } catch (err) {
          console.error("Failed to load existing annotations:", err);
        }
      }

      setDlActiveSession({
        session_id: summary.session_id,
        session_name: summary.session_name,
      });
      enterDrawMode();
    },
    [nvRef, clearAllVolumes, incrementVolumeVersion, setDlActiveSession, enterDrawMode],
  );

  const handleExitAndSaveSession = useCallback((): void => {
    exitDrawModeLocal();
  }, [exitDrawModeLocal]);

  const handleExitAndDeleteSession = useCallback(async (): Promise<void> => {
    if (!dlActiveSession) return;
    const ok = await requestSessionDeleteConfirmation();
    if (!ok) return;

    const id = dlActiveSession.session_id;
    try {
      const res = await fetch(`/dl/session/${encodeURIComponent(id)}`, {
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
  }, [dlActiveSession, exitDrawModeLocal, refreshSessions]);

  return {
    refreshSessions,
    handleNewSession,
    handleLoadSession,
    handleExitAndSaveSession,
    handleExitAndDeleteSession,
  };
}
