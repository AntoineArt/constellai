"use client";

import { useChat } from "@ai-sdk/react";
import { Mic, MicOff, Paperclip, Send, Settings, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
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
import { useApiKey } from "@/hooks/use-api-key";
import { AI_MODELS, getModelsByProvider, getProviders } from "@/lib/models";
import { useConversations, usePreferences } from "@/lib/storage";

export default function ChatPage() {
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
  const [attachments, setAttachments] = useState<PromptInputMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversation from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        loadConversation(conversationId);
        setSelectedModel(conv.model);
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

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      headers: {
        "x-api-key": apiKey || "",
      },
      body: {
        model: selectedModel,
        temperature,
      },
      onFinish: (message) => {
        if (activeConversation) {
          // Save assistant message
          addMessage(activeConversation.id, {
            role: "assistant",
            content: message.content,
            createdAt: Date.now(),
          });

          // Generate title if first message
          if (activeConversation.messages.length === 0) {
            generateTitle(activeConversation.id, message.content);
          }
        }
      },
    });

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

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !activeConversation) return;

      // Save user message
      addMessage(activeConversation.id, {
        role: "user",
        content: input,
        createdAt: Date.now(),
      });

      handleSubmit(e);
    },
    [input, activeConversation, addMessage, handleSubmit]
  );

  const handleClearChat = useCallback(() => {
    if (activeConversation) {
      updateConversation(activeConversation.id, {
        messages: [],
        title: "New Conversation",
      });
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
          let _interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += `${transcript} `;
            } else {
              _interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => prev + finalTranscript);
            handleInputChange({
              target: { value: transcript + finalTranscript },
            } as any);
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
  }, [
    preferences.voiceEnabled,
    preferences.voiceLanguage,
    handleInputChange,
    transcript,
  ]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newAttachments: PromptInputMessage[] = files.map((file) => ({
        id: nanoid(),
        role: "user" as const,
        content: [
          {
            type: "file" as const,
            data: URL.createObjectURL(file),
            mimeType: file.type,
          },
        ],
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
    },
    []
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

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
                <Message key={message.id} role={message.role}>
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
        <form onSubmit={handleFormSubmit}>
          <PromptInput>
            <PromptInputHeader>
              <PromptInputModelSelect value={selectedModel}>
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {AI_MODELS.map((model) => (
                    <PromptInputModelSelectItem
                      key={model.id}
                      value={model.id}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputHeader>

            {attachments.length > 0 && (
              <PromptInputAttachments>
                {attachments.map((attachment) => (
                  <PromptInputAttachment
                    key={attachment.id}
                    onRemove={() => removeAttachment(attachment.id)}
                  >
                    {attachment.content[0].type}
                  </PromptInputAttachment>
                ))}
              </PromptInputAttachments>
            )}

            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
              />
            </PromptInputBody>

            <PromptInputFooter>
              <PromptInputTools>
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
              </PromptInputTools>
              <PromptInputSubmit disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </form>
      </div>
    </div>
  );
}
