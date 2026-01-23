"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../storage-keys";
import type { Conversation, Message } from "../types";

export interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  createConversation: (model?: string) => Conversation;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversation: (
    id: string,
    updates: Partial<Omit<Conversation, "id">>
  ) => void;
  addMessage: (conversationId: string, message: Omit<Message, "id">) => void;
  clearActiveConversation: () => void;
  pinConversation: (id: string, pinned: boolean) => void;
  isLoaded: boolean;
}

export function useConversations(
  defaultModel?: string
): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (stored) {
        setConversations(JSON.parse(stored));
      }

      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      if (activeId) {
        setActiveConversationId(activeId);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.CONVERSATIONS,
          JSON.stringify(conversations)
        );
      } catch (error) {
        console.error("Failed to save conversations:", error);
      }
    }
  }, [conversations, isLoaded]);

  // Save active conversation ID
  useEffect(() => {
    if (isLoaded) {
      try {
        if (activeConversationId) {
          localStorage.setItem(
            STORAGE_KEYS.ACTIVE_CONVERSATION,
            activeConversationId
          );
        } else {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
        }
      } catch (error) {
        console.error("Failed to save active conversation:", error);
      }
    }
  }, [activeConversationId, isLoaded]);

  const createConversation = useCallback(
    (model?: string): Conversation => {
      const now = Date.now();
      const newConversation: Conversation = {
        id: nanoid(),
        title: "New Conversation",
        messages: [],
        model: model || defaultModel || "anthropic/claude-opus-4.5",
        createdAt: now,
        updatedAt: now,
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);

      return newConversation;
    },
    [defaultModel]
  );

  const loadConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConversationId((prev) => (prev === id ? null : prev));
  }, []);

  const updateConversation = useCallback(
    (id: string, updates: Partial<Omit<Conversation, "id">>) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...updates, updatedAt: Date.now() }
            : c
        )
      );
    },
    []
  );

  const addMessage = useCallback(
    (conversationId: string, message: Omit<Message, "id">) => {
      const newMessage: Message = {
        ...message,
        id: nanoid(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, newMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    },
    []
  );

  const clearActiveConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const pinConversation = useCallback((id: string, pinned: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned } : c))
    );
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  return {
    conversations,
    activeConversation,
    createConversation,
    loadConversation,
    deleteConversation,
    updateConversation,
    addMessage,
    clearActiveConversation,
    pinConversation,
    isLoaded,
  };
}
