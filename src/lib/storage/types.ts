export interface ToolExecution {
  id: string;
  toolId: string;
  timestamp: number;
  title: string; // Auto-generated or user-set
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  settings: Record<string, any>;
  model?: string;
  duration?: number;
}

export interface UserPreferences {
  defaultModel: string;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  toolSettings: Record<string, any>;
}

export interface UserData {
  apiKey: string;
  preferences: UserPreferences;
  toolExecutions: ToolExecution[];
  activeExecutions: Record<string, string>; // toolId -> executionId
}

export interface StorageHook<T> {
  data: T;
  updateData: (updater: (prev: T) => T) => void;
  resetData: () => void;
  isLoaded: boolean;
}

// Tool-specific data structures
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface ChatExecution extends ToolExecution {
  inputs: {
    messages: ChatMessage[];
  };
  outputs: {
    messages: ChatMessage[];
  };
}

export interface RegexExecution extends ToolExecution {
  inputs: {
    description: string;
    testText?: string;
  };
  outputs: {
    javascript: string;
    pcre: string;
    explanation: string;
    matches?: string[];
  };
}

export interface SummaryExecution extends ToolExecution {
  inputs: {
    text: string;
    summaryType: string;
  };
  outputs: {
    summary: string;
  };
}
