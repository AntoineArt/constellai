import { useCallback } from "react";

export function usePreferences() {
  const getApiKey = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    try {
      return localStorage.getItem("api-key");
    } catch (error) {
      console.error("Error reading API key:", error);
      return null;
    }
  }, []);

  const setApiKey = useCallback((apiKey: string) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("api-key", apiKey);
    } catch (error) {
      console.error("Error saving API key:", error);
    }
  }, []);

  const clearApiKey = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem("api-key");
    } catch (error) {
      console.error("Error clearing API key:", error);
    }
  }, []);

  return {
    getApiKey,
    setApiKey,
    clearApiKey,
  };
}
