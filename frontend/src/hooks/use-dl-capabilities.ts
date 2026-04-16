import { useEffect } from "react";
import { useFreeBrowseStore } from "@/store";

const SERVERLESS = import.meta.env.VITE_SERVERLESS === "true";

export function useDlCapabilities() {
  const setDlEnabled = useFreeBrowseStore((s) => s.setDlEnabled);

  useEffect(() => {
    if (SERVERLESS) {
      setDlEnabled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/dl/model/list");
        if (!res.ok) {
          if (!cancelled) setDlEnabled(false);
          return;
        }
        const body = await res.json();
        if (cancelled) return;
        setDlEnabled(Array.isArray(body) && body.length > 0);
      } catch {
        if (!cancelled) setDlEnabled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setDlEnabled]);
}
