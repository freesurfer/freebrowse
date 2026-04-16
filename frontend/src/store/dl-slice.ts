import type { StateCreator } from "zustand";

export type DlSessionSummary = {
  session_id: string;
  session_name: string;
  created_at: string;
  volume_path: string | null;
  volume_path_root: "data" | "session" | null;
  annotation_path: string | null;
  result_path: string | null;
  last_inference_ml_id: string | null;
  last_inference_at: string | null;
};

export type DlActiveSession = {
  session_id: string;
  session_name: string;
};

export interface DlSlice {
  dlEnabled: boolean | null;
  dlSessions: DlSessionSummary[];
  dlActiveSession: DlActiveSession | null;
  setDlEnabled: (enabled: boolean | null) => void;
  setDlSessions: (sessions: DlSessionSummary[]) => void;
  setDlActiveSession: (session: DlActiveSession | null) => void;
}

export const createDlSlice: StateCreator<DlSlice> = (set) => ({
  dlEnabled: null,
  dlSessions: [],
  dlActiveSession: null,
  setDlEnabled: (dlEnabled) => set({ dlEnabled }),
  setDlSessions: (dlSessions) => set({ dlSessions }),
  setDlActiveSession: (dlActiveSession) => set({ dlActiveSession }),
});
