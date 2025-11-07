"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatStatus } from "ai";
import {
  AlertCircle,
  Copy,
  History,
  Menu,
  PanelLeft,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
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
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { TopBar } from "@/components/top-bar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { AI_MODELS } from "@/lib/models";
import { TOOL_IDS, usePreferences, useToolHistory } from "@/lib/storage";
import type { ChatMessage } from "@/lib/storage/types";

export default function ChatPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.CHAT, { apiKey });
  const { preferences } = usePreferences();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [temperature, setTemperature] = useState(0.7);
  const [messages, setMessages] = useState<
    Array<ChatMessage & { id?: string }>
  >([]);
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessages, setLastFailedMessages] = useState<ChatMessage[] | null>(null);
  const chatControllerRef = useRef<AbortController | null>(null);

  // Auto-collapse history on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        // lg breakpoint
        setIsHistoryCollapsed(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.messages) {
        setMessages(execution.inputs.messages);
      }
      // Prefer execution.model field over settings.selectedModel
      const executionModel =
        execution.model || execution.settings?.selectedModel;
      if (executionModel) {
        setSelectedModel(executionModel);
      }
      // Load temperature from settings, default to 0.7
      if (execution.settings?.temperature !== undefined) {
        setTemperature(execution.settings.temperature);
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
        await toolHistory.createNewExecution(
          { messages },
          { selectedModel, temperature },
          selectedModel
        );
      } else {
        toolHistory.updateCurrentExecution({
          inputs: { messages },
          settings: { selectedModel, temperature },
          model: selectedModel,
        });
      }
    }, 1000); // Longer debounce to avoid interference

    return () => clearTimeout(timeoutId);
  }, [messages, selectedModel, temperature, status, toolHistory]);


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
            temperature: temperature,
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

        // Final save of the complete conversation
        const finalMessages = [
          ...messagesToSend,
          { role: "assistant", content: assistantContent },
        ];
        if (!toolHistory.currentExecution) {
          await toolHistory.createNewExecution(
            { messages: finalMessages },
            { selectedModel, temperature },
            selectedModel
          );
        } else {
          toolHistory.updateCurrentExecution({
            inputs: { messages: finalMessages },
            settings: { selectedModel, temperature },
            model: selectedModel,
          });
        }
      } catch (error) {
        chatControllerRef.current = null;
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, don't show error message
          setStatus(undefined);
          setErrorMessage(null);
          setLastFailedMessages(null);
        } else {
          // Store error and failed messages for retry
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "An error occurred while communicating with the assistant."
          );
          setLastFailedMessages(messagesToSend);
          setStatus("error");
        }
      }
    },
    [hasApiKey, apiKey, selectedModel, temperature, status, toolHistory]
  );

  const retryLastRequest = useCallback(() => {
    if (!lastFailedMessages) return;
    setErrorMessage(null);
    setStatus(undefined);
    handleSubmitWithMessage(lastFailedMessages);
  }, [lastFailedMessages, handleSubmitWithMessage]);

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


  // Helper functions for history sidebar
  const getMessageCount = useCallback((execution: any) => {
    return execution.inputs?.messages?.length || 0;
  }, []);

  const getPreviewText = useCallback((execution: any) => {
    const messages = execution.inputs?.messages || [];
    if (messages.length === 0) return undefined;
    // Get last assistant message or last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      // Truncate to 100 characters
      return lastMessage.content.slice(0, 100);
    }
    return undefined;
  }, []);

  return (
    <div className="h-dvh overflow-hidden flex">
      {/* Tool History Sidebar */}
      {!isHistoryCollapsed && (
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
                  { selectedModel },
                  selectedModel
                );
              }
            }}
            toolName="Chat"
            getMessageCount={getMessageCount}
            getPreviewText={getPreviewText}
          />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-background overflow-x-hidden">
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
                    { selectedModel },
                    selectedModel
                  );
                  setIsMobileSidebarOpen(false);
                }
              }}
              toolName="Chat"
              getMessageCount={getMessageCount}
              getPreviewText={getPreviewText}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Top bar - fixed height */}
        <div className="flex items-center h-16 border-b bg-background px-2 sm:px-4 gap-2">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden h-8 w-8 p-0 shrink-0"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0 overflow-hidden">
            <TopBar
              title="AI Chat"
              actions={
                <>
                  <SidebarTrigger className="h-8 w-8 p-0" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                    title={isHistoryCollapsed ? "Show history" : "Hide history"}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </>
              }
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
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
            <div className="h-full flex flex-col min-w-0">
              {/* Chat actions - when present */}
              {messages.length > 0 && (
                <div className="border-b bg-background px-3 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {messages.length} messages
                  </span>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={regenerateLastResponse}
                      disabled={status === "streaming" || messages.length === 0}
                      className="h-8 text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden xs:inline">Regenerate</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      disabled={status === "streaming"}
                      className="h-8 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden xs:inline">Clear</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Error banner with retry */}
              {errorMessage && (
                <div className="px-3 sm:px-6 py-3">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <span className="text-sm break-words min-w-0">{errorMessage}</span>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={retryLastRequest}
                          disabled={status === "streaming"}
                          className="text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setErrorMessage(null);
                            setLastFailedMessages(null);
                            setStatus(undefined);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Messages area - scrollable */}
              <Conversation className="flex-1">
                <ConversationContent className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-6 md:px-8">
                  {/* Empty state */}
                  {messages.length === 0 && (
                    <ConversationEmptyState
                      title="Start a conversation"
                      description="Send a message to begin chatting with the AI assistant"
                      icon={
                        <div className="rounded-full bg-primary/10 p-3">
                          <AlertCircle className="h-6 w-6 text-primary" />
                        </div>
                      }
                    />
                  )}

                  {/* Chat messages */}
                  {messages.map((message, index) => {
                    const messageKey = message.id || `${index}-${message.role}`;
                    return (
                      <Message key={messageKey} from={message.role}>
                        <MessageContent className="relative overflow-visible">
                          <Response>{message.content}</Response>

                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm hover:bg-accent"
                            onClick={() =>
                              copyMessage(message.content, messageKey)
                            }
                          >
                            <Copy
                              className={`h-3.5 w-3.5 ${
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
              <div className="border-t bg-background p-3 sm:p-4 md:p-6">
                <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
                  <PromptInput
                    multiple
                    accept="image/*"
                    onSubmit={async (message: PromptInputMessage, event) => {
                      event.preventDefault();
                      if (!hasApiKey || status === "submitted" || status === "streaming") return;

                      const text = message.text?.trim();
                      if (!text && !message.files?.length) return;

                      const newMessages: (ChatMessage & { id?: string })[] = [
                        ...messages,
                        {
                          role: "user",
                          content: text || "[Sent with attachments]",
                          id: `user-${Date.now()}`
                        },
                      ];
                      setMessages(newMessages);
                      setInputValue("");

                      await handleSubmitWithMessage(newMessages);
                    }}
                  >
                    <PromptInputHeader>
                      <PromptInputAttachments>
                        {(attachment) => <PromptInputAttachment data={attachment} />}
                      </PromptInputAttachments>
                    </PromptInputHeader>
                    <PromptInputBody>
                      <PromptInputTextarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={
                          !hasApiKey
                            ? "Please set your API key to start chatting..."
                            : status === "streaming"
                              ? "Please wait for the response to complete..."
                              : "Type your message..."
                        }
                        disabled={!hasApiKey || status === "streaming"}
                      />
                    </PromptInputBody>
                    <PromptInputFooter>
                      <PromptInputTools>
                        <PromptInputModelSelect
                          value={selectedModel}
                          onValueChange={setSelectedModel}
                        >
                          <PromptInputModelSelectTrigger>
                            <PromptInputModelSelectValue />
                          </PromptInputModelSelectTrigger>
                          <PromptInputModelSelectContent>
                            {AI_MODELS.map((model) => (
                              <PromptInputModelSelectItem
                                key={model.id}
                                value={model.id}
                              >
                                {model.name}
                              </PromptInputModelSelectItem>
                            ))}
                          </PromptInputModelSelectContent>
                        </PromptInputModelSelect>
                      </PromptInputTools>
                      <PromptInputSubmit
                        disabled={!inputValue.trim() || !hasApiKey || status === "streaming"}
                        status={status}
                      />
                    </PromptInputFooter>
                  </PromptInput>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
