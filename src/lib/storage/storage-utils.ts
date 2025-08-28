import type { UserData, UserPreferences, ToolExecution } from "./types";
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from "./storage-keys";

// Safe localStorage operations with fallback to memory
class SafeStorage {
  private memoryStorage = new Map<string, string>();
  private useLocalStorage = true;

  constructor() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
      } else {
        this.useLocalStorage = false;
      }
    } catch {
      this.useLocalStorage = false;
    }
  }

  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch {
        // Fallback to memory storage
      }
    }
    return this.memoryStorage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.delete(key);
  }
}

const storage = new SafeStorage();

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const stored = storage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.warn(`Failed to parse stored data for key ${key}:`, error);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to store data for key ${key}:`, error);
  }
}

export function removeStoredData(key: string): void {
  storage.removeItem(key);
}

// Generate unique IDs for executions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all tool executions for a specific tool
export function getToolExecutions(toolId: string): ToolExecution[] {
  const allExecutions = getStoredData<ToolExecution[]>(
    STORAGE_KEYS.TOOL_EXECUTIONS,
    []
  );
  return allExecutions
    .filter((execution) => execution.toolId === toolId)
    .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
}

// Save a tool execution
export function saveToolExecution(execution: ToolExecution): void {
  const allExecutions = getStoredData<ToolExecution[]>(
    STORAGE_KEYS.TOOL_EXECUTIONS,
    []
  );
  const existingIndex = allExecutions.findIndex((e) => e.id === execution.id);

  if (existingIndex >= 0) {
    allExecutions[existingIndex] = execution;
  } else {
    allExecutions.push(execution);
  }

  setStoredData(STORAGE_KEYS.TOOL_EXECUTIONS, allExecutions);
}

// Delete a tool execution
export function deleteToolExecution(executionId: string): void {
  const allExecutions = getStoredData<ToolExecution[]>(
    STORAGE_KEYS.TOOL_EXECUTIONS,
    []
  );
  const filtered = allExecutions.filter((e) => e.id !== executionId);
  setStoredData(STORAGE_KEYS.TOOL_EXECUTIONS, filtered);
}

// Get active execution ID for a tool
export function getActiveExecutionId(toolId: string): string | null {
  const activeExecutions = getStoredData<Record<string, string>>(
    STORAGE_KEYS.ACTIVE_EXECUTIONS,
    {}
  );
  return activeExecutions[toolId] || null;
}

// Set active execution for a tool
export function setActiveExecutionId(
  toolId: string,
  executionId: string | null
): void {
  const activeExecutions = getStoredData<Record<string, string>>(
    STORAGE_KEYS.ACTIVE_EXECUTIONS,
    {}
  );

  if (executionId) {
    activeExecutions[toolId] = executionId;
  } else {
    delete activeExecutions[toolId];
  }

  setStoredData(STORAGE_KEYS.ACTIVE_EXECUTIONS, activeExecutions);
}

// Get user preferences
export function getUserPreferences(): UserPreferences {
  return getStoredData<UserPreferences>(
    STORAGE_KEYS.PREFERENCES,
    DEFAULT_PREFERENCES
  );
}

// Save user preferences
export function saveUserPreferences(preferences: UserPreferences): void {
  setStoredData(STORAGE_KEYS.PREFERENCES, preferences);
}

// Get pinned tools
export function getPinnedTools(): string[] {
  return getStoredData<string[]>(STORAGE_KEYS.PINNED_TOOLS, ["chat"]); // Chat is pinned by default
}

// Save pinned tools
export function savePinnedTools(pinnedTools: string[]): void {
  setStoredData(STORAGE_KEYS.PINNED_TOOLS, pinnedTools);
}

// Pin a tool
export function pinTool(toolId: string): void {
  const currentPinned = getPinnedTools();
  if (!currentPinned.includes(toolId)) {
    savePinnedTools([...currentPinned, toolId]);
  }
}

// Unpin a tool
export function unpinTool(toolId: string): void {
  const currentPinned = getPinnedTools();
  savePinnedTools(currentPinned.filter((id) => id !== toolId));
}

// Check if a tool is pinned
export function isToolPinned(toolId: string): boolean {
  return getPinnedTools().includes(toolId);
}

// Generate automatic titles for executions using AI
export async function generateExecutionTitle(
  toolId: string,
  inputs: Record<string, any>,
  apiKey?: string
): Promise<string> {
  const timestamp = new Date().toLocaleString();

  // Fallback function for when AI generation fails or no API key
  const getFallbackTitle = () => {
    switch (toolId) {
      case "chat":
        const messages = inputs.messages as any[];
        const firstUserMessage = messages?.find(
          (m) => m.role === "user"
        )?.content;
        if (firstUserMessage) {
          return (
            firstUserMessage.slice(0, 50) +
            (firstUserMessage.length > 50 ? "..." : "")
          );
        }
        return `Chat ${timestamp}`;

      case "regex":
        const description = inputs.description as string;
        return (
          description?.slice(0, 50) + (description?.length > 50 ? "..." : "") ||
          `Regex ${timestamp}`
        );

      case "summarizer":
        const text = inputs.text as string;
        const preview = text?.slice(0, 30) + (text?.length > 30 ? "..." : "");
        return `Summary: ${preview}` || `Summary ${timestamp}`;

      default:
        return `${toolId} ${timestamp}`;
    }
  };

  // If no API key available, use fallback
  if (!apiKey) {
    return getFallbackTitle();
  }

  try {
    const response = await fetch("/api/generate-title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        toolId,
        inputs,
      }),
    });

    if (!response.ok) {
      console.warn("Title generation failed, using fallback");
      return getFallbackTitle();
    }

    const result = await response.json();
    return result.title || getFallbackTitle();
  } catch (error) {
    console.warn("Title generation error, using fallback:", error);
    return getFallbackTitle();
  }
}

// Generate simple temporary titles for new executions
export function generateTempTitle(toolId: string): string {
  switch (toolId) {
    case "chat":
      return "New Chat";
    case "regex":
      return "New Regex";
    case "summarizer":
      return "New Summary";
    default:
      return `New ${toolId}`;
  }
}

// Check if execution has meaningful content for AI title generation
export function hasContentForAITitle(
  toolId: string,
  inputs: Record<string, any>,
  outputs?: Record<string, any>
): boolean {
  switch (toolId) {
    case "chat":
      const messages = inputs.messages as any[];
      return (
        messages &&
        messages.length > 0 &&
        messages.some((m) => m.role === "user" && m.content?.trim())
      );
    case "regex":
      const description = inputs.description as string;
      return description && description.trim().length > 0;
    case "summarizer":
      const text = inputs.text as string;
      return (
        (text && text.trim().length > 0) ||
        (outputs?.summary && outputs.summary.length > 0)
      );
    default:
      return Object.keys(inputs).some(
        (key) =>
          inputs[key] &&
          typeof inputs[key] === "string" &&
          inputs[key].trim().length > 0
      );
  }
}

// Synchronous version for immediate use (fallback when no content available)
export function generateExecutionTitleSync(
  toolId: string,
  inputs: Record<string, any>
): string {
  const timestamp = new Date().toLocaleString();

  switch (toolId) {
    case "chat":
      const messages = inputs.messages as any[];
      const firstUserMessage = messages?.find(
        (m) => m.role === "user"
      )?.content;
      if (firstUserMessage) {
        return (
          firstUserMessage.slice(0, 50) +
          (firstUserMessage.length > 50 ? "..." : "")
        );
      }
      return `Chat ${timestamp}`;

    case "regex":
      const description = inputs.description as string;
      return (
        description?.slice(0, 50) + (description?.length > 50 ? "..." : "") ||
        `Regex ${timestamp}`
      );

    case "summarizer":
      const text = inputs.text as string;
      const preview = text?.slice(0, 30) + (text?.length > 30 ? "..." : "");
      return `Summary: ${preview}` || `Summary ${timestamp}`;

    default:
      return `${toolId} ${timestamp}`;
  }
}
