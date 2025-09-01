import { useCallback } from "react";

export interface ToolExecution {
  id: string;
  timestamp: number;
  inputs: Record<string, any>;
  output: string;
}

export function useToolHistory(toolId: string) {
  const getHistory = useCallback((): ToolExecution[] => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(`tool-history-${toolId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading tool history:", error);
      return [];
    }
  }, [toolId]);

  const addToHistory = useCallback(
    (execution: Omit<ToolExecution, "id" | "timestamp">) => {
      if (typeof window === "undefined") return;

      try {
        const history = getHistory();
        const newExecution: ToolExecution = {
          ...execution,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };

        const updatedHistory = [newExecution, ...history.slice(0, 9)]; // Keep last 10 executions
        localStorage.setItem(
          `tool-history-${toolId}`,
          JSON.stringify(updatedHistory)
        );
      } catch (error) {
        console.error("Error saving tool history:", error);
      }
    },
    [toolId, getHistory]
  );

  const clearHistory = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(`tool-history-${toolId}`);
    } catch (error) {
      console.error("Error clearing tool history:", error);
    }
  }, [toolId]);

  return {
    getHistory,
    addToHistory,
    clearHistory,
  };
}
