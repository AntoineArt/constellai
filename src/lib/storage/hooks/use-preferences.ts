"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PREFERENCES } from "../storage-keys";
import { getUserPreferences, saveUserPreferences } from "../storage-utils";
import type { UserPreferences } from "../types";

export default function usePreferences() {
  // Initialize with default preferences to avoid hydration mismatch
  // Load actual preferences from localStorage in useEffect (client-only)
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_PREFERENCES
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedPreferences = getUserPreferences();
    setPreferences(loadedPreferences);
    setIsLoaded(true);
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      saveUserPreferences(newPreferences);
    },
    [preferences]
  );

  return {
    preferences,
    updatePreferences,
    isLoaded,
  };
}
