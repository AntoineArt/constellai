"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserPreferences, saveUserPreferences } from "../storage-utils";
import type { UserPreferences } from "../types";

export default function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    getUserPreferences()
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
