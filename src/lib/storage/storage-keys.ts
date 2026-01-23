export const STORAGE_KEYS = {
  API_KEY: "api-key",
  PREFERENCES: "preferences",
  TOOL_EXECUTIONS: "tool-executions",
  ACTIVE_EXECUTIONS: "active-executions",
  PINNED_TOOLS: "pinned-tools",
} as const;

export const TOOL_IDS = {
  CHAT: "chat",
} as const;

import { DEFAULT_MODEL_ID } from "../models";

export const DEFAULT_PREFERENCES = {
  defaultModel: DEFAULT_MODEL_ID,
  theme: "system" as const,
  sidebarCollapsed: false,
  toolSettings: {},
};
