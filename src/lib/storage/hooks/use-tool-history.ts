"use client";

import { useState, useEffect, useCallback } from "react";
import type { ToolExecution } from "../types";
import {
  getToolExecutions,
  saveToolExecution,
  deleteToolExecution,
  getActiveExecutionId,
  setActiveExecutionId,
  generateId,
  generateExecutionTitle,
  generateTempTitle,
  hasContentForAITitle,
} from "../storage-utils";

interface UseToolHistoryOptions {
  apiKey?: string;
}

export default function useToolHistory(
  toolId: string,
  options?: UseToolHistoryOptions
) {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [activeExecutionId, setActiveExecutionIdState] = useState<
    string | null
  >(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load executions and active execution on mount
  useEffect(() => {
    const loadedExecutions = getToolExecutions(toolId);
    const loadedActiveId = getActiveExecutionId(toolId);

    setExecutions(loadedExecutions);
    setActiveExecutionIdState(loadedActiveId);
    setIsLoaded(true);
  }, [toolId]);

  // Get current execution
  const currentExecution = activeExecutionId
    ? executions.find((e) => e.id === activeExecutionId)
    : null;

  // Create new execution
  const createNewExecution = useCallback(
    async (
      inputs: Record<string, any> = {},
      settings: Record<string, any> = {}
    ) => {
      // Start with simple temp title
      const tempTitle = generateTempTitle(toolId);

      const newExecution: ToolExecution = {
        id: generateId(),
        toolId,
        timestamp: Date.now(),
        title: tempTitle,
        inputs,
        outputs: {},
        settings,
      };

      setExecutions((prev) => {
        const updatedExecutions = [newExecution, ...prev];
        saveToolExecution(newExecution);
        return updatedExecutions;
      });

      setActiveExecutionId(toolId, newExecution.id);
      setActiveExecutionIdState(newExecution.id);

      return newExecution;
    },
    [toolId]
  );

  // Generate AI title for execution
  const generateAITitleForExecution = useCallback(
    async (
      executionId: string,
      inputs: Record<string, any>,
      outputs?: Record<string, any>
    ) => {
      if (!options?.apiKey || !hasContentForAITitle(toolId, inputs, outputs))
        return;

      try {
        const aiTitle = await generateExecutionTitle(
          toolId,
          inputs,
          options.apiKey
        );
        setExecutions((prev) => {
          const updated = prev.map((exec) => {
            if (exec.id === executionId) {
              const updatedExec = { ...exec, title: aiTitle };
              saveToolExecution(updatedExec);
              return updatedExec;
            }
            return exec;
          });
          return updated;
        });
      } catch (error) {
        console.log("AI title generation failed:", error);
      }
    },
    [toolId, options?.apiKey]
  );

  // Update current execution
  const updateCurrentExecution = useCallback(
    (
      updates: Partial<
        Pick<ToolExecution, "inputs" | "outputs" | "settings" | "title">
      >
    ) => {
      if (!activeExecutionId) return;

      setExecutions((prev) => {
        const updatedExecutions = prev.map((execution) => {
          if (execution.id === activeExecutionId) {
            const updated = { ...execution, ...updates };
            saveToolExecution(updated);

            // Check if this update qualifies for AI title generation and current title is still temp
            const isCurrentlyTempTitle = execution.title.startsWith("New ");
            const shouldGenerateAITitle =
              isCurrentlyTempTitle &&
              hasContentForAITitle(
                toolId,
                updated.inputs || {},
                updated.outputs || {}
              );

            if (shouldGenerateAITitle) {
              // Generate AI title in background
              setTimeout(() => {
                generateAITitleForExecution(
                  execution.id,
                  updated.inputs || {},
                  updated.outputs || {}
                );
              }, 100);
            }

            return updated;
          }
          return execution;
        });
        return updatedExecutions;
      });
    },
    [activeExecutionId, toolId, generateAITitleForExecution]
  );

  // Switch to different execution
  const switchToExecution = useCallback(
    (executionId: string) => {
      setExecutions((prev) => {
        if (prev.some((e) => e.id === executionId)) {
          setActiveExecutionId(toolId, executionId);
          setActiveExecutionIdState(executionId);
        }
        return prev;
      });
    },
    [toolId]
  );

  // Delete execution
  const deleteExecution = useCallback(
    (executionId: string) => {
      deleteToolExecution(executionId);

      setExecutions((prev) => prev.filter((e) => e.id !== executionId));

      // If deleting active execution, clear active state
      if (executionId === activeExecutionId) {
        setActiveExecutionId(toolId, null);
        setActiveExecutionIdState(null);
      }
    },
    [activeExecutionId, toolId]
  );

  // Clear active execution (start fresh)
  const clearActiveExecution = useCallback(() => {
    setActiveExecutionId(toolId, null);
    setActiveExecutionIdState(null);
  }, [toolId]);

  // Rename execution
  const renameExecution = useCallback(
    (executionId: string, newTitle: string) => {
      setExecutions((prev) => {
        const updatedExecutions = prev.map((execution) => {
          if (execution.id === executionId) {
            const updated = { ...execution, title: newTitle };
            saveToolExecution(updated);
            return updated;
          }
          return execution;
        });
        return updatedExecutions;
      });
    },
    []
  );

  return {
    executions,
    currentExecution,
    activeExecutionId,
    isLoaded,
    createNewExecution,
    updateCurrentExecution,
    switchToExecution,
    deleteExecution,
    clearActiveExecution,
    renameExecution,
    generateAITitleForExecution,
  };
}
