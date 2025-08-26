"use client";

import { useState, useEffect } from "react";

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("constellai-api-key");
    if (stored) {
      setApiKey(stored);
    }
    setIsLoaded(true);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("constellai-api-key", key);
    } else {
      localStorage.removeItem("constellai-api-key");
    }
  };

  const getMaskedApiKey = () => {
    if (!apiKey) return "";
    if (apiKey.length <= 4) return "••••";
    return "•".repeat(apiKey.length - 4) + apiKey.slice(-4);
  };

  return {
    apiKey,
    setApiKey: saveApiKey,
    getMaskedApiKey,
    hasApiKey: !!apiKey,
    isLoaded,
  };
}
