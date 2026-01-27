"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { Send, Settings, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message as MessageComponent, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useApiKey } from "@/hooks/use-api-key";
import { getModelsByProvider, getProviders } from "@/lib/models";
import { useConversations, usePreferences } from "@/lib/storage";
import type { Message as StorageMessage } from "@/lib/storage/types";

// Convert AI SDK message to storage message
function toStorageMessage(msg: Message): StorageMessage {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    createdAt: Date.now(),
  };
}

// Convert storage message to AI SDK message
function toAIMessage(msg: StorageMessage): Message {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  };
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");
  const { hasApiKey, apiKey, isLoaded: apiKeyLoaded } = useApiKey();
  const { preferences } = usePreferences();
  const {
    conversations,
    activeConversation,
    createConversation,
    loadConversation,
    updateConversation,
  } = useConversations(preferences.defaultModel);

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const isLoadingConversation = useRef(false);

  // Use Vercel AI SDK's useChat hook - much simpler!
  const {
    messages,
    input,
    setInput,
    handleSubmit: handleChatSubmit,
    isLoading,
    setMessages,
    error,
  } = useChat({
    api: "/api/chat",
    headers: apiKey ? { "x-api-key": apiKey } : {},
    body: {
      model: selectedModel,
      temperature,
    },
  });

  // Auto-save messages when they change (but not while loading a conversation)
  useEffect(() => {
    if (
      activeConversation &&
      messages.length > 0 &&
      !isLoadingConversation.current
    ) {
      const storageMessages = messages.map(toStorageMessage);
      updateConversation(activeConversation.id, {
        messages: storageMessages,
        updatedAt: Date.now(),
      });
    }
  }, [messages, activeConversation, updateConversation]);

  // Update selected model when preferences change
  useEffect(() => {
    if (preferences.defaultModel) {
      setSelectedModel(preferences.defaultModel);
    }
  }, [preferences.defaultModel]);

  // Load conversation from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        isLoadingConversation.current = true;
        loadConversation(conversationId);
        setSelectedModel(conv.model);
        setMessages(conv.messages.map(toAIMessage));
        // Reset flag after a short delay to allow React to update
        setTimeout(() => {
          isLoadingConversation.current = false;
        }, 100);
      }
    }
  }, [conversationId, conversations, loadConversation, setMessages]);

  // Create conversation if none exists and API key is set
  useEffect(() => {
    if (!activeConversation && !conversationId && hasApiKey && apiKeyLoaded) {
      createConversation(selectedModel);
    }
  }, [
    activeConversation,
    conversationId,
    hasApiKey,
    apiKeyLoaded,
    createConversation,
    selectedModel,
  ]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasApiKey || !input.trim() || isLoading) return;

      // The useChat hook will handle the message, we just call it
      handleChatSubmit(e);

      // Save happens in onFinish callback automatically
    },
    [hasApiKey, input, isLoading, handleChatSubmit]
  );

  const handleClearChat = useCallback(() => {
    if (activeConversation) {
      updateConversation(activeConversation.id, {
        messages: [],
        title: "New Conversation",
      });
      setMessages([]);
    }
    window.location.href = "/";
  }, [activeConversation, updateConversation, setMessages]);

  if (!apiKeyLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">
            {activeConversation?.title || "New Conversation"}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {getProviders().map((provider) => (
                  <div key={provider}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {provider}
                    </div>
                    {getModelsByProvider(provider).map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showSettings && (
          <div className="border-t p-4 space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">
                Temperature: {temperature}
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([value]) => setTemperature(value)}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState>
                <div className="text-center space-y-4">
                  {!hasApiKey ? (
                    <>
                      <h2 className="text-2xl font-bold">API Key Required</h2>
                      <p className="text-muted-foreground">
                        Click on "Configure API Key" in the sidebar to add your
                        API key
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">
                        Start a conversation
                      </h2>
                      <p className="text-muted-foreground">
                        Choose a model and type your message below
                      </p>
                    </>
                  )}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => (
                <MessageComponent key={message.id} from={message.role}>
                  {message.role === "assistant" ? (
                    <Response>
                      {typeof message.content === "string"
                        ? message.content
                        : JSON.stringify(message.content)}
                    </Response>
                  ) : (
                    <MessageContent>
                      {typeof message.content === "string"
                        ? message.content
                        : JSON.stringify(message.content)}
                    </MessageContent>
                  )}
                </MessageComponent>
              ))
            )}
            {error && (
              <div className="p-4 text-center text-sm text-destructive">
                Error: {error.message}
              </div>
            )}
          </ConversationContent>
        </Conversation>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              hasApiKey
                ? "Type your message..."
                : "Configure your API key first..."
            }
            className="min-h-[60px] resize-none flex-1"
            disabled={!hasApiKey}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (hasApiKey && input.trim() && !isLoading) {
                  handleChatSubmit(e as React.FormEvent<HTMLTextAreaElement>);
                }
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!hasApiKey || isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
