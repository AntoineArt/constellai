"use client";

import { useChat } from "@ai-sdk/react";
import { Mic, MicOff, Paperclip, Send, Settings, Trash2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useApiKey } from "@/hooks/use-api-key";
import { getModelsByProvider, getProviders } from "@/lib/models";
import { useConversations, usePreferences } from "@/lib/storage";
import type { ChatMessage, MessagePart } from "@/types/chat";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");
  const { hasApiKey, apiKey } = useApiKey();
  const { preferences, updatePreferences } = usePreferences();
  const {
    conversations,
    activeConversation,
    createConversation,
    loadConversation,
    updateConversation,
    addMessage: addMessageToStorage,
  } = useConversations(preferences.defaultModel);

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selected model when preferences change
  useEffect(() => {
    if (preferences.defaultModel) {
      setSelectedModel(preferences.defaultModel);
    }
  }, [preferences.defaultModel]);

  // Track messages manually without useChat for debugging
  const [messages, setMessagesState] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");

  const sendMessage = useCallback(async (content: string) => {
    if (!apiKey) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content,
      parts: [{ type: "text", text: content }],
    };

    setMessagesState(prev => [...prev, userMessage]);
    setStatus("streaming");

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant" as const,
      content: "",
      parts: [{ type: "text", text: "" }],
    };

    setMessagesState(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          console.log("Received chunk:", chunk);

          setMessagesState(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.content = fullText;
              lastMsg.parts = [{ type: "text", text: fullText }];
            }
            return updated;
          });
        }
      }

      console.log("Final text:", fullText);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setStatus("idle");
    }
  }, [apiKey, messages, selectedModel, temperature]);

  const isLoading = status === "streaming";

  // Load conversation from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        loadConversation(conversationId);
        setSelectedModel(conv.model);
        setMessagesState(
          conv.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            parts: [{ type: "text" as const, text: m.content }],
          }))
        );
      }
    }
  }, [conversationId, conversations, loadConversation]);

  // Create conversation if none exists
  useEffect(() => {
    if (!activeConversation && !conversationId && hasApiKey) {
      createConversation(selectedModel);
    }
  }, [
    activeConversation,
    conversationId,
    hasApiKey,
    createConversation,
    selectedModel,
  ]);

  const generateTitle = async (convId: string, content: string) => {
    try {
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey || "",
        },
        body: JSON.stringify({
          messages: [{ role: "assistant", content }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title) {
          updateConversation(convId, { title: data.title });
        }
      }
    } catch (error) {
      console.error("Failed to generate title:", error);
    }
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || !hasApiKey || isLoading) return;

      const userMessage = input.trim();
      console.log("Sending message:", userMessage, "with model:", selectedModel);
      setInput("");

      await sendMessage(userMessage);
    },
    [input, hasApiKey, isLoading, sendMessage, selectedModel]
  );

  const handleClearChat = useCallback(() => {
    if (activeConversation) {
      updateConversation(activeConversation.id, {
        messages: [],
        title: "New Conversation",
      });
      setMessagesState([]);
    }
    window.location.href = "/";
  }, [activeConversation, updateConversation]);

  // Voice input setup
  useEffect(() => {
    if (typeof window !== "undefined" && preferences.voiceEnabled) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = preferences.voiceLanguage || "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += `${transcript} `;
            }
          }

          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [preferences.voiceEnabled, preferences.voiceLanguage]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      console.log("Files selected:", files);
      // TODO: Implement file attachment handling
    },
    []
  );

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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="voice-enabled"
                checked={preferences.voiceEnabled}
                onChange={(e) =>
                  updatePreferences({ voiceEnabled: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="voice-enabled" className="text-sm">
                Enable voice input
              </label>
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
                <Message key={message.id} from={message.role}>
                  {message.role === "assistant" ? (
                    <Response>{message.content}</Response>
                  ) : (
                    <MessageContent>{message.content}</MessageContent>
                  )}
                </Message>
              ))
            )}
          </ConversationContent>
        </Conversation>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  hasApiKey
                    ? "Type your message..."
                    : "Configure your API key first..."
                }
                className="min-h-[60px] resize-none"
                disabled={!hasApiKey}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={!hasApiKey}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              {preferences.voiceEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecording}
                  className={isRecording ? "text-red-500" : ""}
                  disabled={!hasApiKey}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!hasApiKey || isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
