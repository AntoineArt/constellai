"use client";

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory, usePreferences, TOOL_IDS } from "@/lib/storage";
import type { ChatMessage } from "@/lib/storage/types";
import { Trash2, Copy, RotateCcw, Menu } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

export default function ChatPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.CHAT, { apiKey });
  const { preferences } = usePreferences();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [messages, setMessages] = useState<
    Array<ChatMessage & { id?: string }>
  >([]);
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const chatControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.messages) {
        setMessages(execution.inputs.messages);
      }
      if (execution.settings?.selectedModel) {
        setSelectedModel(execution.settings.selectedModel);
      }
    }
  }, [toolHistory.isLoaded, toolHistory.currentExecution]);

  // Save conversation when not streaming and messages have changed
  useEffect(() => {
    if (
      !toolHistory.isLoaded ||
      messages.length === 0 ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const timeoutId = setTimeout(async () => {
      if (!toolHistory.currentExecution) {
        await toolHistory.createNewExecution({ messages }, { selectedModel });
      } else {
        toolHistory.updateCurrentExecution({
          inputs: { messages },
          settings: { selectedModel },
        });
      }
    }, 1000); // Longer debounce to avoid interference

    return () => clearTimeout(timeoutId);
  }, [messages, selectedModel, status, toolHistory]);

  // Auto-resize textarea with strict max height
  // biome-ignore lint/correctness/useExhaustiveDependencies: inputValue is needed to trigger resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  // Auto-focus textarea when API key is available
  useEffect(() => {
    if (hasApiKey && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [hasApiKey]);

  const clearChat = useCallback(() => {
    if (status === "streaming") return;
    setMessages([]);
    toolHistory.clearActiveExecution();
  }, [status, toolHistory]);

  const copyMessage = useCallback(
    async (content: string, messageId: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (error) {
        console.error("Failed to copy message:", error);
      }
    },
    []
  );

  const handleSubmitWithMessage = useCallback(
    async (messagesToSend: ChatMessage[]) => {
      if (!hasApiKey || status === "submitted" || status === "streaming")
        return;

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
            messages: messagesToSend,
            model: selectedModel,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        if (!response.body) {
          const text = await response.text();
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: text },
          ]);
          setStatus(undefined);
          chatControllerRef.current = null;
          return;
        }

        setStatus("streaming");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        // Push an empty assistant message to stream into
        const assistantMessageId = `assistant-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            id: assistantMessageId,
          },
        ]);

        // Stream loop with reduced re-renders
        let lastUpdateTime = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });

          // Throttle updates to reduce re-renders and focus loss
          const now = Date.now();
          if (now - lastUpdateTime > 50 || done) {
            // Update at most every 50ms
            lastUpdateTime = now;
            setMessages((prev) => {
              const next = [...prev];
              const lastIndex = next.length - 1;
              if (
                lastIndex >= 0 &&
                next[lastIndex]?.id === assistantMessageId
              ) {
                next[lastIndex] = {
                  role: "assistant",
                  content: assistantContent,
                  id: assistantMessageId,
                };
              }
              return next;
            });
          }
        }

        // Flush final content
        assistantContent += decoder.decode();
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (lastIndex >= 0 && next[lastIndex]?.id === assistantMessageId) {
            next[lastIndex] = {
              role: "assistant",
              content: assistantContent,
              id: assistantMessageId,
            };
          }
          return next;
        });

        // Clean up and save after streaming completes
        chatControllerRef.current = null;
        setStatus(undefined);

        // Refocus the input after streaming completes
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);

        // Final save of the complete conversation
        const finalMessages = [
          ...messagesToSend,
          { role: "assistant", content: assistantContent },
        ];
        if (!toolHistory.currentExecution) {
          await toolHistory.createNewExecution(
            { messages: finalMessages },
            { selectedModel }
          );
        } else {
          toolHistory.updateCurrentExecution({
            inputs: { messages: finalMessages },
            settings: { selectedModel },
          });
        }
      } catch (error) {
        chatControllerRef.current = null;
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, don't show error message
          setStatus(undefined);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Sorry, an error occurred while communicating with the assistant.",
            },
          ]);
          setStatus("error");
        }
      }
    },
    [hasApiKey, apiKey, selectedModel, status, toolHistory]
  );

  const regenerateLastResponse = useCallback(() => {
    if (status === "streaming" || messages.length === 0) return;

    // Find the last user message
    const lastUserMessageIndex = messages.findLastIndex(
      (m) => m.role === "user"
    );
    if (lastUserMessageIndex === -1) return;

    // Remove all messages after the last user message
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(newMessages);

    // Re-trigger the API call with the last user message
    const lastUserMessage = messages[lastUserMessageIndex];
    if (lastUserMessage) {
      handleSubmitWithMessage(newMessages);
    }
  }, [messages, status, handleSubmitWithMessage]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasApiKey || status === "submitted" || status === "streaming")
        return;

      const prompt = inputValue.trim();
      if (!prompt) return;

      const newMessages: (ChatMessage & { id?: string })[] = [
        ...messages,
        { role: "user", content: prompt, id: `user-${Date.now()}` },
      ];
      setMessages(newMessages);
      setInputValue("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await handleSubmitWithMessage(newMessages);
    },
    [hasApiKey, status, inputValue, messages, handleSubmitWithMessage]
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col sm:flex-row">
      {/* Tool History Sidebar */}
      <div className="sm:block hidden">
        <ToolHistorySidebar
          executions={toolHistory.executions}
          activeExecutionId={toolHistory.activeExecutionId}
          onSelectExecution={toolHistory.switchToExecution}
          onDeleteExecution={toolHistory.deleteExecution}
          onRenameExecution={toolHistory.renameExecution}
          onNewExecution={async () => {
            if (status !== "streaming") {
              clearChat();
              await toolHistory.createNewExecution(
                { messages: [] },
                { selectedModel }
              );
            }
          }}
          toolName="Chat"
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-background">
            <ToolHistorySidebar
              executions={toolHistory.executions}
              activeExecutionId={toolHistory.activeExecutionId}
              onSelectExecution={(id) => {
                toolHistory.switchToExecution(id);
                setIsMobileSidebarOpen(false);
              }}
              onDeleteExecution={toolHistory.deleteExecution}
              onRenameExecution={toolHistory.renameExecution}
              onNewExecution={async () => {
                if (status !== "streaming") {
                  clearChat();
                  await toolHistory.createNewExecution(
                    { messages: [] },
                    { selectedModel }
                  );
                  setIsMobileSidebarOpen(false);
                }
              }}
              toolName="Chat"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar - fixed height */}
        <div className="flex items-center h-16 border-b bg-background px-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden mr-2"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <TopBar
              title="AI Chat"
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="h-[calc(100vh-128px)] sm:h-[calc(100vh-64px)] overflow-hidden">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center p-6">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    start chatting
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Chat actions - when present */}
              {messages.length > 0 && (
                <div className="border-b bg-background px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {messages.length} messages
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={regenerateLastResponse}
                      disabled={status === "streaming" || messages.length === 0}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      disabled={status === "streaming"}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages area - scrollable */}
              <Conversation className="flex-1">
                <ConversationContent className="max-w-4xl mx-auto px-2 sm:px-4">
                  {/* Welcome message */}
                  {messages.length === 0 && (
                    <Message from="assistant">
                      <MessageContent>
                        <Response>
                          Hello! I'm your AI assistant. How can I help you
                          today?
                        </Response>
                      </MessageContent>
                    </Message>
                  )}

                  {/* Chat messages */}
                  {messages.map((message, index) => {
                    const messageKey = message.id || `${index}-${message.role}`;
                    return (
                      <Message key={messageKey} from={message.role}>
                        <MessageContent className="relative">
                          <Response>{message.content}</Response>

                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm"
                            onClick={() =>
                              copyMessage(message.content, messageKey)
                            }
                          >
                            <Copy
                              className={`h-3 w-3 ${
                                copiedMessageId === messageKey
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {/* Loading indicator */}
                  {(status === "submitted" || status === "streaming") && (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {status === "submitted"
                              ? "Thinking..."
                              : "Typing..."}
                          </span>
                        </div>
                      </MessageContent>
                    </Message>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              {/* Input area - fixed at bottom */}
              <div className="border-t bg-background p-2 sm:p-4">
                <div className="max-w-4xl mx-auto">
                  <form
                    onSubmit={handleSubmit}
                    className="bg-muted/50 rounded-2xl border focus-within:border-primary/50 focus-within:bg-background transition-all"
                  >
                    <div className="p-2 sm:p-4">
                      <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={
                          !hasApiKey
                            ? "Please set your API key to start chatting..."
                            : status === "streaming"
                              ? "Please wait for the response to complete..."
                              : "Type your message..."
                        }
                        className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-h-[60px] sm:min-h-[60px] max-h-[120px]"
                        disabled={!hasApiKey || status === "streaming"}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                          if (e.key === "Escape") {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between px-2 sm:px-4 pb-2 sm:pb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>
                          Press{" "}
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            ↵
                          </kbd>{" "}
                          to send
                        </span>
                        {inputValue.length > 0 && (
                          <span>{inputValue.length} characters</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {status === "streaming" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (chatControllerRef.current) {
                                chatControllerRef.current.abort();
                                chatControllerRef.current = null;
                                setStatus(undefined);
                              }
                            }}
                          >
                            Stop
                          </Button>
                        )}
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            !inputValue.trim() ||
                            !hasApiKey ||
                            status === "streaming"
                          }
                        >
                          {status === "streaming" ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
