import { useEffect } from "react";
import { useFreeBrowseStore } from "@/store";
import { aiUrlFrom } from "@/lib/deployment-config";
import { useFreeBrowseConfig } from "@/lib/config-context";

export function useAiCapabilities() {
  const config = useFreeBrowseConfig();
  const setAiEnabled = useFreeBrowseStore((s) => s.setAiEnabled);

  useEffect(() => {
    if (config.backend === null) {
      setAiEnabled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(aiUrlFrom(config, "model/list"));
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
  }, [config, setAiEnabled]);
}
