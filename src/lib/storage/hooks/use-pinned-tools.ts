"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPinnedTools,
  pinTool,
  unpinTool,
  isToolPinned,
} from "../storage-utils";

export default function usePinnedTools() {
  const [pinnedTools, setPinnedTools] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedPinnedTools = getPinnedTools();
    setPinnedTools(loadedPinnedTools);
    setIsLoaded(true);
  }, []);

  const pin = useCallback((toolId: string) => {
    pinTool(toolId);
    setPinnedTools((prev) =>
      prev.includes(toolId) ? prev : [...prev, toolId]
    );
  }, []);

  const unpin = useCallback((toolId: string) => {
    unpinTool(toolId);
    setPinnedTools((prev) => prev.filter((id) => id !== toolId));
  }, []);

  const toggle = useCallback(
    (toolId: string) => {
      if (isToolPinned(toolId)) {
        unpin(toolId);
      } else {
        pin(toolId);
      }
    },
    [pin, unpin]
  );

  const isPinned = useCallback(
    (toolId: string) => {
      return pinnedTools.includes(toolId);
    },
    [pinnedTools]
  );

  return {
    pinnedTools,
    pin,
    unpin,
    toggle,
    isPinned,
    isLoaded,
  };
}
