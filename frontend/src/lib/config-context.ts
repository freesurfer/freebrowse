import { createContext, useContext } from "react";
import {
  getFreeBrowseConfig,
  type FreeBrowseConfig,
} from "@/lib/deployment-config";

/**
 * Per-instance deployment configuration context.
 *
 * When `null` (standalone app or React components rendered without a provider),
 * `useFreeBrowseConfig()` falls back to the module-level `getFreeBrowseConfig()`.
 */
export const FreeBrowseConfigContext =
  createContext<Readonly<FreeBrowseConfig> | null>(null);

export function useFreeBrowseConfig(): Readonly<FreeBrowseConfig> {
  return useContext(FreeBrowseConfigContext) ?? getFreeBrowseConfig();
}
