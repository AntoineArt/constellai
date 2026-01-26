export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  createdAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64 or data URL
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface UserPreferences {
  defaultModel: string;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  voiceEnabled: boolean;
  voiceLanguage: string;
  autoSpeak: boolean;
}

export interface StorageHook<T> {
  data: T;
  updateData: (updater: (prev: T) => T) => void;
  resetData: () => void;
  isLoaded: boolean;
}
