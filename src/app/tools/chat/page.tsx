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
import { Trash2, Copy, RotateCcw } from "lucide-react";

export default function ChatPage() {
  const toolHistory = useToolHistory(TOOL_IDS.CHAT);
  const { preferences } = usePreferences();
  const { hasApiKey, apiKey } = useApiKey();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const chatControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Debounced auto-save messages when they change
  const debouncedMessages = useMemo(() => messages, [JSON.stringify(messages)]);
  
  useEffect(() => {
    if (!toolHistory.isLoaded || messages.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      if (!toolHistory.currentExecution) {
        toolHistory.createNewExecution(
          { messages: debouncedMessages },
          { selectedModel }
        );
      } else {
        toolHistory.updateCurrentExecution({
          inputs: { messages: debouncedMessages },
          settings: { selectedModel },
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [debouncedMessages, selectedModel]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Auto-resize textarea with strict max height
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

  const copyMessage = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  }, []);

  const regenerateLastResponse = useCallback(() => {
    if (status === "streaming" || messages.length === 0) return;
    
    // Find the last user message
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === "user");
    if (lastUserMessageIndex === -1) return;

    // Remove all messages after the last user message
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(newMessages);
    
    // Re-trigger the API call with the last user message
    const lastUserMessage = messages[lastUserMessageIndex];
    if (lastUserMessage) {
      handleSubmitWithMessage(newMessages);
    }
  }, [messages, status]);

  const handleSubmitWithMessage = useCallback(
    async (messagesToSend: ChatMessage[]) => {
      if (!hasApiKey || status === "submitted" || status === "streaming") return;

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
    [hasApiKey, apiKey, selectedModel]
  );

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
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await handleSubmitWithMessage(newMessages);
    },
    [hasApiKey, status, inputValue, messages, handleSubmitWithMessage]
  );

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Tool History Sidebar */}
      <ToolHistorySidebar
        executions={toolHistory.executions}
        activeExecutionId={toolHistory.activeExecutionId}
        onSelectExecution={toolHistory.switchToExecution}
        onDeleteExecution={toolHistory.deleteExecution}
        onRenameExecution={toolHistory.renameExecution}
        toolName="Chat"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - fixed height */}
        <TopBar
          title="AI Chat"
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onNew={() => {
            if (status !== "streaming") {
              clearChat();
            }
          }}
        />

      {/* Main content area */}
      <div className="h-[calc(100vh-64px)] overflow-hidden">
        {!hasApiKey ? (
          <div className="h-full flex items-center justify-center p-6">
            <Card className="border-muted bg-muted/20 max-w-md">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Please set your Vercel AI Gateway API key in the top bar to start chatting
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Chat actions - when present */}
            {messages.length > 0 && (
              <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {messages.length} messages
                </span>
                <div className="flex gap-2">
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
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6">
                <div className="space-y-6">
                  {/* Welcome message */}
                  {messages.length === 0 && (
                    <div className="flex">
                      <div className="bg-muted rounded-2xl p-4 max-w-[80%]">
                        <p className="text-sm">
                          Hello! I'm your AI assistant. How can I help you today?
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  {messages.map((message, index) => (
                    <div key={`${index}-${message.role}`} className="group">
                      <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`relative max-w-[80%] rounded-2xl p-4 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm"
                            onClick={() => copyMessage(message.content, `${index}-${message.role}`)}
                          >
                            <Copy 
                              className={`h-3 w-3 ${
                                copiedMessageId === `${index}-${message.role}` 
                                  ? "text-green-600" 
                                  : "text-muted-foreground"
                              }`} 
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {(status === "submitted" || status === "streaming") && (
                    <div className="flex">
                      <div className="bg-muted rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {status === "submitted" ? "Thinking..." : "Typing..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-scroll target */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input area - fixed at bottom */}
            <div className="border-t bg-background p-4">
              <div className="max-w-4xl mx-auto">
                <form
                  onSubmit={handleSubmit}
                  className="bg-muted/50 rounded-2xl border focus-within:border-primary/50 focus-within:bg-background transition-all"
                >
                  <div className="p-4">
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
                      className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-h-[60px] max-h-[120px]"
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
                  
                  <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↵</kbd> to send</span>
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
                        disabled={!inputValue.trim() || !hasApiKey || status === "streaming"}
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
