import { useEffect } from "react";
import { useFreeBrowseStore } from "@/store";
import { aiUrl, deploymentConfig } from "@/lib/deployment-config";

export function useAiCapabilities() {
  const setAiEnabled = useFreeBrowseStore((s) => s.setAiEnabled);

  useEffect(() => {
    if (deploymentConfig.serverless) {
      setAiEnabled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(aiUrl("model/list"));
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
