import { useEffect } from "react";
import { useFreeBrowseStore } from "@/store";

const SERVERLESS = import.meta.env.VITE_SERVERLESS === "true";

export function useAiCapabilities() {
  const setAiEnabled = useFreeBrowseStore((s) => s.setAiEnabled);

  useEffect(() => {
    if (SERVERLESS) {
      setAiEnabled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/ai/model/list");
        if (!res.ok) {
          if (!cancelled) setAiEnabled(false);
          return;
        }
        const body = await res.json();
        if (cancelled) return;
        setAiEnabled(Array.isArray(body) && body.length > 0);
      } catch {
        if (!cancelled) setAiEnabled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAiEnabled]);
}
