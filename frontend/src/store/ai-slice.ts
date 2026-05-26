import type { StateCreator } from "zustand";

export type AiSessionSummary = {
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

export type AiActiveSession = {
  session_id: string;
  session_name: string;
};

export interface AiSlice {
  aiEnabled: boolean | null;
  aiSessions: AiSessionSummary[];
  aiActiveSession: AiActiveSession | null;
  setAiEnabled: (enabled: boolean | null) => void;
  setAiSessions: (sessions: AiSessionSummary[]) => void;
  setAiActiveSession: (session: AiActiveSession | null) => void;
}

export const createAiSlice: StateCreator<AiSlice> = (set) => ({
  aiEnabled: null,
  aiSessions: [],
  aiActiveSession: null,
  setAiEnabled: (aiEnabled) => set({ aiEnabled }),
  setAiSessions: (aiSessions) => set({ aiSessions }),
  setAiActiveSession: (aiActiveSession) => set({ aiActiveSession }),
});
