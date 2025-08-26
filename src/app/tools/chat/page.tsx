"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { useApiKey } from "@/hooks/use-api-key";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o");
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const chatControllerRef = useRef<AbortController | null>(null);
  const { hasApiKey, apiKey } = useApiKey();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasApiKey || status === "submitted" || status === "streaming") return;

      const prompt = inputValue.trim();
      if (!prompt) return;

      const newMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: prompt },
      ];
      setMessages(newMessages);
      setInputValue("");
      setStatus("submitted");

      try {
        const controller = new AbortController();
        chatControllerRef.current = controller;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            messages: newMessages,
            model: selectedModel,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        if (!response.body) {
          const text = await response.text();
          setMessages((prev) => [...prev, { role: "assistant", content: text }]);
          setStatus(undefined);
          chatControllerRef.current = null;
          return;
        }

        setStatus("streaming");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        // Push an empty assistant message to stream into
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        // Stream loop
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (lastIndex >= 0 && next[lastIndex]?.role === "assistant") {
              next[lastIndex] = { role: "assistant", content: assistantContent };
            }
            return next;
          });
        }

        // Flush
        assistantContent += decoder.decode();
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (lastIndex >= 0 && next[lastIndex]?.role === "assistant") {
            next[lastIndex] = { role: "assistant", content: assistantContent };
          }
          return next;
        });
        setStatus(undefined);
      } catch (error) {
        chatControllerRef.current = null;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, an error occurred while communicating with the assistant.",
          },
        ]);
        setStatus("error");
      }
    },
    [hasApiKey, status, inputValue, messages, apiKey, selectedModel]
  );

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        title="AI Chat"
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      {!hasApiKey ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="border-destructive/50 bg-destructive/10 max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-destructive">
                Please set your API key in the top bar to start chatting
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex h-full flex-col flex-1">
          {/* Conversation area - takes remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent className="flex flex-col gap-4 p-4">
                {/* Default welcome message when no messages exist */}
                {messages.length === 0 && (
                  <Message from="assistant">
                    <MessageContent>
                      <Response>
                        Hello! I'm your AI assistant. How can I help you today?
                      </Response>
                    </MessageContent>
                  </Message>
                )}

                {messages.map((message, index) => (
                  <Message from={message.role} key={`${index}-${message.role}`}>
                    <MessageContent>
                      <Response>{message.content}</Response>
                    </MessageContent>
                  </Message>
                ))}

                {/* Show loading when waiting for response */}
                {(status === "submitted" || status === "streaming") && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>

          {/* Input area - fixed height */}
          <div className="flex-shrink-0 border-t p-4">
            <div className="mx-auto max-w-3xl">
              <form
                onSubmit={handleSubmit}
                className="w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm"
              >
                <div className="p-4">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                    rows={3}
                    disabled={!hasApiKey || status === "streaming"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                  <div className="flex gap-2">
                    {status === "streaming" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (chatControllerRef.current) {
                            chatControllerRef.current.abort();
                            chatControllerRef.current = null;
                            setStatus(undefined);
                          }
                        }}
                        className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                      >
                        Stop
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || !hasApiKey || status === "streaming"}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {status === "streaming" ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
