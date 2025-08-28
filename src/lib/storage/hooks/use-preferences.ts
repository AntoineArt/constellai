"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserPreferences } from "../types";
import { getUserPreferences, saveUserPreferences } from "../storage-utils";

export default function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedPreferences = getUserPreferences();
    setPreferences(loadedPreferences);
    setIsLoaded(true);
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    saveUserPreferences(newPreferences);
  }, [preferences]);

  const updateToolSettings = useCallback((toolId: string, settings: Record<string, any>) => {
    const newToolSettings = { ...preferences.toolSettings, [toolId]: settings };
    updatePreferences({ toolSettings: newToolSettings });
  }, [preferences.toolSettings, updatePreferences]);

  const getToolSettings = useCallback((toolId: string) => {
    return preferences.toolSettings[toolId] || {};
  }, [preferences.toolSettings]);

  return {
    preferences,
    updatePreferences,
    updateToolSettings,
    getToolSettings,
    isLoaded,
  };
}