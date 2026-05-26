import { useFreeBrowseStore } from "@/store";

let pendingImagingUpload: ((ok: boolean) => void) | null = null;
let pendingSessionDelete: ((ok: boolean) => void) | null = null;

export function requestImagingUploadConfirmation(): Promise<boolean> {
  const state = useFreeBrowseStore.getState();
  if (state.skipImagingUploadConfirmation) return Promise.resolve(true);
  if (pendingImagingUpload) {
    pendingImagingUpload(false);
    pendingImagingUpload = null;
  }
  return new Promise<boolean>((resolve) => {
    pendingImagingUpload = resolve;
    state.setImagingUploadConfirmDialogOpen(true);
  });
}

export function resolveImagingUploadConfirmation(ok: boolean): void {
  useFreeBrowseStore.getState().setImagingUploadConfirmDialogOpen(false);
  const resolver = pendingImagingUpload;
  pendingImagingUpload = null;
  if (resolver) resolver(ok);
}

export function requestSessionDeleteConfirmation(): Promise<boolean> {
  const state = useFreeBrowseStore.getState();
  if (state.skipSessionDeleteConfirmation) return Promise.resolve(true);
  if (pendingSessionDelete) {
    pendingSessionDelete(false);
    pendingSessionDelete = null;
  }
  return new Promise<boolean>((resolve) => {
    pendingSessionDelete = resolve;
    state.setSessionDeleteConfirmDialogOpen(true);
  });
}

export function resolveSessionDeleteConfirmation(ok: boolean): void {
  useFreeBrowseStore.getState().setSessionDeleteConfirmDialogOpen(false);
  const resolver = pendingSessionDelete;
  pendingSessionDelete = null;
  if (resolver) resolver(ok);
}
