"use client";

import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage/storage-keys";
import {
  getStoredData,
  removeStoredData,
  setStoredData,
} from "@/lib/storage/storage-utils";

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredData(STORAGE_KEYS.API_KEY, "");
    if (stored) {
      setApiKey(stored);
    }
    setIsLoaded(true);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      setStoredData(STORAGE_KEYS.API_KEY, key);
    } else {
      removeStoredData(STORAGE_KEYS.API_KEY);
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
