"use client";

import { useState, useCallback } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputHeader,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from "@/components/ai-elements/branch";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
} from "@/components/ai-elements/sources";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Loader } from "@/components/ai-elements/loader";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AI_MODELS } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Code, Image as ImageIcon } from "lucide-react";
import type { ChatStatus } from "ai";
import { nanoid } from "nanoid";

interface MessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
  versions?: { id: string; content: string }[];
  sources?: { href: string; title: string }[];
  reasoning?: { content: string; duration: number };
}

const mockSuggestions = [
  "Explain quantum computing",
  "Write a React component",
  "Best practices for TypeScript",
  "How to optimize database queries",
];

export default function AIElementsShowcasePage() {
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: nanoid(),
      role: "assistant",
      content: `# Welcome to AI Elements Showcase!

This page demonstrates all the powerful components from the @ai-elements registry:

- **Conversation & Message Components** with variants
- **PromptInput** with file attachments
- **Branch** for message versions
- **Reasoning** for showing AI thought process
- **Sources** for citations
- **CodeBlock** with syntax highlighting
- **Suggestions** for quick prompts
- And more!

Try sending a message or clicking a suggestion below!`,
    },
  ]);
  const [variant, setVariant] = useState<"contained" | "flat">("contained");

  const handleSubmit = useCallback(
    async (message: PromptInputMessage, event: React.FormEvent) => {
      event.preventDefault();
      const text = message.text?.trim();
      if (!text && !message.files?.length) return;

      setStatus("submitted");

      // Add user message
      const userMessage: MessageType = {
        id: nanoid(),
        role: "user",
        content: text || "[Sent with attachments]",
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      // Simulate AI response
      setTimeout(() => {
        setStatus("streaming");
        const assistantMessage: MessageType = {
          id: nanoid(),
          role: "assistant",
          content: `Great question! Here's a detailed response that demonstrates various AI Elements features.

## Code Example

\`\`\`typescript
// Example using the new AI Elements
import { Message, MessageContent } from "@/components/ai-elements/message";

export function ChatMessage({ content }: { content: string }) {
  return (
    <Message from="assistant">
      <MessageContent variant="flat">
        {content}
      </MessageContent>
    </Message>
  );
}
\`\`\`

This is a mock response showing how the components work together. You can attach images, use different message variants, and explore all the features!`,
          versions: [
            {
              id: nanoid(),
              content: `Great question! Here's a detailed response that demonstrates various AI Elements features.

## Code Example

\`\`\`typescript
// Example using the new AI Elements
import { Message, MessageContent } from "@/components/ai-elements/message";

export function ChatMessage({ content }: { content: string }) {
  return (
    <Message from="assistant">
      <MessageContent variant="flat">
        {content}
      </MessageContent>
    </Message>
  );
}
\`\`\`

This is a mock response showing how the components work together. You can attach images, use different message variants, and explore all the features!`,
            },
            {
              id: nanoid(),
              content: `Here's an alternative response demonstrating **Branch** functionality!

When you have multiple versions of a message, users can navigate between them using the branch selector below.

\`\`\`typescript
// Alternative implementation
const MyComponent = () => {
  return <div>Alternative approach</div>;
};
\`\`\`

Try switching between versions using the controls!`,
            },
          ],
          sources: [
            {
              href: "https://ui.shadcn.com",
              title: "shadcn/ui Documentation",
            },
            {
              href: "https://registry.ai-sdk.dev",
              title: "AI Elements Registry",
            },
          ],
          reasoning: {
            content:
              "To provide the best answer, I'm analyzing the question and considering various implementation approaches. I'll demonstrate code examples and best practices while showcasing the AI Elements components.",
            duration: 3,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStatus(undefined);
      }, 1500);
    },
    []
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);

  return (
    <div className="h-dvh flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-xl">AI Elements Showcase</h1>
                <p className="text-muted-foreground text-sm">
                  Explore all the @ai-elements components
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">New Components</Badge>
              <Badge variant="secondary">Interactive Demo</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="demo" className="h-full flex flex-col">
          <div className="border-b">
            <div className="container mx-auto px-4">
              <TabsList className="h-12">
                <TabsTrigger value="demo" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Live Demo
                </TabsTrigger>
                <TabsTrigger value="features" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="variants" className="gap-2">
                  <Code className="h-4 w-4" />
                  Variants
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="demo" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex flex-col">
              <Conversation className="flex-1">
                <ConversationContent className="max-w-4xl mx-auto">
                  {messages.length === 0 && (
                    <ConversationEmptyState
                      title="Welcome to AI Elements"
                      description="Send a message to see the components in action"
                      icon={
                        <div className="rounded-full bg-primary/10 p-4">
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                      }
                    />
                  )}

                  {messages.map((message) => (
                    <Branch
                      key={message.id}
                      defaultBranch={0}
                    >
                      <BranchMessages>
                        {message.versions ? (
                          message.versions.map((version) => (
                            <Message key={version.id} from={message.role}>
                              <div className="flex flex-col gap-2">
                                {message.sources && (
                                  <Sources>
                                    <SourcesTrigger
                                      count={message.sources.length}
                                    />
                                    <SourcesContent>
                                      {message.sources.map((source) => (
                                        <Source
                                          key={source.href}
                                          href={source.href}
                                          title={source.title}
                                        />
                                      ))}
                                    </SourcesContent>
                                  </Sources>
                                )}
                                {message.reasoning && (
                                  <Reasoning
                                    duration={message.reasoning.duration}
                                  >
                                    <ReasoningTrigger />
                                    <ReasoningContent>
                                      {message.reasoning.content}
                                    </ReasoningContent>
                                  </Reasoning>
                                )}
                                <MessageContent variant={variant}>
                                  <Response>{version.content}</Response>
                                </MessageContent>
                              </div>
                              {message.role === "assistant" && (
                                <MessageAvatar
                                  src="https://github.com/vercel.png"
                                  name="AI"
                                />
                              )}
                            </Message>
                          ))
                        ) : (
                          <Message key={message.id} from={message.role}>
                            <MessageContent variant={variant}>
                              <Response>{message.content}</Response>
                            </MessageContent>
                            {message.role === "assistant" && (
                              <MessageAvatar
                                src="https://github.com/vercel.png"
                                name="AI"
                              />
                            )}
                          </Message>
                        )}
                      </BranchMessages>
                      {message.versions && message.versions.length > 1 && (
                        <BranchSelector from={message.role}>
                          <BranchPrevious />
                          <BranchPage />
                          <BranchNext />
                        </BranchSelector>
                      )}
                    </Branch>
                  ))}

                  {status === "streaming" && (
                    <Message from="assistant">
                      <MessageContent>
                        <Loader />
                      </MessageContent>
                      <MessageAvatar
                        src="https://github.com/vercel.png"
                        name="AI"
                      />
                    </Message>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              {/* Input Area */}
              <div className="border-t bg-background p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  <Suggestions>
                    {mockSuggestions.map((suggestion) => (
                      <Suggestion
                        key={suggestion}
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                      />
                    ))}
                  </Suggestions>

                  <PromptInput
                    multiple
                    accept="image/*"
                    onSubmit={handleSubmit}
                  >
                    <PromptInputHeader>
                      <PromptInputAttachments>
                        {(attachment) => (
                          <PromptInputAttachment data={attachment} />
                        )}
                      </PromptInputAttachments>
                    </PromptInputHeader>
                    <PromptInputBody>
                      <PromptInputTextarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                      />
                    </PromptInputBody>
                    <PromptInputFooter>
                      <PromptInputTools>
                        <PromptInputActionMenu>
                          <PromptInputActionMenuTrigger />
                          <PromptInputActionMenuContent>
                            <PromptInputActionAddAttachments label="Attach images" />
                          </PromptInputActionMenuContent>
                        </PromptInputActionMenu>
                        <PromptInputModelSelect
                          value={selectedModel}
                          onValueChange={setSelectedModel}
                        >
                          <PromptInputModelSelectTrigger>
                            <PromptInputModelSelectValue />
                          </PromptInputModelSelectTrigger>
                          <PromptInputModelSelectContent>
                            {AI_MODELS.slice(0, 5).map((model) => (
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
                      <PromptInputSubmit status={status} />
                    </PromptInputFooter>
                  </PromptInput>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="flex-1 overflow-auto m-0">
            <div className="container mx-auto px-4 py-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Message Variants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">
                      Choose between contained (bubble) or flat message styles
                    </p>
                    <Message from="assistant">
                      <MessageContent variant="contained">
                        <p className="text-sm">Contained variant</p>
                      </MessageContent>
                    </Message>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      File Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Drag & drop, paste, or click to attach images and files
                      with preview support
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Syntax Highlighting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">
                      Beautiful code blocks with language detection
                    </p>
                    <CodeBlock code="const hello = 'world';" language="typescript" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Shimmer Effect
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Shimmer className="text-lg">Loading content...</Shimmer>
                    <p className="text-muted-foreground text-sm mt-3">
                      Smooth animated text shimmer for loading states
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Branch Navigation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Navigate between multiple versions of AI responses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sources & Citations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Collapsible source citations with clickable links
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variants" className="flex-1 overflow-auto m-0">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-2xl">Message Variants</h2>
                    <div className="flex gap-2">
                      <Button
                        variant={variant === "contained" ? "default" : "outline"}
                        onClick={() => setVariant("contained")}
                        size="sm"
                      >
                        Contained
                      </Button>
                      <Button
                        variant={variant === "flat" ? "default" : "outline"}
                        onClick={() => setVariant("flat")}
                        size="sm"
                      >
                        Flat
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Switch between message variants to see how they look. The{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      contained
                    </code>{" "}
                    variant shows messages in bubbles, while{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      flat
                    </code>{" "}
                    displays them without background for user messages.
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <Message from="user">
                      <MessageContent variant={variant}>
                        <p>This is a user message</p>
                      </MessageContent>
                    </Message>
                    <Message from="assistant">
                      <MessageContent variant={variant}>
                        <p>This is an assistant response</p>
                      </MessageContent>
                      <MessageAvatar
                        src="https://github.com/vercel.png"
                        name="AI"
                      />
                    </Message>
                  </CardContent>
                </Card>

                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">Usage</h3>
                  <CodeBlock
                    code={`<Message from="assistant">
  <MessageContent variant="${variant}">
    Your content here
  </MessageContent>
</Message>`}
                    language="tsx"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
