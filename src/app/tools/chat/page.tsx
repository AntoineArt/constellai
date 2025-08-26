"use client";

import { useState } from "react";
import { Send, Mic, Paperclip, StopCircle } from "lucide-react";

import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiKey } from "@/hooks/use-api-key";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const models = [
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  { id: "gemini-pro", name: "Gemini Pro" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4-turbo");
  const [isStreaming, setIsStreaming] = useState(false);
  const { hasApiKey } = useApiKey();

  const handleSend = async () => {
    if (!input.trim() || !hasApiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a mock response using ${models.find((m) => m.id === selectedModel)?.name}. In a real implementation, this would be connected to your Vercel AI Gateway to process the message: "${userMessage.content}"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 1500);
  };

  const toolActions = (
    <div className="flex items-center gap-2">
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isStreaming && (
        <Button size="sm" variant="outline">
          <StopCircle className="h-4 w-4" />
          Stop
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="AI Chat" actions={toolActions} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={
                          message.role === "user" ? "secondary" : "default"
                        }
                        className="text-xs"
                      >
                        {message.role === "user" ? "You" : "AI"}
                      </Badge>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <Card className="max-w-[80%]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        AI
                      </Badge>
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            {!hasApiKey ? (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-destructive">
                    Please set your API key in the top bar to start chatting
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="min-h-[44px] resize-none pr-20"
                    disabled={isStreaming}
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="h-[44px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
