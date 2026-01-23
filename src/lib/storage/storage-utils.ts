import { DEFAULT_PREFERENCES, STORAGE_KEYS } from "./storage-keys";
import type { UserPreferences } from "./types";

// Safe localStorage operations with fallback to memory
class SafeStorage {
  private memoryStorage = new Map<string, string>();
  private useLocalStorage = true;

  constructor() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
      } else {
        this.useLocalStorage = false;
      }
    } catch {
      this.useLocalStorage = false;
    }
  }

  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch {
        // Fallback to memory storage
      }
    }
    return this.memoryStorage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.delete(key);
  }
}

const storage = new SafeStorage();

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const stored = storage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.warn(`Failed to parse stored data for key ${key}:`, error);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to store data for key ${key}:`, error);
  }
}

export function removeStoredData(key: string): void {
  storage.removeItem(key);
}

// Get user preferences
export function getUserPreferences(): UserPreferences {
  return getStoredData<UserPreferences>(
    STORAGE_KEYS.PREFERENCES,
    DEFAULT_PREFERENCES
  );
}

// Save user preferences
export function saveUserPreferences(preferences: UserPreferences): void {
  setStoredData(STORAGE_KEYS.PREFERENCES, preferences);
}
