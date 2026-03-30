import type { Niivue } from "@niivue/niivue";
import { useFreeBrowseStore } from "@/store";

/**
 * Ensure the Niivue instance has a live WebGL context.
 *
 * When `showUploader` is true the canvas is unmounted, so there is no GL
 * context. This helper flips the flag, waits for React to mount the canvas
 * and for `attachToCanvas` to create the context, then resolves.
 *
 * If the canvas is already mounted this is a no-op.
 */
export async function ensureGLContext(nv: Niivue): Promise<void> {
  const store = useFreeBrowseStore.getState();
  if (!store.showUploader) return;

  store.setShowUploader(false);

  // Poll until nv.gl is available (canvas mounted & attached).
  // nv.gl is a getter that throws when _gl is null, so use try-catch.
  await new Promise<void>((resolve, reject) => {
    const maxWait = 3000;
    const interval = 50;
    let elapsed = 0;
    const check = () => {
      try {
        if (nv.gl) {
          resolve();
          return;
        }
      } catch {
        // _gl not yet set -- canvas hasn't attached
      }
      if (elapsed >= maxWait) {
        reject(new Error("Canvas failed to mount within 3s"));
      } else {
        elapsed += interval;
        setTimeout(check, interval);
      }
    };
    check();
  });
}
