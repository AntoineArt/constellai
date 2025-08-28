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
} from "../storage-utils";

export default function useToolHistory(toolId: string) {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [activeExecutionId, setActiveExecutionIdState] = useState<string | null>(null);
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
    ? executions.find(e => e.id === activeExecutionId)
    : null;

  // Create new execution
  const createNewExecution = useCallback((inputs: Record<string, any> = {}, settings: Record<string, any> = {}) => {
    const newExecution: ToolExecution = {
      id: generateId(),
      toolId,
      timestamp: Date.now(),
      title: generateExecutionTitle(toolId, inputs),
      inputs,
      outputs: {},
      settings,
    };

    const updatedExecutions = [newExecution, ...executions];
    setExecutions(updatedExecutions);
    setActiveExecutionId(toolId, newExecution.id);
    setActiveExecutionIdState(newExecution.id);
    saveToolExecution(newExecution);

    return newExecution;
  }, [toolId, executions]);

  // Update current execution
  const updateCurrentExecution = useCallback((
    updates: Partial<Pick<ToolExecution, "inputs" | "outputs" | "settings" | "title">>
  ) => {
    if (!activeExecutionId) return;

    const updatedExecutions = executions.map(execution => {
      if (execution.id === activeExecutionId) {
        const updated = { ...execution, ...updates };
        saveToolExecution(updated);
        return updated;
      }
      return execution;
    });

    setExecutions(updatedExecutions);
  }, [activeExecutionId, executions]);

  // Switch to different execution
  const switchToExecution = useCallback((executionId: string) => {
    if (executions.some(e => e.id === executionId)) {
      setActiveExecutionId(toolId, executionId);
      setActiveExecutionIdState(executionId);
    }
  }, [toolId, executions]);

  // Delete execution
  const deleteExecution = useCallback((executionId: string) => {
    deleteToolExecution(executionId);
    const updatedExecutions = executions.filter(e => e.id !== executionId);
    setExecutions(updatedExecutions);

    // If deleting active execution, clear active state
    if (executionId === activeExecutionId) {
      setActiveExecutionId(toolId, null);
      setActiveExecutionIdState(null);
    }
  }, [executions, activeExecutionId, toolId]);

  // Clear active execution (start fresh)
  const clearActiveExecution = useCallback(() => {
    setActiveExecutionId(toolId, null);
    setActiveExecutionIdState(null);
  }, [toolId]);

  // Rename execution
  const renameExecution = useCallback((executionId: string, newTitle: string) => {
    const updatedExecutions = executions.map(execution => {
      if (execution.id === executionId) {
        const updated = { ...execution, title: newTitle };
        saveToolExecution(updated);
        return updated;
      }
      return execution;
    });
    setExecutions(updatedExecutions);
  }, [executions]);

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
  };
}