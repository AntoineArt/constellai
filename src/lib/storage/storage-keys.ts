import { DEFAULT_MODEL_ID } from "../models";

export const STORAGE_KEYS = {
  API_KEY: "api-key",
  PREFERENCES: "preferences",
  CONVERSATIONS: "conversations",
  ACTIVE_CONVERSATION: "active-conversation",
} as const;

export const DEFAULT_PREFERENCES = {
  defaultModel: DEFAULT_MODEL_ID,
  theme: "system" as const,
  sidebarCollapsed: false,
  voiceEnabled: false,
  voiceLanguage: "en-US",
  autoSpeak: false,
};
