import {
  getDefaultFreeBrowseStore,
  type FreeBrowseStoreApi,
} from "@/store";

interface PendingConfirmations {
  imagingUpload: ((ok: boolean) => void) | null;
  sessionDelete: ((ok: boolean) => void) | null;
}

const pendingByStore = new WeakMap<FreeBrowseStoreApi, PendingConfirmations>();

function getPending(storeApi: FreeBrowseStoreApi): PendingConfirmations {
  let pending = pendingByStore.get(storeApi);
  if (!pending) {
    pending = { imagingUpload: null, sessionDelete: null };
    pendingByStore.set(storeApi, pending);
  }
  return pending;
}

export function requestImagingUploadConfirmation(
  storeApi: FreeBrowseStoreApi = getDefaultFreeBrowseStore(),
): Promise<boolean> {
  const state = storeApi.getState();
  if (state.skipImagingUploadConfirmation) return Promise.resolve(true);
  const pending = getPending(storeApi);
  if (pending.imagingUpload) {
    pending.imagingUpload(false);
    pending.imagingUpload = null;
  }
  return new Promise<boolean>((resolve) => {
    pending.imagingUpload = resolve;
    state.setImagingUploadConfirmDialogOpen(true);
  });
}

export function resolveImagingUploadConfirmation(
  ok: boolean,
  storeApi: FreeBrowseStoreApi = getDefaultFreeBrowseStore(),
): void {
  storeApi.getState().setImagingUploadConfirmDialogOpen(false);
  const pending = getPending(storeApi);
  const resolver = pending.imagingUpload;
  pending.imagingUpload = null;
  if (resolver) resolver(ok);
}

export function requestSessionDeleteConfirmation(
  storeApi: FreeBrowseStoreApi = getDefaultFreeBrowseStore(),
): Promise<boolean> {
  const state = storeApi.getState();
  if (state.skipSessionDeleteConfirmation) return Promise.resolve(true);
  const pending = getPending(storeApi);
  if (pending.sessionDelete) {
    pending.sessionDelete(false);
    pending.sessionDelete = null;
  }
  return new Promise<boolean>((resolve) => {
    pending.sessionDelete = resolve;
    state.setSessionDeleteConfirmDialogOpen(true);
  });
}

export function resolveSessionDeleteConfirmation(
  ok: boolean,
  storeApi: FreeBrowseStoreApi = getDefaultFreeBrowseStore(),
): void {
  storeApi.getState().setSessionDeleteConfirmDialogOpen(false);
  const pending = getPending(storeApi);
  const resolver = pending.sessionDelete;
  pending.sessionDelete = null;
  if (resolver) resolver(ok);
}

/** Reject/cancel any unsettled confirmation dialogs for `storeApi` on teardown. */
export function clearPendingConfirmations(storeApi: FreeBrowseStoreApi): void {
  const pending = pendingByStore.get(storeApi);
  if (!pending) return;
  pendingByStore.delete(storeApi);
  if (pending.imagingUpload) {
    pending.imagingUpload(false);
    pending.imagingUpload = null;
  }
  if (pending.sessionDelete) {
    pending.sessionDelete(false);
    pending.sessionDelete = null;
  }
}
