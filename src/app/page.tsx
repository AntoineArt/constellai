"use client";

import { Mic, MicOff, Paperclip, Send, Settings, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { useApiKey } from "@/hooks/use-api-key";
import { getModelsByProvider, getProviders } from "@/lib/models";
import { useConversations, usePreferences } from "@/lib/storage";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

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
    addMessage,
  } = useConversations(preferences.defaultModel);

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversation from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        loadConversation(conversationId);
        setSelectedModel(conv.model);
        setMessages(
          conv.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
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
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !activeConversation || isLoading) return;

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: input,
      };

      // Add user message to UI
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      // Save user message to conversation
      addMessage(activeConversation.id, {
        role: "user",
        content: input,
        createdAt: Date.now(),
      });

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey || "",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model: selectedModel,
            temperature,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        const assistantMessageId = nanoid();

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "" },
        ]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("0:")) {
                const text = line.substring(2);
                assistantContent += text;

                // Update assistant message in UI
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            }
          }
        }

        // Save assistant message to conversation
        addMessage(activeConversation.id, {
          role: "assistant",
          content: assistantContent,
          createdAt: Date.now(),
        });

        // Generate title if first message
        if (activeConversation.messages.length === 0) {
          generateTitle(activeConversation.id, assistantContent);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Chat error:", error);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      input,
      activeConversation,
      isLoading,
      messages,
      apiKey,
      selectedModel,
      temperature,
      addMessage,
    ]
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

  if (!hasApiKey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">API Key Required</h2>
          <p className="text-muted-foreground">
            Please add your API key to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
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
                  <h2 className="text-2xl font-bold">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Choose a model and type your message below
                  </p>
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
                placeholder="Type your message..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
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
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button type="submit" disabled={isLoading || !input.trim()}>
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
