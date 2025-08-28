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

    setExecutions(prev => {
      const updatedExecutions = [newExecution, ...prev];
      saveToolExecution(newExecution);
      return updatedExecutions;
    });
    
    setActiveExecutionId(toolId, newExecution.id);
    setActiveExecutionIdState(newExecution.id);

    return newExecution;
  }, [toolId]);

  // Update current execution
  const updateCurrentExecution = useCallback((
    updates: Partial<Pick<ToolExecution, "inputs" | "outputs" | "settings" | "title">>
  ) => {
    if (!activeExecutionId) return;

    setExecutions(prev => {
      const updatedExecutions = prev.map(execution => {
        if (execution.id === activeExecutionId) {
          const updated = { ...execution, ...updates };
          saveToolExecution(updated);
          return updated;
        }
        return execution;
      });
      return updatedExecutions;
    });
  }, [activeExecutionId]);

  // Switch to different execution
  const switchToExecution = useCallback((executionId: string) => {
    setExecutions(prev => {
      if (prev.some(e => e.id === executionId)) {
        setActiveExecutionId(toolId, executionId);
        setActiveExecutionIdState(executionId);
      }
      return prev;
    });
  }, [toolId]);

  // Delete execution
  const deleteExecution = useCallback((executionId: string) => {
    deleteToolExecution(executionId);
    
    setExecutions(prev => prev.filter(e => e.id !== executionId));

    // If deleting active execution, clear active state
    if (executionId === activeExecutionId) {
      setActiveExecutionId(toolId, null);
      setActiveExecutionIdState(null);
    }
  }, [activeExecutionId, toolId]);

  // Clear active execution (start fresh)
  const clearActiveExecution = useCallback(() => {
    setActiveExecutionId(toolId, null);
    setActiveExecutionIdState(null);
  }, [toolId]);

  // Rename execution
  const renameExecution = useCallback((executionId: string, newTitle: string) => {
    setExecutions(prev => {
      const updatedExecutions = prev.map(execution => {
        if (execution.id === executionId) {
          const updated = { ...execution, title: newTitle };
          saveToolExecution(updated);
          return updated;
        }
        return execution;
      });
      return updatedExecutions;
    });
  }, []);

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